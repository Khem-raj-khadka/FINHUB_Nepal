import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import {
  UserProfile,
  FinancialAccount,
  Transaction,
  Investment,
  SavingsGoal,
  Notification,
  FinancialScore,
  ChatMessage,
  InvestmentCategory,
  InvestmentStatus,
  ProviderType,
  AccountType,
  SIPPaymentRecord,
} from '../types';
import {
  DEMO_USER,
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_INVESTMENTS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_NOTIFICATIONS,
} from '../services/mockData';
import { calculateFinancialHealthScore } from '../services/calculations';
import { getAICoachResponse } from '../services/aiCoach';

const persist = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
};

interface FinanceState {
  // Auth
  user: UserProfile | null;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  
  // Financial Data
  accounts: FinancialAccount[];
  transactions: Transaction[];
  investments: Investment[];
  goals: SavingsGoal[];
  notifications: Notification[];
  financialScore: FinancialScore;
  
  // Configuration
  themeMode: 'light' | 'dark' | 'system';
  language: 'en' | 'ne';
  currency: string;
  isBalanceHidden: boolean;
  
  // AI Chat
  chatMessages: ChatMessage[];
  isChatLoading: boolean;

  // Actions
  loadSavedData: () => Promise<void>;
  initializeDemoMode: () => void;
  loginDemo: () => void;
  signUp: (name: string, email: string) => void;
  logout: () => void;
  
  // Theme & Localization Actions
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  setLanguage: (lang: 'en' | 'ne') => void;
  toggleBalanceHidden: () => void;

  // Accounts
  addAccount: (providerName: string, providerType: ProviderType, accountType: AccountType, balance: number) => void;
  removeAccount: (accountId: string) => void;

  // Transactions
  addTransaction: (title: string, amount: number, type: 'income' | 'expense', category: string, accountId: string | null) => void;

  // Investments & SIP Payments
  addInvestment: (name: string, type: InvestmentCategory, purchaseValue: number, currentValue: number, monthlyContribution?: number, quantity?: number) => void;
  editInvestment: (id: string, currentValue: number, status: InvestmentStatus) => void;
  paySip: (sipId: string) => void;
  deleteInvestment: (id: string) => void;

