import React, { useState, useRef, useEffect } from 'react';
import { InvoiceData, SubscriptionPlan, SavedClient, SavedProfile } from './types';
import { InvoiceForm } from './components/InvoiceForm';
import { InvoicePreview } from './components/InvoicePreview';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Button } from './components/ui/Button';
import { FileText, Save, Settings as SettingsIcon, LogOut, Moon, Sun, Mail, Stethoscope, Sparkles, Zap, Shield, LayoutDashboard, Printer, Download, Plus, ArrowLeft, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { PricingModal } from './components/PricingModal';
import { supabase } from './supabase';
import { AuthModal } from './components/AuthModal';
import { ProofsModal } from './components/ProofsModal';
import { CheckoutModal } from './components/CheckoutModal';

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
  const [view, setView] = useState<'dashboard' | 'create' | 'settings'>('dashboard');
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [subscriptionPlan, setSubscriptionPlan] = useState<SubscriptionPlan>('STARTER');
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [guestSavesCount, setGuestSavesCount] = useState<number>(0);
  const [guestCooldownUntil, setGuestCooldownUntil] = useState<number | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<string | null>(null);
  const [selectedProofInvoice, setSelectedProofInvoice] = useState<InvoiceData | null>(null);
  const [checkoutPlan, setCheckoutPlan] = useState<{ planName: string; planPrice: number } | null>(null);

  // Load Auth Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Hydrate guest limits from localStorage
  useEffect(() => {
    const saves = parseInt(localStorage.getItem('fbr-guest-saves') || '0', 10);
    const cooldown = parseInt(localStorage.getItem('fbr-guest-cooldown') || '0', 10);
    setGuestSavesCount(saves);
    if (cooldown > Date.now()) {
      setGuestCooldownUntil(cooldown);
    } else if (cooldown !== 0) {
      localStorage.removeItem('fbr-guest-cooldown');
      localStorage.setItem('fbr-guest-saves', '0');
      setGuestSavesCount(0);
    }
  }, []);

  // Manage cooldown countdown timer
  useEffect(() => {
    if (!guestCooldownUntil) {
      setCooldownRemaining(null);
      return;
    }
    
    // Immediate calculation so it doesn't wait 1s to show
    const updateTimer = () => {
      const now = Date.now();
      if (now >= guestCooldownUntil) {
        setGuestCooldownUntil(null);
        setCooldownRemaining(null);
        setGuestSavesCount(0);
        localStorage.removeItem('fbr-guest-cooldown');
        localStorage.setItem('fbr-guest-saves', '0');
      } else {
        const diff = guestCooldownUntil - now;
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setCooldownRemaining(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
      }
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [guestCooldownUntil]);

  // Fetch subscription plan from Supabase
  const fetchSubscription = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setSubscriptionPlan(data.plan as SubscriptionPlan);
      } else {
        await supabase
          .from('user_subscriptions')
          .insert({ user_id: userId, plan: 'STARTER' });
        setSubscriptionPlan('STARTER');
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSubscription(user.id);
    } else {
      const saved = localStorage.getItem('fbr-subscription-plan');
      setSubscriptionPlan((saved as SubscriptionPlan) || 'STARTER');
    }
  }, [user]);

  const handleSelectPlan = async (plan: SubscriptionPlan, planName: string, price: number) => {
    if (plan === 'STARTER') {
      setSubscriptionPlan(plan);
      localStorage.setItem('fbr-subscription-plan', plan);

      if (user) {
        try {
          const { error } = await supabase
            .from('user_subscriptions')
            .upsert({ user_id: user.id, plan, updated_at: new Date().toISOString() });
          if (error) throw error;
        } catch (err) {
          console.error("Error updating subscription:", err);
        }
      }
    } else {
      setCheckoutPlan({ planName, planPrice: price });
    }
  };

  // Fetch invoices from Supabase
  const fetchInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        const mappedInvoices = data.map(row => ({
          ...row.data,
          id: row.id
        }));
        setInvoices(mappedInvoices);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchInvoices();
    } else {
      const saved = localStorage.getItem('fbr-invoices');
      if (saved) {
        try {
          setInvoices(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse saved invoices");
        }
      }
    }
  }, [user]);

  const saveInvoices = (newInvoices: InvoiceData[]) => {
    setInvoices(newInvoices);
    localStorage.setItem('fbr-invoices', JSON.stringify(newInvoices));
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setInvoices([]);
    const saved = localStorage.getItem('fbr-invoices');
    if (saved) {
      try {
        setInvoices(JSON.parse(saved));
      } catch (e) {}
    }
  };
  
  const generateInvoiceNumber = () => {
    const prefix = 'INV';
    const year = format(new Date(), 'yyyy');
    
    const currentYearInvoices = invoices.filter(inv => inv.invoiceNumber.startsWith(`${prefix}-${year}-`));
    if (currentYearInvoices.length > 0) {
      const numbers = currentYearInvoices.map(inv => {
        const parts = inv.invoiceNumber.split('-');
        return parseInt(parts[2], 10) || 0;
      });
      const maxNum = Math.max(...numbers);
      return `${prefix}-${year}-${String(maxNum + 1).padStart(6, '0')}`;
    }
    
    return `${prefix}-${year}-000001`;
  };

  const [invoice, setInvoice] = useState<InvoiceData>({
    id: generateUUID(),
    invoiceNumber: '', // Will be set correctly when handleCreateNew is called
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    status: 'DRAFT',
    type: 'SALES_TAX',
    currency: 'PKR',
    exchangeRate: 280,
    template: 'standard',
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
    if (!user && guestCooldownUntil && guestCooldownUntil > Date.now()) {
      alert(`Guest limit reached. Please wait ${cooldownRemaining} or Sign In.`);
      return;
    }
    if (subscriptionPlan === 'STARTER' && invoices.length >= 5) {
      setIsPricingOpen(true);
      return;
    }
    setInvoice({
      ...invoice,
      id: generateUUID(),
      invoiceNumber: generateInvoiceNumber(),
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'DRAFT',
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

  const handleUpdateInvoice = async (updated: InvoiceData) => {
    await upsertInvoice(updated);
  };

  const handleDuplicate = (inv: InvoiceData) => {
    if (!user && guestCooldownUntil && guestCooldownUntil > Date.now()) {
      alert(`Guest limit reached. Please wait ${cooldownRemaining} or Sign In.`);
      return;
    }
    if (subscriptionPlan === 'STARTER' && invoices.length >= 5) {
      setIsPricingOpen(true);
      return;
    }
    const dup = {
      ...inv,
      id: generateUUID(),
      invoiceNumber: generateInvoiceNumber(),
      issueDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      status: 'DRAFT' as const
    };
    setInvoice(dup);
    setView('create');
  };

  const handleLoadDemoData = () => {
    setInvoice({
      ...invoice,
      seller: {
        businessName: 'AeroTech Solutions',
        address: 'Office 402, 4th Floor, Evacuee Trust Complex, F-5/1, Islamabad',
        ntn: '1234567-8',
        strn: '32-77-8765-432-11',
        contact: '+92 51 111-222-333'
      },
      buyer: {
        businessName: 'Global Prime Industries',
        address: 'Plot 12, Sector 15, Korangi Industrial Area, Karachi',
        ntn: '7654321-0',
        strn: '12-34-5678-901-23',
        cnic: ''
      },
      items: [
        {
          id: generateUUID(),
          description: 'Enterprise Cloud Hosting Subscription',
          hsnCode: '8523.5100',
          quantity: 12,
          unitPrice: 25000,
          taxRate: 18,
          discount: 0
        },
        {
          id: generateUUID(),
          description: 'Professional IT Consulting Services',
          hsnCode: '9983.1100',
          quantity: 5,
          unitPrice: 85000,
          taxRate: 18,
          discount: 0
        }
      ]
    });
  };

  const upsertInvoice = async (targetInvoice: InvoiceData) => {
    // Extract and save profiles and clients
    try {
      const profilesRaw = localStorage.getItem('fbr-profiles');
      const profiles: SavedProfile[] = profilesRaw ? JSON.parse(profilesRaw) : [];
      if (targetInvoice.seller.businessName) {
        const pIdx = profiles.findIndex(p => p.businessName === targetInvoice.seller.businessName);
        if (pIdx >= 0) profiles[pIdx] = { ...profiles[pIdx], ...targetInvoice.seller };
        else profiles.push({ ...targetInvoice.seller, id: generateUUID() });
        localStorage.setItem('fbr-profiles', JSON.stringify(profiles));
      }

      const clientsRaw = localStorage.getItem('fbr-clients');
      const clients: SavedClient[] = clientsRaw ? JSON.parse(clientsRaw) : [];
      if (targetInvoice.buyer.businessName) {
        const cIdx = clients.findIndex(c => c.businessName === targetInvoice.buyer.businessName);
        if (cIdx >= 0) clients[cIdx] = { ...clients[cIdx], ...targetInvoice.buyer };
        else clients.push({ ...targetInvoice.buyer, id: generateUUID() });
        localStorage.setItem('fbr-clients', JSON.stringify(clients));
      }
    } catch (e) {
      console.error('Error saving profiles/clients', e);
    }

    const existingIndex = invoices.findIndex(inv => inv.id === targetInvoice.id);
    let newInvoices = [...invoices];
    if (existingIndex >= 0) {
      newInvoices[existingIndex] = targetInvoice;
    } else {
      newInvoices.push(targetInvoice);
    }
    setInvoices(newInvoices);

    if (user) {
      try {
        const { error } = await supabase
          .from('invoices')
          .upsert({
            id: targetInvoice.id,
            user_id: user.id,
            invoice_number: targetInvoice.invoiceNumber,
            buyer_name: targetInvoice.buyer.businessName,
            issue_date: targetInvoice.issueDate,
            type: targetInvoice.type,
            currency: targetInvoice.currency,
            data: targetInvoice,
            created_at: new Date().toISOString()
          });
        if (error) throw error;
        // Don't call fetchInvoices here to avoid infinite loops and flicker
      } catch (err: any) {
        console.error("Error saving invoice:", err);
      }
    } else {
      saveInvoices(newInvoices);
    }
  };

  const handleSaveInvoice = async () => {
    if (!user) {
      if (guestCooldownUntil && guestCooldownUntil > Date.now()) {
        alert(`Guest limit reached. Please wait ${cooldownRemaining} or Sign In.`);
        return;
      }
      
      const newCount = guestSavesCount + 1;
      setGuestSavesCount(newCount);
      localStorage.setItem('fbr-guest-saves', newCount.toString());
      
      if (newCount >= 3) {
        const cooldownTime = Date.now() + 20 * 60 * 1000;
        setGuestCooldownUntil(cooldownTime);
        localStorage.setItem('fbr-guest-cooldown', cooldownTime.toString());
      }
    }
    
    await upsertInvoice(invoice);
    alert('Invoice saved successfully.');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleEmail = () => {
    const total = invoice.items.reduce((acc, item) => {
      const lineValue = (item.quantity * item.unitPrice) - item.discount;
      const lineTax = lineValue * (item.taxRate / 100);
      return acc + lineValue + lineTax;
    }, 0);
    
    const formattedTotal = total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    const subject = encodeURIComponent(`Invoice ${invoice.invoiceNumber} from ${invoice.seller.businessName || 'Us'}`);
    const body = encodeURIComponent(`Dear ${invoice.buyer.businessName || 'Customer'},\n\nPlease find the details for invoice ${invoice.invoiceNumber}.\n\nTotal Amount Due: ${invoice.currency} ${formattedTotal}\n\nThank you for your business.\n\nBest regards,\n${invoice.seller.businessName || 'Our Team'}`);
    
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
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
    if (subscriptionPlan === 'STARTER') {
      setIsPricingOpen(true);
      return;
    }
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
      {!user && guestCooldownUntil && cooldownRemaining && (
        <div className="bg-gradient-to-r from-orange-500 to-rose-500 text-white p-3 text-center text-sm font-semibold flex items-center justify-center gap-2 shadow-sm z-50 relative">
          <Clock className="h-4 w-4" />
          <span>Guest Limit Reached: You have generated 3 invoices. Next invoice available in <strong>{cooldownRemaining}</strong>.</span>
          <button onClick={() => setIsAuthOpen(true)} className="underline font-bold ml-2 hover:text-orange-200 cursor-pointer">Sign In to remove limits</button>
        </div>
      )}
      <header className="bg-blue-900 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3 w-full max-w-7xl mx-auto">
          <div className="bg-white text-blue-900 p-2 rounded-md shadow-sm">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold leading-tight">InvoiceDoctor</h1>
              <button 
                onClick={() => setIsPricingOpen(true)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 shadow-sm hover:scale-105 transition-transform cursor-pointer ${
                  subscriptionPlan === 'ENTERPRISE'
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border-amber-400'
                    : subscriptionPlan === 'PROFESSIONAL'
                    ? 'bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-indigo-400'
                    : 'bg-blue-800 text-blue-200 border-blue-700'
                }`}
              >
                {subscriptionPlan === 'ENTERPRISE' ? (
                  <>
                    <Sparkles className="h-2.5 w-2.5" /> Enterprise
                  </>
                ) : subscriptionPlan === 'PROFESSIONAL' ? (
                  <>
                    <Zap className="h-2.5 w-2.5" /> Professional
                  </>
                ) : (
                  <>
                    <Shield className="h-2.5 w-2.5" /> STARTER PLAN
                  </>
                )}
              </button>
            </div>

          </div>
          
          <div className="flex-1 flex justify-end gap-3 items-center">
            {view === 'create' || view === 'settings' ? (
              <>
                <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-blue-800" onClick={() => setView('dashboard')}>
                  <LayoutDashboard className="h-5 w-5 mr-2" /> Dashboard
                </Button>
                {view === 'create' && (
                  <>
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
                    <Button variant="outline" className="bg-blue-800 text-white border-blue-700 hover:bg-blue-700 hover:text-white" onClick={handleEmail}>
                      <Mail className="h-5 w-5 mr-2" /> Email
                    </Button>
                    <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={exportPDF}>
                      <Download className="h-5 w-5 mr-2" /> Download PDF
                    </Button>
                  </>
                )}
               </>
             ) : (
                <>
                  <Button variant="ghost" className="text-blue-100 hover:text-white hover:bg-blue-800" onClick={() => setView('settings')}>
                    <SettingsIcon className="h-5 w-5 mr-2" /> Settings
                  </Button>
                  <Button className="bg-blue-500 hover:bg-blue-600 text-white gap-2" onClick={handleCreateNew}>
                    <Plus className="h-5 w-5" /> Create Invoice
                  </Button>
                </>
             )}

             <div className="h-6 w-px bg-blue-700 mx-2"></div>

             {user ? (
               <div className="flex items-center gap-3">
                 <span className="text-xs text-blue-200 truncate max-w-[150px]" title={user.email}>
                   {user.email}
                 </span>
                 <Button 
                   variant="ghost" 
                   className="text-xs text-red-200 hover:text-white hover:bg-red-900 px-2.5 py-1.5 h-auto border border-red-700/50 hover:border-red-600 rounded-lg cursor-pointer"
                   onClick={handleSignOut}
                 >
                   Sign Out
                 </Button>
               </div>
             ) : (
               <Button 
                variant="outline" 
                className="bg-blue-800 text-white border-blue-700 hover:bg-blue-750 hover:text-white text-xs px-3 py-1.5 h-auto cursor-pointer"
                onClick={() => setIsAuthOpen(true)}
              >
                Sign In
              </Button>
             )}
           </div>
        </div>
      </header>
      
      {view === 'dashboard' ? (
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          <Dashboard 
            invoices={invoices} 
            onCreateNew={handleCreateNew} 
            onViewInvoice={(inv) => { setInvoice(inv); setView('create'); }}
            onUpdateInvoice={handleUpdateInvoice}
            onDuplicate={handleDuplicate}
            subscriptionPlan={subscriptionPlan}
            onUpgradePrompt={() => setIsPricingOpen(true)}
            onManageProofs={(inv) => setSelectedProofInvoice(inv)}
          />
        </main>
      ) : view === 'settings' ? (
        <main className="flex-1 overflow-y-auto pt-6">
          <Settings subscriptionPlan={subscriptionPlan} onOpenPricing={() => setIsPricingOpen(true)} />
        </main>
      ) : (
        <main className="flex-1 flex w-full max-w-[1600px] mx-auto p-4 gap-6 items-start">
          {/* Left Side - Form */}
          <div className="w-1/2 overflow-y-auto pr-2 custom-scrollbar" style={{ maxHeight: 'calc(100vh - 100px)' }}>
             <InvoiceForm 
               data={invoice} 
               onChange={setInvoice} 
               subscriptionPlan={subscriptionPlan}
               onOpenPricing={() => setIsPricingOpen(true)}
             />
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

      {isPricingOpen && (
        <PricingModal 
          isOpen={isPricingOpen} 
          onClose={() => setIsPricingOpen(false)} 
          currentPlan={subscriptionPlan}
          onSelectPlan={handleSelectPlan}
        />
      )}

      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthSuccess={() => fetchInvoices()}
        />
      )}

      {selectedProofInvoice && (
        <ProofsModal
          isOpen={!!selectedProofInvoice}
          onClose={() => setSelectedProofInvoice(null)}
          invoice={selectedProofInvoice}
          onUpdateInvoice={handleUpdateInvoice}
        />
      )}

      {checkoutPlan && (
        <CheckoutModal
          isOpen={!!checkoutPlan}
          onClose={() => setCheckoutPlan(null)}
          planName={checkoutPlan.planName}
          planPrice={checkoutPlan.planPrice}
        />
      )}
    </div>
  );
}
