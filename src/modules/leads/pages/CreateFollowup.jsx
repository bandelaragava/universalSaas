import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/context/ToastContext';
import {
  useGetLeadsQuery,
  useGetLeadOptionsQuery,
  useCreateFollowUpMutation,
  useUpdateLeadMutation,
} from '@/modules/leads/services/leadsApi';

export default function CreateFollowup({ onClose, onSuccess }) {
  const toast = useToast();

  const { data: leads = [], isLoading: leadsLoading } = useGetLeadsQuery();
  const { data: leadOptions = {}, isLoading: optionsLoading } = useGetLeadOptionsQuery();
  const [createFollowUp, { isLoading: submitting }] = useCreateFollowUpMutation();
  const [updateLead, { isLoading: updating }] = useUpdateLeadMutation();

  const contactMethodOptions = (leadOptions?.contact_methods || []).filter((item) => item.value || item.label);
  const statusOptions = (leadOptions?.statuses || []).filter((item) => item.value || item.label);

  const [selectedLeadId, setSelectedLeadId] = useState('');
  const [fupType, setFupType] = useState('Call');
  const [fupNotes, setFupNotes] = useState('');
  const [fupNewStatus, setFupNewStatus] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [confirmRevenueAmount, setConfirmRevenueAmount] = useState('');
  const [confirmPaymentStatus, setConfirmPaymentStatus] = useState('Paid');
  const [confirmPaymentReference, setConfirmPaymentReference] = useState('');

  const selectedLead = leads.find((lead) => String(lead.id) === String(selectedLeadId));

  useEffect(() => {
    if (contactMethodOptions.length && !contactMethodOptions.some((opt) => (opt.value || opt.label) === fupType)) {
      setFupType(contactMethodOptions[0].value || contactMethodOptions[0].label);
    }
  }, [contactMethodOptions, fupType]);

  const isAdmissionConfirmedStatus = statusOptions.some((option) => {
    const value = option.value || option.label;
    return value === fupNewStatus && String(option.label || value).toLowerCase() === 'admission confirmed';
  }) || fupNewStatus === 'Admission Confirmed';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLeadId) {
      toast.error('Error', 'Please select a lead.');
      return;
    }
    if (!fupNotes.trim()) {
      toast.error('Error', 'Please enter discussion notes.');
      return;
    }

    try {
      const noteContent = `[${fupType}] ${fupNotes}`;

      await createFollowUp({
        lead_id: Number(selectedLeadId),
        note: noteContent,
        scheduledAt: reminderDate || undefined,
      }).unwrap();

      if (fupNewStatus && selectedLead) {
        const updatePayload = {
          id: selectedLead.id,
          full_name: selectedLead.full_name,
          email: selectedLead.email,
          phone: selectedLead.phone,
          status: fupNewStatus,
          form_id: selectedLead.form_id,
          counselor_id: selectedLead.counselor_id,
        };
        if (isAdmissionConfirmedStatus) {
          updatePayload.revenue_amount = confirmRevenueAmount || selectedLead.revenue_amount || '0';
          updatePayload.payment_status = confirmPaymentStatus || selectedLead.payment_status || 'Paid';
          updatePayload.payment_reference = confirmPaymentReference || selectedLead.payment_reference || '';
        }
        await updateLead(updatePayload).unwrap();
      }

      toast.success('Success', 'Follow-up created successfully.');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      toast.error('Error', err?.data?.detail || 'Could not schedule follow-up.');
    }
  };

  if (leadsLoading || optionsLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-xs">
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-muted-foreground">Select Lead / Contact *</label>
        <select
          value={selectedLeadId}
          onChange={(e) => setSelectedLeadId(e.target.value)}
          className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
          required
        >
          <option value="">Choose a lead...</option>
          {leads.map((lead) => (
            <option key={lead.id} value={lead.id}>
              {lead.full_name} ({lead.email || 'No email'})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Contact Method */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold text-muted-foreground">Contact Method *</label>
          <select
            value={fupType}
            onChange={(e) => setFupType(e.target.value)}
            className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            required
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
          <label className="block text-xs font-bold text-muted-foreground">Update Lead Status (Optional)</label>
          <select
            value={fupNewStatus}
            onChange={(e) => setFupNewStatus(e.target.value)}
            className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
          >
            <option value="">Keep current status</option>
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
        <label className="block text-xs font-bold text-muted-foreground">Discussion Summary Notes *</label>
        <textarea
          placeholder="What was discussed? e.g., Requested prospectus, compared pricing..."
          required
          rows={3}
          value={fupNotes}
          onChange={(e) => setFupNotes(e.target.value)}
          className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs resize-none"
        />
      </div>

      {/* Callback Reminder Schedule */}
      <div className="space-y-1.5">
        <label className="block text-xs font-bold text-muted-foreground">Schedule Next Callback Reminder (Optional)</label>
        <input
          type="datetime-local"
          value={reminderDate}
          onChange={(e) => setReminderDate(e.target.value)}
          className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
        />
      </div>

      {isAdmissionConfirmedStatus && (
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-emerald-200 bg-emerald-50/10 p-4 sm:grid-cols-3 dark:border-emerald-950/30">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground">Revenue Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={confirmRevenueAmount}
              onChange={(e) => setConfirmRevenueAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground">Payment Status</label>
            <select
              value={confirmPaymentStatus}
              onChange={(e) => setConfirmPaymentStatus(e.target.value)}
              className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            >
              <option value="Paid">Paid</option>
              <option value="Partial">Partial</option>
              <option value="Unpaid">Unpaid</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-muted-foreground">Reference</label>
            <input
              value={confirmPaymentReference}
              onChange={(e) => setConfirmPaymentReference(e.target.value)}
              placeholder="Receipt / UPI"
              className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            />
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex items-center justify-end gap-2 pt-3 border-t">
        <Button type="button" variant="outline" onClick={onClose} disabled={submitting || updating}>
          Cancel
        </Button>
        <Button type="submit" disabled={submitting || updating}>
          {submitting || updating ? 'Saving...' : 'Log & Update'}
        </Button>
      </div>
    </form>
  );
}
