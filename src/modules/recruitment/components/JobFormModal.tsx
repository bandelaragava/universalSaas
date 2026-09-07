import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, HelpCircle, Award } from 'lucide-react';
import { Job, JobCreateRequest, JobQuestion, WorkMode, EmploymentType, JobStatus, QuestionType } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

interface JobFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: JobCreateRequest) => Promise<void>;
  jobToEdit?: Job | null;
}

export const JobFormModal: React.FC<JobFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  jobToEdit,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<JobCreateRequest>({
    title: '',
    jobCode: '',
    department: '',
    location: '',
    workMode: 'ON_SITE',
    employmentType: 'FULL_TIME',
    minSalary: undefined,
    maxSalary: undefined,
    currency: 'INR',
    experienceYears: '',
    education: '',
    requiredSkills: '',
    preferredSkills: '',
    description: '',
    responsibilities: '',
    requirements: '',
    benefits: '',
    openings: 1,
    applicationStartDate: new Date().toISOString().split('T')[0],
    applicationDeadline: '',
    requiresCertificate: false,
    certificateInstructions: '',
    status: 'DRAFT',
    questions: [],
  });

  useEffect(() => {
    if (jobToEdit) {
      setFormData({
        title: jobToEdit.title || '',
        jobCode: jobToEdit.jobCode || '',
        department: jobToEdit.department || '',
        location: jobToEdit.location || '',
        workMode: jobToEdit.workMode || 'ON_SITE',
        employmentType: jobToEdit.employmentType || 'FULL_TIME',
        minSalary: jobToEdit.minSalary,
        maxSalary: jobToEdit.maxSalary,
        currency: jobToEdit.currency || 'INR',
        experienceYears: jobToEdit.experienceYears || '',
        education: jobToEdit.education || '',
        requiredSkills: jobToEdit.requiredSkills || '',
        preferredSkills: jobToEdit.preferredSkills || '',
        description: jobToEdit.description || '',
        responsibilities: jobToEdit.responsibilities || '',
        requirements: jobToEdit.requirements || '',
        benefits: jobToEdit.benefits || '',
        openings: jobToEdit.openings || 1,
        applicationStartDate: jobToEdit.applicationStartDate || '',
        applicationDeadline: jobToEdit.applicationDeadline || '',
        requiresCertificate: jobToEdit.requiresCertificate || false,
        certificateInstructions: jobToEdit.certificateInstructions || '',
        status: jobToEdit.status || 'DRAFT',
        questions: jobToEdit.questions ? [...jobToEdit.questions] : [],
      });
    } else {
      setFormData({
        title: '',
        jobCode: '',
        department: '',
        location: '',
        workMode: 'ON_SITE',
        employmentType: 'FULL_TIME',
        minSalary: undefined,
        maxSalary: undefined,
        currency: 'INR',
        experienceYears: '',
        education: '',
        requiredSkills: '',
        preferredSkills: '',
        description: '',
        responsibilities: '',
        requirements: '',
        benefits: '',
        openings: 1,
        applicationStartDate: new Date().toISOString().split('T')[0],
        applicationDeadline: '',
        requiresCertificate: false,
        certificateInstructions: '',
        status: 'DRAFT',
        questions: [],
      });
    }
  }, [jobToEdit, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const newQuestions = [...(formData.questions || [])];
    newQuestions.push({
      questionText: '',
      questionType: 'TEXT',
      optionsJson: '',
      required: false,
      orderIndex: newQuestions.length,
    });
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleUpdateQuestion = (index: number, field: keyof JobQuestion, val: any) => {
    const newQuestions = [...(formData.questions || [])];
    newQuestions[index] = { ...newQuestions[index], [field]: val };
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleRemoveQuestion = (index: number) => {
    const newQuestions = (formData.questions || []).filter((_, idx) => idx !== index);
    setFormData({ ...formData, questions: newQuestions });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Job Title is required');
      return;
    }
    if (formData.minSalary && formData.maxSalary && Number(formData.minSalary) > Number(formData.maxSalary)) {
      toast.error('Minimum salary cannot exceed maximum salary');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to save job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              {jobToEdit ? 'Edit Job Opening' : 'Create New Job Opening'}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in all job information, requirements, and candidate screening questions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Section 1: Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/50 pb-1">
              1. Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title" className="text-xs font-medium text-foreground">Job Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Senior Full Stack Engineer"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="jobCode" className="text-xs font-medium text-foreground">Job Code (optional)</Label>
                <Input
                  id="jobCode"
                  value={formData.jobCode}
                  onChange={(e) => setFormData({ ...formData, jobCode: e.target.value })}
                  placeholder="Auto-generated if empty (e.g. JOB-2026-001)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="department" className="text-xs font-medium text-foreground">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Engineering, Sales, HR"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="location" className="text-xs font-medium text-foreground">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bangalore, India"
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground">Work Mode</Label>
                <select
                  value={formData.workMode}
                  onChange={(e) => setFormData({ ...formData, workMode: e.target.value as WorkMode })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="ON_SITE">On-site</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="REMOTE">Remote</option>
                </select>
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground">Employment Type</Label>
                <select
                  value={formData.employmentType}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value as EmploymentType })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="FULL_TIME">Full-time</option>
                  <option value="PART_TIME">Part-time</option>
                  <option value="CONTRACT">Contract</option>
                  <option value="INTERNSHIP">Internship</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Compensation */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/50 pb-1">
              2. Compensation
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="minSalary" className="text-xs font-medium text-foreground">Minimum Salary</Label>
                <Input
                  id="minSalary"
                  type="number"
                  value={formData.minSalary !== undefined ? formData.minSalary : ''}
                  onChange={(e) => setFormData({ ...formData, minSalary: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 500000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="maxSalary" className="text-xs font-medium text-foreground">Maximum Salary</Label>
                <Input
                  id="maxSalary"
                  type="number"
                  value={formData.maxSalary !== undefined ? formData.maxSalary : ''}
                  onChange={(e) => setFormData({ ...formData, maxSalary: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 1000000"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="currency" className="text-xs font-medium text-foreground">Currency</Label>
                <Input
                  id="currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  placeholder="e.g. INR, USD"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Requirements */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/50 pb-1">
              3. Requirements & Skills
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experienceYears" className="text-xs font-medium text-foreground">Required Experience</Label>
                <Input
                  id="experienceYears"
                  value={formData.experienceYears}
                  onChange={(e) => setFormData({ ...formData, experienceYears: e.target.value })}
                  placeholder="e.g. 2-5 years"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="education" className="text-xs font-medium text-foreground">Education</Label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                  placeholder="e.g. B.Tech / B.E. in Computer Science or related"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="requiredSkills" className="text-xs font-medium text-foreground">Required Skills</Label>
                <Input
                  id="requiredSkills"
                  value={formData.requiredSkills}
                  onChange={(e) => setFormData({ ...formData, requiredSkills: e.target.value })}
                  placeholder="e.g. Java, Spring Boot, React, MySQL"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="preferredSkills" className="text-xs font-medium text-foreground">Preferred Skills</Label>
                <Input
                  id="preferredSkills"
                  value={formData.preferredSkills}
                  onChange={(e) => setFormData({ ...formData, preferredSkills: e.target.value })}
                  placeholder="e.g. Docker, Kubernetes, AWS"
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Details & Descriptions */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/50 pb-1">
              4. Job Details
            </h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="description" className="text-xs font-medium text-foreground">Job Description</Label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Overview of the job, role, and what success looks like..."
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <Label htmlFor="responsibilities" className="text-xs font-medium text-foreground">Key Responsibilities</Label>
                <textarea
                  id="responsibilities"
                  rows={3}
                  value={formData.responsibilities}
                  onChange={(e) => setFormData({ ...formData, responsibilities: e.target.value })}
                  placeholder="• Build and maintain robust backend microservices&#10;• Collaborate with cross-functional teams..."
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <Label htmlFor="requirements" className="text-xs font-medium text-foreground">Requirements</Label>
                <textarea
                  id="requirements"
                  rows={2}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Mandatory requirements, certifications, or qualifications..."
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>

              <div>
                <Label htmlFor="benefits" className="text-xs font-medium text-foreground">Benefits & Perks</Label>
                <textarea
                  id="benefits"
                  rows={2}
                  value={formData.benefits}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Health insurance, flexible hours, annual bonus..."
                  className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Hiring Dates & Status */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-primary uppercase tracking-wider border-b border-border/50 pb-1">
              5. Hiring Schedule & Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="openings" className="text-xs font-medium text-foreground">Openings</Label>
                <Input
                  id="openings"
                  type="number"
                  min={1}
                  value={formData.openings}
                  onChange={(e) => setFormData({ ...formData, openings: Number(e.target.value) || 1 })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="startDate" className="text-xs font-medium text-foreground">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.applicationStartDate}
                  onChange={(e) => setFormData({ ...formData, applicationStartDate: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="deadline" className="text-xs font-medium text-foreground">Application Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.applicationDeadline}
                  onChange={(e) => setFormData({ ...formData, applicationDeadline: e.target.value })}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-medium text-foreground">Status</Label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as JobStatus })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="PAUSED">Paused</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 6: Document & Training Certificate Requirements */}
          <div className="space-y-4 rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">
                    Require Training / Certificate Document Upload?
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask candidates to upload proof of training, course completion, degree, or professional certification when submitting their application.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                <input
                  type="checkbox"
                  checked={formData.requiresCertificate || false}
                  onChange={(e) => setFormData({ ...formData, requiresCertificate: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {formData.requiresCertificate && (
              <div className="pt-3 border-t border-primary/15 space-y-1.5 animate-fadeIn">
                <Label htmlFor="certificateInstructions" className="text-xs font-semibold text-foreground">
                  Certificate Requirements & Instructions for Candidates
                </Label>
                <Input
                  id="certificateInstructions"
                  value={formData.certificateInstructions || ''}
                  onChange={(e) => setFormData({ ...formData, certificateInstructions: e.target.value })}
                  placeholder="e.g. Please upload your Java Full Stack Course Certificate or Degree Certificate (PDF, PNG, JPG up to 10MB)"
                  className="bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  This note will be shown to candidates above the certificate upload box in the application modal.
                </p>
              </div>
            )}
          </div>

          {/* Section 7: Screening Questions Builder */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-1">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-primary uppercase tracking-wider">
                  7. Application Screening Questions
                </h3>
                <span className="text-xs text-muted-foreground">(optional)</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddQuestion}
                className="text-xs h-7 gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Question
              </Button>
            </div>

            {(!formData.questions || formData.questions.length === 0) ? (
              <p className="text-xs text-muted-foreground italic bg-muted/20 p-3 rounded-lg border border-dashed border-border text-center">
                No custom screening questions configured. Candidates will submit standard profile information.
              </p>
            ) : (
              <div className="space-y-3">
                {formData.questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-lg border border-border bg-card/60 space-y-2 relative">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-muted-foreground">Question #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-red-500 hover:text-red-700 p-1 rounded-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="md:col-span-2">
                        <Input
                          placeholder="e.g. Do you have experience with Spring Boot?"
                          value={q.questionText}
                          onChange={(e) => handleUpdateQuestion(idx, 'questionText', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                      <div>
                        <select
                          value={q.questionType}
                          onChange={(e) => handleUpdateQuestion(idx, 'questionType', e.target.value as QuestionType)}
                          className="w-full rounded-md border border-input bg-background px-2 py-2 text-xs shadow-xs"
                        >
                          <option value="TEXT">Short / Long Text</option>
                          <option value="YES_NO">Yes / No</option>
                          <option value="NUMBER">Number (e.g. Years)</option>
                          <option value="SINGLE_CHOICE">Multiple Choice</option>
                        </select>
                      </div>
                    </div>

                    {q.questionType === 'SINGLE_CHOICE' && (
                      <div>
                        <Input
                          placeholder="Options separated by comma (e.g. Remote, Hybrid, On-site)"
                          value={q.optionsJson || ''}
                          onChange={(e) => handleUpdateQuestion(idx, 'optionsJson', e.target.value)}
                          className="text-xs"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id={`req-${idx}`}
                        checked={q.required || false}
                        onChange={(e) => handleUpdateQuestion(idx, 'required', e.target.checked)}
                        className="rounded border-input text-primary focus:ring-primary"
                      />
                      <label htmlFor={`req-${idx}`} className="text-xs text-muted-foreground cursor-pointer select-none">
                        Mandatory response required
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : null}
              {jobToEdit ? 'Update Job Opening' : 'Save Job Opening'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
