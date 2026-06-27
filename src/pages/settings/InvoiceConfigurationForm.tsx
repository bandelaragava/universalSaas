import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, FileText, Image as ImageIcon } from 'lucide-react';
import { toast } from 'react-hot-toast';
import rolesApi from '@/services/rolesApi';

interface InvoiceConfigForm {
    invoiceName: string;
    invoicePrefix: string;
    invoiceNumberFormat: string;
    companyLogo: string;
    companyDetails: string;
    gstTaxDetails: string;
    termsConditions: string;
    active: boolean;
}

export default function InvoiceConfigurationForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);

    const [formData, setFormData] = useState<InvoiceConfigForm>({
        invoiceName: '',
        invoicePrefix: 'INV-',
        invoiceNumberFormat: 'YYYYMMDD-000',
        companyLogo: '',
        companyDetails: '',
        gstTaxDetails: '',
        termsConditions: '',
        active: false
    });

    useEffect(() => {
        if (id) {
            const fetchConfig = async () => {
                try {
                    const res = await rolesApi.get(`/api/invoice-configurations/${id}`);
                    setFormData({
                        invoiceName: res.data.invoiceName || '',
                        invoicePrefix: res.data.invoicePrefix || '',
                        invoiceNumberFormat: res.data.invoiceNumberFormat || '',
                        companyLogo: res.data.companyLogo || '',
                        companyDetails: res.data.companyDetails || '',
                        gstTaxDetails: res.data.gstTaxDetails || '',
                        termsConditions: res.data.termsConditions || '',
                        active: res.data.active || false
                    });
                } catch (error) {
                    console.error('Error fetching configuration:', error);
                    toast.error('Failed to load configuration');
                    navigate('/settings/invoice-configurations');
                } finally {
                    setFetching(false);
                }
            };
            fetchConfig();
        }
    }, [id, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (id) {
                await rolesApi.put(`/api/invoice-configurations/${id}`, formData);
                toast.success('Configuration updated successfully');
            } else {
                await rolesApi.post('/api/invoice-configurations', formData);
                toast.success('Configuration created successfully');
            }
            navigate('/settings/invoice-configurations');
        } catch (error: any) {
            console.error('Error saving configuration:', error);
            toast.error(error.response?.data?.message || 'Failed to save configuration');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-8 text-center text-gray-500 font-sans">Loading...</div>;

    return (
        <div className="p-6 font-sans max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/settings/invoice-configurations')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {id ? 'Edit Configuration' : 'Create Configuration'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Configure how your invoices look and function</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText size={18} className="text-indigo-600" /> Basic Details
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Configuration Name *</label>
                            <input
                                type="text"
                                name="invoiceName"
                                required
                                value={formData.invoiceName}
                                onChange={handleChange}
                                placeholder="e.g. Standard SaaS Template"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Invoice Prefix</label>
                            <input
                                type="text"
                                name="invoicePrefix"
                                value={formData.invoicePrefix}
                                onChange={handleChange}
                                placeholder="e.g. INV-"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Number Format</label>
                            <input
                                type="text"
                                name="invoiceNumberFormat"
                                value={formData.invoiceNumberFormat}
                                onChange={handleChange}
                                placeholder="e.g. YYYYMMDD-000"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <ImageIcon size={18} className="text-indigo-600" /> Branding & Styling
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Company Logo URL</label>
                            <input
                                type="url"
                                name="companyLogo"
                                value={formData.companyLogo}
                                onChange={handleChange}
                                placeholder="https://example.com/logo.png"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                            {formData.companyLogo && (
                                <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 max-w-[200px]">
                                    <img src={formData.companyLogo} alt="Logo Preview" className="h-10 object-contain mx-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Content & Disclaimers</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Company Details (Address, Email, Phone)</label>
                            <textarea
                                name="companyDetails"
                                value={formData.companyDetails}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Enter the Billed From details here..."
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">GST & Tax Details</label>
                            <textarea
                                name="gstTaxDetails"
                                value={formData.gstTaxDetails}
                                onChange={handleChange}
                                rows={2}
                                placeholder="GSTIN: 36ABCDE1234..."
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Terms & Conditions</label>
                            <textarea
                                name="termsConditions"
                                value={formData.termsConditions}
                                onChange={handleChange}
                                rows={4}
                                placeholder="1. Payment is due within 7 days.&#10;2. Late payments may incur a fee."
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {!id && (
                    <div className="flex items-center gap-3 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                        <input
                            type="checkbox"
                            id="active"
                            name="active"
                            checked={formData.active}
                            onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                        />
                        <label htmlFor="active" className="text-sm font-bold text-indigo-900 cursor-pointer">
                            Set as Active Configuration immediately
                        </label>
                    </div>
                )}

                <div className="flex justify-end pt-4 pb-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-600/20 font-bold disabled:opacity-50"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                            <Save size={18} />
                        )}
                        {id ? 'Update Configuration' : 'Save Configuration'}
                    </button>
                </div>
            </form>
        </div>
    );
}