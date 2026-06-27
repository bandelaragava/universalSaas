import rolesApi from './rolesApi';

export interface EmployeeOption {
  user_id: number | string;
  attendance_id?: string | number;
  emp_code?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  role?: string;
  base_role?: string;
  manager_id?: number | string;
  manager?: number | string;
  department?: string;
  department_name?: string;
  designation?: string;
  email?: string;
  manager_name?: string;
  work_mode?: string;
  joining_date?: string;
}

export const employeeService = {
  list: (params?: any) => rolesApi.get<EmployeeOption[]>('/employees/', { params }),
};
