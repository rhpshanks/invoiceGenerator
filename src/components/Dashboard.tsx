import React, { useState } from 'react';
import { InvoiceData } from '../types';
import { format } from 'date-fns';
import { Search, Plus, Filter, FileText } from 'lucide-react';
import { Button } from './ui/Button';

interface DashboardProps {
  invoices: InvoiceData[];
  onCreateNew: () => void;
  onViewInvoice: (invoice: InvoiceData) => void;
}

export function Dashboard({ invoices, onCreateNew, onViewInvoice }: DashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.buyer.businessName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? inv.type === typeFilter : true;
    const matchesDate = dateFilter ? inv.issueDate === dateFilter : true;
    return matchesSearch && matchesType && matchesDate;
  });

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

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search by invoice number or buyer name..." 
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-48 relative">
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
            <option value="EXPORT">Export</option>
            <option value="WITHHOLDING">Withholding</option>
          </select>
        </div>
        <div className="w-48">
          <input 
            type="date" 
            className="w-full px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
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
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Currency</th>
                <th className="px-6 py-4 text-right">Items</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-blue-600">{inv.invoiceNumber}</td>
                  <td className="px-6 py-4">{inv.issueDate}</td>
                  <td className="px-6 py-4 truncate max-w-[200px]">{inv.buyer.businessName || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full text-xs font-medium border border-blue-200">
                      {inv.type.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">{inv.currency}</td>
                  <td className="px-6 py-4 text-right">{inv.items.length}</td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onViewInvoice(inv)} className="h-8 text-blue-600">
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
