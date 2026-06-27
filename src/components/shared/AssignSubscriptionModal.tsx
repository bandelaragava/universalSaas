import React, { useState, useEffect } from 'react';
import rolesApi from '@/services/rolesApi';

interface Permission {
    id: number;
    module: string;
    action: string;
    permissionKey: string;
    description: string;
    active: boolean;
}

interface ModulePricing {
    [key: string]: number;
}

interface ModuleAssignment {
    moduleName: string;
    amount: number | '';
    paymentMethod: string;
    specialRequirements: string;
    extraCharges: number | '';
    startDate: string;
    expiryDate: string;
}

interface AssignSubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    tenantId: number;
    tenantName: string;
    onSuccess: () => void;
}

export const AssignSubscriptionModal: React.FC<AssignSubscriptionModalProps> = ({ isOpen, onClose, tenantId, tenantName, onSuccess }) => {
    const [modulePricing, setModulePricing] = useState<ModulePricing>({});
    const [moduleConfigs, setModuleConfigs] = useState<Record<string, ModuleAssignment>>({});
    const [toggledModules, setToggledModules] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (isOpen) {
            // Fetch default module pricing
            rolesApi.get('/api/subscriptions/modules/pricing')
                .then(res => {
                    if (res.data && res.data.data) {
                        setModulePricing(res.data.data);
                    } else {
                        setModulePricing(res.data || {});
                    }
                })
                .catch(err => console.error("Error fetching pricing", err));


        }
    }, [isOpen]);

    const handleToggle = (moduleName: string) => {
        const newSet = new Set(toggledModules);
        if (newSet.has(moduleName)) {
            newSet.delete(moduleName);
            setModuleConfigs(prev => {
                const next = { ...prev };
                delete next[moduleName];
                return next;
            });
        } else {
            newSet.add(moduleName);
            setModuleConfigs(prev => ({
                ...prev,
                [moduleName]: {
                    moduleName,
                    amount: modulePricing[moduleName] || '',
                    paymentMethod: 'Credit/Debit Card',
                    specialRequirements: '',
                    extraCharges: '',
                    startDate: new Date().toISOString().split('T')[0],
                    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]
                }
            }));
        }
        setToggledModules(newSet);
    };

    const handleConfigChange = (moduleName: string, field: keyof ModuleAssignment, value: any) => {
        setModuleConfigs(prev => ({
            ...prev,
            [moduleName]: {
                ...prev[moduleName],
                [field]: value
            }
        }));
    };

    const [invoiceType, setInvoiceType] = useState('NEW_SUBSCRIPTION');
    const [paymentType, setPaymentType] = useState('FULL');
    const [noOfInstallments, setNoOfInstallments] = useState<number>(1);
    const [installmentAmount, setInstallmentAmount] = useState<number | ''>('');
    const [gstPercentage, setGstPercentage] = useState<number>(18);
    const [discountType, setDiscountType] = useState<string>('FLAT');
    const [discountValue, setDiscountValue] = useState<number | ''>('');

    const getFinancials = () => {
        let subtotal = 0;
        Object.values(moduleConfigs).forEach(config => {
            subtotal += Number(config.amount || 0);
            subtotal += Number(config.extraCharges || 0);
        });

        let discount = 0;
        if (discountValue) {
            if (discountType === 'PERCENTAGE') {
                discount = subtotal * (Number(discountValue) / 100);
            } else {
                discount = Number(discountValue);
            }
        }

        const amountAfterDiscount = subtotal - discount;
        const gst = amountAfterDiscount * (gstPercentage / 100);
        const grandTotal = amountAfterDiscount + gst;
        const calculatedInstallment = paymentType === 'INSTALLMENT' && noOfInstallments > 0
            ? grandTotal / noOfInstallments
            : grandTotal;

        return { subtotal, discount, amountAfterDiscount, gst, grandTotal, calculatedInstallment };
    };

    const financials = getFinancials();

    const handleSubmit = async () => {
        setLoading(true);

        const modules = Object.values(moduleConfigs).map(config => ({
            moduleName: config.moduleName,
            amount: Number(config.amount || 0),
            extraCharges: Number(config.extraCharges || 0),
            specialRequirements: config.specialRequirements,
            startDate: config.startDate,
            expiryDate: config.expiryDate
        }));

        const payload = {
            modules,
            paymentType,
            invoiceType,
            noOfInstallments: paymentType === 'INSTALLMENT' ? noOfInstallments : 1,
            installmentAmount: paymentType === 'INSTALLMENT' && installmentAmount ? Number(installmentAmount) : null,
            gstPercentage,
            discountType,
            discountValue: discountValue ? Number(discountValue) : 0
        };

        try {
            const res = await rolesApi.put(`/tenants/${tenantId}/modules/bulk`, payload);

            if (res.status === 200 || res.status === 201) {
                onSuccess();
                onClose();
            } else {
                alert("Failed to assign subscription");
            }
        } catch (error: any) {
            console.error(error);
            alert("An error occurred: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // Format module name (e.g., SUPPORT_TICKETS -> Support Tickets)
    const formatModuleName = (mod: string) => {
        return mod.split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <svg className="w-5 h-5 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <h3 className="text-xl font-bold text-gray-900">Grant Subscription Modules: <span className="text-cyan-500">{tenantName}</span></h3>
                        </div>
                        <p className="text-sm text-gray-500">Adjust active system module clearance, license fees, and special billing arrangements.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50">

                    {/* Alert */}
                    <div className="bg-cyan-50 border border-cyan-100 rounded-lg p-4 mb-6 flex items-start gap-3">
                        <svg className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <p className="text-sm text-cyan-700 font-medium">Core Exemption: SYSTEM_ADMIN and EMPLOYEE roles operate as system-core functions and do not require separate module enabling.</p>
                    </div>

                    {/* Modules List */}
                    <div className="space-y-4">
                        {Object.keys(modulePricing).map((mod) => {
                            const isCore = mod === 'ADMIN' || mod === 'EMPLOYEE' || mod === 'SETTINGS';
                            return (
                                <div key={mod} className={`bg-white border ${toggledModules.has(mod) || isCore ? 'border-cyan-200 shadow-sm' : 'border-gray-200'} rounded-xl p-5 transition-all duration-200`}>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="text-base font-bold text-gray-900">{formatModuleName(mod)} Module {isCore && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">Core Function</span>}</h4>
                                            <p className="text-xs text-gray-500 mt-1">Core capabilities and feature access for the {formatModuleName(mod)} module.</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={isCore ? true : toggledModules.has(mod)} disabled={isCore} onChange={() => handleToggle(mod)} />
                                            <div className={`w-11 h-6 rounded-full peer after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all ${isCore ? 'bg-cyan-400 after:translate-x-full after:border-white' : 'bg-gray-200 peer-checked:after:translate-x-full peer-checked:after:border-white peer-checked:bg-cyan-600'}`}></div>
                                        </label>
                                    </div>

                                    {/* Expanded Inputs */}
                                    {toggledModules.has(mod) && moduleConfigs[mod] && (
                                        <div className="mt-5 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Subscription Price</label>
                                                <input
                                                    type="number"
                                                    value={moduleConfigs[mod].amount}
                                                    onChange={e => handleConfigChange(mod, 'amount', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                                    placeholder="e.g. 150"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Special Requirements</label>
                                                <input
                                                    type="text"
                                                    value={moduleConfigs[mod].specialRequirements}
                                                    onChange={e => handleConfigChange(mod, 'specialRequirements', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                                    placeholder="e.g. Specific branch code"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Extra Charges</label>
                                                <input
                                                    type="number"
                                                    value={moduleConfigs[mod].extraCharges}
                                                    onChange={e => handleConfigChange(mod, 'extraCharges', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                                    placeholder="e.g. 50"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
                                                <input
                                                    type="date"
                                                    value={moduleConfigs[mod].startDate}
                                                    onChange={e => handleConfigChange(mod, 'startDate', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                                                <input
                                                    type="date"
                                                    value={moduleConfigs[mod].expiryDate}
                                                    onChange={e => handleConfigChange(mod, 'expiryDate', e.target.value)}
                                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                                />
                                            </div>
                                            {/* Module permissions are implicitly granted when module is selected, UI removed per user request */}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Global Billing Configuration */}
                    <div className="mt-6 p-5 bg-white border border-gray-200 rounded-xl">
                        <h4 className="text-base font-bold text-gray-900 mb-4">Billing & Payment Configuration</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Invoice Type</label>
                                <select
                                    value={invoiceType}
                                    onChange={e => setInvoiceType(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                >
                                    <option value="NEW_SUBSCRIPTION">New Subscription</option>
                                    <option value="RENEWAL">Renewal</option>
                                    <option value="ADDON_MODULE">Add-on Module</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Payment Plan</label>
                                <select
                                    value={paymentType}
                                    onChange={e => setPaymentType(e.target.value)}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                >
                                    <option value="FULL">Full Payment</option>
                                    <option value="INSTALLMENT">Installments</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">GST Percentage (%)</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={gstPercentage}
                                    onChange={e => setGstPercentage(Number(e.target.value))}
                                    className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="w-1/3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount Type</label>
                                    <select
                                        value={discountType}
                                        onChange={e => setDiscountType(e.target.value)}
                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                    >
                                        <option value="FLAT">Flat</option>
                                        <option value="PERCENTAGE">Percent (%)</option>
                                    </select>
                                </div>
                                <div className="w-2/3">
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Discount Value</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={discountValue}
                                        onChange={e => setDiscountValue(e.target.value ? Number(e.target.value) : '')}
                                        className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            {paymentType === 'INSTALLMENT' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Number of Installments</label>
                                        <input
                                            type="number"
                                            min="2"
                                            value={noOfInstallments}
                                            onChange={e => setNoOfInstallments(parseInt(e.target.value) || 2)}
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Installment Amount (Optional override)</label>
                                        <input
                                            type="number"
                                            value={installmentAmount}
                                            onChange={e => setInstallmentAmount(e.target.value ? Number(e.target.value) : '')}
                                            className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-cyan-500 focus:ring-cyan-500 px-3 py-2 border"
                                            placeholder={`Auto-calculated: ₹${financials.calculatedInstallment.toFixed(2)}`}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex gap-4 sm:gap-6 w-full sm:w-auto text-sm">
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Subtotal</span>
                            <span className="font-semibold text-gray-800">₹{financials.subtotal.toFixed(2)}</span>
                        </div>
                        {financials.discount > 0 && (
                            <div className="flex flex-col">
                                <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Discount</span>
                                <span className="font-semibold text-red-600">-₹{financials.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex flex-col">
                            <span className="text-gray-500 text-[10px] uppercase tracking-wider font-semibold">GST ({gstPercentage}%)</span>
                            <span className="font-semibold text-gray-800">₹{financials.gst.toFixed(2)}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-cyan-600 text-[10px] uppercase tracking-wider font-semibold">Total Invoice</span>
                            <span className="font-bold text-gray-900 text-lg">₹{financials.grandTotal.toFixed(2)}</span>
                        </div>
                        {paymentType === 'INSTALLMENT' && (
                            <div className="flex flex-col pl-4 border-l border-gray-200">
                                <span className="text-amber-600 text-[10px] uppercase tracking-wider font-semibold">{noOfInstallments}x Installments</span>
                                <span className="font-bold text-amber-700 text-lg">₹{(installmentAmount || financials.calculatedInstallment).toFixed(2)}<span className="text-xs font-normal text-amber-600">/mo</span></span>
                            </div>
                        )}
                    </div>
                    <div className="flex gap-3 w-full sm:w-auto justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-full font-medium text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={loading || toggledModules.size === 0}
                            className="px-6 py-2 rounded-full font-medium text-sm text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 transition shadow-sm"
                        >
                            {loading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};