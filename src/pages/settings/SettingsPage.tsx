import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { Landmark, Fingerprint, FileText, Award, Workflow, Grid, ArrowRight, Blocks, Users } from 'lucide-react';

const settingsCards = [
  {
    id: 'company',
    label: 'Company Profile',
    description: 'Manage branding materials, seal specimen, official signatures, and locale settings.',
    path: '/settings/company',
    icon: Landmark,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'employee-types',
    label: 'Employee Types',
    description: 'Manage employee types (e.g., Regular, Contractor).',
    path: '/settings/employee-types',
    icon: Grid,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'designations',
    label: 'Designations',
    description: 'Manage job titles and designations.',
    path: '/settings/designations',
    icon: Award,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'work-modes',
    label: 'Work Modes',
    description: 'Manage work arrangements (e.g., Office, Remote).',
    path: '/settings/work-modes',
    icon: Workflow,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'idformat',
    label: 'ID Format Settings',
    description: 'Customize auto-numbering formula prefixes, padding, and date tags.',
    path: '/settings/id-generation',
    icon: Fingerprint,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'templates',
    label: 'Document Templates',
    description: 'Design HTML structures and layouts for joining packages, contracts, and letters.',
    path: '/settings/templates',
    icon: FileText,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'certificates',
    label: 'Certificate Records',
    description: 'Issue experience letters, generate verification tokens, and review active credentials.',
    path: '/settings/certificates',
    icon: Award,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'crm',
    label: 'CRM Settings',
    description: 'Configure lead statuses, pipelines, and lead capture forms.',
    path: '/settings/crm',
    icon: Users,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'Manage third-party connections, webhooks, and external APIs.',
    path: '/integrations',
    icon: Blocks,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'invoice-configurations',
    label: 'Invoice Configurations',
    description: 'Create and manage custom invoice templates and billing formats.',
    path: '/settings/invoice-configurations',
    icon: FileText,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
];

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Universal Settings"
        description="Configure organization details, identity structures, document automation, and onboarding flows."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => navigate(card.path)}
              className="group relative bg-card border border-border hover:border-border/80 p-5 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className={`inline-flex p-3 rounded-lg border ${card.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {card.label}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground mt-5 pt-3 border-t border-border transition-colors">
                Configure settings <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}