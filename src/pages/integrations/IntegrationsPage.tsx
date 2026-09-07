/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useEffect, useCallback } from 'react';

import {

  Calendar, Video, CreditCard, Target, MessageSquare,

  Zap, Webhook, Key, ArrowRight, Copy, Plus, RefreshCw,

  Sliders, Settings, Trash2, Lock, Eye, EyeOff, Sparkles,

  ExternalLink, Info, Loader2

} from 'lucide-react';

import { useToast } from '@/context/ToastContext';

import { Button } from '@/components/ui/button';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';

import { Input } from '@/components/ui/input';

import { Switch } from '@/components/ui/switch';

import api from '@/services/rolesApi';

const BACKEND_BASE_URL = import.meta.env.VITE_ROLES_API_BASE || import.meta.env.VITE_API_BASE || import.meta.env.VITE_API_BASE_URL || '';



// --- Types --------------------------------------------------------------------



interface IntegrationStatus {

  google: boolean;

  zoom: boolean;

  cashfree: boolean;

  meta: boolean;

  whatsapp: boolean;

  zapier: boolean;

  webhooks: boolean;

  apikey: boolean;

}



interface WebhookItem {

  id: string;

  url: string;

  events: string[];

  active: boolean;

}



interface ZoomMeeting {

  id: string;

  topic: string;

  time: string;

  duration: number;

  join_url?: string;

}



interface WhatsAppTemplate {

  id: string;

  name: string;

  category: string;

  status: 'Approved' | 'Pending' | 'Rejected';

}



interface CashfreeTransaction {

  id: string;

  customer: string;

  amount: number;

  status: string;

  paymentLink?: string;

}



// --- Helper: derive connected status from any shape --------------------------



function parseConnected(item: any): boolean {

  if (!item) return false;

  const v = item.connected ?? item.isConnected ?? item.is_connected ?? item.status ?? item.active ?? item.enabled;

  if (typeof v === 'string') return ['connected', 'active', 'enabled', 'true', 'configured'].includes(v.toLowerCase());

  return Boolean(v);

}



// --- Sub-component: Status indicator -----------------------------------------



function StatusBadge({ connected, label }: { connected: boolean; label?: string }) {

  return (

    <Badge

      variant="outline"

      className={connected

        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'

        : 'bg-muted text-muted-foreground border-border hover:bg-muted dark:bg-foreground/90 text-background dark:text-muted-foreground/70'

      }

    >

      {label ?? (connected ? 'Connected' : 'Disconnected')}

    </Badge>

  );

}



// --- Sub-component: Modal wrapper --------------------------------------------



function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {

  return (

    <div

      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"

      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}

    >

      <div className="bg-card border dark:border-border rounded-2xl w-full max-w-md shadow-2xl p-6 relative my-8 max-h-[90vh] overflow-y-auto">

        {children}

      </div>

    </div>

  );

}



// --- Main Component -----------------------------------------------------------



