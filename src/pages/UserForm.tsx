// /* eslint-disable react-hooks/set-state-in-effect */
// import React, { useState, useEffect, useCallback } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Shield, Users, Sparkles, UserPlus } from 'lucide-react';
// import rolesApi from '@/services/rolesApi';
// import EntityFormPage from '@/components/shared/EntityFormPage';
// import { usePermissions } from '@/auth/usePermissions';

// interface Role {
//     id: number;
//     name: string;
//     active: boolean;
// }

// interface Supervisor {
//     id: number;
//     name: string;
// }

// interface ExtraField {
//     id: number;
//     fieldName: string;
//     label: string;
//     type: 'TEXT' | 'NUMBER' | 'DROPDOWN' | string;
//     required: boolean;
//     options?: string[];
// }

// interface BusinessEntity {
//     id: number;
//     entityCode: string;
//     companyName: string;
//     active: boolean;
//     showInUserForm?: boolean;
// }

// interface Department {
//     id: number;
//     deptCode: string;
//     deptName: string;
//     active: boolean;
//     showInUserForm?: boolean;
// }

// interface Permission {
//     id: number;
//     module: string;
//     action: string;
//     permissionKey: string;
//     description: string;
//     active: boolean;
// }

// interface UserFormProps {
//     userId?: number | null;
//     onClose?: () => void;
// }

// const normalizePermissionKey = (value: unknown) =>
//     String(value || '')
//         .toUpperCase()
//         .replace(/[^A-Z0-9]+/g, '_')
//         .replace(/^_+|_+$/g, '');

// const permissionCodesFromUser = (user: Record<string, unknown>) => {
//     // Only load explicit user permissions. Do NOT load user.permissions which might contain role permissions.
//     const raw =
//         user.explicitPermissions ||
//         user.userPermissions ||
//         [];

//     if (!Array.isArray(raw)) return [];

//     return raw
//         .map((item) => {
//             if (typeof item === 'string') return item;

//             if (item && typeof item === 'object') {
//                 const record = item as Record<string, unknown>;
//                 return record.permissionKey || record.code || record.name || record.authority || '';
//             }

//             return '';
//         })
//         .map(normalizePermissionKey)
//         .filter(Boolean);
// };

// const selectedPermissionIdsFromUser = (
//     user: Record<string, unknown>,
//     permissions: Permission[]
// ) => {
//     const codes = permissionCodesFromUser(user);

//     if (codes.length > 0) {
//         const codeSet = new Set(codes);

//         return permissions
//             .filter((permission) =>
//                 codeSet.has(normalizePermissionKey(permission.permissionKey))
//             )
//             .map((permission) => permission.id);
//     }

//     const ids = Array.isArray(user.explicitPermissionIds) ? user.explicitPermissionIds : [];

//     return ids
//         .map((id) => Number(id))
//         .filter(
//             (id) =>
//                 Number.isFinite(id) &&
//                 permissions.some((permission) => permission.id === id)
//         );
// };

// export default function UserForm({ userId, onClose }: UserFormProps = {}) {
//     const { hasPermission } = usePermissions();
//     const { id: paramId } = useParams();
//     const activeId = userId !== undefined ? userId : paramId ? Number(paramId) : null;
//     const isEdit = Boolean(activeId);
//     const navigate = useNavigate();

//     const [firstName, setFirstName] = useState('');
//     const [lastName, setLastName] = useState('');
//     const [email, setEmail] = useState('');
//     const [password, setPassword] = useState('');
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const [gender, setGender] = useState('MALE');
//     const [selectedRoleId, setSelectedRoleId] = useState('');
//     const [supervisorUserId, setSupervisorUserId] = useState('');
//     const [profileData, setProfileData] = useState<Record<string, unknown>>({});

//     const [employeeId, setEmployeeId] = useState('');
//     const [empCode, setEmpCode] = useState('');
//     const [joiningDate, setJoiningDate] = useState(
//         new Date().toISOString().split('T')[0]
//     );
//     const [employeeType, setEmployeeType] = useState('regular');
//     const [designation, setDesignation] = useState('software_engineer');
//     const [workMode, setWorkMode] = useState('office');
//     const [dateOfBirth, setDateOfBirth] = useState('');
//     const [address, setAddress] = useState('');

//     const [roles, setRoles] = useState<Role[]>([]);
//     const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
//     const [dynamicFields, setDynamicFields] = useState<ExtraField[]>([]);

//     const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
//     const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
//     const [permissionSearch, setPermissionSearch] = useState('');

//     const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);
//     const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
//     const [availableEntities, setAvailableEntities] = useState<BusinessEntity[]>([]);
//     const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

//     const [loading, setLoading] = useState(false);
//     const [fetching, setFetching] = useState(isEdit);
//     const [toast, setToast] = useState<{
//         type: 'success' | 'error';
//         msg: string;
//     } | null>(null);

//     const showToast = useCallback((type: 'success' | 'error', msg: string) => {
//         setToast({ type, msg });
//         setTimeout(() => setToast(null), 4000);
//     }, []);

//     useEffect(() => {
//         const ctrl = new AbortController();

//         const fetchInitialData = async () => {
//             setFetching(true);

//             try {
//                 const [rolesRes, permissionsRes, entitiesRes, departmentsRes] =
//                     await Promise.all([
//                         rolesApi.get<Role[]>('/roles', { signal: ctrl.signal }),
//                         rolesApi.get<Permission[]>('/permissions', { signal: ctrl.signal }),
//                         rolesApi
//                             .get<BusinessEntity[]>('/business-entities/active', {
//                                 signal: ctrl.signal,
//                             })
//                             .catch(() =>
//                                 rolesApi.get<BusinessEntity[]>('/business-entities', {
//                                     signal: ctrl.signal,
//                                 })
//                             )
//                             .catch((err) => {
//                                 console.warn('Failed to load business entities:', err);
//                                 return { data: [] as BusinessEntity[] };
//                             }),
//                         rolesApi
//                             .get<Department[]>('/departments/active', {
//                                 signal: ctrl.signal,
//                             })
//                             .catch(() =>
//                                 rolesApi.get<Department[]>('/departments', {
//                                     signal: ctrl.signal,
//                                 })
//                             )
//                             .catch((err) => {
//                                 console.warn('Failed to load departments:', err);
//                                 return { data: [] as Department[] };
//                             }),
//                     ]);

//                 const fetchedRoles = (rolesRes.data || []).filter((role) => role.active);
//                 const fetchedPermissions = (permissionsRes.data || []).filter(
//                     (permission) => permission.active !== false
//                 );
//                 const fetchedEntities = (entitiesRes.data || []).filter(
//                     (entity) => entity.active !== false && entity.showInUserForm !== false
//                 );
//                 const fetchedDepartments = (departmentsRes.data || []).filter(
//                     (dept) => dept.active !== false && dept.showInUserForm !== false
//                 );

