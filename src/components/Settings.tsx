import React, { useState } from 'react';
import { SubscriptionPlan } from '../types';
import { Button } from './ui/Button';
import { Users, Code, ShieldCheck, Plus, Lock, Key, Copy, CheckCircle2, PhoneCall, Mail } from 'lucide-react';

interface SettingsProps {
  subscriptionPlan: SubscriptionPlan;
  onOpenPricing: () => void;
}

type TabType = 'team' | 'api' | 'support';

export function Settings({ subscriptionPlan, onOpenPricing }: SettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('api');
  const isEnterprise = subscriptionPlan === 'ENTERPRISE';

  // Mock State for Team
  const [team, setTeam] = useState([
    { id: '1', email: 'admin@company.com', role: 'Admin', status: 'Active' },
    { id: '2', email: 'accountant@company.com', role: 'Editor', status: 'Active' }
  ]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('Viewer');

  // Mock State for API
  const [apiKeys, setApiKeys] = useState([
    { id: '1', name: 'Production ERP', key: 'inv_live_8f92j3n928fn293nf...', created: '2025-01-15' }
  ]);
  const [copiedKey, setCopiedKey] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEnterprise) {
      onOpenPricing();
      return;
    }
    if (inviteEmail) {
      setTeam([...team, { id: Date.now().toString(), email: inviteEmail, role: inviteRole, status: 'Pending' }]);
      
      const subject = encodeURIComponent(`You've been invited to join InvoiceDoctor`);
      const body = encodeURIComponent(`Hi there,\n\nYou have been invited to join the team on InvoiceDoctor with the role of ${inviteRole}.\n\nPlease click the link below to accept your invitation and set up your account:\nhttps://invoicedoctor.pk/accept-invite\n\nWelcome aboard!`);
      window.location.href = `mailto:${inviteEmail}?subject=${subject}&body=${body}`;
      
      setInviteEmail('');
    }
  };

  const handleGenerateKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: 'New Integration Key',
      key: `inv_live_${Math.random().toString(36).substring(2, 15)}...`,
      created: new Date().toISOString().split('T')[0]
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const copyToClipboard = () => {
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 flex gap-8">
      {/* Sidebar */}
      <div className="w-64 flex-shrink-0">
        <h2 className="text-xl font-bold text-gray-900 mb-6 px-4">Workspace Settings</h2>
        <nav className="space-y-1">
          {/* TEAM COLLABORATION HIDDEN FOR NOW
          <button
            onClick={() => setActiveTab('team')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'team' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Users className="h-5 w-5" />
            Team Collaboration
          </button>
          */}
          <button
            onClick={() => setActiveTab('api')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'api' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Code className="h-5 w-5" />
            API & Integrations
          </button>
          <button
            onClick={() => setActiveTab('support')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'support' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ShieldCheck className="h-5 w-5" />
            Support & Audit
          </button>
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden min-h-[600px]">
        {/* TEAM TAB HIDDEN FOR NOW
        {activeTab === 'team' && (
          ...
        )}
        */}

        {/* API TAB */}
        {activeTab === 'api' && (
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">API & Integrations</h3>
              <p className="text-gray-500 mt-1">Connect your ERP or CRM directly via our REST API.</p>
            </div>

            {!isEnterprise ? (
              <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                  <Code className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-bold text-gray-900 mb-2">Unlock API Access</h4>
                <p className="text-gray-500 max-w-md mb-6">
                  Automate invoice creation, sync address books, and retrieve PDF/XML files programmatically with the Enterprise plan.
                </p>
                <Button onClick={onOpenPricing} className="bg-gradient-to-r from-amber-500 to-rose-500 text-white border-0">
                  Upgrade to Enterprise
                </Button>
              </div>
            ) : (
              <>
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 mb-8 flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900">Production API Keys</h4>
                    <p className="text-sm text-blue-700 mt-1">Keep these keys secret. Do not expose them in client-side code.</p>
                  </div>
                  <Button onClick={handleGenerateKey} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                    <Key className="h-4 w-4" /> Generate New Key
                  </Button>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden mb-8">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-medium text-gray-500">Key Name</th>
                        <th className="px-6 py-3 font-medium text-gray-500">Token</th>
                        <th className="px-6 py-3 font-medium text-gray-500">Created</th>
                        <th className="px-6 py-3 font-medium text-gray-500 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {apiKeys.map((key) => (
                        <tr key={key.id}>
                          <td className="px-6 py-4 font-medium text-gray-900">{key.name}</td>
                          <td className="px-6 py-4 font-mono text-xs text-gray-500">{key.key}</td>
                          <td className="px-6 py-4 text-gray-500">{key.created}</td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-blue-600">
                              {copiedKey ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 text-gray-300 font-mono text-sm shadow-inner">
                  <div className="flex gap-2 mb-4">
                    <span className="text-green-400 font-bold">POST</span>
                    <span>https://api.invoicedoctor.pk/v1/invoices</span>
                  </div>
                  <pre className="text-xs overflow-x-auto text-blue-300">
                    {`curl -X POST https://api.invoicedoctor.pk/v1/invoices \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "buyer": { "ntn": "1234567-8", "name": "Client Corp" },
    "items": [ { "description": "Consulting", "amount": 50000 } ]
  }'`}
                  </pre>
                </div>
              </>
            )}
          </div>
        )}

        {/* SUPPORT TAB */}
        {activeTab === 'support' && (
          <div className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-gray-900">Support & Audit Assistance</h3>
              <p className="text-gray-500 mt-1">Get help from our experts when you need it most.</p>
            </div>

            {isEnterprise ? (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-xl border border-blue-100 h-full flex flex-col">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-4">
                    <ShieldCheck className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Audit-Readiness Team</h4>
                  <p className="text-sm text-gray-600 flex-1">
                    Facing an FBR audit? Our tax compliance experts will help you generate the necessary reports and validate your historical XML exports.
                  </p>
                  <Button className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => alert('Support ticket created. An expert will contact you shortly.')}>
                    Request Audit Assistance
                  </Button>
                </div>

                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-xl border border-green-100 h-full flex flex-col">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-4">
                    <PhoneCall className="h-6 w-6 text-emerald-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">24/7 Phone Support</h4>
                  <p className="text-sm text-gray-600 flex-1">
                    Your Enterprise plan includes a guaranteed 1-hour SLA. Call us anytime for immediate assistance with critical billing issues.
                  </p>
                  <div className="mt-6 bg-white border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-lg font-mono font-bold text-emerald-700">+92 51 111-INV-DOC</p>
                    <p className="text-xs text-green-600 uppercase tracking-widest mt-1">PIN: 8492</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Mail className="h-6 w-6 text-gray-600" />
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 mb-2">Email Support</h4>
                  <p className="text-sm text-gray-600 mb-6">
                    Our team typically responds within 24-48 hours. Please provide your registered email address and a detailed description of your issue.
                  </p>
                  <Button variant="outline" className="w-full bg-white">
                    Contact Support
                  </Button>
                </div>

                <div className="bg-amber-50 p-6 rounded-xl border border-amber-200 flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-8 w-8 text-amber-500 mb-3" />
                  <h4 className="text-lg font-bold text-amber-900 mb-2">Need Audit Help?</h4>
                  <p className="text-sm text-amber-800 mb-4">
                    Upgrade to Enterprise to unlock dedicated FBR audit assistance, 24/7 phone support, and a guaranteed 1-hour SLA.
                  </p>
                  <Button onClick={onOpenPricing} className="bg-amber-600 hover:bg-amber-700 text-white">
                    View Enterprise Plan
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
