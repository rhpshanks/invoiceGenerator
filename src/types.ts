export type InvoiceType = 
  | 'SALES_TAX'
  | 'SIMPLIFIED'
  | 'DEBIT_NOTE'
  | 'CREDIT_NOTE'
  | 'EXPORT'
  | 'WITHHOLDING';

export type Currency = string;

export interface LineItem {
  id: string;
  description: string;
  hsnCode: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // 0, 18, etc.
  discount: number;
  customColumns?: Record<string, string>;
}

export interface SellerDetails {
  businessName: string;
  address: string;
  ntn: string;
  strn: string;
  contact: string;
}

export interface BuyerDetails {
  businessName: string;
  address: string;
  ntn: string; 
  strn: string;
  cnic: string;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  type: InvoiceType;
  currency: Currency;
  exchangeRate: number;
  customColumns: string[];
  seller: SellerDetails;
  buyer: BuyerDetails;
  items: LineItem[];
  originalInvoiceRef?: string; // For Credit/Debit Notes
  reasonCode?: string; // For Credit/Debit Notes
  gdNumber?: string; // For Export
  whtRate?: number; // For Withholding
  whtSection?: string; // For Withholding
  letterhead?: string; // Base64 letterhead data URL
}

export interface AppState {
  invoices: InvoiceData[];
  currentInvoice: InvoiceData | null;
}
