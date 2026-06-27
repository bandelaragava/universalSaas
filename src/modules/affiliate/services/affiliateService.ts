import rolesApi from '@/services/rolesApi';
import {
  AffiliateProfile, Referral, ReferralLink, CommissionRecord,
  PayoutTransaction, PerformanceTrend, AffiliateNotification
} from '../types';

const USE_API = true;

const mockUser: AffiliateProfile = {
  id: 'usr_982347',
  name: 'Sarah Jenkins',
  email: 'sarah.jenkins@affiliate.io',
  avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
  phone: '+1 (555) 019-2834',
  address: '456 Innovation Way, San Francisco, CA',
  upiId: 'sarah@upi',
  bankDetails: {
    holderName: 'Sarah Jenkins',
    bankName: 'Silicon Valley Bank',
    accountNumber: '*********8934',
    payoutMethod: 'ACH/Direct Deposit',
  },
  earnings: {
    total: 24890.50,
    pending: 1850.00,
    paid: 23039.75,
    thisMonth: 4120.00,
  }
};

const mockReferrals: Referral[] = [
  {
    id: 'REF-1001',
    name: 'Acme Corporation',
    email: 'billing@acme.com',
    plan: 'Enterprise Pro',
    status: 'converted',
    joinedDate: '2026-05-10T14:30:00Z',
    commission: 299.00,
    totalSpent: 1495.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1516841273335-e39b37888115?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1002',
    name: 'SaaSify Labs',
    email: 'hello@saasify.io',
    plan: 'Growth Annual',
    status: 'converted',
    joinedDate: '2026-05-02T10:15:00Z',
    commission: 149.00,
    totalSpent: 990.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1003',
    name: 'GrowthHack Agency',
    email: 'info@growthhack.agency',
    plan: 'Scale Monthly',
    status: 'pending',
    joinedDate: '2026-05-20T18:40:00Z',
    commission: 0.00,
    totalSpent: 0.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1004',
    name: 'Pixel Perfect Design',
    email: 'contact@pixelperfect.design',
    plan: 'Starter Monthly',
    status: 'cancelled',
    joinedDate: '2026-02-12T08:00:00Z',
    commission: 0.00,
    totalSpent: 150.00,
    tier: 'Tier 2 (10%)',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80',
  },
  {
    id: 'REF-1005',
    name: 'DevFlow Systems',
    email: 'operations@devflow.net',
    plan: 'Enterprise Pro',
    status: 'converted',
    joinedDate: '2026-04-22T11:00:00Z',
    commission: 299.00,
    totalSpent: 897.00,
    tier: 'Tier 1 (20%)',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80',
  }
];

const mockTransactions: PayoutTransaction[] = [
  {
    id: 'tx_98124',
    amount: 1450.00,
    status: 'paid',
    date: '2026-05-01T08:00:00Z',
    method: 'ACH/Direct Deposit',
    invoiceNumber: 'INV-2026-004',
    description: 'Affiliate Commission Payout - April 2026',
  },
  {
    id: 'tx_97241',
    amount: 1800.75,
    status: 'paid',
    date: '2026-04-01T08:00:00Z',
    method: 'ACH/Direct Deposit',
    invoiceNumber: 'INV-2026-003',
    description: 'Affiliate Commission Payout - March 2026',
  },
  {
    id: 'tx_96391',
    amount: 920.00,
    status: 'paid',
    date: '2026-03-01T08:00:00Z',
    method: 'PayPal',
    invoiceNumber: 'INV-2026-002',
    description: 'Affiliate Commission Payout - February 2026',
  },
  {
    id: 'tx_95101',
    amount: 1200.50,
    status: 'failed',
    date: '2026-02-01T08:00:00Z',
    method: 'Wire Transfer',
    invoiceNumber: 'INV-2026-001',
    description: 'Affiliate Commission Payout - January 2026',
  }
];

