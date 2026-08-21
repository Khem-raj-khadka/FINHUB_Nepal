import { FinancialAccount, Transaction, Investment, SavingsGoal, FinancialScore } from '../types/index';

/**
 * Net Worth = Total Assets - Total Liabilities
 * Assets: positive balances in bank accounts + wallets + current value of investments.
 * Liabilities: negative account balances or specific liability accounts (e.g. loans).
 */
export function calculateNetWorth(
  accounts: FinancialAccount[],
  investments: Investment[],
  liabilities: number = 0
) {
  const assetsAccounts = accounts
    .filter((a) => a.isConnected && a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const assetsInvestments = investments
    .filter((i) => i.status !== 'Completed')
    .reduce((sum, i) => sum + i.currentValue, 0);

  const liabilitiesAccounts = Math.abs(
    accounts.filter((a) => a.isConnected && a.balance < 0).reduce((sum, a) => sum + a.balance, 0)
  );

  const totalAssets = assetsAccounts + assetsInvestments;
  const totalLiabilities = liabilitiesAccounts + liabilities;
  const netWorth = totalAssets - totalLiabilities;

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
  };
}

/**
 * Savings Rate = Monthly Savings / Monthly Income * 100
 * Income: Sum of income transactions this month
 * Expenses: Sum of expense transactions this month
 * Savings: Income - Expenses
 */
