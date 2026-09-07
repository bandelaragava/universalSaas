import rolesApi from './rolesApi';

export interface EmployeeOption {
  id: number;
  user_id: number;
  attendance_id?: string;
  emp_code: string;
  username: string;
  first_name: string;
  last_name: string;
  display_name: string;
  email: string;
  role: string;
  base_role?: string;
  employee_type: string;
  department?: number | null;
  department_name?: string | null;
  designation?: string | null;
  work_mode?: string | null;
  manager?: number | null;
  manager_name?: string | null;
  joining_date?: string | null;
}

const sortEmployees = (employees: EmployeeOption[]) =>
  [...employees].sort((a, b) => {
    const aName = a.display_name || a.username;
    const bName = b.display_name || b.username;
    return aName.localeCompare(bName);
  });

interface JavaUser {
  id?: number | string;
  userId?: number | string;
  user_id?: number | string;
  firstName?: string;
  first_name?: string;
  lastName?: string;
  last_name?: string;
  name?: string;
  username?: string;
  email?: string;
  active?: boolean;
  roleName?: string;
  role?: string;
  supervisorUserId?: number | string | null;
  supervisor_user_id?: number | string | null;
  reportingToUserId?: number | string | null;
  managerId?: number | string | null;
  supervisorName?: string | null;
  managerName?: string | null;
  employeeId?: string;
  emp_code?: string;
  profileData?: Record<string, unknown> | null;
  joiningDate?: string | null;
  designationName?: string | null;
  workModeName?: string | null;
  employeeTypeName?: string | null;
  departmentNames?: string[] | null;
  departmentIds?: (number | string)[] | null;
}

const asArray = <T>(payload: T[] | { data?: T[]; content?: T[]; results?: T[] } | unknown): T[] => {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    const wrapped = payload as { data?: T[]; content?: T[]; results?: T[] };
    return wrapped.data || wrapped.content || wrapped.results || [];
  }
  return [];
};

const normalizeId = (value: unknown) => String(value ?? '').trim();
const normalizeRole = (value?: string | null) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');

const javaId = (user: JavaUser) => normalizeId(user.id ?? user.userId ?? user.user_id);

const javaSupervisorId = (user: JavaUser) => {
  const profile = user.profileData || {};
  return normalizeId(
    user.supervisorUserId ??
    user.supervisor_user_id ??
    user.reportingToUserId ??
    user.managerId ??
    profile.reporting_supervisor_id ??
    profile.reportingSupervisorId ??
    profile.supervisorUserId ??
    profile.managerId
  );
};

const baseRoleFromJavaRole = (value?: string | null) => {
  const role = normalizeRole(value);
  if (!role) return 'employee';
  if (role.includes('super') && role.includes('admin')) return 'superadmin';
  if (role.includes('admin')) return 'admin';
  if (role.includes('hr') || role.includes('human_resource')) return 'hr';
  if (role.includes('manager') || role.includes('head') || role.includes('director')) return 'manager';
  if (role.includes('lead') || role.includes('leader') || role.includes('tl')) return 'tl';
  if (role.includes('counsel')) return 'counselor';
  return 'employee';
};

const currentUserIds = (me: JavaUser | null) => {
  const ids = new Set<string>();
  if (me) {
    ids.add(javaId(me));
    ids.add(normalizeId(me.id));
    ids.add(normalizeId(me.userId));
    ids.add(normalizeId(me.user_id));
  }
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const payload = JSON.parse(atob(token.split('.')[1]));
      ids.add(normalizeId(payload.id));
      ids.add(normalizeId(payload.userId));
      ids.add(normalizeId(payload.user_id));
      ids.add(normalizeId(payload.sub));
    }
  } catch {
    // Ignore malformed session payloads; backend calls still enforce access.
  }
  return new Set(Array.from(ids).filter(Boolean));
};

const isSuperAdminSession = (me: JavaUser | null) => {
  const storedRole = localStorage.getItem('role');
  const permissions = (() => {
    try {
      return JSON.parse(localStorage.getItem('permissions') || '[]') as string[];
    } catch {
      return [];
    }
  })();
  const role = normalizeRole(me?.roleName || me?.role || storedRole);
  return permissions.includes('*') || (role.includes('super') && role.includes('admin'));
};

const isHrSession = (me: JavaUser | null) => {
  const storedRole = localStorage.getItem('role');
  const role = normalizeRole(me?.roleName || me?.role || storedRole);
  return role.includes('hr') || role.includes('human_resource');
};

// Scoping is now done directly on the merged list.

