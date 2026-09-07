import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Briefcase,
  Users,
  ChevronRight,
  Eye,
  CheckCircle2,
  XCircle,
  PlusCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { recruitmentApi } from '../services/recruitmentApi';
import { Job, JobPipelineData, JobApplication, ApplicationStage } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { ApplicantDetailsModal } from '../components/ApplicantDetailsModal';
import { toast } from 'react-hot-toast';

export const RecruitmentPipelinePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<number | null>(() => {
    const p = searchParams.get('jobId');
    return p ? Number(p) : null;
  });

  const [pipelineData, setPipelineData] = useState<JobPipelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeStage, setActiveStage] = useState<string>('APPLIED');

  // Applicant details modal
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplication | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // 1. Fetch all jobs for dropdown
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await recruitmentApi.getJobs({ size: 100 });
        const list: Job[] = res?.content || [];
        setJobs(list);
        if (!selectedJobId && list.length > 0) {
          setSelectedJobId(list[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load jobs list', err);
      }
    };
    loadJobs();
  }, []);

  // 2. Fetch pipeline when selectedJobId changes
  const loadPipeline = async (jobId: number) => {
    setLoading(true);
    try {
      const p = await recruitmentApi.getJobPipeline(jobId);
      setPipelineData(p);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      setSearchParams({ jobId: String(selectedJobId) });
      loadPipeline(selectedJobId);
    }
  }, [selectedJobId]);

  const handleOpenApplicant = async (appId: number) => {
    try {
      const full = await recruitmentApi.getApplicationById(appId);
      setSelectedApplicant(full);
      setDetailsModalOpen(true);
    } catch (err: any) {
      toast.error('Failed to load applicant profile');
    }
  };

  // Dynamically generate all stages in the pipeline to support unlimited rounds
  const stagesPipeline = React.useMemo(() => {
    const list = [
      { key: 'APPLIED', label: 'Applied', color: 'text-amber-600 bg-amber-500/10 border-amber-500/30' },
      { key: 'SHORTLISTED', label: 'Shortlisted', color: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
    ];

    // Find the maximum round number present across candidates or default to at least Round 1, 2, 3
    let maxRound = 3;
    if (pipelineData?.stageCandidates) {
      Object.keys(pipelineData.stageCandidates).forEach((k) => {
        const match = k.match(/^ROUND_(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxRound) {
            maxRound = num;
          }
        }
      });
    }

    for (let r = 1; r <= maxRound; r++) {
      list.push({
        key: `ROUND_${r}`,
        label: `Round ${r}`,
        color: 'text-purple-600 bg-purple-500/10 border-purple-500/30',
      });
    }

    list.push({ key: 'SELECTED', label: 'Selected', color: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' });
    list.push({ key: 'REJECTED', label: 'Rejected', color: 'text-rose-600 bg-rose-500/10 border-rose-500/30' });

    return list;
  }, [pipelineData]);

  const getStageCount = (key: string): number => {
    if (!pipelineData) return 0;
    if (pipelineData.stageCandidates && pipelineData.stageCandidates[key]) {
      return pipelineData.stageCandidates[key].length;
    }
    switch (key) {
      case 'APPLIED':
        return (pipelineData.stageCandidates?.['APPLIED'] || []).length;
      case 'SHORTLISTED':
        return pipelineData.shortlisted;
      case 'ROUND_1':
        return pipelineData.round1;
      case 'ROUND_2':
        return pipelineData.round2;
      case 'ROUND_3':
        return pipelineData.round3;
      case 'SELECTED':
        return pipelineData.selected;
      case 'REJECTED':
        return pipelineData.rejected;
      default:
        return (pipelineData.stageCandidates?.[key] || []).length;
    }
  };

  const currentStageCandidates = pipelineData?.stageCandidates?.[activeStage] || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header with Job Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Recruitment Pipeline</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visual stage progression: Applied → Shortlisted → Round 1 → Round 2 → Round 3 → Selected
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Select Job:</label>
          <select
            value={selectedJobId || ''}
            onChange={(e) => setSelectedJobId(Number(e.target.value))}
            className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium shadow-xs focus:ring-1 focus:ring-primary max-w-xs"
          >
            {jobs.map((j) => (
              <option key={j.id} value={j.id}>
                {j.title} ({j.jobCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !pipelineData ? (
        <div className="p-12 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl">
          Please select a job opening to view its recruitment pipeline.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Visual Pipeline Stage Flow Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
            {stagesPipeline.map((st, idx) => {
              const count = getStageCount(st.key);
              const isActive = activeStage === st.key;

              return (
                <button
                  key={st.key}
                  onClick={() => setActiveStage(st.key)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                    isActive
                      ? `${st.color} shadow-md ring-2 ring-primary/40`
                      : 'bg-card border-border/70 text-muted-foreground hover:border-primary/40 hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase">{st.label}</span>
                    <span className="text-xs font-mono font-bold">{count}</span>
                  </div>
                  <div className="mt-3 text-lg font-extrabold text-foreground">
                    {count} <span className="text-[10px] font-normal text-muted-foreground">candidates</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Candidates in Selected Stage */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <span>Candidates in Stage:</span>
                  <span className="text-primary uppercase tracking-wider">{activeStage.replace('_', ' ')}</span>
                  <span className="text-xs font-normal text-muted-foreground">({currentStageCandidates.length})</span>
                </h3>
              </div>
              <span className="text-xs text-muted-foreground">
                Click <strong>"View"</strong> to inspect candidate details or advance rounds.
              </span>
            </div>

            {currentStageCandidates.length === 0 ? (
              <div className="p-12 text-center text-xs text-muted-foreground">
                No applicants currently in stage <strong>{activeStage.replace('_', ' ')}</strong>.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[11px] border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Candidate</th>
                      <th className="px-4 py-3">Experience</th>
                      <th className="px-4 py-3">Contact</th>
                      <th className="px-4 py-3">Applied Date</th>
                      <th className="px-4 py-3 text-center">Current Status</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {currentStageCandidates.map((candidate) => (
                      <tr key={candidate.id} className="hover:bg-muted/20 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-foreground text-sm">{candidate.fullName}</div>
                          <div className="text-[11px] text-muted-foreground">{candidate.email}</div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-foreground font-medium">{candidate.experienceType}</div>
                          <span className="text-[11px] text-muted-foreground">
                            {candidate.totalExperienceYears ? `${candidate.totalExperienceYears} yrs` : 'Entry level'}
                            {candidate.previousCompany ? ` • ${candidate.previousCompany}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="text-foreground">{candidate.phone || 'N/A'}</div>
                          <span className="text-[11px] text-muted-foreground">{candidate.location || ''}</span>
                        </td>
                        <td className="px-4 py-3.5 text-muted-foreground">
                          {candidate.applicationDate ? new Date(candidate.applicationDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            {candidate.status}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            onClick={() => handleOpenApplicant(candidate.id)}
                          >
                            <Eye className="w-3.5 h-3.5" /> View Profile
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Applicant Details Modal */}
      <ApplicantDetailsModal
        application={selectedApplicant}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onShortlist={async (id) => {
          await recruitmentApi.shortlistApplication(id);
          if (selectedJobId) loadPipeline(selectedJobId);
          handleOpenApplicant(id);
        }}
        onReject={async (id, reason) => {
          await recruitmentApi.rejectApplication(id, reason);
          if (selectedJobId) loadPipeline(selectedJobId);
          handleOpenApplicant(id);
        }}
        onSelect={async (id) => {
          await recruitmentApi.selectApplication(id);
          if (selectedJobId) loadPipeline(selectedJobId);
          handleOpenApplicant(id);
        }}
        onScheduleRound={async (appId, data) => {
          await recruitmentApi.scheduleRound(appId, data);
          toast.success('Interview round scheduled');
          if (selectedJobId) loadPipeline(selectedJobId);
          handleOpenApplicant(appId);
        }}
        onUpdateFeedback={async (roundId, data) => {
          await recruitmentApi.updateRoundFeedback(roundId, data);
          toast.success('Interview evaluation saved');
          if (selectedJobId) loadPipeline(selectedJobId);
          if (selectedApplicant) handleOpenApplicant(selectedApplicant.id);
        }}
      />
    </div>
  );
};
