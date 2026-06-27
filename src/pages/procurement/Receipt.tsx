import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Share2, X, QrCode, CheckCircle2, AlertCircle, FileText } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import rolesApi from '@/services/rolesApi';

interface CompanyProfile {
  logoUrl?: string;
  companyName?: string;
  email?: string;
  gstNumber?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

interface InvoiceConfig {
  invoiceName?: string;
  invoicePrefix?: string;
  invoiceNumberFormat?: string;
  companyLogo?: string;
  companyDetails?: string;
  gstTaxDetails?: string;
  termsConditions?: string;
}

interface PaymentStep {
  note: string;
  date: string;
  amount: number;
}

interface InvoiceItem {
  id?: number | string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number;
  total: number;
}

interface VendorInvoice {
  id: number | string;
  invoiceNumber?: string;
  requirementId?: number | string;
  vendorName?: string;
  dueDate?: string;
  amountPaid?: string | number;
  amountValue?: string | number;
  amountPending?: string | number;
  paymentHistory?: string;
  notes?: string;
  customerAddress?: string;
  gstin?: string;
  cgst?: number;
  sgst?: number;
  igst?: number;
  discount?: number;
  subTotal?: number;
  taxTotal?: number;
  items?: InvoiceItem[];
}

export function Receipt() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<VendorInvoice | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
  const [config, setConfig] = useState<InvoiceConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        try {
          const res = await rolesApi.get(`/api/vendor-invoices/${id}`);
          setInvoice(res.data?.data || res.data);
        } catch (err) {
          console.error('Failed to fetch invoice details from backend:', err);
        }

        try {
          const resConf = await rolesApi.get('/api/invoice-configurations/active');
          if (resConf.data) setConfig(resConf.data);
        } catch (err) {
          console.warn('No active invoice configuration found, falling back to company profile.');
        }

