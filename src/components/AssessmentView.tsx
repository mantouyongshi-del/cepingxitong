import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';
import { QUESTIONS_DATA } from '../data/questions';
import { shuffleQuestionOptions } from '../utils/questionGenerator';
import { DynamicClueIllustration } from './DynamicClueIllustration';
import { XiaoZhiModal } from './XiaoZhiModal';
import { ScratchpadModal } from './ScratchpadModal';
import { InformaticsCardModal } from './InformaticsCardModal';
import { AmbientStarfieldCanvas } from './AmbientStarfieldCanvas';
import { HyperspaceTransition } from './HyperspaceTransition';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Volume2,
  Brain,
  Bot,
  Sparkles,
  CheckCircle2,
  Edit3,
  Lightbulb,
  Zap,
  Music,
  Radio,
  Flame,
} from 'lucide-react';

interface AssessmentViewProps {
  questionsList?: Question[];
  initialIndex?: number;
  onBackToLobby: () => void;
  onFinishAssessment: (answers?: Record<number, string>, evaluatedQuestions?: Question[]) => void;
}

export const AssessmentView: React.FC<AssessmentViewProps> = ({
  questionsList,
  initialIndex = 0,
  onBackToLobby,
  onFinishAssessment,
}) => {
  const activeQuestions = useMemo(() => {
    if (questionsList && questionsList.length > 0) return questionsList;
    return QUESTIONS_DATA.map(shuffleQuestionOptions);
  }, [questionsList]);

  const [currentIdx, setCurrentIdx] = useState<number>(initialIndex);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [isAnswerLocked, setIsAnswerLocked] = useState<boolean>(false);
  const [showXiaoZhiModal, setShowXiaoZhiModal] = useState<boolean>(false);
  const [showScratchpad, setShowScratchpad] = useState<boolean>(false);
  const [showInformaticsCard, setShowInformaticsCard] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(765); // 12:45
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<boolean>(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState<boolean>(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState<boolean>(false);
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
  const [showTimerModal, setShowTimerModal] = useState<boolean>(false);
  const [showUnansweredModal, setShowUnansweredModal] = useState<boolean>(false);
  const [warningToast, setWarningToast] = useState<string | null>(null);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [comboToast, setComboToast] = useState<{ text: string; sub: string } | null>(null);
  const [isWarping, setIsWarping] = useState<boolean>(false);
  const [isBgmActive, setIsBgmActive] = useState<boolean>(false);

  // Sync initialIndex when it changes externally
  useEffect(() => {
    if (initialIndex !== undefined && initialIndex >= 0 && initialIndex < activeQuestions.length) {
      setCurrentIdx(initialIndex);
    }
  }, [initialIndex, activeQuestions.length]);

  // Loading & Progress feedback state when calculating capability profile
  const [isCalculatingProfile, setIsCalculatingProfile] = useState<boolean>(false);
  const [calcProgress, setCalcProgress] = useState<number>(0);
  const [calcStepText, setCalcStepText] = useState<string>('正在汇总答题数据...');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const question: Question | undefined = activeQuestions[currentIdx] || activeQuestions[0];

  // Sync selectedOption and story expand when switching questions
  useEffect(() => {
    setIsStoryExpanded(false);
    if (question && userAnswers[question.id]) {
      setSelectedOption(userAnswers[question.id]);
    } else {
      setSelectedOption('');
    }
  }, [currentIdx, question?.id]);

  // Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup BGM on unmount
  useEffect(() => {
    return () => {
      sounds.stopBgm();
    };
  }, []);

  const handleToggleBgm = () => {
    sounds.playTap();
    if (isBgmActive) {
      sounds.stopBgm();
      setIsBgmActive(false);
    } else {
      sounds.startBgm();
      setIsBgmActive(true);
    }
  };

  if (!question || activeQuestions.length === 0) {
    return (
      <div className="flex-1 min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-50 border-3 border-emerald-200 flex items-center justify-center text-4xl mb-4 shadow-sm">
          📂
        </div>
        <h2 className="text-2xl font-black text-slate-900 mb-2">题库已清空（准备全新录入）</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6 leading-relaxed">
          目前题库已全部重置清空，等待全新标准的高质量计算思维与信息科技题目录入。
        </p>
        <button
          onClick={onBackToLobby}
          className="bg-[#07C160] hover:brightness-110 text-white font-black px-6 py-3 rounded-2xl shadow-md transition-all cursor-pointer"
        >
          返回探索大厅
        </button>
      </div>
    );
  }

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = (key: string) => {
    if (isAnswerLocked) return;
    sounds.playSelect();
    setSelectedOption(key);
    setUserAnswers((prev) => ({
      ...prev,
      [question.id]: key,
    }));
  };

  const handleLockAnswer = () => {
    if (!selectedOption) {
      sounds.playRobot();
      setWarningToast('⚠️ 请先在右侧选择一个能量电芯（A/B/C/D）哦！');
      setTimeout(() => setWarningToast(null), 2000);
      return;
    }
    
    // Increment combo streak & play audio
    const newStreak = comboStreak + 1;
    setComboStreak(newStreak);
    sounds.playCombo(newStreak);
    setIsAnswerLocked(true);
    setShowAnswerFeedback(true);

    setUserAnswers((prev) => ({
      ...prev,
      [question.id]: selectedOption,
    }));

    // Trigger Game Combo Floating Badge
    let toastText = '🌟 能量已充能 +120 EXP!';
    let toastSub = '探索坐标已锁定';
    if (newStreak === 2) {
      toastText = '⚡ Combo x2! 算法敏锐!';
      toastSub = '连续推导命中能量节点';
    } else if (newStreak === 3) {
      toastText = '🚀 Combo x3! 思维超频!';
      toastSub = '计算思维正在全速运转';
    } else if (newStreak >= 4) {
      toastText = `🔥 Combo x${newStreak}! 算法架构大师!`;
      toastSub = '势不可挡的探险先锋';
    }
    setComboToast({ text: toastText, sub: toastSub });
    setTimeout(() => setComboToast(null), 1800);

    if (selectedOption === question.correctAnswer) {
      try {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.7 },
          colors: ['#07C160', '#FFD54F', '#4FC3F7', '#FF8A80'],
        });
      } catch {}
    }
  };

  const startCalculatingProfileAndNavigate = (latestAnswers?: Record<number, string>) => {
    sounds.playLockSuccess();
    setIsCalculatingProfile(true);
    setCalcProgress(12);
    setCalcStepText(`正在汇总 ${activeQuestions.length} 道关卡答题数据...`);
    setCompletedSteps([]);

    const answersToSubmit = latestAnswers || {
      ...userAnswers,
      ...(selectedOption ? { [question.id]: selectedOption } : {}),
    };

    // Step 1: Logic & Algorithm Dimension
    setTimeout(() => {
      setCalcProgress(42);
      setCalcStepText('正在评估【逻辑思维】与【算法理解】维度...');
      setCompletedSteps(['答题数据收集完毕']);
    }, 450);

    // Step 2: Data & Innovation Dimension
    setTimeout(() => {
      setCalcProgress(74);
      setCalcStepText('正在计算【数据抽象】与【数字创造】综合得分...');
      setCompletedSteps(['答题数据收集完毕', '计算思维五维能力模型构建']);
    }, 1000);

    // Step 3: Peer Norms & Piaget Cognitive Stage
    setTimeout(() => {
      setCalcProgress(96);
      setCalcStepText('正在匹配同龄人 Bebras 常模击败率与皮亚杰认知定位...');
      setCompletedSteps([
        '答题数据收集完毕',
        '计算思维五维能力模型构建',
        '同龄人击败率 (Percentile) 换算',
      ]);
      try {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { y: 0.6 },
          colors: ['#07C160', '#FFD54F', '#4FC3F7', '#FF8A80'],
        });
      } catch {}
    }, 1500);

    // Step 4: Smooth transition to ProfileView
    setTimeout(() => {
      setIsCalculatingProfile(false);
      onFinishAssessment(answersToSubmit, activeQuestions);
    }, 2100);
  };

  const handleNextTask = () => {
    setShowAnswerFeedback(false);
    setIsAnswerLocked(false);

    // Save current selection if made
    const latestAnswers = {
      ...userAnswers,
      ...(selectedOption ? { [question.id]: selectedOption } : {}),
    };
    if (selectedOption) {
      setUserAnswers(latestAnswers);
    }

    if (currentIdx < activeQuestions.length - 1) {
      // Trigger Hyperspace transition effect
      sounds.playWarp();
      setIsWarping(true);
      setTimeout(() => {
        setCurrentIdx(currentIdx + 1);
      }, 150);
    } else {
      // Must answer ALL questions to generate capability profile
      const unanswered = activeQuestions.filter((q) => !latestAnswers[q.id]);
      if (unanswered.length > 0) {
        sounds.playRobot();
        setShowUnansweredModal(true);
        return;
      }
      startCalculatingProfileAndNavigate(latestAnswers);
    }
  };

  const handlePrevTask = () => {
    setShowAnswerFeedback(false);
    setIsAnswerLocked(false);
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    } else {
      setShowExitConfirmModal(true);
    }
  };

  const handleAudioPromptClick = () => {
    if (isSpeaking) {
      sounds.stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      sounds.speakText(question.stemText, () => setIsSpeaking(false));
    }
  };

  const answeredCount = Object.keys(userAnswers).length + (selectedOption && !userAnswers[question.id] ? 1 : 0);
  const currentExp = answeredCount * 120;

  return (
    <div className="w-full h-screen bg-slate-900/95 text-slate-100 relative select-none overflow-hidden font-sans flex flex-col justify-between">
      
      {/* 1. Atmospheric Ambient Starfield & Quantum Particle Canvas */}
      <AmbientStarfieldCanvas />

      {/* 2. Hyperspace Warp Speed Level Transition */}
      <HyperspaceTransition isActive={isWarping} onComplete={() => setIsWarping(false)} />

      {/* 3. Interactive Tool Modals */}
      <XiaoZhiModal
        isOpen={showXiaoZhiModal}
        onClose={() => setShowXiaoZhiModal(false)}
        question={question}
      />

      <ScratchpadModal
        isOpen={showScratchpad}
        onClose={() => setShowScratchpad(false)}
        questionStem={question.stemText}
        taskNumber={question.taskNumber || currentIdx + 1}
      />

      <InformaticsCardModal
        isOpen={showInformaticsCard}
        onClose={() => setShowInformaticsCard(false)}
        concept={question.informaticsConcept}
        questionTitle={question.stemText}
      />

      {/* Main Holographic Cockpit Zero-Scroll Container (Full Screen Width & Height) */}
      <div className="w-full h-full flex flex-col px-3 sm:px-5 py-2.5 overflow-hidden select-none justify-between relative z-10">
        
        {/* Floating Game Combo Toast Notification */}
        {comboToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white px-6 sm:px-8 py-2.5 rounded-full shadow-[0_10px_35px_rgba(245,158,11,0.6)] border-2 border-white animate-bounce flex items-center gap-3 select-none pointer-events-none">
            <Sparkles className="w-5 h-5 text-yellow-200 fill-yellow-200 animate-spin" style={{ animationDuration: '3s' }} />
            <div className="text-center">
              <div className="text-sm sm:text-base font-black tracking-wide drop-shadow-sm">{comboToast.text}</div>
              <div className="text-[11px] text-amber-100 font-bold">{comboToast.sub}</div>
            </div>
            <Flame className="w-5 h-5 text-yellow-200 animate-pulse" />
          </div>
        )}

        {/* Warning Toast Floating Notification */}
        {warningToast && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-amber-500 to-rose-600 text-white px-6 py-2.5 rounded-full shadow-[0_10px_35px_rgba(244,63,94,0.6)] border-2 border-white animate-bounce flex items-center gap-2 select-none pointer-events-none text-xs sm:text-sm font-black">
            <span>{warningToast}</span>
          </div>
        )}

        {/* Top Holographic Flight Command HUD */}
        <div className="w-full flex items-center justify-between bg-slate-900/80 backdrop-blur-xl rounded-2xl px-4 py-2 border-2 border-cyan-500/30 shadow-[0_4px_24px_rgba(6,182,212,0.15)] shrink-0 mb-2">
          
          {/* Left: Star Route Level Map & EXP Energy Badge */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Prev / Next Level Jumper */}
            <div className="flex items-center bg-slate-800/90 p-0.5 rounded-xl border border-cyan-500/30 shadow-inner">
              <button
                onClick={() => {
                  sounds.playTap();
                  handlePrevTask();
                }}
                disabled={currentIdx === 0}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="上一关"
              >
                <ChevronLeft className="w-4 h-4 text-cyan-400" />
              </button>

              <div
                onClick={() => setShowProgressModal(true)}
                className="bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-3.5 py-1 rounded-lg font-black text-xs sm:text-sm border border-amber-300 shadow-xs flex items-center gap-1.5 cursor-pointer hover:brightness-110 transition-all"
                title="点击展开全景航线图"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900 fill-amber-900" />
                <span>关卡 {currentIdx + 1} / {activeQuestions.length}</span>
              </div>

              <button
                onClick={() => {
                  sounds.playTap();
                  handleNextTask();
                }}
                disabled={currentIdx >= activeQuestions.length - 1}
                className="p-1 rounded-lg hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="下一关"
              >
                <ChevronRight className="w-4 h-4 text-cyan-400" />
              </button>
            </div>
            
            {/* Interactive Star Route Nodes */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-800/60 px-2.5 py-1 rounded-xl border border-cyan-500/20 relative">
              {activeQuestions.slice(0, 12).map((q, index) => {
                const isCompleted = userAnswers[q.id] !== undefined;
                const isActive = index === currentIdx;
                const isFinalBoss = index === activeQuestions.length - 1;

                return (
                  <button
                    key={q.id}
                    onClick={() => {
                      sounds.playTap();
                      setCurrentIdx(index);
                      setSelectedOption(userAnswers[q.id] || '');
                      setIsAnswerLocked(false);
                      setShowAnswerFeedback(false);
                    }}
                    className={`relative w-6.5 h-6.5 rounded-lg font-black text-[10px] flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 ring-2 ring-cyan-400 scale-110 shadow-[0_0_12px_#38bdf8] animate-pulse'
                        : isCompleted
                        ? 'bg-[#07C160] text-white shadow-xs hover:scale-105'
                        : isFinalBoss
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/40'
                        : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                    }`}
                    title={isFinalBoss ? '算法核心神庙' : `第 ${index + 1} 关`}
                  >
                    {isCompleted ? '💎' : isFinalBoss ? '🏆' : isActive ? `${index + 1}` : index + 1}
                    {isActive && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full animate-ping"></span>
                    )}
                  </button>
                );
              })}
              {activeQuestions.length > 12 && (
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="text-[10px] text-cyan-400 font-bold ml-1 hover:underline cursor-pointer"
                >
                  ...共{activeQuestions.length}关
                </button>
              )}
            </div>

            {/* EXP Energy Reactor Gauge */}
            <div
              onClick={() => setShowProgressModal(true)}
              className="hidden sm:flex items-center gap-1.5 bg-cyan-950/60 text-cyan-300 px-3 py-1 rounded-xl text-xs font-black border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)] cursor-pointer hover:border-cyan-400 transition-all"
              title="查看探索能量总览"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
              <span>能量: {currentExp} EXP</span>
            </div>
          </div>

          {/* Center: Competency Core & Tactical Gadgets */}
          <div className="flex items-center gap-2">
            <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-1 rounded-xl text-xs font-black flex items-center gap-1 border border-cyan-400/40 shadow-xs">
              <Brain className="w-3.5 h-3.5 text-cyan-400" />
              <span>{question.domain || question.dimension || '计算思维'}</span>
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-xl text-xs font-bold border border-emerald-400/30">
              {question.subSkill || question.category}
            </span>
            <span className="bg-amber-500/20 text-amber-300 px-2 py-1 rounded-xl text-xs font-black border border-amber-400/30">
              {'★'.repeat(question.difficultyHearts || 2)} 难度
            </span>

            {/* Explorer Gadgets Row */}
            <div className="h-4 w-px bg-slate-700 mx-1 hidden sm:block"></div>
            
            <button
              onClick={() => {
                sounds.playTap();
                setShowScratchpad(true);
              }}
              className="bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 px-2.5 py-1 rounded-xl text-xs font-black border border-amber-400/40 shadow-xs cursor-pointer flex items-center gap-1 transition-all hover:scale-102"
              title="打开推演草稿纸"
            >
              <Edit3 className="w-3 h-3 text-amber-400" />
              <span className="hidden sm:inline">草稿纸</span>
            </button>

            {question.informaticsConcept && (
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowInformaticsCard(true);
                }}
                className="bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 px-2.5 py-1 rounded-xl text-xs font-black border border-sky-400/40 shadow-xs cursor-pointer flex items-center gap-1 transition-all hover:scale-102"
                title="查看计算机科学原理"
              >
                <Lightbulb className="w-3 h-3 text-sky-400" />
                <span className="hidden sm:inline">CS原理</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playRobot();
                setShowXiaoZhiModal(true);
              }}
              className="bg-cyan-600 hover:bg-cyan-500 text-white px-2.5 py-1 rounded-xl text-xs font-black shadow-md cursor-pointer flex items-center gap-1 transition-all hover:scale-102"
              title="向导小智提示"
            >
              <Bot className="w-3 h-3 text-cyan-200" />
              <span className="hidden sm:inline">小智</span>
            </button>

            <button
              onClick={handleAudioPromptClick}
              className={`p-1 rounded-xl border transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-[#07C160] text-white border-[#006d33] animate-pulse'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
              }`}
              title="语音朗读题目"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Ambient BGM Synthesizer & Chronometer */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleBgm}
              className={`px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isBgmActive
                  ? 'bg-purple-500/30 text-purple-300 border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.4)] animate-pulse'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
              title={isBgmActive ? '点击关闭背景音' : '点击开启沉浸式背景音乐'}
            >
              <Music className={`w-3.5 h-3.5 ${isBgmActive ? 'text-purple-300' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">{isBgmActive ? '音效原声 🎵' : '背景音 🔇'}</span>
            </button>

            <button
              onClick={() => setShowTimerModal(true)}
              className="text-xs font-mono font-black text-cyan-300 bg-slate-800/90 px-2.5 py-1 rounded-xl border border-cyan-500/30 shadow-xs hover:border-cyan-400 transition-all cursor-pointer flex items-center gap-1"
              title="查看任务计时器详情"
            >
              <span>⏱️ {formatTimer(secondsRemaining)}</span>
            </button>
          </div>
        </div>

        {/* Main Two-Wing Interactive Stage (Holographic Cockpit Pod) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
          
          {/* LEFT WING: Holographic Simulation Capsule (col-span-7, ~58% width) */}
          <div className="lg:col-span-7 bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border-2 border-cyan-400/30 shadow-[0_8px_32px_rgba(6,182,212,0.12)] flex flex-col justify-between relative overflow-hidden h-full text-slate-900">
            
            {/* Sci-Fi Decorative Corner Brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-500 pointer-events-none"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-500 pointer-events-none"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-500 pointer-events-none"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-500 pointer-events-none"></div>

            {/* Clue Badge Top Tag */}
            <div className="flex items-center justify-between mb-1.5 shrink-0 px-1">
              <div className="bg-[#c2e8ff] text-[#006688] px-3.5 py-1 rounded-full text-xs sm:text-sm font-black border border-[#75d1ff] shadow-2xs flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
                <span>{question.clueBadgeText || '动态交互仿真主舞台'}</span>
              </div>
              <span className="text-xs text-slate-500 font-bold hidden sm:flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>仿真引擎运转中 · 可直接动手试算</span>
              </span>
            </div>

            {/* Dynamic Clue Component (Expanded Center Stage) */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden py-0.5">
              <DynamicClueIllustration
                clueType={question.clueType}
                clueBadgeText={question.clueBadgeText}
                question={question}
              />
            </div>

            {/* Stage Bottom Footer: Mascot Companion Dynamic Speech */}
            <div
              onClick={() => {
                sounds.playRobot();
                setShowXiaoZhiModal(true);
              }}
              className="bg-gradient-to-r from-emerald-50 via-sky-50 to-amber-50/60 border border-emerald-300 p-2 sm:p-2.5 rounded-2xl flex items-center justify-between gap-2.5 cursor-pointer hover:border-emerald-500 transition-all shadow-xs shrink-0 mt-1"
              title="点击唤起向导小智提示"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#006688] to-[#0284c7] text-white flex items-center justify-center text-base shadow-sm shrink-0 animate-bounce">
                  🤖
                </div>
                <div className="text-xs text-slate-800 font-bold truncate">
                  {isAnswerLocked ? (
                    <span className="text-[#006d33] font-black">
                      小智：“坐标锁定完毕！进入下一关探险吧！🚀”
                    </span>
                  ) : selectedOption ? (
                    <span className="text-sky-900 font-black">
                      小智：“已选【{selectedOption}】，确认后点击下方【确认锁定】哦！💡”
                    </span>
                  ) : (
                    <span className="text-slate-700">
                      小智：“观察上方实验台的规律，把线索组合起来就能解开谜题！🔍”
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[11px] font-black text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0 shadow-2xs">
                向导锦囊 💡
              </span>
            </div>
          </div>

          {/* RIGHT WING: Mission Terminal & Quantum Power Cells (col-span-5, ~42% width) */}
          <div className="lg:col-span-5 bg-white/95 backdrop-blur-xl rounded-3xl p-4 sm:p-5 border-2 border-emerald-400/30 shadow-[0_8px_32px_rgba(7,193,96,0.12)] flex flex-col justify-between relative overflow-hidden h-full text-slate-900">
            
            {/* Sci-Fi Decorative Corner Brackets */}
            <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-emerald-500 pointer-events-none"></div>
            <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-emerald-500 pointer-events-none"></div>
            <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-emerald-500 pointer-events-none"></div>
            <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-emerald-500 pointer-events-none"></div>

            {/* Top: Story Context Callout + Question Stem Headline */}
            <div className="space-y-2 shrink-0">
              {/* Story Context (Interactive Expandable Story Box) */}
              {question.storyContext && (
                <div
                  onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                  className={`bg-sky-50/90 hover:bg-sky-50 border border-sky-200 rounded-2xl p-2.5 sm:p-3 flex flex-col gap-1.5 text-xs sm:text-sm text-sky-950 font-semibold leading-relaxed transition-all cursor-pointer ${
                    isStoryExpanded ? 'shadow-xs ring-2 ring-sky-300/60' : ''
                  }`}
                  title={isStoryExpanded ? '点击收起背景' : '点击展开查看完整背景故事'}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5 text-sky-900 font-black text-xs">
                      <span className="text-sm">📖</span>
                      <span>任务探索情境</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsStoryExpanded(!isStoryExpanded);
                      }}
                      className="text-[11px] font-black text-sky-700 hover:text-sky-900 bg-sky-100 hover:bg-sky-200 px-2 py-0.5 rounded-full flex items-center gap-0.5 cursor-pointer transition-colors shadow-2xs"
                    >
                      <span>{isStoryExpanded ? '收起 ▴' : '展开全文 ▾'}</span>
                    </button>
                  </div>

                  <p className={`text-sky-950 transition-all ${
                    isStoryExpanded ? 'max-h-32 overflow-y-auto pr-1' : 'line-clamp-2'
                  }`}>
                    {question.storyContext}
                  </p>
                </div>
              )}

              {/* Question Stem Headline (Bigger & High Contrast) */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-transparent border-l-4 border-[#07C160]">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 font-black text-[#006d33]">❓</span>
                  <div className="space-y-1.5 flex-1">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight text-left">
                      {question.stemText}
                    </h2>

                    {/* Highlight Keywords */}
                    {question.highlightWords && question.highlightWords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {question.highlightWords.map((hw, i) => (
                          <span
                            key={i}
                            className={`text-xs sm:text-sm font-black px-2.5 py-0.5 rounded-lg ${
                              hw.type === 'blue'
                                ? 'bg-sky-100 text-sky-900 border border-sky-300'
                                : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            }`}
                          >
                            {hw.text}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Middle: 4 Vertical Stacked Quantum Power Cell Options */}
            <div className="space-y-2 flex-1 flex flex-col justify-center my-1.5 min-h-0">
              {question.options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full py-2.5 px-3 sm:py-3 sm:px-3.5 flex items-center gap-3 text-left relative rounded-2xl cursor-pointer transition-all duration-150 border-2 ${
                      isSelected
                        ? 'border-[#07C160] bg-[#f0fdf4] shadow-md ring-3 ring-[#07C160]/30 scale-101'
                        : 'border-slate-200 bg-white hover:border-[#07C160]/60 hover:bg-slate-50 hover:shadow-xs'
                    }`}
                  >
                    {/* Option Letter Hex Pad */}
                    <div
                      className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl flex items-center justify-center font-black text-sm sm:text-base transition-all shrink-0 ${
                        isSelected
                          ? 'bg-[#07C160] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {opt.key}
                    </div>

                    {/* Option Text Label */}
                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm sm:text-base font-black leading-tight block transition-colors ${
                          isSelected ? 'text-[#006d33]' : 'text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </span>
                    </div>

                    {/* Checkmark indicator */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0 transition-all ${
                        isSelected
                          ? 'bg-[#07C160] scale-100 opacity-100 shadow-xs'
                          : 'bg-transparent border-2 border-slate-200 scale-75 opacity-0'
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Answer Feedback Box (Positioned right below option cards, NEVER covering action buttons) */}
            {showAnswerFeedback && (
              <div className="w-full my-1.5 bg-[#f0fdf4] p-3 rounded-2xl border-2 border-[#07C160] shadow-sm animate-in fade-in duration-150 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 text-[#006d33] font-black text-xs sm:text-sm">
                    <Check className="w-4 h-4 text-[#07C160] stroke-[3]" />
                    <span>
                      {selectedOption === question.correctAnswer
                        ? '🎉 判定正确！官方解析如下：'
                        : '💡 官方题解推导过程：'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    {question.informaticsConcept && (
                      <button
                        onClick={() => setShowInformaticsCard(true)}
                        className="text-xs font-black text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-0.5 rounded-full border border-blue-200 cursor-pointer flex items-center gap-0.5 transition-colors"
                      >
                        <Lightbulb className="w-3.5 h-3.5 text-blue-600" />
                        <span>CS原理</span>
                      </button>
                    )}
                    <button
                      onClick={() => setShowAnswerFeedback(false)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-black p-0.5 rounded-full cursor-pointer ml-1"
                      title="关闭解析"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-800 font-medium leading-relaxed max-h-20 overflow-y-auto pr-1">
                  {question.explanation}
                </p>
              </div>
            )}

            {/* Bottom: Tactical Flight Control Strip */}
            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2 shrink-0 relative z-10">
              {/* 3-Column Primary Flight Console */}
              <div className="grid grid-cols-12 gap-2.5 w-full">
                {/* 1. Prev Question Button */}
                <button
                  onClick={() => {
                    sounds.playTap();
                    handlePrevTask();
                  }}
                  className={`col-span-3 py-3 sm:py-3.5 px-2 rounded-2xl font-black text-xs sm:text-sm border-2 flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    currentIdx === 0
                      ? 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                      : 'bg-white text-slate-700 border-slate-300 hover:border-emerald-400 hover:bg-emerald-50 shadow-2xs'
                  }`}
                  title={currentIdx === 0 ? '返回大厅' : '返回上一题'}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" />
                  <span>{currentIdx === 0 ? '返回' : '上一关'}</span>
                </button>

                {/* 2. Main Confirm & Lock Button */}
                <button
                  onClick={handleLockAnswer}
                  disabled={!selectedOption || isAnswerLocked}
                  className={`col-span-6 py-3 sm:py-3.5 px-3 rounded-2xl font-black text-sm sm:text-base border-b-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isAnswerLocked
                      ? 'bg-[#dcfce7] text-[#166534] border-[#86efac] shadow-none cursor-default'
                      : selectedOption
                      ? 'bg-[#07C160] text-white hover:brightness-110 active:translate-y-0.5 border-[#005225] shadow-lg shadow-[#07C160]/30 animate-pulse'
                      : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>
                    {isAnswerLocked
                      ? `已锁定【${selectedOption}】`
                      : selectedOption
                      ? `确认锁定【${selectedOption}】`
                      : '请选择选项'}
                  </span>
                </button>

                {/* 3. Next Question Button */}
                <button
                  onClick={() => {
                    sounds.playTap();
                    handleNextTask();
                  }}
                  className={`col-span-3 py-3 sm:py-3.5 px-2 rounded-2xl font-black text-xs sm:text-sm border-2 flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    currentIdx === activeQuestions.length - 1
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-md hover:brightness-105'
                      : 'bg-[#07C160] text-white border-[#005225] hover:brightness-110 shadow-md shadow-[#07C160]/25'
                  }`}
                  title={currentIdx === activeQuestions.length - 1 ? '交卷并查看能力画像' : '跃迁至下一关'}
                >
                  <span>{currentIdx === activeQuestions.length - 1 ? '交卷画像' : '下一关'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Secondary Sub-actions Row */}
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  onClick={() => {
                    sounds.playTap();
                    setShowExitConfirmModal(true);
                  }}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span>🏠 返回大厅</span>
                </button>

                {/* Real-time Answering Progress Badge */}
                <button
                  onClick={() => setShowProgressModal(true)}
                  className="flex items-center gap-1.5 text-xs font-black text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 hover:border-emerald-400 cursor-pointer transition-all"
                  title="点击查看航线总览"
                >
                  <span className="w-2 h-2 rounded-full bg-[#07C160] animate-pulse"></span>
                  <span>答题进度：{answeredCount} / {activeQuestions.length} 关</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* 4. Holographic Timer Hub Modal */}
      {showTimerModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none text-slate-100"
          onClick={() => setShowTimerModal(false)}
        >
          <div
            className="bg-slate-900/95 rounded-[36px] max-w-md w-full border-2 border-cyan-400/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden flex flex-col p-6 gap-5 animate-in zoom-in-95 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-2xl shrink-0">
                  ⏱️
                </div>
                <div>
                  <h3 className="font-black text-lg text-cyan-300">
                    星际探索任务计时器
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    保持平稳推导节奏，时间非常充足
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowTimerModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Giant Glowing Digital Clock */}
            <div className="bg-slate-950/80 border border-cyan-500/30 rounded-3xl p-6 flex flex-col items-center justify-center gap-2 shadow-inner">
              <div className="text-4xl sm:text-5xl font-mono font-black text-cyan-400 tracking-wider drop-shadow-[0_0_15px_rgba(6,182,212,0.6)]">
                {formatTimer(secondsRemaining)}
              </div>
              <div className="text-xs text-emerald-400 font-black flex items-center gap-1.5 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>能量系统运转正常 · 推荐答题时长 15~20 分钟</span>
              </div>
            </div>

            {/* AI Companion Advice */}
            <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-cyan-200">
              <span className="text-2xl shrink-0">🤖</span>
              <p className="leading-relaxed font-medium">
                小智向导提示：“不用着急，遇到难题先观察左侧实验台的数据流转，理清规律再做选择！”
              </p>
            </div>

            <button
              onClick={() => {
                sounds.playSelect();
                setShowTimerModal(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-emerald-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer transition-all active:scale-95"
            >
              保持专注，继续探索 🚀
            </button>
          </div>
        </div>
      )}

      {/* 5. Holographic Star Route Progress Modal */}
      {showProgressModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none text-slate-100"
          onClick={() => setShowProgressModal(false)}
        >
          <div
            className="bg-slate-900/95 rounded-[36px] max-w-lg w-full border-2 border-emerald-400/50 shadow-[0_0_50px_rgba(7,193,96,0.3)] overflow-hidden flex flex-col p-6 gap-5 animate-in zoom-in-95 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-2xl shrink-0">
                  🗺️
                </div>
                <div>
                  <h3 className="font-black text-lg text-emerald-300">
                    星际探索总航线图
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    当前已完成 {answeredCount} / {activeQuestions.length} 关 · 累计能量 {currentExp} EXP
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowProgressModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Progress Bar Gauge */}
            <div className="w-full bg-slate-950 rounded-2xl p-3.5 border border-slate-800 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs font-black">
                <span className="text-slate-400">总探索进度</span>
                <span className="text-emerald-400">{Math.round((answeredCount / activeQuestions.length) * 100)}%</span>
              </div>
              <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-[#07C160] to-cyan-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${(answeredCount / activeQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Interactive Level Grid */}
            <div className="max-h-56 overflow-y-auto pr-1">
              <div className="grid grid-cols-5 gap-2.5">
                {activeQuestions.map((q, index) => {
                  const isCompleted = userAnswers[q.id] !== undefined;
                  const isActive = index === currentIdx;

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        sounds.playTap();
                        setCurrentIdx(index);
                        setSelectedOption(userAnswers[q.id] || '');
                        setIsAnswerLocked(false);
                        setShowAnswerFeedback(false);
                        setShowProgressModal(false);
                      }}
                      className={`p-2.5 rounded-2xl border-2 flex flex-col items-center gap-1 cursor-pointer transition-all ${
                        isActive
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 ring-2 ring-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.5)] scale-102'
                          : isCompleted
                          ? 'bg-emerald-500/20 border-emerald-400/60 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      <span className="text-base">{isCompleted ? '💎' : index === activeQuestions.length - 1 ? '🏆' : '📍'}</span>
                      <span className="text-xs font-black">第 {index + 1} 关</span>
                      <span className="text-[10px] font-bold text-slate-500">
                        {isCompleted ? `已答【${userAnswers[q.id]}】` : '待探索'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playSelect();
                setShowProgressModal(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-[#07C160] hover:bg-[#059669] text-white font-black text-sm shadow-[0_0_20px_rgba(7,193,96,0.4)] cursor-pointer transition-all active:scale-95"
            >
              继续当前关卡 🚀
            </button>
          </div>
        </div>
      )}

      {/* 6. Unanswered Directives Holographic Modal */}
      {showUnansweredModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none text-slate-100"
          onClick={() => setShowUnansweredModal(false)}
        >
          <div
            className="bg-slate-900/95 rounded-[36px] max-w-md w-full border-2 border-amber-400/50 shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden flex flex-col p-6 gap-5 animate-in zoom-in-95 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-2xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-black text-lg text-amber-300">
                    尚有未探索关卡
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    必须全部完成答题后才能生成能力画像
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowUnansweredModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Unanswered Badges List */}
            <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <div className="text-xs font-black text-amber-200 flex items-center gap-1.5">
                <span>📋 待完成关卡清单：</span>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {activeQuestions.map((q, idx) => {
                  if (userAnswers[q.id]) return null;
                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        sounds.playTap();
                        setCurrentIdx(idx);
                        setSelectedOption('');
                        setIsAnswerLocked(false);
                        setShowAnswerFeedback(false);
                        setShowUnansweredModal(false);
                      }}
                      className="px-3 py-1 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400 text-amber-300 text-xs font-black cursor-pointer transition-all hover:scale-105"
                    >
                      关卡 {idx + 1} ➔ 前往
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => {
                sounds.playSelect();
                const firstUnansweredIndex = activeQuestions.findIndex((q) => !userAnswers[q.id]);
                if (firstUnansweredIndex !== -1) {
                  setCurrentIdx(firstUnansweredIndex);
                  setSelectedOption('');
                  setIsAnswerLocked(false);
                  setShowAnswerFeedback(false);
                }
                setShowUnansweredModal(false);
              }}
              className="w-full py-3.5 rounded-2xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-black text-sm shadow-[0_0_20px_rgba(245,158,11,0.4)] cursor-pointer transition-all active:scale-95"
            >
              前往第一道未答关卡 🎯
            </button>
          </div>
        </div>
      )}

      {/* 7. Exit Confirmation Dialog Modal */}
      {showExitConfirmModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in select-none text-slate-900"
          onClick={() => setShowExitConfirmModal(false)}
        >
          <div
            className="bg-white rounded-[32px] max-w-md w-full border-4 border-amber-300 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col p-6 gap-5 animate-in zoom-in-95 relative z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl shrink-0">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">
                    确认终止答题并返回大厅？
                  </h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">
                    当前测评正在进行中（已作答 {answeredCount} / {activeQuestions.length} 关）
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowExitConfirmModal(false);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Warning Details Callout */}
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-1.5 font-black text-amber-900 text-sm">
                <span>🚨 重要提示：</span>
              </div>
              <p className="leading-relaxed font-medium">
                若现在返回大厅，<strong className="text-rose-700 font-black">本次测评未完成的答题进度将无法保留</strong>。下次测评需要重新开始。
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  sounds.playSelect();
                  setShowExitConfirmModal(false);
                }}
                className="py-3 px-4 rounded-2xl bg-[#07C160] hover:bg-[#059669] text-white font-black text-sm border-b-3 border-[#005225] shadow-md shadow-[#07C160]/25 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>继续答题 ✍️</span>
              </button>

              <button
                onClick={() => {
                  sounds.playTap();
                  setShowExitConfirmModal(false);
                  onBackToLobby();
                }}
                className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 hover:border-rose-300 font-black text-sm border-2 border-slate-200 cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>终止并退出 🏠</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Loading Modal with Progress when computing capability profile */}
      {isCalculatingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300 text-slate-900">
          <div className="relative w-full max-w-md bg-white rounded-[36px] p-8 border-4 border-[#07C160] shadow-[0_16px_40px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-[#07C160] border-4 border-white flex items-center justify-center text-white text-3xl mb-4 shadow-md animate-bounce">
              🧠
            </div>
            <h3 className="text-2xl font-black text-[#1b1c1c] tracking-tight">
              正在构建四维计算思维画像
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-bold mt-1">
              华儿街 AI 算法引擎正在进行认知分析...
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 rounded-full h-4 mt-6 border-2 border-gray-200 overflow-hidden relative">
              <div
                className="bg-[#07C160] h-full transition-all duration-300 rounded-full"
                style={{ width: `${calcProgress}%` }}
              ></div>
            </div>

            {/* Step text */}
            <div className="text-xs font-bold text-[#006d33] mt-3">
              {calcStepText} ({calcProgress}%)
            </div>

            {/* Steps Checklist */}
            <div className="w-full mt-4 space-y-1.5 text-left text-xs bg-[#f8fafc] p-3.5 rounded-2xl border border-gray-200">
              {completedSteps.map((st, i) => (
                <div key={i} className="flex items-center gap-2 text-gray-700 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#07C160]" />
                  <span>{st}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