//                 setRoles(fetchedRoles);
//                 setAvailablePermissions(fetchedPermissions);
//                 setAvailableEntities(fetchedEntities);
//                 setAvailableDepartments(fetchedDepartments);

//                 if (isEdit && activeId) {
//                     const userRes = await rolesApi.get(`/users/${activeId}`, {
//                         signal: ctrl.signal,
//                     });

//                     const u = userRes.data as Record<string, any>;

//                     setFirstName(u.firstName || '');
//                     setLastName(u.lastName || '');
//                     setEmail(u.email || '');
//                     setPhoneNumber(u.phoneNumber || '');
//                     setGender(u.gender || 'MALE');
//                     setSelectedRoleId(u.roleId ? String(u.roleId) : '');
//                     setSupervisorUserId(u.supervisorUserId ? String(u.supervisorUserId) : '');
//                     setEmployeeId(u.employeeId || '');

//                     const pd = u.profileData || {};
//                     setProfileData(pd);
//                     setEmpCode(String(pd.emp_code || u.employeeId || ''));
//                     setJoiningDate(
//                         String(pd.joining_date || new Date().toISOString().split('T')[0])
//                     );
//                     setEmployeeType(String(pd.employee_type || 'regular'));
//                     setDesignation(String(pd.designation || 'software_engineer'));
//                     setWorkMode(String(pd.work_mode || 'office'));
//                     setDateOfBirth(String(pd.date_of_birth || ''));
//                     setAddress(String(pd.address || ''));

//                     setSelectedPermissions(
//                         selectedPermissionIdsFromUser(u, fetchedPermissions)
//                     );
//                     setSelectedEntityIds(Array.isArray(u.entityIds) ? u.entityIds : []);
//                     setSelectedDepartmentIds(
//                         Array.isArray(u.departmentIds) ? u.departmentIds : []
//                     );
//                 }
//             } catch (err: unknown) {
//                 const error = err as { name?: string };
//                 if (error.name === 'CanceledError') return;

//                 console.error('Failed to load user form data:', err);
//                 showToast(
//                     'error',
//                     'Failed to load roles, permissions, entities, or departments from backend.'
//                 );
//             } finally {
//                 setFetching(false);
//             }
//         };

//         fetchInitialData();

//         return () => ctrl.abort();
//     }, [activeId, isEdit, showToast]);

//     useEffect(() => {
//         if (!selectedRoleId) {
//             setDynamicFields([]);
//             setSupervisors([]);
//             return;
//         }

//         const ctrl = new AbortController();

//         const loadRoleSpecificDetails = async () => {
//             try {
//                 const [fieldsRes, supervisorsRes] = await Promise.all([
//                     rolesApi.get<ExtraField[]>(`/roles/${selectedRoleId}/extra-fields`, {
//                         signal: ctrl.signal,
//                     }),
//                     rolesApi.get<Supervisor[]>(
//                         `/users/supervisors?roleId=${selectedRoleId}`,
//                         { signal: ctrl.signal }
//                     ),
//                 ]);

//                 setDynamicFields(fieldsRes.data || []);
//                 setSupervisors(supervisorsRes.data || []);
//             } catch (err: unknown) {
//                 const error = err as { name?: string };
//                 if (error.name === 'CanceledError') return;

//                 setDynamicFields([]);
//                 setSupervisors([]);
//             }
//         };

//         loadRoleSpecificDetails();

//         return () => ctrl.abort();
//     }, [selectedRoleId]);

//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();

//         const requiredPermission = isEdit ? 'USER_UPDATE' : 'USER_CREATE';

//         if (!hasPermission(requiredPermission)) {
//             showToast('error', 'Unauthorized: You do not have permission to perform this action.');
//             return;
//         }

//         setLoading(true);

//         // Build payload using snake_case keys expected by backend API
//         const payload: Record<string, any> = {};
//         // Helper to assign if value is not null/undefined/empty string
//         const assign = (key: string, value: any) => {
//             if (value !== null && value !== undefined && value !== '') {
//                 payload[key] = value;
//             }
//         };
//         assign('first_name', firstName);
//         assign('last_name', lastName);
//         assign('email', email);
//         assign('phone_number', phoneNumber);
//         assign('gender', gender);
//         assign('role_id', selectedRoleId ? parseInt(selectedRoleId, 10) : null);
//         assign('supervisor_user_id', supervisorUserId ? parseInt(supervisorUserId, 10) : null);
//         assign('employee_id', employeeId);
//         assign('date_of_birth', dateOfBirth);
//         assign('joining_date', joiningDate);
//         assign('employee_type_id', employeeTypeId ? parseInt(employeeTypeId, 10) : null);
//         assign('designation_id', designationId ? parseInt(designationId, 10) : null);
//         assign('work_mode_id', workModeId ? parseInt(workModeId, 10) : null);
//         // Permissions, entities, departments are arrays; include even if empty to satisfy API
//         payload['permission_ids'] = selectedPermissions;
//         payload['entity_ids'] = selectedEntityIds;
//         payload['department_ids'] = selectedDepartmentIds;
//         if (!isEdit) {
//             assign('password', password);
//         }

//         const selectedPermissionKeys = availablePermissions
//             .filter(p => selectedPermissions.includes(p.id))
//             .map(p => p.permissionKey);

//         console.log("USER FORM SUBMIT");
//         console.log("selectedPermissions:", selectedPermissions);
//         console.log("selected permission keys:", selectedPermissionKeys);
//         console.log("payload.permissionIds:", payload.permissionIds);

//         try {
//             if (isEdit) {
//                 await rolesApi.put(`/users/${activeId}`, payload);
//             } else {
//                 await rolesApi.post('/users', payload);
//             }

//             showToast(
//                 'success',
//                 isEdit ? 'User details updated successfully.' : 'User onboarded successfully.'
//             );

//             if (onClose) {
//                 setTimeout(onClose, 1000);
//             } else {
//                 setTimeout(() => navigate('/users'), 1000);
//             }
//         } catch (err: unknown) {
//             const axiosError = err as {
//                 response?: { data?: { message?: string } | string };
//                 message?: string;
//             };

//             let errorMsg = 'Failed to save user.';

//             if (axiosError.response) {
//                 if (
//                     typeof axiosError.response.data === 'object' &&
//                     axiosError.response.data?.message
//                 ) {
//                     errorMsg = axiosError.response.data.message;
//                 } else if (typeof axiosError.response.data === 'string') {
//                     errorMsg = axiosError.response.data;
//                 }
//             } else if (axiosError.message) {
//                 errorMsg = axiosError.message;
//             }

