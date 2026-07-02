import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, CheckCircle, Search, Eye, FileText, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import rolesApi from '@/services/rolesApi';

interface InvoiceConfig {
  id: number;
  invoiceName: string;
  invoicePrefix: string;
  invoiceNumberFormat: string;
  active: boolean;
  targetModule: string;
}

const PREDEFINED_TEMPLATES = [
  { id: 'modern-corporate', name: 'Modern Corporate', prefix: 'MC-', format: 'YYYY-000', color: '#1e293b', terms: '1. Payment due within 15 days.\n2. Late fee of 1.5% per month.' },
  { id: 'classic-business', name: 'Classic Business', prefix: 'CB-', format: 'YYYY-000', color: '#0f172a', terms: 'Payment due on receipt.' },
  { id: 'professional-blue', name: 'Professional Blue', prefix: 'PB-', format: 'YYYY-MM-000', color: '#1d4ed8', terms: '1. Please make all cheques payable to the Company.\n2. Thank you for your business.' },
  { id: 'gst-standard', name: 'GST Standard', prefix: 'GST-', format: 'YYYY-000', color: '#047857', terms: '1. Subject to local jurisdiction.\n2. GST payable on reverse charge: No.' },
  { id: 'minimal-clean', name: 'Minimal Clean', prefix: 'INV-', format: '00000', color: '#171717', terms: 'Thank you.' },
  { id: 'premium-enterprise', name: 'Premium Enterprise', prefix: 'ENT-', format: 'YYYY-MM-DD-000', color: '#4338ca', terms: 'Standard enterprise terms apply.' },
  { id: 'retail-invoice', name: 'Retail Invoice', prefix: 'RET-', format: '000000', color: '#0ea5e9', terms: 'No returns or exchanges without original receipt.' },
  { id: 'service-invoice', name: 'Service Invoice', prefix: 'SRV-', format: 'YYYY-000', color: '#db2777', terms: 'Services rendered are final.' },
];