export function calculateSavingsRate(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthlyTransactions = transactions.filter((t) => {
    const tDate = new Date(t.date);
    return tDate.getMonth() === currentMonth && tDate.getFullYear() === currentYear;
  });

  const income = monthlyTransactions
    .filter((t) => t.transactionType === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = monthlyTransactions
    .filter((t) => t.transactionType === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savings = Math.max(0, income - expenses);
  const rate = income > 0 ? (savings / income) * 100 : 0;

  return {
    income,
    expenses,
    savings,
    rate,
  };
}

/**
 * Investment Return = (Current Value - Total Invested) / Total Invested * 100
 */
export function calculateInvestmentReturns(investments: Investment[]) {
  const totalInvested = investments.reduce((sum, i) => sum + i.purchaseValue, 0);
  const currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
  const totalReturn = currentValue - totalInvested;
  const returnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

  return {
    totalInvested,
    currentValue,
    totalReturn,
    returnPercentage,
  };
}

/**
 * Goal Progress = (Current Amount / Target Amount) * 100
 */
export function calculateGoalProgress(currentAmount: number, targetAmount: number): number {
  if (targetAmount <= 0) return 0;
  const pct = (currentAmount / targetAmount) * 100;
  return Math.min(100, Math.max(0, pct));
}

/**
 * Group expenses by category and calculate percentages
 */
export function calculateCategoryExpenses(transactions: Transaction[]) {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const expenses = transactions.filter(
    (t) =>
      t.transactionType === 'expense' &&
      new Date(t.date).getMonth() === currentMonth &&
      new Date(t.date).getFullYear() === currentYear
  );

  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  const categoryMap: { [category: string]: number } = {};
  expenses.forEach((t) => {
    categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
  });

  const categories = Object.keys(categoryMap).map((cat) => {
    const amount = categoryMap[cat];
    const percentage = totalExpense > 0 ? (amount / totalExpense) * 100 : 0;
    return {
      category: cat,
      amount,
      percentage,
    };
  });

  // Sort by highest amount
  return categories.sort((a, b) => b.amount - a.amount);
}

/**
 * Calculate Financial Health Score (0 - 100) based on 5 pillars (each max 20 points)
 */
export function calculateFinancialHealthScore(
  accounts: FinancialAccount[],
  transactions: Transaction[],
  investments: Investment[],
  goals: SavingsGoal[],
  liabilities: number = 0
): FinancialScore {
  // If no data exists at all (brand new user), score is 0 across all pillars
  const hasAccounts = accounts.length > 0;
  const hasTransactions = transactions.length > 0;
  const hasInvestments = investments.length > 0;
  const hasGoals = goals.length > 0;

  if (!hasAccounts && !hasTransactions && !hasInvestments && !hasGoals) {
    return {
      id: `score-${Date.now()}`,
      userId: accounts[0]?.userId || 'user',
      totalScore: 0,
      emergencyScore: 0,
      savingsScore: 0,
      investmentScore: 0,
      debtScore: 0,
      spendingScore: 0,
      calculatedAt: new Date().toISOString(),
    };
  }

  const { totalAssets, totalLiabilities } = calculateNetWorth(accounts, investments, liabilities);
  const { income, expenses, rate: savingsRate } = calculateSavingsRate(transactions);

  // Pillar 1: Emergency Fund (Max 20 pts)
  const emergencyGoal = goals.find((g) => g.name.toLowerCase().includes('emergency'));
  let emergencyScore = 0;
  if (emergencyGoal) {
    const progress = calculateGoalProgress(emergencyGoal.currentAmount, emergencyGoal.targetAmount);
    emergencyScore = Math.round((progress / 100) * 20);
  } else {
    const cash = accounts.reduce((sum, a) => sum + Math.max(0, a.balance), 0);
    if (expenses > 0) {
      const monthsCovered = cash / expenses;
      emergencyScore = Math.min(20, Math.round((monthsCovered / 6) * 20));
    } else if (cash > 0) {
      emergencyScore = 15;
    } else {
      emergencyScore = 0;
    }
  }

  // Pillar 2: Savings Habit (Max 20 pts)
  let savingsScore = 0;
  if (income > 0) {
    if (savingsRate >= 30) {
      savingsScore = 20;
    } else if (savingsRate >= 20) {
      savingsScore = 16;
    } else if (savingsRate >= 10) {
      savingsScore = 10;
    } else if (savingsRate >= 5) {
      savingsScore = 6;
    } else {
      savingsScore = 2;
    }
  } else if (hasGoals && goals.some(g => g.currentAmount > 0)) {
    savingsScore = 10;
  } else {
    savingsScore = 0;
  }

  // Pillar 3: Investment Consistency (Max 20 pts)
  const activeSips = investments.filter((i) => i.investmentType === 'SIP' && i.status !== 'Paused' && i.status !== 'Completed').length;
  let investmentScore = 0;
  if (activeSips >= 3) {
    investmentScore = 20;
  } else if (activeSips === 2) {
    investmentScore = 16;
  } else if (activeSips === 1) {
    investmentScore = 12;
  } else if (investments.length > 0) {
    investmentScore = 8;
  } else {
    investmentScore = 0;
  }

  // Pillar 4: Debt Management (Max 20 pts)
  let debtScore = 0;
  if (totalAssets > 0) {
    const debtRatio = totalLiabilities / totalAssets;
    if (debtRatio === 0) debtScore = 20;
    else if (debtRatio <= 0.1) debtScore = 18;
    else if (debtRatio <= 0.25) debtScore = 15;
    else if (debtRatio <= 0.5) debtScore = 10;
    else if (debtRatio <= 0.75) debtScore = 5;
    else debtScore = 1;
  } else if (totalLiabilities > 0) {
    debtScore = 0;
  } else {
    debtScore = hasAccounts ? 20 : 0;
  }

  // Pillar 5: Spending Control (Max 20 pts)
  let spendingScore = 0;
  if (income > 0) {
    const expenseRatio = expenses / income;
    if (expenseRatio <= 0.5) spendingScore = 20;
    else if (expenseRatio <= 0.7) spendingScore = 16;
    else if (expenseRatio <= 0.8) spendingScore = 12;
    else if (expenseRatio <= 0.9) spendingScore = 8;
    else spendingScore = 3;
  } else if (expenses > 0) {
    spendingScore = 5;
  } else {
    spendingScore = hasAccounts ? 15 : 0;
  }

  const totalScore = emergencyScore + savingsScore + investmentScore + debtScore + spendingScore;

  return {
    id: `score-${Date.now()}`,
    userId: accounts[0]?.userId || 'user',
    totalScore: Math.min(100, Math.max(0, totalScore)),
    emergencyScore,
    savingsScore,
    investmentScore,
    debtScore,
    spendingScore,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * Calculate Smart Savings Recommendation based on 30% savings benchmark.
 */
export function calculateSmartSavings(transactions: Transaction[]) {
  const { income, expenses } = calculateSavingsRate(transactions);

  if (income <= 0 && expenses <= 0) {
    return 0;
  }

  const activeIncome = income > 0 ? income : expenses * 1.5;
  const activeExpenses = expenses;
  
  const targetSavingsRate = 0.30;
  const targetSavings = activeIncome * targetSavingsRate;
  const actualSavings = Math.max(0, activeIncome - activeExpenses);

  let recommendedExtra = 0;

  if (actualSavings < targetSavings) {
    const gap = targetSavings - actualSavings;
    recommendedExtra = Math.max(500, Math.round(gap / 500) * 500);
  } else {
    const extraSavings = activeIncome * 0.05;
    recommendedExtra = Math.max(500, Math.round(extraSavings / 500) * 500);
  }

  return recommendedExtra;
}