//             showToast('error', errorMsg);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleDynamicChange = (fieldName: string, value: string) => {
//         setProfileData((prev) => ({
//             ...prev,
//             [fieldName]: value,
//         }));
//     };

//     if (fetching) {
//         return (
//             <div className="flex min-h-[400px] items-center justify-center">
//                 <div className="space-y-2 text-center">
//                     <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-cyan-500 border-t-transparent" />
//                     <p className="text-sm text-muted-foreground">Loading user information...</p>
//                 </div>
//             </div>
//         );
//     }

//     return (
//         <div className={onClose ? 'w-full' : 'mx-auto max-w-4xl space-y-6'}>
//             {toast && (
//                 <div
//                     className={`fixed right-4 top-4 z-[9999] rounded-xl border px-4 py-3 text-sm shadow-lg ${toast.type === 'success'
//                             ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500'
//                             : 'border-rose-500/20 bg-rose-500/10 text-rose-500'
//                         }`}
//                     role="alert"
//                 >
//                     {toast.msg}
//                 </div>
//             )}

//             {!onClose && (
//                 <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-6">
//                     <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-500/20 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
//                         <UserPlus className="h-6 w-6" />
//                     </div>
//                     <div>
//                         <h2 className="text-lg font-bold tracking-tight text-foreground">
//                             {isEdit ? 'Modify Personnel Profile' : 'Onboard New Identity'}
//                         </h2>
//                         <p className="text-xs text-muted-foreground">
//                             Establish access clearance, credentials, and reporting chain layout.
//                         </p>
//                     </div>
//                 </div>
//             )}

//             <EntityFormPage
//                 title={isEdit ? 'Edit User' : 'Create User'}
//                 onSubmit={handleSubmit}
//                 loading={loading}
//                 isModal={Boolean(onClose)}
//                 onBack={onClose}
//             >
//                 <div className="space-y-6">
//                     <section className="space-y-4">
//                         <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
//                             <Users className="h-4 w-4" /> Personal Details
//                         </h3>

//                         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                             <InputField
//                                 label="First Name"
//                                 required
//                                 value={firstName}
//                                 onChange={setFirstName}
//                                 placeholder="Rahul"
//                             />

//                             <InputField
//                                 label="Last Name"
//                                 required
//                                 value={lastName}
//                                 onChange={setLastName}
//                                 placeholder="Sharma"
//                             />

//                             <InputField
//                                 label="Email ID"
//                                 type="email"
//                                 required
//                                 value={email}
//                                 onChange={setEmail}
//                                 placeholder="rahul@example.com"
//                                 disabled={isEdit}
//                                 helpText={isEdit ? 'Email address cannot be edited once registered.' : undefined}
//                             />

//                             <InputField
//                                 label="Phone Number"
//                                 type="tel"
//                                 value={phoneNumber}
//                                 onChange={setPhoneNumber}
//                                 placeholder="9100000000"
//                             />

//                             <SelectField
//                                 label="Gender"
//                                 value={gender}
//                                 onChange={setGender}
//                                 options={[
//                                     ['MALE', 'Male'],
//                                     ['FEMALE', 'Female'],
//                                     ['OTHER', 'Other'],
//                                     ['PREFER_NOT_TO_SAY', 'Prefer not to say'],
//                                 ]}
//                             />

//                             {!isEdit && (
//                                 <InputField
//                                     label="Password"
//                                     type="password"
//                                     required
//                                     value={password}
//                                     onChange={setPassword}
//                                     placeholder="••••••••"
//                                 />
//                             )}
//                         </div>
//                     </section>

//                     <hr className="border-border" />

//                     <section className="space-y-4">
//                         <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
//                             <Shield className="h-4 w-4" /> Role & System Access
//                         </h3>

//                         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                             <SelectField
//                                 label="Access Role"
//                                 required
//                                 value={selectedRoleId}
//                                 onChange={setSelectedRoleId}
//                                 options={roles.map((role) => [String(role.id), role.name])}
//                                 placeholder="Select a role..."
//                             />

//                             {supervisors.length > 0 && (
//                                 <SelectField
//                                     label="Reporting Supervisor"
//                                     value={supervisorUserId}
//                                     onChange={setSupervisorUserId}
//                                     options={supervisors.map((sup) => [String(sup.id), sup.name])}
//                                     placeholder="No supervisor"
//                                 />
//                             )}
//                         </div>
//                     </section>

//                     <hr className="border-border" />

//                     <section className="space-y-4">
//                         <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
//                             <Users className="h-4 w-4" /> Employee Profile Details
//                         </h3>

//                         <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                             <InputField
//                                 label="Employee ID / Code"
//                                 required
//                                 value={empCode}
//                                 onChange={(value) => {
//                                     setEmpCode(value);
//                                     setEmployeeId(value);
//                                 }}
//                                 placeholder="EMP001"
//                             />

//                             <InputField
//                                 label="Joining Date"
//                                 type="date"
//                                 required
//                                 value={joiningDate}
//                                 onChange={setJoiningDate}
//                             />

//                             <SelectField
//                                 label="Employee Type"
//                                 required
//                                 value={employeeType}
//                                 onChange={setEmployeeType}
//                                 options={[
//                                     ['regular', 'Regular'],
//                                     ['contract', 'Contract'],
//                                     ['parttime', 'Part-Time'],
//                                     ['intern', 'Intern'],
//                                 ]}
//                             />

//                             <SelectField
//                                 label="Designation"
//                                 required
//                                 value={designation}
//                                 onChange={setDesignation}
//                                 options={[
//                                     ['software_engineer', 'Software Engineer'],
//                                     ['senior_software_engineer', 'Senior Software Engineer'],
//                                     ['team_lead', 'Team Lead'],
//                                     ['project_manager', 'Project Manager'],
//                                     ['hr_executive', 'HR Executive'],
//                                     ['hr_manager', 'HR Manager'],
//                                     ['accountant', 'Accountant'],
//                                     ['analyst', 'Analyst'],
//                                     ['intern', 'Intern'],
//                                     ['other', 'Other'],
//                                 ]}
//                             />

//                             <SelectField
//                                 label="Work Mode"
//                                 required
//                                 value={workMode}
//                                 onChange={setWorkMode}
//                                 options={[
//                                     ['office', 'Office'],
//                                     ['work_from_home', 'Work From Home'],
//                                 ]}
//                             />

//                             <InputField
//                                 label="Date of Birth"
//                                 type="date"
//                                 value={dateOfBirth}
//                                 onChange={setDateOfBirth}
//                             />

