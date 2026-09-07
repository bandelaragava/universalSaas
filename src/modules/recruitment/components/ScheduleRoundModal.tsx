import React, { useState } from 'react';
import { X, Calendar } from 'lucide-react';
import { InterviewRoundType } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ScheduleRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  nextRoundNumber: number;
  candidateName: string;
  onSchedule: (data: {
    roundNumber: number;
    roundName: string;
    roundType: InterviewRoundType;
    scheduledAt: string;
    interviewer: string;
  }) => Promise<void>;
}

export const ScheduleRoundModal: React.FC<ScheduleRoundModalProps> = ({
  isOpen,
  onClose,
  nextRoundNumber,
  candidateName,
  onSchedule,
}) => {
  const [loading, setLoading] = useState(false);
  const [roundType, setRoundType] = useState<InterviewRoundType>('TECHNICAL');
  const [roundName, setRoundName] = useState(`Round ${nextRoundNumber} - Technical Interview`);
  const [scheduledAt, setScheduledAt] = useState('');
  const [interviewer, setInterviewer] = useState('');

  if (!isOpen) return null;

  const handleTypeChange = (type: InterviewRoundType) => {
    setRoundType(type);
    let name = `Round ${nextRoundNumber} - ${type.charAt(0) + type.slice(1).toLowerCase()} Interview`;
    if (type === 'SCREENING') name = `Round ${nextRoundNumber} - Initial Screening`;
    if (type === 'FINAL') name = `Round ${nextRoundNumber} - Final Management Round`;
    setRoundName(name);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundName.trim()) return;

    setLoading(true);
    try {
      await onSchedule({
        roundNumber: nextRoundNumber,
        roundName,
        roundType,
        scheduledAt,
        interviewer,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/40">
          <div>
            <h3 className="text-base font-bold text-foreground">Schedule Interview Round</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Applicant: {candidateName}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-medium">Round Number</Label>
            <Input value={`Round ${nextRoundNumber}`} disabled className="mt-1 bg-muted/30" />
          </div>

          <div>
            <Label className="text-xs font-medium">Round Type</Label>
            <select
              value={roundType}
              onChange={(e) => handleTypeChange(e.target.value as InterviewRoundType)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
            >
              <option value="SCREENING">Screening</option>
              <option value="TECHNICAL">Technical Interview</option>
              <option value="HR">HR Interview</option>
              <option value="MANAGERIAL">Managerial</option>
              <option value="FINAL">Final Round</option>
              <option value="CUSTOM">Custom</option>
            </select>
          </div>

          <div>
            <Label htmlFor="roundName" className="text-xs font-medium">Round Name *</Label>
            <Input
              id="roundName"
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="scheduledAt" className="text-xs font-medium">Schedule Date & Time</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="interviewer" className="text-xs font-medium">Interviewer Name / Email</Label>
            <Input
              id="interviewer"
              placeholder="e.g. John Doe (Tech Lead)"
              value={interviewer}
              onChange={(e) => setInterviewer(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
              {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Schedule Round
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
