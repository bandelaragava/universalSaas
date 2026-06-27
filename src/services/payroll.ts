import rolesApi from './rolesApi';

export interface SalaryStructure {
  id: string;
  employee?: string | number;
  employee_id: string;
  employee_name: string;
  employee_email?: string;
  basic_salary: number;
  hra: number;
  special_allowance: number;
  other_allowances: number;
  pf_deduction: number;
  insurance_deduction: number;
  tax_deduction: number;
  net_salary: number;
  is_active: boolean;
  ctc: number;
  basic: number;
  da: number;
  transport: number;
  medical: number;
  other_allowance: number;
  pf_employee: number;
  esi_employee: number;
  pt: number;
  gross: number;
  total_deductions: number;
  net_pay: number;
  basic_percent: number;
  hra_percent: number;
  da_percent: number;
  pf_percent: number;
  esi_percent: number;
  effective_date: string;
  emp_code?: string;
  earnings_breakdown?: Record<string, number>;
  deductions_breakdown?: Record<string, number>;
  calculation_summary?: Record<string, number | string | boolean>;
}

export interface PayrollRun {
  id: string;
  name: string;
  month: number;
  year: number;
  status: 'draft' | 'processed' | 'approved' | 'locked';
  total_gross?: number;
  total_deductions?: number;
  total_net?: number;
  created_at: string;
  entry_count?: number;
  total_net_pay?: number;
  period_start?: string;
  period_end?: string;
  period_label?: string;
  locked_at?: string;
}

export interface PayrollRunEntry {
  id: string;
  employee_id: string;
  employee_name: string;
  emp_code?: string;
  department?: string;
  working_days: number;
  present_days: number;
  holiday_count: number;
  extra_work_days: number;
  comp_off_days: number;
  lop_days: number;
  basic: number;
  hra: number;
  da: number;
  special_allowance: number;
  transport: number;
  medical: number;
  other_allowance: number;
  ot_hours: number;
  ot_pay: number;
  extra_work_pay: number;
  pf_employee: number;
  esi_employee: number;
  pt: number;
  tds: number;
  lop_deduction: number;
  total_deductions: number;
  gross: number;
  net_pay: number;
  adjustments: unknown[];
  employee_type?: string;
  earnings_breakdown?: Record<string, number>;
  deductions_breakdown?: Record<string, number>;
  attendance_breakdown?: {
    total_days: number;
    working_days: number;
    present_days: number;
    lop_days: number;
    holiday_count: number;
    holiday_names: string[];
    ot_hours: number;
    extra_work_days: number;
    extra_work_dates: unknown[];
    comp_off_days: number;
  };
  calculation_summary?: Record<string, number | string | boolean>;
}

export interface Payslip {
  id: string;
  month: number;
  year: number;
  gross_earnings: number;
  total_deductions: number;
  net_salary: number;
  status: 'draft' | 'processed' | 'paid';
  pdf_url?: string;
}

export interface PayrollDashboardStats {
  total_payroll: number;
  processed_count: number;
  pending_count: number;
  bonuses: number;
}

export const payrollService = {
  getSalaryList: (employeeId?: string | number) =>
    rolesApi.get<SalaryStructure[]>('/payroll/salary/', { params: { employee: employeeId } }),
  createSalary: (data: unknown) =>
    rolesApi.post<SalaryStructure>('/payroll/salary/create/', data),
  updateSalary: (id: string, data: Partial<SalaryStructure>) =>
    rolesApi.patch<SalaryStructure>(`/payroll/salary/${id}/`, data),
  getMySalary: () => rolesApi.get<SalaryStructure>('/payroll/salary/mine/'),
  getPayrollSettingsDefaults: () => rolesApi.get<Record<string, number>>('/payroll/settings-defaults/'),
  getRuns: () => rolesApi.get<PayrollRun[]>('/payroll/runs/'),
  createRun: (data: { month: number; year: number; period_start?: string; period_end?: string }) =>
    rolesApi.post<PayrollRun>('/payroll/runs/create/', data),
  getRunDetail: (id: string) => rolesApi.get<{ run: PayrollRun; entries: PayrollRunEntry[]; available_employees: Record<string, unknown>[] }>(`/payroll/runs/${id}/`),
  processRun: (id: string, data: Record<string, unknown> = {}) =>
    rolesApi.post<{ created?: number }>(`/payroll/runs/${id}/process/`, data),
  approveRun: (id: string) => rolesApi.post<PayrollRun>(`/payroll/runs/${id}/approve/`),
  getRunRegister: (id: string) => rolesApi.get<PayrollRunEntry[]>(`/payroll/runs/${id}/register/`),
  updateEntry: (id: string, data: Partial<PayrollRunEntry>) =>
    rolesApi.patch<PayrollRunEntry>(`/payroll/entries/${id}/`, data),
  addAdjustment: (id: string, data: { type: string; amount: string; reason: string }) =>
    rolesApi.post<PayrollRunEntry>(`/payroll/entries/${id}/adjust/`, data),
  getMyPayslips: (employeeId?: string | number, startDate?: string, endDate?: string) =>
    rolesApi.get<unknown[]>('/payroll/payslips/', {
      params: { employee: employeeId, start_date: startDate, end_date: endDate },
    }),
  getPayslipDetail: (month: number, year: number) =>
    rolesApi.get<Payslip>(`/payroll/payslips/${month}/${year}/`),
  getDashboardStats: () => rolesApi.get<PayrollDashboardStats>('/payroll/dashboard-stats/'),
  listEmployees: () => rolesApi.get<unknown[]>('/employees/'),
};