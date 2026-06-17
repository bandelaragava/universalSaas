// // src/modules/leads/renderer/DynamicFormRenderer.jsx
// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import {
//   useCreateLeadMutation,
//   useGetLeadFormsQuery,
//   useGetLeadOptionsQuery,
//   useGetLeadUsersQuery,
// } from '@/modules/leads/services/leadsApi';
// import UniversalFieldRenderer from '@/modules/leads/renderer/UniversalFieldRenderer';
// import { Button } from '@/components/ui/button';
// import { useForm } from 'react-hook-form';
// import { useToast } from '@/context/ToastContext';
// import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
// import { toOptions } from '@/modules/leads/utils/leadUi';

// const groupFields = (fields = []) => {
//   return fields.reduce((acc, field) => {
//     const section = field.section || 'General Details';
//     if (!acc[section]) acc[section] = [];
//     acc[section].push(field);
//     return acc;
//   }, {});
// };

// export default function DynamicFormRenderer() {
//   const { handleSubmit, register, setValue } = useForm();
//   const navigate = useNavigate();
//   const toast = useToast();
//   const { data: forms = [], isLoading: formsLoading, error: formsError } = useGetLeadFormsQuery();
//   const { data: options } = useGetLeadOptionsQuery();
//   const { data: users = [] } = useGetLeadUsersQuery();
//   const [createLead, { isLoading: isSaving }] = useCreateLeadMutation();

//   const form = forms.find((item) => item.is_active) || forms[0];
//   const backendFields = form?.fields || [];
//   const statusOptions = toOptions(options?.statuses || []);
//   const fields = backendFields.map((field) => ({
//     ...field,
//     name: `field_${field.id}`,
//     type: field.field_type === 'dropdown' ? 'select' : field.field_type,
//     options: field.label === 'Status' && statusOptions.length ? statusOptions : toOptions(field.options || []),
//   }));
//   const grouped = groupFields(fields);

//   const isLoading = formsLoading;
//   const error = formsError;

//   if (isLoading) {
//     return (
//       <div className="flex flex-col items-center justify-center py-20 space-y-4">
//         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
//         <p className="text-sm text-muted-foreground animate-pulse">Loading dynamic form schema...</p>
//       </div>
//     );
//   }

//   if (error || !form) {
//     return (
//       <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
//         <p className="font-semibold">Failed to load lead form</p>
//         <p className="text-xs mt-1 text-muted-foreground">Please check if the backend server is running.</p>
//         <Button variant="outline" className="mt-4 border-destructive/30 hover:bg-destructive/20 text-foreground" onClick={() => navigate('/leads')}>
//           Go Back
//         </Button>
//       </div>
//     );
//   }

//   const onSubmit = async (values) => {
//     const getByLabel = (label) => {
//       const field = fields.find((item) => item.label.toLowerCase() === label.toLowerCase());
//       return field ? values[field.name] : '';
//     };

//     const dynamicFields = fields
//       .filter((field) => !['Student Full Name', 'Email Address', 'Phone Number', 'Status', 'Assigned Counselor'].includes(field.label))
//       .map((field) => ({
//         field_id: field.id,
//         value: values[field.name] == null ? '' : String(values[field.name]),
//       }));

//     const payload = {
//       form_id: form.id,
//       full_name: getByLabel('Student Full Name') || values.full_name || 'Unknown Lead',
//       email: getByLabel('Email Address') || null,
//       phone: getByLabel('Phone Number') || null,
//       status: getByLabel('Status') || 'New',
//       counselor_id: values.counselor_id ? Number(values.counselor_id) : null,
//       dynamic_fields: dynamicFields,
//     };

//     try {
//       await createLead(payload).unwrap();
//       toast.success('Success!', 'Lead has been created and assigned.');
//       navigate('/leads');
//     } catch (err) {
//       toast.error('Error', err?.data?.detail || 'Failed to create lead.');
//     }
//   };

//   return (
//     <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl space-y-7">
//       <div className="flex items-center space-x-4">
//         <Button
//           type="button"
//           variant="ghost"
//           size="sm"
//           onClick={() => navigate('/leads')}
//           className="gap-2 text-slate-500 hover:text-slate-900"
//         >
//           <ArrowLeft className="h-4 w-4" />
//           Cancel & Go Back
//         </Button>
//       </div>

