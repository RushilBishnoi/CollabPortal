import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  Search,
  ArrowRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { careerApi } from '../../lib/career-api';
import { CareerMatchResult } from '../../types/career-roles';

export const CareerRecommendationsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const {
    data: recommendations,
    isLoading,
    isError,
  } = useQuery<CareerMatchResult[]>({
    queryKey: ['career-recommendations'],
    queryFn: () => careerApi.getRecommendedRoles(),
  });

  const categories = React.useMemo(() => {
    if (!recommendations) return [];
    const set = new Set(recommendations.map((r) => r.careerRole.category));
    return Array.from(set);
  }, [recommendations]);

  const filteredRecommendations = React.useMemo(() => {
    if (!recommendations) return [];
    return recommendations.filter((r) => {
      const matchesSearch =
        r.careerRole.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.careerRole.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.careerRole.description && r.careerRole.description.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat = selectedCategory === 'ALL' || r.careerRole.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [recommendations, searchTerm, selectedCategory]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm font-medium">Computing deterministic career role compatibility...</p>
      </div>
    );
  }

  if (isError || !recommendations) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-lg mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
        <h3 className="text-sm font-bold text-red-900">Failed to load Career Recommendations</h3>
        <p className="text-xs text-red-600 mt-1">Please ensure your session is valid and try refreshing.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-blue-600" />
            Career Role Recommendations
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explainable matching scores calculated across {recommendations.length} industry-standard career pathways.
          </p>
        </div>
        <Link
          to="/skill-gaps"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-blue-600" /> View Skill Gap Dashboard
        </Link>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search roles by title, skill, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
            <Filter className="w-3.5 h-3.5" /> Domain:
          </span>
          <button
            onClick={() => setSelectedCategory('ALL')}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
              selectedCategory === 'ALL'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Domains ({recommendations.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Recommendations List */}
      {filteredRecommendations.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400">
          <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <h3 className="text-sm font-bold text-slate-700">No matching career roles found</h3>
          <p className="text-xs text-slate-500 mt-1">Try adjusting your keyword filter or domain selection.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRecommendations.map((rec: CareerMatchResult, index: number) => {
            const score = rec.overallScore;
            const badgeColor =
              score >= 75
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : score >= 50
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-slate-50 text-slate-700 border-slate-200';

            const progressBg =
              score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-slate-500';

            return (
              <div
                key={rec.careerRole.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
              >
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-slate-400">#{index + 1}</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                      {rec.careerRole.category}
                    </span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs text-slate-500 font-medium">
                      Min Exp: {rec.careerRole.minExperienceYears} yr(s)
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{rec.careerRole.title}</h3>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {rec.careerRole.description || 'Industry-standard role with defined proficiency benchmarks.'}
                    </p>
                  </div>

                  {/* Skills summary chips */}
                  <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {rec.skillsSummary.satisfiedCount} Satisfied
                    </span>
                    <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {rec.skillsSummary.deficitCount} Deficits
                    </span>
                    <span className="flex items-center gap-1 text-slate-600 font-semibold bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                      <HelpCircle className="w-3.5 h-3.5" />
                      {rec.skillsSummary.missingCount} Missing
                    </span>
                  </div>
                </div>

                {/* Compatibility Metric & CTA */}
                <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end justify-between gap-4 min-w-[200px] border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                  <div className="w-full text-left md:text-right">
                    <div className="flex items-center justify-between md:justify-end gap-2 mb-1.5">
                      <span className="text-xs font-semibold text-slate-500">Compatibility:</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${badgeColor}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="w-full md:w-36 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${progressBg}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>

                  <Link
                    to={`/career-roles/${rec.careerRole.slug}`}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
                  >
                    Analyze Skill Gap <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
