import React, { useState } from 'react';
import { X, Building, Calendar, IndianRupee, MapPin } from 'lucide-react';
import { CreatePlacementOfferPayload } from '../../lib/placement-api';
import { EmploymentType } from '../../types/placement';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreatePlacementOfferPayload) => Promise<void>;
  applicationId: string;
  candidateName?: string;
  opportunityTitle?: string;
}

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  candidateName,
  opportunityTitle,
}) => {
  const [formData, setFormData] = useState<CreatePlacementOfferPayload>({
    title: opportunityTitle ? `${opportunityTitle} Offer` : 'Full-Time Offer',
    designation: opportunityTitle || 'Software Engineer',
    employmentType: 'FULL_TIME' as EmploymentType,
    ctcAnnual: 1000000,
    baseSalaryMonthly: 75000,
    stipendMonthly: undefined,
    currency: 'INR',
    joiningDate: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
    offerExpiryDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    workLocation: 'Bengaluru, Karnataka',
    workMode: 'IN_PERSON',
    department: 'Engineering',
    description: 'We are thrilled to offer you this full-time employment position.',
    termsAndConditions: 'Standard 30-day probation period with annual performance review.',
    benefitsSummary: 'Comprehensive Health Insurance, Provident Fund, Learning Allowance.',
    contactPerson: 'Corporate Recruiter',
    contactEmail: 'talent@company.com',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Failed to create offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl border border-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Create Placement Offer</h2>
            <p className="text-xs text-slate-500">
              {candidateName ? `Issuing offer to ${candidateName}` : 'Formulate compensation & employment contract'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Offer Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Designation / Role *
              </label>
              <input
                type="text"
                required
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Employment Type
              </label>
              <select
                value={formData.employmentType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    employmentType: e.target.value as EmploymentType,
                  })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value="FULL_TIME">Full Time</option>
                <option value="INTERNSHIP_TO_JOB">Internship to Job</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="CONTRACT">Contract</option>
                <option value="PART_TIME">Part Time</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Annual CTC (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  value={formData.ctcAnnual || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ctcAnnual: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="e.g. 1200000"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Monthly Stipend (₹ INR)
              </label>
              <div className="relative">
                <IndianRupee className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="number"
                  min="0"
                  value={formData.stipendMonthly || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stipendMonthly: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="For Internships"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Expected Joining Date *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={formData.joiningDate}
                  onChange={(e) => setFormData({ ...formData, joiningDate: e.target.value })}
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Offer Expiry Date *
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="date"
                  required
                  value={formData.offerExpiryDate}
                  onChange={(e) =>
                    setFormData({ ...formData, offerExpiryDate: e.target.value })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Location
              </label>
              <div className="relative">
                <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={formData.workLocation || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, workLocation: e.target.value })
                  }
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work Mode
              </label>
              <select
                value={formData.workMode}
                onChange={(e) => setFormData({ ...formData, workMode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none bg-white"
              >
                <option value="IN_PERSON">In Person / Onsite</option>
                <option value="REMOTE">Remote</option>
                <option value="HYBRID">Hybrid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Department / Team
              </label>
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Benefits & Perks Summary
            </label>
            <input
              type="text"
              value={formData.benefitsSummary || ''}
              onChange={(e) =>
                setFormData({ ...formData, benefitsSummary: e.target.value })
              }
              placeholder="e.g. Health Insurance, Relocation Bonus, Equity"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Terms & Conditions
            </label>
            <textarea
              rows={2}
              value={formData.termsAndConditions || ''}
              onChange={(e) =>
                setFormData({ ...formData, termsAndConditions: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Draft Offer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
