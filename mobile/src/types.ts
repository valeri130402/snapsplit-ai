export type ScreenName = 'home' | 'history' | 'billDetail' | 'importReceipt' | 'receiptReview' | 'splitSetup' | 'assignItems' | 'summary' | 'activity' | 'profile';

export type SplitMode = 'manual' | 'equal';

export type Person = {
  id: string;
  name: string;
  contact?: string;
  contactType?: 'instagram' | 'phone' | 'whatsapp' | 'none';
  color: string;
  emoji?: string;
};

export type ReceiptItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  kcal?: number;
  assignedTo: string[];
  assignedPortions?: Record<string, number>;
};

export type ReceiptParseResult = {
  merchant: string;
  currency: string;
  items: Omit<ReceiptItem, 'assignedTo'>[];
  rawText?: string;
  warning?: string;
};

export type SplitResult = {
  personId: string;
  name: string;
  contact?: string;
  contactType?: 'instagram' | 'phone' | 'whatsapp' | 'none';
  color: string;
  emoji?: string;
  items: ReceiptItem[];
  itemSubtotal: number;
  extras: number;
  total: number;
  kcal: number;
};

export type BillHistoryEntry = {
  id: string;
  merchant: string;
  date: string;
  amount: number;
  people: string[];
  tip?: number;
  results?: SplitResult[];
  receiptItems?: ReceiptItem[];
  receiptImageUri?: string;
  note?: string;
};
