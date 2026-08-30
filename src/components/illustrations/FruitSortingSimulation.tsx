import React, { useState } from 'react';
import { Crown, HelpCircle, Sparkles, Scale, RotateCcw } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface Basket {
  id: string;
  name: string;
  apples: number;
  bananas: number;
  pears: number;
  color: string;
  accent: string;
}

const INITIAL_BASKETS: Basket[] = [
  { id: 'A', name: '果篮 A', apples: 3, bananas: 2, pears: 3, color: 'bg-rose-50 border-rose-300', accent: 'text-rose-700' },
  { id: 'B', name: '果篮 B', apples: 5, bananas: 1, pears: 2, color: 'bg-amber-50 border-amber-300', accent: 'text-amber-700' },
  { id: 'C', name: '果篮 C', apples: 2, bananas: 3, pears: 3, color: 'bg-blue-50 border-blue-300', accent: 'text-blue-700' },
  { id: 'D', name: '果篮 D', apples: 3, bananas: 4, pears: 1, color: 'bg-emerald-50 border-emerald-300', accent: 'text-emerald-700' },
  { id: 'E', name: '果篮 E', apples: 1, bananas: 5, pears: 2, color: 'bg-purple-50 border-purple-300', accent: 'text-purple-700' },
];

export const FruitSortingSimulation: React.FC = () => {
  const [selectedBaskets, setSelectedBaskets] = useState<string[]>([]);

  const handleSelectBasket = (id: string) => {
    sounds.playTap();
    if (selectedBaskets.includes(id)) {
      setSelectedBaskets((prev) => prev.filter((b) => b !== id));
    } else {
      if (selectedBaskets.length >= 2) {
        setSelectedBaskets([selectedBaskets[1], id]);
      } else {
        setSelectedBaskets((prev) => [...prev, id]);
      }
    }
  };

  const handleClearCompare = () => {
    sounds.playTap();
    setSelectedBaskets([]);
  };

  // If 2 baskets selected, provide interactive comparison hint
  const basket1 = INITIAL_BASKETS.find((b) => b.id === selectedBaskets[0]);
  const basket2 = INITIAL_BASKETS.find((b) => b.id === selectedBaskets[1]);

  return (
    <div className="w-full max-w-[580px] flex flex-col items-center justify-center select-none mx-auto">
      {/* Clue Badge Top Row */}
      <div className="flex items-center justify-between w-full mb-2 px-1">
        <div className="flex items-center gap-1.5 bg-rose-100 text-rose-950 px-3 py-1 rounded-full text-xs font-black border border-rose-300 shadow-2xs">
          <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>接见规则：① 苹果 🍎 最多优先 ➔ ② 平局比香蕉 🍌 谁多</span>
        </div>

        {selectedBaskets.length > 0 && (
          <button
            onClick={handleClearCompare}
            className="flex items-center gap-1 text-[11px] font-black text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded-full cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>取消对比</span>
          </button>
        )}
      </div>

      {/* Main Interactive Stage Box */}
      <div className="w-full bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 rounded-3xl p-3.5 sm:p-4 border-3 border-amber-200 shadow-[0_6px_0_0_#fcd34d] flex flex-col items-center gap-2.5">
        
        {/* Step Guide Banner */}
        <div className="w-full bg-white px-3 py-1.5 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
          <span className="font-black text-slate-800 flex items-center gap-1.5">
            📦 5 位小动物带来的水果篮（点击任意两个果篮可自由比对）
          </span>
          <span className="font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md text-[10px]">
            待排序
          </span>
        </div>

        {/* 5 Fruit Baskets Cards Row */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full">
          {INITIAL_BASKETS.map((b) => {
            const isSelected = selectedBaskets.includes(b.id);

            return (
              <div
                key={b.id}
                onClick={() => handleSelectBasket(b.id)}
                className={`flex flex-col items-center p-2 rounded-2xl border-2 transition-all cursor-pointer relative ${b.color} ${
                  isSelected ? 'ring-3 ring-amber-500 scale-102 shadow-md bg-white' : 'hover:scale-101'
                }`}
              >
                {/* Basket Name */}
                <div className={`text-[11px] font-black ${b.accent} mb-1 flex items-center gap-0.5`}>
                  <span>{b.name}</span>
                </div>

                {/* Apples Section */}
                <div className="w-full py-1 px-1 rounded-xl mb-1 flex flex-col items-center justify-center bg-rose-100/70 border border-rose-200">
                  <div className="flex items-center justify-center flex-wrap gap-0.5 min-h-[16px]">
                    {'🍎'.repeat(b.apples)}
                  </div>
                  <span className="text-[10px] font-black text-rose-900 mt-0.5">
                    {b.apples} 苹果
                  </span>
                </div>

                {/* Bananas Section */}
                <div className="w-full py-1 px-1 rounded-xl flex flex-col items-center justify-center bg-amber-100/70 border border-amber-200">
                  <div className="flex items-center justify-center flex-wrap gap-0.5 min-h-[16px]">
                    {'🍌'.repeat(b.bananas)}
                  </div>
                  <span className="text-[10px] font-black text-amber-900 mt-0.5">
                    {b.bananas} 香蕉
                  </span>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-2 -right-1 bg-amber-500 text-white font-black text-[9px] w-4 h-4 rounded-full flex items-center justify-center shadow-2xs">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Dynamic Comparison / Challenge Bar */}
        <div className="w-full bg-gradient-to-r from-rose-500 via-amber-500 to-emerald-600 text-white px-4 py-2.5 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-xs sm:text-sm font-black">
            <Scale className="w-4 h-4 text-yellow-200" />
            {basket1 && basket2 ? (
              <span>
                比对【{basket1.name} vs {basket2.name}】：
                {basket1.apples !== basket2.apples
                  ? `苹果数量 (${basket1.apples} vs ${basket2.apples}) 不同，先看苹果！`
                  : `苹果数量相同 (${basket1.apples})，对比香蕉 (${basket1.bananas} vs ${basket2.bananas})！`}
              </span>
            ) : (
              <span>👑 排序挑战：推导出 5 个果篮的最终接见顺序 = ❓</span>
            )}
          </div>
          <div className="text-xs font-black bg-white/25 px-2.5 py-0.5 rounded-full shadow-2xs shrink-0 ml-2">
            请在右侧选择答案 🤔
          </div>
        </div>

        {/* Interactive Guidance */}
        <div className="text-[10px] font-bold text-slate-500 bg-slate-100/80 py-1 px-3 rounded-lg text-center w-full flex items-center justify-center gap-1">
          <HelpCircle className="w-3 h-3 text-slate-400" />
          <span>先统计各果篮的苹果数；当遇到苹果数量相同时，看谁的香蕉更多进行决胜！</span>
        </div>
      </div>
    </div>
  );
};