//       <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
//         <div className="flex items-start gap-4">
//           <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
//             <UserPlus className="h-5 w-5" />
//           </div>
//           <div>
//             <h3 className="text-2xl font-bold text-slate-800">Register New Student Lead</h3>
//             <p className="mt-1 text-slate-400">Populate details to assign counselor and course preferences.</p>
//             <select className="mt-4 h-10 rounded-xl border border-slate-200 bg-white px-4 font-semibold text-violet-600">
//               <option>{form.name || 'Active Intake Form'}</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       <div className="space-y-6">
//         <div className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
//           <label className="text-sm font-bold text-slate-700" htmlFor="counselor_id">Assign Counselor</label>
//           <select
//             id="counselor_id"
//             {...register('counselor_id')}
//             defaultValue=""
//             className="mt-2 flex h-12 w-full rounded-xl border border-slate-200 bg-white px-5 py-2 text-lg text-slate-700 shadow-sm focus:outline-none focus:ring-4 focus:ring-violet-100"
//           >
//             <option value="">Unassigned</option>
//             {users.map((user) => (
//               <option key={user.id} value={user.id}>
//                 {user.full_name || user.email}
//               </option>
//             ))}
//           </select>
//         </div>

//         {Object.entries(grouped).map(([sectionTitle, sectionFields]) => (
//           <div key={sectionTitle} className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
//             <h3 className="mb-6 border-b border-slate-100 pb-4 text-lg font-bold text-slate-800">{sectionTitle}</h3>
//             <div className="grid gap-6 grid-cols-12">
//               {sectionFields
//                 .filter((field) => field.label !== 'Assigned Counselor')
//                 .map((field) => (
//                 <UniversalFieldRenderer
//                   key={field.name}
//                   field={field}
//                   register={register}
//                   setValue={setValue}
//                 />
//               ))}
//             </div>
//           </div>
//         ))}
//       </div>

//       <div className="sticky bottom-4 z-10 flex justify-end pt-4 space-x-4">
//         <Button
//           type="button"
//           variant="outline"
//           onClick={() => navigate('/leads')}
//           disabled={isSaving}
//           className="rounded-xl bg-white"
//         >
//           Cancel
//         </Button>
//         <Button type="submit" disabled={isSaving} className="min-w-[180px] rounded-xl bg-violet-600 text-white hover:bg-violet-700">
//           {isSaving ? (
//             <>
//               <Loader2 className="h-4 w-4 animate-spin mr-2" />
//               Saving...
//             </>
//           ) : (
//             'Create Lead'
//           )}
//         </Button>
//       </div>
//     </form>
//   );
// }


// src/modules/leads/renderer/DynamicFormRenderer.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useCreateLeadMutation,
  useGetLeadFormsQuery,
  useGetLeadOptionsQuery,
  useGetLeadUsersQuery,
} from '@/modules/leads/services/leadsApi';
import UniversalFieldRenderer from '@/modules/leads/renderer/UniversalFieldRenderer';
import { Button } from '@/components/ui/button';
import { useForm } from 'react-hook-form';
import { useToast } from '@/context/ToastContext';
import { Loader2, ArrowLeft, UserPlus } from 'lucide-react';
import { toOptions } from '@/modules/leads/utils/leadUi';