const mockNotifications: AffiliateNotification[] = [
  {
    id: 'notif_001',
    title: 'New Referral Signed Up!',
    message: 'Acme Corporation registered using your link and upgraded to Enterprise Pro.',
    type: 'success',
    read: false,
    date: '2026-05-23T16:45:00Z'
  },
  {
    id: 'notif_002',
    title: 'Payout Disbursed Successfully',
    message: 'Your commission payout of $1,450.00 has been deposited to Silicon Valley Bank.',
    type: 'info',
    read: false,
    date: '2026-05-01T10:00:00Z'
  },
  {
    id: 'notif_003',
    title: 'Performance Threshold Achieved',
    message: 'Congratulations! You achieved the Platinum Elite Tier and now earn 20% commission.',
    type: 'success',
    read: true,
    date: '2026-04-15T12:00:00Z'
  },
  {
    id: 'notif_004',
    title: 'Update Bank Details',
    message: 'We noticed your tax documents are expiring soon. Please upload your W-8BEN form.',
    type: 'warning',
    read: true,
    date: '2026-04-10T09:30:00Z'
  }
];

const mockReferralLinks: ReferralLink[] = [
  {
    id: 'link_001',
    name: 'Main Homepage Landing Page',
    url: 'https://saasplatform.com/?ref=SARAH50X',
    clicks: 14202,
    signups: 345,
    conversions: 89,
    conversionRate: '6.27%',
    earnings: 12450.00,
    status: 'active',
  },
  {
    id: 'link_002',
    name: 'Pricing Page Special Discount',
    url: 'https://saasplatform.com/pricing?ref=SARAH50X&discount=15off',
    clicks: 8904,
    signups: 210,
    conversions: 54,
    conversionRate: '6.07%',
    earnings: 7920.50,
    status: 'active',
  },
  {
    id: 'link_003',
    name: 'Developer Sandbox Promotion',
    url: 'https://saasplatform.com/devs?ref=SARAH50X',
    clicks: 3491,
    signups: 54,
    conversions: 18,
    conversionRate: '5.15%',
    earnings: 4520.00,
    status: 'active',
  }
];

const mockTrends: PerformanceTrend[] = [
  { month: 'Jan', clicks: 2400, commission: 1200 },
  { month: 'Feb', clicks: 3500, commission: 2100 },
  { month: 'Mar', clicks: 3100, commission: 1800 },
  { month: 'Apr', clicks: 4800, commission: 3400 },
  { month: 'May', clicks: 5900, commission: 4120 },
  { month: 'Jun', clicks: 7200, commission: 5890 }
];

const unwrap = <T>(promise: Promise<{ data: T }>): Promise<T> =>
  promise
    .then((response) => response.data)
    .catch((error) => {
      const message =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'An unexpected error occurred';
      throw new Error(message);
    });

