import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { X, Check, Zap, Sparkles, Shield } from 'lucide-react';
import { Button } from './ui/Button';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: SubscriptionPlan;
  onSelectPlan: (plan: SubscriptionPlan, planName: string, price: number) => void;
}

export function PricingModal({ isOpen, onClose, currentPlan, onSelectPlan }: PricingModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  if (!isOpen) return null;

  const plans = [
    {
      id: 'STARTER' as SubscriptionPlan,
      name: 'Starter',
      priceMonthly: 0,
      priceYearly: 0,
      description: 'Ideal for freelancers and micro-businesses starting their invoicing journey.',
      features: [
        'Up to 5 invoices per month',
        'Standard PDF exports',
        'Single company profile',
        'Standard HSN/Tax calculation'
      ],
      color: 'from-slate-500 to-slate-700',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200',
      shadowColor: 'hover:shadow-slate-100',
      icon: Shield
    },
    {
      id: 'PROFESSIONAL' as SubscriptionPlan,
      name: 'Professional',
      priceMonthly: 5,
      priceYearly: 48, // $4/mo equivalent
      description: 'For growing businesses requiring full FBR compliance and custom branding.',
      features: [
        'Unlimited invoices',
        'Custom company letterhead',
        'IRIS-compatible XML exports',
        'Multi-currency exchange rates',
        'Custom fields / columns',
        'Priority email support'
      ],
      color: 'from-indigo-600 to-violet-700',
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      shadowColor: 'hover:shadow-indigo-100',
      icon: Zap,
      popular: true
    },
    {
      id: 'ENTERPRISE' as SubscriptionPlan,
      name: 'Enterprise',
      priceMonthly: 19,
      priceYearly: 180, // $15/mo equivalent
      description: 'For organizations needing custom integration, team collaboration, and dedicated support.',
      features: [
        'All Professional features',
        'Multi-user role collaboration',
        'Custom layout templates',
        'API access for ERP integration',
        'Dedicated audit-readiness assistance',
        '24/7 Phone & SLA support'
      ],
      color: 'from-amber-500 to-rose-600',
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
      shadowColor: 'hover:shadow-amber-100',
      icon: Sparkles
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-6xl bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col max-h-[95vh] animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-150 flex justify-between items-center bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Upgrade Your Invoicing Power
            </h2>
            <p className="text-sm text-gray-500 mt-1">Unlock compliance, XML exports, and advanced customization.</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex justify-center mt-6">
          <div className="relative flex items-center p-1 bg-gray-100 rounded-full">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-4 py-2 text-xs font-semibold rounded-full transition-all duration-300 flex items-center gap-1.5 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Yearly Billing
              <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan === plan.id;
            const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
            const priceSubtext = plan.id === 'STARTER' ? 'forever' : billingCycle === 'monthly' ? '/ month' : '/ year';

            return (
              <div 
                key={plan.id}
                className={`relative flex flex-col justify-between p-6 rounded-2xl border transition-all duration-300 hover:-translate-y-1 ${
                  plan.popular 
                    ? 'border-indigo-600 bg-indigo-50/10 shadow-lg shadow-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${plan.shadowColor}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold tracking-wider uppercase px-3.5 py-1 rounded-full shadow-md">
                    Most Popular
                  </span>
                )}

                <div>
                  {/* Card Title & Icon */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5">{plan.description}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${plan.color} text-white shadow-sm`}>
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  {/* Pricing Details */}
                  <div className="mb-6 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-900">
                      ${price}
                    </span>
                    <span className="text-xs text-gray-500 font-medium">{priceSubtext}</span>
                  </div>

                  {/* Feature Checkmarks */}
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2.5 text-xs text-gray-600">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Plan Action Button */}
                <Button
                  onClick={() => {
                    onSelectPlan(plan.id, plan.name, price);
                    onClose();
                  }}
                  className={`w-full py-2.5 font-semibold text-xs transition-all duration-300 rounded-xl flex items-center justify-center ${
                    isCurrent
                      ? 'bg-gray-100 hover:bg-gray-150 text-gray-700 cursor-default pointer-events-none'
                      : plan.popular
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-100'
                      : 'bg-gray-900 hover:bg-black text-white'
                  }`}
                  disabled={isCurrent}
                >
                  {isCurrent ? 'Current Plan' : plan.id === 'STARTER' ? 'Select this Plan' : 'Upgrade Now'}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer Support Info */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-center gap-2 text-xs text-gray-500">
          <Shield className="h-4 w-4 text-green-600" />
          <span>Secure checkout via <strong>LemonSqueezy</strong>. Cancel or change plans anytime.</span>
        </div>
      </div>
    </div>
  );
}
