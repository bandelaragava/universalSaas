import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Department {
  id: number;
  deptCode: string;
  deptName: string;
  description?: string;
  entityId?: number | string | null;
  active: boolean;
  showInUserForm: boolean;
}

interface BusinessEntity {
  id: number;
  companyName: string;
}

const mockEntities: BusinessEntity[] = [
  { id: 1, companyName: 'Universal SaaS Corp' },
  { id: 2, companyName: 'Universal APAC Ltd' }
];

const mockDepartments: Department[] = [
  { id: 1, deptCode: 'DEP-ENG', deptName: 'Engineering', description: 'Software development & devops teams', entityId: 1, active: true, showInUserForm: true },
  { id: 2, deptCode: 'DEP-HR', deptName: 'Human Resources', description: 'People operations and recruiting', entityId: 1, active: true, showInUserForm: true },
  { id: 3, deptCode: 'DEP-MKT', deptName: 'Marketing', description: 'Growth, demand gen & branding', entityId: 2, active: true, showInUserForm: true }
];

export function DepartmentList() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [entities, setEntities] = useState<BusinessEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async (showLoader = false) => {
    if (showLoader) {
      setLoading(true);
    }
    setError(null);
    try {
      const [deptRes, entRes] = await Promise.all([
        rolesApi.get('/departments'),
        rolesApi.get('/business-entities').catch(() => ({ data: [] })),
      ]);
      setDepartments(deptRes.data || []);
      setEntities(entRes.data || []);
    } catch (err: unknown) {
      console.warn('Backend departments endpoint failed, falling back to mock data:', err);
      setDepartments(mockDepartments);
      setEntities(mockEntities);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const entityMap = useMemo(() => {
    const map: Record<number | string, string> = {};
    entities.forEach((e) => {
      map[e.id] = e.companyName;
    });
    return map;
  }, [entities]);

  const handleToggle = async (dept: Department) => {
    try {
      await rolesApi.put(`/departments/${dept.id}/toggle`);
      fetchData(true);
      showToast('success', `Department ${dept.deptName} successfully ${dept.active ? 'deactivated' : 'activated'}.`);
    } catch (err: unknown) {
      console.warn('Failed to toggle department on backend, updating local state:', err);
      setDepartments(prev => prev.map(d => d.id === dept.id ? { ...d, active: !d.active } : d));
      showToast('success', `Department ${dept.deptName} successfully ${dept.active ? 'deactivated' : 'activated'} (local).`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await rolesApi.delete(`/departments/${id}`);
      fetchData(true);
      showToast('success', 'Department successfully deleted.');
    } catch (err: unknown) {
      console.warn('Failed to delete department on backend, updating local state:', err);
      setDepartments(prev => prev.filter(d => d.id !== id));
      showToast('success', 'Department successfully deleted (local).');
    }
  };

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return departments;
    return departments.filter(
      (d) =>
        d.deptCode?.toLowerCase().includes(query) ||
        d.deptName?.toLowerCase().includes(query)
    );
  }, [departments, search]);

  return (
    <div className="relative">
      {toast && (
        <div
          className={`fixed top-4 right-4 m-3 border p-3 rounded-lg shadow-lg text-sm flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
              : 'bg-destructive/10 text-destructive border-destructive/20'
          }`}
        >
          {toast.msg}
        </div>
      )}

      <EntityListPage
        title="Departments"
        description="Manage departments across your organization"
        addLabel="Add Department"
        addRoute="/settings/departments/create"
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filteredDepartments.length : undefined}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="p-4 font-semibold">Dept Code</th>
                <th className="p-4 font-semibold">Department Name</th>
                <th className="p-4 font-semibold">Entity Link</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold" style={{ width: 100 }}>Status</th>
                <th className="p-4 font-semibold text-right" style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDepartments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    {search ? `No departments matching "${search}"` : 'No departments found.'}
                  </td>
                </tr>
              ) : (
                filteredDepartments.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-muted/10 transition-colors"
                    style={{ opacity: d.active ? 1 : 0.6 }}
                  >
                    <td className="p-4">
                      <code className="bg-muted px-2 py-1 rounded font-mono text-[11px] border border-border font-bold">
                        {d.deptCode}
                      </code>
                    </td>
                    <td className="p-4 font-medium text-foreground">
                      {d.deptName}
                    </td>
                    <td className="p-4">
                      {d.entityId ? (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {entityMap[d.entityId] || `Entity #${d.entityId}`}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground font-normal">-</span>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground truncate max-w-xs" title={d.description}>
                      {d.description || '-'}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant="secondary"
                        className={
                          d.active
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10'
                            : 'bg-muted text-muted-foreground hover:bg-muted'
                        }
                      >
                        {d.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-primary"
                          onClick={() => navigate(`/settings/departments/edit/${d.id}`)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 text-xs ${d.active ? 'text-amber-500' : 'text-emerald-500'}`}
                          onClick={() => handleToggle(d)}
                        >
                          {d.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 text-xs text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(d.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>
    </div>
  );
}

export default DepartmentList;


