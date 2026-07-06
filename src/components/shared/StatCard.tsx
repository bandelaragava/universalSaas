import React from 'react';
import { Loader2 } from 'lucide-react';

interface StatCardProps {
  title: string;
  value?: string | number | null;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'danger' | 'warning' | 'info' | string;
  loading?: boolean;
  sub?: string;
  onClick?: () => void;
}

const colorMap: Record<string, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary/10', text: 'text-primary' },
  success: { bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  danger: { bg: 'bg-destructive/10', text: 'text-destructive' },
  warning: { bg: 'bg-amber-500/10', text: 'text-amber-500' },
  info: { bg: 'bg-cyan-500/10', text: 'text-cyan-500' },
};

export default function StatCard({
  title,
  value,
  icon,
  color = 'primary',
  loading = false,
  sub,
  onClick,
}: StatCardProps) {
  const colorClasses = colorMap[color] || { bg: 'bg-muted', text: 'text-muted-foreground' };

  return (
    <div
      onClick={onClick}
      className={`rounded-xl border bg-card text-card-foreground shadow-sm p-6 h-full transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-md' : 'cursor-default'
      }`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground tracking-tight">{title}</h3>
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${colorClasses.bg} ${colorClasses.text}`}
        >
          {icon}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : (
            value ?? '-'
          )}
        </h2>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}