const groupFields = (fields = []) => {
  return fields.reduce((acc, field) => {
    const section = field.section || 'General Details';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {});
};

export default function DynamicFormRenderer({ onClose }) {
  const { handleSubmit, register, setValue } = useForm();
  const navigate = useNavigate();
  const toast = useToast();
  const { data: forms = [], isLoading: formsLoading, error: formsError } = useGetLeadFormsQuery();
  const { data: options } = useGetLeadOptionsQuery();
  const { data: users = [] } = useGetLeadUsersQuery();
  const [createLead, { isLoading: isSaving }] = useCreateLeadMutation();

  const form = forms.find((item) => item.is_active) || forms[0];
  const backendFields = form?.fields || [];
  const statusOptions = toOptions(options?.statuses || []);
  const fields = backendFields.map((field) => ({
    ...field,
    name: `field_${field.id}`,
    type: field.field_type === 'dropdown' ? 'select' : field.field_type,
    options: field.label === 'Status' && statusOptions.length ? statusOptions : toOptions(field.options || []),
  }));
  const grouped = groupFields(fields);

  const isLoading = formsLoading;
  const error = formsError;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground animate-pulse">Loading dynamic form schema...</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-center text-destructive">
        <p className="font-semibold">Failed to load lead form</p>
        <p className="text-xs mt-1 text-muted-foreground">Please check if the backend server is running.</p>
        <Button variant="outline" className="mt-4 border-destructive/30 hover:bg-destructive/20 text-foreground" onClick={() => navigate('/leads')}>
          Go Back
        </Button>
      </div>
    );
  }

  const onSubmit = async (values) => {
    const getByLabel = (label) => {
      const field = fields.find((item) => item.label.toLowerCase() === label.toLowerCase());
      return field ? values[field.name] : '';
    };

    const dynamicFields = fields
      .filter((field) => !['Student Full Name', 'Email Address', 'Phone Number', 'Status', 'Assigned Counselor'].includes(field.label))
      .map((field) => ({
        field_id: field.id,
        value: values[field.name] == null ? '' : String(values[field.name]),
      }));

    const payload = {
      form_id: form.id,
      full_name: getByLabel('Student Full Name') || values.full_name || 'Unknown Lead',
      email: getByLabel('Email Address') || null,
      phone: getByLabel('Phone Number') || null,
      status: getByLabel('Status') || 'New',
      counselor_id: values.counselor_id ? Number(values.counselor_id) : null,
      dynamic_fields: dynamicFields,
    };

    try {
      await createLead(payload).unwrap();
      toast.success('Success!', 'Lead has been created and assigned.');
      if (onClose) {
        onClose();
      } else {
        navigate('/leads');
      }
    } catch (err) {
      toast.error('Error', err?.data?.detail || 'Failed to create lead.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="mx-auto max-w-5xl space-y-7">
      {!onClose && (
        <div className="flex items-center space-x-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate('/leads')}
            className="gap-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Cancel & Go Back
          </Button>
        </div>
      )}

      {!onClose && (
        <div className="rounded-3xl border border-border bg-card text-card-foreground p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Register New Student Lead</h3>
              <p className="mt-1 text-muted-foreground">Populate details to assign counselor and course preferences.</p>
              <select className="mt-4 h-10 rounded-xl border border-border bg-background px-4 font-semibold text-violet-600">
                <option>{form.name || 'Active Intake Form'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-3xl border border-border bg-card text-card-foreground p-10 shadow-sm">
          <label className="text-sm font-bold text-foreground" htmlFor="counselor_id">Assign Counselor</label>
          <select
            id="counselor_id"
            {...register('counselor_id')}
            defaultValue=""
            className="mt-2 flex h-12 w-full rounded-xl border border-border bg-background px-5 py-2 text-lg text-foreground shadow-sm focus:outline-none focus:ring-4 focus:ring-violet-100/30"
          >
            <option value="">Unassigned</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name || user.email}
              </option>
            ))}
          </select>
        </div>

        {Object.entries(grouped).map(([sectionTitle, sectionFields]) => (
          <div key={sectionTitle} className="rounded-3xl border border-border bg-card text-card-foreground p-10 shadow-sm">
            <h3 className="mb-6 border-b border-border pb-4 text-lg font-bold text-foreground">{sectionTitle}</h3>
            <div className="grid gap-6 grid-cols-12">
              {sectionFields
                .filter((field) => field.label !== 'Assigned Counselor')
                .map((field) => (
                  <UniversalFieldRenderer
                    key={field.name}
                    field={field}
                    register={register}
                    setValue={setValue}
                  />
                ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sticky bottom-4 z-10 flex justify-end pt-4 space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onClose ? onClose() : navigate('/leads')}
          disabled={isSaving}
          className="rounded-xl bg-background text-foreground border-border"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving} className="min-w-[180px] rounded-xl bg-violet-600 text-white hover:bg-violet-700">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            'Create Lead'
          )}
        </Button>
      </div>
    </form>
  );
}