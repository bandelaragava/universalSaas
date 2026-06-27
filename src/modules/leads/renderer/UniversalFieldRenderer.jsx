// // src/modules/leads/renderer/UniversalFieldRenderer.jsx
// import React from 'react';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';

// const FIELD_COMPONENTS = {
//   text: ({ field, register }) => (
//     <div className="space-y-2 col-span-12 md:col-span-6">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <Input
//         id={field.name}
//         {...register(field.name, { required: field.required })}
//         placeholder={field.placeholder}
//         className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/40 px-5 text-base"
//       />
//     </div>
//   ),
//   email: ({ field, register }) => (
//     <div className="space-y-2 col-span-12 md:col-span-6">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <Input
//         id={field.name}
//         type="email"
//         {...register(field.name, { required: field.required })}
//         placeholder={field.placeholder}
//         className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/40 px-5 text-base"
//       />
//     </div>
//   ),
//   phone: ({ field, register }) => (
//     <div className="space-y-2 col-span-12 md:col-span-6">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <Input
//         id={field.name}
//         type="tel"
//         {...register(field.name, { required: field.required })}
//         placeholder={field.placeholder}
//         className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/40 px-5 text-base"
//       />
//     </div>
//   ),
//   number: ({ field, register }) => (
//     <div className="space-y-2 col-span-12 md:col-span-6">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <Input
//         id={field.name}
//         type="number"
//         {...register(field.name, { required: field.required })}
//         placeholder={field.placeholder}
//         className="h-12 w-full rounded-xl border-slate-200 bg-slate-50/40 px-5 text-base"
//       />
//     </div>
//   ),
//   textarea: ({ field, register }) => (
//     <div className="space-y-2 col-span-12">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <textarea
//         id={field.name}
//         {...register(field.name, { required: field.required })}
//         placeholder={field.placeholder}
//         rows={4}
//         className="flex w-full rounded-xl border border-slate-200 bg-slate-50/40 px-5 py-3 text-base shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
//       />
//     </div>
//   ),
//   select: ({ field, register }) => (
//     <div className="space-y-2 col-span-12 md:col-span-6">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <select
//         id={field.name}
//         {...register(field.name, { required: field.required })}
//         defaultValue=""
//         className="flex h-12 w-full rounded-xl border border-slate-200 bg-slate-50/40 px-5 py-2 text-base shadow-sm focus:outline-none focus:ring-4 focus:ring-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
//       >
//         <option value="" disabled>Select {field.label.toLowerCase()}...</option>
//         {field.options?.map((opt) => (
//           <option key={opt.value} value={opt.value}>
//             {opt.label}
//           </option>
//         ))}
//       </select>
//     </div>
//   ),
//   checkbox: ({ field, register }) => (
//     <div className="flex items-center space-x-2 col-span-12 py-2">
//       <input
//         id={field.name}
//         type="checkbox"
//         {...register(field.name)}
//         className="h-4 w-4 rounded border-border text-primary focus:ring-primary bg-card"
//       />
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700 select-none cursor-pointer">
//         {field.label}
//       </Label>
//     </div>
//   ),
//   date: ({ field, register }) => (
//     <div className="space-y-2 col-span-12 md:col-span-6">
//       <Label htmlFor={field.name} className="text-sm font-bold text-slate-700">
//         {field.label} {field.required && <span className="text-destructive">*</span>}
//       </Label>
//       <Input
//         id={field.name}
//         type="date"
//         {...register(field.name, { required: field.required })}
//         className="h-12 w-full cursor-pointer rounded-xl border-slate-200 bg-slate-50/40 px-5 text-base"
//       />
//     </div>
//   ),
// };

// export default function UniversalFieldRenderer({ field, register }) {
//   const Renderer = FIELD_COMPONENTS[field.type];
//   if (!Renderer) return null;
//   return <Renderer field={field} register={register} />;
// }


// src/modules/leads/renderer/UniversalFieldRenderer.jsx
import React from 'react';
import { Label } from '@/components/ui/label';

const FIELD_COMPONENTS = {
  text: ({ field, register }) => (
    <div className="col-span-1">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <input
        id={field.name}
        {...register(field.name, { required: field.required })}
        placeholder={field.placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 h-auto text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
  email: ({ field, register }) => (
    <div className="col-span-1">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <input
        id={field.name}
        type="email"
        {...register(field.name, { required: field.required })}
        placeholder={field.placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 h-auto text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
  phone: ({ field, register }) => (
    <div className="col-span-1">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <input
        id={field.name}
        type="tel"
        {...register(field.name, { required: field.required })}
        placeholder={field.placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 h-auto text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
  number: ({ field, register }) => (
    <div className="col-span-1">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <input
        id={field.name}
        type="number"
        {...register(field.name, { required: field.required })}
        placeholder={field.placeholder}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 h-auto text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
  textarea: ({ field, register }) => (
    <div className="col-span-1 md:col-span-2">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <textarea
        id={field.name}
        {...register(field.name, { required: field.required })}
        placeholder={field.placeholder}
        rows={3}
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
  select: ({ field, register }) => (
    <div className="col-span-1">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <select
        id={field.name}
        {...register(field.name, { required: field.required })}
        defaultValue=""
        className="w-full rounded-lg border border-border bg-background px-3 py-2.5 h-auto text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="" disabled className="text-muted-foreground">Select {field.label.toLowerCase()}...</option>
        {field.options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
  checkbox: ({ field, register }) => (
    <div className="flex items-center space-x-2 col-span-1 md:col-span-2 py-1">
      <input
        id={field.name}
        type="checkbox"
        {...register(field.name)}
        className="h-4 w-4 rounded border-border text-cyan-600 focus:ring-1 focus:ring-cyan-500 bg-background"
      />
      <Label htmlFor={field.name} className="text-sm font-semibold text-foreground select-none cursor-pointer">
        {field.label}
      </Label>
    </div>
  ),
  date: ({ field, register }) => (
    <div className="col-span-1">
      <Label htmlFor={field.name} className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {field.label} {field.required && <span className="text-rose-500">*</span>}
      </Label>
      <input
        id={field.name}
        type="date"
        {...register(field.name, { required: field.required })}
        className="w-full cursor-pointer rounded-lg border border-border bg-background px-3 py-2.5 h-auto text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </div>
  ),
};

export default function UniversalFieldRenderer({ field, register }) {
  const Renderer = FIELD_COMPONENTS[field.type];
  if (!Renderer) return null;
  return <Renderer field={field} register={register} />;
}