//                             <div className="md:col-span-2">
//                                 <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                                     Address
//                                 </label>
//                                 <textarea
//                                     rows={3}
//                                     placeholder="Enter address details..."
//                                     className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
//                                     value={address}
//                                     onChange={(e) => setAddress(e.target.value)}
//                                 />
//                             </div>
//                         </div>
//                     </section>

//                     {dynamicFields.length > 0 && (
//                         <>
//                             <hr className="border-border" />
//                             <section className="space-y-4">
//                                 <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-primary">
//                                     <Sparkles className="h-4 w-4" /> Additional Role Properties
//                                 </h3>

//                                 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                                     {dynamicFields.map((field) => {
//                                         const value = String(profileData[field.fieldName] ?? '');

//                                         return (
//                                             <div key={field.id || field.fieldName}>
//                                                 {field.type === 'DROPDOWN' ? (
//                                                     <SelectField
//                                                         label={field.label}
//                                                         required={field.required}
//                                                         value={value}
//                                                         onChange={(next) =>
//                                                             handleDynamicChange(field.fieldName, next)
//                                                         }
//                                                         options={(field.options || []).map((option) => [
//                                                             option,
//                                                             option,
//                                                         ])}
//                                                         placeholder="Select option..."
//                                                     />
//                                                 ) : (
//                                                     <InputField
//                                                         label={field.label}
//                                                         type={field.type === 'NUMBER' ? 'number' : 'text'}
//                                                         required={field.required}
//                                                         value={value}
//                                                         onChange={(next) =>
//                                                             handleDynamicChange(field.fieldName, next)
//                                                         }
//                                                         placeholder={`Enter ${field.label.toLowerCase()}`}
//                                                     />
//                                                 )}
//                                             </div>
//                                         );
//                                     })}
//                                 </div>
//                             </section>
//                         </>
//                     )}

//                     {availableEntities.length > 0 && (
//                         <CheckboxGroup
//                             title="Assign Business Entities"
//                             items={availableEntities.map((entity) => ({
//                                 id: entity.id,
//                                 label: `${entity.entityCode} - ${entity.companyName}`,
//                             }))}
//                             selectedIds={selectedEntityIds}
//                             setSelectedIds={setSelectedEntityIds}
//                         />
//                     )}

//                     {availableDepartments.length > 0 && (
//                         <CheckboxGroup
//                             title="Assign Departments"
//                             items={availableDepartments.map((dept) => ({
//                                 id: dept.id,
//                                 label: `${dept.deptCode} - ${dept.deptName}`,
//                             }))}
//                             selectedIds={selectedDepartmentIds}
//                             setSelectedIds={setSelectedDepartmentIds}
//                         />
//                     )}

//                     <PermissionSelector
//                         availablePermissions={availablePermissions}
//                         selectedPermissions={selectedPermissions}
//                         setSelectedPermissions={setSelectedPermissions}
//                         permissionSearch={permissionSearch}
//                         setPermissionSearch={setPermissionSearch}
//                     />
//                 </div>
//             </EntityFormPage>
//         </div>
//     );
// }

// function InputField({
//     label,
//     value,
//     onChange,
//     type = 'text',
//     required = false,
//     placeholder,
//     disabled = false,
//     helpText,
// }: {
//     label: string;
//     value: string;
//     onChange: (value: string) => void;
//     type?: string;
//     required?: boolean;
//     placeholder?: string;
//     disabled?: boolean;
//     helpText?: string;
// }) {
//     return (
//         <div>
//             <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                 {label} {required && <span className="text-rose-500">*</span>}
//             </label>
//             <input
//                 type={type}
//                 required={required}
//                 placeholder={placeholder}
//                 disabled={disabled}
//                 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
//                 value={value}
//                 onChange={(e) => onChange(e.target.value)}
//             />
//             {helpText && (
//                 <span className="mt-1 block text-[10px] text-muted-foreground">
//                     {helpText}
//                 </span>
//             )}
//         </div>
//     );
// }

// function SelectField({
//     label,
//     value,
//     onChange,
//     options,
//     required = false,
//     placeholder,
// }: {
//     label: string;
//     value: string;
//     onChange: (value: string) => void;
//     options: [string, string][];
//     required?: boolean;
//     placeholder?: string;
// }) {
//     return (
//         <div>
//             <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
//                 {label} {required && <span className="text-rose-500">*</span>}
//             </label>
//             <select
//                 required={required}
//                 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500"
//                 value={value}
//                 onChange={(e) => onChange(e.target.value)}
//             >
//                 {placeholder && <option value="">{placeholder}</option>}
//                 {options.map(([optionValue, optionLabel]) => (
//                     <option key={optionValue} value={optionValue}>
//                         {optionLabel}
//                     </option>
//                 ))}
//             </select>
//         </div>
//     );
// }

// function CheckboxGroup({
//     title,
//     items,
//     selectedIds,
//     setSelectedIds,
// }: {
//     title: string;
//     items: { id: number; label: string }[];
//     selectedIds: number[];
//     setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
// }) {
//     return (
//         <>
//             <hr className="border-border" />
//             <section className="space-y-4">
//                 <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
//                     {title}
//                 </h3>

//                 <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-muted/30 p-4">
//                     {items.map((item) => {
//                         const isChecked = selectedIds.includes(item.id);

//                         return (
//                             <label
//                                 key={item.id}
//                                 className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/50"
//                             >
//                                 <input
//                                     type="checkbox"
//                                     className="h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-1 focus:ring-primary"
//                                     checked={isChecked}
//                                     onChange={(e) => {
//                                         if (e.target.checked) {
//                                             setSelectedIds((prev) => [...prev, item.id]);
//                                         } else {
//                                             setSelectedIds((prev) =>
//                                                 prev.filter((id) => id !== item.id)
//                                             );
//                                         }
//                                     }}
//                                 />
//                                 <span>{item.label}</span>
//                             </label>
//                         );
//                     })}
//                 </div>
//             </section>
//         </>
//     );
// }

// function PermissionSelector({
//     availablePermissions,
//     selectedPermissions,
//     setSelectedPermissions,
//     permissionSearch,
//     setPermissionSearch,
// }: {
//     availablePermissions: Permission[];
//     selectedPermissions: number[];
//     setSelectedPermissions: React.Dispatch<React.SetStateAction<number[]>>;
//     permissionSearch: string;
//     setPermissionSearch: React.Dispatch<React.SetStateAction<string>>;
// }) {
//     if (availablePermissions.length === 0) {
//         return (
//             <>
//                 <hr className="border-border" />
//                 <div className="rounded-xl border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
//                     No backend permissions found.
//                 </div>
//             </>
//         );
//     }

//     const query = permissionSearch.trim().toLowerCase();

