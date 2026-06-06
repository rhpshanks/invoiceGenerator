import React, { useState, useEffect } from 'react';
import { InvoiceData, LineItem, SavedProfile, SavedClient } from '../types';
import { Input, Label } from './ui/Input';
import { Button } from './ui/Button';
import { PlusCircle, Trash2, CheckCircle2, AlertCircle, Lock } from 'lucide-react';

const ValidationIcon = ({ isValid }: { isValid: boolean }) => {
  return isValid ? (
    <CheckCircle2 className="h-4 w-4 text-green-500" />
  ) : (
    <AlertCircle className="h-4 w-4 text-orange-500" />
  );
};

const RequiredLabel = ({ text, isValid, showIcon = true }: { text: string, isValid: boolean, showIcon?: boolean }) => (
  <Label className="flex items-center gap-2 mb-1">
    <span>{text} <span className="text-red-500">*</span></span>
    {showIcon && <ValidationIcon isValid={isValid} />}
  </Label>
);

interface InvoiceFormProps {
  data: InvoiceData;
  onChange: (data: InvoiceData) => void;
  subscriptionPlan: 'STARTER' | 'PROFESSIONAL' | 'ENTERPRISE';
  onOpenPricing: () => void;
}

export function InvoiceForm({ data, onChange, subscriptionPlan, onOpenPricing }: InvoiceFormProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [savedProfiles, setSavedProfiles] = useState<SavedProfile[]>([]);
  const [savedClients, setSavedClients] = useState<SavedClient[]>([]);

  useEffect(() => {
    try {
      const p = localStorage.getItem('fbr-profiles');
      if (p) setSavedProfiles(JSON.parse(p));
      const c = localStorage.getItem('fbr-clients');
      if (c) setSavedClients(JSON.parse(c));
    } catch (e) {}
  }, []);

  const handleChange = (field: string, value: any, section?: 'seller' | 'buyer') => {
    if (section) {
      if (field === 'businessName') {
         if (section === 'seller') {
            const profile = savedProfiles.find(p => p.businessName === value);
            if (profile) {
               onChange({ ...data, seller: { ...data.seller, ...profile, businessName: value } });
               return;
            }
         } else if (section === 'buyer') {
            const client = savedClients.find(c => c.businessName === value);
            if (client) {
               onChange({ ...data, buyer: { ...data.buyer, ...client, businessName: value } });
               return;
            }
         }
      }
      onChange({
        ...data,
        [section]: {
          ...data[section],
          [field]: value
        }
      });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  const handleItemChange = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...data.items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    onChange({
      ...data,
      items: [
        ...data.items,
        { id: Math.random().toString(36).substr(2, 9), description: '', hsnCode: '', quantity: 1, unitPrice: 0, taxRate: 18, discount: 0 }
      ]
    });
  };



  const confirmAddColumn = () => {
    const columnName = newColumnName.trim();
    if (columnName && !data.customColumns?.includes(columnName)) {
      onChange({
        ...data,
        customColumns: [...(data.customColumns || []), columnName],
        items: data.items.map(item => ({
          ...item,
          customColumns: { ...(item.customColumns || {}), [columnName]: '' }
        }))
      });
    }
    setIsAddingColumn(false);
    setNewColumnName('');
  };

  const removeItem = (index: number) => {
    const newItems = [...data.items];
    newItems.splice(index, 1);
    onChange({ ...data, items: newItems });
  };

  const removeCustomColumn = (columnName: string) => {
    onChange({
      ...data,
      customColumns: (data.customColumns || []).filter(c => c !== columnName),
      items: data.items.map(item => {
        const newCustomColumns = { ...item.customColumns };
        delete newCustomColumns[columnName];
        return { ...item, customColumns: newCustomColumns };
      })
    });
  };

  const handleCustomColumnChange = (itemIndex: number, columnName: string, value: string) => {
    const newItems = [...data.items];
    newItems[itemIndex] = {
      ...newItems[itemIndex],
      customColumns: {
        ...(newItems[itemIndex].customColumns || {}),
        [columnName]: value
      }
    };
    onChange({ ...data, items: newItems });
  };

  const ntnRegex = /^\d{7}-\d{1}$/;
  const isNtnValid = (ntn: string) => !ntn || ntnRegex.test(ntn);

  return (
    <div className="space-y-8 pb-10">
      {/* Template Selection */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Layout Template</h2>
          {subscriptionPlan !== 'ENTERPRISE' && (
            <span 
              className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wide cursor-pointer hover:bg-amber-200 transition-colors"
              onClick={onOpenPricing}
            >
              Enterprise Feature
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'standard', label: 'Standard', desc: 'Classic FBR layout' },
            { id: 'modern', label: 'Modern', desc: 'Vibrant & bold' },
            { id: 'minimal', label: 'Minimal', desc: 'Clean & elegant' }
          ].map(tpl => (
            <div 
              key={tpl.id}
              onClick={() => {
                if (tpl.id !== 'standard' && subscriptionPlan !== 'ENTERPRISE') {
                  onOpenPricing();
                } else {
                  handleChange('template', tpl.id);
                }
              }}
              className={`p-3 border rounded-lg cursor-pointer transition-all ${
                (data.template || 'standard') === tpl.id 
                  ? 'border-blue-500 bg-blue-50 shadow-sm' 
                  : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
              } ${tpl.id !== 'standard' && subscriptionPlan !== 'ENTERPRISE' ? 'opacity-75' : ''}`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-sm text-gray-900">{tpl.label}</span>
                {tpl.id !== 'standard' && subscriptionPlan !== 'ENTERPRISE' && (
                  <Lock className="h-3.5 w-3.5 text-gray-400" />
                )}
              </div>
              <p className="text-xs text-gray-500">{tpl.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Invoice Configuration</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-1">
            <RequiredLabel text="Invoice Type" isValid={true} />
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.type}
              onChange={(e) => handleChange('type', e.target.value)}
            >
              <option value="SALES_TAX">Sales Tax Invoice</option>
              <option value="SIMPLIFIED">Simplified Invoice</option>
              <option value="DEBIT_NOTE">Debit Note</option>
              <option value="CREDIT_NOTE">Credit Note</option>
              <option value="EXPORT">Export Invoice</option>
              <option value="WITHHOLDING">Withholding Invoice</option>
            </select>
          </div>
          <div className="space-y-1">
            <RequiredLabel text="Date of Issue" isValid={!!data.issueDate} />
            <Input type="date" value={data.issueDate} onChange={(e) => handleChange('issueDate', e.target.value)} />
          </div>
          <div className="space-y-1">
            <RequiredLabel text="Due Date" isValid={!!data.dueDate} />
            <Input type="date" value={data.dueDate || ''} onChange={(e) => handleChange('dueDate', e.target.value)} />
          </div>
        </div>
        
        {/* Conditional Fields based on Type */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <RequiredLabel text="Currency" isValid={true} />
              {subscriptionPlan === 'STARTER' && (
                <span 
                  className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-200 uppercase tracking-wide cursor-pointer hover:bg-indigo-200 transition-colors"
                  onClick={onOpenPricing}
                >
                  Pro Feature
                </span>
              )}
            </div>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:bg-gray-50"
              value={data.currency}
              disabled={subscriptionPlan === 'STARTER'}
              onChange={(e) => {
                onChange({ ...data, currency: e.target.value });
              }}
            >
              <option value="PKR">PKR - Pakistani Rupee</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="SAR">SAR - Saudi Riyal</option>
              <option value="AUD">AUD - Australian Dollar</option>
              <option value="CAD">CAD - Canadian Dollar</option>
            </select>
          </div>
          {(data.type === 'DEBIT_NOTE' || data.type === 'CREDIT_NOTE') && (
            <div className="space-y-1">
              <RequiredLabel text="Original Invoice Reference" isValid={!!data.originalInvoiceRef} />
              <Input value={data.originalInvoiceRef || ''} onChange={(e) => handleChange('originalInvoiceRef', e.target.value)} placeholder="INV-2025-000001" required />
            </div>
          )}
          {data.type === 'CREDIT_NOTE' && (
            <div className="space-y-1">
              <RequiredLabel text="Reason for Return/Adjustment" isValid={!!data.reasonCode} />
              <Input value={data.reasonCode || ''} onChange={(e) => handleChange('reasonCode', e.target.value)} placeholder="e.g. Goods Damaged" required />
            </div>
          )}
          {data.type === 'EXPORT' && (
            <div className="space-y-1">
              <RequiredLabel text="GD Number (Goods Declaration)" isValid={!!data.gdNumber} />
              <Input value={data.gdNumber || ''} onChange={(e) => handleChange('gdNumber', e.target.value)} placeholder="GD number..." required />
            </div>
          )}
          {data.type === 'WITHHOLDING' && (
             <>
               <div className="space-y-1">
                <RequiredLabel text="WHT Section" isValid={!!data.whtSection} />
                <select
                  className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={data.whtSection || '153'}
                  onChange={(e) => handleChange('whtSection', e.target.value)}
                >
                  <option value="153">153 - Goods/Services</option>
                  <option value="149">149 - Salary</option>
                </select>
               </div>
               <div className="space-y-1">
                 <RequiredLabel text="WHT Rate (%)" isValid={data.whtRate !== undefined && data.whtRate > 0} />
                 <Input type="number" min="0" max="100" value={data.whtRate || 0} onChange={(e) => handleChange('whtRate', parseFloat(e.target.value))} />
               </div>
             </>
          )}
        </div>
      </div>

      {/* Seller Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Seller (Supplier) Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <RequiredLabel text="Business Name" isValid={!!data.seller.businessName} />
            <Input list="saved-profiles" value={data.seller.businessName} onChange={(e) => handleChange('businessName', e.target.value, 'seller')} placeholder="Select saved profile or type new..." />
            <datalist id="saved-profiles">
              {savedProfiles.map(p => <option key={p.id} value={p.businessName} />)}
            </datalist>
          </div>
          <div className="space-y-1 col-span-2">
            <RequiredLabel text="Registered Address" isValid={!!data.seller.address} />
            <Input value={data.seller.address} onChange={(e) => handleChange('address', e.target.value, 'seller')} />
          </div>
          <div className="space-y-1">
            <RequiredLabel text="NTN" isValid={!!data.seller.ntn && isNtnValid(data.seller.ntn)} />
            <Input value={data.seller.ntn} onChange={(e) => handleChange('ntn', e.target.value, 'seller')} placeholder="1234567-8" className={!isNtnValid(data.seller.ntn) && data.seller.ntn ? 'border-red-500' : ''} />
            {!isNtnValid(data.seller.ntn) && data.seller.ntn && <p className="text-xs text-red-500">NTN must be 7 digits, hyphen, 1 digit</p>}
          </div>
          <div className="space-y-1">
            <RequiredLabel text="STRN" isValid={!!data.seller.strn} />
            <Input value={data.seller.strn} onChange={(e) => handleChange('strn', e.target.value, 'seller')} placeholder="00-00-0000-000-00" />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>Contact Number</Label>
            <Input value={data.seller.contact} onChange={(e) => handleChange('contact', e.target.value, 'seller')} />
          </div>
          <div className="space-y-2 col-span-2">
            <Label className="flex items-center gap-1.5">
              <span>Company Letterhead (Optional)</span>
              {subscriptionPlan === 'STARTER' && (
                <span className="text-[10px] bg-indigo-100 text-indigo-800 font-bold px-1.5 py-0.5 rounded border border-indigo-200 uppercase tracking-wide">
                  Pro Feature
                </span>
              )}
            </Label>
            <div className="flex items-center gap-4 border border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 relative overflow-hidden">
              {subscriptionPlan === 'STARTER' ? (
                <div 
                  className="flex flex-col items-center justify-center w-full py-3 cursor-pointer group"
                  onClick={onOpenPricing}
                >
                  <Lock className="h-6 w-6 text-indigo-500 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-sm text-indigo-600 font-medium group-hover:underline">
                    Upgrade to Upload Letterhead
                  </span>
                  <span className="text-xs text-gray-400 font-normal mt-0.5">
                    Letterhead uploads are exclusive to Professional & Enterprise plans
                  </span>
                </div>
              ) : data.letterhead ? (
                <div className="relative w-full">
                  <img src={data.letterhead} alt="Company Letterhead" className="max-h-24 w-full object-contain rounded border border-gray-200" />
                  <Button 
                    type="button" 
                    variant="ghost" 
                    className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-white shadow-sm hover:bg-red-50 px-2 py-1 h-auto text-xs"
                    onClick={() => handleChange('letterhead', '')}
                  >
                    Delete Letterhead
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center w-full py-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          handleChange('letterhead', event.target?.result);
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="letterhead-upload"
                  />
                  <label
                    htmlFor="letterhead-upload"
                    className="cursor-pointer flex flex-col items-center justify-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    <span>Click to Upload Letterhead</span>
                    <span className="text-xs text-gray-400 font-normal mt-1">PNG, JPG, or SVG (recommended size: 800x150)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Buyer Info */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Buyer Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1 col-span-2">
            <RequiredLabel text="Business Name / Buyer Name" isValid={!!data.buyer.businessName} />
            <Input list="saved-clients" value={data.buyer.businessName} onChange={(e) => handleChange('businessName', e.target.value, 'buyer')} placeholder="Select saved client or type new..." />
            <datalist id="saved-clients">
              {savedClients.map(c => <option key={c.id} value={c.businessName} />)}
            </datalist>
          </div>
          <div className="space-y-1 col-span-2">
            <RequiredLabel text="Address" isValid={!!data.buyer.address} />
            <Input value={data.buyer.address} onChange={(e) => handleChange('address', e.target.value, 'buyer')} />
          </div>
          
          {data.type !== 'SIMPLIFIED' && (
            <>
              <div className="space-y-1">
                <RequiredLabel text="NTN" isValid={!!data.buyer.ntn && isNtnValid(data.buyer.ntn)} />
                <Input value={data.buyer.ntn} onChange={(e) => handleChange('ntn', e.target.value, 'buyer')} placeholder="1234567-8" className={!isNtnValid(data.buyer.ntn) && data.buyer.ntn ? 'border-red-500' : ''}/>
              </div>
              <div className="space-y-1">
                <RequiredLabel text="STRN" isValid={!!data.buyer.strn} />
                <Input value={data.buyer.strn} onChange={(e) => handleChange('strn', e.target.value, 'buyer')} />
              </div>
            </>
          )}

          {data.type === 'SIMPLIFIED' && (
            <div className="space-y-2 col-span-2">
              <Label>CNIC (Optional for Unregistered)</Label>
              <Input value={data.buyer.cnic} onChange={(e) => handleChange('cnic', e.target.value, 'buyer')} placeholder="00000-0000000-0" />
            </div>
          )}
        </div>
      </div>

      {/* Line Items */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4 overflow-x-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-800">Line Items</h2>
          <div className="flex gap-2">
            <Button onClick={addItem} variant="outline" type="button" className="gap-2">
              <PlusCircle className="h-4 w-4" /> Add Item
            </Button>
          </div>
        </div>
        
        <div className="min-w-[800px]">
          <div className="flex gap-2 text-xs font-medium text-gray-500 mb-2 px-2 items-center">
            <div className="flex-[3]">
              <div className="flex items-center gap-2">
                 {isAddingColumn ? (
                   <div className="flex items-center gap-1 bg-white p-1 rounded border border-blue-300 shadow-sm z-20">
                     <input
                       type="text"
                       placeholder="Column..."
                       value={newColumnName}
                       onChange={(e) => setNewColumnName(e.target.value)}
                       className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24 text-gray-900 font-normal"
                       autoFocus
                       onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                           confirmAddColumn();
                         } else if (e.key === 'Escape') {
                           setIsAddingColumn(false);
                           setNewColumnName('');
                         }
                       }}
                     />
                     <button
                       type="button"
                       onClick={confirmAddColumn}
                       className="p-0.5 text-green-600 hover:bg-green-50 rounded"
                       title="add column"
                     >
                       <CheckCircle2 className="h-3.5 w-3.5" />
                     </button>
                     <button
                       type="button"
                       onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}
                       className="p-0.5 text-red-600 hover:bg-red-50 rounded"
                       title="do not add column"
                     >
                       <AlertCircle className="h-3.5 w-3.5" />
                     </button>
                   </div>
                 ) : (
                   <>
                     <button
                       type="button"
                       onClick={() => {
                         if (subscriptionPlan === 'STARTER') {
                           onOpenPricing();
                         } else {
                           setIsAddingColumn(true);
                         }
                       }}
                       className={`p-1 rounded-full ${subscriptionPlan === 'STARTER' ? 'text-indigo-500 hover:text-indigo-700 bg-indigo-50' : 'text-blue-500 hover:text-blue-700 bg-blue-50'}`}
                       title={subscriptionPlan === 'STARTER' ? 'Upgrade to Add Custom Columns' : 'Add Custom Column'}
                     >
                       {subscriptionPlan === 'STARTER' ? <Lock className="h-4 w-4" /> : <PlusCircle className="h-4 w-4" />}
                     </button>
                     Description
                   </>
                 )}
              </div>
            </div>
            {data.customColumns?.map(col => (
              <div key={col} className="flex-[2] flex justify-start gap-2 items-center text-gray-800 group">
                <Trash2 className="h-3 w-3 cursor-pointer text-red-400 hover:text-red-600" onClick={() => removeCustomColumn(col)} />
                {col}
              </div>
            ))}
            <div className="flex-[1]">Qty</div>
            <div className="flex-[2]">Unit Price ({data.currency})</div>
            <div className="flex-[2]">Tax Rate</div>
            <div className="w-10 text-right"></div>
          </div>
          
          <div className="space-y-2">
            {data.items.map((item, index) => (
              <div key={item.id} className="flex gap-2 items-center">
                <div className="flex-[3]">
                  <Input value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Item desc..." />
                </div>
                {data.customColumns?.map(col => (
                  <div key={col} className="flex-[2]">
                    <Input value={item.customColumns?.[col] || ''} onChange={(e) => handleCustomColumnChange(index, col, e.target.value)} placeholder={`${col}...`} />
                  </div>
                ))}
                <div className="flex-[1]">
                  <Input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value))} />
                </div>
                <div className="flex-[2]">
                  <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value))} />
                </div>
                <div className="flex-[2]">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={item.taxRate}
                    onChange={(e) => handleItemChange(index, 'taxRate', parseFloat(e.target.value) || 0)}
                    placeholder="Rate %"
                  />
                </div>
                <div className="w-10 flex justify-end">
                  <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 px-2" onClick={() => removeItem(index)} disabled={data.items.length === 1}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Notes & Terms */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">Notes & Terms</h2>
        <div className="space-y-1">
          <textarea
            className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
            value={data.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Thank you for your business! Payment is due within 14 days. Bank details: ..."
          />
        </div>
      </div>
    </div>
  );
}
