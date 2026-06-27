import rolesApi from './rolesApi';

export interface LeaveType {
  id: number;
  name: string;
  code: string;
  days_allowed: number;
  applicable_to: string;
  carry_forward: boolean;
  max_carry_forward: number;
  is_paid: boolean;
  requires_document: boolean;
  min_notice_days: number;
  description?: string;
}

export interface LeaveBalance {
  id?: number;
  leave_type_id: number;
  leave_type_name?: string;
  leave_type_code?: string;
  total: number;
  used: number;
  pending: number;
  remaining: number;
  carried_forward?: number;
  carried?: number;
  carry_forward?: boolean;
  base_allocation?: number;
  this_year_remaining?: number;
  cf_remaining?: number;
  is_paid?: boolean;
  max_carry_forward?: number;
}

export interface LeaveRequest {
  id: number;
  employee?: number;
  employee_id?: number;
  employee_name?: string;
  emp_code?: string;
  leave_type: number;
  leave_type_name?: string;
  start_date: string;
  end_date: string;
  session: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  days: number;
  applied_at: string;
  approver_name?: string;
  approver_note?: string;
  doc_url?: string;
}

export interface Holiday {
  id: number;
  date: string;
  name: string;
  description?: string;
}

export interface SystemSetting {
  id: number;
  key: string;
  value: string;
  category: string;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number') return Number.isFinite(value) ? value : fallback;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const normalizeLeaveBalance = (balance: LeaveBalance): LeaveBalance => ({
  ...balance,
  total: toNumber(balance.total),
  used: toNumber(balance.used),
  pending: toNumber(balance.pending),
  remaining: toNumber(balance.remaining),
  carried_forward: balance.carried_forward === undefined ? undefined : toNumber(balance.carried_forward),
  carried: balance.carried === undefined ? undefined : toNumber(balance.carried),
  base_allocation: balance.base_allocation === undefined ? undefined : toNumber(balance.base_allocation),
  this_year_remaining: balance.this_year_remaining === undefined ? undefined : toNumber(balance.this_year_remaining),
  cf_remaining: balance.cf_remaining === undefined ? undefined : toNumber(balance.cf_remaining),
  max_carry_forward: balance.max_carry_forward === undefined ? undefined : toNumber(balance.max_carry_forward),
});

const normalizeLeaveRequest = (request: LeaveRequest): LeaveRequest => ({
  ...request,
  employee_id: request.employee_id ?? request.employee,
  days: toNumber(request.days),
});

const normalizePriorUsage = (data: any) => ({
  ...data,
  requested_days: toNumber(data?.requested_days),
  total_prior_days: toNumber(data?.total_prior_days),
  prior_approved: (data?.prior_approved || []).map(normalizeLeaveRequest),
  prior_pending: (data?.prior_pending || []).map(normalizeLeaveRequest),
  annual_balance: data?.annual_balance
    ? {
        ...data.annual_balance,
        total: toNumber(data.annual_balance.total),
        used: toNumber(data.annual_balance.used),
        pending: toNumber(data.annual_balance.pending),
        remaining: toNumber(data.annual_balance.remaining),
      }
    : data?.annual_balance,
  comp_off: data?.comp_off
    ? {
        ...data.comp_off,
        available_days: toNumber(data.comp_off.available_days),
        worked_days: toNumber(data.comp_off.worked_days),
        used_or_pending_days: toNumber(data.comp_off.used_or_pending_days),
      }
    : data?.comp_off,
});

export const leaveService = {
  // Leave Types
  getLeaveTypes: () => rolesApi.get<LeaveType[]>('/leave/types/'),
  createLeaveType: (data: Partial<LeaveType>) => rolesApi.post('/leave/types/', data),
  updateLeaveType: (id: number, data: Partial<LeaveType>) => rolesApi.patch(`/leave/types/${id}/`, data),
  deleteLeaveType: (id: number) => rolesApi.delete(`/leave/types/${id}/`),

  // Leave Balances
  getMyBalance: (year: number, employee?: string | number) =>
    rolesApi.get<LeaveBalance[]>('/leave/balance/', { params: { year, employee } }).then(response => ({
      ...response,
      data: (response.data || []).map(normalizeLeaveBalance),
    })),

  // Leave Applications
  applyLeave: (data: { leave_type: string; start_date: string; end_date: string; session: string; reason: string; doc_url?: string }) =>
    rolesApi.post('/leave/apply/', data),
  getMyRequests: (status?: string) =>
    rolesApi.get<LeaveRequest[]>('/leave/my/', { params: { status } }).then(response => ({
      ...response,
      data: (response.data || []).map(normalizeLeaveRequest),
    })),
  cancelLeave: (id: number) => rolesApi.post(`/leave/${id}/cancel/`),

  // Leave Approvals
  getAllRequests: (status?: string, employee?: string | number, start_date?: string, end_date?: string) =>
    rolesApi.get<LeaveRequest[]>('/leave/all/', { params: { status, employee, start_date, end_date } }).then(response => ({
      ...response,
      data: (response.data || []).map(normalizeLeaveRequest),
    })),
  leaveAction: (id: number, action: 'approve' | 'reject', note: string) =>
    rolesApi.post(`/leave/${id}/action/`, { action, note }),
  getLeavePriorUsage: (id: number) =>
    rolesApi.get(`/leave/${id}/prior-usage/`, { params: { id } }).then(response => ({
      ...response,
      data: normalizePriorUsage(response.data),
    })),

  // System Settings
  getSystemSettings: () => rolesApi.get<Record<string, SystemSetting[]>>('/system-settings/'),

  // Holidays
  getHolidays: () => rolesApi.get<Holiday[]>('/attendance/holidays/'),
  createHoliday: (data: { date: string; name: string; description?: string }) =>
    rolesApi.post('/attendance/holidays/', data),
  updateHoliday: (id: number, data: { date: string; name: string; description?: string }) =>
    rolesApi.put(`/attendance/holidays/${id}/`, data),
  deleteHoliday: (id: number) => rolesApi.delete(`/attendance/holidays/${id}/`),
};