//     const filteredPerms = query
//         ? availablePermissions.filter(
//             (permission) =>
//                 permission.action?.toLowerCase().includes(query) ||
//                 permission.permissionKey?.toLowerCase().includes(query) ||
//                 permission.description?.toLowerCase().includes(query) ||
//                 permission.module?.toLowerCase().includes(query)
//         )
//         : availablePermissions;

//     const grouped = filteredPerms.reduce<Record<string, Permission[]>>(
//         (acc, permission) => {
//             const mod = permission.module || 'Other';
//             if (!acc[mod]) acc[mod] = [];
//             acc[mod].push(permission);
//             return acc;
//         },
//         {}
//     );

//     const allAvailableIds = availablePermissions.map((permission) => permission.id);
//     const allSelected =
//         allAvailableIds.length > 0 &&
//         allAvailableIds.every((id) => selectedPermissions.includes(id));

//     return (
//         <>
//             <hr className="border-border" />
//             <section className="space-y-4">
//                 <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
//                     <h3 className="text-sm font-semibold uppercase tracking-wider text-primary">
//                         User-Level Permissions
//                     </h3>

//                     <div className="flex items-center gap-3">
//                         <input
//                             type="text"
//                             placeholder="Search permissions..."
//                             className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 sm:w-[220px]"
//                             value={permissionSearch}
//                             onChange={(e) => setPermissionSearch(e.target.value)}
//                         />

//                         <button
//                             type="button"
//                             className="whitespace-nowrap rounded border border-border bg-muted px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-muted/80"
//                             onClick={() => {
//                                 if (allSelected) {
//                                     setSelectedPermissions([]);
//                                 } else {
//                                     setSelectedPermissions(allAvailableIds);
//                                 }
//                             }}
//                         >
//                             {allSelected ? 'Deselect All' : 'Select All'}
//                         </button>
//                     </div>
//                 </div>

//                 <div className="max-h-[400px] space-y-4 overflow-y-auto rounded-xl border border-border bg-muted/20 p-4">
//                     {filteredPerms.length === 0 ? (
//                         <div className="py-6 text-center text-xs text-muted-foreground">
//                             No permissions found matching search criteria.
//                         </div>
//                     ) : (
//                         Object.keys(grouped).map((mod) => {
//                             const modulePermissionIds = grouped[mod].map(
//                                 (permission) => permission.id
//                             );

//                             const moduleAllSelected =
//                                 modulePermissionIds.length > 0 &&
//                                 modulePermissionIds.every((id) =>
//                                     selectedPermissions.includes(id)
//                                 );

//                             return (
//                                 <div
//                                     key={mod}
//                                     className="space-y-3 rounded-lg border border-border/60 bg-background/50 p-4 shadow-sm"
//                                 >
//                                     <div className="flex items-center justify-between border-b border-border/40 pb-2">
//                                         <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
//                                             {mod}
//                                         </h4>

//                                         <button
//                                             type="button"
//                                             className="text-[10px] font-semibold text-cyan-600 hover:underline dark:text-cyan-400"
//                                             onClick={() => {
//                                                 if (moduleAllSelected) {
//                                                     setSelectedPermissions((prev) =>
//                                                         prev.filter((id) => !modulePermissionIds.includes(id))
//                                                     );
//                                                 } else {
//                                                     setSelectedPermissions((prev) =>
//                                                         Array.from(new Set([...prev, ...modulePermissionIds]))
//                                                     );
//                                                 }
//                                             }}
//                                         >
//                                             {moduleAllSelected ? 'Deselect All' : 'Select All'}
//                                         </button>
//                                     </div>

//                                     <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
//                                         {grouped[mod].map((permission) => {
//                                             const isChecked = selectedPermissions.includes(permission.id);

//                                             return (
//                                                 <label
//                                                     key={permission.id}
//                                                     className={`flex cursor-pointer items-start gap-2 rounded-md border border-border bg-background p-2.5 text-xs transition-colors hover:bg-muted/40 ${!permission.active ? 'cursor-not-allowed opacity-50' : ''
//                                                         }`}
//                                                     title={`${permission.action}: ${permission.description}`}
//                                                 >
//                                                     <input
//                                                         type="checkbox"
//                                                         className="mt-0.5 h-4 w-4 cursor-pointer rounded border-input text-primary focus:ring-1 focus:ring-primary"
//                                                         checked={isChecked}
//                                                         disabled={!permission.active}
//                                                         onChange={() => {
//                                                             if (!permission.active) return;

//                                                             if (isChecked) {
//                                                                 setSelectedPermissions((prev) =>
//                                                                     prev.filter((id) => id !== permission.id)
//                                                                 );
//                                                             } else {
//                                                                 setSelectedPermissions((prev) => [
//                                                                     ...prev,
//                                                                     permission.id,
//                                                                 ]);
//                                                             }
//                                                         }}
//                                                     />

//                                                     <div className="min-w-0 space-y-0.5">
//                                                         <span className="block truncate font-semibold text-foreground">
//                                                             {permission.action || permission.permissionKey}
//                                                         </span>
//                                                         <span className="block truncate text-[10px] text-muted-foreground">
//                                                             {permission.permissionKey}
//                                                         </span>
//                                                     </div>
//                                                 </label>
//                                             );
//                                         })}
//                                     </div>
//                                 </div>
//                             );
//                         })
//                     )}
//                 </div>
//             </section>
//         </>
//     );
// }


/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Users, Sparkles, UserPlus } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface Role {
    id: number;
    name: string;
    active: boolean;
    showInUserForm?: boolean;
}

interface Supervisor {
    id: number;
    name: string;
}

interface LookupEntity {
    id: number;
    name: string;
    showInUserForm?: boolean;
}


interface BusinessEntity {
    id: number;
    entityCode: string;
    companyName: string;
    active: boolean;
    showInUserForm?: boolean;
}

interface Department {
    id: number;
    deptCode: string;
    deptName: string;
    active: boolean;
    showInUserForm?: boolean;
}

interface Permission {
    id: number;
    module: string;
    action: string;
    permissionKey: string;
    description: string;
    active: boolean;
}

const normalizePermissionKey = (value: unknown) =>
    String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '');

const permissionCodesFromUser = (user: Record<string, unknown>) => {
    const raw =
        user.explicitPermissions ||
        user.assignedPermissions ||
        user.userPermissions ||
        user.assignedPermissionCodes ||
        user.permissionCodes ||
        user.permissions ||
        [];
    if (!Array.isArray(raw)) return [];
    return raw
        .map((item) => {
            if (typeof item === 'string') return item;
            if (item && typeof item === 'object') {
                const record = item as Record<string, unknown>;
                return record.permissionKey || record.code || record.name || record.authority || '';
            }
            return '';
        })
        .map(normalizePermissionKey)
        .filter(Boolean);
};

