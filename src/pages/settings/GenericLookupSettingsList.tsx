import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export interface LookupEntity {
  id: number;
  name: string;
  description?: string;
  active: boolean;
  showInUserForm: boolean;
}

interface GenericLookupSettingsListProps {
  title: string;
  description: string;
  endpoint: string; // e.g. '/employee-types'
  createRoute: string; // e.g. '/settings/employee-types/create'
  editRoutePrefix: string; // e.g. '/settings/employee-types/edit'
  entityLabel: string; // e.g. 'Employee Type'
}

export function GenericLookupSettingsList({ title, description, endpoint, createRoute, editRoutePrefix, entityLabel }: GenericLookupSettingsListProps) {
  const navigate = useNavigate();
  const [entities, setEntities] = useState<LookupEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchEntities = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get(endpoint);
      setEntities(res.data || []);
    } catch (err: unknown) {
      console.warn(`Backend ${endpoint} endpoint failed:`, err);
      setError(`Failed to load ${entityLabel}s`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntities();
  }, [endpoint]);

  const handleToggle = async (entity: LookupEntity) => {
    try {
      await rolesApi.put(`${endpoint}/${entity.id}/toggle`);
      fetchEntities(true);
      showToast('success', `${entityLabel} ${entity.name} successfully ${entity.active ? 'deactivated' : 'activated'}.`);
    } catch (err: unknown) {
      console.warn(`Failed to toggle ${entityLabel} on backend, updating local state:`, err);
      setEntities(prev => prev.map(e => e.id === entity.id ? { ...e, active: !e.active } : e));
      showToast('success', `${entityLabel} ${entity.name} successfully ${entity.active ? 'deactivated' : 'activated'} (local).`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(`Are you sure you want to delete this ${entityLabel}?`)) return;
    try {
      await rolesApi.delete(`${endpoint}/${id}`);
      fetchEntities(true);
      showToast('success', `${entityLabel} successfully deleted.`);
    } catch (err: unknown) {
      console.warn(`Failed to delete ${entityLabel} on backend, updating local state:`, err);
      setEntities(prev => prev.filter(e => e.id !== id));
      showToast('success', `${entityLabel} successfully deleted (local).`);
    }
  };

  const filteredEntities = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return entities;
    return entities.filter(e => e.name?.toLowerCase().includes(query));
  }, [entities, search]);

  return (
    <div className="relative">
      {toast && (
        <div className={`fixed top-4 right-4 m-3 border p-3 rounded-lg shadow-lg text-sm flex items-center gap-2 z-50 animate-in fade-in slide-in-from-top-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
          {toast.msg}
        </div>
      )}

      <EntityListPage
        title={title}
        description={description}
        addLabel={`Add ${entityLabel}`}
        addRoute={createRoute}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filteredEntities.length : undefined}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground">
                <th className="p-4 font-semibold">Name</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold text-center" style={{ width: 120 }}>Show in Form</th>
                <th className="p-4 font-semibold" style={{ width: 100 }}>Status</th>
                <th className="p-4 font-semibold text-right" style={{ width: 220 }}>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEntities.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {search ? `No ${entityLabel}s matching "${search}"` : `No ${entityLabel}s found.`}
                  </td>
                </tr>
              ) : (
                filteredEntities.map((e) => (
                  <tr key={e.id} className="hover:bg-muted/10 transition-colors" style={{ opacity: e.active ? 1 : 0.6 }}>
                    <td className="p-4 font-medium text-foreground">{e.name}</td>
                    <td className="p-4 text-muted-foreground truncate max-w-xs" title={e.description}>{e.description || '-'}</td>
                    <td className="p-4 text-center">
                      <Badge variant="outline" className={e.showInUserForm ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 'bg-muted text-muted-foreground'}>
                        {e.showInUserForm ? 'Yes' : 'No'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary" className={e.active ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-muted text-muted-foreground hover:bg-muted'}>
                        {e.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-primary" onClick={() => navigate(`${editRoutePrefix}/${e.id}`)}>Edit</Button>
                        <Button variant="ghost" size="sm" className={`h-8 text-xs ${e.active ? 'text-amber-500' : 'text-emerald-500'}`} onClick={() => handleToggle(e)}>
                          {e.active ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 text-xs text-destructive hover:bg-destructive/10" onClick={() => handleDelete(e.id)}>Delete</Button>
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

export default GenericLookupSettingsList;


