import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supportTicketsService, TicketType } from '@/services/supportTickets';
import toast from 'react-hot-toast';

const priorities = ['low', 'medium', 'high', 'urgent'] as const;

interface CreateTicketProps {
  onClose?: () => void;
  onSuccess?: () => void;
}

export default function CreateTicket({ onClose, onSuccess }: CreateTicketProps) {
  const [types, setTypes] = useState<TicketType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ issue_type: '', priority: 'medium', subject: '', description: '' });

  useEffect(() => {
    supportTicketsService.getTypes()
      .then((res) => {
        setTypes(res.data || []);
      })
      .catch(() => {
        toast.error('Could not load ticket categories');
      })
      .finally(() => {
        setLoadingTypes(false);
      });
  }, []);

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    if (!form.issue_type || !form.subject.trim() || !form.description.trim()) {
      toast.error('Issue type, subject, and description are required');
      return;
    }
    try {
      setSubmitting(true);
      await supportTicketsService.raise(form);
      toast.success('Ticket submitted successfully');
      setForm({ issue_type: '', priority: 'medium', subject: '', description: '' });
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { detail?: string } } };
      toast.error(axiosError.response?.data?.detail || 'Could not submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingTypes) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleRaiseTicket} className="space-y-4 text-xs">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="font-semibold text-muted-foreground">Issue Type *</label>
          <select
            value={form.issue_type}
            onChange={(e) => setForm((prev) => ({ ...prev, issue_type: e.target.value }))}
            className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            disabled={submitting}
            required
          >
            <option value="">Select issue category</option>
              {(Array.isArray(types) ? types : []).map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="font-semibold text-muted-foreground">Priority</label>
          <select
            value={form.priority}
            onChange={(e) => setForm((prev) => ({ ...prev, priority: e.target.value }))}
            className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
            disabled={submitting}
          >
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-muted-foreground">Subject *</label>
        <Input
          value={form.subject}
          onChange={(e) => setForm((prev) => ({ ...prev, subject: e.target.value }))}
          placeholder="Brief summary of the problem"
          disabled={submitting}
          required
        />
      </div>

      <div className="space-y-1.5">
        <label className="font-semibold text-muted-foreground">Description *</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          rows={5}
          className="w-full bg-background border border-input text-foreground rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary text-xs"
          placeholder="Provide full details of the issue so we can investigate..."
          disabled={submitting}
          required
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        {onClose && (
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Submitting...' : 'Submit Ticket'}
        </Button>
      </div>
    </form>
  );
}
