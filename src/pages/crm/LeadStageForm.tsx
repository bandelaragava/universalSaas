// /* eslint-disable @typescript-eslint/no-explicit-any */
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { Settings, Sliders } from 'lucide-react';
// import rolesApi from '@/services/rolesApi';
// import EntityFormPage from '@/components/shared/EntityFormPage';

// interface LeadStageFormState {
//   statusValue: string;
//   label: string;
//   color: string;
//   analyticBucket: string;
//   orderIndex: number;
//   active: boolean;
//   requireNote: boolean;
//   requireDate: boolean;
//   createTask: boolean;
// }

// const STATUS_OPTIONS = [
//   'NEW',
//   'WORKING',
//   'CONTACTED',
//   'INTERESTED',
//   'UNDER_REVIEW',
//   'FOLLOW_UP',
//   'CALL_BACK',
//   'CONVERTED',
//   'PAID',
//   'EMI',
//   'SUCCESS',
//   'REJECTED',
//   'REFUND',
//   'LOST',
//   'NOT_INTERESTED',
//   'CLOSED',
//   'COMPLETED',
// ];

// const BUCKET_OPTIONS = ['UNASSIGNED', 'ENGAGED', 'WON', 'LOST'];

// const EMPTY_FORM: LeadStageFormState = {
//   statusValue: 'NEW',
//   label: '',
//   color: '#3b82f6',
//   analyticBucket: 'UNASSIGNED',
//   orderIndex: 1,
//   active: true,
//   requireNote: false,
//   requireDate: false,
//   createTask: false,
// };

