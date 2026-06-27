/* eslint-disable @typescript-eslint/no-explicit-any */
import rolesApi from './rolesApi';

// Analytics
export const getAnalyticsSummary = () => rolesApi.get('/marketing/analytics/summary').then(res => res.data);

// Customers
export const getCustomers = () => rolesApi.get('/marketing/customers').then(res => res.data);
export const createCustomer = (data: any) => rolesApi.post('/marketing/customers/register', data).then(res => res.data);
export const updateCustomer = (id: any, data: any) => rolesApi.put(`/marketing/customers/${id}`, data).then(res => res.data);
export const deleteCustomer = (id: any) => rolesApi.delete(`/marketing/customers/${id}`).then(res => res.data);

// Original Email
export const sendBulkEmail = (recipients: any, subject: any, body: any) =>
    rolesApi.post('/marketing/email/send-bulk', { recipients, subject, body }).then(res => res.data);
export const sendToAllCustomers = (subject: any, body: any) =>
    rolesApi.post('/marketing/email/send-all-customers', { subject, body }).then(res => res.data);

// Coupons
export const getCoupons = () => rolesApi.get('/marketing/admin/coupons').then(res => res.data);
export const createCoupon = (data: any) => rolesApi.post('/marketing/admin/coupons', data).then(res => res.data);
export const validateCoupon = (code: any, courseId: any, amount: any) =>
    rolesApi.get(`/marketing/coupons/public/validate/${code}`, { params: { courseId, amount } }).then(res => res.data);
export const updateCouponStatus = (id: any, status: string) =>
    rolesApi.patch(`/marketing/admin/coupons/${id}/status?status=${status}`).then(res => res.data);
export const softDeleteCoupon = (id: any) =>
    rolesApi.delete(`/marketing/admin/coupons/${id}`).then(res => res.data);
export const hardDeleteCoupon = (id: any) =>
    rolesApi.delete(`/marketing/admin/coupons/${id}/hard`).then(res => res.data);

// Leads
export const captureLead = (data: any) => rolesApi.post('/leads', data).then(res => res.data);
export const getLeads = () => rolesApi.get('/admin/marketing/campaigns/leads').then(res => res.data);

// Professional Email Campaigns
export const getEmailCampaigns = () => rolesApi.get('/admin/marketing/campaigns/all').then(res => res.data);
export const createEmailCampaign = (data: any) => rolesApi.post('/admin/marketing/campaigns', data).then(res => res.data);
export const updateEmailCampaign = (id: any, data: any) => rolesApi.put(`/admin/marketing/campaigns/${id}`, data).then(res => res.data);
export const deleteEmailCampaign = (id: any) => rolesApi.delete(`/admin/marketing/campaigns/${id}`).then(res => res.data);
export const scheduleCampaign = (id: any) => rolesApi.post(`/admin/marketing/campaigns/${id}/schedule`).then(res => res.data);
export const importCsv = (id: any, file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    return rolesApi.post(`/marketing/campaigns/${id}/import-csv`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
};

// Event-Based Analytics
export const trackEvent = (data: any) => rolesApi.post('/marketing/analytics/public/track', data).then(res => res.data);
export const getSourceStats = () => rolesApi.get('/marketing/admin/analytics/sources').then(res => res.data);
export const getFunnelStats = () => rolesApi.get('/marketing/admin/analytics/funnel').then(res => res.data);
export const getConversionRate = () => rolesApi.get('/marketing/admin/analytics/conversion-rate').then(res => res.data);
export const getCampaignStats = () => rolesApi.get('/marketing/admin/analytics/campaigns').then(res => res.data);
export const getMediumStats = () => rolesApi.get('/marketing/admin/analytics/mediums').then(res => res.data);

// Media Upload
export const uploadMedia = (file: any) => {
    const formData = new FormData();
    formData.append('file', file);
    return rolesApi.post('/marketing/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }).then(res => res.data);
};

// Landing Pages
export const getLandingPages = () => rolesApi.get('/marketing/admin/landing').then(res => res.data);
export const createLandingPage = (data: any) => rolesApi.post('/marketing/admin/landing', data).then(res => res.data);
export const updateLandingPage = (id: any, data: any) => rolesApi.put(`/marketing/admin/landing/${id}`, data).then(res => res.data);
export const deleteLandingPage = (id: any) => rolesApi.delete(`/marketing/admin/landing/${id}`).then(res => res.data);
export const getLandingPageBySlug = (slug: any) => rolesApi.get(`/marketing/public/landing/${slug}`).then(res => res.data);
export const seedLandingPages = () => rolesApi.post('/marketing/admin/landing/seed').then(res => res.data);

// Referral
export const getReferralCode = (learnerId: any) => rolesApi.get(`/marketing/referral/public/code/${learnerId}`).then(res => res.data);
export const getReferralStats = (learnerId: any) => rolesApi.get(`/marketing/referral/public/stats/${learnerId}`).then(res => res.data);

// Tracked Links
export const getTrackedLinks = () => rolesApi.get('/marketing/admin/tracked-links').then(res => res.data);
export const createTrackedLink = (data: any) => rolesApi.post('/marketing/admin/tracked-links', data).then(res => res.data);
export const deleteTrackedLink = (id: any) => rolesApi.delete(`/marketing/admin/tracked-links/${id}`).then(res => res.data);