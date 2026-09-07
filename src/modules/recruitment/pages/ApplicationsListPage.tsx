import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Users,
  Eye,
  FileText,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { recruitmentApi } from '../services/recruitmentApi';
import { Job, JobApplication, ApplicationStage, ApplicationStatus } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ApplicantDetailsModal } from '../components/ApplicantDetailsModal';
import { toast } from 'react-hot-toast';

export const ApplicationsListPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [query, setQuery] = useState('');
  const [jobId, setJobId] = useState<number | ''>(() => {
    const p = searchParams.get('jobId');
    return p ? Number(p) : '';
  });
  const [stage, setStage] = useState<ApplicationStage | ''>('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modal
  const [selectedApplicant, setSelectedApplicant] = useState<JobApplication | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  // Check if candidateId was passed via url query
  useEffect(() => {
    const candidateIdParam = searchParams.get('candidateId');
    if (candidateIdParam) {
      handleOpenApplicant(Number(candidateIdParam));
    }
  }, [searchParams]);

  useEffect(() => {
    const loadJobs = async () => {
      try {
        const res = await recruitmentApi.getJobs({ size: 100 });
        setJobs(res?.content || []);
      } catch (err: any) {
        console.error('Failed to load jobs for filter', err);
      }
    };
    loadJobs();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getApplications({
        query: query || undefined,
        jobId: jobId ? Number(jobId) : undefined,
        stage: stage ? (stage as ApplicationStage) : undefined,
        status: status ? (status as ApplicationStatus) : undefined,
        page,
        size: 10,
      });
      setApplications(res?.content || []);
      setTotalPages(res?.totalPages || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [page, jobId, stage, status]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchApplications();
  };

  const handleOpenApplicant = async (appId: number) => {
    try {
      const full = await recruitmentApi.getApplicationById(appId);
      setSelectedApplicant(full);
      setDetailsModalOpen(true);
    } catch (err: any) {
      toast.error('Failed to load applicant profile');
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Job Applications</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Review, screen, and manage candidates across all positions.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search candidate by name, email, phone..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:w-auto">
            <select
              value={jobId}
              onChange={(e) => {
                setJobId(e.target.value ? Number(e.target.value) : '');
                setPage(0);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <option value="">All Jobs</option>
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>

            <select
              value={stage}
              onChange={(e) => {
                setStage(e.target.value as ApplicationStage | '');
                setPage(0);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <option value="">All Stages</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="ROUND_1">Round 1</option>
              <option value="ROUND_2">Round 2</option>
              <option value="ROUND_3">Round 3</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as ApplicationStatus | '');
                setPage(0);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="IN_INTERVIEW">In Interview</option>
              <option value="SELECTED">Selected</option>
              <option value="REJECTED">Rejected</option>
            </select>

            <Button type="submit" size="sm" variant="secondary" className="text-xs col-span-2 sm:col-span-1">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Applications Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
            <Users className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p>No candidate applications match your criteria.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery('');
                setJobId('');
                setStage('');
                setStatus('');
                setPage(0);
                fetchApplications();
              }}
              className="text-xs"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-muted/40 text-muted-foreground uppercase font-semibold text-[11px] border-b border-border">
                <tr>
                  <th className="px-6 py-3">Applicant Name</th>
                  <th className="px-4 py-3">Position</th>
                  <th className="px-4 py-3">Experience</th>
                  <th className="px-4 py-3">Applied Date</th>
                  <th className="px-4 py-3 text-center">Stage</th>
                  <th className="px-4 py-3 text-center">Resume</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-foreground text-sm">{app.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">{app.email}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground font-medium">{app.jobTitle}</div>
                      <span className="text-[11px] text-muted-foreground">{app.jobCode}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground">{app.experienceType}</div>
                      <span className="text-[11px] text-muted-foreground">
                        {app.totalExperienceYears ? `${app.totalExperienceYears} yrs` : 'Entry'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {app.currentStage}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {app.resumeUrl ? (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
                        >
                          <FileText className="w-3.5 h-3.5" /> View
                        </a>
                      ) : (
                        <span className="text-muted-foreground">None</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs gap-1"
                        onClick={() => handleOpenApplicant(app.id)}
                      >
                        <Eye className="w-3.5 h-3.5" /> Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-muted/20 text-xs">
            <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="h-7 text-xs"
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages - 1}
                onClick={() => setPage(page + 1)}
                className="h-7 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Applicant Details Modal */}
      <ApplicantDetailsModal
        application={selectedApplicant}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onShortlist={async (id) => {
          await recruitmentApi.shortlistApplication(id);
          fetchApplications();
          handleOpenApplicant(id);
        }}
        onReject={async (id, reason) => {
          await recruitmentApi.rejectApplication(id, reason);
          fetchApplications();
          handleOpenApplicant(id);
        }}
        onSelect={async (id) => {
          await recruitmentApi.selectApplication(id);
          fetchApplications();
          handleOpenApplicant(id);
        }}
        onScheduleRound={async (appId, data) => {
          await recruitmentApi.scheduleRound(appId, data);
          toast.success('Interview round scheduled');
          fetchApplications();
          handleOpenApplicant(appId);
        }}
        onUpdateFeedback={async (roundId, data) => {
          await recruitmentApi.updateRoundFeedback(roundId, data);
          toast.success('Evaluation saved');
          fetchApplications();
          if (selectedApplicant) handleOpenApplicant(selectedApplicant.id);
        }}
      />
    </div>
  );
};
