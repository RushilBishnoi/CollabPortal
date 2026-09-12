import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { assessmentApi } from '../../lib/assessment-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ArrowLeft,
  Award,
} from 'lucide-react';

export const MyAttemptsPage: React.FC = () => {
  const { data: attempts = [], isLoading, isError } = useQuery({
    queryKey: ['myAssessmentAttempts'],
    queryFn: assessmentApi.getMyAttempts,
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading your assessment attempts history…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
        <h3 className="font-bold">Error loading attempts</h3>
        <p className="text-sm">Unable to load your past assessment attempts.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-700 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold mb-2">
          <Link to="/assessments" className="hover:underline flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Assessments
          </Link>
          <span>/</span>
          <span>Attempt History</span>
        </div>
        <h1 className="text-2xl font-bold flex items-center gap-2.5">
          <History className="w-6 h-6 text-indigo-300" /> My Assessment History
        </h1>
        <p className="text-indigo-100 text-sm mt-1 max-w-xl">
          Track all your completed and recorded skill assessment attempts and review past results.
        </p>
      </div>

      {/* Attempts List */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        {attempts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-300 rounded-2xl">
            <Award className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Attempts Recorded</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              You haven't taken any skill assessments yet. Complete tests to earn verified skill badges.
            </p>
            <Link
              to="/assessments"
              className="inline-block mt-4 px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors"
            >
              Browse Assessments
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {attempts.map((att) => (
              <div
                key={att.id}
                className="py-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/70 rounded-2xl px-3 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-slate-900">{att.assessment.title}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                      {att.assessment.skill.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> Started: {new Date(att.startedAt).toLocaleString()}
                    </span>
                    <span>•</span>
                    <span className="font-mono uppercase text-[10px] text-slate-600">{att.status}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-sm font-bold text-slate-900 block">{att.score !== null ? `${att.score}%` : 'N/A'}</span>
                    <span className="text-[10px]">
                      {att.passed ? (
                        <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                          <CheckCircle2 className="w-3 h-3" /> Passed
                        </span>
                      ) : (
                        <span className="text-rose-600 font-bold flex items-center gap-0.5">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                    </span>
                  </div>

                  <Link
                    to={`/assessments/attempts/${att.id}/result`}
                    className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                  >
                    Review <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
