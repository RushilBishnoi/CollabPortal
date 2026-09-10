import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { assessmentApi } from '../../lib/assessment-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Clock,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Send,
  HelpCircle,
} from 'lucide-react';

export const AssessmentTakePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [timeLeftSec, setTimeLeftSec] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isAutoSubmittingRef = useRef(false);

  // Initialize attempt on mount
  const { data: attemptData, isLoading, isError, error } = useQuery({
    queryKey: ['startAssessmentAttempt', id],
    queryFn: () => assessmentApi.startAttempt(id!),
    enabled: !!id,
    staleTime: Infinity, // Keep the active attempt instance alive
  });

  // Submit Mutation
  const submitMutation = useMutation({
    mutationFn: (attemptId: string) => assessmentApi.submitAttempt(attemptId),
    onSuccess: (result) => {
      navigate(`/assessments/attempts/${result.attemptId}/result`);
    },
    onError: (err: any) => {
      setIsSubmitting(false);
      alert(err.message || 'Failed to submit assessment');
    },
  });

  const handleSubmit = useCallback(() => {
    if (!attemptData || isSubmitting) return;
    setIsSubmitting(true);
    submitMutation.mutate(attemptData.attemptId);
  }, [attemptData, isSubmitting, submitMutation]);

  // Countdown timer logic
  useEffect(() => {
    if (!attemptData) return;

    const startedTime = new Date(attemptData.startedAt).getTime();
    const durationMs = attemptData.durationMinutes * 60 * 1000;
    const expiryTime = startedTime + durationMs;

    const updateTimer = () => {
      const remainingSec = Math.max(0, Math.floor((expiryTime - Date.now()) / 1000));
      setTimeLeftSec(remainingSec);

      if (remainingSec <= 0 && !isAutoSubmittingRef.current) {
        isAutoSubmittingRef.current = true;
        handleSubmit();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [attemptData, handleSubmit]);

  const handleSelectOption = (questionId: string, optionId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    if (attemptData) {
      assessmentApi.saveAnswer(attemptData.attemptId, questionId, optionId).catch(console.error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[450px] flex items-center justify-center">
        <LoadingSpinner text="Initializing secure assessment environment…" />
      </div>
    );
  }

  if (isError || !attemptData) {
    return (
      <div className="max-w-2xl mx-auto my-12 bg-red-50 border border-red-200 rounded-3xl p-8 text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-red-900">Failed to Start Assessment</h2>
        <p className="text-sm text-red-700 mt-1">
          {(error as any)?.message || 'Could not initialize assessment attempt. Please try again.'}
        </p>
        <button
          onClick={() => navigate('/assessments')}
          className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-colors"
        >
          Return to Assessments
        </button>
      </div>
    );
  }

  const { questions, assessment } = attemptData;
  const currentQuestion = questions[currentQIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(selectedAnswers).length;

  const formatTimer = (sec: number | null) => {
    if (sec === null) return '--:--';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeLeftSec !== null && timeLeftSec < 180; // Under 3 mins

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Timer and Progress */}
      <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-4 z-10">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
            {assessment.skill?.name || 'Skill'} Assessment
          </span>
          <h1 className="text-base font-bold text-slate-900 truncate max-w-sm">{assessment.title}</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
              Progress
            </span>
            <span className="text-xs font-bold text-slate-800">
              {answeredCount} of {totalQuestions} answered
            </span>
          </div>

          {/* Timer Pill */}
          <div
            className={`px-4 py-2 rounded-2xl flex items-center gap-2 border font-mono font-bold text-sm transition-colors ${
              isLowTime
                ? 'bg-red-50 text-red-700 border-red-300 animate-pulse'
                : 'bg-indigo-50 text-indigo-800 border-indigo-200'
            }`}
          >
            <Clock className={`w-4 h-4 ${isLowTime ? 'text-red-500' : 'text-indigo-600'}`} />
            {formatTimer(timeLeftSec)}
          </div>
        </div>
      </div>

      {/* Question Navigation Bar */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isAnswered = !!selectedAnswers[q.id];
          const isCurrent = idx === currentQIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => setCurrentQIndex(idx)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition-all flex items-center justify-center border flex-shrink-0 ${
                isCurrent
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm ring-2 ring-indigo-300'
                  : isAnswered
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Main Question Card */}
      {currentQuestion && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
              Question {currentQIndex + 1} of {totalQuestions}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {currentQuestion.points} point{currentQuestion.points > 1 ? 's' : ''}
            </span>
          </div>

          <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
            {currentQuestion.questionText}
          </h2>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options.map((opt) => {
              const isSelected = selectedAnswers[currentQuestion.id] === opt.id;
              return (
                <label
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQuestion.id, opt.id)}
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 shadow-sm ring-1 ring-indigo-500'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${currentQuestion.id}`}
                    checked={isSelected}
                    onChange={() => handleSelectOption(currentQuestion.id, opt.id)}
                    className="mt-1 w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
                  />
                  <span className="text-sm font-medium leading-relaxed">{opt.optionText}</span>
                </label>
              );
            })}
          </div>

          {/* Action Row */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentQIndex === 0}
              onClick={() => setCurrentQIndex((prev) => prev - 1)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors disabled:opacity-30"
            >
              <ArrowLeft className="w-4 h-4" /> Previous
            </button>

            <div className="flex items-center gap-3">
              {currentQIndex < totalQuestions - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentQIndex((prev) => prev + 1)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? 'Grading Attempt…' : 'Submit Final Assessment'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instructions Footer */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-600">
        <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
        <p>
          Answers are saved in real time. Passing with {attemptData.passingScore}% or higher will automatically award the official <strong>Verified Skill</strong> badge to your profile.
        </p>
      </div>
    </div>
  );
};
