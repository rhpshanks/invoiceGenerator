import React, { forwardRef } from 'react';
import { InvoiceData } from '../types';
import { QRCodeSVG } from 'qrcode.react';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ data }, ref) => {
  const calculateSubtotal = () => {
    return data.items.reduce((sum, item) => sum + ((item.quantity * item.unitPrice) - item.discount), 0);
  };

  const calculateTax = () => {
    return data.items.reduce((sum, item) => {
      const lineTotal = (item.quantity * item.unitPrice) - item.discount;
      return sum + (lineTotal * (item.taxRate / 100));
    }, 0);
  };

  const calculateWht = () => {
    if (data.type !== 'WITHHOLDING' || !data.whtRate) return 0;
    const subtotal = calculateSubtotal();
    return subtotal * (data.whtRate / 100);
  };

  const subtotal = calculateSubtotal();
  const taxTotal = calculateTax();
  const whtTotal = calculateWht();
  const grandTotal = subtotal + taxTotal - whtTotal;

  // Build QR Data with invoice number, date, NTN, and total amount
  const qrData = `Invoice No: ${data.invoiceNumber}\nDate: ${data.issueDate}\nNTN: ${data.seller.ntn}\nTotal Amount: ${data.currency} ${grandTotal.toFixed(2)}`;

  const getInvoiceTitle = (type: string) => {
    switch (type) {
      case 'SALES_TAX': return 'SALES TAX INVOICE';
      case 'SIMPLIFIED': return 'SIMPLIFIED TAX INVOICE';
      case 'DEBIT_NOTE': return 'DEBIT NOTE';
      case 'CREDIT_NOTE': return 'CREDIT NOTE';
      case 'EXPORT': return 'EXPORT INVOICE (ZERO RATED)';
      case 'WITHHOLDING': return 'WITHHOLDING TAX INVOICE';
      default: return 'INVOICE';
    }
  };

  const letterheadStyle = data.letterhead ? {
    backgroundImage: `url(${data.letterhead})`,
    backgroundSize: '100% 100%',
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    paddingBottom: '140px', // Shift bottom calculations and footer up
  } : {};

  const template = data.template || 'standard';

  if (template === 'modern') {
    return (
      <div 
        ref={ref} 
        className="bg-slate-50 p-10 w-[794px] min-h-[1123px] max-w-full mx-auto text-slate-800 border border-gray-200 print:w-[210mm] print:h-[297mm] print:border-none print:shadow-none shadow-xl print:p-0 flex flex-col box-border relative font-sans"
        style={letterheadStyle}
      >
        <div className="bg-gradient-to-r from-indigo-600 to-blue-500 text-white p-8 rounded-2xl mb-8 shadow-lg shrink-0" style={data.letterhead ? { marginTop: '160px' } : {}}>
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">{getInvoiceTitle(data.type)}</h1>
              <div className="text-blue-100 space-y-1 mt-4">
                <p><span className="font-medium text-white opacity-80">Invoice No:</span> {data.invoiceNumber}</p>
                <p><span className="font-medium text-white opacity-80">Issue Date:</span> {data.issueDate}</p>
                {data.dueDate && <p><span className="font-medium text-white opacity-80">Due Date:</span> {data.dueDate}</p>}
                {(data.type === 'DEBIT_NOTE' || data.type === 'CREDIT_NOTE') && <p><span className="font-medium text-white opacity-80">Original Ref:</span> {data.originalInvoiceRef}</p>}
                {data.type === 'CREDIT_NOTE' && <p><span className="font-medium text-white opacity-80">Reason Code:</span> {data.reasonCode}</p>}
                {data.type === 'EXPORT' && <p><span className="font-medium text-white opacity-80">GD Number:</span> {data.gdNumber}</p>}
                {data.type === 'WITHHOLDING' && <p><span className="font-medium text-white opacity-80">WHT Sec:</span> {data.whtSection} @ {data.whtRate}%</p>}
              </div>
            </div>
            <div className="bg-white p-2 rounded-xl shadow-inner">
              <QRCodeSVG value={qrData} size={90} level="M" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-8 text-sm shrink-0">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-indigo-600 mb-3 uppercase tracking-wider text-xs">Supplier Details</h3>
            <p className="font-bold text-lg text-slate-900 mb-2">{data.seller.businessName || 'Business Name'}</p>
            <p className="whitespace-pre-wrap text-slate-600 mb-3">{data.seller.address}</p>
            <div className="space-y-1.5 text-slate-500">
              <p><span className="font-medium text-slate-700">NTN:</span> {data.seller.ntn}</p>
              <p><span className="font-medium text-slate-700">STRN:</span> {data.seller.strn}</p>
              {data.seller.contact && <p><span className="font-medium text-slate-700">Contact:</span> {data.seller.contact}</p>}
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-bold text-indigo-600 mb-3 uppercase tracking-wider text-xs">Buyer Details</h3>
            <p className="font-bold text-lg text-slate-900 mb-2">{data.buyer.businessName || 'Buyer Name'}</p>
            <p className="whitespace-pre-wrap text-slate-600 mb-3">{data.buyer.address}</p>
            <div className="space-y-1.5 text-slate-500">
              {data.type !== 'SIMPLIFIED' ? (
                <>
                  <p><span className="font-medium text-slate-700">NTN:</span> {data.buyer.ntn}</p>
                  <p><span className="font-medium text-slate-700">STRN:</span> {data.buyer.strn}</p>
                </>
              ) : (
                data.buyer.cnic && <p><span className="font-medium text-slate-700">CNIC:</span> {data.buyer.cnic}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-8 flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-semibold">
              <tr>
                <th className="p-4 text-center w-12 border-b border-slate-100">#</th>
                <th className="p-4 border-b border-slate-100">Description</th>
                {data.customColumns?.map(col => <th key={col} className="p-4 border-b border-slate-100">{col}</th>)}
                <th className="p-4 text-right border-b border-slate-100">Qty</th>
                <th className="p-4 text-right border-b border-slate-100">Price</th>
                <th className="p-4 text-right border-b border-slate-100">Tax</th>
                <th className="p-4 text-right border-b border-slate-100">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.items.map((item, idx) => {
                const lineValue = (item.quantity * item.unitPrice) - item.discount;
                const lineTax = lineValue * (item.taxRate / 100);
                const lineTotal = lineValue + lineTax;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center text-slate-500 font-medium">{idx + 1}</td>
                    <td className="p-4 font-medium text-slate-900">{item.description}</td>
                    {data.customColumns?.map(col => <td key={col} className="p-4 text-slate-600">{item.customColumns?.[col] || ''}</td>)}
                    <td className="p-4 text-right text-slate-600">{item.quantity}</td>
                    <td className="p-4 text-right text-slate-600">{item.unitPrice.toFixed(2)}</td>
                    <td className="p-4 text-right text-slate-600">{item.taxRate}%</td>
                    <td className="p-4 text-right font-bold text-slate-900">{lineTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end text-sm shrink-0">
          <div className="w-80 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal ({data.currency})</span>
              <span className="font-semibold text-slate-900">{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Sales Tax ({data.currency})</span>
              <span className="font-semibold text-slate-900">{taxTotal.toFixed(2)}</span>
            </div>
            {data.type === 'WITHHOLDING' && (
              <div className="flex justify-between text-rose-500">
                <span>WHT ({data.whtRate}%)</span>
                <span className="font-semibold">-{whtTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-lg">
                <span className="font-bold text-slate-900">Total</span>
                <span className="font-extrabold text-indigo-600 text-xl">{data.currency} {grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-between items-end shrink-0">
          {data.notes ? (
            <div className="w-1/2 p-4 bg-white rounded-xl shadow-sm border border-slate-100 mt-8">
              <h4 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">Notes & Terms</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap">{data.notes}</p>
            </div>
          ) : <div />}
        </div>
        
        <div className="mt-8 pt-6 border-t border-slate-200 text-xs text-slate-400 text-center shrink-0">
          Generated via InvoiceDoctor • Computer-generated document • No signature required
        </div>
      </div>
    );
  }

  if (template === 'minimal') {
    return (
      <div 
        ref={ref} 
        className="bg-white p-12 w-[794px] min-h-[1123px] max-w-full mx-auto text-gray-800 print:w-[210mm] print:h-[297mm] print:border-none shadow-md print:shadow-none print:p-8 flex flex-col box-border relative font-sans"
        style={letterheadStyle}
      >
        <div className="flex justify-between items-end mb-16 shrink-0" style={data.letterhead ? { marginTop: '160px' } : {}}>
          <div>
            <h1 className="text-3xl font-light tracking-widest text-gray-900 mb-1">{getInvoiceTitle(data.type)}</h1>
            <p className="text-sm text-gray-400">#{data.invoiceNumber} • Issued: {data.issueDate}{data.dueDate ? ` • Due: ${data.dueDate}` : ''}</p>
          </div>
          <QRCodeSVG value={qrData} size={64} level="M" fgColor="#374151" />
        </div>

        <div className="flex justify-between mb-16 text-sm shrink-0">
          <div className="w-5/12 space-y-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">From</h3>
            <p className="font-medium text-base text-gray-900">{data.seller.businessName || 'Business Name'}</p>
            <p className="text-gray-500 whitespace-pre-wrap">{data.seller.address}</p>
            <p className="text-gray-500 pt-2">NTN: {data.seller.ntn} • STRN: {data.seller.strn}</p>
          </div>
          <div className="w-5/12 space-y-1 text-right">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">To</h3>
            <p className="font-medium text-base text-gray-900">{data.buyer.businessName || 'Buyer Name'}</p>
            <p className="text-gray-500 whitespace-pre-wrap">{data.buyer.address}</p>
            {data.type !== 'SIMPLIFIED' ? (
              <p className="text-gray-500 pt-2">NTN: {data.buyer.ntn} • STRN: {data.buyer.strn}</p>
            ) : data.buyer.cnic && (
              <p className="text-gray-500 pt-2">CNIC: {data.buyer.cnic}</p>
            )}
          </div>
        </div>

        <div className="mb-16 flex-1">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-900 text-gray-900">
                <th className="py-3 text-left font-semibold">Description</th>
                {data.customColumns?.map(col => <th key={col} className="py-3 text-left font-semibold">{col}</th>)}
                <th className="py-3 text-right font-semibold">Qty</th>
                <th className="py-3 text-right font-semibold">Price</th>
                <th className="py-3 text-right font-semibold">Tax</th>
                <th className="py-3 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => {
                const lineValue = (item.quantity * item.unitPrice) - item.discount;
                const lineTax = lineValue * (item.taxRate / 100);
                const lineTotal = lineValue + lineTax;
                return (
                  <tr key={item.id} className="border-b border-gray-100">
                    <td className="py-4 font-medium text-gray-900">{item.description}</td>
                    {data.customColumns?.map(col => <td key={col} className="py-4 text-gray-500">{item.customColumns?.[col] || ''}</td>)}
                    <td className="py-4 text-right text-gray-500">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-500">{item.unitPrice.toFixed(2)}</td>
                    <td className="py-4 text-right text-gray-500">{item.taxRate}%</td>
                    <td className="py-4 text-right font-medium text-gray-900">{lineTotal.toFixed(2)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end text-sm shrink-0">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span>{taxTotal.toFixed(2)}</span>
            </div>
            {data.type === 'WITHHOLDING' && (
              <div className="flex justify-between text-gray-500">
                <span>WHT</span>
                <span>-{whtTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-gray-900 pt-3 text-base">
              <span className="font-semibold text-gray-900">{data.currency}</span>
              <span className="font-semibold text-gray-900">{grandTotal.toFixed(2)}</span>
            </div>
          </div>
        <div className="flex justify-between items-end shrink-0 mt-12">
          {data.notes ? (
            <div className="w-1/2 pr-8">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Notes</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{data.notes}</p>
            </div>
          ) : <div />}
        </div>
      </div>
    );
  }

  // STANDARD TEMPLATE (Fallback)
  return (
    <div 
      ref={ref} 
      className="bg-white p-10 w-[794px] min-h-[1123px] max-w-full mx-auto text-black border border-gray-200 print:w-[210mm] print:h-[297mm] print:border-none print:shadow-none shadow-lg print:p-8 flex flex-col box-border relative"
      style={letterheadStyle}
    >
      <div 
        className="flex justify-between items-start mb-8 border-b-2 border-black pb-6 shrink-0"
        style={data.letterhead ? { marginTop: '160px' } : {}}
      >
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wider mb-2">{getInvoiceTitle(data.type)}</h1>
          <div className="text-sm space-y-1 mt-4">
            <p><span className="font-semibold">Invoice No:</span> {data.invoiceNumber}</p>
            <p><span className="font-semibold">Issue Date:</span> {data.issueDate}</p>
            {data.dueDate && <p><span className="font-semibold">Due Date:</span> {data.dueDate}</p>}
            {(data.type === 'DEBIT_NOTE' || data.type === 'CREDIT_NOTE') && (
               <p><span className="font-semibold">Original Ref:</span> {data.originalInvoiceRef}</p>
            )}
             {data.type === 'CREDIT_NOTE' && (
               <p><span className="font-semibold">Reason Code:</span> {data.reasonCode}</p>
            )}
             {data.type === 'EXPORT' && (
               <p><span className="font-semibold">GD Number:</span> {data.gdNumber}</p>
            )}
             {data.type === 'WITHHOLDING' && (
               <p><span className="font-semibold">WHT Sec:</span> {data.whtSection} @ {data.whtRate}%</p>
            )}
          </div>
        </div>
        <div className="text-right">
          <QRCodeSVG value={qrData} size={100} level="M" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8 text-sm shrink-0">
        <div>
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-2">SUPPLIER DETAILS</h3>
          <p className="font-bold text-lg">{data.seller.businessName || 'Business Name'}</p>
          <p className="whitespace-pre-wrap">{data.seller.address}</p>
          <div className="mt-2 space-y-1">
            <p><span className="font-semibold">NTN:</span> {data.seller.ntn}</p>
            <p><span className="font-semibold">STRN:</span> {data.seller.strn}</p>
            {data.seller.contact && <p><span className="font-semibold">Contact:</span> {data.seller.contact}</p>}
          </div>
        </div>
        <div>
          <h3 className="font-bold border-b border-gray-300 pb-1 mb-2">BUYER DETAILS</h3>
          <p className="font-bold text-lg">{data.buyer.businessName || 'Buyer Name'}</p>
          <p className="whitespace-pre-wrap">{data.buyer.address}</p>
           <div className="mt-2 space-y-1">
            {data.type !== 'SIMPLIFIED' ? (
              <>
                <p><span className="font-semibold">NTN:</span> {data.buyer.ntn}</p>
                <p><span className="font-semibold">STRN:</span> {data.buyer.strn}</p>
              </>
            ) : (
                data.buyer.cnic && <p><span className="font-semibold">CNIC:</span> {data.buyer.cnic}</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-8 flex-1">
        <table className="w-full text-sm border-collapse border border-gray-400">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="border border-gray-400 p-2 text-center w-10">S.No</th>
              <th className="border border-gray-400 p-2">Description</th>
              {data.customColumns?.map(col => (
                <th key={col} className="border border-gray-400 p-2">{col}</th>
              ))}
              <th className="border border-gray-400 p-2 text-right">Qty</th>
              <th className="border border-gray-400 p-2 text-right">Unit Price</th>
              <th className="border border-gray-400 p-2 text-right">Value excl. Tax</th>
              <th className="border border-gray-400 p-2 text-right">Tax %</th>
              <th className="border border-gray-400 p-2 text-right">Sales Tax</th>
              <th className="border border-gray-400 p-2 text-right">Total incl. Tax</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => {
              const lineValue = (item.quantity * item.unitPrice) - item.discount;
              const lineTax = lineValue * (item.taxRate / 100);
              const lineTotal = lineValue + lineTax;

              return (
                <tr key={item.id}>
                  <td className="border border-gray-400 p-2 text-center">{idx + 1}</td>
                  <td className="border border-gray-400 p-2">{item.description}</td>
                  {data.customColumns?.map(col => (
                    <td key={col} className="border border-gray-400 p-2">{item.customColumns?.[col] || ''}</td>
                  ))}
                  <td className="border border-gray-400 p-2 text-right">{item.quantity}</td>
                  <td className="border border-gray-400 p-2 text-right">{item.unitPrice.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-right">{lineValue.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-right">{item.taxRate}%</td>
                  <td className="border border-gray-400 p-2 text-right">{lineTax.toFixed(2)}</td>
                  <td className="border border-gray-400 p-2 text-right font-semibold">{lineTotal.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-end text-sm shrink-0">
        <div className="w-80 space-y-2">
          <div className="flex justify-between border-b border-gray-200 pb-1">
            <span>Total Value Excl. Tax ({data.currency})</span>
            <span className="font-semibold">{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-1">
            <span>Total Sales Tax ({data.currency})</span>
            <span className="font-semibold">{taxTotal.toFixed(2)}</span>
          </div>
          {data.type === 'WITHHOLDING' && (
            <div className="flex justify-between border-b border-gray-200 pb-1 text-red-600">
              <span>WHT Deducted ({data.whtRate}%) ({data.currency})</span>
              <span className="font-semibold">-{whtTotal.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between border-t-2 border-black pt-2 text-lg font-bold">
            <span>GRAND TOTAL ({data.currency})</span>
            <span>{grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between items-end shrink-0 mt-8">
        {data.notes ? (
          <div className="w-1/2 p-4 border border-gray-300 bg-gray-50">
            <h4 className="font-bold border-b border-gray-300 pb-1 mb-2 text-sm">NOTES & TERMS</h4>
            <p className="text-sm whitespace-pre-wrap">{data.notes}</p>
          </div>
        ) : <div />}
      </div>
      
      <div className="mt-8 pt-8 border-t border-gray-200 text-xs text-gray-500 text-center shrink-0">
        This is a computer-generated document and does not require a physical signature.
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';
