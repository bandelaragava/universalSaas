export type JobStatus = 'DRAFT' | 'PUBLISHED' | 'PAUSED' | 'CLOSED';
export type WorkMode = 'ON_SITE' | 'HYBRID' | 'REMOTE';
export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
export type ApplicationStage =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'ROUND_1'
  | 'ROUND_2'
  | 'ROUND_3'
  | 'ROUND_4'
  | 'ROUND_5'
  | 'ROUND_6'
  | 'ROUND_7'
  | 'ROUND_8'
  | 'ROUND_9'
  | 'ROUND_10'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | string;

export type ApplicationStatus =
  | 'APPLIED'
  | 'SHORTLISTED'
  | 'IN_INTERVIEW'
  | 'SELECTED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type InterviewRoundType =
  | 'SCREENING'
  | 'TECHNICAL'
  | 'HR'
  | 'MANAGERIAL'
  | 'FINAL'
  | 'CUSTOM';

export type InterviewStatus =
  | 'PENDING'
  | 'SCHEDULED'
  | 'PASSED'
  | 'FAILED'
  | 'CANCELLED';

export type QuestionType = 'TEXT' | 'YES_NO' | 'NUMBER' | 'SINGLE_CHOICE';

export interface JobQuestion {
  id?: number;
  questionText: string;
  questionType: QuestionType;
  optionsJson?: string;
  required?: boolean;
  orderIndex?: number;
}

export interface Job {
  id: number;
  tenantId: number;
  title: string;
  jobCode: string;
  department?: string;
  location?: string;
  workMode: WorkMode;
  employmentType: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  currency: string;
  experienceYears?: string;
  education?: string;
  requiredSkills?: string;
  preferredSkills?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  openings: number;
  applicationStartDate?: string;
  applicationDeadline?: string;
  requiresCertificate?: boolean;
  certificateInstructions?: string;
  status: JobStatus;
  applicantCount: number;
  questions?: JobQuestion[];
  createdAt?: string;
  updatedAt?: string;
}

export interface JobCreateRequest {
  title: string;
  jobCode?: string;
  department?: string;
  location?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  minSalary?: number;
  maxSalary?: number;
  currency?: string;
  experienceYears?: string;
  education?: string;
  requiredSkills?: string;
  preferredSkills?: string;
  description?: string;
  responsibilities?: string;
  requirements?: string;
  benefits?: string;
  openings?: number;
  applicationStartDate?: string;
  applicationDeadline?: string;
  requiresCertificate?: boolean;
  certificateInstructions?: string;
  status?: JobStatus;
  questions?: JobQuestion[];
}

export interface JobApplicationAnswer {
  id?: number;
  questionId?: number;
  questionText?: string;
  answerText?: string;
}

export interface InterviewRound {
  id: number;
  applicationId: number;
  roundNumber: number;
  roundName: string;
  roundType: InterviewRoundType;
  scheduledAt?: string;
  interviewer?: string;
  interviewerUserId?: number;
  status: InterviewStatus;
  feedback?: string;
  score?: number;
  completedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobApplication {
  id: number;
  tenantId: number;
  jobId: number;
  jobTitle: string;
  jobCode: string;
  department?: string;
  candidateId?: number;

  fullName: string;
  email: string;
  phone?: string;
  location?: string;

  degree?: string;
  institution?: string;
  graduationYear?: string;
  educationDetails?: string;

  experienceType?: string;
  totalExperienceYears?: number;
  previousCompany?: string;
  previousRole?: string;
  experienceDetails?: string;

  technicalSkills?: string;
  otherSkills?: string;

  resumeUrl?: string;
  resumeOriginalName?: string;
  certificateUrl?: string;
  certificateOriginalName?: string;

  currentStage: ApplicationStage;
  status: ApplicationStatus;
  applicationDate: string;
  rejectionReason?: string;

  interviewRounds?: InterviewRound[];
  answers?: JobApplicationAnswer[];

  createdAt?: string;
  updatedAt?: string;
}

export interface CandidateRoundProgress {
  roundNumber: number;
  roundName: string;
  roundType: InterviewRoundType;
  scheduledAt?: string;
  status: InterviewStatus;
}

export interface CandidateApplicationView {
  id: number;
  jobId: number;
  jobTitle: string;
  jobCode: string;
  department?: string;
  location?: string;
  workMode?: string;
  employmentType?: string;
  currentStage: ApplicationStage;
  status: ApplicationStatus;
  applicationDate: string;
  resumeUrl?: string;
  resumeOriginalName?: string;
  certificateUrl?: string;
  certificateOriginalName?: string;
  roundsProgress: CandidateRoundProgress[];
}

export interface JobPipelineData {
  jobId: number;
  jobTitle: string;
  jobCode: string;
  department?: string;
  status: string;

  totalApplicants: number;
  shortlisted: number;
  round1: number;
  round2: number;
  round3: number;
  otherRounds: number;
  selected: number;
  rejected: number;
  withdrawn: number;

  stageCandidates?: Record<string, JobApplication[]>;
}

export interface RecruitmentDashboardData {
  totalJobs: number;
  publishedJobs: number;
  draftJobs: number;
  closedJobs: number;

  totalApplicants: number;
  shortlistedCount: number;
  inInterviewCount: number;
  selectedCount: number;
  rejectedCount: number;

  jobPipelines: JobPipelineData[];
  recentApplications: JobApplication[];
}
