import { describe, expect, it } from 'vitest';
import { assessAudit, ADVISORY_URL } from '../scripts/security-audit.mjs';

const make = () => ({
  audit: {
    vulnerabilities: {
      picomatch: {
        name: 'picomatch',
        severity: 'high',
        via: [{
          name: 'picomatch', url: ADVISORY_URL, severity: 'high',
          title: 'ReDoS through single-branch repeated extglobs',
        }],
        nodes: ['node_modules/picomatch', 'node_modules/micromatch/node_modules/picomatch'],
      },
      micromatch: {
        name: 'micromatch', severity: 'high',
        via: ['picomatch'], nodes: ['node_modules/micromatch'],
      },
      tailwindcss: {
        name: 'tailwindcss', severity: 'high',
        via: ['micromatch'], nodes: ['node_modules/tailwindcss'],
      },
    },
    metadata: { vulnerabilities: { info: 0, low: 0, moderate: 0, high: 3, critical: 0, total: 3 } },
  },
  lock: {
    packages: {
      'node_modules/picomatch': { dev: true, version: '4.0.7' },
      'node_modules/micromatch/node_modules/picomatch': { dev: true, version: '2.3.2' },
      'node_modules/micromatch': { dev: true },
      'node_modules/tailwindcss': { dev: true },
    },
  },
});
const date = new Date('2026-11-18T00:00:00Z');
describe('full dependency security audit gate', () => {
  it('passes a genuine clean audit', () => {
    const { audit, lock } = make();
    audit.vulnerabilities = {};
    audit.metadata.vulnerabilities = { info: 0, low: 0, moderate: 0, high: 0, critical: 0, total: 0 };
    expect(assessAudit(audit, lock, date)).toMatchObject({ ok: true, exception: false });
  });
  it('reports the single known unpatched development-only advisory, not a clean audit', () => {
    const { audit, lock } = make();
    expect(assessAudit(audit, lock, date)).toMatchObject({ ok: true, exception: true, findings: 3 });
  });
  it('fails if any dependency on the affected chain is used in production', () => {
    const { audit, lock } = make();
    lock.packages['node_modules/micromatch'].dev = false;
    expect(assessAudit(audit, lock, date).ok).toBe(false);
  });
  it('fails if a new advisory is introduced for picomatch itself', () => {
    const { audit, lock } = make();
    audit.vulnerabilities.picomatch.via.push({
      name: 'picomatch', url: 'https://github.com/advisories/GHSA-other', severity: 'high',
    });
    expect(assessAudit(audit, lock, date).ok).toBe(false);
  });
  it('fails on a new unrelated critical advisory', () => {
    const { audit, lock } = make();
    audit.vulnerabilities.dangerous = {
      name: 'dangerous', severity: 'critical',
      via: [{ name: 'dangerous', url: 'https://github.com/advisories/GHSA-new', severity: 'critical' }],
      nodes: ['node_modules/dangerous'],
    };
    audit.metadata.vulnerabilities.high = 3;
    audit.metadata.vulnerabilities.critical = 1;
    audit.metadata.vulnerabilities.total = 4;
    lock.packages['node_modules/dangerous'] = { dev: true };
    expect(assessAudit(audit, lock, date).ok).toBe(false);
  });
  it('fails when the approved advisory no longer has correct source fields', () => {
    const { audit, lock } = make();
    delete audit.vulnerabilities.picomatch.via[0].url;
    expect(assessAudit(audit, lock, date).ok).toBe(false);
  });
  it('fails when a transitive vulnerability is missing from the lock file', () => {
    const { audit, lock } = make();
    delete lock.packages['node_modules/tailwindcss'];
    expect(assessAudit(audit, lock, date).ok).toBe(false);
  });
  it('fails when npm audit returns incomplete or contradictory counts', () => {
    const { audit, lock } = make();
    audit.metadata.vulnerabilities.total = 5;
    expect(assessAudit(audit, lock, date).ok).toBe(false);
  });
  it('fails closed after the exception expiration date', () => {
    const { audit, lock } = make();
    expect(assessAudit(audit, lock, new Date('2026-12-18T00:00:00Z')).ok).toBe(false);
  });
  it('fails on malformed audit data', () => {
    const { lock } = make();
    expect(assessAudit({}, lock, date).ok).toBe(false);
  });
});
