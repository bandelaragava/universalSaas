import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, CheckCircle, Search } from 'lucide-react';
import { toast } from 'react-hot-toast';
import rolesApi from '@/services/rolesApi';

interface InvoiceConfig {
    id: number;
    invoiceName: string;
    invoicePrefix: string;
    invoiceNumberFormat: string;
    active: boolean;
}

export default function InvoiceConfigurationList() {
    const [configs, setConfigs] = useState<InvoiceConfig[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    const fetchConfigs = async () => {
        try {
            const response = await rolesApi.get('/api/invoice-configurations');
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-4">
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
        </div>
    );
}