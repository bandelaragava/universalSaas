import React, { useState } from 'react';
import {
  X,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  Code,
  FileText,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  PlusCircle,
  Award,
  ExternalLink,
} from 'lucide-react';
import { JobApplication, InterviewRound, InterviewStatus, InterviewRoundType } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScheduleRoundModal } from './ScheduleRoundModal';
import { RoundFeedbackModal } from './RoundFeedbackModal';
import { toast } from 'react-hot-toast';

interface ApplicantDetailsModalProps {
  application: JobApplication | null;
  isOpen: boolean;
  onClose: () => void;
  onShortlist: (id: number) => Promise<void>;
  onReject: (id: number, reason: string) => Promise<void>;
  onSelect: (id: number) => Promise<void>;
  onScheduleRound: (applicationId: number, data: any) => Promise<void>;
  onUpdateFeedback: (roundId: number, data: any) => Promise<void>;
}

export const ApplicantDetailsModal: React.FC<ApplicantDetailsModalProps> = ({
  application,
  isOpen,
  onClose,
  onShortlist,
  onReject,
  onSelect,
  onScheduleRound,
  onUpdateFeedback,
}) => {
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [feedbackRound, setFeedbackRound] = useState<InterviewRound | null>(null);
  const [rejectPromptOpen, setRejectPromptOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  if (!isOpen || !application) return null;

  const rounds = application.interviewRounds || [];
  const nextRoundNumber = rounds.length + 1;

  const handleShortlist = async () => {
    setActionLoading(true);
    try {
      await onShortlist(application.id);
      toast.success('Applicant shortlisted');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to shortlist');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    setActionLoading(true);
    try {
      await onReject(application.id, rejectionReason);
      setRejectPromptOpen(false);
      setRejectionReason('');
      toast.success('Application marked as rejected');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSelect = async () => {
    setActionLoading(true);
    try {
      await onSelect(application.id);
      toast.success('Applicant selected successfully!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to select');
    } finally {
      setActionLoading(false);
    }
  };

  const getStageBadge = (stage: string) => {
    switch (stage) {
      case 'SELECTED': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30';
      case 'REJECTED': return 'bg-rose-500/10 text-rose-600 border-rose-500/30';
      case 'SHORTLISTED': return 'bg-blue-500/10 text-blue-600 border-blue-500/30';
      case 'APPLIED': return 'bg-amber-500/10 text-amber-600 border-amber-500/30';
      default: return 'bg-purple-500/10 text-purple-600 border-purple-500/30';
    }
  };

  const getRoundStatusBadge = (status: InterviewStatus) => {
    switch (status) {
      case 'PASSED':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20"><CheckCircle2 className="w-3 h-3" /> Passed</span>;
      case 'FAILED':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20"><XCircle className="w-3 h-3" /> Failed</span>;
      case 'SCHEDULED':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20"><Clock className="w-3 h-3" /> Scheduled</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border border-border">Cancelled</span>;
      default:
        return <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-muted/30">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{application.fullName}</h2>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getStageBadge(application.currentStage)}`}>
                {application.currentStage}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Applied for <span className="font-semibold text-foreground">{application.jobTitle}</span> ({application.jobCode})
              {application.department ? ` • ${application.department}` : ''}
              {application.applicationDate ? ` • ${new Date(application.applicationDate).toLocaleDateString()}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-3 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Applicant Actions:</span>
            {application.currentStage === 'APPLIED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-blue-500/40 text-blue-600 hover:bg-blue-50" onClick={handleShortlist} disabled={actionLoading}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Shortlist
              </Button>
            )}

            {application.currentStage !== 'REJECTED' && application.currentStage !== 'SELECTED' && (
              <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setScheduleModalOpen(true)} disabled={actionLoading}>
                <PlusCircle className="w-3.5 h-3.5" /> Schedule Round {nextRoundNumber}
              </Button>
            )}

            {application.currentStage !== 'SELECTED' && application.currentStage !== 'REJECTED' && (
              <Button size="sm" variant="default" className="h-7 text-xs gap-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleSelect} disabled={actionLoading}>
                <Award className="w-3.5 h-3.5" /> Select Candidate
              </Button>
            )}

            {application.currentStage !== 'REJECTED' && (
              <Button size="sm" variant="outline" className="h-7 text-xs text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setRejectPromptOpen(true)} disabled={actionLoading}>
                <XCircle className="w-3.5 h-3.5" /> Reject
              </Button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {application.resumeUrl && (
              <a
                href={application.resumeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                View Resume ({application.resumeOriginalName || 'Resume.pdf'})
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}

            {application.certificateUrl && (
              <a
                href={application.certificateUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 transition-colors"
              >
                <Award className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                View Certificate ({application.certificateOriginalName || 'Certificate'})
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </a>
            )}
          </div>
        </div>

        {/* Reject reason inline form */}
        {rejectPromptOpen && (
          <div className="p-4 bg-rose-500/10 border-b border-rose-500/20 flex flex-col gap-2">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Specify Rejection Reason (optional):</span>
            <div className="flex gap-2">
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Insufficient technical experience in Spring Boot"
                className="flex-1 text-xs px-3 py-1.5 rounded-md border border-input bg-background"
              />
              <Button size="sm" variant="destructive" className="h-8 text-xs" onClick={handleReject} disabled={actionLoading}>
                Confirm Rejection
              </Button>
              <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setRejectPromptOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Content Body */}
        <div className="overflow-y-auto p-6 space-y-6 flex-1 text-sm text-foreground">
          {/* Section: Personal Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-lg bg-muted/30 border border-border/50 text-xs">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{application.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{application.phone || 'Not provided'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                <span>{application.location || 'Not provided'}</span>
              </div>
            </div>
          </div>

          {/* Section: Experience & Education */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Experience */}
            <div className="p-4 rounded-lg border border-border/60 bg-muted/20 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-primary" /> Work Experience
              </h3>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-semibold text-foreground">Type: </span>
                  <span className="text-muted-foreground">{application.experienceType}</span>
                  {application.totalExperienceYears ? ` (${application.totalExperienceYears} years)` : ''}
                </div>
                {application.previousCompany && (
                  <div>
                    <span className="font-semibold text-foreground">Previous Company: </span>
                    <span className="text-muted-foreground">{application.previousCompany}</span>
                  </div>
                )}
                {application.previousRole && (
                  <div>
                    <span className="font-semibold text-foreground">Previous Role: </span>
                    <span className="text-muted-foreground">{application.previousRole}</span>
                  </div>
                )}
                {application.experienceDetails && (
                  <p className="mt-2 text-muted-foreground whitespace-pre-line border-t border-border/40 pt-1.5">
                    {application.experienceDetails}
                  </p>
                )}
              </div>
            </div>

            {/* Education */}
            <div className="p-4 rounded-lg border border-border/60 bg-muted/20 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary" /> Education
              </h3>
              <div className="text-xs space-y-1">
                <div>
                  <span className="font-semibold text-foreground">Degree: </span>
                  <span className="text-muted-foreground">{application.degree || 'Not provided'}</span>
                </div>
                {application.institution && (
                  <div>
                    <span className="font-semibold text-foreground">Institution: </span>
                    <span className="text-muted-foreground">{application.institution}</span>
                  </div>
                )}
                {application.graduationYear && (
                  <div>
                    <span className="font-semibold text-foreground">Graduation Year: </span>
                    <span className="text-muted-foreground">{application.graduationYear}</span>
                  </div>
                )}
                {application.educationDetails && (
                  <p className="mt-2 text-muted-foreground whitespace-pre-line border-t border-border/40 pt-1.5">
                    {application.educationDetails}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Skills */}
          {(application.technicalSkills || application.otherSkills) && (
            <div className="p-4 rounded-lg border border-border/60 bg-muted/20 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-primary" /> Candidate Skills
              </h3>
              {application.technicalSkills && (
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Technical:</span>
                  {application.technicalSkills.split(',').map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-primary/10 text-primary font-medium">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}
              {application.otherSkills && (
                <div className="flex flex-wrap gap-1.5 items-center mt-1">
                  <span className="text-xs font-medium text-muted-foreground mr-1">Other:</span>
                  {application.otherSkills.split(',').map((s, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                      {s.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Screening Answers */}
          {application.answers && application.answers.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Screening Questions & Responses ({application.answers.length})
              </h3>
              <div className="space-y-2">
                {application.answers.map((a, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border/60 bg-card text-xs space-y-1">
                    <p className="font-semibold text-foreground">
                      Q: {a.questionText || `Question #${idx + 1}`}
                    </p>
                    <p className="text-primary font-medium pl-2 border-l-2 border-primary">
                      A: {a.answerText || 'No answer provided'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section: Interview History */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-primary" /> Complete Interview History
              </h3>
              <span className="text-xs text-muted-foreground">Total Rounds: {rounds.length}</span>
            </div>

            {rounds.length === 0 ? (
              <div className="p-4 rounded-lg border border-dashed border-border text-center text-xs text-muted-foreground">
                No interview rounds scheduled yet. Click <strong>"Schedule Round 1"</strong> above to begin.
              </div>
            ) : (
              <div className="space-y-3">
                {rounds.map((round) => (
                  <div
                    key={round.id}
                    className="p-4 rounded-lg border border-border bg-card/80 shadow-xs space-y-2.5 transition-all hover:border-primary/40"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold">
                          {round.roundNumber}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-foreground">{round.roundName}</h4>
                          <span className="text-xs text-muted-foreground">
                            Type: {round.roundType}
                            {round.interviewer ? ` • Interviewer: ${round.interviewer}` : ''}
                            {round.scheduledAt ? ` • Scheduled: ${new Date(round.scheduledAt).toLocaleString()}` : ''}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getRoundStatusBadge(round.status)}
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs"
                          onClick={() => setFeedbackRound(round)}
                        >
                          Record Feedback
                        </Button>
                      </div>
                    </div>

                    {(round.feedback || round.score !== undefined) && (
                      <div className="p-2.5 rounded-md bg-muted/40 border border-border/40 text-xs space-y-1">
                        {round.score !== undefined && (
                          <div className="font-semibold text-foreground">
                            Score: <span className="text-primary font-bold">{round.score} / 10</span>
                          </div>
                        )}
                        {round.feedback && (
                          <p className="text-muted-foreground whitespace-pre-line">
                            Feedback: {round.feedback}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
          <span className="text-xs text-muted-foreground">
            Status: <span className="font-bold text-foreground">{application.status}</span>
          </span>
          <Button variant="outline" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>

      {/* Schedule Interview Modal */}
      <ScheduleRoundModal
        isOpen={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        nextRoundNumber={nextRoundNumber}
        candidateName={application.fullName}
        onSchedule={async (data) => {
          await onScheduleRound(application.id, data);
        }}
      />

      {/* Round Feedback Modal */}
      <RoundFeedbackModal
        isOpen={!!feedbackRound}
        onClose={() => setFeedbackRound(null)}
        round={feedbackRound}
        candidateName={application.fullName}
        onSubmit={async (roundId, data) => {
          await onUpdateFeedback(roundId, data);
        }}
      />
    </div>
  );
};
