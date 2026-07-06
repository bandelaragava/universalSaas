// import React, { useState, useEffect, useMemo, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Edit, Trash2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
// import rolesApi from '@/services/rolesApi';
// import EntityListPage from '@/components/shared/EntityListPage';
// import { usePermissions } from '@/auth/usePermissions';

// interface LeadStage {
//   id: number;
//   label: string;
//   statusValue: string;
//   analyticBucket: 'UNASSIGNED' | 'ENGAGED' | 'WON' | 'LOST';
//   color: string;
//   orderIndex: number;
//   active: boolean;
//   requireNote: boolean;
//   requireDate: boolean;
//   createTask: boolean;
// }

// const BUCKET_COLORS: Record<string, string> = {
//   WON: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
//   LOST: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
//   ENGAGED: 'bg-primary/10 text-primary border-primary/20',
//   UNASSIGNED: 'bg-muted text-muted-foreground border-border',
// };

// export default function LeadStageList() {
//   const navigate = useNavigate();
//   const { hasPermission } = usePermissions();
//   const [stages, setStages] = useState<LeadStage[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const [search, setSearch] = useState('');
//   const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

//   const fetchStages = useCallback(async (signal?: AbortSignal) => {
//     setLoading(true);
//     setError(null);
//     try {
//       const res = await rolesApi.get<LeadStage[]>('/pipeline-stages', { signal });
//       setStages(res.data || []);
//     } catch (err: any) {
//       if (err.name === 'CanceledError') return;
//       setError(err.response?.data?.message || err.message || 'Failed to load pipeline stages.');
//     } finally {
//       setLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     const c = new AbortController();
//     fetchStages(c.signal);
//     return () => c.abort();
//   }, [fetchStages]);

//   const showToast = (type: 'success' | 'error', msg: string) => {
//     setToast({ type, msg });
//     setTimeout(() => setToast(null), 4000);
//   };

//   const handleDelete = async (id: number) => {
//     if (!window.confirm('Are you sure you want to delete this pipeline stage?')) return;
//     try {
//       await rolesApi.delete(`/pipeline-stages/${id}`);
//       setStages((prev) => prev.filter((s) => s.id !== id));
//       showToast('success', 'Stage deleted.');
//     } catch (err: any) {
//       showToast('error', err.response?.data?.message || err.message || 'Failed to delete stage.');
//     }
//   };

//   const handleReorder = async (id: number, direction: 'UP' | 'DOWN') => {
//     try {
//       const res = await rolesApi.patch<LeadStage[]>(`/pipeline-stages/${id}/reorder?direction=${direction}`);
//       setStages(res.data || []);
//     } catch (err: any) {
//       showToast('error', err.response?.data?.message || err.message || 'Failed to reorder stage.');
//     }
//   };

//   const filtered = useMemo(() => {
//     const q = search.trim().toLowerCase();
//     return q
//       ? stages.filter(
//           (s) =>
//             s.label?.toLowerCase().includes(q) ||
//             s.statusValue?.toLowerCase().includes(q)
//         )
//       : stages;
//   }, [stages, search]);

//   return (
//     <div className="space-y-6">
//       {toast && (
//         <div
//           className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${
//             toast.type === 'success'
//               ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
//               : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
//           }`}
//           role="alert"
//         >
//           {toast.msg}
//         </div>
//       )}

