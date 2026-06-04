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
  } : {};

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
      
      <div className="mt-16 pt-8 border-t border-gray-200 text-xs text-gray-500 text-center shrink-0">
        This is a computer-generated document and does not require a physical signature.
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';
