import React, { useState } from 'react';
import { Crown, Sparkles, Scale, RotateCcw, Eye, Search, Layers } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface AnimalBasket {
  id: string;
  animal: string;
  avatar: string;
  name: string;
  apples: number;
  bananas: number;
  pears: number;
  themeColor: string;
  borderColor: string;
  badgeBg: string;
}

const BASKETS_DATA: AnimalBasket[] = [
  {
    id: 'A',
    animal: '小熊',
    avatar: '🐻',
    name: '果篮 A (小熊)',
    apples: 3,
    bananas: 2,
    pears: 3,
    themeColor: 'from-amber-500/20 to-orange-500/10',
    borderColor: 'border-amber-400',
    badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'B',
    animal: '小狮子',
    avatar: '🦁',
    name: '果篮 B (小狮子)',
    apples: 5,
    bananas: 1,
    pears: 2,
    themeColor: 'from-red-500/20 to-amber-500/10',
    borderColor: 'border-red-400',
    badgeBg: 'bg-rose-100 text-rose-900 border-rose-300',
  },
  {
    id: 'C',
    animal: '小狐狸',
    avatar: '🦊',
    name: '果篮 C (小狐狸)',
    apples: 2,
    bananas: 3,
    pears: 3,
    themeColor: 'from-orange-500/20 to-amber-500/10',
    borderColor: 'border-orange-400',
    badgeBg: 'bg-orange-100 text-orange-900 border-orange-300',
  },
  {
    id: 'D',
    animal: '小熊猫',
    avatar: '🐼',
    name: '果篮 D (小熊猫)',
    apples: 3,
    bananas: 4,
    pears: 1,
    themeColor: 'from-emerald-500/20 to-teal-500/10',
    borderColor: 'border-emerald-400',
    badgeBg: 'bg-emerald-100 text-emerald-900 border-emerald-300',
  },
  {
    id: 'E',
    animal: '小兔子',
    avatar: '🐰',
    name: '果篮 E (小兔子)',
    apples: 1,
    bananas: 5,
    pears: 2,
    themeColor: 'from-pink-500/20 to-purple-500/10',
    borderColor: 'border-pink-400',
    badgeBg: 'bg-pink-100 text-pink-900 border-pink-300',
  },
];

type LensMode = 'all' | 'compare' | 'apples' | 'bananas';

