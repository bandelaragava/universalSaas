import React, { useState } from 'react';
import { X, CheckCircle2, XCircle } from 'lucide-react';
import { InterviewRound, InterviewStatus } from '../types/recruitment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RoundFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  round: InterviewRound | null;
  candidateName: string;
  onSubmit: (roundId: number, data: { status: InterviewStatus; feedback: string; score?: number }) => Promise<void>;
}

export const RoundFeedbackModal: React.FC<RoundFeedbackModalProps> = ({
  isOpen,
  onClose,
  round,
  candidateName,
  onSubmit,
}) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<InterviewStatus>(round?.status || 'PASSED');
  const [score, setScore] = useState<number | undefined>(round?.score);
  const [feedback, setFeedback] = useState(round?.feedback || '');

  if (!isOpen || !round) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(round.id, {
        status,
        score,
        feedback,
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
            <h3 className="text-base font-bold text-foreground">Record Interview Evaluation</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {round.roundName} • Candidate: {candidateName}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded-sm">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <Label className="text-xs font-medium">Evaluation Result *</Label>
            <div className="grid grid-cols-3 gap-2 mt-1.5">
              <button
                type="button"
                onClick={() => setStatus('PASSED')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  status === 'PASSED'
                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Passed
              </button>
              <button
                type="button"
                onClick={() => setStatus('FAILED')}
                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  status === 'FAILED'
                    ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" /> Failed
              </button>
              <button
                type="button"
                onClick={() => setStatus('CANCELLED')}
                className={`flex items-center justify-center py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                  status === 'CANCELLED'
                    ? 'bg-muted border-foreground/30 text-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted/50'
                }`}
              >
                Cancelled
              </button>
            </div>
          </div>

          <div>
            <Label htmlFor="score" className="text-xs font-medium">Score (e.g. 1 to 10)</Label>
            <Input
              id="score"
              type="number"
              min={0}
              max={100}
              step="0.1"
              value={score !== undefined ? score : ''}
              onChange={(e) => setScore(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g. 8.5"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="feedback" className="text-xs font-medium">Interviewer Feedback & Notes</Label>
            <textarea
              id="feedback"
              rows={4}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Strong problem solving skills, deep Spring Boot knowledge. Candidate communicated clearly."
              className="mt-1 w-full rounded-md border border-input bg-background p-2.5 text-sm shadow-xs focus:outline-hidden focus:ring-1 focus:ring-ring"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={loading} className="gap-1.5">
              {loading && <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />}
              Save Feedback
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
