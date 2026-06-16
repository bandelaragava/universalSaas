import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/shared/PageHeader';
import { FormInput, ListTree, ArrowRight } from 'lucide-react';

const crmSettingsCards = [
  {
    id: 'form-builder',
    label: 'Form Builder',
    description: 'Create and manage lead capture forms.',
    path: '/leads/form-builder',
    icon: FormInput,
    color: 'text-primary border-primary/20 bg-primary/5'
  },
  {
    id: 'statuses',
    label: 'Lead Statuses',
    description: 'Manage lead pipeline stages and statuses.',
    path: '/leads/options',
    icon: ListTree,
    color: 'text-primary border-primary/20 bg-primary/5'
  }
];

export default function CrmSettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM Settings"
        description="Configure your CRM pipelines, lead statuses, and capture forms."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {crmSettingsCards.map((card) => {
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
                Configure <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
