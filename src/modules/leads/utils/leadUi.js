export const optionValue = (item) =>
  typeof item === 'string' ? item : item?.value || item?.label || '';

export const optionLabel = (item) =>
  typeof item === 'string' ? item : item?.label || item?.value || '';

export const toOptions = (items = []) =>
  items.map((item) => ({
    label: optionLabel(item),
    value: optionValue(item),
  }));

export const getFieldValue = (lead, labels) => {
  const accepted = labels.map((label) => label.toLowerCase());
  return lead?.field_values?.find((item) =>
    accepted.includes(String(item.field?.label || '').trim().toLowerCase())
  )?.value || '';
};

export const getLeadName = (lead) => lead?.full_name || lead?.name || 'Unknown Lead';

export const getLeadCourse = (lead) =>
  lead?.course || getFieldValue(lead, ['Course of Interest', 'Course', 'Program']) || 'N/A';

export const getLeadSource = (lead) =>
  lead?.source || getFieldValue(lead, ['Source', 'Lead Source']) || 'N/A';

export const getLeadNotes = (lead) =>
  lead?.internal_notes || getFieldValue(lead, ['Internal Notes', 'Notes']) || '';

export const getLeadCounselor = (lead) =>
  lead?.counselor?.full_name ||
  lead?.counselor?.email ||
  lead?.assigned_to?.name ||
  'Unassigned';

export const formatShortDate = (date) =>
  date
    ? new Date(date).toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
    : 'N/A';

export const formatDateTime = (date) =>
  date
    ? new Date(date).toLocaleString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

export const statusClass = (status) => {
  const classes = {
    New: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
    Contacted: 'bg-slate-500/10 text-slate-500 border-slate-500/20',
    Interested: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'Follow-Up Pending': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    'Admission Confirmed': 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
    Rejected: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
  };
  return classes[status] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};
