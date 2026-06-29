// src/modules/leads/services/leadsApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const leadsApi = createApi({
  reducerPath: 'leadsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/lap-api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      const tenantCode = localStorage.getItem('tenantCode');
      if (tenantCode) {
        headers.set('X-Tenant', tenantCode);
      }
      return headers;
    },
  }),
  tagTypes: ['Leads', 'LeadForms', 'LeadOptions', 'LeadUsers', 'FollowUps'],
  endpoints: (builder) => ({
    getLeads: builder.query({
      query: () => 'leads/',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'Leads', id })), 'Leads'] : ['Leads'],
    }),
    getLead: builder.query({
      query: (id) => `leads/${id}/`,
      providesTags: (result, error, id) => [{ type: 'Leads', id }],
    }),
    getLeadForms: builder.query({
      query: () => 'leads/forms/',
      providesTags: ['LeadForms'],
    }),
    syncLeadFormFields: builder.mutation({
      query: ({ formId, fields }) => ({
        url: `leads/forms/${formId}/fields/`,
        method: 'PUT',
        body: { fields },
      }),
      invalidatesTags: ['LeadForms'],
    }),
    getLeadOptions: builder.query({
      query: () => 'leads/options/',
      providesTags: ['LeadOptions'],
    }),
    saveLeadOptions: builder.mutation({
      query: (payload) => ({
        url: 'leads/options/',
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['LeadOptions', 'Leads'],
    }),
    getLeadUsers: builder.query({
      query: () => 'leads/users/',
      providesTags: ['LeadUsers'],
    }),
    getLeadSchema: builder.query({
      query: () => 'modules/leads/form-schema',
    }),
    createLead: builder.mutation({
      query: (payload) => ({
        url: 'leads/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Leads'],
    }),
    updateLead: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `leads/${id}/`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Leads', id }, 'Leads'],
    }),
    assignLeadCounselor: builder.mutation({
      query: ({ leadId, counselorId }) => ({
        url: `leads/${leadId}/assign/${counselorId}/`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, { leadId }) => [{ type: 'Leads', id: leadId }, 'Leads'],
    }),
    deleteLead: builder.mutation({
      query: (id) => ({ url: `leads/${id}/`, method: 'DELETE' }),
      invalidatesTags: ['Leads'],
    }),
    // Follow-ups endpoints
    getFollowUps: builder.query({
      query: (leadId) => leadId ? `leads/followups/?lead_id=${leadId}` : 'leads/followups/',
      providesTags: (result) =>
        result ? [...result.map(({ id }) => ({ type: 'FollowUps', id })), 'FollowUps'] : ['FollowUps'],
    }),
    createFollowUp: builder.mutation({
      query: (payload) => ({
        url: 'leads/followups/',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['FollowUps', 'Leads'],
    }),
    updateFollowUp: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `leads/followups/${id}/`,
        method: 'PATCH',
        body: patch,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'FollowUps', id }, 'FollowUps', 'Leads'],
    }),
    // Schema CRUD endpoints
    createLeadFormSchema: builder.mutation({
      query: (payload) => ({
        url: 'modules/leads/form-schema',
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['Leads'],
    }),
    updateLeadFormSchema: builder.mutation({
      query: ({ id, ...payload }) => ({
        url: `modules/leads/form-schema/${id}`,
        method: 'PUT',
        body: payload,
      }),
      invalidatesTags: ['Leads'],
    }),
    deleteLeadFormSchema: builder.mutation({
      query: (id) => ({
        url: `modules/leads/form-schema/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Leads'],
    }),
    getLeadFormSchemaVersions: builder.query({
      query: () => 'modules/leads/form-schema/versions',
    }),
  }),
});

export const {
  useGetLeadsQuery,
  useGetLeadQuery,
  useGetLeadFormsQuery,
  useSyncLeadFormFieldsMutation,
  useGetLeadOptionsQuery,
  useSaveLeadOptionsMutation,
  useGetLeadUsersQuery,
  useCreateLeadMutation,
  useUpdateLeadMutation,
  useDeleteLeadMutation,
  useAssignLeadCounselorMutation,
  useGetLeadSchemaQuery,
  useGetFollowUpsQuery,
  useCreateFollowUpMutation,
  useUpdateFollowUpMutation,
} = leadsApi;
