import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useApp } from '@/context/AppContext';
import Modal from '@/components/ui/Modal';
import { useLead } from '@/modules/leads/hooks/useLead';
import {
  useAssignLeadCounselorMutation,
  useCreateFollowUpMutation,
  useGetFollowUpsQuery,
  useGetLeadOptionsQuery,
  useGetLeadUsersQuery,
  useGetLeadFormsQuery,
  useUpdateLeadMutation,
} from '@/modules/leads/services/leadsApi';

import { 
  ArrowLeft, 
  Phone, 
  Mail, 
  Calendar, 
  User, 
  Briefcase, 
  MessageSquare, 
  MapPin, 
  Clock, 
  Plus, 
  Check, 
  Bookmark, 
  UserCheck, 
  Edit,
  ClipboardList
} from 'lucide-react';

function StatusBadge({ status }) {
  const color = 
    status === 'Admission Confirmed' ? 'bg-emerald-100 text-emerald-800' :
    status === 'Pending' ? 'bg-amber-100 text-amber-800' :
    status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
    'bg-slate-100 text-slate-800';
  return (
    <span className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-full ${color}`}>
      {status || 'Unknown'}
    </span>
  );
}


export default function LeadDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { permissions = [] } = useApp();
  
  const hasAny = (...codes) => codes.some((code) => permissions.includes(code));
  const canEdit = hasAny('LEADS_EDIT_LEAD', 'edit_lead', 'LEADS_CREATE_LEAD');
  const canFollowUp = hasAny('LEADS_ADD_FOLLOWUP', 'create_followup', 'LEADS_CREATE_LEAD');
  const canAssign = hasAny('LEADS_ASSIGN_LEAD', 'assign_lead', 'LEADS_CREATE_LEAD');

  const { data: lead, isLoading: leadLoading } = useLead(id);
  const { data: followupsData, isLoading: followupsLoading } = useGetFollowUpsQuery(id);
  const { data: optionsData } = useGetLeadOptionsQuery();
  const { data: counselorsData } = useGetLeadUsersQuery();
  const { data: formsData } = useGetLeadFormsQuery();

  const [createFollowUp] = useCreateFollowUpMutation();
  const [updateLeadApi] = useUpdateLeadMutation();
  const [assignLeadApi] = useAssignLeadCounselorMutation();

  const loading = leadLoading || followupsLoading;
  const followups = followupsData || [];
  const counselors = counselorsData || [];
  const forms = formsData || [];
  const leadOptions = optionsData || {};

  const addFollowup = async (leadId, fupData) => {
    return createFollowUp({ lead_id: leadId, ...fupData }).unwrap();
  };
  const updateLead = async (payload) => {
    return updateLeadApi(payload).unwrap();
  };
  const assignLead = async (leadId, counselorId) => {
    return updateLeadApi({ id: leadId, counselor_id: counselorId }).unwrap();
  };

  const contactMethodOptions = (leadOptions?.contact_methods || []).filter((item) => item.value || item.label);
  const statusOptions = (leadOptions?.statuses || []).filter((item) => item.value || item.label);

  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState(false);
  const [selectedCounselorId, setSelectedCounselorId] = useState('');
  
  // Follow-up form state
  const [fupType, setFupType] = useState(contactMethodOptions[0]?.value || 'Call');
  const [fupNotes, setFupNotes] = useState('');
  const [fupNewStatus, setFupNewStatus] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [confirmRevenueAmount, setConfirmRevenueAmount] = useState('');
  const [confirmPaymentStatus, setConfirmPaymentStatus] = useState('Paid');
  const [confirmPaymentReference, setConfirmPaymentReference] = useState('');
  const isAdmissionConfirmedStatus = statusOptions.some((option) => {
    const value = option.value || option.label;
    return value === fupNewStatus && String(option.label || value).toLowerCase() === 'admission confirmed';
  }) || fupNewStatus === 'Admission Confirmed';

  React.useEffect(() => {
    if (!contactMethodOptions.length) return;
    const hasCurrent = contactMethodOptions.some((option) => (option.value || option.label) === fupType);
    if (!hasCurrent) {
      setFupType(contactMethodOptions[0].value || contactMethodOptions[0].label);
    }
  }, [contactMethodOptions, fupType]);

  // 1. Fetch Lead
  const leadForm = lead ? (forms || []).find(f => f.id === lead.form_id) : null;
  if (loading) {
    return (
      <div className="glass-panel p-12 text-center rounded-3xl">
        <p className="text-xs font-bold text-slate-400">Loading lead information...</p>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="glass-panel p-12 text-center rounded-3xl space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">Lead Not Found</h3>
        <p className="text-xs text-slate-400">The lead you are trying to view does not exist or has been deleted.</p>
        <Link to="/dashboard/leads" className="text-xs font-bold text-indigo-500 hover:underline">
          Back to Directory
        </Link>
      </div>
    );
  }

  // Helper to get a field value for any formField (by id first, then by label for core fields)
  const getFormFieldValue = (field) => {
    if (!lead) return null;

    // 1. Try lookup by field_id in field_values
    const byId = (lead.field_values || []).find(v => v.field_id === field.id);
    if (byId !== undefined && byId !== null) return byId.value;

    // 2. Fallback: resolve core fields stored as direct columns on the lead
    const label = (field.label || '').toLowerCase().trim();

    // Identity fields
    if (['full name', 'name', 'student full name', 'student name'].includes(label))
      return lead.full_name;
    if (['email', 'email address', 'student email'].includes(label))
      return lead.email;
    if (['phone', 'mobile', 'phone number', 'contact number', 'mobile number'].includes(label))
      return lead.phone;

    // Status
    if (label === 'status') return lead.status;

    // Assigned Counselor — resolve name from counselors list
    if (label === 'assigned counselor' || label === 'counselor') {
      return getCounselorName(lead.counselor_id);
    }

    return null; // Will display as NA
  };

  // Use the LEAD'S specific form fields
  const displayFields = (leadForm?.fields || []).map(f => ({
    ...f,
    type: f.field_type || f.type
  }));

  // Group by section for organised display
  const fieldsBySection = displayFields.reduce((acc, field) => {
    const section = field.section || 'General Details';
    if (!acc[section]) acc[section] = [];
    acc[section].push(field);
    return acc;
  }, {});

  // Safety net: show any field_values not covered by displayFields
  // (handles fields added after the lead was created, or form mismatches)
  const displayFieldIds = new Set(displayFields.map(f => f.id));
  const extraValues = (lead.field_values || []).filter(
    fv =>
      !displayFieldIds.has(fv.field_id) &&
      fv.value !== null &&
      fv.value !== undefined &&
      String(fv.value).trim() !== ''
  );

  // Helper to parse type/notes from note string
  const getFollowupDetails = (fup) => {
    const match = (fup.note || '').match(/^\[(.*?)\] (.*)$/s);
    if (match) {
      return {
        type: match[1],
        notes: match[2]
      };
    }
    return {
      type: 'Call', // default fallback
      notes: fup.note || ''
    };
  };

  // Helper to get counselor name by ID
  const getCounselorName = (counselorId) => {
    const c = counselors.find(item => item.id === counselorId);
    if (c) return c.full_name;
    if (lead?.counselor_id === counselorId && lead?.counselor?.full_name) return lead.counselor.full_name;
    return '';
  };

  const handleAssignCounselor = async () => {
    if (!selectedCounselorId) return;
    const counselorIdToAssign = isNaN(Number(selectedCounselorId)) ? selectedCounselorId : Number(selectedCounselorId);
    await assignLead(lead.id, counselorIdToAssign);
    setSelectedCounselorId('');
  };

  // 2. Fetch Lead Follow-ups
  const leadFollowups = followups.filter(f => String(f.lead_id) === id)
    .sort((a,b) => new Date(b.scheduled_at || b.created_at) - new Date(a.scheduled_at || a.created_at));

  const mappedFollowups = leadFollowups.map(fup => {
    const details = getFollowupDetails(fup);
    const counselorName = getCounselorName(fup.counselor_id);
    const reminderDateFormatted = fup.scheduled_at ? new Date(fup.scheduled_at).toLocaleString() : null;
    return {
      id: fup.id,
      type: details.type,
      notes: details.notes,
      counselor: counselorName,
      reminderDate: reminderDateFormatted,
      date: fup.created_at
    };
  });

  // (custom field config no longer needed — using fieldsBySection above)

  // Handle follow-up submission
  const handleAddFollowup = async (e) => {
    e.preventDefault();
    if (!fupNotes.trim()) return;

    // Save formatted type in the note
    const noteContent = `[${fupType}] ${fupNotes}`;

    await addFollowup(lead.id, {
      note: noteContent,
      scheduledAt: reminderDate || undefined
    });

    // If a new status is provided, update the lead status
    if (fupNewStatus) {
      const updatePayload = {
        id: lead.id,
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        status: fupNewStatus,
        form_id: lead.form_id,
        counselor_id: lead.counselor_id
      };
      if (isAdmissionConfirmedStatus) {
        updatePayload.revenue_amount = confirmRevenueAmount || lead.revenue_amount || '0';
        updatePayload.payment_status = confirmPaymentStatus || lead.payment_status || 'Paid';
        updatePayload.payment_reference = confirmPaymentReference || lead.payment_reference || '';
      }
      await updateLead(updatePayload);
    }

    // Reset state & Close
    setFupNotes('');
    setFupNewStatus('');
    setReminderDate('');
    setConfirmRevenueAmount('');
    setConfirmPaymentStatus('Paid');
    setConfirmPaymentReference('');
    setIsFollowupModalOpen(false);
  };

  const getFollowupIcon = (type) => {
    switch (type) {
      case 'Call':
        return <Phone className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />;
      case 'Email':
        return <Mail className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />;
      case 'WhatsApp':
        return <MessageSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
      case 'Meeting':
        return <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getFollowupColor = (type) => {
    switch (type) {
      case 'Call': return 'bg-cyan-50 dark:bg-cyan-950/20 border-cyan-100 dark:border-cyan-900/30';
      case 'Email': return 'bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30';
      case 'WhatsApp': return 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30';
      case 'Meeting': return 'bg-purple-50 dark:bg-purple-950/20 border-purple-100 dark:border-purple-900/30';
      default: return 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Back navigation & Actions Header */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          to="/dashboard/leads" 
          className="text-xs font-bold text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> <span className="hidden xs:inline">Back to Directory</span><span className="xs:hidden">Back</span>
        </Link>
        {canEdit && leadForm?.name === "Active Intake Form" && (
          <Link
            to={`/dashboard/leads/edit/${lead.id}`}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50/50 border border-slate-200/50 dark:border-slate-800 rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" /> <span className="hidden xs:inline">Edit Profile</span><span className="xs:hidden">Edit</span>
          </Link>
        )}
      </div>

      {/* Student Profile Info Banner */}
      <div className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-200/50 dark:border-slate-800/30 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-base sm:text-lg font-black shadow-lg shadow-indigo-500/10 shrink-0">
              {(lead.full_name || '').split(' ').map(n => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-black text-slate-800 dark:text-slate-100 truncate">{lead.full_name}</h2>
                <StatusBadge status={lead.status} />
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1.5 flex flex-wrap gap-x-4 gap-y-1.5">
                <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-indigo-500" /> {lead.email}</span>
                <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-indigo-500" /> {lead.phone}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-row md:flex-col justify-between items-center md:items-end gap-2 pt-4 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800/50">
            <div className="text-left md:text-right">
              <span className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Counselor</span>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">{getCounselorName(lead.counselor_id) || 'Unassigned'}</span>
            </div>
            <span className="text-[9px] text-slate-400">Registered: {new Date(lead.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {canAssign && (
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-500">Counselor Assignment</h3>
              <p className="mt-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                Assign this lead to a counselor. The counselor will see it after login and can add follow ups.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[360px] sm:flex-row">
              <select
                value={selectedCounselorId}
                onChange={(event) => setSelectedCounselorId(event.target.value)}
                className="min-h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
              >
                <option value="">{lead.counselor_id ? `Current: ${getCounselorName(lead.counselor_id)}` : 'Select counselor'}</option>
                {counselors.map((counselor) => (
                  <option key={counselor.id} value={counselor.id}>
                    {counselor.full_name} {counselor.email ? `(${counselor.email})` : ''}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAssignCounselor}
                disabled={!selectedCounselorId}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-xs font-black text-white shadow-md shadow-indigo-500/10 hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <UserCheck className="h-4 w-4" />
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Lead & Academic details + Custom field results */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Dynamic Form Fields — grouped by section, all fields from the active form */}
          {Object.keys(fieldsBySection).length === 0 ? (
            <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Lead Information
              </h3>
              <p className="text-[11px] text-slate-400 mt-3">No form fields configured.</p>
            </div>
          ) : (
            Object.entries(fieldsBySection).map(([section, fields]) => (
              <div key={section} className="glass-panel p-6 rounded-3xl space-y-4">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <ClipboardList className="w-4 h-4" /> {section}
                </h3>
                <div className="space-y-3.5 text-xs">
                  {fields.map((field) => {
                    const raw = getFormFieldValue(field);
                    let displayValue;
                    if (raw === true) displayValue = 'Yes';
                    else if (raw === false) displayValue = 'No';
                    else if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
                      displayValue = String(raw);
                    } else {
                      displayValue = null; // will show NA
                    }
                    return (
                      <div
                        key={field.id}
                        className="border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-b-0 last:pb-0"
                      >
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                          {field.label}
                          {field.required && <span className="text-rose-400 ml-0.5">*</span>}
                        </span>
                        {displayValue ? (
                          <span className="text-slate-800 dark:text-slate-200 font-semibold block mt-1">
                            {displayValue}
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic block mt-1 text-[11px]">NA</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}

          {/* Safety-net: field_values not covered by the form fields above */}
          {extraValues.length > 0 && (
            <div className="glass-panel p-6 rounded-3xl space-y-4">
              <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ClipboardList className="w-4 h-4" /> Additional Details
              </h3>
              <div className="space-y-3.5 text-xs">
                {extraValues.map((fv) => (
                  <div
                    key={fv.field_id}
                    className="border-b border-slate-100 dark:border-slate-800/40 pb-3 last:border-b-0 last:pb-0"
                  >
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      {fv.field?.label || `Field #${fv.field_id}`}
                    </span>
                    <span className="text-slate-800 dark:text-slate-200 font-semibold block mt-1">
                      {String(fv.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reminders & Schedules panel */}
          <div className="glass-panel p-6 rounded-3xl space-y-4">
            <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4" /> Next Reminder Schedules
            </h3>
            
            {mappedFollowups.filter(f => f.reminderDate).length === 0 ? (
              <div className="text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                <span className="text-[10px] text-slate-400">No callbacks scheduled.</span>
              </div>
            ) : (
              <div className="space-y-3">
                {mappedFollowups.filter(f => f.reminderDate).map((fup, i) => (
                  <div key={i} className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="block text-xs font-bold text-amber-700 dark:text-amber-400">Callback Task</span>
                      <span className="block text-[9px] text-slate-400 mt-0.5">{fup.type} Discussion</span>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg">
                      {fup.reminderDate}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column: Follow-up Timeline & log actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-3xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200">Discussion History</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Chronological counselor engagement actions logged</p>
              </div>
              {canFollowUp && (
                <button
                  onClick={() => setIsFollowupModalOpen(true)}
                  className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center gap-1 hover-scale shadow-md shadow-indigo-500/15"
                >
                  <Plus className="w-4 h-4" /> Log Conversation
                </button>
              )}
            </div>

            {/* Vertical Timeline */}
            <div className="space-y-6 relative pl-3.5 border-l-2 border-slate-200/60 dark:border-slate-800/80 ml-2 py-1">
              {mappedFollowups.length === 0 ? (
                <div className="text-center py-12 text-slate-400 dark:text-slate-600 text-xs">
                  No communication history has been logged for this student yet. Click "Log Conversation" to add one.
                </div>
              ) : (
                mappedFollowups.map((fup, i) => (
                  <div key={fup.id} className="relative group">
                    {/* Circle timeline pin */}
                    <span className="absolute left-[-22px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-950 bg-indigo-600 z-10" />

                    <div className={`p-4 rounded-2xl border ${getFollowupColor(fup.type)}`}>
                      <div className="flex flex-wrap items-center justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 flex items-center justify-center shadow-xs">
                            {getFollowupIcon(fup.type)}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {fup.type} Contacted
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold">
                          {new Date(fup.date).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        {fup.notes}
                      </p>
                      <div className="mt-3 flex items-center justify-between border-t border-slate-200/30 dark:border-slate-800/20 pt-2.5">
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                          Counselor: {fup.counselor}
                        </span>
                        {fup.reminderDate && (
                          <span className="text-[9px] font-bold text-amber-600 dark:text-amber-500 flex items-center gap-1">
                            ⏰ Reminder scheduled: {fup.reminderDate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Log Follow-up Modal */}
      <Modal
        isOpen={isFollowupModalOpen}
        onClose={() => setIsFollowupModalOpen(false)}
        title={`Log Discussion for ${lead.full_name}`}
        size="md"
      >
        <form onSubmit={handleAddFollowup} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Follow-up Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Method
              </label>
              <select
                value={fupType}
                onChange={(e) => setFupType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300"
              >
                {contactMethodOptions.map((option) => (
                  <option key={option.id || option.value || option.label} value={option.value || option.label}>
                    {option.label || option.value}
                  </option>
                ))}
              </select>
            </div>

            {/* New Lead Status */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Update Lead Status (Optional)
              </label>
              <select
                value={fupNewStatus}
                onChange={(e) => setFupNewStatus(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300"
              >
                <option value="">Keep current ({lead.status})</option>
                {statusOptions.map((option) => {
                  const value = option.value || option.label;
                  return (
                    <option key={option.id || value} value={value}>
                      {option.label || value}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Discussion Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Discussion Summary Notes *
            </label>
            <textarea
              placeholder="What was discussed? e.g., Requested prospectus, compared pricing, promised weekend slots..."
              required
              rows={3}
              value={fupNotes}
              onChange={(e) => setFupNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300 resize-none"
            />
          </div>

          {/* Callback Reminder Schedule */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Schedule Next Callback Reminder (Optional)
            </label>
            <input
              type="datetime-local"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-white/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:text-slate-300"
            />
          </div>

          {isAdmissionConfirmedStatus && (
            <div className="grid grid-cols-1 gap-4 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 sm:grid-cols-3 dark:border-emerald-900/40 dark:bg-emerald-950/10">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Revenue Amount
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={confirmRevenueAmount}
                  onChange={(e) => setConfirmRevenueAmount(e.target.value)}
                  placeholder={lead.revenue_amount ? String(lead.revenue_amount) : '0'}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-300"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Payment Status
                </label>
                <select
                  value={confirmPaymentStatus}
                  onChange={(e) => setConfirmPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-300"
                >
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Reference
                </label>
                <input
                  value={confirmPaymentReference}
                  onChange={(e) => setConfirmPaymentReference(e.target.value)}
                  placeholder="Receipt / UPI / note"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 dark:text-slate-300"
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/50 dark:border-slate-800/50">
            <button
              type="button"
              onClick={() => setIsFollowupModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-md shadow-indigo-500/10"
            >
              Log & Update
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}