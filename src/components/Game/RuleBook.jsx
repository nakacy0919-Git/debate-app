import React from 'react';

export function RuleBook({ onClose }) {
  return (
    <div className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-slate-900 border-2 border-blue-500 p-6 md:p-8 rounded-2xl max-w-2xl w-full text-white shadow-[0_0_50px_rgba(59,130,246,0.5)]">
        <h2 className="text-2xl md:text-3xl font-black mb-6 text-cyan-400 border-b border-white/20 pb-4">HOW TO PLAY</h2>
        <div className="space-y-4 mb-8 text-sm md:text-base leading-relaxed text-slate-200">
          <p><strong>1. 構築 (Construct):</strong> 自分のスタンス（肯定/否定）に合わせて、AREA（主張→理由→具体例→結論）の順に正しいカードを選び、論理の塔を完成させましょう。</p>
          <p><strong>2. 尋問 (Cross Exam):</strong> 相手からの質問に対して、論理が破綻しない正しい返答カードを選びます。</p>
          <p><strong>3. 反論 (Rebuttal):</strong> 相手の攻撃的な意見に対して、的確な反論カードで防御します。</p>
          <p className="text-red-400 font-bold mt-4">※ 注意 ※<br/>間違ったカード（論点がズレているもの、感情的なもの）を選ぶとHPが減少します。HPが0になるとゲームオーバーです！</p>
        </div>
        <button onClick={onClose} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:scale-105 transition-transform py-3 rounded-xl font-black text-lg">
          CLOSE (閉じる)
        </button>
      </div>
    </div>
  );
}