import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Briefcase,
  MapPin,
  Calendar,
  Users,
  MoreVertical,
  CheckCircle,
  PauseCircle,
  XCircle,
  Edit,
  Trash2,
  TrendingUp,
  Eye,
  Share2,
  Award,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { recruitmentApi } from '../services/recruitmentApi';
import { Job, JobStatus, WorkMode } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { JobFormModal } from '../components/JobFormModal';
import { JobDetailsModal } from '../components/JobDetailsModal';
import { toast } from 'react-hot-toast';

export const JobsListPage: React.FC = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode | ''>('');
  const [status, setStatus] = useState<JobStatus | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Modals state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [selectedJobToEdit, setSelectedJobToEdit] = useState<Job | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<Job | null>(null);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getJobs({
        query: query || undefined,
        department: department || undefined,
        workMode: workMode ? (workMode as WorkMode) : undefined,
        status: status ? (status as JobStatus) : undefined,
        page,
        size: 10,
      });
      setJobs(res?.content || []);
      setTotalPages(res?.totalPages || 0);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [page, status, workMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchJobs();
  };

  const handlePublish = async (id: number) => {
    try {
      await recruitmentApi.publishJob(id);
      toast.success('Job published successfully');
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to publish job');
    }
  };

  const handlePause = async (id: number) => {
    try {
      await recruitmentApi.pauseJob(id);
      toast.success('Job paused');
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to pause job');
    }
  };

  const handleCloseJob = async (id: number) => {
    try {
      await recruitmentApi.closeJob(id);
      toast.success('Job closed');
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to close job');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete or archive this job opening?')) return;
    try {
      await recruitmentApi.deleteJob(id);
      toast.success('Job removed / closed');
      fetchJobs();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete job');
    }
  };

  const handleCopyShareLink = (job: Job) => {
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
    toast.success(`Candidate apply link for "${job.title}" copied to clipboard!`, {
      icon: '🔗',
    });
  };

  const getStatusBadge = (jobStatus: JobStatus) => {
    switch (jobStatus) {
      case 'PUBLISHED':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Published</span>;
      case 'PAUSED':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">Paused</span>;
      case 'CLOSED':
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20">Closed</span>;
      default:
        return <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">Draft</span>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Job Openings</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Create, publish, and manage hiring positions across departments.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setSelectedJobToEdit(null);
            setFormModalOpen(true);
          }}
          className="text-xs gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" /> Create Job
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by job title, code, location..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:w-auto">
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as JobStatus | '');
                setPage(0);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </select>

            <select
              value={workMode}
              onChange={(e) => {
                setWorkMode(e.target.value as WorkMode | '');
                setPage(0);
              }}
              className="rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
            >
              <option value="">All Work Modes</option>
              <option value="ON_SITE">On-site</option>
              <option value="HYBRID">Hybrid</option>
              <option value="REMOTE">Remote</option>
            </select>

            <Button type="submit" size="sm" variant="secondary" className="text-xs col-span-2 sm:col-span-1">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Jobs Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-12 text-center text-xs text-muted-foreground space-y-3">
            <Briefcase className="w-8 h-8 text-muted-foreground/50 mx-auto" />
            <p>No job openings match your criteria.</p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery('');
                setStatus('');
                setWorkMode('');
                setPage(0);
                fetchJobs();
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
                  <th className="px-6 py-3">Position</th>
                  <th className="px-4 py-3">Location & Mode</th>
                  <th className="px-4 py-3">Openings</th>
                  <th className="px-4 py-3">Applicants</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-6 py-3.5">
                      <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                        {job.title}
                        {job.requiresCertificate && (
                          <span title="Requires Certificate Document Upload" className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded-sm font-medium border border-amber-500/20">
                            <Award className="w-2.5 h-2.5" /> Cert
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono">
                        {job.jobCode} {job.department ? `• ${job.department}` : ''}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="text-foreground">{job.location || 'Not specified'}</div>
                      <span className="text-[11px] text-muted-foreground">{job.workMode} • {job.employmentType}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-foreground">
                      {job.openings}
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => navigate(`/recruitment/applications?jobId=${job.id}`)}
                        className="font-bold text-primary hover:underline"
                      >
                        {job.applicantCount || 0} candidates
                      </button>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground">
                      {job.applicationDeadline ? new Date(job.applicationDeadline).toLocaleDateString() : 'None'}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {getStatusBadge(job.status)}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10"
                          title="Copy Shareable Apply Link"
                          onClick={() => handleCopyShareLink(job)}
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="View Details"
                          onClick={() => {
                            setSelectedJobForDetails(job);
                            setDetailsModalOpen(true);
                          }}
                        >
                          <Eye className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-primary"
                          title="Recruitment Pipeline"
                          onClick={() => navigate(`/recruitment/pipeline?jobId=${job.id}`)}
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          title="Edit Job"
                          onClick={() => {
                            setSelectedJobToEdit(job);
                            setFormModalOpen(true);
                          }}
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>

                        {job.status !== 'PUBLISHED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2"
                            onClick={() => handlePublish(job.id)}
                          >
                            Publish
                          </Button>
                        )}

                        {job.status === 'PUBLISHED' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[11px] text-amber-600 hover:text-amber-700 hover:bg-amber-50 px-2"
                            onClick={() => handlePause(job.id)}
                          >
                            Pause
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                          title="Delete / Close"
                          onClick={() => handleDelete(job.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
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

      {/* Create / Edit Modal */}
      <JobFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        jobToEdit={selectedJobToEdit}
        onSubmit={async (data) => {
          if (selectedJobToEdit) {
            await recruitmentApi.updateJob(selectedJobToEdit.id, data);
            toast.success('Job updated successfully');
          } else {
            await recruitmentApi.createJob(data);
            toast.success('Job created successfully');
          }
          fetchJobs();
        }}
      />

      {/* Details Modal */}
      <JobDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        job={selectedJobForDetails}
        onEdit={(job) => {
          setSelectedJobToEdit(job);
          setFormModalOpen(true);
        }}
        onPublish={handlePublish}
        onPause={handlePause}
        onCloseJob={handleCloseJob}
      />
    </div>
  );
};
