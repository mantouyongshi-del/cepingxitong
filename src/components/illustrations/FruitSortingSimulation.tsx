import React, { useState, useEffect, useRef } from 'react';
import { Crown, Sparkles, Scale, RotateCcw, Play, Pause, FastForward, CheckCircle2, HelpCircle } from 'lucide-react';
import { sounds } from '../../utils/audio';

interface AnimalData {
  id: string;
  name: string;
  avatar: string;
  apples: number;
  bananas: number;
  pears: number;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  appleRank: number; // 1: B(5), 2: A(3)/D(3), 4: C(2), 5: E(1)
  finalRank: number; // 1: B, 2: D, 3: A, 4: C, 5: E
}

const ANIMALS: AnimalData[] = [
  {
    id: 'A',
    name: '小熊 A',
    avatar: '🐻',
    apples: 3,
    bananas: 2,
    pears: 3,
    bgGradient: 'from-amber-500 to-orange-600',
    borderColor: '#f59e0b',
    textColor: 'text-amber-300',
    appleRank: 2,
    finalRank: 3,
  },
  {
    id: 'B',
    name: '狮子 B',
    avatar: '🦁',
    apples: 5,
    bananas: 1,
    pears: 2,
    bgGradient: 'from-red-500 to-rose-600',
    borderColor: '#ef4444',
    textColor: 'text-rose-300',
    appleRank: 1,
    finalRank: 1,
  },
  {
    id: 'C',
    name: '狐狸 C',
    avatar: '🦊',
    apples: 2,
    bananas: 3,
    pears: 3,
    bgGradient: 'from-orange-500 to-amber-600',
    borderColor: '#f97316',
    textColor: 'text-orange-300',
    appleRank: 4,
    finalRank: 4,
  },
  {
    id: 'D',
    name: '熊猫 D',
    avatar: '🐼',
    apples: 3,
    bananas: 4,
    pears: 1,
    bgGradient: 'from-emerald-500 to-teal-600',
    borderColor: '#10b981',
    textColor: 'text-emerald-300',
    appleRank: 2,
    finalRank: 2,
  },
  {
    id: 'E',
    name: '白兔 E',
    avatar: '🐰',
    apples: 1,
    bananas: 5,
    pears: 2,
    bgGradient: 'from-purple-500 to-pink-600',
    borderColor: '#a855f7',
    textColor: 'text-purple-300',
    appleRank: 5,
    finalRank: 5,
  },
];

type SimulationStep = 'idle' | 'step1_apples' | 'step2_tiebreaker' | 'compare_custom';

