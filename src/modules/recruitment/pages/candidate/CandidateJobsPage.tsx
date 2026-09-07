import React, { useState, useEffect } from 'react';
import {
  Search,
  Briefcase,
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Send,
  Eye,
  CheckCircle2,
  X,
  Share2,
  Award,
} from 'lucide-react';
import { recruitmentApi } from '../../services/recruitmentApi';
import { Job, WorkMode } from '../../types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CandidateApplyModal } from '../../components/CandidateApplyModal';
import { toast } from 'react-hot-toast';

export const CandidateJobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode | ''>('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Selected job for complete details / applying
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [applyModalOpen, setApplyModalOpen] = useState(false);

  const handleShareJob = (job: Job) => {
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
    toast.success(`Application link for "${job.title}" copied to clipboard!`, {
      icon: '🔗',
    });
  };

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const res = await recruitmentApi.getAvailableJobs({
        query: query || undefined,
        department: department || undefined,
        workMode: workMode ? (workMode as WorkMode) : undefined,
        page,
        size: 12,
      });
      setJobs(res?.content || []);
      setTotalPages(res?.totalPages || 0);
    } catch (err: any) {
      toast.error('Failed to load available jobs');
    } finally {
      setLoading(false);
    }
  };

  // Check for shared direct link: ?jobId=123 or ?jobId=123&apply=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const jobIdParam = params.get('jobId');
    const autoApply = params.get('apply') === 'true';

    if (jobIdParam) {
      const jId = Number(jobIdParam);
      recruitmentApi.getCandidateJobDetails(jId).then((j) => {
        if (j) {
          setSelectedJob(j);
          if (autoApply) {
            setApplyModalOpen(true);
          } else {
            setDetailsModalOpen(true);
          }
        }
      }).catch(() => {
        // Silently ignore if job not found
      });
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [page, workMode]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchJobs();
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/20">
        <div className="max-w-2xl space-y-2">
          <Badge className="bg-primary/20 text-primary border-primary/30">Career Opportunities</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
            Explore Open Positions
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Join our mission-driven team. Find the position that matches your skills and career aspirations.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-card border border-border/80 shadow-xs">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role title, department, or location..."
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex gap-2">
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

            <Button type="submit" size="sm" variant="secondary" className="text-xs">
              Search
            </Button>
          </div>
        </form>
      </div>

      {/* Jobs Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-16 text-center text-xs text-muted-foreground bg-card border border-border rounded-xl space-y-2">
          <Briefcase className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="text-sm font-semibold text-foreground">No open positions found</p>
          <p>Try refining your search terms or check back later.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-xl border border-border/80 bg-card hover:border-primary/50 transition-all shadow-xs flex flex-col justify-between space-y-4 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {job.department || 'General'}
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {job.workMode}
                  </span>
                </div>

                <h3 className="text-base font-bold text-foreground mt-2 line-clamp-1">
                  {job.title}
                </h3>

                <div className="space-y-1.5 mt-3 text-xs text-muted-foreground">
                  {job.location && (
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{job.location}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{job.employmentType}</span>
                  </div>

                  {(job.minSalary || job.maxSalary) && (
                    <div className="flex items-center gap-1.5 text-foreground font-semibold">
                      <span>
                        {job.minSalary ? `${job.currency} ${job.minSalary.toLocaleString()}` : ''}
                        {job.maxSalary ? ` - ${job.currency} ${job.maxSalary.toLocaleString()}` : ''}
                      </span>
                    </div>
                  )}
                </div>

                {job.requiredSkills && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {job.requiredSkills.split(',').slice(0, 3).map((skill, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground font-medium">
                        {skill.trim()}
                      </span>
                    ))}
                    {job.requiredSkills.split(',').length > 3 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{job.requiredSkills.split(',').length - 3} more
                      </span>
                    )}
                  </div>
                )}
                {job.requiresCertificate && (
                  <div className="mt-2.5">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      <Award className="w-3 h-3 text-amber-600 dark:text-amber-400" /> Certificate / Proof Required
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs flex-1"
                  onClick={() => {
                    setSelectedJob(job);
                    setDetailsModalOpen(true);
                  }}
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> View Details
                </Button>

                <Button
                  size="sm"
                  className="h-8 text-xs flex-1 gap-1"
                  onClick={() => {
                    setSelectedJob(job);
                    setApplyModalOpen(true);
                  }}
                >
                  <Send className="w-3 h-3" /> Apply Now
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:border-primary/50 shrink-0"
                  title="Share Apply Link"
                  onClick={() => handleShareJob(job)}
                >
                  <Share2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Complete Job Details Modal for Candidate */}
      {detailsModalOpen && selectedJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            <div className="flex items-start justify-between px-6 py-5 border-b border-border bg-muted/30">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  {selectedJob.department || 'Open Position'}
                </span>
                <h2 className="text-xl font-bold text-foreground mt-1">{selectedJob.title}</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedJob.location} • {selectedJob.workMode} • {selectedJob.employmentType}
                </p>
              </div>
              <button onClick={() => setDetailsModalOpen(false)} className="p-1 rounded-sm text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs leading-relaxed">
              {/* Certificate Requirement Banner */}
              {selectedJob.requiresCertificate && (
                <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 flex items-start gap-3">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-semibold text-xs text-amber-700 dark:text-amber-300">
                      Training / Certificate Document Required
                    </h5>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {selectedJob.certificateInstructions || 'Candidates applying for this role must upload proof of relevant training or certifications.'}
                    </p>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">About the Role</h4>
                <p className="whitespace-pre-line text-foreground/90">{selectedJob.description || 'No description provided.'}</p>
              </div>

              {(selectedJob.requiredSkills || selectedJob.preferredSkills) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border border-border">
                  {selectedJob.requiredSkills && (
                    <div>
                      <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">Required Skills</h4>
                      <p className="text-foreground/90">{selectedJob.requiredSkills}</p>
                    </div>
                  )}
                  {selectedJob.preferredSkills && (
                    <div>
                      <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">Preferred Skills</h4>
                      <p className="text-foreground/90">{selectedJob.preferredSkills}</p>
                    </div>
                  )}
                </div>
              )}

              {selectedJob.responsibilities && (
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">Responsibilities</h4>
                  <p className="whitespace-pre-line text-foreground/90">{selectedJob.responsibilities}</p>
                </div>
              )}

              {selectedJob.requirements && (
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">Requirements</h4>
                  <p className="whitespace-pre-line text-foreground/90">{selectedJob.requirements}</p>
                </div>
              )}

              {selectedJob.benefits && (
                <div>
                  <h4 className="font-bold text-foreground uppercase tracking-wider text-[11px] mb-1">Benefits</h4>
                  <p className="whitespace-pre-line text-foreground/90">{selectedJob.benefits}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
              <span className="text-xs text-muted-foreground">
                Deadline: {selectedJob.applicationDeadline || 'Open'}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShareJob(selectedJob)}
                  className="gap-1.5"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share Link
                </Button>
                <Button
                  onClick={() => {
                    setDetailsModalOpen(false);
                    setApplyModalOpen(true);
                  }}
                  className="gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> Apply for this Job
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Apply Modal */}
      <CandidateApplyModal
        isOpen={applyModalOpen}
        onClose={() => setApplyModalOpen(false)}
        job={selectedJob}
        onSubmit={async (jobId, data, resumeFile, certFile) => {
          return await recruitmentApi.applyForJob(jobId, data, resumeFile, certFile);
        }}
      />
    </div>
  );
};
