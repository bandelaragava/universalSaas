import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, Users, WalletCards } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { revenueService, LeadRevenueInfo } from '@/services/revenue';

export function RevenuePage() {
  const [metrics, setMetrics] = useState({
    confirmedRevenue: 0,
    pipelineRevenue: 0,
    confirmedCount: 0,
    pipelineCount: 0,
    conversionRate: 0,
    confirmedLeads: [] as LeadRevenueInfo[],
    pipelineLeads: [] as LeadRevenueInfo[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    revenueService.getRevenueOverview()
      .then((res) => {
        setMetrics({
          confirmedRevenue: res.data?.confirmed_revenue || 0,
          pipelineRevenue: res.data?.pipeline_revenue || 0,
          confirmedCount: res.data?.confirmed_count || 0,
          pipelineCount: res.data?.pipeline_count || 0,
          conversionRate: res.data?.conversion_rate || 0,
          confirmedLeads: res.data?.confirmed_leads || [],
          pipelineLeads: res.data?.pipeline_leads || [],
        });
      })
      .catch((err) => {
        console.error('Failed to fetch revenue overview:', err);
        setError('Failed to load revenue overview details.');
        setMetrics({
          confirmedRevenue: 0,
          pipelineRevenue: 0,
          confirmedCount: 0,
          pipelineCount: 0,
          conversionRate: 0,
          confirmedLeads: [],
          pipelineLeads: [],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const formatMoney = (value: number) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

  const cards = [
    {
      label: 'Confirmed Revenue',
      value: metrics.confirmedRevenue,
      icon: DollarSign,
      tone: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100/40 dark:bg-emerald-950/40',
      isCurrency: true,
    },
    {
      label: 'Pipeline Revenue',
      value: metrics.pipelineRevenue,
      icon: WalletCards,
      tone: 'text-indigo-600 dark:text-indigo-400 bg-indigo-100/40 dark:bg-indigo-950/40',
      isCurrency: true,
    },
    {
      label: 'Confirmed Leads',
      value: metrics.confirmedCount,
      icon: Users,
      tone: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100/40 dark:bg-cyan-950/40',
      isCurrency: false,
    },
    {
      label: 'Conversion Rate',
      value: `${metrics.conversionRate}%`,
      icon: TrendingUp,
      tone: 'text-amber-600 dark:text-amber-400 bg-amber-100/40 dark:bg-amber-950/40',
      isCurrency: false,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Revenue Overview"
        description="Revenue updates from leads after counselor/admin confirmation."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{card.label}</p>
                  <p className="text-2xl font-bold tracking-tight text-foreground">
                    {loading ? '...' : card.isCurrency ? formatMoney(card.value as number) : card.value}
                  </p>
                </div>
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.tone}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold">Confirmed Admissions Revenue</CardTitle>
            <p className="text-xs text-muted-foreground">
              Leads marked Admission Confirmed appear here with counselor and amount.
            </p>
          </div>
          <Badge variant="success" className="w-fit">
            {metrics.confirmedCount} confirmed
          </Badge>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="py-8 text-center text-sm font-medium text-destructive">{error}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Student</TableHead>
                  <TableHead className="font-semibold">Course</TableHead>
                  <TableHead className="font-semibold">Counselor</TableHead>
                  <TableHead className="font-semibold">Payment</TableHead>
                  <TableHead className="text-right font-semibold">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm font-semibold text-muted-foreground">
                      Loading revenue details...
                    </TableCell>
                  </TableRow>
                ) : metrics.confirmedLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-sm font-semibold text-muted-foreground">
                      No confirmed admissions yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  metrics.confirmedLeads.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell>
                        <div className="font-bold text-foreground">{lead.full_name}</div>
                        <div className="text-xs text-muted-foreground">{lead.email || lead.phone || 'No contact'}</div>
                      </TableCell>
                      <TableCell className="font-medium text-muted-foreground">{lead.course || 'Not set'}</TableCell>
                      <TableCell className="font-medium text-muted-foreground">{lead.counselor}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lead.payment_status === 'Paid'
                              ? 'success'
                              : lead.payment_status === 'Partial'
                              ? 'warning'
                              : 'outline'
                          }
                        >
                          {lead.payment_status || 'Unpaid'}
                        </Badge>
                        {lead.payment_reference && (
                          <div className="mt-1 text-[10px] text-muted-foreground">{lead.payment_reference}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-bold text-foreground">
                        {formatMoney(lead.amount)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="text-sm font-bold text-foreground mb-2">Process Flow</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Admin creates or receives a lead, assigns it to a counselor, counselor logs follow ups,
            and when the status becomes Admission Confirmed it is included in confirmed revenue.
            Amount is read from fields named Revenue, Fee, Course Fee, Admission Fee, Paid Amount, Total Fee, Payment Amount, or Amount.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}