export const FruitSortingSimulation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<SimulationStep>('idle');
  const [isPlayingAuto, setIsPlayingAuto] = useState<boolean>(false);
  const [selectedPair, setSelectedPair] = useState<string[]>(['A', 'D']);
  const [scaleAngle, setScaleAngle] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0); // 0 to 100
  const autoPlayTimerRef = useRef<number | null>(null);

  // Smooth physics oscillation loop for the scale balance
  useEffect(() => {
    let targetAngle = 0;
    const a1 = ANIMALS.find((a) => a.id === selectedPair[0]);
    const a2 = ANIMALS.find((a) => a.id === selectedPair[1]);

    if (a1 && a2) {
      if (a1.apples > a2.apples) {
        targetAngle = -14;
      } else if (a1.apples < a2.apples) {
        targetAngle = 14;
      } else {
        // Tie in apples! Bananas decide
        if (a1.bananas > a2.bananas) {
          targetAngle = -14;
        } else if (a1.bananas < a2.bananas) {
          targetAngle = 14;
        } else {
          targetAngle = 0;
        }
      }
    }

    let current = scaleAngle;
    let velocity = 0;
    let animId: number;

    const springLoop = () => {
      const spring = (targetAngle - current) * 0.12;
      velocity = (velocity + spring) * 0.78; // damping
      current += velocity;
      setScaleAngle(current);

      if (Math.abs(velocity) > 0.05 || Math.abs(targetAngle - current) > 0.1) {
        animId = requestAnimationFrame(springLoop);
      } else {
        setScaleAngle(targetAngle);
      }
    };

    animId = requestAnimationFrame(springLoop);
    return () => cancelAnimationFrame(animId);
  }, [selectedPair]);

  // Automated step-by-step playback controller
  useEffect(() => {
    if (!isPlayingAuto) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      return;
    }

    let stepIndex = 0;
    const sequence: SimulationStep[] = ['idle', 'step1_apples', 'step2_tiebreaker'];

    autoPlayTimerRef.current = window.setInterval(() => {
      stepIndex = (stepIndex + 1) % sequence.length;
      const nextStep = sequence[stepIndex];
      setCurrentStep(nextStep);
      sounds.playTap();

      if (nextStep === 'step1_apples') {
        setScanProgress(0);
      } else if (nextStep === 'step2_tiebreaker') {
        setSelectedPair(['A', 'D']);
      }
    }, 3800);

    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [isPlayingAuto]);

  // Scanning laser animation
  useEffect(() => {
    if (currentStep === 'step1_apples') {
      let p = 0;
      const timer = setInterval(() => {
        p += 2;
        if (p > 100) p = 100;
        setScanProgress(p);
      }, 30);
      return () => clearInterval(timer);
    }
  }, [currentStep]);

  const handleSelectAnimal = (id: string) => {
    sounds.playTap();
    setCurrentStep('compare_custom');
    if (selectedPair.includes(id)) {
      if (selectedPair.length > 1) {
        setSelectedPair(selectedPair.filter((item) => item !== id));
      }
    } else {
      if (selectedPair.length >= 2) {
        setSelectedPair([selectedPair[1], id]);
      } else {
        setSelectedPair([...selectedPair, id]);
      }
    }
  };

  const a1 = ANIMALS.find((a) => a.id === selectedPair[0]);
  const a2 = ANIMALS.find((a) => a.id === selectedPair[1]);

  return (
    <div className="w-full h-full flex flex-col justify-between select-none p-1 sm:p-2 font-sans relative overflow-hidden">
      
      {/* 1. Top Control Bar: Queen's Rule & Playback Controller */}
      <div className="flex items-center justify-between gap-2 mb-1.5 shrink-0">
        {/* Royal Rule Badge */}
        <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-600 text-white px-3 py-1 rounded-2xl shadow-sm border border-amber-300 flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-200 fill-yellow-300 animate-bounce" />
          <div className="text-xs sm:text-sm font-black flex items-center gap-1.5">
            <span>女王规则：</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs">① 苹果 🍎 多优先</span>
            <span className="text-yellow-200">➔</span>
            <span className="bg-white/20 px-1.5 py-0.5 rounded-md text-[11px] sm:text-xs">② 平局比香蕉 🍌 谁多</span>
          </div>
        </div>

        {/* Dynamic Simulation Mode Switcher */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-cyan-500/30">
          <button
            onClick={() => {
              sounds.playTap();
              setIsPlayingAuto(!isPlayingAuto);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer transition-all ${
              isPlayingAuto
                ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.5)] animate-pulse'
                : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
            }`}
            title={isPlayingAuto ? '暂停演播' : '开始全流程动态演播'}
          >
            {isPlayingAuto ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-cyan-300" />}
            <span>{isPlayingAuto ? '演播中' : '自动演示'}</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setIsPlayingAuto(false);
              setCurrentStep('step1_apples');
              setScanProgress(0);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentStep === 'step1_apples'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="第一轮：扫描并比对苹果数量"
          >
            <span>🍎 1.比苹果</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setIsPlayingAuto(false);
              setCurrentStep('step2_tiebreaker');
              setSelectedPair(['A', 'D']);
            }}
            className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
              currentStep === 'step2_tiebreaker'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'text-slate-300 hover:bg-slate-800'
            }`}
            title="第二轮：A与D苹果相同，香蕉破平局"
          >
            <span>🍌 2.破平局</span>
          </button>

          <button
            onClick={() => {
              sounds.playTap();
              setIsPlayingAuto(false);
              setCurrentStep('idle');
              setSelectedPair(['A', 'D']);
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="重置初始状态"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Middle Live Stage: Animated Animal Fruit Carts on Royal Red Carpet */}
      <div className="flex-1 bg-gradient-to-b from-slate-900/90 via-slate-800/80 to-slate-900/95 rounded-3xl p-3 sm:p-4 border-2 border-cyan-500/30 shadow-inner flex flex-col justify-between relative overflow-hidden min-h-0">
        
        {/* Scanning Laser Line during Step 1 */}
        {currentStep === 'step1_apples' && (
          <div
            className="absolute top-0 bottom-0 w-1 bg-rose-400 shadow-[0_0_15px_#f43f5e] z-20 pointer-events-none transition-all duration-75"
            style={{ left: `${scanProgress}%` }}
          >
            <div className="absolute top-2 -translate-x-1/2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-md whitespace-nowrap">
              🔍 苹果主键扫描中...
            </div>
          </div>
        )}

        {/* Animal Parade Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-2.5 w-full relative z-10">
          {ANIMALS.map((animal, idx) => {
            const isSelected = selectedPair.includes(animal.id);
            const isTiePartner = currentStep === 'step2_tiebreaker' && (animal.id === 'A' || animal.id === 'D');
            const isLeader = currentStep === 'step1_apples' && animal.id === 'B';
            const isLast = currentStep === 'step1_apples' && animal.id === 'E';

            return (
              <div
                key={animal.id}
                onClick={() => handleSelectAnimal(animal.id)}
                className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border-2 transition-all duration-300 cursor-pointer bg-slate-800/90 ${
                  isTiePartner
                    ? 'border-amber-400 ring-4 ring-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.6)] scale-105 bg-slate-800'
                    : isLeader
                    ? 'border-rose-400 ring-3 ring-rose-400/50 shadow-[0_0_15px_rgba(244,63,94,0.5)] scale-103'
                    : isSelected
                    ? 'border-cyan-400 ring-3 ring-cyan-400/40 scale-102 bg-slate-800 shadow-md'
                    : 'border-slate-700 hover:border-slate-500 hover:scale-101'
                }`}
              >
                {/* Ranking Tag on Top */}
                {currentStep === 'step1_apples' && (
                  <div className="absolute -top-2.5 bg-slate-900 border border-slate-600 px-2 py-0.5 rounded-full text-[10px] font-black shadow-md">
                    {isLeader && <span className="text-rose-400">🍎 最多(5) ➔ 第1位</span>}
                    {isLast && <span className="text-purple-400">🍎 最少(1) ➔ 第5位</span>}
                    {animal.id === 'C' && <span className="text-orange-400">🍎 2个 ➔ 第4位</span>}
                    {(animal.id === 'A' || animal.id === 'D') && (
                      <span className="text-amber-300 animate-pulse">🍎 并列(3) ❓</span>
                    )}
                  </div>
                )}

                {currentStep === 'step2_tiebreaker' && isTiePartner && (
                  <div className="absolute -top-2.5 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full text-[10px] font-black shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-bounce">
                    ⚡ 破平局决胜
                  </div>
                )}

                {/* Animated Animal Avatar with Physical Bobbing */}
                <div className="flex flex-col items-center gap-1 w-full mt-1">
                  <div
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600 flex items-center justify-center text-2xl sm:text-3xl shadow-sm transition-transform"
                    style={{
                      animation: 'bounce 2s infinite ease-in-out',
                      animationDelay: `${idx * 180}ms`,
                    }}
                  >
                    {animal.avatar}
                  </div>
                  <span className="text-xs font-black text-slate-200">
                    {animal.name}
                  </span>
                </div>

                {/* Fruit Stacks */}
                <div className="w-full space-y-1 my-1.5">
                  {/* Apple Bar */}
                  <div
                    className={`p-1 rounded-xl flex items-center justify-between border transition-all ${
                      currentStep === 'step1_apples' || (currentStep === 'step2_tiebreaker' && isTiePartner)
                        ? 'bg-rose-950/60 border-rose-500 text-rose-200 ring-1 ring-rose-400'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 overflow-hidden">
                      {Array.from({ length: animal.apples }).map((_, i) => (
                        <span key={i} className="text-xs">🍎</span>
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-rose-300 shrink-0 ml-1">
                      {animal.apples}
                    </span>
                  </div>

                  {/* Banana Bar */}
                  <div
                    className={`p-1 rounded-xl flex items-center justify-between border transition-all ${
                      currentStep === 'step2_tiebreaker' && isTiePartner
                        ? 'bg-amber-950/80 border-amber-400 text-amber-200 ring-2 ring-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.4)] scale-103 font-black'
                        : 'bg-slate-900/80 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-0.5 overflow-hidden">
                      {Array.from({ length: animal.bananas }).map((_, i) => (
                        <span key={i} className="text-xs">🍌</span>
                      ))}
                    </div>
                    <span className="text-[11px] font-black text-amber-300 shrink-0 ml-1">
                      {animal.bananas}
                    </span>
                  </div>

                  {/* Pear Bar */}
                  <div className="p-0.5 px-1 rounded-lg flex items-center justify-between bg-slate-900/50 border border-slate-800 text-[10px] text-slate-400">
                    <span className="text-[10px]">🍐 x{animal.pears}</span>
                    <span className="text-[9px] text-slate-500">次要</span>
                  </div>
                </div>

                {/* Click Tag */}
                <span
                  className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {isSelected ? '比对中 ✓' : '点击比对'}
                </span>
              </div>
            );
          })}
        </div>

        {/* 3. Physical Dual-Arm Balance Scale Mechanism */}
        <div className="mt-2 bg-slate-950/90 rounded-2xl p-3 border border-cyan-500/30 flex flex-col items-center justify-center relative">
          
          {/* Animated Tilting Beam */}
          <div className="w-full flex items-center justify-between px-6 sm:px-12 relative min-h-[54px]">
            {/* Center Pivot Pillar */}
            <div className="absolute left-1/2 -translate-x-1/2 top-2 bottom-0 w-3 bg-gradient-to-b from-cyan-400 to-slate-700 rounded-t-full shadow-[0_0_10px_#06b6d4] flex flex-col items-center">
              <div className="w-5 h-5 rounded-full bg-amber-400 border-2 border-slate-900 shadow-md -mt-2.5 flex items-center justify-center text-[10px] font-black text-slate-950">
                ⚖️
              </div>
            </div>

            {/* Left Pan (a1) */}
            <div
              className="flex-1 flex flex-col items-center transition-transform duration-200"
              style={{ transform: `translateY(${scaleAngle * 1.5}px)` }}
            >
              {a1 ? (
                <div className="bg-slate-900 border-2 border-cyan-400 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                  <span className="text-xl">{a1.avatar}</span>
                  <div className="text-left">
                    <div className="text-xs font-black text-cyan-300">{a1.name}</div>
                    <div className="text-[10px] text-slate-300">
                      🍎 {a1.apples} · 🍌 {a1.bananas}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">选择动物 1</div>
              )}
            </div>

            {/* Tilting Indicator */}
            <div className="w-16 text-center z-10">
              <span className="text-xs font-mono font-black text-amber-400">
                {scaleAngle < -2 ? '◀ 优先' : scaleAngle > 2 ? '优先 ▶' : '＝ 平局'}
              </span>
            </div>

            {/* Right Pan (a2) */}
            <div
              className="flex-1 flex flex-col items-center transition-transform duration-200"
              style={{ transform: `translateY(${-scaleAngle * 1.5}px)` }}
            >
              {a2 ? (
                <div className="bg-slate-900 border-2 border-cyan-400 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2">
                  <span className="text-xl">{a2.avatar}</span>
                  <div className="text-left">
                    <div className="text-xs font-black text-cyan-300">{a2.name}</div>
                    <div className="text-[10px] text-slate-300">
                      🍎 {a2.apples} · 🍌 {a2.bananas}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500">选择动物 2</div>
              )}
            </div>
          </div>

          {/* Real-time Dynamic Logic Explanation */}
          <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs px-2">
            {a1 && a2 ? (
              <div className="text-cyan-200 font-medium flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                {a1.apples !== a2.apples ? (
                  <span>
                    第一主键比对：<strong className="text-rose-300">【{a1.name}】({a1.apples}苹果)</strong> vs <strong className="text-rose-300">【{a2.name}】({a2.apples}苹果)</strong> ➔ 苹果更多者优先接见！
                  </span>
                ) : (
                  <span>
                    平局第二主键决胜：苹果相同({a1.apples}={a2.apples}) ➔ 比对香蕉：<strong className="text-amber-300">【{a1.name}】({a1.bananas}香蕉)</strong> vs <strong className="text-amber-300">【{a2.name}】({a2.bananas}香蕉)</strong> ➔ 香蕉多者胜出！
                  </span>
                )}
              </div>
            ) : (
              <span className="text-slate-400">点击上方任意两个动物，魔法天平将演示物理比对与破平局过程</span>
            )}

            <span className="text-[11px] font-black text-amber-300 bg-amber-950/60 px-2.5 py-0.5 rounded-full border border-amber-500/30 shrink-0 ml-2">
              完整顺序待求 = ❓
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
