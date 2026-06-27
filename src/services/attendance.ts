import rolesApi from './rolesApi';

export interface OfficeLocation {
  id?: string | null;
  name: string;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  configured?: boolean;
}

export interface AttendanceRecord {
  id?: string | null;
  employee?: string | number;
  employee_name?: string;
  emp_code?: string;
  date: string;
  check_in?: string | null;
  check_out?: string | null;
  status: string;
  hours_worked: number;
  ot_hours: number;
  work_mode: 'office' | 'work_from_home';
  is_wfh: boolean;
  checkin_distance_m?: number | null;
  checkout_distance_m?: number | null;
  checkin_latitude?: number | null;
  checkin_longitude?: number | null;
  checkout_latitude?: number | null;
  checkout_longitude?: number | null;
  holiday_name?: string | null;
  pending_reason?: string | null;
}

export interface AttendancePolicy {
  shift_start: string;
  shift_end: string;
  grace_minutes: number;
  late_cutoff: string;
  standard_hours: number;
  half_day_hours: number;
  weekend_days: string[];
  night_shift_enabled: boolean;
  night_shift_start: string;
  night_shift_end: string;
}

export interface MonthlyAttendanceResponse {
  month: number;
  year: number;
  summary: Record<string, number>;
  records: AttendanceRecord[];
  holidays: Holiday[];
  policy?: AttendancePolicy;
}

export interface Holiday {
  id: string;
  name: string;
  date: string;
  description?: string;
}

export interface RegularizationRequest {
  id: string;
  employee_id: string;
  employee_name: string;
  date: string;
  requested_check_in?: string | null;
  requested_check_out?: string | null;
  requested_checkin?: string | null;
  requested_checkout?: string | null;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  manager_note?: string;
  approver_note?: string;
  created_at: string;
}

const normalizeRegularization = (request: RegularizationRequest): RegularizationRequest => ({
  ...request,
  employee_id: String(request.employee_id || (request as any).employee || ''),
  requested_check_in: request.requested_check_in ?? request.requested_checkin ?? null,
  requested_check_out: request.requested_check_out ?? request.requested_checkout ?? null,
  manager_note: request.manager_note ?? request.approver_note ?? '',
});

export const attendanceService = {
  getOfficeLocation: () => rolesApi.get<OfficeLocation>('/attendance/office-location/'),
  setOfficeLocation: (data: OfficeLocation) => rolesApi.post<OfficeLocation>('/attendance/office-location/', data),
  checkIn: (is_wfh = false, latitude: number | null = null, longitude: number | null = null) =>
    rolesApi.post<{ record: AttendanceRecord }>('/attendance/checkin/', { is_wfh, latitude, longitude }),
  checkOut: (latitude: number | null = null, longitude: number | null = null) =>
    rolesApi.post<AttendanceRecord>('/attendance/checkout/', { latitude, longitude }),
  getToday: () => rolesApi.get<{
    record: AttendanceRecord | null;
    status: string;
    holiday?: Holiday | null;
    is_wfh: boolean;
    work_mode: string;
    check_in?: string | null;
    check_out?: string | null;
    hours_worked?: number;
    ot_hours?: number;
  }>('/attendance/today/'),
  getMyAttendance: (month: number, year: number, employeeId?: string | number, startDate?: string, endDate?: string) =>
    rolesApi.get<MonthlyAttendanceResponse | AttendanceRecord[]>('/attendance/my/', {
      params: { month, year, employee: employeeId, start_date: startDate, end_date: endDate },
    }),
  getAllAttendance: (month: number, year: number, employeeId?: string | number, startDate?: string, endDate?: string) =>
    rolesApi.get<AttendanceRecord[]>('/attendance/all/', {
      params: { month, year, employee: employeeId, start_date: startDate, end_date: endDate },
    }),
  applyRegularization: (data: { date: string; requested_check_in?: string; requested_check_out?: string; reason: string }) => {
    const formatTime = (t?: string) => t ? (t.length === 5 ? `${t}:00` : t) : null;
    return rolesApi.post<RegularizationRequest>('/attendance/regularize/', {
      date: data.date,
      requested_check_in: formatTime(data.requested_check_in),
      requested_check_out: formatTime(data.requested_check_out),
      reason: data.reason || '',
    });
  },
  getMyRegularizations: () =>
    rolesApi.get<RegularizationRequest[]>('/attendance/regularize/my/').then((res) => ({
      ...res,
      data: (res.data || []).map(normalizeRegularization),
    })),
  getAllRegularizations: (status?: string, employeeId?: string | number) =>
    rolesApi.get<RegularizationRequest[]>('/attendance/regularize/all/', { params: { status, employee: employeeId } }).then((res) => ({
      ...res,
      data: (res.data || []).map(normalizeRegularization),
    })),
  actionRegularization: (id: string, action: 'approve' | 'reject', note: string) =>
    rolesApi.post<RegularizationRequest>(`/attendance/regularize/${id}/action/`, { action, note }).then((res) => ({
      ...res,
      data: normalizeRegularization(res.data),
    })),
  getHolidays: () => rolesApi.get<Holiday[]>('/attendance/holidays/'),
  createHoliday: (data: Omit<Holiday, 'id'>) => rolesApi.post<Holiday>('/attendance/holidays/', data),
  updateHoliday: (id: string, data: Partial<Holiday>) => rolesApi.put<Holiday>(`/attendance/holidays/${id}/`, data),
  deleteHoliday: (id: string) => rolesApi.delete(`/attendance/holidays/${id}/`),
};