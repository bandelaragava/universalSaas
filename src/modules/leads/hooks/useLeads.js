// // src/modules/leads/hooks/useLeads.js
import { useGetLeadsQuery, useGetLeadUsersQuery } from '@/modules/leads/services/leadsApi';

const getDynamicValue = (lead, acceptedLabels) => {
  const labels = acceptedLabels.map((label) => label.toLowerCase());
  return lead.field_values?.find((item) =>
    labels.includes(String(item.field?.label || '').trim().toLowerCase())
  )?.value;
};

export const normalizeLead = (lead) => ({
  ...lead,
  name: lead.full_name || lead.name || '',
  course: lead.course || getDynamicValue(lead, ['course', 'course of interest', 'program']) || 'N/A',
  source: lead.source || getDynamicValue(lead, ['source', 'lead source']) || 'N/A',
  internal_notes: lead.internal_notes || getDynamicValue(lead, ['internal notes', 'notes']) || '',
  company: lead.company || getDynamicValue(lead, ['company', 'company name', 'organization']) || '',
  priority: lead.priority || getDynamicValue(lead, ['priority', 'lead priority']) || 'Medium',
  assigned_to: lead.assigned_to || (
    lead.counselor
      ? {
        id: lead.counselor.id,
        name: lead.counselor.full_name || lead.counselor.email,
      }
      : null
  ),
  followup_date: lead.followup_date || getDynamicValue(lead, ['follow-up date', 'followup date', 'next follow up']) || null,
});

export const useLeads = () => {
  const query = useGetLeadsQuery();
  const { data: leadUsers = [], isLoading: isUsersLoading } = useGetLeadUsersQuery();

  const leads = Array.isArray(query.data) ? query.data.map(normalizeLead) : [];
  
  const allowedUserIds = new Set(leadUsers.map(u => String(u.id)));
  
  const filteredLeads = leads.filter(lead => {
    // If users are still loading, it's safer to hide assigned leads rather than showing unauthorized ones.
    if (!lead.assigned_to || !lead.assigned_to.id) return true;
    return allowedUserIds.has(String(lead.assigned_to.id));
  });

  return {
    ...query,
    data: filteredLeads,
  };
};