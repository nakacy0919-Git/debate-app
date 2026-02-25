import { ShieldCheck, ArrowUpCircle, Lightbulb, MessageCircleQuestion, Shield, Gavel } from 'lucide-react';

export const MAX_HP = 100;
export const DAMAGE_BIG = 50; 
export const DAMAGE_SMALL = 25; 
export const DAMAGE_TICK = 12.5; 
export const TIME_LIMIT_SEC = 10; 

export const DIFFICULTIES = {
  easy:   { label: 'Easy',   fakeCount: 4, battleOptions: 4 },  
  medium: { label: 'Medium', fakeCount: 6, battleOptions: 5 }, 
  hard:   { label: 'Hard',   fakeCount: 8, battleOptions: 6 }, 
};

export const FLOWS = {
  area: ['assertion', 'reason', 'example', 'mini_conclusion'],
  logic_link: ['reason', 'example']
};

export const THEMES = {
  techno: { bg: 'bg-[#0f172a]', text: 'text-slate-100', headerBg: 'bg-[#1e293b]/90 border-b border-white/5', cardBg: 'bg-[#1e293b]' }
};

export const CARD_TYPES = {
  assertion: { label: "Assertion", labelJP: "主張 (A)", icon: ShieldCheck, color: "text-blue-200", border: "border-blue-500", bg: "bg-gradient-to-br from-blue-600 to-blue-800" },
  reason:    { label: "Reason",    labelJP: "理由 (R)",    icon: ArrowUpCircle, color: "text-green-200", border: "border-green-500", bg: "bg-gradient-to-br from-green-600 to-green-800" },
  example:   { label: "Example",   labelJP: "具体例 (E)", icon: Lightbulb,     color: "text-orange-200", border: "border-orange-500", bg: "bg-gradient-to-br from-orange-600 to-orange-800" },
  mini_conclusion:{ label: "Summary",labelJP: "再主張 (A)", icon: ShieldCheck, color: "text-purple-200", border: "border-purple-500", bg: "bg-gradient-to-br from-purple-600 to-purple-800" },
  answer:    { label: "Answer",    labelJP: "回答", icon: MessageCircleQuestion, color: "text-teal-200", border: "border-teal-500", bg: "bg-gradient-to-br from-teal-600 to-teal-800" },
  defense:   { label: "Rebuttal",  labelJP: "再反論", icon: Shield, color: "text-indigo-200", border: "border-indigo-500", bg: "bg-gradient-to-br from-indigo-600 to-indigo-800" },
  closing:   { label: "Closing",   labelJP: "最終弁論", icon: Gavel, color: "text-pink-200", border: "border-pink-500", bg: "bg-gradient-to-br from-pink-600 to-pink-800" },
};

export const FONT_SIZES = { normal: 'text-base', large: 'text-xl', xlarge: 'text-2xl' };