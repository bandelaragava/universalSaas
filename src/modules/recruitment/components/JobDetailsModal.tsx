import React from 'react';
import { X, Briefcase, MapPin, Calendar, Users, DollarSign, Clock, CheckCircle2, Share2, Award } from 'lucide-react';
import { Job } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

interface JobDetailsModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (job: Job) => void;
  onPublish?: (id: number) => void;
  onPause?: (id: number) => void;
  onCloseJob?: (id: number) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  isOpen,
  onClose,
  onEdit,
  onPublish,
  onPause,
  onCloseJob,
}) => {
  if (!isOpen || !job) return null;

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'default';
      case 'PAUSED': return 'secondary';
      case 'CLOSED': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                {job.jobCode}
              </span>
              <Badge variant={getStatusBadgeVariant(job.status)}>
                {job.status}
              </Badge>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-2">{job.title}</h2>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mt-2">
              {job.department && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5 text-primary" /> {job.department}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-primary" /> {job.location} ({job.workMode})
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-primary" /> {job.employmentType}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-primary" /> {job.openings} {job.openings === 1 ? 'opening' : 'openings'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-sm text-foreground">
          {/* Compensation & Timeline bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-lg bg-muted/40 border border-border/60">
            <div>
              <span className="text-xs text-muted-foreground block">Salary Range</span>
              <span className="font-semibold">
                {job.minSalary ? `${job.currency} ${job.minSalary.toLocaleString()}` : 'Negotiable'}
                {job.maxSalary ? ` - ${job.currency} ${job.maxSalary.toLocaleString()}` : ''}
              </span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Experience</span>
              <span className="font-semibold">{job.experienceYears || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Application Start</span>
              <span className="font-semibold">{job.applicationStartDate || 'Immediate'}</span>
            </div>
            <div>
              <span className="text-xs text-muted-foreground block">Deadline</span>
              <span className="font-semibold text-amber-500">{job.applicationDeadline || 'Open until filled'}</span>
            </div>
          </div>

          {/* Education & Skills */}
          {(job.education || job.requiredSkills || job.preferredSkills) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Qualifications & Skills
              </h3>
              {job.education && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Education: </span>
                  <span className="text-foreground">{job.education}</span>
                </div>
              )}
              {job.requiredSkills && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Required Skills: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {job.requiredSkills.split(',').map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {job.preferredSkills && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Preferred Skills: </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {job.preferredSkills.split(',').map((skill, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-accent text-accent-foreground">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Job Description</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{job.description}</p>
            </div>
          )}

          {/* Responsibilities */}
          {job.responsibilities && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Key Responsibilities</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{job.responsibilities}</p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Requirements</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{job.requirements}</p>
            </div>
          )}

          {/* Benefits */}
          {job.benefits && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Benefits</h3>
              <p className="whitespace-pre-line text-muted-foreground leading-relaxed">{job.benefits}</p>
            </div>
          )}

          {/* Training & Certificate Requirement */}
          {job.requiresCertificate && (
            <div className="p-3.5 rounded-xl border border-amber-500/25 bg-amber-500/10 flex items-start gap-3">
              <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 block uppercase tracking-wider">
                  Training / Certificate Upload Required
                </span>
                <p className="text-xs text-muted-foreground">
                  {job.certificateInstructions || 'Candidates must upload a valid certificate or course completion document.'}
                </p>
              </div>
            </div>
          )}

          {/* Custom Questions */}
          {job.questions && job.questions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Screening Questions ({job.questions.length})
              </h3>
              <div className="space-y-1.5">
                {job.questions.map((q, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg border border-border/60 bg-muted/20 text-xs">
                    <span className="font-semibold text-foreground">Q{idx + 1}: </span>
                    <span className="text-foreground">{q.questionText}</span>
                    <span className="text-muted-foreground ml-2">({q.questionType}{q.required ? ' • Required' : ''})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <div className="text-xs text-muted-foreground">
            Applicants: <span className="font-bold text-foreground">{job.applicantCount || 0}</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs"
              onClick={() => {
                const url = `${window.location.origin}/recruitment/careers?jobId=${job.id}&apply=true`;
                if (navigator.clipboard && window.isSecureContext) {
                  navigator.clipboard.writeText(url);
                } else {
                  const textArea = document.createElement('textarea');
                  textArea.value = url;
                  textArea.style.position = 'fixed';
                  textArea.style.left = '-999999px';
                  document.body.appendChild(textArea);
                  textArea.focus();
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                }
                toast.success('Job application link copied to clipboard!', { icon: '🔗' });
              }}
            >
              <Share2 className="w-3.5 h-3.5" /> Share Apply Link
            </Button>

            {job.status !== 'PUBLISHED' && onPublish && (
              <Button size="sm" onClick={() => onPublish(job.id)}>
                Publish Job
              </Button>
            )}
            {job.status === 'PUBLISHED' && onPause && (
              <Button size="sm" variant="outline" onClick={() => onPause(job.id)}>
                Pause Job
              </Button>
            )}
            {job.status !== 'CLOSED' && onCloseJob && (
              <Button size="sm" variant="outline" className="text-red-500 hover:text-red-600" onClick={() => onCloseJob(job.id)}>
                Close Job
              </Button>
            )}
            {onEdit && (
              <Button size="sm" variant="secondary" onClick={() => { onClose(); onEdit(job); }}>
                Edit Details
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
