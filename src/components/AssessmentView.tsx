import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';
import { QUESTIONS_DATA } from '../data/questions';
import { shuffleQuestionOptions } from '../utils/questionGenerator';
import { DynamicClueIllustration } from './DynamicClueIllustration';
import { XiaoZhiModal } from './XiaoZhiModal';
import { ScratchpadModal } from './ScratchpadModal';
import { InformaticsCardModal } from './InformaticsCardModal';
import { SideNavBar } from './SideNavBar';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Check,
  Heart,
  Volume2,
  Brain,
  Bot,
  HelpCircle,
  Sparkles,
  Loader2,
  CheckCircle2,
  Cpu,
  BarChart3,
  Edit3,
  Lightbulb,
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
  const [activeSideTab, setActiveSideTab] = useState<string>('tasks');
  const [secondsRemaining, setSecondsRemaining] = useState<number>(765); // 12:45
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<boolean>(false);
  const [isStoryExpanded, setIsStoryExpanded] = useState<boolean>(false);

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
      alert('请先选择一个答案选项哦！');
      return;
    }
    sounds.playLockSuccess();
    setIsAnswerLocked(true);
    setShowAnswerFeedback(true);
    setUserAnswers((prev) => ({
      ...prev,
      [question.id]: selectedOption,
    }));

    if (selectedOption === question.correctAnswer) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
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
      setCalcProgress(78);
      setCalcStepText('正在计算【数据处理】与【创新应用】核心素养...');
      setCompletedSteps(['答题数据收集完毕', '逻辑与算法评估完成']);
    }, 950);

    // Step 3: Radar Chart & Advice Synthesis
    setTimeout(() => {
      setCalcProgress(100);
      setCalcStepText('能力画像构建完成！即将呈现专属四维雷达图与进阶秘籍...');
      setCompletedSteps([
        '答题数据收集完毕',
        '逻辑与算法评估完成',
        '四维核心素养已对齐',
        '能力画像生成完毕',
      ]);
      try {
        confetti({
          particleCount: 60,
          spread: 70,
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
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    } else {
      const latestAnswers = {
        ...userAnswers,
        ...(selectedOption ? { [question.id]: selectedOption } : {}),
      };
      startCalculatingProfileAndNavigate(latestAnswers);
    }
  };

  const handlePrevTask = () => {
    setShowAnswerFeedback(false);
    setIsAnswerLocked(false);
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    } else {
      onBackToLobby();
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

  return (
    <div className="flex-1 flex flex-col md:pl-20 min-h-screen bg-gradient-to-br from-[#F9FBF9] via-[#e3f5eb]/40 to-[#e8f5e9] relative pb-28">
      {/* Interactive Tool Modals */}
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

      {/* Side Navigation Bar (Hidden on Mobile, Expanded on hover on Desktop) */}
      <SideNavBar
        activeTab={activeSideTab}
        onSelectTab={(tab) => {
          setActiveSideTab(tab);
          if (tab === 'timer') {
            alert(`当前剩余探索时间：${formatTimer(secondsRemaining)}`);
          } else if (tab === 'progress') {
            alert(`探索进度：当前进行第 ${currentIdx + 1} 关，共 ${activeQuestions.length} 关。`);
          }
        }}
        timeRemainingText={formatTimer(secondsRemaining)}
        onOpenAssistant={() => setShowXiaoZhiModal(true)}
        onExit={onBackToLobby}
      />

      {/* Main Assessment Full-Screen Zero-Scroll Container */}
      <div className="w-full h-[calc(100vh-64px)] flex flex-col pl-16 sm:pl-20 pr-3 sm:pr-6 py-2.5 overflow-hidden select-none bg-[#F9FBF9] justify-between">
        
        {/* Top Ultra-Compact Header & Navigation Bar */}
        <div className="w-full flex items-center justify-between bg-white rounded-2xl px-4 py-2 border-2 border-slate-200 shadow-2xs shrink-0 mb-2.5">
          {/* Left: Level Switcher with explicit Prev/Next Chevrons & Progress Node Bar */}
          <div className="flex items-center gap-2">
            {/* Quick Prev / Next Level Jumper */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={() => {
                  sounds.playTap();
                  handlePrevTask();
                }}
                disabled={currentIdx === 0}
                className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="上一题"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="bg-[#FFD54F] text-[#574500] px-3 py-1 rounded-lg font-black text-xs border border-amber-300 shadow-2xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#725b00] fill-[#725b00]" />
                <span>关卡 {currentIdx + 1} / {activeQuestions.length}</span>
              </div>

              <button
                onClick={() => {
                  sounds.playTap();
                  handleNextTask();
                }}
                disabled={currentIdx >= activeQuestions.length - 1}
                className="p-1 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="下一题"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Mini Progress Circles */}
            <div className="hidden lg:flex items-center gap-1">
              {activeQuestions.slice(0, 15).map((q, index) => {
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
                    }}
                    className={`w-6 h-6 rounded-full font-black text-[10px] flex items-center justify-center transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#FFD54F] text-[#574500] ring-2 ring-[#07C160] scale-110'
                        : isCompleted
                        ? 'bg-[#07C160] text-white'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
              {activeQuestions.length > 15 && (
                <span className="text-[10px] text-slate-400 font-bold ml-1">...共{activeQuestions.length}关</span>
              )}
            </div>
          </div>

          {/* Center: Competency Badges & Quick Tools */}
          <div className="flex items-center gap-2">
            <span className="bg-[#4FC3F7]/15 text-[#006688] px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 border border-[#4FC3F7]/30">
              <Brain className="w-3.5 h-3.5 text-[#006688]" />
              <span>{question.domain || question.dimension || '计算思维'}</span>
            </span>
            <span className="bg-emerald-50 text-[#006d33] px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200">
              {question.subSkill || question.category}
            </span>
            <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-lg text-xs font-black border border-amber-200">
              {'★'.repeat(question.difficultyHearts || 2)} 难度
            </span>

            {/* Quick Tools */}
            <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block"></div>
            
            <button
              onClick={() => {
                sounds.playTap();
                setShowScratchpad(true);
              }}
              className="bg-[#fef9c3] hover:bg-[#fef08a] text-[#854d0e] px-2.5 py-1 rounded-lg text-xs font-black border border-[#facc15] shadow-2xs cursor-pointer flex items-center gap-1 transition-all"
              title="打开推演草稿纸"
            >
              <Edit3 className="w-3 h-3 text-[#a16207]" />
              <span className="hidden sm:inline">草稿纸</span>
            </button>

            {question.informaticsConcept && (
              <button
                onClick={() => {
                  sounds.playTap();
                  setShowInformaticsCard(true);
                }}
                className="bg-[#e0f2fe] hover:bg-[#bae6fd] text-[#0369a1] px-2.5 py-1 rounded-lg text-xs font-black border border-[#7dd3fc] shadow-2xs cursor-pointer flex items-center gap-1 transition-all"
                title="查看计算机科学原理"
              >
                <Lightbulb className="w-3 h-3 text-[#0284c7]" />
                <span className="hidden sm:inline">CS原理</span>
              </button>
            )}

            <button
              onClick={() => {
                sounds.playTap();
                setShowXiaoZhiModal(true);
              }}
              className="bg-[#006688] hover:bg-[#004f70] text-white px-2.5 py-1 rounded-lg text-xs font-black shadow-2xs cursor-pointer flex items-center gap-1 transition-all"
              title="向导小智提示"
            >
              <Bot className="w-3 h-3 text-[#75d1ff]" />
              <span className="hidden sm:inline">小智</span>
            </button>

            <button
              onClick={handleAudioPromptClick}
              className={`p-1 rounded-lg border transition-all cursor-pointer ${
                isSpeaking
                  ? 'bg-[#07C160] text-white border-[#006d33] animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
              }`}
              title="语音朗读题目"
            >
              <Volume2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right: Quick Timer & Exit */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
              ⏱️ {formatTimer(secondsRemaining)}
            </span>
          </div>
        </div>

        {/* Main Two-Wing Interactive Stage (Pinned Viewport Height, ZERO Scroll, Expanded for Children UX) */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3.5 min-h-0 overflow-hidden">
          
          {/* LEFT WING: Large Dynamic Interactive Simulation Arena (col-span-7, ~58% width) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border-3 border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden h-full">
            {/* Clue Badge Tag */}
            <div className="flex items-center justify-between mb-2 shrink-0">
              <div className="bg-[#c2e8ff] text-[#006688] px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black border border-[#75d1ff] shadow-2xs flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" />
                <span>{question.clueBadgeText || '动态交互仿真主舞台'}</span>
              </div>
              <span className="text-xs text-slate-500 font-bold hidden sm:inline">可直接点击上方元素进行动手试算</span>
            </div>

            {/* Dynamic Clue Component (Expanded Center Stage) */}
            <div className="flex-1 flex items-center justify-center w-full min-h-0 overflow-hidden py-1">
              <DynamicClueIllustration
                clueType={question.clueType}
                clueBadgeText={question.clueBadgeText}
                question={question}
              />
            </div>

            {/* Stage Bottom Footer */}
            <div className="text-xs font-bold text-slate-500 bg-slate-50 py-1.5 px-3.5 rounded-xl text-center w-full mt-1.5 shrink-0">
              💡 观察动态演进规律与物理流转，推导并选择右侧符合全部约束的正确答案
            </div>
          </div>

          {/* RIGHT WING: Question Story + Stem + 4 Options + Primary Action (col-span-5, ~42% width) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-4 sm:p-5 lg:p-6 border-3 border-slate-200 shadow-sm flex flex-col justify-between relative overflow-hidden h-full">
            
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
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50/80 via-white to-transparent border-l-4 border-[#07C160]">
                <div className="flex items-start gap-2.5">
                  <span className="text-lg shrink-0 font-black text-[#006d33]">❓</span>
                  <div className="space-y-2 flex-1">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-snug tracking-tight text-left">
                      {question.stemText}
                    </h2>

                    {/* Highlight Keywords */}
                    {question.highlightWords && question.highlightWords.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        {question.highlightWords.map((hw, i) => (
                          <span
                            key={i}
                            className={`text-xs sm:text-sm font-black px-2.5 py-1 rounded-lg ${
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

            {/* Middle: 4 Vertical Stacked Option Cards (Optimized Sizing) */}
            <div className="space-y-2 flex-1 flex flex-col justify-center my-1.5 min-h-0">
              {question.options.map((opt) => {
                const isSelected = selectedOption === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full py-2.5 px-3 sm:py-3 sm:px-3.5 flex items-center gap-3 text-left relative rounded-2xl cursor-pointer transition-all duration-150 border-2 ${
                      isSelected
                        ? 'border-[#07C160] bg-[#f0fdf4] shadow-xs ring-2 ring-[#07C160]/20'
                        : 'border-slate-200 bg-white hover:border-[#07C160]/50 hover:bg-slate-50'
                    }`}
                  >
                    {/* Option Letter Circle */}
                    <div
                      className={`w-8 h-8 sm:w-8.5 sm:h-8.5 rounded-xl flex items-center justify-center font-black text-sm sm:text-base transition-all shrink-0 ${
                        isSelected
                          ? 'bg-[#07C160] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
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

            {/* Bottom: Action Control Strip (Prev Button + Confirm/Lock + Next Button) */}
            <div className="pt-2.5 border-t border-slate-100 flex flex-col gap-2 shrink-0 relative z-10">
              {/* 3-Column Primary Navigation Dock */}
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
                  <span>{currentIdx === 0 ? '返回' : '上一题'}</span>
                </button>

                {/* 2. Main Confirm & Lock Button */}
                <button
                  onClick={handleLockAnswer}
                  disabled={!selectedOption || isAnswerLocked}
                  className={`col-span-6 py-3 sm:py-3.5 px-3 rounded-2xl font-black text-sm sm:text-base border-b-3 flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isAnswerLocked
                      ? 'bg-[#dcfce7] text-[#166534] border-[#86efac] shadow-none cursor-default'
                      : selectedOption
                      ? 'bg-[#07C160] text-white hover:brightness-110 active:translate-y-0.5 border-[#005225] shadow-md shadow-[#07C160]/20 animate-pulse'
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
                      ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-2xs hover:brightness-105'
                      : 'bg-[#07C160] text-white border-[#005225] hover:brightness-110 shadow-md shadow-[#07C160]/20'
                  }`}
                  title={currentIdx === activeQuestions.length - 1 ? '交卷并查看能力画像' : '进入下一题'}
                >
                  <span>{currentIdx === activeQuestions.length - 1 ? '交卷画像' : '下一题'}</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>
              </div>

              {/* Secondary Sub-actions Row */}
              <div className="flex items-center justify-between gap-2 px-1">
                <button
                  onClick={onBackToLobby}
                  className="text-xs font-bold text-slate-400 hover:text-slate-700 cursor-pointer transition-colors flex items-center gap-1"
                >
                  <span>🏠 返回大厅</span>
                </button>

                <button
                  onClick={() => {
                    if (!isAnswerLocked && selectedOption) {
                      setUserAnswers((prev) => ({ ...prev, [question.id]: selectedOption }));
                    }
                    startCalculatingProfileAndNavigate();
                  }}
                  className="text-xs font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-200 cursor-pointer flex items-center gap-1 transition-all"
                >
                  <BarChart3 className="w-3.5 h-3.5 text-[#07C160]" />
                  <span>提前交卷 / 生成画像</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Loading Modal with Progress when computing capability profile */}
      {isCalculatingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative w-full max-w-md bg-white rounded-[36px] p-8 border-4 border-[#07C160] shadow-[0_16px_0_0_#006d33] overflow-hidden flex flex-col items-center text-center">
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
