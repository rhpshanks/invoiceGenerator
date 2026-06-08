import React, { useState, useEffect } from 'react';
import { X, Shield, Smartphone, Copy, CheckCircle2, MessageCircle, CreditCard, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
  userEmail?: string;
  userId?: string;
  onSuccess: () => void;
}

export function CheckoutModal({ isOpen, onClose, planName, planPrice, userEmail, userId, onSuccess }: CheckoutModalProps) {
  const [activeTab, setActiveTab] = useState<'card' | 'easypaisa'>('card');
  const [copied, setCopied] = useState(false);
  const easypaisaNumber = '03009100171';
  // Assume 275 PKR to USD for local display
  const pkrAmount = planPrice * 275;

  // Set up LemonSqueezy event handlers and initialization
  useEffect(() => {
    if (!isOpen) return;

    // Initialize LemonSqueezy if script is loaded
    if ((window as any).createLemonSqueezy) {
      (window as any).createLemonSqueezy();
    }

    // Bind event handler for success callback
    if ((window as any).LemonSqueezy) {
      (window as any).LemonSqueezy.Setup({
        eventHandler: (event: any) => {
          if (event.event === 'Checkout.Success') {
            onSuccess();
          }
        }
      });
    }
  }, [isOpen, onSuccess]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(easypaisaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `Hello, I have just paid ${pkrAmount} PKR for the InvoiceDoctor ${planName} Plan. Please upgrade my account! My email is: ${userEmail || ''}`;
    const url = `https://wa.me/923009100171?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handleLemonSqueezyCheckout = () => {
    const variantId = planName.toLowerCase().includes('enterprise') 
      ? '1127157' 
      : '177b5c80-6ded-4f9d-9af8-4d9033f6fe8e';
    let checkoutUrl = `https://invoicedoctor.lemonsqueezy.com/checkout/buy/${variantId}`;
    
    // Embed parameters inside LemonSqueezy's overlay URLs
    const params = new URLSearchParams();
    if (userEmail) {
      params.append('checkout[email]', userEmail);
    }
    if (userId) {
      params.append('checkout[custom][user_id]', userId);
    }
    
    // Force LemonSqueezy overlay behavior by embedding it
    params.append('embed', '1');
    
    const queryString = params.toString();
    if (queryString) {
      checkoutUrl += `?${queryString}`;
    }
    
    // Open in overlay using the SDK if loaded, else fallback to new tab
    if ((window as any).LemonSqueezy) {
      (window as any).LemonSqueezy.Url.Open(checkoutUrl);
    } else {
      window.open(checkoutUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Upgrade to {planName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Select your preferred payment method.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment Method Tabs */}
        <div className="flex border-b border-gray-200 p-2 bg-gray-50">
          <button
            onClick={() => setActiveTab('card')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'card'
                ? 'bg-white text-blue-600 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/55'
            }`}
          >
            <CreditCard className={`h-4 w-4 ${activeTab === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
            Card / LemonSqueezy
          </button>
          <button
            onClick={() => setActiveTab('easypaisa')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 cursor-pointer ${
              activeTab === 'easypaisa'
                ? 'bg-white text-green-600 shadow-sm border border-gray-200'
                : 'text-gray-500 hover:text-gray-950 hover:bg-gray-100/55'
            }`}
          >
            <Smartphone className={`h-4 w-4 ${activeTab === 'easypaisa' ? 'text-green-600' : 'text-gray-400'}`} />
            EasyPaisa / Local
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {activeTab === 'card' ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-center">
                <p className="text-xs text-blue-600 uppercase tracking-wider font-semibold mb-1">Total Due</p>
                <div className="text-3xl font-extrabold text-blue-800">${planPrice} <span className="text-sm font-normal text-blue-600">/ billing cycle</span></div>
                <p className="text-xs text-blue-500 mt-1">Instant plan activation upon payment</p>
              </div>

              <div className="space-y-4">
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                  <p className="text-sm text-gray-600">Secure, encrypted international card processing powered by <strong className="text-gray-800">LemonSqueezy</strong>.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                  <p className="text-sm text-gray-600">Supports Visa, Mastercard, American Express, and other global cards.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">✓</div>
                  <p className="text-sm text-gray-600">No manual verification required. Plan status updates automatically.</p>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleLemonSqueezyCheckout}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center text-base shadow-lg shadow-indigo-100 hover:shadow-indigo-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  Pay with LemonSqueezy
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-blue-500" /> Merchant of Record: LemonSqueezy
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                <p className="text-xs text-green-600 uppercase tracking-wider font-semibold mb-1">Total Due</p>
                <div className="text-3xl font-extrabold text-green-700">Rs. {pkrAmount.toLocaleString()}</div>
                <p className="text-xs text-green-600 font-medium mt-1">(${planPrice} USD Equivalent @ 275/$)</p>
              </div>

              <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Account Type</span>
                  <span className="text-sm font-semibold text-gray-900">EasyPaisa Mobile Account</span>
                </div>
                <div className="h-px bg-gray-200 w-full"></div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Account Number</span>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-900 tracking-wider">{easypaisaNumber}</span>
                    <button 
                      onClick={handleCopy}
                      className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                      title="Copy Number"
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
                  <p className="text-sm text-gray-600 font-medium">Send exactly <strong>Rs. {pkrAmount.toLocaleString()}</strong> to the EasyPaisa number.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
                  <p className="text-sm text-gray-600">Take a screenshot of the successful transaction.</p>
                </div>
                <div className="flex gap-3">
                  <div className="bg-green-100 text-green-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
                  <p className="text-sm text-gray-600">Click below to submit your receipt via WhatsApp. Verification is manual.</p>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  onClick={handleWhatsApp}
                  className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 text-base shadow-lg shadow-green-100 hover:shadow-green-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                >
                  <MessageCircle className="h-5 w-5" /> I have Paid, Submit Proof
                </Button>
                <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-green-600" /> Manual verification takes up to 1-2 hours
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
