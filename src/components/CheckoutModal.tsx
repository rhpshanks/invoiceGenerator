import React, { useState } from 'react';
import { X, Shield, Smartphone, Copy, CheckCircle2, MessageCircle } from 'lucide-react';
import { Button } from './ui/Button';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: number;
}

export function CheckoutModal({ isOpen, onClose, planName, planPrice }: CheckoutModalProps) {
  const [copied, setCopied] = useState(false);
  const easypaisaNumber = '03009100171';
  // Assume ~280 PKR to USD for local display, or simply show USD price and let them calculate or just tell them standard rate.
  // The pricing in PricingModal is in USD. So planPrice is $5 or $19.
  const pkrAmount = planPrice * 280;

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(easypaisaNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const text = `Hello, I have just paid ${pkrAmount} PKR for the InvoiceDoctor ${planName} Plan. Please upgrade my account! My email is: `;
    const url = `https://wa.me/923009100171?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
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
            <p className="text-sm text-gray-500 mt-1">Complete your secure local payment.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="p-6">
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
            <p className="text-sm text-gray-600 mb-1">Total Amount Due</p>
            <div className="text-3xl font-extrabold text-green-700 mb-1">Rs. {pkrAmount.toLocaleString()}</div>
            <p className="text-xs text-green-600 font-medium">(${planPrice} USD Equivalent)</p>
          </div>

          <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
            <Smartphone className="h-4 w-4 text-green-600" /> EasyPaisa Transfer
          </h3>

          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-6 space-y-3">
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

          {/* Instructions */}
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">1</div>
              <p className="text-sm text-gray-600">Send exactly <strong className="text-gray-900">Rs. {pkrAmount.toLocaleString()}</strong> via EasyPaisa app to the number above.</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">2</div>
              <p className="text-sm text-gray-600">Take a screenshot of the successful transaction.</p>
            </div>
            <div className="flex gap-3">
              <div className="bg-blue-100 text-blue-700 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">3</div>
              <p className="text-sm text-gray-600">Click below to send the screenshot via WhatsApp. Your account will be upgraded instantly.</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 bg-gray-50 border-t border-gray-100">
          <Button 
            onClick={handleWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 text-base shadow-lg shadow-green-200"
          >
            <MessageCircle className="h-5 w-5" /> I have Paid and Here is the Proof of Payment
          </Button>
          <p className="text-center text-xs text-gray-400 mt-3 flex items-center justify-center gap-1">
            <Shield className="h-3 w-3" /> Secure manual verification process
          </p>
        </div>
      </div>
    </div>
  );
}
