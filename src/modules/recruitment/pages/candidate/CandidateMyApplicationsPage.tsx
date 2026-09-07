import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  ArrowRight,
  X,
  ExternalLink,
} from 'lucide-react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { CandidateApplicationView, ApplicationStage } from '../../types/recruitment';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'react-hot-toast';

export const CandidateMyApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<CandidateApplicationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<CandidateApplicationView | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getMyApplications();
      setApplications(res || []);
    } catch (err: any) {
      toast.error('Failed to load your applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStagesOrder = (app: CandidateApplicationView | null): string[] => {
    if (!app) return ['APPLIED', 'SHORTLISTED', 'ROUND_1', 'ROUND_2', 'ROUND_3', 'SELECTED'];
    const stages = ['APPLIED', 'SHORTLISTED'];
    const roundNums = (app.roundsProgress || []).map((r) => r.roundNumber);
    const maxRound = Math.max(3, ...roundNums);
    for (let i = 1; i <= maxRound; i++) {
      stages.push(`ROUND_${i}`);
    }
    stages.push('SELECTED');
    return stages;
  };

  const getStageIndex = (stage: string, stagesOrder: string[]) => {
    if (stage === 'REJECTED' || stage === 'WITHDRAWN') return -1;
    return stagesOrder.indexOf(stage);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">My Job Applications</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Track the real-time status of your submitted job applications and interview rounds.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : applications.length === 0 ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl space-y-3">
          <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold text-foreground">You haven't submitted any applications yet.</p>
          <p>Browse available opportunities and apply to get started.</p>
          <Button size="sm" onClick={() => window.location.href = '/recruitment/careers'} className="text-xs">
            Browse Open Jobs
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Applications List */}
          <div className="lg:col-span-1 space-y-3">
            {applications.map((app) => {
              const isSelected = selectedApp?.id === app.id;
              const isRejected = app.currentStage === 'REJECTED';
              const isSelectedCandidate = app.currentStage === 'SELECTED';

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedApp(app)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all text-left space-y-2.5 ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border/80 bg-card hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground line-clamp-1">{app.jobTitle}</h3>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isRejected
                          ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                          : isSelectedCandidate
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}
                    >
                      {app.currentStage.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="font-mono text-[11px]">{app.jobCode} • {app.department || 'General'}</div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      Applied: {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Application Detail & Visual Tracker */}
          <div className="lg:col-span-2">
            {!selectedApp ? (
              <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl h-full flex flex-col items-center justify-center">
                <Briefcase className="w-8 h-8 text-muted-foreground/40 mb-2" />
                Select an application from the list to view its progress tracker.
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-6">
                {/* Header */}
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-primary font-mono">
                      {selectedApp.jobCode}
                    </span>
                    <h2 className="text-xl font-bold text-foreground mt-0.5">{selectedApp.jobTitle}</h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      {selectedApp.department} • {selectedApp.location} ({selectedApp.workMode})
                    </p>
                  </div>

                  {selectedApp.resumeUrl && (
                    <a
                      href={selectedApp.resumeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-muted/30 text-xs font-semibold hover:bg-muted transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      Resume <ExternalLink className="w-3 h-3 text-muted-foreground" />
                    </a>
                  )}
                </div>

                {/* Visual Pipeline Progress */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Application Lifecycle Progress
                  </h3>

                  {selectedApp.currentStage === 'REJECTED' ? (
                    <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm">
                        <XCircle className="w-4 h-4" /> Application Not Selected
                      </div>
                      <p className="text-rose-600/90 dark:text-rose-400/90">
                        Thank you for taking the time to interview with us. While this role is not a match at this time, your profile will remain in our talent pool for future opportunities.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-muted/20 border border-border/80">
                      {(() => {
                        const stagesOrder = getStagesOrder(selectedApp);
                        const currentIdx = getStageIndex(selectedApp.currentStage, stagesOrder);
                        return (
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 relative">
                            {stagesOrder.map((stage, idx) => {
                              const isDone = currentIdx >= idx;
                              const isCurrent = currentIdx === idx;

                              return (
                                <React.Fragment key={stage}>
                                  <div className="flex flex-col items-center text-center">
                                    <div
                                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                                        isDone
                                          ? 'bg-primary text-primary-foreground shadow-xs'
                                          : 'bg-muted text-muted-foreground border border-border'
                                      }`}
                                    >
                                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                                    </div>
                                    <span
                                      className={`text-[11px] font-semibold mt-1.5 ${
                                        isCurrent
                                          ? 'text-primary'
                                          : isDone
                                          ? 'text-foreground'
                                          : 'text-muted-foreground'
                                      }`}
                                    >
                                      {stage.replace('_', ' ')}
                                    </span>
                                  </div>

                                  {idx < stagesOrder.length - 1 && (
                                    <div
                                      className={`hidden sm:block flex-1 h-0.5 mx-2 ${
                                        currentIdx > idx ? 'bg-primary' : 'bg-border'
                                      }`}
                                    />
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>

                {/* Interview Rounds Status (Exposing ONLY candidate-safe status) */}
                {selectedApp.roundsProgress && selectedApp.roundsProgress.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Interview Rounds Schedule
                    </h3>
                    <div className="space-y-2">
                      {selectedApp.roundsProgress.map((round, rIdx) => (
                        <div
                          key={rIdx}
                          className="flex items-center justify-between p-3.5 rounded-lg border border-border/70 bg-card text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                              {round.roundNumber}
                            </span>
                            <div>
                              <h4 className="font-semibold text-foreground">{round.roundName}</h4>
                              {round.scheduledAt && (
                                <span className="text-[11px] text-muted-foreground">
                                  Scheduled: {new Date(round.scheduledAt).toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>

                          <div>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                                round.status === 'PASSED'
                                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                  : round.status === 'FAILED'
                                  ? 'bg-rose-500/10 text-rose-600 border-rose-500/20'
                                  : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                              }`}
                            >
                              {round.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