const selectedPermissionIdsFromUser = (user: Record<string, unknown>, permissions: Permission[]) => {
    const codes = permissionCodesFromUser(user);
    if (codes.length > 0) {
        const codeSet = new Set(codes);
        const mappedIds = permissions
            .filter((permission) => codeSet.has(normalizePermissionKey(permission.permissionKey)))
            .map((permission) => permission.id);
        return mappedIds;
    }

    const ids = Array.isArray(user.permissionIds) ? user.permissionIds : [];
    const mappedIds = ids
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id) && permissions.some((permission) => permission.id === id));
    return mappedIds;
};

interface UserFormProps {
    userId?: number | null;
    onClose?: () => void;
}

export default function UserForm({ userId, onClose }: UserFormProps = {}) {
    const { id: paramId } = useParams();
    const activeId = userId !== undefined ? userId : (paramId ? Number(paramId) : null);
    const isEdit = Boolean(activeId);
    const navigate = useNavigate();

    // Core user fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [gender, setGender] = useState('MALE');
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const [supervisorUserId, setSupervisorUserId] = useState('');
    const [profileData, setProfileData] = useState<Record<string, unknown>>({});
    // Employee Profile states
    const [employeeId, setEmployeeId] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split('T')[0]);
    const [employeeTypeId, setEmployeeTypeId] = useState('');
    const [designationId, setDesignationId] = useState('');
    const [workModeId, setWorkModeId] = useState('');

    // Lookup fields list
    const [roles, setRoles] = useState<Role[]>([]);
    const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
    const [availableEmployeeTypes, setAvailableEmployeeTypes] = useState<LookupEntity[]>([]);
    const [availableDesignations, setAvailableDesignations] = useState<LookupEntity[]>([]);
    const [availableWorkModes, setAvailableWorkModes] = useState<LookupEntity[]>([]);

    // Permissions and structural assignments
    const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
    const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
    const [permissionSearch, setPermissionSearch] = useState('');
    const [selectedEntityIds, setSelectedEntityIds] = useState<number[]>([]);
    const [selectedDepartmentIds, setSelectedDepartmentIds] = useState<number[]>([]);
    const [availableEntities, setAvailableEntities] = useState<BusinessEntity[]>([]);
    const [availableDepartments, setAvailableDepartments] = useState<Department[]>([]);

    // UI state
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEdit);
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

    const showToast = useCallback((type: 'success' | 'error', msg: string) => {
        setToast({ type, msg });
        setTimeout(() => setToast(null), 4000);
    }, []);

    // Fetch roles and (if editing) user details
    useEffect(() => {
        const ctrl = new AbortController();

        const fetchInitialData = async () => {
            try {
                let fetchedRoles: Role[] = [];
                try {
                    const rolesRes = await rolesApi.get<Role[]>('/roles', { signal: ctrl.signal });
                    fetchedRoles = rolesRes.data.filter((r) => r.active && r.showInUserForm !== false);
                } catch (err: any) {
                    if (err?.name === 'CanceledError') throw err;
                    console.warn('Backend roles endpoint failed, falling back to mock roles:', err);

                }
                setRoles(fetchedRoles);

                // Fetch permissions
                let fetchedPerms: Permission[] = [];
                try {
                    const permsRes = await rolesApi.get<Permission[]>('/permissions', { signal: ctrl.signal });
                    fetchedPerms = permsRes.data || [];
                } catch (err: any) {
                    if (err?.name === 'CanceledError') throw err;
                    console.warn('Backend permissions endpoint failed, falling back to mock permissions:', err);

                }

                setAvailablePermissions(fetchedPerms);

                // Fetch Business Entities
                let fetchedEntities: BusinessEntity[] = [];
                try {
                    const entRes = await rolesApi.get<BusinessEntity[]>('/business-entities/active', { signal: ctrl.signal })
                        .catch(() => rolesApi.get<BusinessEntity[]>('/business-entities', { signal: ctrl.signal }));
                    fetchedEntities = entRes.data || [];
                } catch (err: any) {
                    if (err?.name === 'CanceledError') throw err;
                    console.warn('Backend entities endpoint failed, falling back to mock entities:', err);

                }
                setAvailableEntities(fetchedEntities.filter((e) => e.showInUserForm !== false));

                // Fetch Departments
                let fetchedDepartments: Department[] = [];
                try {
                    const deptRes = await rolesApi.get<Department[]>('/departments/active', { signal: ctrl.signal })
                        .catch(() => rolesApi.get<Department[]>('/departments', { signal: ctrl.signal }));
                    fetchedDepartments = deptRes.data || [];
                } catch (err: any) {
                    if (err?.name === 'CanceledError') throw err;
                    console.warn('Backend departments endpoint failed, falling back to mock departments:', err);

                }
                setAvailableDepartments(fetchedDepartments.filter((d) => d.showInUserForm !== false));

                // Fetch other lookups
                try {
                    const [empRes, desRes, wmRes] = await Promise.all([
                        rolesApi.get<LookupEntity[]>('/employee-types/active', { signal: ctrl.signal }).catch(() => ({ data: [] })),
                        rolesApi.get<LookupEntity[]>('/designations/active', { signal: ctrl.signal }).catch(() => ({ data: [] })),
                        rolesApi.get<LookupEntity[]>('/work-modes/active', { signal: ctrl.signal }).catch(() => ({ data: [] }))
                    ]);
                    setAvailableEmployeeTypes((empRes.data || []).filter(x => x.showInUserForm !== false));
                    setAvailableDesignations((desRes.data || []).filter(x => x.showInUserForm !== false));
                    setAvailableWorkModes((wmRes.data || []).filter(x => x.showInUserForm !== false));
                } catch (e) {
                    console.warn('Failed to fetch lookups', e);
                }

                if (isEdit) {
                    try {
                        const userRes = await rolesApi.get(`/users/${activeId}`, { signal: ctrl.signal });
                        const u = userRes.data;
                        setFirstName(u.firstName || '');
                        setLastName(u.lastName || '');
                        setEmail(u.email || '');
                        setPhoneNumber(u.phoneNumber || '');
                        setGender(u.gender || 'MALE');
                        setSelectedRoleId(u.roleId ? String(u.roleId) : '');
                        setSupervisorUserId(u.supervisorUserId ? String(u.supervisorUserId) : '');
                        setSupervisorUserId(u.supervisorUserId ? String(u.supervisorUserId) : '');

                        setEmployeeId(u.employeeId || '');
                        setDateOfBirth(u.dateOfBirth ? String(u.dateOfBirth).split('T')[0] : '');
                        setJoiningDate(u.joiningDate ? String(u.joiningDate).split('T')[0] : new Date().toISOString().split('T')[0]);
                        setEmployeeTypeId(u.employeeTypeId ? String(u.employeeTypeId) : '');
                        setDesignationId(u.designationId ? String(u.designationId) : '');
                        setWorkModeId(u.workModeId ? String(u.workModeId) : '');

                        // Load only explicitly assigned user-level permissions.
                        setSelectedPermissions(selectedPermissionIdsFromUser(u, fetchedPerms));
                        setSelectedEntityIds(u.entityIds || []);
                        setSelectedDepartmentIds(u.departmentIds || []);
                    } catch (err: any) {
                        if (err?.name === 'CanceledError') throw err;
                        console.error('Failed to fetch user data for edit:', err);
                        showToast('error', 'Failed to fetch user data for editing.');
                    }
                }
            } catch (err: unknown) {
                const axiosError = err as { name?: string; message?: string };
                if (axiosError.name === 'CanceledError') return;
                showToast('error', 'Failed to load initial form data.');
            } finally {
                setFetching(false);
            }
        };

        fetchInitialData();
        return () => ctrl.abort();
    }, [activeId, isEdit, showToast]);

    // Load supervisors whenever selected Role ID changes
    useEffect(() => {
        if (!selectedRoleId) {
            setSupervisors([]);
            return;
        }

        const ctrl = new AbortController();

        const loadRoleSpecificDetails = async () => {
            try {
                const supRes = await rolesApi.get<Supervisor[]>(`/users/supervisors?roleId=${selectedRoleId}`, { signal: ctrl.signal });
                setSupervisors(supRes.data || []);
            } catch (err: unknown) {
                const axiosError = err as { name?: string };
                if (axiosError.name === 'CanceledError') return;
                setSupervisors([]);
            }
        };

        loadRoleSpecificDetails();
        return () => ctrl.abort();
    }, [selectedRoleId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Build payload using snake_case keys expected by backend API
        const payload: Record<string, any> = {};
        const assign = (key: string, value: any) => {
            if (value !== null && value !== undefined && value !== '') {
                payload[key] = value;
            }
        };
        assign('firstName', firstName);
        assign('lastName', lastName);
        assign('email', email);
        assign('phoneNumber', phoneNumber);
        assign('gender', gender);
        assign('roleId', selectedRoleId ? parseInt(selectedRoleId, 10) : null);
        assign('supervisorUserId', supervisorUserId ? parseInt(supervisorUserId, 10) : null);
        assign('employeeId', employeeId);
        assign('dateOfBirth', dateOfBirth);
        assign('joiningDate', joiningDate);
        assign('employeeTypeId', employeeTypeId ? parseInt(employeeTypeId, 10) : null);
        assign('designationId', designationId ? parseInt(designationId, 10) : null);
        assign('workModeId', workModeId ? parseInt(workModeId, 10) : null);
        // Include arrays even if empty
        payload['permissionIds'] = selectedPermissions;
        payload['entityIds'] = selectedEntityIds;
        payload['departmentIds'] = selectedDepartmentIds;
        if (!isEdit) {
            assign('password', password);
        }

        try {
            if (isEdit) {
                await rolesApi.put(`/users/${activeId}`, payload);
            } else {
                await rolesApi.post('/users', payload);
            }
            showToast('success', isEdit ? 'User details updated successfully.' : 'User onboarded successfully.');
            if (onClose) {
                setTimeout(onClose, 1000);
            } else {
                setTimeout(() => navigate('/users'), 1000);
            }
        } catch (err: unknown) {
            const axiosError = err as { response?: { data?: { message?: string } | string }; message?: string };
            let errorMsg = 'Failed to save user.';
            if (axiosError.response) {
                if (typeof axiosError.response.data === 'object' && axiosError.response.data?.message) {
                    errorMsg = axiosError.response.data.message;
                } else if (typeof axiosError.response.data === 'string') {
                    errorMsg = axiosError.response.data;
                }
            } else if (axiosError.message) {
                errorMsg = axiosError.message;
            }
            showToast('error', errorMsg);
        } finally {
            setLoading(false);
        }
    };


    if (fetching) {
        return (
            <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 text-sm">Loading user information...</p>
                </div>
            </div>
        );
    }

    return (
        <div className={onClose ? "w-full" : "max-w-4xl mx-auto space-y-6"}>
            {/* Toast Alert */}
            {toast && (
                <div
                    className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${toast.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-rose-500/10 border-rose-500/20 text-rose-455'
                        }`}
                    role="alert"
                >
                    {toast.msg}
                </div>
            )}

            {/* Decorative Header */}
            {!onClose && (
                <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                        <UserPlus className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-foreground tracking-tight">
                            {isEdit ? 'Modify Personnel Profile' : 'Onboard New Identity'}
                        </h2>
                        <p className="text-muted-foreground text-xs">
                            Establish access clearance, credentials, and reporting chain layout.
                        </p>
                    </div>
                </div>
            )}

            <EntityFormPage
                title={isEdit ? 'Edit User' : 'Create User'}
                onSubmit={handleSubmit}
                loading={loading}
                isModal={Boolean(onClose)}
                onBack={onClose}
            >
                <div className="space-y-6">
                    {/* Section: Personal Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4" /> Personal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    First Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Rahul"
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={firstName}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Last Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Sharma"
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={lastName}
                                    onChange={(e) => setLastName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Email ID <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    placeholder="rahul@example.com"
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={isEdit}
                                />
                                {isEdit && (
                                    <span className="text-[10px] text-slate-500 block mt-1">
                                        Email address cannot be edited once user has been registered.
                                    </span>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    placeholder="9100000000"
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Gender
                                </label>
                                <select
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={gender}
                                    onChange={(e) => setGender(e.target.value)}
                                >
                                    <option value="MALE">Male</option>
                                    <option value="FEMALE">Female</option>
                                    <option value="OTHER">Other</option>
                                    <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                                </select>
                            </div>

                            {!isEdit && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Password <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Section: Employee Profile Details */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                            <Users className="w-4 h-4" /> Employee Profile Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {isEdit && employeeId && (
                                <div>
                                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                        Employee ID
                                    </label>
                                    <input
                                        type="text"
                                        readOnly
                                        className="w-full bg-muted/50 border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none cursor-not-allowed"
                                        value={employeeId}
                                    />
                                    <p className="text-[10px] text-muted-foreground mt-1">Generated by backend</p>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Joining Date <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={joiningDate}
                                    onChange={(e) => setJoiningDate(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                    Date of Birth
                                </label>
                                <input
                                    type="date"
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={dateOfBirth}
                                    onChange={(e) => setDateOfBirth(e.target.value)}
                                />
                            </div>

                            {availableEmployeeTypes.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Employee Type
                                    </label>
                                    <select
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        value={employeeTypeId}
                                        onChange={(e) => setEmployeeTypeId(e.target.value)}
                                    >
                                        <option value="">Select Employee Type...</option>
                                        {availableEmployeeTypes.map((et) => (
                                            <option key={et.id} value={et.id}>{et.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {availableDesignations.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Designation
                                    </label>
                                    <select
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        value={designationId}
                                        onChange={(e) => setDesignationId(e.target.value)}
                                    >
                                        <option value="">Select Designation...</option>
                                        {availableDesignations.map((d) => (
                                            <option key={d.id} value={d.id}>{d.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {availableWorkModes.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Work Mode
                                    </label>
                                    <select
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        value={workModeId}
                                        onChange={(e) => setWorkModeId(e.target.value)}
                                    >
                                        <option value="">Select Work Mode...</option>
                                        {availableWorkModes.map((wm) => (
                                            <option key={wm.id} value={wm.id}>{wm.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Section: Role & Access Chain */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                            <Shield className="w-4 h-4" /> Role & System Access
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                    Access Role <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    required
                                    className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                    value={selectedRoleId}
                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                >
                                    <option value="">Select a role...</option>
                                    {roles.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {supervisors.length > 0 && (
                                <div>
                                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        Reporting Supervisor
                                    </label>
                                    <select
                                        className="w-full bg-background border border-border text-foreground text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                        value={supervisorUserId}
                                        onChange={(e) => setSupervisorUserId(e.target.value)}
                                    >
                                        <option value="">No supervisor (reporting endpoint)</option>
                                        {supervisors.map((s) => (
                                            <option key={s.id} value={s.id}>
                                                {s.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: User-Level Permissions */}
                    {availablePermissions.length > 0 && (
                        <>
                            <hr className="border-border" />
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <h3 className="text-sm font-semibold text-primary uppercase tracking-wider flex items-center gap-2">
                                        User-Level Permissions
                                    </h3>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="text"
                                            placeholder="Search permissions..."
                                            className="bg-background border border-border text-foreground text-xs rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-cyan-500 w-full sm:w-[220px]"
                                            value={permissionSearch}
                                            onChange={(e) => setPermissionSearch(e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="text-xs bg-muted hover:bg-muted/80 text-foreground border border-border rounded px-3 py-2 transition-colors font-semibold whitespace-nowrap cursor-pointer"
                                            onClick={() => {
                                                const availableIds = availablePermissions.map((p) => p.id);
                                                if (selectedPermissions.length === availableIds.length) {
                                                    setSelectedPermissions([]);
                                                } else {
                                                    setSelectedPermissions(availableIds);
                                                }
                                            }}
                                        >
                                            {selectedPermissions.length > 0 && selectedPermissions.length === availablePermissions.length
                                                ? 'Deselect All'
                                                : 'Select All'}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4 bg-muted/20 border border-border rounded-xl max-h-[400px] overflow-y-auto space-y-4">
                                    {(() => {
                                        let filteredPerms = availablePermissions;
                                        if (permissionSearch.trim()) {
                                            const query = permissionSearch.toLowerCase();
                                            filteredPerms = filteredPerms.filter(
                                                (p) =>
                                                    (p.action && p.action.toLowerCase().includes(query)) ||
                                                    (p.permissionKey && p.permissionKey.toLowerCase().includes(query)) ||
                                                    (p.description && p.description.toLowerCase().includes(query)) ||
                                                    (p.module && p.module.toLowerCase().includes(query))
                                            );
                                        }

                                        if (filteredPerms.length === 0) {
                                            return (
                                                <div className="text-center py-6 text-muted-foreground text-xs">
                                                    No permissions found matching search criteria.
                                                </div>
                                            );
                                        }

                                        const grouped = filteredPerms.reduce<Record<string, Permission[]>>((acc, perm) => {
                                            const mod = perm.module || 'Other';
                                            if (!acc[mod]) acc[mod] = [];
                                            acc[mod].push(perm);
                                            return acc;
                                        }, {});

                                        return Object.keys(grouped).map((mod) => {
                                            const modPermIds = grouped[mod].map((p) => p.id);
                                            const allSelected = modPermIds.length > 0 && modPermIds.every((id) => selectedPermissions.includes(id));

                                            const toggleSelectAll = () => {
                                                if (allSelected) {
                                                    setSelectedPermissions((prev) => prev.filter((id) => !modPermIds.includes(id)));
                                                } else {
                                                    setSelectedPermissions((prev) => {
                                                        const newIds = new Set([...prev, ...modPermIds]);
                                                        return Array.from(newIds);
                                                    });
                                                }
                                            };

                                            return (
                                                <div key={mod} className="bg-background/50 border border-border/60 p-4 rounded-lg space-y-3 shadow-sm">
                                                    <div className="flex justify-between items-center border-b border-border/40 pb-2">
                                                        <h4 className="text-xs font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">
                                                            {mod}
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            className="text-[10px] font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                                                            onClick={toggleSelectAll}
                                                        >
                                                            {allSelected ? 'Deselect All' : 'Select All'}
                                                        </button>
                                                    </div>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                                                        {grouped[mod].map((perm) => {
                                                            const isChecked = selectedPermissions.includes(perm.id);
                                                            return (
                                                                <label
                                                                    key={perm.id}
                                                                    className={`flex items-start gap-2 bg-background hover:bg-muted/40 p-2.5 rounded-md border border-border cursor-pointer transition-colors text-xs ${!perm.active ? 'opacity-50 cursor-not-allowed' : ''
                                                                        }`}
                                                                    title={`${perm.action}: ${perm.description}`}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-input text-primary focus:ring-1 focus:ring-primary w-4 h-4 mt-0.5 cursor-pointer"
                                                                        checked={isChecked}
                                                                        onChange={() => {
                                                                            if (perm.active) {
                                                                                if (selectedPermissions.includes(perm.id)) {
                                                                                    setSelectedPermissions(selectedPermissions.filter((id) => id !== perm.id));
                                                                                } else {
                                                                                    setSelectedPermissions([...selectedPermissions, perm.id]);
                                                                                }
                                                                            }
                                                                        }}
                                                                        disabled={!perm.active}
                                                                    />
                                                                    <div className="space-y-0.5 min-w-0">
                                                                        <span className="font-semibold text-foreground truncate block">
                                                                            {perm.action || perm.permissionKey}
                                                                        </span>
                                                                        {perm.description && (
                                                                            <span className="text-[10px] text-muted-foreground block truncate">
                                                                                {perm.description}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </EntityFormPage>
        </div>
    );
}
