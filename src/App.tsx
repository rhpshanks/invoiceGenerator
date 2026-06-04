import React, { useState, useRef, useEffect } from 'react';
import { InvoiceData } from './types';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { Dashboard } from './components/Dashboard';
import { Button } from './components/ui/Button';
import { Download, FileText, Printer, Save, LayoutDashboard, ArrowLeft, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export default function App() {
  const previewRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<'dashboard' | 'create'>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  
  useEffect(() => {
    const saved = localStorage.getItem('fbr-invoices');
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse saved invoices");
      }
    }
  }, []);

  const saveInvoices = (newInvoices: InvoiceData[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('fbr-invoices', JSON.stringify(newInvoices));
  };
  
  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const year = format(new Date(), 'yyyy');
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    return `${prefix}-${year}-${randomNum}`;
  };

  const [invoice, setInvoice] = useState<InvoiceData>({
    id: generateUUID(),
    invoiceNumber: generateInvoiceNumber(),
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    type: 'SALES_TAX',
    currency: 'PKR',
    exchangeRate: 280,
    customColumns: [],
    seller: {
      businessName: '',
      address: '',
      ntn: '',
      strn: '',
      contact: ''
    },
    buyer: {
      businessName: '',
      address: '',
      ntn: '',
      strn: '',
      cnic: ''
    },
    items: [
      {
        id: generateUUID(),
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        discount: 0
      }
    ]
  });

  const handleCreateNew = () => {
    setInvoice({
      ...invoice,
      id: generateUUID(),
      invoiceNumber: generateInvoiceNumber(),
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      items: [{
        id: generateUUID(),
        description: '',
        hsnCode: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
        discount: 0
      }]
    });
    setView('create');
  };

  const handleSaveInvoice = () => {
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    let newInvoices = [...invoices];
    if (existingIndex >= 0) {
      newInvoices[existingIndex] = invoice;
    } else {
      newInvoices.push(invoice);
    }
    saveInvoices(newInvoices);
    alert('Invoice saved successfully to dashboard.');
  };

  const handlePrint = () => {
    window.print();
  };

  const exportPDF = async () => {
    if (!previewRef.current) return;
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      let currentWidth = pageWidth;
      let currentHeight = (canvas.height * currentWidth) / canvas.width;
      
      if (currentHeight > pageHeight) {
        currentHeight = pageHeight;
        currentWidth = (canvas.width * currentHeight) / canvas.height;
      }
      
      const x = (pageWidth - currentWidth) / 2;
      
      pdf.addImage(imgData, 'PNG', x, 0, currentWidth, currentHeight);
      pdf.save(`${invoice.invoiceNumber}.pdf`);
    } catch (e) {
      console.error("Error generating PDF", e);
      alert("Failed to export PDF.");
    }
  };

  const exportXML = () => {
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<FBR_eInvoice>
  <Header>
    <InvoiceNumber>${invoice.invoiceNumber}</InvoiceNumber>
    <IssueDate>${invoice.issueDate}</IssueDate>
    <Type>${invoice.type}</Type>
    <Currency>${invoice.currency}</Currency>
    <ExchangeRate>${invoice.exchangeRate}</ExchangeRate>
  </Header>
  <Supplier>
    <NTN>${invoice.seller.ntn}</NTN>
    <STRN>${invoice.seller.strn}</STRN>
    <Name>${invoice.seller.businessName}</Name>
  </Supplier>
  <Buyer>
    <NTN>${invoice.buyer.ntn}</NTN>
    <STRN>${invoice.buyer.strn}</STRN>
    <Name>${invoice.buyer.businessName}</Name>
  </Buyer>
  <Items>
${invoice.items.map(item => `    <Item>
      <Description>${item.description}</Description>
      <HSN>${item.hsnCode}</HSN>
      <Quantity>${item.quantity}</Quantity>
      <UnitPrice>${item.unitPrice}</UnitPrice>
      <Discount>${item.discount}</Discount>
      <TaxRate>${item.taxRate}</TaxRate>
${invoice.customColumns?.map(col => `      <CustomColumn name="${col}">${item.customColumns?.[col] || ''}</CustomColumn>`).join('\n')}
    </Item>`).join('\n')}
  </Items>
</FBR_eInvoice>`;

    const blob = new Blob([xmlData], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${invoice.invoiceNumber}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Add styles to hide app chrome during printing
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        #printable-preview, #printable-preview * {
          visibility: visible;
        }
        #printable-preview {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
          <div className="bg-white text-blue-900 p-2 rounded-md">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold leading-tight">FBR-Compliant Invoice Generator</h1>
            <p className="text-xs text-blue-200">SOP-INV-001 | Pakistan Sales Tax Rules 2006</p>
          </div>
          
          <div className="flex-1 flex justify-end gap-3 items-center">
            {view === 'create' ? (
              <>
                <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-blue-800" onClick={() => setView('dashboard')}>
                  <LayoutDashboard className="h-5 w-5 mr-2" /> Dashboard
                </Button>
                <div className="h-6 w-px bg-blue-700 mx-2"></div>
                <Button variant="outline" className="bg-blue-800 text-white border-blue-700 hover:bg-blue-700 hover:text-white" onClick={handleSaveInvoice}>
                  <Save className="h-5 w-5 mr-2" /> Save Invoice
                </Button>
                <Button variant="outline" className="bg-blue-800 text-white border-blue-700 hover:bg-blue-700 hover:text-white" onClick={handlePrint}>
                  <Printer className="h-5 w-5 mr-2" /> Print
                </Button>
                <Button variant="outline" className="bg-blue-800 text-white border-blue-700 hover:bg-blue-700 hover:text-white" onClick={exportXML}>
                  <FileText className="h-5 w-5 mr-2" /> IRIS XML
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={exportPDF}>
                  <Download className="h-5 w-5 mr-2" /> Download PDF
                </Button>
              </>
            ) : (
               <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2" onClick={handleCreateNew}>
                 <Plus className="h-5 w-5" /> Create Invoice
               </Button>
            )}
          </div>
        </div>
      </header>
      
      {view === 'dashboard' ? (
        <main className="flex-1 overflow-y-auto">
          <Dashboard 
            invoices={invoices} 
            onCreateNew={handleCreateNew} 
            onViewInvoice={(inv) => { setInvoice(inv); setView('create'); }}
          />
        </main>
      ) : (
        <main className="flex-1 flex w-full max-w-[1600px] mx-auto p-4 gap-6 items-start">
          {/* Left Side - Form */}
          <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
             <InvoiceForm data={invoice} onChange={setInvoice} />
          </div>
          
          {/* Right Side - Preview */}
          <div className="w-1/2 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 100px)' }}>
            <div className="sticky top-0 bg-gray-50 pb-4 z-10 flex justify-between items-center border-b border-gray-200 mb-4">
               <h2 className="text-lg font-semibold text-gray-800">Live Preview</h2>
               <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded border border-green-200">
                 Audit Ready
               </span>
            </div>
            <div id="printable-preview" className="shadow-2xl rounded-sm overflow-hidden bg-white mx-auto transform origin-top left" style={{ scale: '0.90' }}>
              <InvoicePreview data={invoice} ref={previewRef} />
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
