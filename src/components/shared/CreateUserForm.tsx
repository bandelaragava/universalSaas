import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';

interface Field {
  fieldName: string;
  label: string;
  type: 'DROPDOWN' | 'NUMBER' | 'TEXT';
  required: boolean;
  options?: string[];
}

interface Role {
  id: number;
  name: string;
  code: string;
}

interface Supervisor {
  id: number;
  name: string;
}

interface DynamicFieldInputProps {
  field: Field;
  value: string;
  onChange: (fieldName: string, value: string) => void;
}

const DynamicFieldInput = ({ field, value, onChange }: DynamicFieldInputProps) => {
  if (field.type === 'DROPDOWN') {
    return (
      <div>
        <label className="block text-sm font-medium text-muted-foreground mb-1">
          {field.label} {field.required && <span className="text-destructive">*</span>}
        </label>
        <select
          className="w-full p-2.5 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
          required={field.required}
          value={value || ''}
          onChange={(e) => onChange(field.fieldName, e.target.value)}
        >
          <option value="">Select...</option>
          {field.options && field.options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="block text-sm font-medium text-muted-foreground mb-1">
        {field.label} {field.required && <span className="text-destructive">*</span>}
      </label>
      <input
        type={field.type === 'NUMBER' ? 'number' : 'text'}
        placeholder={field.label}
        className="w-full p-2.5 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
        required={field.required}
        value={value || ''}
        onChange={(e) => onChange(field.fieldName, e.target.value)}
      />
    </div>
  );
};

export default function CreateUserForm() {
  const [assignableRoles, setAssignableRoles] = useState<Role[]>([]);
  const [dynamicFields, setDynamicFields] = useState<Field[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: null as number | null,
    roleCode: '',
    supervisorUserId: '' as string | number,
    profileData: {} as Record<string, string>
  });

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await rolesApi.get<Role[]>('/roles');
        setAssignableRoles(res.data);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };
    fetchRoles();
  }, []);

  const handleRoleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const roleId = e.target.value;
    const roleObj = assignableRoles.find(r => r.id.toString() === roleId) || null;
    
    if (roleObj) {
      setFormData(prev => ({
        ...prev,
        roleId: roleObj.id,
        roleCode: roleObj.code,
        supervisorUserId: '',
        profileData: {}
      }));

      try {
        const fieldsRes = await rolesApi.get<Field[]>(`/roles/${roleObj.id}/extra-fields`);
        setDynamicFields(fieldsRes.data || []);
      } catch (err) {
        console.error("Error fetching role extra fields", err);
        setDynamicFields([]);
      }

      try {
        const supervisorRes = await rolesApi.get<Supervisor[]>(`/users/supervisors?roleId=${roleObj.id}`);
        setSupervisors(supervisorRes.data || []);
      } catch (err) {
        console.error("Error fetching supervisors", err);
        setSupervisors([]);
      }
    } else {
      setDynamicFields([]);
      setSupervisors([]);
      setFormData(prev => ({
        ...prev,
        roleId: null,
        roleCode: '',
        supervisorUserId: '',
        profileData: {}
      }));
    }
  };

  const handleProfileDataChange = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      profileData: {
        ...prev.profileData,
        [key]: value
      }
    }));
  };

  const handleSupervisorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      supervisorUserId: val ? Number(val) : ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    
    try {
      const response = await rolesApi.post('/users', formData);

      if (response.status === 200 || response.status === 201) {
        setMessage('User successfully created with dynamic profile and hierarchy mapping!');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          roleId: null,
          roleCode: '',
          supervisorUserId: '',
          profileData: {}
        });
        setDynamicFields([]);
        setSupervisors([]);
        (e.target as HTMLFormElement).reset();
      } else {
        setError('Failed to create user');
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setError(axiosError.response?.data?.message || 'An error occurred during submission');
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <form onSubmit={handleSubmit} className="p-8 bg-card shadow-lg rounded-xl border border-border">
        <h2 className="text-2xl font-bold mb-6 text-foreground border-b border-border pb-4">Onboard New User</h2>
        
        {message && <div className="bg-emerald-500/10 text-emerald-500 p-3 rounded mb-4 border border-emerald-500/20 text-sm">{message}</div>}
        {error && <div className="bg-destructive/10 text-destructive p-3 rounded mb-4 border border-destructive/20 text-sm">{error}</div>}

        <h3 className="font-semibold text-foreground mb-3 text-lg">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <input 
            type="text" 
            placeholder="First Name" 
            className="w-full p-3 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm" 
            required
            value={formData.firstName}
            onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
          />
          
          <input 
            type="text" 
            placeholder="Last Name" 
            className="w-full p-3 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm" 
            required
            value={formData.lastName}
            onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
          />
        </div>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            className="w-full p-3 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm" 
            required
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})} 
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm" 
            required
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})} 
          />
        </div>

        <h3 className="font-semibold text-foreground mt-8 mb-3 text-lg">Role & Access</h3>
        <div className="flex flex-col gap-2">
          <label className="block text-sm font-medium text-muted-foreground">Select User Role</label>
          <select 
            className="w-full p-3 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm" 
            required 
            onChange={handleRoleSelect}
            value={formData.roleId || ''}
          >
            <option value="">Select a Role...</option>
            {assignableRoles.map(role => (
              <option key={role.id} value={role.id}>
                {role.name} ({role.code})
              </option>
            ))}
          </select>
        </div>

        {supervisors.length > 0 && (
          <div className="mt-6">
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Select Supervisor (Reports To)
            </label>
            <select 
              className="w-full p-3 border border-input rounded bg-card text-card-foreground focus:ring-2 focus:ring-primary outline-none text-sm"
              value={formData.supervisorUserId || ''}
              onChange={handleSupervisorChange}
              required
            >
              <option value="">Select Supervisor...</option>
              {supervisors.map(sup => (
                <option key={sup.id} value={sup.id}>
                  {sup.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {dynamicFields.length > 0 && (
          <div className="mt-8 transition-all duration-300 ease-in-out border border-primary/20 p-6 rounded-xl bg-primary/5">
            <h3 className="font-semibold text-foreground mb-4 text-lg border-b border-border pb-2">
              Additional Profile Details
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {dynamicFields.map(field => (
                <DynamicFieldInput
                  key={field.fieldName}
                  field={field}
                  value={formData.profileData[field.fieldName] || ''}
                  onChange={handleProfileDataChange}
                />
              ))}
            </div>
          </div>
        )}

        <button type="submit" className="w-full mt-8 bg-primary text-primary-foreground p-4 rounded-lg hover:bg-primary/90 font-bold transition shadow-md active:scale-95 transition-transform">
          Provision User
        </button>
      </form>
    </div>
  );
}




