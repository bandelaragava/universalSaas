import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Layers, RefreshCw, Sliders, ToggleLeft, ToggleRight, Building, X, ShieldAlert, FileText } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';
import Modal from '@/components/ui/Modal';
import CreateTenant from '@/pages/CreateTenant';
import TenantDetails from '@/pages/TenantDetails';
import { AssignSubscriptionModal } from '@/components/shared/AssignSubscriptionModal';
import { usePermissions } from '@/auth/usePermissions';

interface Tenant {
  id: number;
  name: string;
  code: string;
  dbName: string;
  adminEmail: string | null;
  active: boolean;
  status?: string;
}

interface TenantModule {
  id?: number;
  moduleName: string;
  active: boolean;
  amount: number | null;
  paymentMethod: string;
  specialRequirements: string | null;
  extraCharges: number | null;
  startDate?: string | null;
  expiryDate?: string | null;
}

const ALL_MODULES = [
  'CRM', 'HRMS', 'VENDOR', 'MARKETING', 'LEADS',
  'AFFILIATE', 'PAYROLL', 'ATTENDANCE', 'PERFORMANCE',
  'SETTINGS', 'LEAVE', 'REPORTS', 'SUPPORT_TICKETS', 'TASKS', 'REVENUE'
];

export default function TenantsList() {
  const { hasPermission } = usePermissions();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Module configuration modal states
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [moduleDetails, setModuleDetails] = useState<Record<string, TenantModule>>({});
  const [initialActiveModules, setInitialActiveModules] = useState<string[]>([]);
  const [savingModules, setSavingModules] = useState(false);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [viewingTenantId, setViewingTenantId] = useState<number | null>(null);

  const showToast = useCallback((type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const fetchTenants = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const response = await rolesApi.get<Tenant[]>('/tenants', { signal });
      setTenants(response.data);
    } catch (err: unknown) {
      const axiosError = err as { name?: string; response?: { data?: { message?: string } }; message?: string };
      if (axiosError.name === 'CanceledError') return;
      setError(axiosError.response?.data?.message || axiosError.message || 'Failed to fetch system tenants.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchTenants(ctrl.signal);
    return () => ctrl.abort();
  }, [fetchTenants]);

  const handleToggleStatus = async (tenant: Tenant) => {
    const action = tenant.active ? 'disable' : 'enable';
    try {
      await rolesApi.put(`/tenants/${tenant.id}/${action}`);
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, active: !tenant.active } : t))
      );
      showToast('success', `Tenant "${tenant.name}" has been ${action}d successfully.`);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } }; message?: string };
      showToast('error', axiosError.response?.data?.message || axiosError.message || 'Failed to switch tenant status.');
    }
  };

  const handleManageModules = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tenants;
    return tenants.filter((t) =>
      [t.name, t.code, t.adminEmail, t.dbName]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q))
    );
  }, [tenants, search]);



  return (
    <div className="space-y-6">
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

      <EntityListPage
        title="Tenants"
        description="System Master Administration workspace for setting up clients, managing databases, and managing active license modules."
        addLabel={hasPermission('TENANT_CREATE') ? "Create Tenant" : undefined}
        onAdd={() => setIsCreateOpen(true)}
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
        headerActions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-center rounded-md border border-border bg-muted hover:bg-muted/80 h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
            onClick={() => fetchTenants()}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Tenant Code</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Tenant Name</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Database</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Admin Contact</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[250px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((tenant) => (
                <tr
                  key={tenant.id}
                  className={`border-b border-border text-foreground hover:bg-muted/30 transition-colors ${!tenant.active ? 'opacity-60' : ''
                    }`}
                >
                  <td className="py-3.5 px-4 font-mono text-xs">
                    <span className="bg-muted px-2 py-0.5 rounded border border-border text-foreground">
                      {tenant.code}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    {tenant.name}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">{tenant.dbName}</td>
                  <td className="py-3.5 px-4 text-muted-foreground">{tenant.adminEmail || <span className="text-muted-foreground/60">—</span>}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${tenant.active
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-600 dark:text-rose-455 border-rose-500/20'
                        }`}
                    >
                      {tenant.active ? 'Active' : 'Disabled'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {tenant.id === 1 ? (
                      <div className="inline-flex items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                          System Master
                        </span>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:text-primary/80 transition-colors"
                          onClick={() => {
                            setViewingTenantId(tenant.id);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Building className="w-3.5 h-3.5" />
                          Details
                        </button>
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:text-primary/80 transition-colors"
                          onClick={() => {
                            setViewingTenantId(tenant.id);
                            setIsDetailsOpen(true);
                          }}
                        >
                          <Building className="w-3.5 h-3.5" />
                          Details
                        </button>
                        {hasPermission('TENANT_UPDATE') && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 font-semibold text-xs text-amber-600 dark:text-amber-500 hover:opacity-85 transition-colors"
                            onClick={() => handleManageModules(tenant)}
                          >
                            <Sliders className="w-3.5 h-3.5" />
                            Modules
                          </button>
                        )}
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 font-semibold text-xs text-indigo-500 hover:opacity-85 transition-colors"
                          onClick={() => {
                            setViewingTenantId(tenant.id);
                            setIsDetailsOpen(true);
                            setTimeout(() => {
                              document.getElementById('invoice-history-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 500);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Invoices
                        </button>
                        {hasPermission('TENANT_UPDATE') && (
                          <button
                            type="button"
                            className={`inline-flex items-center gap-1 font-semibold text-xs transition-colors ${tenant.active
                                ? 'text-rose-600 dark:text-rose-455 hover:opacity-85'
                                : 'text-emerald-600 dark:text-emerald-500 hover:opacity-85'
                              }`}
                            onClick={() => handleToggleStatus(tenant)}
                          >
                            {tenant.active ? (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                Disable
                              </>
                            ) : (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                Enable
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </EntityListPage>

      {/* Modern Overlay Modal for Module Subscription configuration */}
      {selectedTenant && (
        <AssignSubscriptionModal
          isOpen={true}
          onClose={() => setSelectedTenant(null)}
          tenantId={selectedTenant.id}
          tenantName={selectedTenant.name}
          onSuccess={() => {
            setSelectedTenant(null);
            fetchTenants();
            showToast('success', 'Modules and Billing configuration saved successfully.');
          }}
        />
      )}

      {/* Create Tenant Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Onboard New Tenant Workspace"
        size="3xl"
      >
        <CreateTenant
          onClose={() => setIsCreateOpen(false)}
          onSuccess={() => {
            setIsCreateOpen(false);
            fetchTenants();
          }}
        />
      </Modal>

      {/* Tenant Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title="Tenant Workspace Details"
        size="3xl"
      >
        <TenantDetails
          tenantId={viewingTenantId}
          onClose={() => setIsDetailsOpen(false)}
        />
      </Modal>
    </div>
  );
}

