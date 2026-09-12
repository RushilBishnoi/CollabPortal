import React from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  ExternalLink,
  Award,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { SkillRemediationItem } from '../../types/learning';

interface SkillRemediationCardProps {
  remediation: SkillRemediationItem;
}

export const SkillRemediationCard: React.FC<SkillRemediationCardProps> = ({
  remediation,
}) => {
  const isMissing = remediation.status === 'MISSING';

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-all duration-200">
      {/* Skill Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h4 className="font-bold text-slate-900 text-base">
              {remediation.skillName}
            </h4>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                isMissing
                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                  : 'bg-amber-50 text-amber-700 border border-amber-200'
              }`}
            >
              {isMissing ? 'Missing Skill' : 'Skill Deficit'}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {remediation.currentProficiency ? (
              <>
                Current: <strong className="text-slate-700">{remediation.currentProficiency}</strong> → Target:{' '}
                <strong className="text-brand-700">{remediation.targetProficiency}</strong>
              </>
            ) : (
              <>
                Required Proficiency: <strong className="text-brand-700">{remediation.targetProficiency}</strong>
              </>
            )}
          </p>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>~{remediation.estimatedHours} hrs</span>
        </div>
      </div>

      {/* Curated Resources List */}
      <div className="mb-4">
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-brand-600" />
          Recommended Curated Modules ({remediation.resources.length})
        </h5>

        {remediation.resources.length > 0 ? (
          <div className="space-y-2">
            {remediation.resources.slice(0, 3).map((res) => (
              <div
                key={res.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100/80 transition-colors"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-medium text-slate-900 truncate">
                    {res.isVerified && <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />}
                    <span className="truncate">{res.title}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{res.resourceType} • {res.difficulty}</span>
                </div>
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-md text-brand-600 hover:text-brand-800 hover:bg-white transition-colors"
                  title="Study Resource"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">
            Self-study materials being curated by faculty & industry mentors.
          </p>
        )}
      </div>

      {/* Post-Learning Verification CTA & Mentor Guidance */}
      <div className="space-y-2 mt-4 pt-3 border-t border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Link
            to={`/mentorship/mentors?skillId=${encodeURIComponent(remediation.skillId)}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1.5 rounded-xl transition-colors w-fit"
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Find a Mentor for this Skill Gap →</span>
          </Link>
        </div>

        {remediation.linkedAssessment ? (
          <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-brand-500/10 border border-emerald-200/60 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Ready to verify this skill?
                </p>
                <p className="text-[11px] text-slate-600">
                  Pass &quot;{remediation.linkedAssessment.title}&quot; to earn a verified skill badge.
                </p>
              </div>
            </div>
            <Link
              to={`/assessments/${remediation.linkedAssessment.id}/take`}
              className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <span>Take Test</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <span>Verification assessment available in Skill Assessments catalog.</span>
          </div>
        )}
      </div>
    </div>
  );
};