//       <EntityListPage
//         title="Lead Stages"
//         description="Configure your CRM pipeline stages"
//         addLabel={hasPermission('LEADS_MANAGE_LEAD_FORMS') ? "Add Stage" : undefined}
//         addRoute="/crm/stages/create"
//         searchValue={search}
//         onSearchChange={setSearch}
//         loading={loading}
//         error={error}
//         totalCount={!loading ? filtered.length : undefined}
//         headerActions={
//           <button
//             type="button"
//             className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
//             onClick={() => { fetchStages(); }}
//           >
//             <RefreshCw className="w-3.5 h-3.5" />
//             Refresh
//           </button>
//         }
//       >
//         <div className="overflow-x-auto">
//           <table className="w-full text-left text-sm border-collapse">
//             <thead>
//               <tr className="border-b border-border bg-muted/40 text-muted-foreground">
//                 <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider w-[100px]">Order</th>
//                 <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Label</th>
//                 <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status Value</th>
//                 <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Bucket</th>
//                 <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
//                 {hasPermission('LEADS_MANAGE_LEAD_FORMS') && <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[150px]">Actions</th>}
//               </tr>
//             </thead>
//             <tbody>
//               {filtered.map((s) => (
//                 <tr
//                   key={s.id}
//                   className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
//                 >
//                   <td className="py-3.5 px-4">
//                     <div className="flex items-center gap-2 font-mono">
//                       {hasPermission('LEADS_MANAGE_LEAD_FORMS') && (
//                         <button
//                           type="button"
//                           className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
//                           onClick={() => handleReorder(s.id, 'UP')}
//                         >
//                           <ArrowUp className="w-3.5 h-3.5" />
//                         </button>
//                       )}
//                       <span className="font-bold text-foreground">{s.orderIndex}</span>
//                       {hasPermission('LEADS_MANAGE_LEAD_FORMS') && (
//                         <button
//                           type="button"
//                           className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
//                           onClick={() => handleReorder(s.id, 'DOWN')}
//                         >
//                           <ArrowDown className="w-3.5 h-3.5" />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                   <td className="py-3.5 px-4 font-bold text-foreground">
//                     <div className="flex items-center gap-2">
//                       <div
//                         className="rounded-full w-2.5 h-2.5 shrink-0 border border-black/10"
//                         style={{ backgroundColor: s.color || '#6b7280' }}
//                       />
//                       <span>{s.label}</span>
//                     </div>
//                   </td>
//                   <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
//                     <span className="bg-muted px-2 py-0.5 rounded text-[11px] border border-border">
//                       {s.statusValue}
//                     </span>
//                   </td>
//                   <td className="py-3.5 px-4">
//                     <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${BUCKET_COLORS[s.analyticBucket] || BUCKET_COLORS.UNASSIGNED}`}>
//                       {s.analyticBucket || 'UNASSIGNED'}
//                     </span>
//                   </td>
//                   <td className="py-3.5 px-4">
//                     <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
//                       s.active
//                         ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
//                         : 'bg-muted text-muted-foreground border-border'
//                     }`}>
//                       {s.active ? 'Active' : 'Inactive'}
//                     </span>
//                   </td>
//                   {hasPermission('LEADS_MANAGE_LEAD_FORMS') && (
//                     <td className="py-3.5 px-4 text-right">
//                       <div className="inline-flex items-center gap-3">
//                         <button
//                           type="button"
//                           className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline transition-colors"
//                           onClick={() => navigate(`/crm/stages/edit/${s.id}`)}
//                         >
//                           <Edit className="w-3.5 h-3.5 text-primary" />
//                           Edit
//                         </button>
//                         <button
//                           type="button"
//                           className="inline-flex items-center gap-1 font-semibold text-xs text-destructive hover:underline transition-colors"
//                           onClick={() => handleDelete(s.id)}
//                         >
//                           <Trash2 className="w-3.5 h-3.5 text-destructive" />
//                           Delete
//                         </button>
//                       </div>
//                     </td>
//                   )}
//                 </tr>
//               ))}
//               {!loading && filtered.length === 0 && (
//                 <tr>
//                   <td colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
//                     {search ? `No stages matching "${search}"` : 'No stages found.'}
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>
//       </EntityListPage>
//     </div>
//   );
// }


/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Edit, Trash2, ArrowUp, ArrowDown, RefreshCw } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityListPage from '@/components/shared/EntityListPage';

interface LeadStage {
  id: number;
  label: string;
  statusValue: string;
  analyticBucket: 'UNASSIGNED' | 'ENGAGED' | 'WON' | 'LOST';
  color: string;
  orderIndex: number;
  active: boolean;
  requireNote: boolean;
  requireDate: boolean;
  createTask: boolean;
}