// export default function LeadStageForm() {
//   const { id } = useParams<{ id: string }>();
//   const isEdit = Boolean(id);
//   const navigate = useNavigate();
//   const [form, setForm] = useState<LeadStageFormState>(EMPTY_FORM);
//   const [loading, setLoading] = useState(false);
//   const [fetching, setFetching] = useState(isEdit);
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   useEffect(() => {
//     if (!isEdit) return;
//     const fetchStage = async () => {
//       try {
//         const res = await rolesApi.get<any[]>('/pipeline-stages');
//         const s = res.data.find((x) => String(x.id) === String(id));
//         if (s) {
//           setForm({
//             statusValue: s.statusValue,
//             label: s.label,
//             color: s.color || '#3b82f6',
//             analyticBucket: s.analyticBucket || 'UNASSIGNED',
//             orderIndex: s.orderIndex,
//             active: s.active,
//             requireNote: s.requireNote,
//             requireDate: s.requireDate,
//             createTask: s.createTask,
//           });
//         } else {
//           setError('Pipeline stage not found.');
//         }
//       } catch (err: any) {
//         console.error(err);
//         setError('Failed to load stage details.');
//       } finally {
//         setFetching(false);
//       }
//     };
//     fetchStage();
//   }, [id, isEdit]);

//   const upd = (k: keyof LeadStageFormState, v: any) => {
//     setForm((p) => ({ ...p, [k]: v }));
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError(null);
//     setSuccess(null);
//     setLoading(true);

//     try {
//       if (isEdit) {
//         await rolesApi.put(`/pipeline-stages/${id}`, form);
//       } else {
//         await rolesApi.post('/pipeline-stages', form);
//       }
//       setSuccess(isEdit ? 'Stage updated.' : 'Stage created.');
//       setTimeout(() => navigate('/crm/stages'), 900);
//     } catch (err: any) {
//       setError(err.response?.data?.message || err.message || 'Failed to save pipeline stage.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (fetching) {
//     return (
//       <div className="flex items-center justify-center p-12">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
//       </div>
//     );
//   }

//   return (
//     <EntityFormPage
//       title={isEdit ? 'Edit Lead Stage' : 'Create Lead Stage'}
//       subtitle="Lead Stages"
//       backRoute="/crm/stages"
//       onSubmit={handleSubmit}
//       submitLabel={isEdit ? 'Save Changes' : 'Create Stage'}
//       loading={loading}
//       error={error}
//       success={success}
//     >
//       <div className="space-y-6 text-xs">
//         {/* Section: Stage Info */}
//         <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
//           <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
//             <Sliders className="w-4 h-4" /> Stage Details
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Stage Label *</label>
//               <input
//                 type="text"
//                 required
//                 placeholder="e.g. New Lead"
//                 className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//                 value={form.label}
//                 onChange={(e) => upd('label', e.target.value)}
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status Value *</label>
//               <select
//                 required
//                 className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//                 value={form.statusValue}
//                 onChange={(e) => upd('statusValue', e.target.value)}
//               >
//                 {STATUS_OPTIONS.map((v) => (
//                   <option key={v} value={v}>
//                     {v}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
//             <div>
//               <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Analytic Bucket *</label>
//               <select
//                 required
//                 className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//                 value={form.analyticBucket}
//                 onChange={(e) => upd('analyticBucket', e.target.value)}
//               >
//                 {BUCKET_OPTIONS.map((v) => (
//                   <option key={v} value={v}>
//                     {v}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Order Index *</label>
//               <input
//                 type="number"
//                 required
//                 min="1"
//                 className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
//                 value={form.orderIndex}
//                 onChange={(e) => upd('orderIndex', parseInt(e.target.value, 10) || 1)}
//               />
//             </div>
//             <div>
//               <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Color</label>
//               <div className="flex gap-2">
//                 <input
//                   type="color"
//                   className="bg-background border border-input rounded-lg p-0.5 cursor-pointer w-10 h-8 shrink-0"
//                   value={form.color}
//                   onChange={(e) => upd('color', e.target.value)}
//                 />
//                 <input
//                   type="text"
//                   placeholder="#3b82f6"
//                   className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
//                   value={form.color}
//                   onChange={(e) => upd('color', e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Section: Stage Actions / Checkboxes */}
//         <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
//           <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
//             <Settings className="w-4 h-4" /> Stage Behaviors
//           </h3>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
//             <div className="flex items-center gap-2.5">
//               <input
//                 type="checkbox"
//                 id="stageActive"
//                 className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
//                 checked={form.active}
//                 onChange={(e) => upd('active', e.target.checked)}
//               />
//               <label htmlFor="stageActive" className="text-muted-foreground cursor-pointer select-none font-medium">
//                 Active
//               </label>
//             </div>
//             <div className="flex items-center gap-2.5">
//               <input
//                 type="checkbox"
//                 id="requireNote"
//                 className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
//                 checked={form.requireNote}
//                 onChange={(e) => upd('requireNote', e.target.checked)}
//               />
//               <label htmlFor="requireNote" className="text-muted-foreground cursor-pointer select-none font-medium">
//                 Require Note
//               </label>
//             </div>
//             <div className="flex items-center gap-2.5">
//               <input
//                 type="checkbox"
//                 id="requireDate"
//                 className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
//                 checked={form.requireDate}
//                 onChange={(e) => upd('requireDate', e.target.checked)}
//               />
//               <label htmlFor="requireDate" className="text-muted-foreground cursor-pointer select-none font-medium">
//                 Require Date
//               </label>
//             </div>
//             <div className="flex items-center gap-2.5">
//               <input
//                 type="checkbox"
//                 id="createTask"
//                 className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
//                 checked={form.createTask}
//                 onChange={(e) => upd('createTask', e.target.checked)}
//               />
//               <label htmlFor="createTask" className="text-muted-foreground cursor-pointer select-none font-medium">
//                 Create Task
//               </label>
//             </div>
//           </div>
//         </div>
//       </div>
//     </EntityFormPage>
//   );
// }


/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Settings, Sliders } from 'lucide-react';
import rolesApi from '@/services/rolesApi';
import EntityFormPage from '@/components/shared/EntityFormPage';

interface LeadStageFormState {
  statusValue: string;
  label: string;
  color: string;
  analyticBucket: string;
  orderIndex: number;
  active: boolean;
  requireNote: boolean;
  requireDate: boolean;
  createTask: boolean;
}

const STATUS_OPTIONS = [
  'NEW',
  'WORKING',
  'CONTACTED',
  'INTERESTED',
  'UNDER_REVIEW',
  'FOLLOW_UP',
  'CALL_BACK',
  'CONVERTED',
  'PAID',
  'EMI',
  'SUCCESS',
  'REJECTED',
  'REFUND',
  'LOST',
  'NOT_INTERESTED',
  'CLOSED',
  'COMPLETED',
];

const BUCKET_OPTIONS = ['UNASSIGNED', 'ENGAGED', 'WON', 'LOST'];

const EMPTY_FORM: LeadStageFormState = {
  statusValue: 'NEW',
  label: '',
  color: '#3b82f6',
  analyticBucket: 'UNASSIGNED',
  orderIndex: 1,
  active: true,
  requireNote: false,
  requireDate: false,
  createTask: false,
};

export default function LeadStageForm() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState<LeadStageFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!isEdit) return;
    const fetchStage = async () => {
      try {
        const res = await rolesApi.get<any[]>('/pipeline-stages');
        const s = res.data.find((x) => String(x.id) === String(id));
        if (s) {
          setForm({
            statusValue: s.statusValue,
            label: s.label,
            color: s.color || '#3b82f6',
            analyticBucket: s.analyticBucket || 'UNASSIGNED',
            orderIndex: s.orderIndex,
            active: s.active,
            requireNote: s.requireNote,
            requireDate: s.requireDate,
            createTask: s.createTask,
          });
        } else {
          setError('Pipeline stage not found.');
        }
      } catch (err: any) {
        console.error(err);
        setError('Failed to load stage details.');
      } finally {
        setFetching(false);
      }
    };
    fetchStage();
  }, [id, isEdit]);

  const upd = (k: keyof LeadStageFormState, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (isEdit) {
        await rolesApi.put(`/pipeline-stages/${id}`, form);
      } else {
        await rolesApi.post('/pipeline-stages', form);
      }
      setSuccess(isEdit ? 'Stage updated.' : 'Stage created.');
      setTimeout(() => navigate('/crm/stages'), 900);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to save pipeline stage.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <EntityFormPage
      title={isEdit ? 'Edit Lead Stage' : 'Create Lead Stage'}
      subtitle="Lead Stages"
      backRoute="/crm/stages"
      onSubmit={handleSubmit}
      submitLabel={isEdit ? 'Save Changes' : 'Create Stage'}
      loading={loading}
      error={error}
      success={success}
    >
      <div className="space-y-6 text-xs">
        {/* Section: Stage Info */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Stage Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Stage Label *</label>
              <input
                type="text"
                required
                placeholder="e.g. New Lead"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.label}
                onChange={(e) => upd('label', e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Status Value *</label>
              <select
                required
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.statusValue}
                onChange={(e) => upd('statusValue', e.target.value)}
              >
                {STATUS_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Analytic Bucket *</label>
              <select
                required
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.analyticBucket}
                onChange={(e) => upd('analyticBucket', e.target.value)}
              >
                {BUCKET_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Order Index *</label>
              <input
                type="number"
                required
                min="1"
                className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
                value={form.orderIndex}
                onChange={(e) => upd('orderIndex', parseInt(e.target.value, 10) || 1)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="bg-background border border-input rounded-lg p-0.5 cursor-pointer w-10 h-8 shrink-0"
                  value={form.color}
                  onChange={(e) => upd('color', e.target.value)}
                />
                <input
                  type="text"
                  placeholder="#3b82f6"
                  className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
                  value={form.color}
                  onChange={(e) => upd('color', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section: Stage Actions / Checkboxes */}
        <div className="bg-card border border-border p-5 rounded-xl space-y-4 shadow-sm">
          <h3 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" /> Stage Behaviors
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-2">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="stageActive"
                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                checked={form.active}
                onChange={(e) => upd('active', e.target.checked)}
              />
              <label htmlFor="stageActive" className="text-muted-foreground cursor-pointer select-none font-medium">
                Active
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="requireNote"
                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                checked={form.requireNote}
                onChange={(e) => upd('requireNote', e.target.checked)}
              />
              <label htmlFor="requireNote" className="text-muted-foreground cursor-pointer select-none font-medium">
                Require Note
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="requireDate"
                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                checked={form.requireDate}
                onChange={(e) => upd('requireDate', e.target.checked)}
              />
              <label htmlFor="requireDate" className="text-muted-foreground cursor-pointer select-none font-medium">
                Require Date
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="createTask"
                className="w-4 h-4 rounded border-input bg-background text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                checked={form.createTask}
                onChange={(e) => upd('createTask', e.target.checked)}
              />
              <label htmlFor="createTask" className="text-muted-foreground cursor-pointer select-none font-medium">
                Create Task
              </label>
            </div>
          </div>
        </div>
      </div>
    </EntityFormPage>
  );
}

