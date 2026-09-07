import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle2, Award } from 'lucide-react';
import { Job, CandidateApplicationView, JobQuestion } from '../types/recruitment';
import { useAuth } from '@/auth/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

interface CandidateApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  onSubmit: (jobId: number, data: any, resumeFile?: File, certificateFile?: File) => Promise<CandidateApplicationView>;
  onSuccess?: () => void;
}

export const CandidateApplyModal: React.FC<CandidateApplyModalProps> = ({
  isOpen,
  onClose,
  job,
  onSubmit,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    degree: '',
    institution: '',
    graduationYear: '',
    educationDetails: '',
    experienceType: 'FRESHER',
    totalExperienceYears: undefined as number | undefined,
    previousCompany: '',
    previousRole: '',
    experienceDetails: '',
    technicalSkills: '',
    otherSkills: '',
    answers: {} as Record<number, string>,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        fullName: user?.email ? user.email.split('@')[0].replace('.', ' ') : '',
        email: user?.email || '',
        phone: '',
        location: '',
        degree: '',
        institution: '',
        graduationYear: '',
        educationDetails: '',
        experienceType: 'FRESHER',
        totalExperienceYears: undefined,
        previousCompany: '',
        previousRole: '',
        experienceDetails: '',
        technicalSkills: '',
        otherSkills: '',
        answers: {},
      });
      setResumeFile(null);
      setCertificateFile(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !job) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')) {
        toast.error('Resume must be a PDF or Word document (.pdf, .doc, .docx)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size cannot exceed 10MB');
        return;
      }
      setResumeFile(file);
    }
  };

  const handleCertFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const lowerName = file.name.toLowerCase();
      if (!lowerName.endsWith('.pdf') && !lowerName.endsWith('.doc') && !lowerName.endsWith('.docx')
          && !lowerName.endsWith('.png') && !lowerName.endsWith('.jpg') && !lowerName.endsWith('.jpeg')) {
        toast.error('Certificate must be a PDF, Word document, or image (.pdf, .doc, .docx, .png, .jpg)');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('Certificate file size cannot exceed 10MB');
        return;
      }
      setCertificateFile(file);
    }
  };

  const handleAnswerChange = (questionId: number, answerText: string) => {
    setFormData((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: answerText },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error('Please enter your full name');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }

    if (job.requiresCertificate && !certificateFile) {
      toast.error('Please upload your training or certification document as required by this job posting.');
      return;
    }

    // Validate required questions
    if (job.questions) {
      for (const q of job.questions) {
        if (q.required && q.id) {
          const ans = formData.answers[q.id];
          if (!ans || !ans.trim()) {
            toast.error(`Please answer required question: "${q.questionText}"`);
            return;
          }
        }
      }
    }

    // Format answers array for backend
    const answersList = (job.questions || []).map((q) => ({
      questionId: q.id,
      questionText: q.questionText,
      answerText: q.id ? formData.answers[q.id] || '' : '',
    }));

    const payload = {
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      location: formData.location,
      degree: formData.degree,
      institution: formData.institution,
      graduationYear: formData.graduationYear,
      educationDetails: formData.educationDetails,
      experienceType: formData.experienceType,
      totalExperienceYears: formData.totalExperienceYears,
      previousCompany: formData.previousCompany,
      previousRole: formData.previousRole,
      experienceDetails: formData.experienceDetails,
      technicalSkills: formData.technicalSkills,
      otherSkills: formData.otherSkills,
      answers: answersList,
    };

    setLoading(true);
    try {
      await onSubmit(job.id, payload, resumeFile || undefined, certificateFile || undefined);
      toast.success('Application submitted successfully!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-border bg-muted/40">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Apply for {job.title}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {job.jobCode} • {job.department || 'General'} • {job.location} ({job.workMode})
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1 text-sm">
          {/* Section 1: Personal Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
              1. Personal Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="candName" className="text-xs font-medium">Full Name *</Label>
                <Input
                  id="candName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. John Smith"
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="candEmail" className="text-xs font-medium">Email Address *</Label>
                <Input
                  id="candEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. john.smith@example.com"
                  className="mt-1 text-xs"
                  required
                />
              </div>

              <div>
                <Label htmlFor="candPhone" className="text-xs font-medium">Phone Number</Label>
                <Input
                  id="candPhone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="candLocation" className="text-xs font-medium">Current Location</Label>
                <Input
                  id="candLocation"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bangalore, India"
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Education */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
              2. Education
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="degree" className="text-xs font-medium">Degree / Qualification</Label>
                <Input
                  id="degree"
                  value={formData.degree}
                  onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="institution" className="text-xs font-medium">College / University</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="e.g. IIT Bombay"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="graduationYear" className="text-xs font-medium">Graduation Year</Label>
                <Input
                  id="graduationYear"
                  value={formData.graduationYear}
                  onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                  placeholder="e.g. 2024"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="educationDetails" className="text-xs font-medium">Education Details / GPA (optional)</Label>
              <textarea
                id="educationDetails"
                rows={2}
                value={formData.educationDetails}
                onChange={(e) => setFormData({ ...formData, educationDetails: e.target.value })}
                placeholder="Major coursework, CGPA, notable achievements..."
                className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-xs"
              />
            </div>
          </div>

          {/* Section 3: Work Experience */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
              3. Work Experience
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium">Experience Level</Label>
                <select
                  value={formData.experienceType}
                  onChange={(e) => setFormData({ ...formData, experienceType: e.target.value })}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs"
                >
                  <option value="FRESHER">Fresher</option>
                  <option value="EXPERIENCED">Experienced</option>
                </select>
              </div>

              {formData.experienceType === 'EXPERIENCED' && (
                <>
                  <div>
                    <Label htmlFor="totalExp" className="text-xs font-medium">Total Experience (Years)</Label>
                    <Input
                      id="totalExp"
                      type="number"
                      step="0.5"
                      min={0}
                      value={formData.totalExperienceYears !== undefined ? formData.totalExperienceYears : ''}
                      onChange={(e) => setFormData({ ...formData, totalExperienceYears: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="e.g. 3.5"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div>
                    <Label htmlFor="prevCompany" className="text-xs font-medium">Previous / Current Company</Label>
                    <Input
                      id="prevCompany"
                      value={formData.previousCompany}
                      onChange={(e) => setFormData({ ...formData, previousCompany: e.target.value })}
                      placeholder="e.g. Infosys"
                      className="mt-1 text-xs"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <Label htmlFor="prevRole" className="text-xs font-medium">Previous / Current Role</Label>
                    <Input
                      id="prevRole"
                      value={formData.previousRole}
                      onChange={(e) => setFormData({ ...formData, previousRole: e.target.value })}
                      placeholder="e.g. Software Engineer"
                      className="mt-1 text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="expDetails" className="text-xs font-medium">Experience Highlights / Key Projects</Label>
              <textarea
                id="expDetails"
                rows={2}
                value={formData.experienceDetails}
                onChange={(e) => setFormData({ ...formData, experienceDetails: e.target.value })}
                placeholder="Brief summary of your work responsibilities, tech stacks used, and accomplishments..."
                className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-xs shadow-xs"
              />
            </div>
          </div>

          {/* Section 4: Skills */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
              4. Skills
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="techSkills" className="text-xs font-medium">Technical Skills (comma-separated)</Label>
                <Input
                  id="techSkills"
                  value={formData.technicalSkills}
                  onChange={(e) => setFormData({ ...formData, technicalSkills: e.target.value })}
                  placeholder="e.g. Java, Spring Boot, React, MySQL, Docker"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label htmlFor="otherSkills" className="text-xs font-medium">Other Skills / Languages</Label>
                <Input
                  id="otherSkills"
                  value={formData.otherSkills}
                  onChange={(e) => setFormData({ ...formData, otherSkills: e.target.value })}
                  placeholder="e.g. Agile, System Design, Communication"
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Resume Upload */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
              5. Resume / CV Upload
            </h3>
            <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/80 hover:border-primary/60 rounded-xl p-5 bg-muted/20 transition-all">
              <input
                type="file"
                id="resumeUpload"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                className="hidden"
              />
              <label htmlFor="resumeUpload" className="cursor-pointer flex flex-col items-center text-center">
                <Upload className="w-8 h-8 text-primary mb-2" />
                <span className="text-xs font-semibold text-foreground">
                  {resumeFile ? resumeFile.name : 'Click to select and upload your resume'}
                </span>
                <span className="text-[11px] text-muted-foreground mt-1">
                  Supported formats: PDF, DOC, DOCX (Max 10MB)
                </span>
              </label>

              {resumeFile && (
                <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-500/10 px-3 py-1 rounded-md">
                  <FileText className="w-4 h-4" />
                  <span>{resumeFile.name} ({(resumeFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Certificate / Training Document Upload */}
          {job.requiresCertificate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border/50 pb-1">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                    6. Required Training / Certificate Document <span className="text-red-500">*</span>
                  </h3>
                </div>
                <span className="text-[11px] font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                  Required by Employer
                </span>
              </div>

              {job.certificateInstructions && (
                <div className="text-xs bg-primary/5 border border-primary/15 text-foreground p-3 rounded-lg flex items-start gap-2.5">
                  <Award className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold text-xs text-primary">Instructions:</p>
                    <p className="text-xs text-muted-foreground">{job.certificateInstructions}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col items-center justify-center border-2 border-dashed border-primary/40 hover:border-primary rounded-xl p-5 bg-primary/5 transition-all">
                <input
                  type="file"
                  id="certificateUpload"
                  onChange={handleCertFileChange}
                  accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <label htmlFor="certificateUpload" className="cursor-pointer flex flex-col items-center text-center">
                  <Award className="w-8 h-8 text-primary mb-2" />
                  <span className="text-xs font-semibold text-foreground">
                    {certificateFile ? certificateFile.name : 'Click to select and upload your certificate / training proof'}
                  </span>
                  <span className="text-[11px] text-muted-foreground mt-1">
                    Supported formats: PDF, DOC, DOCX, PNG, JPG (Max 10MB)
                  </span>
                </label>

                {certificateFile && (
                  <div className="mt-3 flex items-center justify-between gap-2 text-xs font-medium text-foreground bg-background border border-primary/20 px-3.5 py-1.5 rounded-md shadow-xs w-full max-w-sm">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="truncate">{certificateFile.name} ({(certificateFile.size / 1024).toFixed(1)} KB)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCertificateFile(null)}
                      className="text-muted-foreground hover:text-red-500 p-1"
                      title="Remove file"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Section: Screening Questions */}
          {job.questions && job.questions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-primary border-b border-border/50 pb-1">
                {job.requiresCertificate ? '7. Specific Job Questions' : '6. Specific Job Questions'}
              </h3>
              <div className="space-y-3">
                {job.questions.map((q, idx) => {
                  const qId = q.id || idx;
                  const currentAns = formData.answers[qId] || '';
                  const options = q.optionsJson ? q.optionsJson.split(',').map((o) => o.trim()) : [];

                  return (
                    <div key={qId} className="p-3.5 rounded-lg border border-border bg-card/70 space-y-1.5">
                      <Label className="text-xs font-semibold text-foreground">
                        Q{idx + 1}: {q.questionText} {q.required && <span className="text-red-500">*</span>}
                      </Label>

                      {q.questionType === 'YES_NO' ? (
                        <div className="flex items-center gap-4 mt-1">
                          <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                            <input
                              type="radio"
                              name={`q-${qId}`}
                              value="Yes"
                              checked={currentAns === 'Yes'}
                              onChange={() => handleAnswerChange(qId, 'Yes')}
                              className="text-primary"
                            />
                            Yes
                          </label>
                          <label className="flex items-center gap-1.5 text-xs text-foreground cursor-pointer">
                            <input
                              type="radio"
                              name={`q-${qId}`}
                              value="No"
                              checked={currentAns === 'No'}
                              onChange={() => handleAnswerChange(qId, 'No')}
                              className="text-primary"
                            />
                            No
                          </label>
                        </div>
                      ) : q.questionType === 'SINGLE_CHOICE' && options.length > 0 ? (
                        <select
                          value={currentAns}
                          onChange={(e) => handleAnswerChange(qId, e.target.value)}
                          className="mt-1 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs shadow-xs"
                        >
                          <option value="">-- Select an option --</option>
                          {options.map((opt, oIdx) => (
                            <option key={oIdx} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={q.questionType === 'NUMBER' ? 'number' : 'text'}
                          placeholder="Your answer..."
                          value={currentAns}
                          onChange={(e) => handleAnswerChange(qId, e.target.value)}
                          className="text-xs mt-1"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="gap-1.5">
              {loading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Submit Application
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
