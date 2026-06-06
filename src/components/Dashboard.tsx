import React, { useState } from 'react';
import { InvoiceData } from '../types';
import { format } from 'date-fns';
import { Search, Plus, Filter, FileText, Copy, Edit2, DollarSign, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Button } from './ui/Button';

interface DashboardProps {
  invoices: InvoiceData[];
  onCreateNew: () => void;
  onViewInvoice: (invoice: InvoiceData) => void;
  onUpdateInvoice?: (invoice: InvoiceData) => void;
  onDuplicate?: (invoice: InvoiceData) => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
    case 'SENT': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getInvoiceTotal = (inv: InvoiceData) => {
  return inv.items.reduce((acc, item) => {
    const lineValue = (item.quantity * item.unitPrice) - item.discount;
    const lineTax = lineValue * (item.taxRate / 100);
    return acc + lineValue + lineTax;
  }, 0);
};

export function Dashboard({ invoices, onCreateNew, onViewInvoice, onUpdateInvoice, onDuplicate }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.buyer.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? inv.type === typeFilter : true;
    const matchesStatus = statusFilter ? (inv.status || 'DRAFT') === statusFilter : true;
    return matchesSearch && matchesType && matchesStatus;
  }).sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());

  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((acc, inv) => acc + getInvoiceTotal(inv), 0);
  const overdueAmount = invoices.filter(i => i.status === 'OVERDUE').reduce((acc, inv) => acc + getInvoiceTotal(inv), 0);
  const sentAmount = invoices.filter(i => i.status === 'SENT').reduce((acc, inv) => acc + getInvoiceTotal(inv), 0);
  
  const chartData = [
    { name: 'Paid', amount: totalRevenue, color: '#10b981' },
    { name: 'Sent', amount: sentAmount, color: '#3b82f6' },
    { name: 'Overdue', amount: overdueAmount, color: '#ef4444' }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500">Track and manage your generated invoices.</p>
        </div>
        <Button onClick={onCreateNew} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
          <Plus className="h-4 w-4" /> Create Invoice
        </Button>
      </div>

      {invoices.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-gray-900">Rs {totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            </div>
            <div className="bg-green-50 p-3 rounded-full"><DollarSign className="h-6 w-6 text-green-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Outstanding</p>
              <h3 className="text-2xl font-bold text-gray-900">Rs {sentAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            </div>
            <div className="bg-blue-50 p-3 rounded-full"><Clock className="h-6 w-6 text-blue-600" /></div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Overdue</p>
              <h3 className="text-2xl font-bold text-gray-900">Rs {overdueAmount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</h3>
            </div>
            <div className="bg-red-50 p-3 rounded-full"><AlertCircle className="h-6 w-6 text-red-600" /></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm h-[104px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Tooltip cursor={{ fill: 'transparent' }} formatter={(value: number) => `Rs ${value.toLocaleString()}`} />
                <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by invoice no. or buyer..." 
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-40 relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select 
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">All Types</option>
            <option value="SALES_TAX">Sales Tax</option>
            <option value="SIMPLIFIED">Simplified</option>
            <option value="DEBIT_NOTE">Debit Note</option>
            <option value="CREDIT_NOTE">Credit Note</option>
          </select>
        </div>
        <div className="w-40 relative">
          <select 
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm appearance-none bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="PAID">Paid</option>
            <option value="OVERDUE">Overdue</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500 flex flex-col items-center">
            <FileText className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-lg font-medium text-gray-700">No invoices found</p>
            <p className="text-sm">Create a new invoice or adjust your filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Invoice No.</th>
                <th className="px-6 py-4">Issue Date</th>
                <th className="px-6 py-4">Buyer</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map(inv => {
                const total = getInvoiceTotal(inv);

                return (
                  <tr key={inv.id} className="hover:bg-gray-50 group">
                    <td className="px-6 py-4 font-medium text-blue-600 cursor-pointer" onClick={() => onViewInvoice(inv)}>
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>{inv.issueDate}</div>
                      {inv.dueDate && <div className="text-xs text-gray-400 mt-0.5">Due: {inv.dueDate}</div>}
                    </td>
                    <td className="px-6 py-4 truncate max-w-[200px] text-gray-700">{inv.buyer.businessName || 'N/A'}</td>
                    <td className="px-6 py-4">
                      <select 
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold border focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer ${getStatusColor(inv.status || 'DRAFT')}`}
                        value={inv.status || 'DRAFT'}
                        onChange={(e) => {
                          if (onUpdateInvoice) {
                            onUpdateInvoice({ ...inv, status: e.target.value as any });
                          }
                        }}
                      >
                        <option value="DRAFT" className="bg-white text-gray-900">Draft</option>
                        <option value="SENT" className="bg-white text-gray-900">Sent</option>
                        <option value="PAID" className="bg-white text-gray-900">Paid</option>
                        <option value="OVERDUE" className="bg-white text-gray-900">Overdue</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {inv.currency} {total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-100">
                        <Button variant="ghost" size="sm" onClick={() => onViewInvoice(inv)} className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600 hover:bg-blue-50" title="Edit / View">
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => onDuplicate && onDuplicate(inv)} className="h-8 w-8 p-0 text-gray-500 hover:text-green-600 hover:bg-green-50" title="Duplicate (Template)">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
