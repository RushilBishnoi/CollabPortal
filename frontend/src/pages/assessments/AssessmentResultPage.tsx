import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { assessmentApi } from '../../lib/assessment-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  CheckCircle2,
  XCircle,
  Award,
  Sparkles,
  ArrowRight,
  RotateCcw,
  BookOpen,
  HelpCircle,
} from 'lucide-react';

export const AssessmentResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();

  const { data: result, isLoading, isError } = useQuery({
    queryKey: ['assessmentResult', attemptId],
    queryFn: () => assessmentApi.getAttemptResult(attemptId!),
    enabled: !!attemptId,
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Compiling graded performance summary…" />
      </div>
    );
  }

  if (isError || !result) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800 text-center max-w-xl mx-auto my-12">
        <h3 className="font-bold">Error loading results</h3>
        <p className="text-sm mt-1">Unable to retrieve assessment result details.</p>
        <Link
          to="/assessments"
          className="inline-block mt-4 px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold"
        >
          Return to Assessments
        </Link>
      </div>
    );
  }

  const {
    assessmentTitle,
    skillName,
    score,
    passed,
    passingScore,
    earnedPoints,
    totalPoints,
    questions,
  } = result;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Result Hero Banner */}
      <div
        className={`rounded-3xl p-6 sm:p-8 text-white shadow-md transition-all ${
          passed
            ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-700'
            : 'bg-gradient-to-r from-slate-800 via-slate-700 to-zinc-800'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/20 inline-block">
              {skillName} Assessment Result
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold">{assessmentTitle}</h1>
            <p className="text-sm text-white/90 max-w-md">
              {passed
                ? 'Congratulations! You met the passing criteria and your skill has been officially verified.'
                : `You scored ${score}%. The passing threshold is ${passingScore}%. Review the questions below and try again.`}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur border border-white/20 rounded-3xl p-6 text-center min-w-[200px] shadow-inner">
            <span className="text-xs uppercase tracking-wider block font-semibold text-white/80">
              Final Score
            </span>
            <span className="text-4xl sm:text-5xl font-black block my-1">{score}%</span>
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
              {passed ? (
                <span className="inline-flex items-center gap-1 bg-emerald-400/30 text-white px-2.5 py-0.5 rounded-full border border-emerald-300/40">
                  <CheckCircle2 className="w-3.5 h-3.5" /> PASSED
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-rose-400/30 text-white px-2.5 py-0.5 rounded-full border border-rose-300/40">
                  <XCircle className="w-3.5 h-3.5" /> FAILED
                </span>
              )}
            </div>
            <span className="text-[11px] text-white/70 block mt-2">
              {earnedPoints} / {totalPoints} Points Earned
            </span>
          </div>
        </div>
      </div>

      {/* Verified Skill Promotion Celebration Card */}
      {passed && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md flex-shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-emerald-950 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Official Verified Skill Badge Awarded!
              </h3>
              <p className="text-xs text-emerald-800 mt-0.5">
                <strong>{skillName}</strong> is now marked as <strong>VERIFIED</strong> with score {Math.round(score)}% on your student profile.
              </p>
            </div>
          </div>

          <Link
            to="/profile/student/skills"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            View in Skill Profile →
          </Link>
        </div>
      )}

      {/* Question Review Section */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b pb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Performance Breakdown &amp; Review
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Review detailed question results along with correct answers and educational explanations.
          </p>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <div
              key={q.id}
              className={`border rounded-2xl p-5 space-y-4 transition-all ${
                q.isCorrect
                  ? 'border-emerald-200 bg-emerald-50/30'
                  : 'border-rose-200 bg-rose-50/20'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <h4 className="font-bold text-sm text-slate-900">{q.questionText}</h4>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {q.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> +{q.earnedPoints} pt
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                      <XCircle className="w-3.5 h-3.5" /> 0 pts
                    </span>
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {q.options.map((opt) => {
                  const wasSelected = q.selectedOptionId === opt.id;
                  const isCorrect = opt.isCorrect;

                  let optClass = 'border-slate-200 bg-white text-slate-700';
                  if (isCorrect) {
                    optClass = 'border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-400';
                  } else if (wasSelected && !isCorrect) {
                    optClass = 'border-rose-400 bg-rose-50 text-rose-900 font-medium line-through';
                  }

                  return (
                    <div key={opt.id} className={`p-3 rounded-xl border text-xs flex items-center justify-between ${optClass}`}>
                      <span>{opt.optionText}</span>
                      {isCorrect && (
                        <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-200/60 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                          Correct
                        </span>
                      )}
                      {wasSelected && !isCorrect && (
                        <span className="text-[10px] font-bold text-rose-700 uppercase bg-rose-200/60 px-1.5 py-0.5 rounded ml-2 flex-shrink-0">
                          Your Choice
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Educational Explanation */}
              {q.explanation && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-700 flex items-start gap-2">
                  <HelpCircle className="w-4 h-4 text-indigo-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900">Explanation: </span>
                    {q.explanation}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/assessments"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Browse All Assessments
          </Link>

          <Link
            to="/profile/student/skills"
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-colors"
          >
            Go to My Skill Inventory <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