const javaUserToEmployee = (user: JavaUser): EmployeeOption => {
  const profile = user.profileData || {};
  const id = javaId(user);
  const firstName = user.firstName || user.first_name || '';
  const lastName = user.lastName || user.last_name || '';
  const username = user.username || user.email || `user-${id}`;
  const displayName = `${firstName} ${lastName}`.trim() || user.name || username;
  const role = user.roleName || user.role || 'Employee';
  const empCode = user.employeeId || user.emp_code || String(profile.emp_code || profile.employeeId || profile.employee_id || `USR-${id}`);
  const attendanceId = [
    'java',
    id,
    encodeURIComponent(user.email || ''),
    encodeURIComponent(role),
    encodeURIComponent(firstName),
    encodeURIComponent(lastName),
    encodeURIComponent(empCode),
  ].join(':');

  return {
    id: Number(id) || 0,
    user_id: Number(id) || 0,
    attendance_id: attendanceId,
    emp_code: empCode,
    username,
    first_name: firstName,
    last_name: lastName,
    display_name: displayName,
    email: user.email || '',
    role,
    base_role: baseRoleFromJavaRole(role),
    employee_type: String(user.employeeTypeName || profile.employee_type || profile.employeeType || 'regular'),
    department: user.departmentIds && user.departmentIds.length > 0 ? Number(user.departmentIds[0]) : (profile.department_id ? Number(profile.department_id) : null),
    department_name: user.departmentNames && user.departmentNames.length > 0 ? String(user.departmentNames[0]) : (profile.department_name ? String(profile.department_name) : null),
    designation: user.designationName || (profile.designation ? String(profile.designation) : null),
    work_mode: user.workModeName || (profile.work_mode ? String(profile.work_mode) : null),
    manager: Number(javaSupervisorId(user)) || null,
    manager_name: user.supervisorName || user.managerName || String(profile.reporting_supervisor_name || profile.reportingSupervisorName || '') || null,
    joining_date: user.joiningDate || String(profile.joining_date || profile.joiningDate || ''),
  };
};

const mergeEmployees = (lapEmployees: EmployeeOption[], javaUsers: JavaUser[]) => {
  const merged = new Map<string, EmployeeOption>();
  lapEmployees.forEach((employee) => {
    const key = employee.email ? `email:${employee.email.toLowerCase()}` : `id:${employee.user_id}`;
    merged.set(key, employee);
  });
  javaUsers.forEach((user) => {
    const employee = javaUserToEmployee(user);
    const key = employee.email ? `email:${employee.email.toLowerCase()}` : `java:${javaId(user)}`;
    const existing = merged.get(key);
    // @ts-ignore
    merged.set(key, {
      ...(existing || {}) as any,
      ...employee as any,
      user_id: employee.user_id || existing?.user_id || '',
      attendance_id: employee.attendance_id || existing?.attendance_id,
      manager: employee.manager ?? existing?.manager,
      manager_name: employee.manager_name || existing?.manager_name,
      role: employee.role || existing?.role,
      base_role: employee.base_role || existing?.base_role,
      joining_date: employee.joining_date || existing?.joining_date,
    });
  });
  return Array.from(merged.values());
};

const dedupeJavaUsers = (javaUsers: JavaUser[]) => {
  const seen = new Set<string>();
  return javaUsers.filter((user) => {
    const id = javaId(user);
    const email = normalizeId(user.email || user.username).toLowerCase();
    const key = id ? `id:${id}` : `email:${email}`;
    if (!key || key === 'email:' || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export const employeeService = {
  list: async (params: { role?: string; department?: string; active?: boolean; search?: string } = {}) => {
    const meRes = await rolesApi.get<JavaUser>('/users/me', { ignore403: true }).catch(() => ({ data: null as JavaUser | null }));
    const me = meRes.data || null;

    const [lapRes, usersRes] = await Promise.all([
      rolesApi.get<EmployeeOption[]>('/employees/', { params, ignore403: true }).catch(() => ({ data: [] as EmployeeOption[] })),
      rolesApi.get<JavaUser[] | { data?: JavaUser[]; content?: JavaUser[]; results?: JavaUser[] }>('/users', {
        params: { search: params.search || undefined },
        ignore403: true,
      }).catch(() => ({ data: [] as JavaUser[] })),
    ]);

    const javaUsers = dedupeJavaUsers(asArray<JavaUser>(usersRes.data));
    const mergedAll = mergeEmployees(lapRes.data || [], javaUsers);

    // Now apply scoping to the merged list so we can use manager properties from both LAP and Java DB
    const activeUsers = mergedAll.filter(emp => emp.user_id && (emp as any).active !== false);
    
    let scopedEmployees = activeUsers;
    if (!isSuperAdminSession(me)) {
      const visible = new Set<string>();
      let frontier = Array.from(currentUserIds(me));

      while (frontier.length) {
        const next: string[] = [];
        activeUsers.forEach((emp) => {
          const id = normalizeId(emp.user_id || '');
          const supervisorId = normalizeId(emp.manager);
          if (supervisorId && frontier.includes(supervisorId) && !visible.has(id)) {
            visible.add(id);
            next.push(id);
          }
        });
        frontier = next;
      }

      scopedEmployees = activeUsers.filter((emp) => {
        if (!visible.has(normalizeId(emp.user_id || ''))) return false;
        const roleGroup = baseRoleFromJavaRole(emp.role);
        return roleGroup !== 'superadmin' && roleGroup !== 'admin' && roleGroup !== 'hr';
      });
    }

    return {
      ...lapRes,
      data: sortEmployees(scopedEmployees),
    };
  },
};
