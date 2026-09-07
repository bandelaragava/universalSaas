import rolesApi from '@/services/rolesApi';
import {
  Job,
  JobCreateRequest,
  JobApplication,
  InterviewRound,
  CandidateApplicationView,
  JobPipelineData,
  RecruitmentDashboardData,
  WorkMode,
  JobStatus,
  ApplicationStage,
  ApplicationStatus,
} from '../types/recruitment';

export const recruitmentApi = {
  // HR - Dashboard & Pipeline
  getDashboardMetrics: async (): Promise<RecruitmentDashboardData> => {
    const res = await rolesApi.get('/recruitment/dashboard');
    return res.data?.data || res.data;
  },

  getJobPipeline: async (jobId: number): Promise<JobPipelineData> => {
    const res = await rolesApi.get(`/recruitment/jobs/${jobId}/pipeline`);
    return res.data?.data || res.data;
  },

  // HR - Job Management
  getJobs: async (params?: {
    query?: string;
    department?: string;
    workMode?: WorkMode;
    status?: JobStatus;
    page?: number;
    size?: number;
    sort?: string;
  }) => {
    const res = await rolesApi.get('/recruitment/jobs', { params });
    return res.data?.data || res.data;
  },

  getJobById: async (id: number): Promise<Job> => {
    const res = await rolesApi.get(`/recruitment/jobs/${id}`);
    return res.data?.data || res.data;
  },

  createJob: async (data: JobCreateRequest): Promise<Job> => {
    const res = await rolesApi.post('/recruitment/jobs', data);
    return res.data?.data || res.data;
  },

  updateJob: async (id: number, data: Partial<JobCreateRequest>): Promise<Job> => {
    const res = await rolesApi.put(`/recruitment/jobs/${id}`, data);
    return res.data?.data || res.data;
  },

  deleteJob: async (id: number): Promise<void> => {
    await rolesApi.delete(`/recruitment/jobs/${id}`);
  },

  publishJob: async (id: number): Promise<Job> => {
    const res = await rolesApi.post(`/recruitment/jobs/${id}/publish`);
    return res.data?.data || res.data;
  },

  pauseJob: async (id: number): Promise<Job> => {
    const res = await rolesApi.post(`/recruitment/jobs/${id}/pause`);
    return res.data?.data || res.data;
  },

  closeJob: async (id: number): Promise<Job> => {
    const res = await rolesApi.post(`/recruitment/jobs/${id}/close`);
    return res.data?.data || res.data;
  },

  // HR - Application Management
  getApplications: async (params?: {
    jobId?: number;
    stage?: ApplicationStage;
    status?: ApplicationStatus;
    query?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) => {
    const res = await rolesApi.get('/recruitment/applications', { params });
    return res.data?.data || res.data;
  },

  getApplicationById: async (id: number): Promise<JobApplication> => {
    const res = await rolesApi.get(`/recruitment/applications/${id}`);
    return res.data?.data || res.data;
  },

  shortlistApplication: async (id: number): Promise<JobApplication> => {
    const res = await rolesApi.post(`/recruitment/applications/${id}/shortlist`);
    return res.data?.data || res.data;
  },

  rejectApplication: async (id: number, reason?: string): Promise<JobApplication> => {
    const res = await rolesApi.post(`/recruitment/applications/${id}/reject`, { reason });
    return res.data?.data || res.data;
  },

  selectApplication: async (id: number): Promise<JobApplication> => {
    const res = await rolesApi.post(`/recruitment/applications/${id}/select`);
    return res.data?.data || res.data;
  },

  // HR - Interview Management
  scheduleRound: async (
    applicationId: number,
    data: {
      roundNumber?: number;
      roundName: string;
      roundType: string;
      scheduledAt?: string;
      interviewer?: string;
    }
  ): Promise<InterviewRound> => {
    const res = await rolesApi.post(`/recruitment/applications/${applicationId}/rounds`, data);
    return res.data?.data || res.data;
  },

  getApplicationRounds: async (applicationId: number): Promise<InterviewRound[]> => {
    const res = await rolesApi.get(`/recruitment/applications/${applicationId}/rounds`);
    return res.data?.data || res.data;
  },

  updateRoundFeedback: async (
    roundId: number,
    data: {
      status: string;
      feedback?: string;
      score?: number;
    }
  ): Promise<InterviewRound> => {
    const res = await rolesApi.put(`/recruitment/rounds/${roundId}`, data);
    return res.data?.data || res.data;
  },

  // Candidate API
  getAvailableJobs: async (params?: {
    query?: string;
    department?: string;
    workMode?: WorkMode;
    page?: number;
    size?: number;
  }) => {
    const res = await rolesApi.get('/recruitment/candidate/jobs', { params });
    return res.data?.data || res.data;
  },

  getCandidateJobDetails: async (id: number): Promise<Job> => {
    const res = await rolesApi.get(`/recruitment/candidate/jobs/${id}`);
    return res.data?.data || res.data;
  },

  applyForJob: async (jobId: number, data: any, resumeFile?: File, certificateFile?: File): Promise<CandidateApplicationView> => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }
    if (certificateFile) {
      formData.append('certificate', certificateFile);
    }
    const res = await rolesApi.post(`/recruitment/candidate/jobs/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data?.data || res.data;
  },

  getMyApplications: async (): Promise<CandidateApplicationView[]> => {
    const res = await rolesApi.get('/recruitment/candidate/applications');
    return res.data?.data || res.data;
  },

  getMyApplicationById: async (id: number): Promise<CandidateApplicationView> => {
    const res = await rolesApi.get(`/recruitment/candidate/applications/${id}`);
    return res.data?.data || res.data;
  },
};
