import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { assessmentApi } from '../../lib/assessment-api';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import {
  Award,
  Clock,
  CheckCircle2,
  BookOpen,
  ArrowRight,
  History,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const AssessmentsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: assessments = [], isLoading, isError } = useQuery({
    queryKey: ['assessmentsList'],
    queryFn: () => assessmentApi.listAssessments(),
  });

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Loading skill verification assessments…" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-800">
        <h3 className="font-bold">Error loading assessments</h3>
        <p className="text-sm">Unable to load the list of available skill assessments.</p>
      </div>
    );
  }

  const filteredAssessments = assessments.filter(
    (a) =>
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.skill.category?.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-700 rounded-3xl p-6 sm:p-8 text-white shadow-md">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-indigo-200 text-xs font-semibold mb-2">
              <Link to="/portal/student" className="hover:underline">
                Student Portal
              </Link>
              <span>/</span>
              <span>Skill Verification Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-emerald-300" /> Verified Skill Assessments
            </h1>
            <p className="text-indigo-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Take timed multiple-choice assessments to earn official Verified Skill badges on your profile.
              Verified proficiencies dramatically increase recruiter match visibility.
            </p>
          </div>

          <Link
            to="/assessments/my-attempts"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition-colors"
          >
            <History className="w-4 h-4" /> My Attempt History
          </Link>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by skill name or domain..."
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Showing {filteredAssessments.length} assessments
        </span>
      </div>

      {/* Assessments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssessments.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-white border border-dashed border-slate-300 rounded-3xl">
            <BookOpen className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">No Assessments Found</h3>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search keyword or check back as new assessments are added.
            </p>
          </div>
        ) : (
          filteredAssessments.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {item.skill.category?.name || 'Technical'}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> {item.durationMinutes} mins
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 leading-snug">{item.title}</h3>
                <p className="text-xs text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                  {item.description || 'Test and verify your competence in this canonical skill.'}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                    Passing Criteria
                  </span>
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {item.passingScore}% or higher
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/assessments/${item.id}/take`)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Award className="w-3.5 h-3.5" /> Start Test <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