export const FruitSortingSimulation: React.FC = () => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeLens, setActiveLens] = useState<LensMode>('all');

  const handleSelectBasket = (id: string) => {
    sounds.playTap();
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedIds.length >= 2) {
        setSelectedIds([selectedIds[1], id]);
      } else {
        setSelectedIds((prev) => [...prev, id]);
      }
    }
  };

  const handleReset = () => {
    sounds.playTap();
    setSelectedIds([]);
    setActiveLens('all');
  };

  const b1 = BASKETS_DATA.find((b) => b.id === selectedIds[0]);
  const b2 = BASKETS_DATA.find((b) => b.id === selectedIds[1]);

  // Scale tilt calculation
  let scaleTilt = 0; // -15 (left heavy), 0 (equal), 15 (right heavy)
  let compareVerdict = '';
  let decisiveReason = '';

  if (b1 && b2) {
    if (b1.apples > b2.apples) {
      scaleTilt = -12;
      compareVerdict = `👑 【${b1.name}】 优先接见！`;
      decisiveReason = `第一主键决胜：苹果数量 ${b1.apples} > ${b2.apples}，无需比对香蕉。`;
    } else if (b1.apples < b2.apples) {
      scaleTilt = 12;
      compareVerdict = `👑 【${b2.name}】 优先接见！`;
      decisiveReason = `第一主键决胜：苹果数量 ${b2.apples} > ${b1.apples}，无需比对香蕉。`;
    } else {
      // Tie in apples! Check bananas
      if (b1.bananas > b2.bananas) {
        scaleTilt = -12;
        compareVerdict = `👑 【${b1.name}】 优先接见！`;
        decisiveReason = `平局激活第二主键：苹果数量相同 (${b1.apples} = ${b2.apples}) ➔ 香蕉决胜 ${b1.bananas} > ${b2.bananas}！`;
      } else if (b1.bananas < b2.bananas) {
        scaleTilt = 12;
        compareVerdict = `👑 【${b2.name}】 优先接见！`;
        decisiveReason = `平局激活第二主键：苹果数量相同 (${b1.apples} = ${b2.apples}) ➔ 香蕉决胜 ${b2.bananas} > ${b1.bananas}！`;
      } else {
        scaleTilt = 0;
        compareVerdict = `🤝 【${b1.name}】 与 【${b2.name}】 完全相同`;
        decisiveReason = '苹果与香蕉数量完全一致。';
      }
    }
  }

  return (
    <div className="w-full h-full flex flex-col justify-between select-none p-1 sm:p-2">
      
      {/* 1. Top Throne & Queen's Royal Rule Banner */}
      <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-3.5 py-1.5 rounded-2xl shadow-sm border border-amber-300 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-200 fill-yellow-300 animate-bounce" />
          <div className="text-xs sm:text-sm font-black flex items-center gap-2">
            <span>女王接见法则：</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg">① 苹果 🍎 最多优先</span>
            <span className="text-yellow-200">➔</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-lg">② 平局比香蕉 🍌 谁多</span>
          </div>
        </div>

        {/* Interactive Lens Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button
            onClick={() => {
              sounds.playTap();
              setActiveLens('all');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeLens === 'all'
                ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
            title="查看完整水果篮"
          >
            <Layers className="w-3 h-3 inline mr-0.5" />
            <span>全景</span>
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveLens('apples');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeLens === 'apples'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-700 hover:bg-rose-50'
            }`}
            title="聚焦第一主键：苹果数量"
          >
            <span>🍎 苹果透视</span>
          </button>
          <button
            onClick={() => {
              sounds.playTap();
              setActiveLens('bananas');
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              activeLens === 'bananas'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
            title="聚焦平局主键：香蕉数量"
          >
            <span>🍌 香蕉透视</span>
          </button>
        </div>
      </div>

      {/* 2. Middle Interactive Stage: 5 Cute Animals with 3D Baskets */}
      <div className="flex-1 flex flex-col justify-center min-h-0 py-1">
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 w-full">
          {BASKETS_DATA.map((b) => {
            const isSelected = selectedIds.includes(b.id);
            const isAppleFocus = activeLens === 'apples';
            const isBananaFocus = activeLens === 'bananas';

            return (
              <div
                key={b.id}
                onClick={() => handleSelectBasket(b.id)}
                className={`relative flex flex-col items-center justify-between p-2.5 rounded-3xl border-3 transition-all duration-200 cursor-pointer bg-gradient-to-b ${b.themeColor} ${
                  isSelected
                    ? `${b.borderColor} ring-4 ring-amber-400/50 scale-103 shadow-lg bg-white`
                    : `${b.borderColor}/40 bg-white/90 hover:scale-101 hover:bg-white`
                }`}
              >
                {/* Animal Avatar & Name Badge */}
                <div className="flex flex-col items-center gap-1 w-full">
                  <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white shadow-xs border border-slate-200 flex items-center justify-center text-2xl sm:text-3xl hover:rotate-6 transition-transform">
                    {b.avatar}
                  </div>
                  <div className={`px-2 py-0.5 rounded-full text-[11px] sm:text-xs font-black border ${b.badgeBg} shadow-2xs`}>
                    {b.id} · {b.animal}
                  </div>
                </div>

                {/* Fruit Inventory Visualizer */}
                <div className="w-full space-y-1 my-1.5">
                  {/* Apple Bar */}
                  <div
                    className={`p-1 rounded-xl flex items-center justify-between transition-all border ${
                      isAppleFocus
                        ? 'bg-rose-500 text-white border-rose-600 ring-2 ring-rose-300 font-black scale-105'
                        : 'bg-rose-50 text-rose-950 border-rose-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {Array.from({ length: b.apples }).map((_, i) => (
                        <span key={i} className="text-xs sm:text-sm animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                          🍎
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] sm:text-xs font-black shrink-0 ml-1">
                      {b.apples} 苹果
                    </span>
                  </div>

                  {/* Banana Bar */}
                  <div
                    className={`p-1 rounded-xl flex items-center justify-between transition-all border ${
                      isBananaFocus
                        ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300 font-black scale-105'
                        : 'bg-amber-50 text-amber-950 border-amber-200 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 flex-wrap">
                      {Array.from({ length: b.bananas }).map((_, i) => (
                        <span key={i} className="text-xs sm:text-sm animate-pulse" style={{ animationDelay: `${i * 100}ms` }}>
                          🍌
                        </span>
                      ))}
                    </div>
                    <span className="text-[11px] sm:text-xs font-black shrink-0 ml-1">
                      {b.bananas} 香蕉
                    </span>
                  </div>

                  {/* Pear Bar */}
                  {activeLens === 'all' && (
                    <div className="p-1 rounded-xl flex items-center justify-between bg-emerald-50 text-emerald-950 border border-emerald-200 text-[10px] sm:text-[11px] font-bold">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: b.pears }).map((_, i) => (
                          <span key={i} className="text-xs">🍐</span>
                        ))}
                      </div>
                      <span className="shrink-0">{b.pears} 梨</span>
                    </div>
                  )}
                </div>

                {/* Selection Tag */}
                <div className="w-full text-center">
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full transition-all ${
                      isSelected
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? '已选入比对台 ✓' : '点击比对 🔍'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Magic Scale Comparison Arena */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-3 sm:p-3.5 rounded-2xl border-2 border-cyan-400/40 shadow-md shrink-0 mt-1">
        {b1 && b2 ? (
          <div className="flex flex-col gap-2">
            {/* Verdict Header */}
            <div className="flex items-center justify-between border-b border-slate-700/80 pb-1.5">
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '4s' }} />
                <span className="text-xs sm:text-sm font-black text-amber-300">
                  {compareVerdict}
                </span>
              </div>
              <button
                onClick={handleReset}
                className="text-[11px] font-black text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-0.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>清空比对</span>
              </button>
            </div>

            {/* Dynamic Physical Balance Scale Visualizer */}
            <div className="flex items-center justify-between gap-3 text-xs bg-slate-950/60 p-2.5 rounded-xl border border-cyan-500/20">
              {/* Left Pan */}
              <div className={`flex-1 p-2 rounded-xl border transition-all text-center ${
                scaleTilt < 0
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 shadow-xs'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <div className="font-black text-sm">{b1.avatar} {b1.name}</div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  🍎 {b1.apples} 苹果 · 🍌 {b1.bananas} 香蕉
                </div>
              </div>

              {/* Physical Pivot / Beam */}
              <div className="flex flex-col items-center shrink-0 px-2">
                <span className="text-xs font-black text-cyan-400">⚖️ 优先度</span>
                <span className="text-base font-black text-amber-400">
                  {scaleTilt < 0 ? '◀ 优先' : scaleTilt > 0 ? '优先 ▶' : '＝ 平局'}
                </span>
              </div>

              {/* Right Pan */}
              <div className={`flex-1 p-2 rounded-xl border transition-all text-center ${
                scaleTilt > 0
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 ring-2 ring-emerald-400/50 shadow-xs'
                  : 'bg-slate-900 border-slate-700 text-slate-300'
              }`}>
                <div className="font-black text-sm">{b2.avatar} {b2.name}</div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  🍎 {b2.apples} 苹果 · 🍌 {b2.bananas} 香蕉
                </div>
              </div>
            </div>

            {/* Decisive Logic Explanation */}
            <div className="text-xs text-cyan-200 font-medium leading-relaxed bg-cyan-950/40 p-2 rounded-lg border border-cyan-500/30">
              💡 <span className="font-bold text-white">{decisiveReason}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              <div className="text-xs sm:text-sm font-black text-slate-100">
                👑 皇家接见顺序推导：<span className="text-amber-300 font-mono">1st ➔ 2nd ➔ 3rd ➔ 4th ➔ 5th = ❓</span>
              </div>
            </div>
            <div className="text-xs font-bold text-cyan-300 bg-cyan-950/80 px-3 py-1 rounded-full border border-cyan-500/40 shrink-0">
              点击上方任意两个动物进行天平比对 ⚖️
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
