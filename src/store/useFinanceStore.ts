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
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface RegisteredUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  createdAt: string;
}

const USERS_REGISTRY_KEY = '@finhub_registered_users';

const getUserKey = (userId: string, key: string) => `@finhub_user_${userId}_${key}`;

const persist = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  } catch (e) {
    console.error(`Error saving ${key} to storage`, e);
  }
};

const getStoredItem = async <T>(key: string): Promise<T | null> => {
  try {
    const val = await AsyncStorage.getItem(key);
    if (!val) return null;
    return JSON.parse(val) as T;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return null;
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
  loginUser: (email: string, password?: string) => Promise<boolean>;
  signUp: (name: string, email: string, password?: string) => Promise<void>;
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
  deleteTransaction: (transactionId: string) => void;

  // Investments & SIP Payments
  addInvestment: (name: string, type: InvestmentCategory, purchaseValue: number, currentValue: number, monthlyContribution?: number, quantity?: number) => void;
  editInvestment: (id: string, currentValue: number, status: InvestmentStatus) => void;
  paySip: (sipId: string) => void;
  deleteInvestment: (id: string) => void;

  // Goals
  addGoal: (
    name: string,
    targetAmount: number,
    icon: string,
    targetDate: string,
    currentAmount?: number,
    description?: string
  ) => void;
  editGoal: (
    goalId: string,
    updates: Partial<{
      name: string;
      targetAmount: number;
      currentAmount: number;
      targetDate: string;
      icon: string;
      description: string;
    }>
  ) => void;
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
      const language = (await AsyncStorage.getItem('@finhub_language')) as 'en' | 'ne' || 'en';
      const themeMode = (await AsyncStorage.getItem('@finhub_themeMode')) as 'light' | 'dark' | 'system' || 'light';
      const isBalanceHidden = (await AsyncStorage.getItem('@finhub_isBalanceHidden')) === 'true';
      const activeUserId = await AsyncStorage.getItem('@finhub_active_user_id');
      const isAuthenticated = (await AsyncStorage.getItem('@finhub_isAuthenticated')) === 'true';
      const isDemoMode = (await AsyncStorage.getItem('@finhub_isDemoMode')) === 'true';

      if (isAuthenticated && activeUserId) {
        if (isDemoMode) {
          const accounts = (await getStoredItem<FinancialAccount[]>(getUserKey(DEMO_USER.id, 'accounts'))) || INITIAL_ACCOUNTS;
          const transactions = (await getStoredItem<Transaction[]>(getUserKey(DEMO_USER.id, 'transactions'))) || INITIAL_TRANSACTIONS;
          const investments = (await getStoredItem<Investment[]>(getUserKey(DEMO_USER.id, 'investments'))) || INITIAL_INVESTMENTS;
          const goals = (await getStoredItem<SavingsGoal[]>(getUserKey(DEMO_USER.id, 'goals'))) || INITIAL_SAVINGS_GOALS;
          const notifications = (await getStoredItem<Notification[]>(getUserKey(DEMO_USER.id, 'notifications'))) || INITIAL_NOTIFICATIONS;

          const financialScore = calculateFinancialHealthScore(accounts, transactions, investments, goals);

          set({
            language,
            themeMode,
            isBalanceHidden,
            user: DEMO_USER,
            isAuthenticated: true,
            isDemoMode: true,
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
                  ? `नमस्ते Khem Raj! म तपाईंको वित्तीय बुद्धिमत्ता कोच हुँ। म तपाईंको बजेट वा बचत लक्ष्यहरू सुधार गर्न कसरी मद्दत गर्न सक्छु?`
                  : `Namaste Khem Raj! I am your FinHub Financial Coach. How can I help you optimize your investments or savings goals today?`,
                timestamp: new Date().toISOString(),
              },
            ],
          });
        } else {
          // Regular Authenticated User
          const userObj = await getStoredItem<UserProfile>(getUserKey(activeUserId, 'profile'));
          const accounts = (await getStoredItem<FinancialAccount[]>(getUserKey(activeUserId, 'accounts'))) || [];
          const transactions = (await getStoredItem<Transaction[]>(getUserKey(activeUserId, 'transactions'))) || [];
          const investments = (await getStoredItem<Investment[]>(getUserKey(activeUserId, 'investments'))) || [];
          const goals = (await getStoredItem<SavingsGoal[]>(getUserKey(activeUserId, 'goals'))) || [];
          const notifications = (await getStoredItem<Notification[]>(getUserKey(activeUserId, 'notifications'))) || [];

          const financialScore = calculateFinancialHealthScore(accounts, transactions, investments, goals);

          set({
            language,
            themeMode,
            isBalanceHidden,
            user: userObj || { id: activeUserId, name: 'User', email: 'user@example.com', createdAt: new Date().toISOString() },
            isAuthenticated: true,
            isDemoMode: false,
            accounts,
            transactions,
            investments,
            goals,
            notifications,
            financialScore,
            chatMessages: [
              {
                id: 'welcome-msg-reg',
                sender: 'ai',
                text: language === 'ne'
                  ? `नमस्ते ${userObj?.name || 'साथी'}! म तपाईंको वित्तीय बुद्धिमत्ता कोच हुँ।`
                  : `Namaste ${userObj?.name || 'there'}! I am your FinHub Financial Coach. How can I help you optimize your finances today?`,
                timestamp: new Date().toISOString(),
              },
            ],
          });
        }
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
            ? `नमस्ते Khem Raj! म तपाईंको वित्तीय बुद्धिमत्ता कोच हुँ। म तपाईंको बजेट वा बचत लक्ष्यहरू सुधार गर्न कसरी मद्दत गर्न सक्छु?`
            : `Namaste Khem Raj! I am your FinHub Financial Coach. How can I help you optimize your investments or savings goals today?`,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    persist('@finhub_active_user_id', DEMO_USER.id);
    persist('@finhub_isAuthenticated', true);
    persist('@finhub_isDemoMode', true);
    persist(getUserKey(DEMO_USER.id, 'profile'), DEMO_USER);
    persist(getUserKey(DEMO_USER.id, 'accounts'), INITIAL_ACCOUNTS);
    persist(getUserKey(DEMO_USER.id, 'transactions'), INITIAL_TRANSACTIONS);
    persist(getUserKey(DEMO_USER.id, 'investments'), INITIAL_INVESTMENTS);
    persist(getUserKey(DEMO_USER.id, 'goals'), INITIAL_SAVINGS_GOALS);
    persist(getUserKey(DEMO_USER.id, 'notifications'), INITIAL_NOTIFICATIONS);
  },

  loginDemo: () => {
    get().initializeDemoMode();
  },

  loginUser: async (email: string, password?: string): Promise<boolean> => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Check Demo Account
    if (cleanEmail === 'demo@finhub.com') {
      get().initializeDemoMode();
      return true;
    }

    // 2. Check Supabase Auth if online & configured
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (!error && data.user) {
          const authUser: UserProfile = {
            id: data.user.id,
            name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
            email: cleanEmail,
            createdAt: data.user.created_at,
          };
          
          // Load user records
          const accounts = (await getStoredItem<FinancialAccount[]>(getUserKey(authUser.id, 'accounts'))) || [];
          const transactions = (await getStoredItem<Transaction[]>(getUserKey(authUser.id, 'transactions'))) || [];
          const investments = (await getStoredItem<Investment[]>(getUserKey(authUser.id, 'investments'))) || [];
          const goals = (await getStoredItem<SavingsGoal[]>(getUserKey(authUser.id, 'goals'))) || [];
          const notifications = (await getStoredItem<Notification[]>(getUserKey(authUser.id, 'notifications'))) || [];

          const score = calculateFinancialHealthScore(accounts, transactions, investments, goals);

          set({
            user: authUser,
            isAuthenticated: true,
            isDemoMode: false,
            accounts,
            transactions,
            investments,
            goals,
            notifications,
            financialScore: score,
          });

          persist('@finhub_active_user_id', authUser.id);
          persist('@finhub_isAuthenticated', true);
          persist('@finhub_isDemoMode', false);
          return true;
        }
      } catch (err) {
        console.warn('Supabase login fallback to local user registry', err);
      }
    }

    // 3. Check Local User Registry
    const registry = (await getStoredItem<RegisteredUser[]>(USERS_REGISTRY_KEY)) || [];
    const matchedUser = registry.find((u) => u.email.toLowerCase() === cleanEmail);

    if (matchedUser) {
      if (password && matchedUser.password && matchedUser.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      const userProfile: UserProfile = {
        id: matchedUser.id,
        name: matchedUser.name,
        email: matchedUser.email,
        createdAt: matchedUser.createdAt,
      };

      const accounts = (await getStoredItem<FinancialAccount[]>(getUserKey(matchedUser.id, 'accounts'))) || [];
      const transactions = (await getStoredItem<Transaction[]>(getUserKey(matchedUser.id, 'transactions'))) || [];
      const investments = (await getStoredItem<Investment[]>(getUserKey(matchedUser.id, 'investments'))) || [];
      const goals = (await getStoredItem<SavingsGoal[]>(getUserKey(matchedUser.id, 'goals'))) || [];
      const notifications = (await getStoredItem<Notification[]>(getUserKey(matchedUser.id, 'notifications'))) || [];

      const score = calculateFinancialHealthScore(accounts, transactions, investments, goals);

      set({
        user: userProfile,
        isAuthenticated: true,
        isDemoMode: false,
        accounts,
        transactions,
        investments,
        goals,
        notifications,
        financialScore: score,
      });

      persist('@finhub_active_user_id', matchedUser.id);
      persist('@finhub_isAuthenticated', true);
      persist('@finhub_isDemoMode', false);
      return true;
    }

    throw new Error('No account found with this email. Please sign up first.');
  },

  signUp: async (name: string, email: string, password?: string) => {
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try Supabase Auth if configured
    let userId = `usr-${Date.now()}`;
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name: cleanName },
          },
        });
        if (!error && data.user) {
          userId = data.user.id;
        }
      } catch (err) {
        console.warn('Supabase signup fallback to local registry', err);
      }
    }

    const newUser: UserProfile = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      createdAt: new Date().toISOString(),
    };

    // Save in local registered users registry
    const registry = (await getStoredItem<RegisteredUser[]>(USERS_REGISTRY_KEY)) || [];
    const updatedRegistry = [
      ...registry.filter((u) => u.email.toLowerCase() !== cleanEmail),
      {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        password: password || 'password123',
        createdAt: newUser.createdAt,
      },
    ];
    await persist(USERS_REGISTRY_KEY, updatedRegistry);

    // Initial zero state for new user
    const initialAccounts: FinancialAccount[] = [];
    const initialTransactions: Transaction[] = [];
    const initialInvestments: Investment[] = [];
    const initialGoals: SavingsGoal[] = [];
    const initialNotifications: Notification[] = [
      {
        id: `notif-welcome-${Date.now()}`,
        userId: newUser.id,
        title: 'Welcome to FinHub Nepal!',
        message: 'One dashboard for every investment and goal. Connect an account to start tracking your net worth.',
        type: 'general',
        isRead: false,
        createdAt: new Date().toISOString(),
      },
    ];

    const initialScore: FinancialScore = {
      id: `score-${Date.now()}`,
      userId: newUser.id,
      totalScore: 0,
      emergencyScore: 0,
      savingsScore: 0,
      investmentScore: 0,
      debtScore: 0,
      spendingScore: 0,
      calculatedAt: new Date().toISOString(),
    };

    set({
      user: newUser,
      isAuthenticated: true,
      isDemoMode: false,
      accounts: initialAccounts,
      transactions: initialTransactions,
      investments: initialInvestments,
      goals: initialGoals,
      notifications: initialNotifications,
      financialScore: initialScore,
      chatMessages: [
        {
          id: 'welcome-msg-new',
          sender: 'ai',
          text: `Welcome to FinHub Nepal, ${cleanName}! Connect an account or add your first savings goal to get started!`,
          timestamp: new Date().toISOString(),
        },
      ],
    });

    persist('@finhub_active_user_id', newUser.id);
    persist('@finhub_isAuthenticated', true);
    persist('@finhub_isDemoMode', false);
    persist(getUserKey(newUser.id, 'profile'), newUser);
    persist(getUserKey(newUser.id, 'accounts'), initialAccounts);
    persist(getUserKey(newUser.id, 'transactions'), initialTransactions);
    persist(getUserKey(newUser.id, 'investments'), initialInvestments);
    persist(getUserKey(newUser.id, 'goals'), initialGoals);
    persist(getUserKey(newUser.id, 'notifications'), initialNotifications);
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
    });

    AsyncStorage.multiRemove([
      '@finhub_active_user_id',
      '@finhub_isAuthenticated',
      '@finhub_isDemoMode',
    ]).catch((e) => console.error('Error clearing session storage on logout', e));

    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
  },

  setThemeMode: (themeMode) => {
    set({ themeMode });
    persist('@finhub_themeMode', themeMode);
  },
  
  setLanguage: (language) => {
    set({ language });
    persist('@finhub_language', language);
  },

  toggleBalanceHidden: () => {
    const isHidden = !get().isBalanceHidden;
    set({ isBalanceHidden: isHidden });
    persist('@finhub_isBalanceHidden', isHidden);
  },

  // Accounts
  addAccount: (providerName, providerType, accountType, balance) => {
    const user = get().user;
    const userId = user?.id || 'guest';
    const cleanProviderName = providerName.trim();
    
    const mask = providerType === 'bank' 
      ? `**** ${Math.floor(1000 + Math.random() * 9000)}`
      : `${user?.email ? '984****' + Math.floor(100 + Math.random() * 900) : '984****321'}`;

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

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'transactions'), updatedTx);
      persist(getUserKey(user.id, 'notifications'), updatedNotif);
    }

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase.from('financial_accounts').insert({
        id: newAccount.id,
        user_id: user.id,
        provider_name: newAccount.providerName,
        provider_type: newAccount.providerType,
        account_type: newAccount.accountType,
        masked_account_number: newAccount.maskedAccountNumber,
        balance: newAccount.balance,
        currency: newAccount.currency,
        is_connected: true,
      }).then(({ error }: any) => {
        if (error) console.error('Supabase addAccount error:', error);
      });
    }
  },

  removeAccount: (accountId) => {
    const user = get().user;
    const updatedAccounts = get().accounts.filter((a) => a.id !== accountId);
    const updatedTransactions = get().transactions.filter((t) => t.accountId !== accountId);
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, get().investments, get().goals);

    set({
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('financial_accounts').delete().eq('id', accountId).then(({ error }: any) => {
        if (error) console.error('Supabase removeAccount error:', error);
      });
    }
  },

  // Transactions
  addTransaction: (title, amount, type, category, accountId) => {
    const user = get().user;
    const userId = user?.id || 'guest';
    const newTx: Transaction = {
      id: `tx-manual-${Date.now()}`,
      userId,
      accountId,
      title: title.trim(),
      amount: Math.abs(amount),
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

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
    }

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase.from('transactions').insert({
        id: newTx.id,
        user_id: user.id,
        account_id: newTx.accountId,
        title: newTx.title,
        amount: newTx.amount,
        transaction_type: newTx.transactionType,
        category: newTx.category,
        date: newTx.date,
      }).then(({ error }: any) => {
        if (error) console.error('Supabase addTransaction error:', error);
      });
    }
  },

  deleteTransaction: (transactionId) => {
    const user = get().user;
    const tx = get().transactions.find((t) => t.id === transactionId);
    if (!tx) return;

    // Reverse account balance effect
    let updatedAccounts = get().accounts;
    if (tx.accountId) {
      updatedAccounts = get().accounts.map((a) => {
        if (a.id === tx.accountId) {
          const newBal = tx.transactionType === 'income' ? a.balance - tx.amount : a.balance + tx.amount;
          return { ...a, balance: newBal };
        }
        return a;
      });
    }

    const updatedTransactions = get().transactions.filter((t) => t.id !== transactionId);
    const score = calculateFinancialHealthScore(updatedAccounts, updatedTransactions, get().investments, get().goals);

    set({
      accounts: updatedAccounts,
      transactions: updatedTransactions,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
    }

    if (isSupabaseConfigured && supabase) {
      supabase.from('transactions').delete().eq('id', transactionId).then(({ error }: any) => {
        if (error) console.error('Supabase deleteTransaction error:', error);
      });
    }
  },

  // Investments & SIP Payments
  addInvestment: (name, type, purchaseValue, currentValue, monthlyContribution, quantity = 0) => {
    const user = get().user;
    const userId = user?.id || 'guest';
    const newInvestment: Investment = {
      id: `inv-${Date.now()}`,
      userId,
      name: name.trim(),
      investmentType: type,
      quantity,
      purchaseValue: Math.max(0, purchaseValue),
      currentValue: Math.max(0, currentValue),
      monthlyContribution: monthlyContribution ? Math.max(0, monthlyContribution) : undefined,
      startDate: new Date().toISOString(),
      nextPaymentDate: type === 'SIP' 
        ? new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString()
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

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'investments'), updatedInvestments);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
    }
  },

  editInvestment: (id, currentValue, status) => {
    const user = get().user;
    const updatedInvestments = get().investments.map((i) =>
      i.id === id ? { ...i, currentValue, status } : i
    );
    const score = calculateFinancialHealthScore(get().accounts, get().transactions, updatedInvestments, get().goals);

    set({
      investments: updatedInvestments,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'investments'), updatedInvestments);
    }
  },

  paySip: (sipId) => {
    const user = get().user;
    const sip = get().investments.find((i) => i.id === sipId);
    if (!sip || !sip.monthlyContribution) return;

    const amount = sip.monthlyContribution;

    const bankAcc = get().accounts.find(a => a.providerType === 'bank' && a.balance >= amount) 
      || get().accounts.find(a => a.providerType === 'bank') 
      || get().accounts[0];

    if (!bankAcc) {
      Alert.alert('Link Account Required', 'Please link a bank account to make virtual SIP payments.');
      return;
    }

    const updatedAccounts = get().accounts.map((a) =>
      a.id === bankAcc.id ? { ...a, balance: a.balance - amount } : a
    );

    const newTx: Transaction = {
      id: `tx-sip-pay-${Date.now()}`,
      userId: user?.id || 'guest',
      accountId: bankAcc.id,
      title: `SIP Payment: ${sip.name}`,
      amount,
      transactionType: 'expense',
      category: 'Investment',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const nextPayDate = new Date(sip.nextPaymentDate || Date.now());
    nextPayDate.setMonth(nextPayDate.getMonth() + 1);

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

    const newNotif: Notification = {
      id: `notif-sip-pay-${Date.now()}`,
      userId: user?.id || 'guest',
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

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'investments'), updatedInvestments);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
      persist(getUserKey(user.id, 'notifications'), updatedNotifications);
    }

    Alert.alert('Payment Successful', `Virtual SIP payment of Rs. ${amount.toLocaleString('en-IN')} processed successfully.`);
  },

  deleteInvestment: (id) => {
    const user = get().user;
    const updatedInvestments = get().investments.filter((i) => i.id !== id);
    const score = calculateFinancialHealthScore(get().accounts, get().transactions, updatedInvestments, get().goals);

    set({
      investments: updatedInvestments,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'investments'), updatedInvestments);
    }
  },

  // Goals
  addGoal: (name, targetAmount, icon, targetDate, currentAmount = 0, description = '') => {
    const user = get().user;
    const userId = user?.id || 'guest';
    const cleanCurrent = Math.max(0, currentAmount);
    const newGoal: SavingsGoal = {
      id: `goal-${Date.now()}`,
      userId,
      name: name.trim(),
      targetAmount: Math.max(1, targetAmount),
      currentAmount: cleanCurrent,
      targetDate: new Date(targetDate).toISOString(),
      icon: icon || 'Target',
      description: description?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    const updatedGoals = [...get().goals, newGoal];
    const score = calculateFinancialHealthScore(
      get().accounts,
      get().transactions,
      get().investments,
      updatedGoals
    );

    set({
      goals: updatedGoals,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'goals'), updatedGoals);
    }

    if (isSupabaseConfigured && supabase && user?.id) {
      supabase
        .from('savings_goals')
        .insert({
          id: newGoal.id,
          user_id: user.id,
          name: newGoal.name,
          target_amount: newGoal.targetAmount,
          current_amount: newGoal.currentAmount,
          target_date: newGoal.targetDate,
          icon: newGoal.icon,
          description: newGoal.description,
        })
        .then(({ error }: any) => {
          if (error) console.error('Supabase addGoal error:', error);
        });
    }
  },

  editGoal: (goalId, updates) => {
    const user = get().user;
    const updatedGoals = get().goals.map((g) => {
      if (g.id === goalId) {
        return {
          ...g,
          name: updates.name !== undefined ? updates.name.trim() : g.name,
          targetAmount: updates.targetAmount !== undefined ? Math.max(1, updates.targetAmount) : g.targetAmount,
          currentAmount: updates.currentAmount !== undefined ? Math.max(0, updates.currentAmount) : g.currentAmount,
          targetDate: updates.targetDate ? new Date(updates.targetDate).toISOString() : g.targetDate,
          icon: updates.icon !== undefined ? updates.icon : g.icon,
          description: updates.description !== undefined ? updates.description.trim() : g.description,
        };
      }
      return g;
    });

    const score = calculateFinancialHealthScore(
      get().accounts,
      get().transactions,
      get().investments,
      updatedGoals
    );

    set({
      goals: updatedGoals,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'goals'), updatedGoals);
    }

    if (isSupabaseConfigured && supabase) {
      const updated = updatedGoals.find((g) => g.id === goalId);
      if (updated) {
        supabase
          .from('savings_goals')
          .update({
            name: updated.name,
            target_amount: updated.targetAmount,
            current_amount: updated.currentAmount,
            target_date: updated.targetDate,
            icon: updated.icon,
            description: updated.description,
          })
          .eq('id', goalId)
          .then(({ error }: any) => {
            if (error) console.error('Supabase editGoal error:', error);
          });
      }
    }
  },

  addGoalMoney: (goalId, amount) => {
    const user = get().user;
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
      userId: user?.id || 'guest',
      accountId: defaultAcc.id,
      title: `Saved for: ${get().goals.find((g) => g.id === goalId)?.name}`,
      amount,
      transactionType: 'expense',
      category: 'Investment',
      date: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    const updatedTransactions = [newTx, ...get().transactions];

    const goalObj = updatedGoals.find((g) => g.id === goalId);
    let updatedNotifications = [...get().notifications];
    if (goalObj && goalObj.currentAmount >= goalObj.targetAmount) {
      updatedNotifications.unshift({
        id: `notif-goal-${Date.now()}`,
        userId: user?.id || 'guest',
        title: 'Goal Achieved!',
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

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'goals'), updatedGoals);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
      persist(getUserKey(user.id, 'notifications'), updatedNotifications);
    }
  },

  removeGoalMoney: (goalId, amount) => {
    const user = get().user;
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
      userId: user?.id || 'guest',
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

    if (user?.id) {
      persist(getUserKey(user.id, 'accounts'), updatedAccounts);
      persist(getUserKey(user.id, 'goals'), updatedGoals);
      persist(getUserKey(user.id, 'transactions'), updatedTransactions);
    }
  },

  deleteGoal: (goalId) => {
    const user = get().user;
    const currentGoals = get().goals;
    const targetGoal = currentGoals.find((g) => g.id === goalId);
    if (!targetGoal) return;

    const updatedGoals = currentGoals.filter((g) => g.id !== goalId);
    const score = calculateFinancialHealthScore(get().accounts, get().transactions, get().investments, updatedGoals);
    
    set({
      goals: updatedGoals,
      financialScore: score,
    });

    if (user?.id) {
      persist(getUserKey(user.id, 'goals'), updatedGoals);
    }

    if (isSupabaseConfigured && supabase) {
      supabase
        .from('savings_goals')
        .delete()
        .eq('id', goalId)
        .then(({ error }: any) => {
          if (error) console.error('Supabase deleteGoal error:', error);
        });
    }
  },

  // Notifications
  markNotificationAsRead: (id) => {
    const user = get().user;
    const updated = get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    set({ notifications: updated });
    if (user?.id) persist(getUserKey(user.id, 'notifications'), updated);
  },

  markAllNotificationsAsRead: () => {
    const user = get().user;
    const updated = get().notifications.map((n) => ({ ...n, isRead: true }));
    set({ notifications: updated });
    if (user?.id) persist(getUserKey(user.id, 'notifications'), updated);
  },

  deleteNotification: (id) => {
    const user = get().user;
    const updated = get().notifications.filter((n) => n.id !== id);
    set({ notifications: updated });
    if (user?.id) persist(getUserKey(user.id, 'notifications'), updated);
  },

  // AI Chat Actions
  sendChatMessage: async (text) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: `chat-${Date.now()}`,
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMessage],
      isChatLoading: true,
    }));

    try {
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

      set((state) => ({
        chatMessages: [...state.chatMessages, aiMessage],
        isChatLoading: false,
      }));
    } catch (err) {
      set((state) => ({
        chatMessages: [
          ...state.chatMessages,
          {
            id: `chat-${Date.now() + 1}`,
            sender: 'ai',
            text: 'I encountered an error analyzing your financials. Please try again.',
            timestamp: new Date().toISOString(),
          },
        ],
        isChatLoading: false,
      }));
    }
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
