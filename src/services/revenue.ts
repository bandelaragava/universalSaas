import rolesApi from './rolesApi';

export interface LeadRevenueInfo {
  id: string | number;
  full_name: string;
  email?: string;
  phone?: string;
  course?: string;
  counselor: string;
  payment_status: 'Paid' | 'Partial' | 'Unpaid';
  payment_reference?: string;
  amount: number;
}

export interface RevenueOverviewResponse {
  confirmed_revenue: number;
  pipeline_revenue: number;
  confirmed_count: number;
  pipeline_count: number;
  conversion_rate: number;
  confirmed_leads: LeadRevenueInfo[];
  pipeline_leads: LeadRevenueInfo[];
}

export const revenueService = {
  getRevenueOverview: () => rolesApi.get<RevenueOverviewResponse>('/revenue/overview'),
};