export function IntegrationsPage() {

  const { success, error: toastError, info } = useToast();



  // -- Global loading / error --------------------------------------------------

  const [statusLoading, setStatusLoading] = useState(true);

  const [backendAvailable, setBackendAvailable] = useState(false);



  // -- Integration statuses (server-sourced only) ------------------------------

  const [status, setStatus] = useState<IntegrationStatus>({

    google: false, zoom: false, cashfree: false, meta: false,

    whatsapp: false, zapier: false, webhooks: false, apikey: false,

  });



  // -- Per-card data ------------------------------------------------------------

  const [googleEmail, setGoogleEmail] = useState('');

  const [cashfreeAppId, setCashfreeAppId] = useState('');

  const [cashfreeTestMode, setCashfreeTestMode] = useState(false);

  const [cashfreeReturnUrl, setCashfreeReturnUrl] = useState('');

  const [cashfreeNotifyUrl, setCashfreeNotifyUrl] = useState('');

  const [metaPixelId, setMetaPixelId] = useState('');

  const [apiKey, setApiKey] = useState('');

  const [showKey, setShowKey] = useState(false);

  const [zapierWebhookUrl, setZapierWebhookUrl] = useState('');



  // -- List data ----------------------------------------------------------------

  const [webhooks, setWebhooks] = useState<WebhookItem[]>([]);

  const [zoomMeetings, setZoomMeetings] = useState<ZoomMeeting[]>([]);

  const [whatsappTemplates, setWhatsappTemplates] = useState<WhatsAppTemplate[]>([]);

  const [cashfreeTransactions, setCashfreeTransactions] = useState<CashfreeTransaction[]>([]);



  // -- Modal --------------------------------------------------------------------

  const [activeModal, setActiveModal] = useState<string | null>(null);

  const closeModal = () => setActiveModal(null);



  // -- Form states --------------------------------------------------------------

  const [googleClientId, setGoogleClientId] = useState('');

  const [googleClientSecret, setGoogleClientSecret] = useState('');



  // Zoom integration – no accountId needed for configure flow

  const [zoomClientId, setZoomClientId] = useState('');

  const [zoomClientSecret, setZoomClientSecret] = useState('');







  const [cashfreeSecret, setCashfreeSecret] = useState('');



  const [newEvent, setNewEvent] = useState({

    title: '',

    start: '',

    description: '',

    guest: ''

  });



  const [newMeeting, setNewMeeting] = useState({

    topic: '',

    time: '',

    duration: 45

  });



  const [newWebhook, setNewWebhook] = useState({

    url: '',

    events: [] as string[]

  });



  const [newTemplate, setNewTemplate] = useState({

    name: '',

    category: 'Utility',

    body: ''

  });



  const [newOrder, setNewOrder] = useState({

    orderId: '',

    amount: 1999,

    currency: 'INR',

    customerName: '',

    customerEmail: '',

    customerPhone: '',

    referenceId: ''

  });



  // -- Loading flags for async actions -----------------------------------------

  const [busy, setBusy] = useState<Record<string, boolean>>({});

  const setBusyKey = (key: string, val: boolean) => setBusy(p => ({ ...p, [key]: val }));



  // ------------------------------------------------------------------------------

  // Fetch all integration statuses + linked data from backend

  // ------------------------------------------------------------------------------

  const fetchStatus = useCallback(async () => {

    setStatusLoading(true);

    try {

      const res = await api.get('/integrations');

      const raw = res.data?.data ?? res.data;

      setBackendAvailable(true);



      // Normalise to array

      let arr: any[] = Array.isArray(raw) ? raw : [];

      if (!Array.isArray(raw) && raw && typeof raw === 'object') {

        if (Array.isArray(raw.integrations)) arr = raw.integrations;

        else {

          Object.entries(raw).forEach(([k, v]) => {

            if (v && typeof v === 'object') arr.push({ ...(v as any), _key: k });

          });

        }

      }



      const find = (code: string) =>

        arr.find(c => (c.code ?? c.name ?? c.provider ?? c.type ?? c._key ?? '')

          .toString().toLowerCase().includes(code));



      const g = find('google'); const z = find('zoom'); const cf = find('cashfree');

      const m = find('meta'); const wa = find('whatsapp'); const zap = find('zapier');

      const wh = find('webhook'); const ak = find('apikey') ?? find('api_key');



      setStatus({

        google: parseConnected(g),

        zoom: parseConnected(z),

        cashfree: parseConnected(cf),

        meta: parseConnected(m),

        whatsapp: parseConnected(wa),

        zapier: zap?.connected ?? zap?.active ?? false,

        webhooks: parseConnected(wh),

        apikey: parseConnected(ak),

      });



      // Pull extra fields if backend embeds them

      if (g?.email) setGoogleEmail(g.email);

      if (cf?.appId) setCashfreeAppId(cf.appId);

      if (cf?.testMode != null) setCashfreeTestMode(Boolean(cf.testMode));

      if (cf?.returnUrl) setCashfreeReturnUrl(cf.returnUrl);

      if (cf?.notifyUrl) setCashfreeNotifyUrl(cf.notifyUrl);

      if (m?.pixelId) setMetaPixelId(m.pixelId);

      if (ak?.key) setApiKey(ak.key);

      if (zap?.webhookUrl) setZapierWebhookUrl(zap.webhookUrl);

    } catch {

      setBackendAvailable(false);

    } finally {

      setStatusLoading(false);

    }

  }, []);



  // Lazy list fetchers - called only when the relevant modal opens, never on mount.

  // This avoids 404s for endpoints that may not exist yet and CORS preflight

  // errors for cross-origin requests that the browser blocks before the user

  // has even opened that section.



  const fetchZoomMeetings = useCallback(async () => {

    setBusyKey('list_zoom', true);

    try {

      const { data } = await api.get('/integrations/zoom/meetings');

      setZoomMeetings(data?.meetings ?? (Array.isArray(data) ? data : []));

    } catch {

      // Endpoint missing or CORS - leave list empty; user will see "No meetings yet"

    } finally {

      setBusyKey('list_zoom', false);

    }

  }, []);



  const fetchCashfreeTxs = useCallback(async () => {

    setBusyKey('list_cf', true);

    try {

      const { data } = await api.get('/integrations/cashfree/orders');

      setCashfreeTransactions(data?.orders ?? (Array.isArray(data) ? data : []));

    } catch {

      // 404 - leave list empty

    } finally {

      setBusyKey('list_cf', false);

    }

  }, []);



  const fetchWhatsAppTemplates = useCallback(async () => {

    setBusyKey('list_wa', true);

    try {

      const { data } = await api.get('/integrations/whatsapp/templates');

      setWhatsappTemplates(data?.templates ?? (Array.isArray(data) ? data : []));

    } catch {

      // 404 - leave list empty

    } finally {

      setBusyKey('list_wa', false);

    }

  }, []);



  const fetchWebhooks = useCallback(async () => {
    setBusyKey('list_wh', true);
    try {
      const { data } = await api.get('/integrations/webhooks');
      const whList = data?.webhooks ?? (Array.isArray(data) ? data : []);
      const mapped = whList.map((wh: any) => ({
        id: String(wh.id),
        url: wh.webhookUrl || '',
        events: wh.events || [],
        active: wh.enabled ?? true
      }));
      setWebhooks(mapped);
    } catch {
      // Leave list empty
    } finally {
      setBusyKey('list_wh', false);
    }
  }, []);



  // openModal: opens a modal and pre-fetches its list data if needed

  const openModal = useCallback((name: string) => {

    setActiveModal(name);

    if (name === 'zoom_manage') fetchZoomMeetings();

    if (name === 'cashfree_txs') fetchCashfreeTxs();

    if (name === 'whatsapp_manage') fetchWhatsAppTemplates();

    if (name === 'webhooks_list') fetchWebhooks();

  }, [fetchZoomMeetings, fetchCashfreeTxs, fetchWhatsAppTemplates, fetchWebhooks]);



  useEffect(() => {

    // eslint-disable-next-line react-hooks/set-state-in-effect

    fetchStatus();

    // No fetchLists() here - lists are fetched lazily per modal

  }, [fetchStatus]);



  // ------------------------------------------------------------------------------

  // Handlers

  // ------------------------------------------------------------------------------



  const triggerGoogleOAuth = async () => {

    info('Initiating Google Connection', 'Redirecting to Google authorization…');

    try {

      const { data } = await api.get('/integrations/google/oauth/connect');

      window.location.href = data.authUrl;

    } catch {

      toastError('Connection Error', 'Failed to get Google OAuth URL.');

    }

  };



  const handleSaveGoogleConfig = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();

    setBusyKey('google', true);

    try {

      const payload = {

        clientId: googleClientId,

        clientSecret: googleClientSecret,

        redirectUri: `${BACKEND_BASE_URL}/integrations/google/oauth/callback`,

        scopes: [

          'openid',

          'email',

          'profile',

          'https://www.googleapis.com/auth/calendar',

          'https://www.googleapis.com/auth/gmail.send'

        ],

        environment: 'development'

      };



      console.log('Google configure payload:', payload);

      const response = await api.post('/integrations/google/configure', payload);

      console.log('Google configured:', response.data);

      // Optimistically mark as connected so the card badge flips immediately,

      // even if the backend's status endpoint returns an unexpected shape.

      setStatus(prev => ({ ...prev, google: true }));

      success('Google Configured', 'Google credentials saved successfully.');

      await fetchStatus();

      closeModal();

    } catch (error: any) {

      console.error('Google configure failed:', error.response?.data || error.message);

      toastError(

        'Google Configure Failed',

        error.response?.data?.message || 'Google configure failed'

      );

    } finally {

      setBusyKey('google', false);

    }

  };



  const handleCreateEvent = async (e: React.FormEvent) => {

    e.preventDefault();

    setBusyKey('event', true);

    try {

      await api.post('/integrations/google/calendar/events', {

        summary: newEvent.title,

        description: newEvent.description,

        startDateTime: newEvent.start,

        endDateTime: new Date(new Date(newEvent.start).getTime() + 60 * 60 * 1000).toISOString(),

        timeZone: 'Asia/Kolkata',

        attendees: newEvent.guest ? [{ email: newEvent.guest }] : [],

      });

      success('Event Created', `"${newEvent.title}" scheduled on Google Calendar.`);

      setNewEvent({ title: '', start: '', description: '', guest: '' });

      closeModal();

    } catch (err: any) {

      toastError('API Error', err.response?.data?.message ?? 'Could not create calendar event.');

    } finally {

      setBusyKey('event', false);

    }

  };



  const handleSaveZoomConfig = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();

    setBusyKey('zoom', true);

    try {

      const payload = {

        clientId: zoomClientId,

        clientSecret: zoomClientSecret,

        redirectUri: `${BACKEND_BASE_URL}/integrations/zoom/callback`,

        scopes: [],

        environment: 'development'

      };



      console.log('Zoom configure payload:', payload);

      const response = await api.post('/integrations/zoom/configure', payload);

      console.log('Zoom configured:', response.data);

      // Optimistically mark as connected so the card badge flips immediately.

      setStatus(prev => ({ ...prev, zoom: true }));

      success('Zoom Configured', 'Zoom credentials saved successfully.');

      await fetchStatus();

      closeModal();

    } catch (error: any) {

      console.error('Zoom configure failed:', error.response?.data || error.message);

      toastError(

        'Zoom Configure Failed',

        error.response?.data?.message || 'Zoom configure failed'

      );

    } finally {

      setBusyKey('zoom', false);

    }

  };



  const handleCreateMeeting = async (e: React.FormEvent) => {

    e.preventDefault();

    setBusyKey('meeting', true);

    try {

      const { data } = await api.post('/integrations/zoom/meetings', {

        topic: newMeeting.topic,

        time: newMeeting.time,

        duration: newMeeting.duration,

      });

      setZoomMeetings(prev => [...prev, data.meeting ?? data]);

      success('Zoom Meeting Created', `"${newMeeting.topic}" scheduled.`);

      setNewMeeting({ topic: '', time: '', duration: 45 });

    } catch (err: any) {

      toastError('API Error', err.response?.data?.message ?? 'Could not create Zoom meeting.');

    } finally {

      setBusyKey('meeting', false);

    }

  };



  const handleDeleteMeeting = async (id: string) => {

    try {

      await api.delete(`/integrations/zoom/meetings/${id}`);

      setZoomMeetings(prev => prev.filter(m => m.id !== id));

      success('Meeting Cancelled', 'Zoom meeting deleted.');

    } catch {

      toastError('Error', 'Could not delete this meeting.');

    }

  };







  const handleCreateOrder = async (e: React.FormEvent) => {

    e.preventDefault();

    setBusyKey('order', true);

    try {

      const { data } = await api.post('/integrations/cashfree/orders', {

        orderId: newOrder.orderId || undefined,

        amount: Number(newOrder.amount),

        currency: newOrder.currency,

        customerName: newOrder.customerName,

        customerEmail: newOrder.customerEmail,

        customerPhone: newOrder.customerPhone,

        referenceId: newOrder.referenceId || undefined,

      });

      const tx: CashfreeTransaction = {

        id: data.data?.order_id ?? data.orderId ?? newOrder.orderId,

        customer: newOrder.customerName,

        amount: Number(newOrder.amount),

        status: 'Created',

        paymentLink: data.data?.payment_link ?? data.paymentLink,

      };

      setCashfreeTransactions(prev => [tx, ...prev]);

      if (tx.paymentLink) window.open(tx.paymentLink, '_blank');

      success('Order Created', 'Payment link generated.');

      setNewOrder({ orderId: '', amount: 1999, currency: 'INR', customerName: '', customerEmail: '', customerPhone: '', referenceId: '' });

      openModal('cashfree_txs');

    } catch (err: any) {

      toastError('API Error', err.response?.data?.message ?? 'Could not create Cashfree order.');

    } finally {

      setBusyKey('order', false);

    }

  };



  const handleSyncOrder = async (orderId: string) => {

    try {

      const { data } = await api.get(`/integrations/cashfree/orders/${orderId}`);

      const d = data.data ?? data;

      const newStatus = d.order_status ?? d.status ?? d.paymentStatus ?? 'Unknown';

      setCashfreeTransactions(prev => prev.map(t => t.id === orderId ? { ...t, status: newStatus } : t));

      success('Status Synced', `Order ${orderId}: ${newStatus}`);

    } catch {

      toastError('Sync Failed', 'Could not fetch order status from Cashfree.');

    }

  };



  const handleSaveMetaPixel = async () => {

    setBusyKey('meta', true);

    try {

      await api.post('/integrations/meta/configure', { apiKey: metaPixelId });

      success('Meta Pixel Saved', `Pixel ID ${metaPixelId} is now tracking.`);

      await fetchStatus();

    } catch (err: any) {

      toastError('Meta Error', err.response?.data?.message ?? 'Could not save Meta Pixel.');

    } finally {

      setBusyKey('meta', false);

    }

  };



  const handleSaveZapierConfig = async () => {

    if (!zapierWebhookUrl.trim()) {

      toastError('Zapier Error', 'Please enter a valid Zapier Catch Hook URL.');

      return;

    }

    setBusyKey('zapier', true);

    try {

      await api.post('/integrations/zapier/configure', { webhookUrl: zapierWebhookUrl });

      setStatus(prev => ({ ...prev, zapier: true }));

      success('Zapier Activated', 'Webhook URL saved and automation is live.');

      await fetchStatus();

    } catch (err: any) {

      toastError('Zapier Error', err.response?.data?.message ?? 'Could not save Zapier webhook URL.');

    } finally {

      setBusyKey('zapier', false);

    }

  };



  // Cashfree Config Handler

  const handleSaveCashfreeConfig = async (e?: React.FormEvent) => {

    if (e) e.preventDefault();

    setBusyKey('cashfree', true);

    try {

      const payload = {

        appId: cashfreeAppId,

        secretKey: cashfreeSecret,

        environment: cashfreeTestMode ? 'sandbox' : 'production',

        returnUrl: cashfreeReturnUrl,

        notifyUrl: cashfreeNotifyUrl,

      };

      console.log('Cashfree configure payload:', payload);

      const response = await api.post('/integrations/cashfree/configure', payload);

      console.log('Cashfree configured:', response.data);

      setStatus(prev => ({ ...prev, cashfree: true }));

      success('Cashfree Configured', 'Cashfree credentials saved successfully.');

      await fetchStatus();

      closeModal();

    } catch (error: any) {

      console.error('Cashfree configure failed:', error.response?.data || error.message);

      toastError(

        'Cashfree Configure Failed',

        error.response?.data?.message || 'Cashfree configure failed'

      );

    } finally {

      setBusyKey('cashfree', false);

    }

  };









  const handleAddWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyKey('webhook', true);
    try {
      const payload = {
        name: `Webhook ${newWebhook.url.substring(0, 20)}`,
        webhookUrl: newWebhook.url,
        events: newWebhook.events.length ? newWebhook.events : ['all'],
        enabled: true
      };
      const { data } = await api.post('/integrations/webhooks', payload);
      const wh = data.webhook ?? data;
      const newWh: WebhookItem = {
        id: String(wh.id),
        url: wh.webhookUrl || '',
        events: wh.events || [],
        active: wh.enabled ?? true
      };
      setWebhooks(prev => [...prev, newWh]);
      success('Webhook Registered', 'Endpoint added to event broadcaster.');
      setNewWebhook({ url: '', events: [] });
    } catch (err: any) {
      toastError('Webhook Error', err.response?.data?.message ?? 'Could not register webhook.');
    } finally {
      setBusyKey('webhook', false);
    }
  };



  const handleDeleteWebhook = async (id: string) => {

    try {

      await api.delete(`/integrations/webhooks/${id}`);

      setWebhooks(prev => prev.filter(w => w.id !== id));

      success('Webhook Removed', 'Endpoint deleted.');

    } catch {

      toastError('Error', 'Could not delete this webhook.');

    }

  };



  const handleTestWebhook = async (wh: WebhookItem) => {

    info('Testing Webhook', `Sending ping to ${wh.url}…`);

    try {

      await api.post(`/integrations/webhooks/${wh.id}/test`);

      success('Ping Successful', 'Endpoint returned HTTP 200 OK.');

    } catch {

      toastError('Ping Failed', 'Endpoint did not respond with 200.');

    }

  };



  const handleCreateTemplate = async (e: React.FormEvent) => {

    e.preventDefault();

    setBusyKey('template', true);

    try {

      const { data } = await api.post('/integrations/whatsapp/templates', {

        name: newTemplate.name.toLowerCase().replace(/\s+/g, '_'),

        category: newTemplate.category,

        body: newTemplate.body,

      });

      setWhatsappTemplates(prev => [...prev, data.template ?? data]);

      success('Template Submitted', 'Sent to Meta for approval.');

      setNewTemplate({ name: '', category: 'Utility', body: '' });

      closeModal();

    } catch (err: any) {

      toastError('WhatsApp Error', err.response?.data?.message ?? 'Could not submit template.');

    } finally {

      setBusyKey('template', false);

    }

  };



  const handleGenerateKey = async () => {

    setBusyKey('apikey', true);

    try {

      const { data } = await api.post('/integrations/apikey');

      setApiKey(data.key ?? data.apiKey ?? '');

      success('API Key Generated', 'Store this key safely. Old keys are deprecated.');

      await fetchStatus();

    } catch (err: any) {

      toastError('Error', err.response?.data?.message ?? 'Could not generate API key.');

    } finally {

      setBusyKey('apikey', false);

    }

  };



  const handleCopyKey = () => {

    if (!apiKey) return;

    navigator.clipboard.writeText(apiKey);

    success('Copied', 'API key copied to clipboard.');

  };



  // ------------------------------------------------------------------------------

  // Render

  // ------------------------------------------------------------------------------



  const CARD_ACCENT = {

    google: 'from-blue-500 to-indigo-500',

    zoom: 'from-sky-400 to-blue-500',

    cashfree: 'from-amber-500 to-orange-500',

    meta: 'from-indigo-600 to-blue-700',

    whatsapp: 'from-emerald-400 to-green-600',

    zapier: 'from-orange-500 to-purple-600',

    webhooks: 'from-zinc-400 to-zinc-600',

    apikey: 'from-zinc-700 to-zinc-900',

  };



  return (

    <div className="space-y-6 max-w-[1600px] mx-auto p-1 animate-in fade-in duration-300">



      {/* -- Header -- */}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

        <div>

          <h1 className="text-3xl font-extrabold tracking-tight text-foreground dark:text-white flex items-center gap-2">

            Integrations

            <Badge variant="outline" className="text-xs font-semibold bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">

              Enterprise Suite

            </Badge>

          </h1>

          <p className="text-sm text-muted-foreground mt-1">

            Configure integrations, webhooks, API keys, and third-party auth.

          </p>

        </div>

        <div className="flex items-center gap-3">

          <div className="flex items-center gap-2 text-xs bg-card border dark:border-border p-2 rounded-xl shadow-sm">

            {statusLoading ? (

              <span className="flex items-center gap-1.5 text-muted-foreground"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking…</span>

            ) : backendAvailable ? (

              <span className="flex items-center gap-1.5 font-medium text-emerald-600">

                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Backend Connected

              </span>

            ) : (

              <span className="flex items-center gap-1.5 font-medium text-rose-600">

                <span className="h-2 w-2 rounded-full bg-rose-500" /> Backend Disconnected

              </span>

            )}

          </div>

          <Button size="sm" variant="outline" onClick={() => fetchStatus()} disabled={statusLoading}>

            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${statusLoading ? 'animate-spin' : ''}`} /> Refresh

          </Button>

        </div>

      </div>



      {/* -- Flow Banner -- */}

      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-100/50 dark:border-indigo-900/30 rounded-2xl p-5 shadow-sm">

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">

          <div className="space-y-1">

            <h3 className="font-semibold text-foreground dark:text-white flex items-center gap-2 text-base">

              <Sparkles className="h-4 w-4 text-indigo-600 animate-pulse" />

              Real-time Integration Pipeline

            </h3>

            <p className="text-xs text-muted-foreground max-w-xl">

              When a client pays, the chain auto-syncs calendars, meetings, messaging and ad pixels.

            </p>

          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-foreground/80 bg-card/90 dark:text-muted backdrop-blur p-3.5 rounded-xl border dark:border-border shadow-sm">

            {[

              { icon: <CreditCard className="h-3 w-3" />, label: 'Cashfree Payment', color: 'amber' },

              null,

              { icon: <Webhook className="h-3 w-3" />, label: 'Webhook Trigger', color: 'zinc' },

              null,

              { icon: <Zap className="h-3 w-3" />, label: 'Zapier Automation', color: 'purple' },

            ].map((item, i) =>

              item === null

                ? <ArrowRight key={i} className="h-3 w-3 text-muted-foreground/70" />

                : <span key={i} className={`px-2.5 py-1 bg-${item.color}-50 text-${item.color}-700 border border-${item.color}-200 rounded-md dark:bg-${item.color}-950/40 flex items-center gap-1`}>

                  {item.icon} {item.label}

                </span>

            )}

            <ArrowRight className="h-3 w-3 text-muted-foreground/70" />

            <div className="flex flex-wrap items-center gap-1 bg-indigo-50/40 dark:bg-indigo-950/20 p-1 rounded-lg border border-indigo-100/50">

              {[

                { icon: <Calendar className="h-2.5 w-2.5" />, label: 'Calendar', c: 'blue' },

                { icon: <Video className="h-2.5 w-2.5" />, label: 'Zoom', c: 'sky' },

                { icon: <MessageSquare className="h-2.5 w-2.5" />, label: 'WhatsApp', c: 'emerald' },

                { icon: <Target className="h-2.5 w-2.5" />, label: 'Meta Pixel', c: 'indigo' },

              ].map((x, i) => (

                <span key={i} className={`px-2 py-0.5 bg-${x.c}-50 text-${x.c}-700 border border-${x.c}-200 rounded-md text-[11px] dark:bg-${x.c}-950/40 flex items-center gap-1`}>

                  {x.icon} {x.label}

                </span>

              ))}

            </div>

          </div>

        </div>

      </div>



      {/* -- Cards Grid -- */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">



        {/* 1 · Google Calendar */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.google}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 border border-blue-200 text-blue-600 dark:bg-blue-950 dark:border-blue-900">

                <Calendar className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.google} />

                <Switch checked={status.google} disabled />

                <Button size="sm" variant="outline" className="text-xs" onClick={() => setActiveModal('google_config')}>

                  <Settings className="h-3 w-3 mr-1" /> Configure

                </Button>

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">Google Calendar</CardTitle>

            <CardDescription className="text-xs">Sync webinars, appointments and class events automatically.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            {status.google && googleEmail && (

              <div className="text-xs bg-muted/50 dark:bg-foreground text-background border p-2.5 rounded-lg truncate text-muted-foreground">

                {googleEmail}

              </div>

            )}

            <div className="flex gap-2">

              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={triggerGoogleOAuth}>

                <RefreshCw className="h-3 w-3 mr-1" /> Reconnect

              </Button>

              <Button size="sm" className="flex-1 text-xs bg-blue-600 hover:bg-blue-700" disabled={!status.google} onClick={() => setActiveModal('google_event')}>

                <Plus className="h-3 w-3 mr-1" /> Create Event

              </Button>

            </div>

          </CardContent>

        </Card>



        {/* 2 · Zoom */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.zoom}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 border border-sky-200 text-sky-600 dark:bg-sky-950 dark:border-sky-900">

                <Video className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.zoom} />

                <Switch checked={status.zoom} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">Zoom Meetings</CardTitle>

            <CardDescription className="text-xs">Auto-schedule meeting rooms and live lectures.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            {status.zoom && (

              <div className="text-xs bg-muted/50 dark:bg-foreground text-background border p-2.5 rounded-lg flex justify-between">

                <span className="text-muted-foreground">{zoomMeetings.length} Scheduled Meeting{zoomMeetings.length !== 1 ? 's' : ''}</span>

                <span className="text-emerald-600 font-medium flex items-center gap-1">

                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> API Active

                </span>

              </div>

            )}

            <div className="flex gap-2">

              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => setActiveModal('zoom_config')}>

                <Settings className="h-3 w-3 mr-1" /> Configure

              </Button>

              <Button size="sm" variant="outline" className="flex-1 text-xs" disabled={!status.zoom} onClick={() => openModal('zoom_manage')}>

                <Sliders className="h-3 w-3 mr-1" /> Manage

              </Button>

            </div>

          </CardContent>

        </Card>



        {/* 3 · Cashfree */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.cashfree}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 border border-orange-200 text-orange-600 dark:bg-orange-950 dark:border-orange-900">

                <CreditCard className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.cashfree} label={status.cashfree ? 'Configured' : 'Not Setup'} />

                <Switch checked={status.cashfree} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">Cashfree Payments</CardTitle>

            <CardDescription className="text-xs">Process UPI, cards, and payouts via Cashfree.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            {status.cashfree && cashfreeAppId && (

              <div className="text-xs bg-muted/50 dark:bg-foreground text-background border p-2.5 rounded-lg flex justify-between">

                <span className="text-muted-foreground truncate">App ID: {cashfreeAppId}</span>

                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${cashfreeTestMode ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>

                  {cashfreeTestMode ? 'Sandbox' : 'Live'}

                </span>

              </div>

            )}

            <div className="flex gap-2 flex-wrap">

              <Button size="sm" variant="outline" className="flex-1 min-w-[80px] text-xs" onClick={() => setActiveModal('cashfree_config')}>

                <Settings className="h-3 w-3 mr-1" /> {status.cashfree ? 'Credentials' : 'Setup'}

              </Button>

              <Button size="sm" variant="outline" className="flex-1 min-w-[80px] text-xs" disabled={!status.cashfree} onClick={() => setActiveModal('cashfree_order')}>

                <Plus className="h-3 w-3 mr-1" /> Create Order

              </Button>

              <Button size="sm" className="flex-1 min-w-[80px] text-xs bg-orange-600 hover:bg-orange-700 text-white" disabled={!status.cashfree} onClick={() => openModal('cashfree_txs')}>

                <Info className="h-3 w-3 mr-1" /> Transactions

              </Button>

            </div>

          </CardContent>

        </Card>



        {/* 4 · Meta Pixel */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.meta}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-indigo-950 dark:border-indigo-900">

                <Target className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.meta} label={status.meta ? 'Tracking Active' : 'Not Connected'} />

                <Switch checked={status.meta} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">Meta Pixel</CardTitle>

            <CardDescription className="text-xs">Track conversions for Facebook / Instagram ads.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            <div className="space-y-2">

              <label className="text-[11px] font-semibold text-muted-foreground block">Pixel ID / Conversion API Token</label>

              <div className="flex gap-2">

                <Input

                  placeholder="Enter Pixel ID (e.g. 192839…)"

                  value={metaPixelId}

                  onChange={e => setMetaPixelId(e.target.value)}

                  className="h-8 text-xs flex-1"

                />

                <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shrink-0 px-3"

                  onClick={handleSaveMetaPixel} disabled={busy.meta}>

                  {busy.meta ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}

                </Button>

              </div>

            </div>

          </CardContent>

        </Card>



        {/* 5 · WhatsApp */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.whatsapp}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 dark:bg-emerald-950 dark:border-emerald-900">

                <MessageSquare className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.whatsapp} label={status.whatsapp ? 'Configured' : 'Not Connected'} />

                <Switch checked={status.whatsapp} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">WhatsApp Business API</CardTitle>

            <CardDescription className="text-xs">Send automated receipts, confirmations, and announcements.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            {status.whatsapp && (

              <div className="text-xs bg-muted/50 dark:bg-foreground text-background border p-2.5 rounded-lg flex justify-between">

                <span className="text-muted-foreground font-medium">Gateway: Active</span>

                <span className="text-emerald-600 font-semibold">{whatsappTemplates.length} Templates</span>

              </div>

            )}

            <Button size="sm" variant="outline" className="w-full text-xs" disabled={!status.whatsapp} onClick={() => openModal('whatsapp_manage')}>

              <Sliders className="h-3 w-3 mr-1" /> Manage Templates

            </Button>

          </CardContent>

        </Card>



        {/* 6 · Zapier */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.zapier}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 border border-purple-200 text-purple-600 dark:bg-purple-950 dark:border-purple-900">

                <Zap className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.zapier} label={status.zapier ? 'Active' : 'Inactive'} />

                <Switch checked={status.zapier} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">Zapier</CardTitle>

            <CardDescription className="text-xs">Integrate with 5,000+ apps via Zapier zaps.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            <p className="text-xs text-muted-foreground leading-relaxed">

              Triggers on lead creation, invoice paid, or meeting scheduled.

            </p>

            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => setActiveModal('zapier_setup')}>

              <ExternalLink className="h-3 w-3 mr-1" /> Setup Automations

            </Button>

          </CardContent>

        </Card>



        {/* 7 · Webhooks */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.webhooks}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/50 border border-border text-muted-foreground dark:bg-background dark:border-border">

                <Webhook className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <Badge variant="outline" className="bg-muted text-foreground/80 border-border text-xs">

                  {webhooks.length} Active

                </Badge>

                <Switch checked={status.webhooks} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">Webhooks</CardTitle>

            <CardDescription className="text-xs">Real-time HTTP push notifications for platform events.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            <div className="space-y-1">

              <div className="text-[11px] text-muted-foreground/70 font-semibold uppercase tracking-wider">Subscribed Events</div>

              <div className="flex flex-wrap gap-1">

                {['payment.success', 'lead.created', 'enrollment.created'].map(ev => (

                  <span key={ev} className="text-[10px] bg-muted dark:bg-foreground/90 text-background px-2 py-0.5 rounded text-muted-foreground">{ev}</span>

                ))}

              </div>

            </div>

            <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => openModal('webhooks_list')}>

              <Settings className="h-3 w-3 mr-1" /> Manage Webhooks

            </Button>

          </CardContent>

        </Card>



        {/* 8 · API Keys */}

        <Card className="hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between border-border/80">

          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${CARD_ACCENT.apikey}`} />

          <CardHeader className="pb-3">

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted border border-border text-foreground/90 dark:bg-background dark:border-border">

                <Key className="h-6 w-6" />

              </div>

              <div className="flex items-center gap-2">

                <StatusBadge connected={status.apikey} label={status.apikey ? 'Active' : 'Inactive'} />

                <Switch checked={status.apikey} disabled />

              </div>

            </div>

            <CardTitle className="mt-4 text-lg">API Keys & Tokens</CardTitle>

            <CardDescription className="text-xs">Secure tokens to build on our platform APIs.</CardDescription>

          </CardHeader>

          <CardContent className="pt-0 space-y-4">

            <div className="space-y-1">

              <label className="text-[11px] font-semibold text-muted-foreground block">Production API Key</label>

              <div className="flex items-center gap-1.5 bg-muted/50 dark:bg-foreground text-background border rounded-lg p-2 text-xs">

                <Lock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />

                <span className="font-mono flex-1 truncate text-foreground/80 dark:text-muted">

                  {apiKey

                    ? (showKey ? apiKey : apiKey.replace(/(.{8}).+(.{4})/, '$1••••••••••••$2'))

                    : <span className="text-muted-foreground/70 italic">No key generated</span>

                  }

                </span>

                {apiKey && (

                  <button type="button" onClick={() => setShowKey(!showKey)} className="text-muted-foreground/70 hover:text-muted-foreground">

                    {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}

                  </button>

                )}

              </div>

            </div>

            <div className="flex gap-2">

              <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={handleCopyKey} disabled={!apiKey}>

                <Copy className="h-3 w-3 mr-1" /> Copy Key

              </Button>

              <Button size="sm" className="flex-1 text-xs bg-foreground/90 text-background hover:bg-foreground text-background text-white" onClick={handleGenerateKey} disabled={busy.apikey}>

                {busy.apikey ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <RefreshCw className="h-3 w-3 mr-1" />}

                Generate

              </Button>

            </div>

          </CardContent>

        </Card>



      </div>



      {/* --------------------------------------------------------------

          MODALS

      -------------------------------------------------------------- */}



      {/* Google Configure */}

      {activeModal === 'google_config' && (

        <Modal onClose={closeModal}>

          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Settings className="h-5 w-5 text-blue-600" /> Configure Google Calendar</h3>

          <p className="text-xs text-muted-foreground mb-4">Enter OAuth credentials to enable Calendar integration.</p>

          <form onSubmit={handleSaveGoogleConfig} className="space-y-4">

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Client ID *</label>

              <Input required value={googleClientId} onChange={e => setGoogleClientId(e.target.value)} placeholder="Google OAuth Client ID" />

            </div>

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Client Secret *</label>

              <Input type="password" required value={googleClientSecret} onChange={e => setGoogleClientSecret(e.target.value)} placeholder="Google OAuth Client Secret" />

            </div>

            <div className="flex gap-2 justify-end pt-2">

              <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>

              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={busy.google}>

                {busy.google && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save Credentials

              </Button>

            </div>

          </form>

        </Modal>

      )}



      {/* Google Create Event */}

      {activeModal === 'google_event' && (

        <Modal onClose={closeModal}>

          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" /> Create Calendar Event</h3>

          <p className="text-xs text-muted-foreground mb-4">Schedule a new event on your Google Calendar.</p>

          <form onSubmit={handleCreateEvent} className="space-y-4">

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Title *</label>

              <Input required value={newEvent.title} onChange={e => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="e.g. Premium Mentoring Session" />

            </div>

            <div className="grid grid-cols-2 gap-2">

              <div>

                <label className="text-xs font-semibold text-muted-foreground">Date & Time *</label>

                <Input type="datetime-local" required value={newEvent.start} onChange={e => setNewEvent({ ...newEvent, start: e.target.value })} />

              </div>

              <div>

                <label className="text-xs font-semibold text-muted-foreground">Guest Email</label>

                <Input type="email" value={newEvent.guest} onChange={e => setNewEvent({ ...newEvent, guest: e.target.value })} placeholder="client@example.com" />

              </div>

            </div>

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Description</label>

              <Input value={newEvent.description} onChange={e => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Topics, agenda…" />

            </div>

            <div className="flex gap-2 justify-end pt-2">

              <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>

              <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={busy.event}>

                {busy.event && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Schedule

              </Button>

            </div>

          </form>

        </Modal>

      )}



      {/* Zoom Configure */}

      {activeModal === 'zoom_config' && (

        <Modal onClose={closeModal}>

          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Video className="h-5 w-5 text-sky-600" /> Configure Zoom</h3>

          <p className="text-xs text-muted-foreground mb-4">Server-to-Server OAuth credentials.</p>

          <form onSubmit={handleSaveZoomConfig} className="space-y-4">

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Client ID *</label>

              <Input required value={zoomClientId} onChange={e => setZoomClientId(e.target.value)} placeholder="Zoom Client ID" />

            </div>



            <div>

              <label className="text-xs font-semibold text-muted-foreground">Client Secret *</label>

              <Input type="password" required value={zoomClientSecret} onChange={e => setZoomClientSecret(e.target.value)} placeholder="Zoom Client Secret" />

            </div>

            <div className="flex gap-2 justify-end pt-2">

              <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>

              <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" disabled={busy.zoom}>

                {busy.zoom && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save

              </Button>

            </div>

          </form>

        </Modal>

      )}



      {/* Zoom Manage Meetings */}

      {activeModal === 'zoom_manage' && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"

          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>

          <div className="bg-card border dark:border-border rounded-2xl w-full max-w-xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Video className="h-5 w-5 text-sky-600" /> Zoom Meetings</h3>

            <p className="text-xs text-muted-foreground mb-4">View and manage scheduled conference rooms.</p>

            <div className="max-h-48 overflow-y-auto mb-4 border rounded-lg bg-muted/50 dark:bg-foreground text-background">

              <table className="w-full text-xs text-left">

                <thead className="bg-muted dark:bg-foreground/90 text-background text-[10px] uppercase font-bold text-muted-foreground">

                  <tr>

                    <th className="p-2.5">Topic</th>

                    <th className="p-2.5">Time</th>

                    <th className="p-2.5 text-center">Min</th>

                    <th className="p-2.5 text-right">Action</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-200">

                  {busy.list_zoom && (

                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground/70"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</td></tr>

                  )}

                  {!busy.list_zoom && zoomMeetings.length === 0 && (

                    <tr><td colSpan={4} className="p-4 text-center text-muted-foreground/70">No meetings yet.</td></tr>

                  )}

                  {zoomMeetings.map(zm => (

                    <tr key={zm.id}>

                      <td className="p-2.5 font-medium truncate max-w-[160px]">{zm.topic}</td>

                      <td className="p-2.5 text-muted-foreground">{new Date(zm.time).toLocaleString()}</td>

                      <td className="p-2.5 text-center text-muted-foreground">{zm.duration}</td>

                      <td className="p-2.5 text-right flex items-center justify-end gap-2">

                        {zm.join_url && (

                          <a href={zm.join_url} target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline text-[10px]">Join</a>

                        )}

                        <button type="button" onClick={() => handleDeleteMeeting(zm.id)} className="text-red-500 hover:text-red-700">

                          <Trash2 className="h-3.5 w-3.5" />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <form onSubmit={handleCreateMeeting} className="border-t pt-4 space-y-3">

              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">New Meeting</h4>

              <div className="grid grid-cols-2 gap-2">

                <div className="col-span-2">

                  <Input required value={newMeeting.topic} onChange={e => setNewMeeting({ ...newMeeting, topic: e.target.value })} placeholder="Meeting Topic" className="h-8 text-xs" />

                </div>

                <Input type="datetime-local" required value={newMeeting.time} onChange={e => setNewMeeting({ ...newMeeting, time: e.target.value })} className="h-8 text-xs" />

                <Input type="number" required min={5} max={300} value={newMeeting.duration} onChange={e => setNewMeeting({ ...newMeeting, duration: parseInt(e.target.value) || 30 })} placeholder="Duration (min)" className="h-8 text-xs" />

              </div>

              <div className="flex gap-2 justify-end">

                <Button type="button" variant="outline" size="sm" onClick={closeModal}>Close</Button>

                <Button type="submit" size="sm" className="bg-sky-600 hover:bg-sky-700 text-white" disabled={busy.meeting}>

                  {busy.meeting && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Create Meeting

                </Button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* Cashfree Config */}

      {activeModal === 'cashfree_config' && (

        <Modal onClose={closeModal}>

          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><CreditCard className="h-5 w-5 text-orange-600" /> Cashfree Gateway</h3>

          <p className="text-xs text-muted-foreground mb-4">Enter live API credentials.</p>

          <form onSubmit={handleSaveCashfreeConfig} className="space-y-4">

            <div>

              <label className="text-xs font-semibold text-muted-foreground">App ID *</label>

              <Input required value={cashfreeAppId} onChange={e => setCashfreeAppId(e.target.value)} placeholder="CF_LIVE_…" />

            </div>

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Secret Key *</label>

              <Input type="password" required value={cashfreeSecret} onChange={e => setCashfreeSecret(e.target.value)} placeholder="Secret Key" />

            </div>

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Return URL *</label>

              <Input required value={cashfreeReturnUrl} onChange={e => setCashfreeReturnUrl(e.target.value)} className="font-mono text-xs" placeholder="https://yourapp.com/cashfree/return" />

            </div>

            <div>

              <label className="text-xs font-semibold text-muted-foreground">Notify URL *</label>

              <Input required value={cashfreeNotifyUrl} onChange={e => setCashfreeNotifyUrl(e.target.value)} className="font-mono text-xs" placeholder="https://yourapp.com/api/cashfree/webhook" />

            </div>

            <div className="flex items-center justify-between border-t pt-3">

              <div>

                <span className="text-xs font-semibold text-foreground/80 block">Sandbox Mode</span>

                <span className="text-[10px] text-muted-foreground/70">Routes through Cashfree sandbox.</span>

              </div>

              <Switch checked={cashfreeTestMode} onCheckedChange={setCashfreeTestMode} />

            </div>

            <div className="flex gap-2 justify-end pt-1">

              <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>

              <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={busy.cashfree}>

                {busy.cashfree && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Verify & Save

              </Button>

            </div>

          </form>

        </Modal>

      )}



      {/* Cashfree Create Order */}

      {activeModal === 'cashfree_order' && (

        <Modal onClose={closeModal}>

          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Plus className="h-5 w-5 text-orange-600" /> Create Cashfree Order</h3>

          <p className="text-xs text-muted-foreground mb-4">Generate a payment link via Cashfree API.</p>

          <form onSubmit={handleCreateOrder} className="space-y-3">

            <div className="grid grid-cols-2 gap-2">

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground">Order ID (Optional)</label>

                <Input value={newOrder.orderId} onChange={e => setNewOrder({ ...newOrder, orderId: e.target.value })} placeholder="ORD_123" className="h-8 text-xs font-mono" />

              </div>

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground">Amount (?) *</label>

                <Input type="number" required min={1} value={newOrder.amount} onChange={e => setNewOrder({ ...newOrder, amount: parseFloat(e.target.value) || 0 })} className="h-8 text-xs" />

              </div>

            </div>

            <div className="grid grid-cols-2 gap-2">

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground">Customer Name *</label>

                <Input required value={newOrder.customerName} onChange={e => setNewOrder({ ...newOrder, customerName: e.target.value })} placeholder="John Doe" className="h-8 text-xs" />

              </div>

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground">Phone *</label>

                <Input required value={newOrder.customerPhone} onChange={e => setNewOrder({ ...newOrder, customerPhone: e.target.value })} placeholder="9876543210" className="h-8 text-xs" />

              </div>

            </div>

            <div>

              <label className="text-[11px] font-semibold text-muted-foreground">Email *</label>

              <Input type="email" required value={newOrder.customerEmail} onChange={e => setNewOrder({ ...newOrder, customerEmail: e.target.value })} placeholder="john@example.com" className="h-8 text-xs" />

            </div>

            <div className="grid grid-cols-2 gap-2">

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground">Currency</label>

                <select value={newOrder.currency} onChange={e => setNewOrder({ ...newOrder, currency: e.target.value })}

                  className="border rounded h-8 text-xs p-1 bg-card text-foreground w-full">

                  <option value="INR">INR (?)</option>

                  <option value="USD">USD (?)</option>

                </select>

              </div>

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground">Reference / CRM ID</label>

                <Input value={newOrder.referenceId} onChange={e => setNewOrder({ ...newOrder, referenceId: e.target.value })} placeholder="CRM_101" className="h-8 text-xs" />

              </div>

            </div>

            <div className="flex gap-2 justify-end pt-2 border-t">

              <Button type="button" variant="outline" size="sm" onClick={closeModal}>Cancel</Button>

              <Button type="submit" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white" disabled={busy.order}>

                {busy.order ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null} Create & Checkout

              </Button>

            </div>

          </form>

        </Modal>

      )}



      {/* Cashfree Transactions */}

      {activeModal === 'cashfree_txs' && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"

          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>

          <div className="bg-card border dark:border-border rounded-2xl w-full max-w-xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><CreditCard className="h-5 w-5 text-orange-600" /> Cashfree Transactions</h3>

            <p className="text-xs text-muted-foreground mb-4">Live orders fetched from backend.</p>

            <div className="border rounded-lg overflow-hidden bg-muted/50 dark:bg-foreground text-background max-h-64 overflow-y-auto">

              <table className="w-full text-xs text-left">

                <thead className="bg-muted dark:bg-foreground/90 text-background text-[10px] uppercase font-bold text-muted-foreground sticky top-0">

                  <tr>

                    <th className="p-2.5">TXN ID</th>

                    <th className="p-2.5">Customer</th>

                    <th className="p-2.5">Amount</th>

                    <th className="p-2.5">Status</th>

                    <th className="p-2.5 text-right">Actions</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-200">

                  {busy.list_cf && (

                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground/70"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</td></tr>

                  )}

                  {!busy.list_cf && cashfreeTransactions.length === 0 && (

                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground/70">No transactions found.</td></tr>

                  )}

                  {cashfreeTransactions.map((tx: CashfreeTransaction) => (

                    <tr key={tx.id}>

                      <td className="p-2.5 font-mono truncate max-w-[100px]">{tx.id}</td>

                      <td className="p-2.5">{tx.customer}</td>

                      <td className="p-2.5 font-bold">?{Number(tx.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>

                      <td className="p-2.5">

                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold

                          ${['success', 'paid'].includes(tx.status?.toLowerCase()) ? 'bg-emerald-100 text-emerald-800' :

                            ['created', 'pending'].includes(tx.status?.toLowerCase()) ? 'bg-amber-100 text-amber-800' :

                              'bg-red-100 text-red-800'}`}>

                          {tx.status}

                        </span>

                      </td>

                      <td className="p-2.5 text-right space-x-2">

                        {tx.paymentLink && (

                          <a href={tx.paymentLink} target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline text-xs inline-flex items-center gap-0.5">

                            Pay <ExternalLink className="h-3 w-3" />

                          </a>

                        )}

                        <button type="button" onClick={() => handleSyncOrder(tx.id)} className="text-blue-600 hover:underline text-xs inline-flex items-center gap-0.5">

                          <RefreshCw className="h-3 w-3" /> Sync

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <div className="flex justify-end pt-4">

              <Button size="sm" onClick={closeModal}>Close</Button>

            </div>

          </div>

        </div>

      )}



      {/* WhatsApp Templates */}

      {activeModal === 'whatsapp_manage' && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"

          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>

          <div className="bg-card border dark:border-border rounded-2xl w-full max-w-xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-emerald-600" /> WhatsApp Templates</h3>

            <p className="text-xs text-muted-foreground mb-4">Manage approved message templates.</p>

            <div className="max-h-48 overflow-y-auto mb-4 border rounded-lg bg-muted/50 dark:bg-foreground text-background">

              <table className="w-full text-xs text-left">

                <thead className="bg-muted dark:bg-foreground/90 text-background text-[10px] uppercase font-bold text-muted-foreground">

                  <tr><th className="p-2.5">Name</th><th className="p-2.5">Category</th><th className="p-2.5 text-right">Status</th></tr>

                </thead>

                <tbody className="divide-y divide-slate-200">

                  {busy.list_wa && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground/70"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</td></tr>}

                  {!busy.list_wa && whatsappTemplates.length === 0 && <tr><td colSpan={3} className="p-4 text-center text-muted-foreground/70">No templates.</td></tr>}

                  {whatsappTemplates.map(t => (

                    <tr key={t.id}>

                      <td className="p-2.5 font-mono">{t.name}</td>

                      <td className="p-2.5 text-muted-foreground">{t.category}</td>

                      <td className="p-2.5 text-right">

                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${t.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' : t.status === 'Pending' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>

                          {t.status}

                        </span>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <form onSubmit={handleCreateTemplate} className="border-t pt-4 space-y-3">

              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">New Template</h4>

              <div className="grid grid-cols-2 gap-2">

                <Input required value={newTemplate.name} onChange={e => setNewTemplate({ ...newTemplate, name: e.target.value })} placeholder="template_name" className="h-8 text-xs font-mono" />

                <select value={newTemplate.category} onChange={e => setNewTemplate({ ...newTemplate, category: e.target.value })}

                  className="border rounded h-8 text-xs p-1 bg-card text-foreground w-full">

                  <option value="Utility">Utility / Transactional</option>

                  <option value="Marketing">Marketing</option>

                </select>

                <div className="col-span-2">

                  <Input required value={newTemplate.body} onChange={e => setNewTemplate({ ...newTemplate, body: e.target.value })} placeholder="Hi {{1}}, your payment of {{2}} received." className="h-8 text-xs" />

                </div>

              </div>

              <div className="flex gap-2 justify-end pt-1">

                <Button type="button" variant="outline" size="sm" onClick={closeModal}>Close</Button>

                <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={busy.template}>

                  {busy.template && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Submit to Meta

                </Button>

              </div>

            </form>

          </div>

        </div>

      )}



      {/* Zapier Setup */}

      {activeModal === 'zapier_setup' && (

        <Modal onClose={closeModal}>

          <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Zap className="h-5 w-5 text-purple-600" /> Zapier Automation</h3>

          <p className="text-xs text-muted-foreground mb-4">Paste your Zapier Catch Hook URL below to connect.</p>

          <div className="flex gap-1.5 items-center">

            <Input value={zapierWebhookUrl} onChange={e => setZapierWebhookUrl(e.target.value)} placeholder="https://hooks.zapier.com/hooks/catch/…" className="font-mono text-xs flex-1 h-9" />

            <Button size="sm" className="h-9 shrink-0" variant="outline" onClick={() => { navigator.clipboard.writeText(zapierWebhookUrl); success('Copied', 'URL copied'); }}>

              <Copy className="h-3.5 w-3.5" />

            </Button>

          </div>

          <div className="text-xs text-muted-foreground bg-muted/50 dark:bg-foreground text-background p-3 rounded-lg space-y-1.5 border mt-4">

            <span className="font-bold text-foreground/80 dark:text-muted block">Quick Steps</span>

            <div>1. Go to Zapier ? Create Zap.</div>

            <div>2. Choose <strong>Webhooks by Zapier</strong> ? Catch Hook.</div>

            <div>3. Copy the generated URL, paste above.</div>

            <div>4. Hit <strong>Save</strong> to activate.</div>

          </div>

          <div className="flex justify-end gap-2 border-t pt-3 mt-4">

            <Button size="sm" variant="outline" onClick={closeModal}>Cancel</Button>

            <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => { handleSaveZapierConfig(); closeModal(); }} disabled={busy.zapier}>

              {busy.zapier && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save & Activate

            </Button>

          </div>

        </Modal>

      )}



      {/* Webhooks Manager */}

      {activeModal === 'webhooks_list' && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"

          onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>

          <div className="bg-card border dark:border-border rounded-2xl w-full max-w-2xl shadow-2xl p-6 my-8 max-h-[90vh] overflow-y-auto">

            <h3 className="text-lg font-bold mb-1 flex items-center gap-2"><Webhook className="h-5 w-5 text-muted-foreground" /> Outbound Webhooks</h3>

            <p className="text-xs text-muted-foreground mb-4">HTTP push endpoints triggered on platform events.</p>

            <div className="max-h-48 overflow-y-auto mb-4 border rounded-lg bg-muted/50 dark:bg-foreground text-background">

              <table className="w-full text-xs text-left">

                <thead className="bg-muted dark:bg-foreground/90 text-background text-[10px] uppercase font-bold text-muted-foreground">

                  <tr>

                    <th className="p-2.5">URL</th>

                    <th className="p-2.5">Events</th>

                    <th className="p-2.5 text-center">Status</th>

                    <th className="p-2.5 text-right">Actions</th>

                  </tr>

                </thead>

                <tbody className="divide-y divide-slate-200">

                  {busy.list_wh && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground/70"><Loader2 className="h-4 w-4 animate-spin inline mr-2" />Loading…</td></tr>}

                  {!busy.list_wh && webhooks.length === 0 && <tr><td colSpan={4} className="p-4 text-center text-muted-foreground/70">No webhooks registered.</td></tr>}

                  {webhooks.map(wh => (

                    <tr key={wh.id}>

                      <td className="p-2.5 font-mono truncate max-w-[180px]" title={wh.url}>{wh.url}</td>

                      <td className="p-2.5">

                        <div className="flex flex-wrap gap-1">

                          {wh.events.map(ev => (

                            <span key={ev} className="bg-slate-200/60 dark:bg-foreground/90 text-background text-[9px] px-1 py-0.5 rounded text-muted-foreground">{ev}</span>

                          ))}

                        </div>

                      </td>

                      <td className="p-2.5 text-center">

                        <span className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${wh.active ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>

                          {wh.active ? 'Active' : 'Paused'}

                        </span>

                      </td>

                      <td className="p-2.5 text-right space-x-2">

                        <button type="button" onClick={() => handleTestWebhook(wh)} className="text-blue-600 hover:underline font-medium">Test</button>

                        <button type="button" onClick={() => handleDeleteWebhook(wh.id)} className="text-red-500 hover:text-red-700">

                          <Trash2 className="h-3.5 w-3.5 inline" />

                        </button>

                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            </div>

            <form onSubmit={handleAddWebhook} className="border-t pt-4 space-y-3">

              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground/70">Register New Endpoint</h4>

              <Input required value={newWebhook.url} onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })} placeholder="https://api.yourdomain.com/webhooks/catch" className="h-8 text-xs" />

              <div>

                <label className="text-[11px] font-semibold text-muted-foreground/70 block mb-1">Trigger Events</label>

                <div className="flex flex-wrap gap-2 text-xs">

                  {['payment.success', 'payment.failed', 'lead.created', 'enrollment.created'].map(ev => (

                    <label key={ev} className="flex items-center gap-1.5 bg-muted/50 dark:bg-foreground/90 text-background p-1.5 rounded border border-border cursor-pointer">

                      <input type="checkbox" checked={newWebhook.events.includes(ev)}

                        onChange={e => setNewWebhook({ ...newWebhook, events: e.target.checked ? [...newWebhook.events, ev] : newWebhook.events.filter(x => x !== ev) })} />

                      <span>{ev}</span>

                    </label>

                  ))}

                </div>

              </div>

              <div className="flex gap-2 justify-end pt-1">

                <Button type="button" variant="outline" size="sm" onClick={closeModal}>Close</Button>

                <Button type="submit" size="sm" className="bg-foreground/90 text-background hover:bg-foreground text-background text-white" disabled={busy.webhook}>

                  {busy.webhook && <Loader2 className="h-3 w-3 mr-1 animate-spin" />} Save Webhook

                </Button>

              </div>

            </form>

          </div>

        </div>

      )}



    </div>

  );

}



export default IntegrationsPage;





















