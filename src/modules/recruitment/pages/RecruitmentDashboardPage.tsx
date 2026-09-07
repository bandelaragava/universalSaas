import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  ChevronRight,
  TrendingUp,
  PlusCircle,
  FileSearch,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../services/recruitmentApi';
import { RecruitmentDashboardData, Job } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { JobFormModal } from '../components/JobFormModal';
import { toast } from 'react-hot-toast';

export const RecruitmentDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<RecruitmentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getDashboardMetrics();
      setData(res);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load recruitment dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Recruitment Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor applicant pipelines, hiring stages, and active interview rounds across your organization.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/recruitment/pipeline')}
            className="text-xs gap-1.5"
          >
            <TrendingUp className="w-3.5 h-3.5" /> View Pipeline
          </Button>
          <Button
            size="sm"
            onClick={() => setJobModalOpen(true)}
            className="text-xs gap-1.5"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Post New Job
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : !data ? (
        <div className="p-8 text-center text-muted-foreground bg-card border border-border rounded-xl">
          Unable to load metrics. Please try again.
        </div>
      ) : (
        <>
          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            {/* Total Jobs */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Total Jobs</span>
                <Briefcase className="w-4 h-4 text-primary" />
              </div>
              <div className="text-2xl font-bold text-foreground">{data.totalJobs}</div>
              <span className="text-[11px] text-emerald-600 font-medium">
                {data.publishedJobs} Published
              </span>
            </div>

            {/* Total Applicants */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Applicants</span>
                <Users className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{data.totalApplicants}</div>
              <span className="text-[11px] text-muted-foreground">Overall applied</span>
            </div>

            {/* Shortlisted */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Shortlisted</span>
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{data.shortlistedCount}</div>
              <span className="text-[11px] text-indigo-600 font-medium">Screening passed</span>
            </div>

            {/* In Interview */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">In Interview</span>
                <Clock className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-2xl font-bold text-foreground">{data.inInterviewCount}</div>
              <span className="text-[11px] text-purple-600 font-medium">Rounds ongoing</span>
            </div>

            {/* Selected */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Selected</span>
                <Award className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-foreground text-emerald-600">{data.selectedCount}</div>
              <span className="text-[11px] text-emerald-600 font-medium">Hired candidates</span>
            </div>

            {/* Rejected */}
            <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Rejected</span>
                <XCircle className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-bold text-foreground text-rose-600">{data.rejectedCount}</div>
              <span className="text-[11px] text-rose-600 font-medium">Closed applications</span>
            </div>
          </div>

          {/* Section 7: Job Recruitment Pipelines Table */}
          <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div>
                <h3 className="text-sm font-bold text-foreground">Active Recruitment Pipelines by Job</h3>
                <p className="text-xs text-muted-foreground">
                  Breakdown of candidate progress across interview rounds and selection stages.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/recruitment/jobs')}
                className="text-xs text-primary"
              >
                Manage All Jobs <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>

            {(!data.jobPipelines || data.jobPipelines.length === 0) ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No jobs found. Click "Post New Job" above to create your first opening.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[11px] border-b border-border">
                    <tr>
                      <th className="px-6 py-3">Job Title & Code</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Total Applicants</th>
                      <th className="px-4 py-3 text-center">Shortlisted</th>
                      <th className="px-4 py-3 text-center">Round 1</th>
                      <th className="px-4 py-3 text-center">Round 2</th>
                      <th className="px-4 py-3 text-center">Round 3</th>
                      <th className="px-4 py-3 text-center">Selected</th>
                      <th className="px-4 py-3 text-center">Rejected</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {data.jobPipelines.map((pipeline) => (
                      <tr key={pipeline.jobId} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-3.5">
                          <div className="font-semibold text-foreground">{pipeline.jobTitle}</div>
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {pipeline.jobCode} {pipeline.department ? `• ${pipeline.department}` : ''}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            pipeline.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                              : 'bg-muted text-muted-foreground border border-border'
                          }`}>
                            {pipeline.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-foreground">
                          {pipeline.totalApplicants}
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-blue-600">
                          {pipeline.shortlisted}
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-purple-600">
                          {pipeline.round1}
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-purple-600">
                          {pipeline.round2}
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-purple-600">
                          {pipeline.round3}
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-emerald-600">
                          {pipeline.selected}
                        </td>
                        <td className="px-4 py-3.5 text-center font-medium text-rose-600">
                          {pipeline.rejected}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => navigate(`/recruitment/pipeline?jobId=${pipeline.jobId}`)}
                          >
                            Open Pipeline
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section: Recent Applications */}
          {data.recentApplications && data.recentApplications.length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Recent Candidate Submissions</h3>
                  <p className="text-xs text-muted-foreground">
                    Latest applicants received across active jobs.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/recruitment/applications')}
                  className="text-xs text-primary"
                >
                  View All Candidates <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="divide-y divide-border/60">
                {data.recentApplications.map((app) => (
                  <div key={app.id} className="flex flex-wrap items-center justify-between px-6 py-3.5 hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground text-xs">{app.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {app.email} • Applied for <span className="text-foreground font-medium">{app.jobTitle}</span>
                        {app.experienceType ? ` • ${app.experienceType}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {app.currentStage}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-primary"
                        onClick={() => navigate(`/recruitment/applications?candidateId=${app.id}`)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Job Modal */}
      <JobFormModal
        isOpen={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        onSubmit={async (data) => {
          await recruitmentApi.createJob(data);
          toast.success('Job created successfully');
          fetchDashboard();
        }}
      />
    </div>
  );
};
