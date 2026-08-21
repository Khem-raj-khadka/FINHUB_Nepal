export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
}

export type ProviderType = 'bank' | 'wallet';
export type AccountType = 'Savings' | 'Current' | 'Fixed Deposit' | 'Digital Wallet';

export interface FinancialAccount {
  id: string;
  userId: string;
  providerName: string; // e.g., 'Nabil Bank'
  providerType: ProviderType; // e.g., 'bank'
  accountType: AccountType;
  maskedAccountNumber: string; // e.g., '**** 4582'
  balance: number;
  currency: string; // default 'NPR'
  isConnected: boolean;
  lastSynced: string;
  createdAt: string;
}

export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string;
  accountId: string | null;
  title: string;
  amount: number;
  transactionType: TransactionType;
  category: string; // e.g., 'Food & Dining', 'Salary'
  date: string; // ISO string
  createdAt: string;
}

export type InvestmentCategory = 'SIP' | 'Mutual Fund' | 'Fixed Deposit' | 'Other';
export type InvestmentStatus = 'Paid' | 'Due Soon' | 'Pending' | 'Overdue' | 'Paused' | 'Completed';

export interface SIPPaymentRecord {
  id: string;
  investmentId: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'Paid' | 'Due Soon' | 'Pending' | 'Overdue';
  createdAt: string;
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  investmentType: InvestmentCategory;
  quantity?: number; // optional, no longer primary since stocks are removed
  purchaseValue: number;
  currentValue: number;
  monthlyContribution?: number; // relevant for SIP
  startDate: string;
  nextPaymentDate?: string; // relevant for SIP
  status: InvestmentStatus;
  paymentHistory?: SIPPaymentRecord[];
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  icon: string; // Name of Lucide icon
  description?: string;
  createdAt: string;
}

export interface GoalContribution {
  id: string;
  goalId: string;
  amount: number;
  date: string;
  note?: string;
}

export interface FinancialScore {
  id: string;
  userId: string;
  totalScore: number; // 0 - 100
  emergencyScore: number; // 0 - 20
  savingsScore: number; // 0 - 20
  investmentScore: number; // 0 - 20
  debtScore: number; // 0 - 20
  spendingScore: number; // 0 - 20
  calculatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'sip_due' | 'milestone' | 'spending_alert' | 'score_change' | 'general';
  isRead: boolean;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}
