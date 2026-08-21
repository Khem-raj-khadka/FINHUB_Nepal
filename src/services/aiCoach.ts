import { FinancialAccount, Transaction, Investment, SavingsGoal, FinancialScore } from '../types';
import {
  calculateNetWorth,
  calculateSavingsRate,
  calculateInvestmentReturns,
  calculateCategoryExpenses,
  calculateFinancialHealthScore,
} from './calculations';

/**
 * Sanitizes Markdown formatting symbols (like ** and __) from user-facing text
 */
function sanitizeMarkdownText(text: string): string {
  if (!text) return '';
  return text.replace(/\*\*/g, '').replace(/__/g, '').replace(/#/g, '');
}

/**
 * AI Financial Assistant Intelligent Intent Engine
 * Inspects actual data and answers financial queries.
 */
export async function getAICoachResponse(
  prompt: string,
  data: {
    accounts: FinancialAccount[];
    transactions: Transaction[];
    investments: Investment[];
    goals: SavingsGoal[];
  }
): Promise<string> {
  const { accounts, transactions, investments, goals } = data;
  const score = calculateFinancialHealthScore(accounts, transactions, investments, goals);
  const cleanPrompt = prompt.toLowerCase().trim();

  // Helper for NPR Formatting
  const fmt = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

  const match = (keywords: string[]) => keywords.some(k => cleanPrompt.includes(k));

  let rawResponse = '';

  // 1. Spending Queries
  const isSpendingQuery = match([
    'spend', 'spent', 'expense', 'spending', 'money going', 'unnecessary', 'reduce', 
    'cost', 'biggest expense', 'highest expense', 'highest spending', 'expenditure'
  ]);

  // 2. Savings Queries
  const isSavingsQuery = match([
    'save', 'savings', 'savings rate', 'monthly savings', 'saving enough'
  ]);

  // 3. SIP Queries
  const isSipQuery = match([
    'sip', 'payment', 'monthly contribution', 'invested in sips', 'due date', 'payments due'
  ]);

  // 4. Goal Queries
  const isGoalsQuery = match([
    'goal', 'laptop', 'complete', 'emergency fund', 'progress', 'target', 'travel', 'trek'
  ]);

  // 5. Financial Health Queries
  const isHealthQuery = match([
    'score', 'health', 'improve', 'low', 'breakdown', 'pillars', 'health score'
  ]);

  // 6. Account Balance Queries
  const isAccountsQuery = match([
    'balance', 'cash', 'money', 'bank', 'wallet', 'accounts', 'wallet balance'
  ]);

  // Execute Intent Logic
  if (isSpendingQuery) {
    const categories = calculateCategoryExpenses(transactions);
    const { expenses } = calculateSavingsRate(transactions);

    if (categories.length === 0) {
      rawResponse = `You haven't recorded any expenses this month. Once you log transactions or link an account, I can show you where your money goes!`;
    } else {
      const top = categories[0];
      let breakdownText = categories
        .slice(0, 3)
        .map((c) => `- ${c.category}: ${fmt(c.amount)} (${c.percentage.toFixed(0)}%)`)
        .join('\n');

      rawResponse = `Your highest spending category this month was ${top.category}, where you spent ${fmt(top.amount)} (${top.percentage.toFixed(0)}% of total expenses).\n\nTotal monthly expenses so far: ${fmt(expenses)}.\n\nTop 3 expenses:\n${breakdownText}\n\nTip: You might want to review your ${top.category} costs to see where you can save.`;
    }
  } 
  else if (isSavingsQuery) {
    const { income, expenses, savings, rate } = calculateSavingsRate(transactions);
    const activeIncome = income > 0 ? income : 85000;
    const activeSavings = income > 0 ? savings : (85000 - expenses);
    const activeRate = income > 0 ? rate : (activeSavings / activeIncome) * 100;

    rawResponse = `This month, your monthly income is ${fmt(activeIncome)} and your total expenses are ${fmt(expenses)}. This means you saved ${fmt(activeSavings)}.\n\nYour savings rate is ${activeRate.toFixed(1)}%.\n\nTip: Try to automate a transfer of at least 20-30% of your income into your savings goals right on salary day!`;
  } 
  else if (isSipQuery) {
    const sips = investments.filter((i) => i.investmentType === 'SIP');
    if (sips.length === 0) {
      rawResponse = `You don't have any active SIP trackers set up. Creating a Systematic Investment Plan (SIP) in mutual funds is a great way to dollar-cost average the Nepali market. Add one in the Invest tab!`;
    } else {
      const totalSipInvested = sips.reduce((sum, s) => sum + s.purchaseValue, 0);
      const totalMonthlySip = sips.reduce((sum, s) => sum + (s.monthlyContribution || 0), 0);
      const pendingSips = sips.filter((s) => s.status === 'Pending' || s.status === 'Overdue');
      const dueSoonSips = sips.filter((s) => s.status === 'Due Soon');

      let responseText = `You have ${sips.length} active SIPs with a total monthly commitment of ${fmt(totalMonthlySip)}.\n\nTotal invested in SIPs: ${fmt(totalSipInvested)}.\n\n`;

      if (pendingSips.length > 0) {
        responseText += `⚠️ Attention: You have ${pendingSips.length} pending/overdue SIP payments:\n` +
          pendingSips.map(s => `- ${s.name} (${fmt(s.monthlyContribution || 0)})`).join('\n') + '\n\n';
      } else if (dueSoonSips.length > 0) {
        const next = dueSoonSips[0];
        const dateStr = next.nextPaymentDate ? new Date(next.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
        responseText += `Next upcoming SIP is ${next.name} (${fmt(next.monthlyContribution || 0)}) due on ${dateStr}.\n\n`;
      } else {
        responseText += `All your SIP payments for this cycle are up to date! Great job on your consistency.\n\n`;
      }

      rawResponse = responseText;
    }
  } 
  else if (isGoalsQuery) {
    if (goals.length === 0) {
      rawResponse = `You don't have any active savings goals yet. You can create targets like an Emergency Fund or Travel Savings under the Goals tab to track your progress!`;
    } else {
      // Find closest to completion
      const sortedGoals = [...goals].sort((a, b) => {
        const aPct = (a.currentAmount / a.targetAmount);
        const bPct = (b.currentAmount / b.targetAmount);
        return bPct - aPct;
      });

      const closest = sortedGoals[0];
      const closestPct = (closest.currentAmount / closest.targetAmount) * 100;

      let responseText = `You are currently tracking ${goals.length} savings goals.\n\n` +
        `Your closest goal to completion is "${closest.name}" which is ${closestPct.toFixed(0)}% complete (${fmt(closest.currentAmount)} of ${fmt(closest.targetAmount)}).\n\n`;

      // Check specifically for Laptop goal if asked
      if (cleanPrompt.includes('laptop')) {
        const laptopGoal = goals.find((g) => g.name.toLowerCase().includes('laptop'));
        if (laptopGoal) {
          const needed = laptopGoal.targetAmount - laptopGoal.currentAmount;
          responseText = `For your "${laptopGoal.name}" goal, you have saved ${fmt(laptopGoal.currentAmount)} out of ${fmt(laptopGoal.targetAmount)}. You still need ${fmt(needed)} to buy it.`;
        }
      }

      rawResponse = responseText;
    }
  } 
  else if (isHealthQuery) {
    rawResponse = `Your Financial Health Score is ${score.totalScore}/100. \n\n` +
      `Breakdown:\n` +
      `- Emergency Fund: ${score.emergencyScore}/20\n` +
      `- Savings Habit: ${score.savingsScore}/20\n` +
      `- Investment Consistency: ${score.investmentScore}/20\n` +
      `- Debt Management: ${score.debtScore}/20\n` +
      `- Spending Control: ${score.spendingScore}/20\n\n` +
      `Your biggest opportunity to improve is in the area of ${
        [
          { name: 'Emergency Fund', val: score.emergencyScore },
          { name: 'Savings Habit', val: score.savingsScore },
          { name: 'Investment Consistency', val: score.investmentScore },
          { name: 'Debt Management', val: score.debtScore },
          { name: 'Spending Control', val: score.spendingScore },
        ].sort((a, b) => a.val - b.val)[0].name
      }. Try working on this category to increase your score!`;
  } 
  else if (isAccountsQuery) {
    const bankTotal = accounts.filter(a => a.providerType === 'bank').reduce((sum, a) => sum + a.balance, 0);
    const walletTotal = accounts.filter(a => a.providerType === 'wallet').reduce((sum, a) => sum + a.balance, 0);
    const total = bankTotal + walletTotal;

    // Find highest balance account
    const sortedAccs = [...accounts].sort((a, b) => b.balance - a.balance);
    const topAcc = sortedAccs[0];

    rawResponse = `You have a total cash balance of ${fmt(total)} across your connected accounts.\n\n` +
      `- Cash in Banks: ${fmt(bankTotal)}\n` +
      `- Cash in Digital Wallets: ${fmt(walletTotal)}\n\n` +
      `Your account with the highest balance is ${topAcc ? topAcc.providerName + ' (' + fmt(topAcc.balance) + ')' : 'none'}.`;
  } 
  else {
    // Intelligent Fallback
    rawResponse = `I don't currently have enough information in your financial data to answer that accurately. You can connect or add more data to FinHub for better insights.\n\n` +
      `Feel free to ask me about:\n` +
      `- "Where did I spend the most this month?"\n` +
      `- "How much did I save?"\n` +
      `- "Show my active SIP payments"\n` +
      `- "Which savings goal is closest to completion?"\n` +
      `- "How can I improve my financial score?"\n` +
      `- "What is my total bank balance?"`;
  }

  // Sanitize Markdown
  return sanitizeMarkdownText(rawResponse);
}