const getCurrentLapProfile = (): AffiliateProfile => {
  const userId = localStorage.getItem('user_id') || 'lap-user';
  const name = localStorage.getItem('name') || 'LAP User';
  const referralSeed = String(userId || name).replace(/[^a-z0-9]/gi, '').slice(-6).toUpperCase() || 'USER01';

  return {
    ...mockUser,
    id: userId,
    name,
    email: localStorage.getItem('email') || `${String(name).toLowerCase().replace(/\s+/g, '.')}@lap.local`,
    referralCode: `LAP${referralSeed}`,
    avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff`,
    bankDetails: {
      ...mockUser.bankDetails!,
      holderName: name,
    },
  };
};

interface RawProfile {
  id?: string;
  user_id?: string;
  full_name?: string;
  name?: string;
  email?: string;
  profile_image_url?: string;
  avatar?: string;
  phone?: string;
  address?: string;
  upi_id?: string;
  upiId?: string;
  total_earnings?: number;
  pending_earnings?: number;
  paid_earnings?: number;
  unpaid_earnings?: number;
  this_month_earnings?: number;
  earnings?: {
    total?: number;
    pending?: number;
    paid?: number;
    unpaid?: number;
    thisMonth?: number;
  };
  bank_name?: string;
  account_number?: string;
  payout_method?: string;
  bankDetails?: {
    holderName?: string;
    bankName?: string;
    accountNumber?: string;
    payoutMethod?: string;
  };
}

interface RawReferral {
  id?: string;
  customer_name?: string;
  name?: string;
  customer_email?: string;
  email?: string;
  plan?: string;
  status?: Referral['status'];
  referred_at?: string;
  joinedDate?: string;
  commission?: number;
  purchase_amount?: number;
  totalSpent?: number;
  tier?: string;
  avatar?: string;
}

interface RawPayment {
  id?: string;
  amount?: number;
  status?: string;
  paid_at?: string;
  date?: string;
  payment_method?: string;
  method?: string;
  transaction_id?: string;
  invoiceNumber?: string;
  description?: string;
}

interface RawDashboardStats {
  total_earnings?: number;
  pending_earnings?: number;
  paid_earnings?: number;
  this_month_earnings?: number;
  conversion_rate?: number;
  total_clicks?: number;
  total_referrals?: number;
  active_campaigns?: number;
}

interface RawCommission {
  id: string;
  referral_id?: string;
  referral?: string;
  amount?: number;
  created_at?: string;
  status?: string;
}

interface RawPerformanceTrend {
  month: string;
  earnings?: number;
  commission?: number;
  clicks?: number;
}

interface RawNotification {
  id: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  is_read?: boolean;
  date?: string;
  created_at?: string;
}

const mapProfile = (data: RawProfile): AffiliateProfile => ({
  id: data.id || data.user_id || 'usr_982347',
  name: data.full_name || data.name || '',
  email: data.email || '',
  avatar: data.profile_image_url || data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'U')}&background=7c3aed&color=fff`,
  phone: data.phone || '',
  address: data.address || '',
  upiId: data.upi_id || data.upiId || '',
  earnings: {
    total: data.total_earnings || data.earnings?.total || 0,
    pending: data.pending_earnings || data.earnings?.pending || 0,
    paid: data.paid_earnings || data.earnings?.paid || data.earnings?.unpaid || 0,
    thisMonth: data.this_month_earnings || data.earnings?.thisMonth || 0,
  },
  bankDetails: {
    holderName: data.full_name || data.bankDetails?.holderName || data.name || '',
    bankName: data.bank_name || data.bankDetails?.bankName || '',
    accountNumber: data.account_number || data.bankDetails?.accountNumber || '',
    payoutMethod: data.payout_method || data.bankDetails?.payoutMethod || 'ACH/Direct Deposit',
  },
});

