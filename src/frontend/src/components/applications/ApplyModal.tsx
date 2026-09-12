import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Send,
  FileText,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Briefcase,
} from 'lucide-react';
import { applicationApi } from '../../lib/application-api';
import { EligibilityEvaluation } from '../../types/opportunities';

interface ApplyModalProps {
  opportunity: {
    id: string;
    title: string;
    slug: string;
    opportunityType: string;
    location: string;
    companyName: string;
  };
  eligibility: EligibilityEvaluation | null;
  matchScore: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ApplyModal: React.FC<ApplyModalProps> = ({
  opportunity,
  eligibility,
  matchScore,
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [coverLetter, setCoverLetter] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const isEligible = eligibility ? eligibility.isEligible : true;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(null);
      return;
    }

    const file = e.target.files[0];
    const maxSizeBytes = 5 * 1024 * 1024; // 5MB

    if (file.size > maxSizeBytes) {
      setFileError('File size exceeds maximum limit of 5MB.');
      return;
    }

    const validExtensions = ['.pdf', '.doc', '.docx'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!validExtensions.includes(ext)) {
      setFileError('Invalid file format. Please select a PDF or Word document.');
      return;
    }

    setSelectedFile(file);
  };

  const applyMutation = useMutation({
    mutationFn: async () => {
      let resumePayload: any = undefined;

      if (selectedFile) {
        const base64Buffer = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => {
            const res = reader.result as string;
            // Strip data:mime/type;base64, prefix
            const base64 = res.split(',')[1] || res;
            resolve(base64);
          };
          reader.onerror = (error) => reject(error);
        });

        resumePayload = {
          originalFilename: selectedFile.name,
          mimeType: selectedFile.type || 'application/pdf',
          buffer: base64Buffer,
          sizeBytes: selectedFile.size,
        };
      }

      return applicationApi.apply({
        opportunityId: opportunity.id,
        coverLetter: coverLetter.trim() || undefined,
        resumeFile: resumePayload,
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['opportunities-matched'] });
      queryClient.invalidateQueries({ queryKey: ['my-applications'] });
      onClose();
      navigate(`/applications/${data.id}`);
    },
    onError: (err: any) => {
      setSubmitError(err.message || 'Failed to submit application. Please try again.');
    },
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 mb-1.5">
              <Briefcase className="w-3.5 h-3.5" /> Submit Application
            </div>
            <h2 className="text-xl font-bold text-slate-900">{opportunity.title}</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" /> {opportunity.companyName} • {opportunity.location}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Eligibility Check Banner */}
        <div>
          {isEligible ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-bold">You meet all academic eligibility prerequisites.</span>
              </div>
              {matchScore !== null && (
                <span className="px-2 py-0.5 bg-emerald-200/70 rounded font-extrabold text-[11px]">
                  {matchScore}% Match
                </span>
              )}
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-xs text-amber-900">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <XCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Eligibility Warning: Hard criteria not met</span>
              </div>
              {eligibility?.failureReasons.map((reason, idx) => (
                <p key={idx} className="text-[11px] text-amber-700 pl-6 leading-tight">
                  • {reason}
                </p>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitError(null);
            applyMutation.mutate();
          }}
          className="space-y-4"
        >
          {/* Resume Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Upload Resume / CV (.pdf, .docx, max 5MB)
            </label>
            <div className="relative border-2 border-dashed border-slate-200 hover:border-blue-400 rounded-2xl p-4 text-center cursor-pointer transition-colors bg-slate-50/60">
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center gap-1">
                <Upload className="w-5 h-5 text-slate-400" />
                {selectedFile ? (
                  <p className="text-xs font-bold text-blue-700">{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold text-slate-700">Click to select resume document</p>
                    <p className="text-[10px] text-slate-400">PDF, DOC, or DOCX up to 5MB</p>
                  </>
                )}
              </div>
            </div>
            {fileError && <p className="text-[11px] text-red-600 font-medium">{fileError}</p>}
          </div>

          {/* Cover Letter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800">
              Cover Letter &amp; Note to Recruiter (Optional)
            </label>
            <textarea
              rows={4}
              maxLength={3000}
              placeholder="Highlight relevant projects, career interests, and why you are excited for this opportunity..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Action CTAs */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!isEligible || applyMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-3.5 h-3.5" />
              {applyMutation.isPending ? 'Submitting Application...' : 'Confirm & Apply'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