  // Goals
  addGoal: (name: string, targetAmount: number, icon: string, targetDate: string) => void;
  addGoalMoney: (goalId: string, amount: number) => void;
  removeGoalMoney: (goalId: string, amount: number) => void;
  deleteGoal: (goalId: string) => void;

  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: string) => void;

  // AI Chat actions
  sendChatMessage: (text: string) => Promise<void>;
  clearChat: () => void;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isDemoMode: false,
  
  accounts: [],
  transactions: [],
  investments: [],
  goals: [],
  notifications: [],
  financialScore: {
    id: 'score-init',
    userId: 'guest',
    totalScore: 0,
    emergencyScore: 0,
    savingsScore: 0,
    investmentScore: 0,
    debtScore: 0,
    spendingScore: 0,
    calculatedAt: new Date().toISOString(),
  },
  
  themeMode: 'light',
  language: 'en',
  currency: 'Rs.',
  isBalanceHidden: false,
  
  chatMessages: [],
  isChatLoading: false,

  loadSavedData: async () => {
    try {
      const language = (await AsyncStorage.getItem('language')) as 'en' | 'ne' || 'en';
      const themeMode = (await AsyncStorage.getItem('themeMode')) as 'light' | 'dark' | 'system' || 'light';
      const isBalanceHidden = (await AsyncStorage.getItem('isBalanceHidden')) === 'true';
      const userStr = await AsyncStorage.getItem('user');
      const isAuthenticated = (await AsyncStorage.getItem('isAuthenticated')) === 'true';
      const isDemoMode = (await AsyncStorage.getItem('isDemoMode')) === 'true';

      const user = userStr ? JSON.parse(userStr) : null;

      if (isAuthenticated) {
        const accountsStr = await AsyncStorage.getItem('accounts');
        const transactionsStr = await AsyncStorage.getItem('transactions');
        const investmentsStr = await AsyncStorage.getItem('investments');
        const goalsStr = await AsyncStorage.getItem('goals');
        const notificationsStr = await AsyncStorage.getItem('notifications');

        const accounts = accountsStr ? JSON.parse(accountsStr) : (isDemoMode ? INITIAL_ACCOUNTS : []);
        const transactions = transactionsStr ? JSON.parse(transactionsStr) : (isDemoMode ? INITIAL_TRANSACTIONS : []);
        const investments = investmentsStr ? JSON.parse(investmentsStr) : (isDemoMode ? INITIAL_INVESTMENTS : []);
        const goals = goalsStr ? JSON.parse(goalsStr) : (isDemoMode ? INITIAL_SAVINGS_GOALS : []);
        const notifications = notificationsStr ? JSON.parse(notificationsStr) : (isDemoMode ? INITIAL_NOTIFICATIONS : []);

        const financialScore = calculateFinancialHealthScore(accounts, transactions, investments, goals);

        set({
          language,
          themeMode,
          isBalanceHidden,
          user,
          isAuthenticated,
          isDemoMode,
          accounts,
          transactions,
          investments,
          goals,
          notifications,
          financialScore,
          chatMessages: [
            {
              id: 'welcome-msg',
              sender: 'ai',
              text: language === 'ne'
                ? `नमस्ते ${user?.name || 'खेम राज'}! 🙏 म तपाईंको वित्तीय बुद्धिमत्ता कोच हुँ। म तपाईंको बजेट वा बचत लक्ष्यहरू सुधार गर्न कसरी मद्दत गर्न सक्छु?`
                : `Namaste ${user?.name || 'Khem Raj'}! 🙏 I am your FinHub Financial Coach. How can I help you optimize your investments or savings goals today?`,
              timestamp: new Date().toISOString(),
            },
          ],
        });
      } else {
        set({ language, themeMode, isBalanceHidden });
      }
    } catch (e) {
      console.error('Failed to load persisted state', e);
    }
  },

  initializeDemoMode: () => {
    const calculatedScore = calculateFinancialHealthScore(
      INITIAL_ACCOUNTS,
      INITIAL_TRANSACTIONS,
      INITIAL_INVESTMENTS,
      INITIAL_SAVINGS_GOALS
    );

    const lang = get().language;

    set({
      user: DEMO_USER,
      isAuthenticated: true,
      isDemoMode: true,
      accounts: INITIAL_ACCOUNTS,
      transactions: INITIAL_TRANSACTIONS,
      investments: INITIAL_INVESTMENTS,
      goals: INITIAL_SAVINGS_GOALS,
      notifications: INITIAL_NOTIFICATIONS,
      financialScore: calculatedScore,
      chatMessages: [
        {
          id: 'welcome-msg',
          sender: 'ai',
          text: lang === 'ne'
            ? `नमस्ते खेम राज! 🙏 म तपाईंको वित्तीय बुद्धिमत्ता कोच हुँ। म तपाईंको बजेट वा बचत लक्ष्यहरू सुधार गर्न कसरी मद्दत गर्न सक्छु?`
            : `Namaste Khem Raj! 🙏 I am your FinHub Financial Coach. How can I help you optimize your investments or savings goals today?`,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    persist('user', DEMO_USER);
    persist('isAuthenticated', true);
    persist('isDemoMode', true);
    persist('accounts', INITIAL_ACCOUNTS);
    persist('transactions', INITIAL_TRANSACTIONS);
    persist('investments', INITIAL_INVESTMENTS);
    persist('goals', INITIAL_SAVINGS_GOALS);
    persist('notifications', INITIAL_NOTIFICATIONS);
  },

  loginDemo: () => {
    get().initializeDemoMode();
  },

  signUp: (name: string, email: string) => {
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      name,
      email,
      createdAt: new Date().toISOString(),
    };

    set({
      user: newUser,
      isAuthenticated: true,
      isDemoMode: false,
      accounts: [],
      transactions: [],
      investments: [],
      goals: [],
      notifications: [
        {
          id: 'notif-welcome',
          userId: newUser.id,
          title: 'Welcome to FinHub Nepal!',
          message: 'One dashboard for every investment and goal. Connect an account to start tracking your net worth.',
          type: 'general',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
      ],
      financialScore: {
        id: `score-${Date.now()}`,
        userId: newUser.id,
        totalScore: 40,
        emergencyScore: 5,
        savingsScore: 5,
        investmentScore: 5,
        debtScore: 15,
        spendingScore: 10,
        calculatedAt: new Date().toISOString(),
      },
      chatMessages: [
        {
          id: 'welcome-msg-new',
          sender: 'ai',
          text: `Welcome to FinHub Nepal, ${name}! Let's connect some accounts to calculate your first Financial Health Score!`,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    persist('user', newUser);
    persist('isAuthenticated', true);
    persist('isDemoMode', false);
    persist('accounts', []);
    persist('transactions', []);
    persist('investments', []);
    persist('goals', []);
    persist('notifications', [
      {
        id: 'notif-welcome',
        userId: newUser.id,
        title: 'Welcome to FinHub Nepal!',
        message: 'One dashboard for every investment and goal. Connect an account to start tracking your net worth.',
        type: 'general',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ]);
  },

  logout: () => {
    set({
      user: null,
      isAuthenticated: false,
      isDemoMode: false,
      accounts: [],
      transactions: [],
      investments: [],
      goals: [],
      notifications: [],
      chatMessages: [],
      isBalanceHidden: false,
    });
    AsyncStorage.removeItem('user');
    AsyncStorage.removeItem('isAuthenticated');
    AsyncStorage.removeItem('isDemoMode');
    AsyncStorage.removeItem('accounts');
    AsyncStorage.removeItem('transactions');
    AsyncStorage.removeItem('investments');
    AsyncStorage.removeItem('goals');
    AsyncStorage.removeItem('notifications');
  },

  setThemeMode: (themeMode) => {
    set({ themeMode });
    persist('themeMode', themeMode);
  },
  
  setLanguage: (language) => {
    set({ language });
    persist('language', language);
  },

  toggleBalanceHidden: () => {
    const isHidden = !get().isBalanceHidden;
    set({ isBalanceHidden: isHidden });
    persist('isBalanceHidden', isHidden);
  },

  // Accounts
  addAccount: (providerName, providerType, accountType, balance) => {
    const userId = get().user?.id || 'guest';
    const cleanProviderName = providerName.trim();
    
    const mask = providerType === 'bank' 
      ? `**** ${Math.floor(1000 + Math.random() * 9000)}`
      : `${get().user?.email ? '984****' + Math.floor(100 + Math.random() * 900) : '984****321'}`;

    const newAccount: FinancialAccount = {
      id: `acc-${Date.now()}`,
      userId,
      providerName: cleanProviderName,
      providerType,
      accountType,
      maskedAccountNumber: mask,
      balance,
      currency: 'NPR',
      isConnected: true,
      lastSynced: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedAccounts = [...get().accounts, newAccount];
    
    // Add connection transaction
    const newTx: Transaction = {
      id: `tx-connect-${Date.now()}`,
      userId,
      accountId: newAccount.id,
      title: `Linked ${cleanProviderName}`,
      amount: balance,
      transactionType: 'income',
      category: 'Other Income',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTx = [newTx, ...get().transactions];

    const newNotification: Notification = {
      id: `notif-connect-${Date.now()}`,
      userId,
      title: 'Account Connected Successfully',
      message: `Your ${cleanProviderName} (${accountType}) account is now linked. Net worth calculations have been updated.`,
      type: 'general',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedNotif = [newNotification, ...get().notifications];
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTx, get().investments, get().goals);

    set({
      accounts: updatedAccounts,
      transactions: updatedTx,
      notifications: updatedNotif,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('transactions', updatedTx);
    persist('notifications', updatedNotif);
  },

  removeAccount: (accountId) => {
    const updatedAccounts = get().accounts.filter((a) => a.id !== accountId);
    const updatedTransactions = get().transactions.map((t) =>
      t.accountId === accountId ? { ...t, accountId: null } : t
    );
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, get().investments, get().goals);

    set({
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('transactions', updatedTransactions);
  },

  // Transactions
  addTransaction: (title, amount, type, category, accountId) => {
    const userId = get().user?.id || 'guest';
    const newTx: Transaction = {
      id: `tx-manual-${Date.now()}`,
      userId,
      accountId,
      title,
      amount,
      transactionType: type,
      category,
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // Adjust connected account balance
    const updatedAccounts = get().accounts.map((a) => {
      if (a.id === accountId) {
        const balance = type === 'income' ? a.balance + amount : a.balance - amount;
        return { ...a, balance };
      }
      return a;
    });

    const updatedTransactions = [newTx, ...get().transactions];
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, get().investments, get().goals);

    set({
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('transactions', updatedTransactions);
  },

  // Investments & SIP Payments
  addInvestment: (name, type, purchaseValue, currentValue, monthlyContribution, quantity = 0) => {
    const userId = get().user?.id || 'guest';
    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      userId,
      name,
      investmentType: type,
      quantity,
      purchaseValue,
      currentValue,
      monthlyContribution,
      startDate: new Date().toISOString(),
      nextPaymentDate: type === 'SIP' 
        ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString() // 30 days from now
        : undefined,
      status: type === 'SIP' ? 'Paid' : 'Completed',
      createdAt: new Date().toISOString(),
      paymentHistory: [],
    };

    const updatedInvestments = [...get().investments, newInvestment];
    let updatedTransactions = get().transactions;
    let updatedAccounts = get().accounts;

    if (type !== 'SIP' && get().accounts.length > 0) {
      const defaultAcc = get().accounts[0];
      const newTx: Transaction = {
        id: `tx-inv-${Date.now()}`,
        userId,
        accountId: defaultAcc.id,
        title: `Investment: ${name}`,
        amount: purchaseValue,
        transactionType: 'expense',
        category: 'Investment',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      
      updatedAccounts = get().accounts.map((a) =>
        a.id === defaultAcc.id ? { ...a, balance: a.balance - purchaseValue } : a
      );
      
      updatedTransactions = [newTx, ...get().transactions];
    }

    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, updatedInvestments, get().goals);

    set({
      accounts: updatedAccounts,
      investments: updatedInvestments,
      transactions: updatedTransactions,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('investments', updatedInvestments);
    persist('transactions', updatedTransactions);
  },

  editInvestment: (id, currentValue, status) => {
    const updatedInvestments = get().investments.map((i) =>
      i.id === id ? { ...i, currentValue, status } : i
    );
    const score = calculateFinancialHealthScore(get().accounts, get().transactions, updatedInvestments, get().goals);

    set({
      investments: updatedInvestments,
      financialScore: score,
    });

    persist('investments', updatedInvestments);
  },

  paySip: (sipId) => {
    const sip = get().investments.find((i) => i.id === sipId);
    if (!sip || !sip.monthlyContribution) return;

    const amount = sip.monthlyContribution;

    // 1. Find a commercial bank account with sufficient balance
    const bankAcc = get().accounts.find(a => a.providerType === 'bank' && a.balance >= amount) 
      || get().accounts.find(a => a.providerType === 'bank') 
      || get().accounts[0];

    if (!bankAcc) {
      Alert.alert('Link Account Required', 'Please link a bank account to make virtual SIP payments.');
      return;
    }

    // 2. Deduct amount from bank
    const updatedAccounts = get().accounts.map((a) =>
      a.id === bankAcc.id ? { ...a, balance: a.balance - amount } : a
    );

    // 3. Create expense transaction
    const newTx: Transaction = {
      id: `tx-sip-pay-${Date.now()}`,
      userId: get().user?.id || 'guest',
      accountId: bankAcc.id,
      title: `SIP Payment: ${sip.name}`,
      amount,
      transactionType: 'expense',
      category: 'Investment',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    // 4. Update next payment date (+1 month)
    const nextPayDate = new Date(sip.nextPaymentDate || Date.now());
    nextPayDate.setMonth(nextPayDate.getMonth() + 1);

    // 5. Add to payment history record
    const paymentRecord: SIPPaymentRecord = {
      id: `hist-pay-${Date.now()}`,
      investmentId: sipId,
      amount,
      dueDate: sip.nextPaymentDate || new Date().toISOString(),
      paidDate: new Date().toISOString(),
      status: 'Paid',
      createdAt: new Date().toISOString(),
    };

    const updatedInvestments = get().investments.map((i) => {
      if (i.id === sipId) {
        return {
          ...i,
          purchaseValue: i.purchaseValue + amount,
          currentValue: i.currentValue + amount,
          nextPaymentDate: nextPayDate.toISOString(),
          status: 'Paid' as const,
          paymentHistory: [paymentRecord, ...(i.paymentHistory || [])],
        };
      }
      return i;
    });

    // 6. Create custom notification
    const newNotif: Notification = {
      id: `notif-sip-pay-${Date.now()}`,
      userId: get().user?.id || 'guest',
      title: 'SIP Payment Processed',
      message: `Your payment of Rs. ${amount.toLocaleString('en-IN')} for "${sip.name}" was successfully debited from ${bankAcc.providerName}.`,
      type: 'milestone',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...get().transactions];
    const updatedNotifications = [newNotif, ...get().notifications];
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, updatedInvestments, get().goals);

    set({
      accounts: updatedAccounts,
      investments: updatedInvestments,
      transactions: updatedTransactions,
      notifications: updatedNotifications,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('investments', updatedInvestments);
    persist('transactions', updatedTransactions);
    persist('notifications', updatedNotifications);

    Alert.alert('Payment Successful', `Virtual SIP payment of Rs. ${amount.toLocaleString('en-IN')} processed successfully.`);
  },

  deleteInvestment: (id) => {
    const updatedInvestments = get().investments.filter((i) => i.id !== id);
    const score = calculateFinancialHealthScore(get().accounts, get().transactions, updatedInvestments, get().goals);

    set({
      investments: updatedInvestments,
      financialScore: score,
    });

    persist('investments', updatedInvestments);
  },

  // Goals
  addGoal: (name, targetAmount, icon, targetDate) => {
    const userId = get().user?.id || 'guest';
    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      userId,
      name,
      targetAmount,
      currentAmount: 0,
      targetDate: new Date(targetDate).toISOString(),
      icon,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...get().goals, newGoal];
    set({ goals: updatedGoals });
    persist('goals', updatedGoals);
  },

  addGoalMoney: (goalId, amount) => {
    if (get().accounts.length === 0) return;
    const defaultAcc = get().accounts[0];
    
    if (defaultAcc.balance < amount) return;

    const updatedAccounts = get().accounts.map((a) =>
      a.id === defaultAcc.id ? { ...a, balance: a.balance - amount } : a
    );

    const updatedGoals = get().goals.map((g) =>
      g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g
    );

    const newTx: Transaction = {
      id: `tx-goal-${Date.now()}`,
      userId: get().user?.id || 'guest',
      accountId: defaultAcc.id,
      title: `Saved for: ${get().goals.find((g) => g.id === goalId)?.name}`,
      amount,
      transactionType: 'expense',
      category: 'Investment',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...get().transactions];

    // Notification check
    const goalObj = updatedGoals.find((g) => g.id === goalId);
    let updatedNotifications = [...get().notifications];
    if (goalObj && goalObj.currentAmount >= goalObj.targetAmount) {
      updatedNotifications.unshift({
        id: `notif-goal-${Date.now()}`,
        userId: get().user?.id || 'guest',
        title: 'Goal Achieved! 🎉',
        message: `Incredible job! You saved the full Rs. ${goalObj.targetAmount.toLocaleString('en-IN')} for "${goalObj.name}".`,
        type: 'milestone',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    }

    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, get().investments, updatedGoals);

    set({
      accounts: updatedAccounts,
      goals: updatedGoals,
      transactions: updatedTransactions,
      notifications: updatedNotifications,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('goals', updatedGoals);
    persist('transactions', updatedTransactions);
    persist('notifications', updatedNotifications);
  },

  removeGoalMoney: (goalId, amount) => {
    if (get().accounts.length === 0) return;
    const defaultAcc = get().accounts[0];

    const updatedGoals = get().goals.map((g) => {
      if (g.id === goalId) {
        const amt = Math.max(0, g.currentAmount - amount);
        return { ...g, currentAmount: amt };
      }
      return g;
    });

    const updatedAccounts = get().accounts.map((a) =>
      a.id === defaultAcc.id ? { ...a, balance: a.balance + amount } : a
    );

    const newTx: Transaction = {
      id: `tx-goal-withdraw-${Date.now()}`,
      userId: get().user?.id || 'guest',
      accountId: defaultAcc.id,
      title: `Withdrew from: ${get().goals.find((g) => g.id === goalId)?.name}`,
      amount,
      transactionType: 'income',
      category: 'Other Income',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...get().transactions];
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, get().investments, updatedGoals);

    set({
      accounts: updatedAccounts,
      goals: updatedGoals,
      transactions: updatedTransactions,
      financialScore: score,
    });

    persist('accounts', updatedAccounts);
    persist('goals', updatedGoals);
    persist('transactions', updatedTransactions);
  },

  deleteGoal: (goalId) => {
    const updatedGoals = get().goals.filter((g) => g.id !== goalId);
    const score = calculateFinancialHealthScore(get().accounts, get().transactions, get().investments, updatedGoals);
    
    set({
      goals: updatedGoals,
      financialScore: score,
    });

    persist('goals', updatedGoals);
  },

  // Notifications
  markNotificationAsRead: (id) => {
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    set({ notifications: updated });
    persist('notifications', updated);
  },

  markAllNotificationsAsRead: () => {
    const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated });
    persist('notifications', updated);
  },

  deleteNotification: (id) => {
    const updated = get().notifications.filter((n) => n.id !== id);
    set({ notifications: updated });
    persist('notifications', updated);
  },

  // AI Chat Actions
  sendChatMessage: async (text) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMessage],
      isChatLoading: true,
    }));

    // Perform rule analysis on user data
    const coachResponseText = await getAICoachResponse(text, {
      accounts: get().accounts,
      transactions: get().transactions,
      investments: get().investments,
      goals: get().goals,
    });

    const aiMessage: ChatMessage = {
      id: `chat-${Date.now() + 1}`,
      sender: 'ai',
      text: coachResponseText,
      timestamp: new Date().toISOString(),
    };

    setTimeout(() => {
      set((state) => ({
        chatMessages: [...state.chatMessages, aiMessage],
        isChatLoading: false,
      }));
    }, 800);
  },

  clearChat: () => {
    const lang = get().language;
    set({
      chatMessages: [
        {
          id: 'welcome-msg-reset',
          sender: 'ai',
          text: lang === 'ne' 
            ? `मैले हाम्रो च्याट इतिहास खाली गरेको छु। कुन वित्तीय पक्षबारे छलफल गर्न चाहनुहुन्छ?`
            : `I've cleared our chat history. What aspect of your financials would you like to review now?`,
          timestamp: new Date().toISOString(),
        },
      ],
    });
  },
}));