const BUCKET_COLORS: Record<string, string> = {
  WON: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  LOST: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  ENGAGED: 'bg-primary/10 text-primary border-primary/20',
  UNASSIGNED: 'bg-muted text-muted-foreground border-border',
};

export default function LeadStageList() {
  const navigate = useNavigate();
  const [stages, setStages] = useState<LeadStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const fetchStages = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolesApi.get<LeadStage[]>('/pipeline-stages', { signal });
      setStages(res.data || []);
    } catch (err: any) {
      if (err.name === 'CanceledError') return;
      setError(err.response?.data?.message || err.message || 'Failed to load pipeline stages.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const c = new AbortController();
    fetchStages(c.signal);
    return () => c.abort();
  }, [fetchStages]);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this pipeline stage?')) return;
    try {
      await rolesApi.delete(`/pipeline-stages/${id}`);
      setStages((prev) => prev.filter((s) => s.id !== id));
      showToast('success', 'Stage deleted.');
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Failed to delete stage.');
    }
  };

  const handleReorder = async (id: number, direction: 'UP' | 'DOWN') => {
    try {
      const res = await rolesApi.patch<LeadStage[]>(`/pipeline-stages/${id}/reorder?direction=${direction}`);
      setStages(res.data || []);
    } catch (err: any) {
      showToast('error', err.response?.data?.message || err.message || 'Failed to reorder stage.');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? stages.filter(
        (s) =>
          s.label?.toLowerCase().includes(q) ||
          s.statusValue?.toLowerCase().includes(q)
      )
      : stages;
  }, [stages, search]);

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[9999] px-4 py-3 rounded-xl shadow-lg border text-sm transition-all duration-300 ${toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}

      <EntityListPage
        title="Lead Stages"
        description="Configure your CRM pipeline stages"
        addLabel="Add Stage"
        addRoute="/crm/stages/create"
        searchValue={search}
        onSearchChange={setSearch}
        loading={loading}
        error={error}
        totalCount={!loading ? filtered.length : undefined}
        headerActions={
          <button
            type="button"
            className="inline-flex items-center gap-1.5 justify-center rounded-md border border-input bg-background hover:bg-accent h-9 px-3 text-sm font-semibold text-foreground active:scale-95 transition-all"
            onClick={() => { fetchStages(); }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider w-[100px]">Order</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Label</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status Value</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Bucket</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                <th className="py-3 px-4 font-semibold text-xs uppercase tracking-wider text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-border text-foreground hover:bg-muted/50 transition-colors"
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2 font-mono">
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                        onClick={() => handleReorder(s.id, 'UP')}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bold text-foreground">{s.orderIndex}</span>
                      <button
                        type="button"
                        className="text-muted-foreground hover:text-foreground active:scale-90 transition-transform"
                        onClick={() => handleReorder(s.id, 'DOWN')}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-bold text-foreground">
                    <div className="flex items-center gap-2">
                      <div
                        className="rounded-full w-2.5 h-2.5 shrink-0 border border-black/10"
                        style={{ backgroundColor: s.color || '#6b7280' }}
                      />
                      <span>{s.label}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                    <span className="bg-muted px-2 py-0.5 rounded text-[11px] border border-border">
                      {s.statusValue}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold ${BUCKET_COLORS[s.analyticBucket] || BUCKET_COLORS.UNASSIGNED}`}>
                      {s.analyticBucket || 'UNASSIGNED'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${s.active
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border'
                      }`}>
                      {s.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-3">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-primary hover:underline transition-colors"
                        onClick={() => navigate(`/crm/stages/edit/${s.id}`)}
                      >
                        <Edit className="w-3.5 h-3.5 text-primary" />
                        Edit
                      </button>
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 font-semibold text-xs text-destructive hover:underline transition-colors"
                        onClick={() => handleDelete(s.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-xs text-muted-foreground">
                    {search ? `No stages matching "${search}"` : 'No stages found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </EntityListPage>
    </div>
  );
}

