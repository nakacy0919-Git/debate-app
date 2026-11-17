/**
 * Dependency audit gate for an upstream advisory without a patched npm release.
 *
 * This does NOT resolve GHSA-fc5q-39xc-vjpf. It allows only that exact advisory,
 * and only when every affected package is marked dev-only in package-lock.json.
 * All other audit findings fail CI. Remove this temporary exception after a fix.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const ADVISORY_URL = 'https://github.com/advisories/GHSA-fc5q-39xc-vjpf';
export const EXCEPTION_EXPIRES_UTC = '2026-12-18T00:00:00Z';
const MAX_AUDIT_SIZE = 12 * 1024 * 1024;

function allAffectedPathsAreDevOnly(vulnerability, lock) {
  if (!Array.isArray(vulnerability.nodes) || vulnerability.nodes.length === 0) return false;
  return vulnerability.nodes.every(path => (
    typeof path === 'string' && lock.packages?.[path]?.dev === true
  ));
}

export function assessAudit(audit, lock, now = new Date()) {
  const findings = audit?.vulnerabilities;
  if (!findings || typeof findings !== 'object' || Array.isArray(findings)) {
    return { ok: false, exception: false, reasons: ['Missing or invalid npm audit vulnerabilities data'] };
  }

  const names = Object.keys(findings);
  if (names.length === 0) {
    return { ok: true, exception: false, reasons: [], findings: 0 };
  }

  const reasons = [];
  if (!(now instanceof Date) || Number.isNaN(now.getTime()) || now >= new Date(EXCEPTION_EXPIRES_UTC)) {
    reasons.push('Temporary exception expired; reassess advisory and patched versions');
  }
  const advisoryRoot = findings.picomatch;
  if (!advisoryRoot) reasons.push('Unexpected advisory with no known picomatch root');

  const visited = new Map();
  function isAllowedChain(name, chain = new Set()) {
    if (visited.has(name)) return visited.get(name);
    const node = findings[name];
    if (!node || chain.has(name) || !Array.isArray(node.via) || node.via.length === 0) return false;
    if (!allAffectedPathsAreDevOnly(node, lock)) return false;
    chain.add(name);
    let accepted = true;
    for (const via of node.via) {
      if (typeof via === 'string') {
        if (!isAllowedChain(via, chain)) accepted = false;
      } else if (
        !via || typeof via !== 'object' ||
        via.name !== 'picomatch' ||
        via.url !== ADVISORY_URL ||
        via.severity !== 'high' ||
        name !== 'picomatch'
      ) {
        accepted = false;
      }
    }
    chain.delete(name);
    visited.set(name, accepted);
    return accepted;
  }

  for (const name of names) {
    if (!isAllowedChain(name)) {
      reasons.push(`Unapproved, production, or malformed vulnerability chain: ${name}`);
    }
  }

  const countBySeverity = audit.metadata?.vulnerabilities;
  if (!countBySeverity || typeof countBySeverity !== 'object') {
    reasons.push('Missing npm audit severity summary');
  } else {
    const levels = ['info', 'low', 'moderate', 'high', 'critical'];
    const total = levels.reduce((sum, level) => sum + (Number.isInteger(countBySeverity[level]) ? countBySeverity[level] : 0), 0);
    if (total !== names.length || countBySeverity.total !== names.length) {
      reasons.push('npm audit severity summary does not match finding count');
    }
  }

  return { ok: reasons.length === 0, exception: reasons.length === 0, reasons, findings: names.length };
}

async function main() {
  const lock = JSON.parse(readFileSync('package-lock.json', 'utf8'));
  const run = spawnSync(process.platform === 'win32' ? 'npm.cmd' : 'npm',
    ['audit', '--json'], { encoding: 'utf8', timeout: 120000, maxBuffer: MAX_AUDIT_SIZE });
  if (run.error || run.signal || !run.stdout?.trim()) {
    throw new Error(`npm audit execution failed: ${run.error?.message || run.stderr || run.signal || 'empty output'}`);
  }
  let audit;
  try {
    audit = JSON.parse(run.stdout);
  } catch {
    throw new Error('npm audit returned unreadable JSON (audit could not be verified)');
  }
  if (run.status !== 0 && run.status !== 1) {
    throw new Error(`npm audit returned unexpected status ${run.status}`);
  }
  const status = assessAudit(audit, lock);
  if (!status.ok) {
    console.error('AUDIT FAILED: unexpected or expired dependency security risk.');
    for (const reason of status.reasons) console.error(' - ' + reason);
    process.exitCode = 1;
    return;
  }
  if (status.exception) {
    console.warn(`KNOWN UNPATCHED DEVELOPMENT DEPENDENCY RISK: ${ADVISORY_URL}`);
    console.warn(`Risk is NOT fixed. ${status.findings} transitive dev-only audit findings; exception expires ${EXCEPTION_EXPIRES_UTC}.`);
    console.warn('Other advisories, production dependencies, and new risks will fail this job.');
  } else {
    console.log('Full npm audit: zero reported dependency vulnerabilities.');
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    const { appendFileSync } = await import('node:fs');
    appendFileSync(process.env.GITHUB_STEP_SUMMARY,
      status.exception
        ? `⚠️ **Known unpatched dev-only dependency advisory**: [GHSA-fc5q-39xc-vjpf](${ADVISORY_URL}). ${status.findings} findings; not resolved. Exception expires ${EXCEPTION_EXPIRES_UTC}. All other findings are blocked.\\n`
        : '✅ Full dependency audit: no vulnerabilities reported.\\n');
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