        try {
          const res = await rolesApi.get('/company-profile');
          setCompany(res.data);
        } catch (err) {
          console.error('Failed to fetch company profile from backend:', err);
        }
      } catch (err) {
        console.error('Error fetching receipt data', err);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  if (loading) return <div className="p-8 text-center text-muted-foreground font-sans">Loading receipt...</div>;
  if (!invoice) return <div className="p-8 text-center text-red-400 font-sans">Receipt not found.</div>;

  const fmtINR = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(amt || 0);

  let steps: PaymentStep[] = [];
  try {
    if (invoice.paymentHistory) {
      steps = JSON.parse(invoice.paymentHistory);
    }
  } catch {
    // Ignore JSON parse errors for empty payment history
  }

  const invoiceRef = invoice.invoiceNumber || `INV-${invoice.id}`;
  const totalPaid = parseFloat(String(invoice.amountPaid)) || 0;
  const totalAmt = parseFloat(String(invoice.amountValue)) || 0;
  const balanceDue = parseFloat(String(invoice.amountPending)) || 0;

  const handlePrint = () => window.print();

  const handleShare = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;
    const opt = {
      margin: 0.5,
      filename: `Receipt_${invoiceRef}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };
    try {
      const pdfBlob = await html2pdf().set(opt).from(element).output('blob');
      const file = new File([pdfBlob], opt.filename, { type: 'application/pdf' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Invoice Receipt', text: `Payment Receipt for ${invoiceRef}` });
      } else {
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = opt.filename;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error('Error sharing PDF:', err);
      alert('Failed to share PDF. Your browser may not support file sharing.');
    }
  };

  const logoToUse = config?.companyLogo || company?.logoUrl;
  const nameToUse = config?.invoiceName || company?.companyName || 'COMPANY';

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-sans print:bg-white print:p-0">
      <div className="max-w-4xl mx-auto bg-white text-black shadow-2xl rounded-xl border border-gray-200 overflow-hidden flex flex-col min-h-full print:shadow-none print:border-none print:w-full print:max-w-none">
        <div id="receipt-content" className="p-10 overflow-y-auto flex-1 relative bg-white print:p-6">

          {/* WATERMARK */}
          {balanceDue <= 0 && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-0 print:opacity-[0.03]">
              <span className="text-[150px] sm:text-[200px] font-black text-emerald-500 opacity-5 -rotate-45 select-none">
                PAID
              </span>
            </div>
          )}

          <div className="relative z-10">
            {/* Header Section */}
            <div className="flex justify-between items-start mb-8 pb-6 border-b-2 border-gray-900">
              <div>
                {logoToUse && <img src={logoToUse} alt="Logo" className="h-14 mb-4 object-contain" />}
                <h1 className="text-4xl font-black uppercase text-gray-900 tracking-widest mb-1">INVOICE</h1>
                <div className="mt-4 grid grid-cols-[120px_1fr] gap-y-2 text-sm text-gray-700">
                  <span className="font-bold text-gray-500 uppercase">Invoice No</span>
                  <span className="font-bold text-gray-900">: {invoiceRef}</span>
                  <span className="font-bold text-gray-500 uppercase">Invoice Date</span>
                  <span className="font-bold text-gray-900">: {new Date().toLocaleDateString()}</span>
                  <span className="font-bold text-gray-500 uppercase">Due Date</span>
                  <span className="font-bold text-gray-900">: {invoice.dueDate || 'N/A'}</span>
                  <span className="font-bold text-gray-500 uppercase mt-2">Status</span>
                  <div className="mt-2 flex items-center gap-2">
                    <span>:</span>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-black uppercase ${balanceDue <= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                      {balanceDue <= 0 ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                      {balanceDue <= 0 ? 'PAID' : 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right flex flex-col items-end">
                <div className="bg-gray-50 border border-gray-200 p-2 rounded-lg mb-2">
                  <QrCode className="w-20 h-20 text-gray-800" strokeWidth={1.5} />
                </div>
                <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Scan to Verify</span>
              </div>
            </div>

            {/* Billed From / Billed To */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 mb-10">
              {/* Billed From */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed From</h3>
                <h4 className="text-lg font-black text-gray-900 mb-2">{nameToUse}</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  {config?.companyDetails ? (
                    <div className="whitespace-pre-line leading-relaxed">{config.companyDetails}</div>
                  ) : (
                    <>
                      <div className="grid grid-cols-[60px_1fr] gap-1">
                        <span className="font-semibold text-gray-500">Email</span>
                        <span className="text-gray-900">: {company?.email || 'N/A'}</span>
                        <span className="font-semibold text-gray-500">Address</span>
                        <span className="text-gray-900">: {company?.addressLine1}, {company?.city} {company?.state} {company?.pincode}</span>
                      </div>
                    </>
                  )}
                  {config?.gstTaxDetails ? (
                    <div className="font-semibold text-gray-900 mt-2 whitespace-pre-line">
                      {config.gstTaxDetails}
                    </div>
                  ) : company?.gstNumber && (
                    <div className="grid grid-cols-[60px_1fr] gap-1 mt-2">
                      <span className="font-semibold text-gray-500">GSTIN</span>
                      <span className="text-gray-900">: {company.gstNumber}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Billed To */}
              <div>
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Billed To</h3>
                <h4 className="text-lg font-black text-gray-900 mb-2">{invoice.vendorName}</h4>
                <div className="text-sm text-gray-600 grid grid-cols-[80px_1fr] gap-y-1 mt-2">
                  {invoice.customerAddress && (
                    <>
                      <span className="font-semibold text-gray-500">Address</span>
                      <span className="text-gray-900 whitespace-pre-line">: {invoice.customerAddress}</span>
                    </>
                  )}
                  {invoice.gstin && (
                    <>
                      <span className="font-semibold text-gray-500">GSTIN</span>
                      <span className="text-gray-900 font-bold">: {invoice.gstin}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="mb-10">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Items</h3>
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-900 text-white font-bold text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 rounded-tl-lg">Description</th>
                    <th className="px-4 py-3 text-center">Qty</th>
                    <th className="px-4 py-3 text-right">Rate</th>
                    <th className="px-4 py-3 text-right rounded-tr-lg">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 border-b-2 border-gray-900">
                  {invoice.items && invoice.items.length > 0 ? (
                    invoice.items.map((item, idx) => (
                      <tr key={idx} className="bg-white hover:bg-gray-50">
                        <td className="px-4 py-4 font-bold text-gray-900 text-base">{item.itemName}</td>
                        <td className="px-4 py-4 text-center text-gray-600 font-bold">{item.quantity}</td>
                        <td className="px-4 py-4 text-right text-gray-600 font-medium">{fmtINR(item.unitPrice)}</td>
                        <td className="px-4 py-4 text-right font-black text-gray-900 text-base">{fmtINR(item.total)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="bg-white">
                      <td className="px-4 py-4 font-bold text-gray-900 text-base">{invoice.notes || 'Procurement Services'}</td>
                      <td className="px-4 py-4 text-center text-gray-600 font-bold">1</td>
                      <td className="px-4 py-4 text-right text-gray-600 font-medium">{fmtINR(totalAmt)}</td>
                      <td className="px-4 py-4 text-right font-black text-gray-900 text-base">{fmtINR(totalAmt)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary & Payment Info */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
              <div className="w-full md:w-1/2">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Payment Details</h3>
                <div className="text-sm grid grid-cols-[120px_1fr] gap-y-2 mt-3">
                  <span className="font-semibold text-gray-500">Payment Method</span>
                  <span className="font-bold text-gray-900">: Bank Transfer / UPI</span>
                  <span className="font-semibold text-gray-500">Transaction ID</span>
                  <span className="font-bold text-gray-900 font-mono">: {`TXN${Math.floor(Date.now() / 1000)}${invoice.id}`}</span>
                </div>
              </div>

              <div className="w-full md:w-80">
                <div className="space-y-3 text-sm bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="flex justify-between text-gray-600">
                    <span className="font-bold uppercase tracking-wider text-xs">Subtotal</span>
                    <span className="font-black text-gray-900">{fmtINR(invoice.subTotal || totalAmt)}</span>
                  </div>
                  {invoice.discount ? (
                    <div className="flex justify-between text-gray-600">
                      <span className="font-bold uppercase tracking-wider text-xs">Discount</span>
                      <span className="font-black text-red-600">-{fmtINR(invoice.discount)}</span>
                    </div>
                  ) : null}
                  {invoice.cgst ? (
                    <div className="flex justify-between text-gray-600">
                      <span className="font-bold uppercase tracking-wider text-xs">CGST</span>
                      <span className="font-black text-gray-900">{fmtINR(invoice.cgst)}</span>
                    </div>
                  ) : null}
                  {invoice.sgst ? (
                    <div className="flex justify-between text-gray-600">
                      <span className="font-bold uppercase tracking-wider text-xs">SGST</span>
                      <span className="font-black text-gray-900">{fmtINR(invoice.sgst)}</span>
                    </div>
                  ) : null}
                  {invoice.igst ? (
                    <div className="flex justify-between text-gray-600">
                      <span className="font-bold uppercase tracking-wider text-xs">IGST</span>
                      <span className="font-black text-gray-900">{fmtINR(invoice.igst)}</span>
                    </div>
                  ) : null}
                  <div className="flex justify-between items-center text-gray-900 pt-3 border-t-2 border-gray-900 mt-3">
                    <span className="font-black uppercase tracking-wider">Total Amount</span>
                    <span className="font-black text-xl text-indigo-700">{fmtINR(totalAmt)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600 pt-3 border-t border-gray-200 mt-3">
                    <span className="font-bold uppercase tracking-wider text-xs">Amount Paid</span>
                    <span className="font-black text-emerald-600">{fmtINR(totalPaid)}</span>
                  </div>
                  <div className="flex justify-between text-xl font-black text-gray-900 pt-3 border-t border-gray-200 mt-2 bg-gray-200 -mx-6 -mb-6 p-6 rounded-b-xl">
                    <span className="uppercase tracking-wider text-sm mt-1">Balance Due</span>
                    <span className={balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}>
                      {fmtINR(balanceDue)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Installments Table */}
            {steps.length > 0 && (
              <div className="mb-10">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-2">Installment Schedule</h3>
                <table className="w-full text-left text-sm border-collapse border border-gray-200 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-600 font-bold text-xs uppercase">
                    <tr>
                      <th className="px-4 py-3">Note</th>
                      <th className="px-4 py-3 text-center">Date</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {steps.map((step, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-3 text-gray-800 font-medium">{step.note}</td>
                        <td className="px-4 py-3 text-center text-gray-600">{step.date}</td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900">{fmtINR(step.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Notes & Footer */}
            <div className="border-t-2 border-gray-900 pt-6 flex justify-between items-end">
              <div className="w-full md:w-2/3">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Terms & Conditions</h3>
                <div className="text-xs text-gray-600 font-medium space-y-1">
                  {config?.termsConditions ? (
                    <div className="whitespace-pre-line leading-relaxed">{config.termsConditions}</div>
                  ) : (
                    <>
                      <p>Thank you for your business.</p>
                      <p>Payment is due within the stipulated time frame.</p>
                    </>
                  )}
                  <p className="mt-4 pt-2 border-t border-gray-200 text-[10px] text-gray-400 font-bold">
                    This is a Computer Generated Document. No signature is Required.<br /> Generated On {new Date().toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                {company?.signatureUrl && <img src={company.signatureUrl} alt="Signature" className="h-16 ml-auto mb-2 object-contain mix-blend-multiply" />}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-50 p-6 flex justify-end gap-4 print:hidden border-t border-gray-200 shadow-sm z-20">
          <button onClick={() => window.close()} className="px-6 py-2.5 rounded-lg font-bold text-sm text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
            <X size={16} /> Close
          </button>
          <button onClick={handleShare} className="px-6 py-2.5 rounded-lg font-bold text-sm bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors shadow-sm flex items-center gap-2">
            <Share2 size={16} /> Share
          </button>
          <button onClick={handlePrint} className="px-6 py-2.5 rounded-lg font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center gap-2">
            <Printer size={16} /> Print / PDF
          </button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;