export default function InvoiceConfigurationList() {
  const [configs, setConfigs] = useState<InvoiceConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewTemplate, setPreviewTemplate] = useState<typeof PREDEFINED_TEMPLATES[0] | null>(null);
  const navigate = useNavigate();

  const fetchConfigs = async () => {
    try {
      const response = await rolesApi.get('/invoice-configurations');
      setConfigs(response.data);
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Failed to load invoice configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleActivate = async (id: number) => {
    try {
      await rolesApi.put(`/api/invoice-configurations/${id}/activate`);
      toast.success('Configuration activated successfully');
      fetchConfigs();
    } catch (error) {
      console.error('Error activating configuration:', error);
      toast.error('Failed to activate configuration');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;
    try {
      await rolesApi.delete(`/api/invoice-configurations/${id}`);
      toast.success('Configuration deleted');
      setConfigs(configs.filter((c) => c.id !== id));
    } catch (error) {
      console.error('Error deleting configuration:', error);
      toast.error('Failed to delete configuration');
    }
  };

  const filteredConfigs = configs.filter((c) => 
    c.invoiceName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 font-sans">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoice Configurations</h1>
          <p className="text-gray-500 text-sm mt-1">Manage invoice templates and billing formats</p>
        </div>
        <button
          onClick={() => navigate('/settings/invoice-configurations/create')}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-semibold text-sm"
        >
          <Plus size={18} /> Add Configuration
        </button>
      </div>

      {/* Predefined Templates Section */}
      <div className="mb-8">
        <h2 className="text-lg font-bold text-gray-900 mb-4 border-b border-gray-200 pb-2">Predefined Billing Invoice Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PREDEFINED_TEMPLATES.map((t) => (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: t.color }}></div>
                  <h3 className="font-bold text-gray-900">{t.name}</h3>
                </div>
                <div className="text-xs text-gray-500 mb-4 font-mono">
                  Prefix: {t.prefix} | Format: {t.format}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-auto">
                <button
                  onClick={() => setPreviewTemplate(t)}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg border border-gray-200 transition-colors"
                >
                  <Eye size={14} /> Preview
                </button>
                <button
                  onClick={() => navigate('/settings/invoice-configurations/create', { state: { template: t } })}
                  className="flex-1 flex justify-center items-center gap-1.5 py-1.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg border border-indigo-100 transition-colors"
                >
                  <FileText size={14} /> Use Template
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configurations List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Your Configurations</h2>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search configurations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading configurations...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4">Configuration Name</th>
                  <th className="px-6 py-4">Target Module</th>
                  <th className="px-6 py-4">Prefix</th>
                  <th className="px-6 py-4">Format</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {filteredConfigs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No invoice configurations found. Create one to get started.
                    </td>
                  </tr>
                ) : (
                  filteredConfigs.map((config) => (
                    <tr key={config.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">{config.invoiceName}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          config.targetModule === 'ALL' ? 'bg-indigo-50 text-indigo-700' :
                          config.targetModule === 'VENDOR' ? 'bg-orange-50 text-orange-700' :
                          config.targetModule === 'BILLING' ? 'bg-cyan-50 text-cyan-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {config.targetModule || 'ALL'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{config.invoicePrefix || '-'}</td>
                      <td className="px-6 py-4 text-gray-600 font-mono">{config.invoiceNumberFormat || '-'}</td>
                      <td className="px-6 py-4 text-center">
                        {config.active ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                            <CheckCircle size={12} /> Active
                          </span>
                        ) : (
                          <button
                            onClick={() => handleActivate(config.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 hover:bg-indigo-100 hover:text-indigo-700 transition-colors"
                          >
                            Set Active
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => navigate(`/settings/invoice-configurations/edit/${config.id}`)}
                            className="p-1.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(config.id)}
                            className="p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">{previewTemplate.name} Preview</h3>
              <button onClick={() => setPreviewTemplate(null)} className="p-1.5 hover:bg-gray-200 rounded-full text-gray-500">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-gray-100 flex justify-center">
              {/* Fake PDF Output Container */}
              <div className="bg-white w-full max-w-3xl min-h-[800px] shadow-sm border border-gray-200 p-10 font-sans">
                <div className="flex justify-between items-start border-b-[4px] pb-6 mb-8" style={{ borderColor: previewTemplate.color }}>
                  <div>
                    <div className="w-32 h-12 bg-gray-200 flex items-center justify-center text-gray-400 font-bold mb-4">[Company Logo]</div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="font-bold text-gray-900">Your Company Name</p>
                      <p>123 Business Avenue</p>
                      <p>City, State, 12345</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-bold uppercase tracking-wider mb-2" style={{ color: previewTemplate.color }}>Invoice</h1>
                    <p className="text-sm font-semibold text-gray-700">Invoice No: {previewTemplate.prefix}0001</p>
                    <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Due Date: {new Date(Date.now() + 15 * 86400000).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Bill To</h3>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p className="font-bold text-gray-900">Acme Corporation</p>
                    <p>456 Client Street</p>
                    <p>Suite 900</p>
                    <p>Business City, 98765</p>
                  </div>
                </div>

                <table className="w-full text-left text-sm mb-8">
                  <thead>
                    <tr className="text-white" style={{ backgroundColor: previewTemplate.color }}>
                      <th className="py-2 px-3">Item / Description</th>
                      <th className="py-2 px-3 text-right">Qty</th>
                      <th className="py-2 px-3 text-right">Price</th>
                      <th className="py-2 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-800">SaaS Subscription - Pro Plan</p>
                        <p className="text-xs text-gray-500">Monthly billing cycle</p>
                      </td>
                      <td className="py-3 px-3 text-right">1</td>
                      <td className="py-3 px-3 text-right">$499.00</td>
                      <td className="py-3 px-3 text-right font-semibold">$499.00</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-3">
                        <p className="font-bold text-gray-800">Setup & Onboarding</p>
                        <p className="text-xs text-gray-500">One-time fee</p>
                      </td>
                      <td className="py-3 px-3 text-right">1</td>
                      <td className="py-3 px-3 text-right">$150.00</td>
                      <td className="py-3 px-3 text-right font-semibold">$150.00</td>
                    </tr>
                  </tbody>
                </table>

                <div className="flex justify-between items-start">
                  <div className="w-1/2 pr-8">
                    <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Terms & Conditions</h3>
                    <p className="text-xs text-gray-600 whitespace-pre-line">{previewTemplate.terms}</p>
                  </div>
                  <div className="w-1/2">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-2 text-gray-600 font-medium">Subtotal</td>
                          <td className="py-2 text-right">$649.00</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-gray-600 font-medium border-b border-gray-200">Tax (10%)</td>
                          <td className="py-2 text-right border-b border-gray-200">$64.90</td>
                        </tr>
                        <tr>
                          <td className="py-3 text-lg font-bold text-gray-900">Total Due</td>
                          <td className="py-3 text-lg font-bold text-right" style={{ color: previewTemplate.color }}>$713.90</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mt-16 pt-8 border-t border-gray-200 flex justify-between items-end">
                  <div className="text-center">
                    <div className="w-48 border-b border-gray-400 mb-2 h-10"></div>
                    <p className="text-xs text-gray-500">Authorized Signature</p>
                  </div>
                  <p className="text-xs text-gray-400">Thank you for your business.</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button 
                onClick={() => setPreviewTemplate(null)}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const t = previewTemplate;
                  setPreviewTemplate(null);
                  navigate('/settings/invoice-configurations/create', { state: { template: t } });
                }}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm flex items-center gap-2"
              >
                <CheckCircle size={16} /> Use This Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
