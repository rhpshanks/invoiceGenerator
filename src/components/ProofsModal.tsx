import React, { useState } from 'react';
import { X, Upload, FileText, Trash2, ShieldCheck, AlertCircle } from 'lucide-react';
import { InvoiceData, InvoiceProof } from '../types';
import { Button } from './ui/Button';

interface ProofsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceData;
  onUpdateInvoice: (updated: InvoiceData) => void;
}

export function ProofsModal({ isOpen, onClose, invoice, onUpdateInvoice }: ProofsModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const proofs = invoice.proofs || [];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (limit to ~2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Maximum size is 2MB.');
      return;
    }

    setError(null);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      
      const newProof: InvoiceProof = {
        id: crypto.randomUUID(),
        name: file.name,
        dataUrl,
        uploadedAt: new Date().toISOString()
      };

      const updatedInvoice = {
        ...invoice,
        proofs: [...proofs, newProof]
      };

      onUpdateInvoice(updatedInvoice);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setError('Failed to read file.');
      setIsUploading(false);
    };
    
    reader.readAsDataURL(file);
  };

  const handleDeleteProof = (proofId: string) => {
    const updatedProofs = proofs.filter(p => p.id !== proofId);
    onUpdateInvoice({ ...invoice, proofs: updatedProofs });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300">
      <div 
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-600" /> Audit Proofs
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Invoice {invoice.invoiceNumber}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full hover:bg-gray-250 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Section */}
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-gray-50/50 hover:bg-gray-50 transition-colors relative">
            <input 
              type="file" 
              accept="image/*,application/pdf"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
              <Upload className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 mb-1">Click to upload a proof</h4>
            <p className="text-xs text-gray-500 max-w-[250px]">Attach Purchase Orders, Receipts, or Delivery Challans (Max 2MB. JPG, PNG, PDF).</p>
            {isUploading && (
              <div className="mt-4 text-xs font-semibold text-blue-600 flex items-center gap-2">
                <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </div>
            )}
          </div>

          {/* Proofs List */}
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3 border-b pb-2">Attached Documents ({proofs.length})</h4>
            {proofs.length === 0 ? (
              <p className="text-sm text-gray-500 italic text-center py-4">No proofs attached yet.</p>
            ) : (
              <ul className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
                {proofs.map((proof) => (
                  <li key={proof.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-green-50 p-2 rounded-md shrink-0">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="truncate">
                        <a href={proof.dataUrl} download={proof.name} className="text-sm font-semibold text-gray-900 hover:text-blue-600 hover:underline truncate block">
                          {proof.name}
                        </a>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(proof.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleDeleteProof(proof.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors ml-2 shrink-0"
                      title="Delete Proof"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <Button onClick={onClose} variant="outline" className="bg-white border-gray-200 text-gray-700 hover:bg-gray-100">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