const mapReferral = (ref: RawReferral): Referral => ({
  id: ref.id || `REF-${Math.floor(Math.random() * 10000)}`,
  name: ref.customer_name || ref.name || 'Anonymous Client',
  email: ref.customer_email || ref.email || '',
  plan: ref.plan || (ref.purchase_amount && ref.purchase_amount > 200 ? 'Enterprise Pro' : ref.purchase_amount && ref.purchase_amount > 100 ? 'Growth Annual' : 'Starter Monthly'),
  status: ref.status || 'pending',
  joinedDate: ref.referred_at || ref.joinedDate || new Date().toISOString(),
  commission: ref.commission || (ref.status === 'converted' && ref.purchase_amount ? ref.purchase_amount * 0.2 : 0),
  totalSpent: ref.purchase_amount || ref.totalSpent || 0,
  tier: ref.tier || 'Tier 1 (20%)',
  avatar: ref.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(ref.customer_name || ref.name || 'U')}&background=0D8ABC&color=fff`,
});

const mapPayment = (p: RawPayment): PayoutTransaction => ({
  id: p.id || `pay_${Math.floor(Math.random() * 100000)}`,
  amount: p.amount || 0,
  status: p.status === 'completed' || p.status === 'paid' ? 'paid' : p.status === 'failed' ? 'failed' : 'pending',
  date: p.paid_at || p.date || new Date().toISOString(),
  method: p.payment_method || p.method || 'ACH/Direct Deposit',
  invoiceNumber: p.transaction_id || p.invoiceNumber || `INV-${String(p.id || '').substring(0, 8)}`,
  description: p.description || `Affiliate Commission Payout - Transaction ${p.transaction_id || ''}`,
});

export const affiliateService = {
  getCurrentUser: async (): Promise<AffiliateProfile> => {
    if (!USE_API) {
      const currentUser = getCurrentLapProfile();
      localStorage.setItem('affiliate_ref_code', currentUser.referralCode || '');
      return currentUser;
    }
    try {
      const data = await unwrap<RawProfile>(rolesApi.get('/affiliate/profile/'));
      return mapProfile(data);
    } catch (error) {
      throw error;
    }
  },

  updateProfile: async (profileData: Partial<AffiliateProfile> & { bankName?: string, accountNumber?: string, payoutMethod?: string }): Promise<AffiliateProfile> => {
    const payload = {
      phone: profileData.phone,
      address: profileData.address,
      bank_name: profileData.bankDetails?.bankName || profileData.bankName,
      account_number: profileData.bankDetails?.accountNumber || profileData.accountNumber,
      payout_method: profileData.bankDetails?.payoutMethod || profileData.payoutMethod,
      upi_id: profileData.upiId,
      profile_image_url: profileData.avatar,
    };
    if (!USE_API) {
      const currentUser = getCurrentLapProfile();
      const updated = {
        ...currentUser,
        phone: profileData.phone ?? currentUser.phone,
        address: profileData.address ?? currentUser.address,
        upiId: profileData.upiId ?? currentUser.upiId,
        avatar: profileData.avatar ?? currentUser.avatar,
        bankDetails: {
          ...currentUser.bankDetails!,
          bankName: profileData.bankDetails?.bankName || profileData.bankName || currentUser.bankDetails!.bankName,
          accountNumber: profileData.bankDetails?.accountNumber || profileData.accountNumber || currentUser.bankDetails!.accountNumber,
          payoutMethod: profileData.bankDetails?.payoutMethod || profileData.payoutMethod || currentUser.bankDetails!.payoutMethod,
        }
      };
      return updated;
    }
    const data = await unwrap<RawProfile>(rolesApi.put('/affiliate/profile/', payload));
    return mapProfile(data);
  },

  getReferrals: async (): Promise<Referral[]> => {
    if (!USE_API) return mockReferrals;
    try {
      const data = await unwrap<RawReferral[]>(rolesApi.get('/affiliate/referrals/'));
      return data.map(mapReferral);
    } catch (error) {
      throw error;
    }
  },

  getReferralById: async (id: string): Promise<Referral> => {
    if (!USE_API) return mockReferrals.find((ref) => ref.id === id) || mockReferrals[0];
    try {
      const data = await unwrap<RawReferral>(rolesApi.get(`/affiliate/referrals/${id}/`));
      return mapReferral(data);
    } catch (error) {
      throw error;
    }
  },

  getReferralLinks: async (): Promise<ReferralLink[]> => {
    const stored = localStorage.getItem('referral_links');
    if (stored) return JSON.parse(stored);
    return [];
  },

  createReferralLink: async (name: string): Promise<ReferralLink> => {
    if (!name) throw new Error('Link name is required');
    const refCode = localStorage.getItem('affiliate_ref_code') || '';
    const newLink: ReferralLink = {
      id: `link_${Math.random().toString(36).slice(2, 7)}`,
      name,
      url: `https://saasplatform.com/?ref=${refCode}&campaign=${encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'))}`,
      clicks: 0,
      signups: 0,
      conversions: 0,
      conversionRate: '0.00%',
      earnings: 0,
      status: 'active',
    };
    const stored = localStorage.getItem('referral_links');
    const links = stored ? JSON.parse(stored) : [];
    links.push(newLink);
    localStorage.setItem('referral_links', JSON.stringify(links));
    return newLink;
  },

  getEarningsSummary: async () => {
    if (!USE_API) {
      return {
        total: 0,
        pending: 0,
        paid: 0,
        thisMonth: 0,
        conversionRate: 0,
        totalClicks: 0,
        totalReferrals: 0,
        activeCampaigns: 0,
      };
    }
    try {
      const data = await unwrap<RawDashboardStats>(rolesApi.get('/affiliate/analytics/dashboard-stats/'));
      return {
        total: data.total_earnings || 0,
        pending: data.pending_earnings || 0,
        paid: data.paid_earnings || 0,
        thisMonth: data.this_month_earnings || 0,
        conversionRate: data.conversion_rate || 0,
        totalClicks: data.total_clicks || 0,
        totalReferrals: data.total_referrals || 0,
        activeCampaigns: data.active_campaigns || 0,
      };
    } catch (error) {
      throw error;
    }
  },

  getCommissionHistory: async (): Promise<CommissionRecord[]> => {
    const fallbackCommissions = (): CommissionRecord[] => [];

    if (!USE_API) return fallbackCommissions();
    try {
      const [commissions, referrals] = await Promise.all([
        unwrap<RawCommission[]>(rolesApi.get('/affiliate/commissions/')),
        unwrap<RawReferral[]>(rolesApi.get('/affiliate/referrals/')),
      ]);
      const referralsMap = referrals.reduce((acc, ref) => {
        if (ref.id) {
          acc[ref.id] = ref;
        }
        return acc;
      }, {} as Record<string, RawReferral>);
      return commissions.map((comm: RawCommission) => {
        const referral = referralsMap[comm.referral_id || comm.referral || ''] || {};
        return {
          id: comm.id,
          referrer: referral.customer_name || referral.name || 'Anonymous Customer',
          type: referral.purchase_amount ? `Sale (${referral.purchase_amount})` : 'Subscription',
          rate: '20%',
          amount: comm.amount || 0,
          date: comm.created_at || new Date().toISOString(),
          status: (comm.status === 'paid' || comm.status === 'failed' ? comm.status : 'pending') as CommissionRecord['status'],
        };
      });
    } catch (error) {
      throw error;
    }
  },

  getPaymentHistory: async (): Promise<PayoutTransaction[]> => {
    if (!USE_API) return mockTransactions;
    try {
      const data = await unwrap<RawPayment[]>(rolesApi.get('/affiliate/payments/'));
      return data ? data.map(mapPayment) : [];
    } catch (error) {
      throw error;
    }
  },

  getTransactionDetails: async (id: string): Promise<PayoutTransaction> => {
    if (!USE_API) return mockTransactions.find((tx) => tx.id === id) || mockTransactions[0];
    try {
      const data = await unwrap<RawPayment[]>(rolesApi.get('/affiliate/payments/'));
      const payment = data?.find((p) => p.id === id);
      if (!payment) throw new Error('Transaction not found');
      return mapPayment(payment);
    } catch (error) {
      throw error;
    }
  },

  requestPayout: async (amount: number): Promise<PayoutTransaction> => {
    if (!USE_API) {
      const newTx: PayoutTransaction = {
        id: `pay_${Date.now()}`,
        amount,
        status: 'pending',
        date: new Date().toISOString(),
        method: 'ACH/Direct Deposit',
        invoiceNumber: `REQ-${Date.now()}`,
        description: 'Affiliate Payout Request',
      };
      return newTx;
    }
    const data = await unwrap<RawPayment>(rolesApi.post('/affiliate/payments/', { amount }));
    return mapPayment(data);
  },

  getPerformanceTrends: async (): Promise<PerformanceTrend[]> => {
    if (!USE_API) return mockTrends;
    try {
      const data = await unwrap<RawPerformanceTrend[]>(rolesApi.get('/affiliate/analytics/earnings-performance/'));
      return data.map((item) => ({
        month: item.month,
        commission: item.earnings || item.commission || 0,
        clicks: item.clicks || 0,
      }));
    } catch (error) {
      throw error;
    }
  },

  getNotifications: async (): Promise<AffiliateNotification[]> => {
    if (!USE_API) return mockNotifications;
    try {
      const data = await unwrap<RawNotification[]>(rolesApi.get('/affiliate/notifications/'));
      return data.map((n: RawNotification) => ({
        id: n.id,
        title: n.title || (n.type ? `${n.type.charAt(0).toUpperCase()}${n.type.slice(1)} Alert` : 'System Notification'),
        message: n.message || '',
        type: (n.type === 'commission' || n.type === 'referral' ? 'success' : n.type === 'payment' ? 'info' : n.type || 'warning') as AffiliateNotification['type'],
        read: n.read ?? n.is_read ?? false,
        date: n.date || n.created_at || new Date().toISOString(),
      }));
    } catch (error) {
      throw error;
    }
  },

  markAsRead: async (id: string): Promise<unknown> => {
    if (!USE_API) return { id };
    try {
      return await unwrap<unknown>(rolesApi.put(`/affiliate/notifications/${id}/read/`));
    } catch (error) {
      throw error;
    }
  },

  markAllAsRead: async (): Promise<unknown> => {
    if (!USE_API) return { ok: true };
    try {
      return await unwrap<unknown>(rolesApi.put('/affiliate/notifications/read-all/'));
    } catch (error) {
      throw error;
    }
  }
};

