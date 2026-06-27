import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Printer, Share2, X } from 'lucide-react';
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

interface PaymentStep {
  note: string;
  date: string;
  amount: number;
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
}


export function Receipt() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState<VendorInvoice | null>(null);
  const [company, setCompany] = useState<CompanyProfile | null>(null);
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

  // ── Helpers ───────────────────────────────────────────────
  const fmtINR = (amt: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amt || 0);

  // Parse payment installment steps
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

  // ── Print ─────────────────────────────────────────────────
  const handlePrint = () => window.print();

  const handleShare = async () => {
    const element = document.getElementById('receipt-content');
    if (!element) return;
    const opt = {
      margin: 0.5,
      filename: `Receipt_${invoiceRef}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' as const }
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

  return (
    <div className="min-h-screen bg-background p-4 font-sans print:bg-white print:p-0">
      <div className="max-w-3xl mx-auto bg-white text-black shadow-2xl rounded-sm overflow-hidden print:shadow-none print:w-full print:max-w-none">

        {/* ── Receipt Content ── */}
        <div id="receipt-content" className="p-8 print:p-6">

          {/* Title */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold uppercase tracking-widest border-b-2 border-black pb-2 inline-block text-black">
              Online Payment Receipt
            </h1>
          </div>

          {/* Company */}
          <div className="text-center mb-6">
            {company?.logoUrl && <img src={company.logoUrl} alt="Logo" className="h-12 mx-auto mb-2" />}
            <h2 className="text-lg font-bold uppercase text-indigo-700">{company?.companyName || 'COMPANY'}</h2>
            {company?.email && <p className="text-xs text-gray-505">{company.email}</p>}
          </div>

          {/* Meta info grid */}
          <div className="border border-black text-sm text-black">
            <div className="grid grid-cols-2 border-b border-black">
              <div className="p-2 border-r border-black">
                <span className="text-gray-500 font-medium">Requirement Number:</span>
                <span className="font-bold text-black ml-2">REQ-{invoice.requirementId || 'N/A'}</span>
              </div>
              <div className="p-2">
                <span className="text-gray-505 font-medium">Invoice Ref:</span>
                <span className="font-bold text-black ml-2">{invoiceRef}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
              <div className="p-2 border-r border-black">
                <span className="text-gray-505 font-medium">Vendor Name:</span>
                <span className="font-bold text-black ml-2">{invoice.vendorName}</span>
              </div>
              <div className="p-2">
                <span className="text-gray-505 font-medium">Due Date:</span>
                <span className="font-bold text-black ml-2">{invoice.dueDate}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 border-b border-black">
              <div className="p-2 border-r border-black">
                <span className="text-gray-505 font-medium">Receipt No:</span>
                <span className="font-bold text-black ml-2">{invoice.id}</span>
              </div>
              <div className="p-2">
                <span className="text-gray-505 font-medium">Date Paid:</span>
                <span className="font-bold text-black ml-2">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Table Header */}
            <div className="grid grid-cols-12 border-b border-black bg-gray-200 font-bold text-black text-center">
              <div className="col-span-1 p-2 border-r border-black">S.NO</div>
              <div className="col-span-8 p-2 border-r border-black text-left">ACCOUNT HEAD</div>
              <div className="col-span-3 p-2">AMOUNT</div>
            </div>

            {/* ── Installment rows ── */}
            {steps.length > 0 ? (
              steps.map((step, idx) => (
                <div key={idx} className="grid grid-cols-12 border-b border-black text-black" style={{ contentVisibility: 'auto' }}>
                  <div className="col-span-1 p-2 border-r border-black text-center font-bold">{idx + 1}</div>
                  <div className="col-span-8 p-2 border-r border-black">
                    <div className="font-bold text-black">{step.note} — {invoiceRef}</div>
                    <div className="text-xs text-gray-505 mt-0.5">Date: {step.date}</div>
                    <div className="text-xs text-gray-505 leading-tight mt-1">
                      <p>Billing Invoicer: {company?.companyName}</p>
                      {company?.gstNumber && <p>GSTIN: {company.gstNumber}</p>}
                    </div>
                  </div>
                  <div className="col-span-3 p-2 text-right font-bold text-black">
                    {fmtINR(step.amount)}
                  </div>
                </div>
              ))
            ) : (
              /* Fallback: no installment history — single row */
              <div className="grid grid-cols-12 border-b border-black min-h-[100px] text-black">
                <div className="col-span-1 p-2 border-r border-black text-center font-bold">1</div>
                <div className="col-span-8 p-2 border-r border-black">
                  <div className="font-bold text-black mb-2">{invoice.notes || 'Procurement Services'}</div>
                  <div className="text-xs text-gray-700 leading-tight font-medium">
                    <p>Billing Invoicer: {company?.companyName}</p>
                    <p>Address: {company?.addressLine1} {company?.city} {company?.state} {company?.pincode}</p>
                    {company?.gstNumber && <p>GSTIN: {company.gstNumber}</p>}
                  </div>
                </div>
                <div className="col-span-3 p-2 text-right font-bold text-black">
                  {fmtINR(totalPaid || totalAmt)}
                </div>
              </div>
            )}

            {/* Total row */}
            <div className="grid grid-cols-12 text-black">
              <div className="col-span-9 p-2 border-r border-black text-right font-black">Total :</div>
              <div className="col-span-3 p-2 text-right font-black">
                {fmtINR(totalPaid || totalAmt)}
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="border border-black border-t-0 mt-0 p-2 text-xs flex justify-between text-gray-500 font-medium">
            <span>*Terms &amp; Conditions Apply</span>
            <span>*Payment subject to realization</span>
          </div>
          <div className="border border-black border-t-0 p-2 text-xs text-center font-bold text-black">
            This is a Computer Generated Receipt. No signature is Required. Generated On {new Date().toLocaleString()}
          </div>

          {/* Account Summary Ledger */}
          <div className="mt-6 border border-black text-sm text-black">
            <div className="bg-gray-200 border-b border-black p-1 font-black uppercase text-xs text-center text-black">
              Account Summary (Ledger)
            </div>
            <div className="grid grid-cols-3">
              <div className="p-2 border-r border-black flex justify-between font-medium">
                <span className="text-gray-500">Total Amount:</span>
                <span className="font-bold text-black">{fmtINR(totalAmt)}</span>
              </div>
              <div className="p-2 border-r border-black flex justify-between font-medium">
                <span className="text-gray-505">Paid So Far:</span>
                <span className="font-bold text-green-700">{fmtINR(totalPaid)}</span>
              </div>
              <div className="p-2 flex justify-between font-medium">
                <span className="text-gray-505">Balance Due:</span>
                <span className={`font-bold ${balanceDue > 0 ? 'text-red-650' : 'text-green-700'}`}>
                  {fmtINR(balanceDue)}
                </span>
              </div>
            </div>

            {/* Installment summary if multiple */}
            {steps.length > 1 && (
              <div className="border-t border-black">
                <div className="bg-gray-100 border-b border-gray-300 p-1.5 text-xs font-bold text-gray-505 uppercase">
                  Payment Installment Summary ({steps.length} payments)
                </div>
                <div className="grid grid-cols-3 text-xs">
                  {steps.map((step, idx) => (
                    <div key={idx} className={`p-2 flex justify-between ${idx < steps.length - 1 ? 'border-r border-gray-300' : ''}`}>
                      <span className="text-gray-505">#{idx + 1} {step.note}:</span>
                      <span className="font-bold">{fmtINR(step.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-accent p-4 flex justify-center gap-4 print:hidden border-t border-gray-200">
          <button onClick={handlePrint} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded-full font-semibold transition-colors cursor-pointer text-xs sm:text-sm">
            <Printer size={18} /> PRINT
          </button>
          <button onClick={handleShare} className="flex items-center gap-2 bg-muted hover:bg-slate-400 text-foreground px-6 py-2 rounded-full font-semibold transition-colors cursor-pointer text-xs sm:text-sm">
            <Share2 size={18} /> SHARE
          </button>
          <button onClick={() => window.close()} className="flex items-center gap-2 bg-muted hover:bg-slate-400 text-foreground px-6 py-2 rounded-full font-semibold transition-colors cursor-pointer text-xs sm:text-sm">
            <X size={18} /> CLOSE
          </button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;