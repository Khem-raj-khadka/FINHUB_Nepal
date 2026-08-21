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
 * AI Financial Assistant Intelligent Engine
 * Integrates with Google Gemini API when EXPO_PUBLIC_AI_API_KEY is available,
 * and falls back to a deterministic, zero-hallucination local financial analyzer.
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
  const { totalAssets, totalLiabilities, netWorth } = calculateNetWorth(accounts, investments);
  const { income, expenses, savings, rate } = calculateSavingsRate(transactions);
  const categoryBreakdown = calculateCategoryExpenses(transactions);
  const sips = investments.filter((i) => i.investmentType === 'SIP');

  const apiKey = process.env.EXPO_PUBLIC_AI_API_KEY?.trim();

  // Try calling Gemini API if key is available
  if (apiKey) {
    try {
      const financialContext = {
        totalNetWorth: netWorth,
        totalAssets,
        totalLiabilities,
        monthlyIncome: income,
        monthlyExpenses: expenses,
        monthlySavings: savings,
        savingsRatePercentage: rate.toFixed(1),
        financialHealthScore: {
          total: score.totalScore,
          emergency: score.emergencyScore,
          savings: score.savingsScore,
          investment: score.investmentScore,
          debt: score.debtScore,
          spending: score.spendingScore,
        },
        connectedAccounts: accounts.map((a) => ({
          provider: a.providerName,
          type: a.accountType,
          balance: a.balance,
        })),
        activeSips: sips.map((s) => ({
          name: s.name,
          monthlyContribution: s.monthlyContribution,
          status: s.status,
          nextDueDate: s.nextPaymentDate,
        })),
        savingsGoals: goals.map((g) => ({
          name: g.name,
          target: g.targetAmount,
          saved: g.currentAmount,
          percentComplete: ((g.currentAmount / (g.targetAmount || 1)) * 100).toFixed(0),
        })),
        topExpenseCategories: categoryBreakdown.slice(0, 5),
        recentTransactionsCount: transactions.length,
      };

      const systemInstruction = `You are FinHub Nepal's AI Financial Intelligence Coach.
You provide friendly, actionable, and strictly accurate financial guidance for Nepali users.
CRITICAL RULES:
1. ONLY use the provided real financial data below.
2. If the user has 0 accounts, 0 transactions, or 0 goals, explicitly state that they have no recorded data yet.
3. NEVER invent or hallucinate transactions, banks, salaries, or numbers not in this snapshot.
4. Keep currency formatted in Nepali Rupees (Rs. or NPR).
5. Provide clear, concise, direct answers without fluff.

USER FINANCIAL SNAPSHOT:
${JSON.stringify(financialContext, null, 2)}`;

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUSER QUESTION: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 400,
          },
        }),
      });

      if (response.ok) {
        const json = await response.json();
        const candidateText = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (candidateText && candidateText.trim().length > 0) {
          return sanitizeMarkdownText(candidateText.trim());
        }
      } else {
        const errorData = await response.text();
        console.error('Gemini API HTTP Error:', response.status, errorData);
      }
    } catch (apiError) {
      console.warn('Gemini API call failed, falling back to local engine:', apiError);
    }
  }

  // Local Rule Engine (Strictly Data-Grounded, Zero-Hallucination)
  const cleanPrompt = prompt.toLowerCase().trim();
  const fmt = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;
  const match = (keywords: string[]) => keywords.some((k) => cleanPrompt.includes(k));

  // 1. Spending Queries
  if (match(['spend', 'spent', 'expense', 'spending', 'money going', 'unnecessary', 'reduce', 'cost', 'highest expense', 'highest spending', 'expenditure', 'where am i spending'])) {
    if (categoryBreakdown.length === 0) {
      return `You have not recorded any expense transactions for this month yet. Once you log transactions or link an account, I will show you your highest spending categories!`;
    }
    const top = categoryBreakdown[0];
    const breakdownText = categoryBreakdown
      .slice(0, 3)
      .map((c) => `- ${c.category}: ${fmt(c.amount)} (${c.percentage.toFixed(0)}%)`)
      .join('\n');

    return `Your highest spending category this month is ${top.category}, where you spent ${fmt(top.amount)} (${top.percentage.toFixed(0)}% of total expenses).\n\nTotal monthly expenses: ${fmt(expenses)}.\n\nTop spending categories:\n${breakdownText}\n\nTip: Review your discretionary spending in ${top.category} to boost your monthly savings.`;
  }

  // 2. Savings Queries
  if (match(['save', 'savings', 'savings rate', 'monthly savings', 'saving enough', 'how much did i save', 'how can i improve my savings'])) {
    if (income === 0 && expenses === 0) {
      return `You have not recorded any income or expenses for this month yet. To build a healthy savings habit, start by recording your income and setting aside 20% to 30% into a dedicated savings goal or emergency fund right on salary day!`;
    }

    if (income === 0 && expenses > 0) {
      return `This month, your recorded expenses are ${fmt(expenses)}, but no income has been logged yet. Please add your monthly income to see your accurate savings rate!`;
    }

    return `This month, your recorded income is ${fmt(income)} and your total expenses are ${fmt(expenses)}. This leaves you with monthly savings of ${fmt(savings)}.\n\nYour savings rate is ${rate.toFixed(1)}%.\n\nTip: Aim to maintain a savings rate of 20% to 30% by transferring savings directly to your goals on salary day!`;
  }

  // 3. SIP & Investment Queries
  if (match(['sip', 'payment', 'monthly contribution', 'invested in sips', 'due date', 'payments due', 'active sip', 'invest'])) {
    if (sips.length === 0) {
      return `You do not have any active SIP trackers set up. Creating a Systematic Investment Plan (SIP) in mutual funds is a great way to dollar-cost average the market. You can add one under the Invest tab!`;
    }
    const totalSipInvested = sips.reduce((sum, s) => sum + s.purchaseValue, 0);
    const totalMonthlySip = sips.reduce((sum, s) => sum + (s.monthlyContribution || 0), 0);
    const pendingSips = sips.filter((s) => s.status === 'Pending' || s.status === 'Overdue');
    const dueSoonSips = sips.filter((s) => s.status === 'Due Soon');

    let responseText = `You have ${sips.length} active SIPs with a total monthly commitment of ${fmt(totalMonthlySip)}.\n\nTotal invested in SIPs: ${fmt(totalSipInvested)}.\n\n`;

    if (pendingSips.length > 0) {
      responseText += `⚠️ Attention: You have ${pendingSips.length} pending/overdue SIP payments:\n` +
        pendingSips.map((s) => `- ${s.name} (${fmt(s.monthlyContribution || 0)})`).join('\n') + '\n\n';
    } else if (dueSoonSips.length > 0) {
      const next = dueSoonSips[0];
      const dateStr = next.nextPaymentDate ? new Date(next.nextPaymentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A';
      responseText += `Your next upcoming SIP is ${next.name} (${fmt(next.monthlyContribution || 0)}) due on ${dateStr}.\n\n`;
    } else {
      responseText += `All your SIP payments for this cycle are up to date! Great job on your investment discipline.\n\n`;
    }

    return responseText.trim();
  }

  // 4. Goal Queries
  if (match(['goal', 'laptop', 'emergency fund', 'progress', 'target', 'travel', 'trek', 'savings goal'])) {
    if (goals.length === 0) {
      return `You do not have any active savings goals yet. You can create targets like an Emergency Fund, Laptop, or Travel Savings under the Goals tab to track your progress!`;
    }

    const sortedGoals = [...goals].sort((a, b) => {
      const aPct = (a.currentAmount / (a.targetAmount || 1));
      const bPct = (b.currentAmount / (b.targetAmount || 1));
      return bPct - aPct;
    });

    const closest = sortedGoals[0];
    const closestPct = ((closest.currentAmount / (closest.targetAmount || 1)) * 100).toFixed(0);

    let responseText = `You are currently tracking ${goals.length} savings goals.\n\n` +
      `Your closest goal to completion is "${closest.name}" which is ${closestPct}% complete (${fmt(closest.currentAmount)} of ${fmt(closest.targetAmount)}).\n\n`;

    if (cleanPrompt.includes('laptop')) {
      const laptopGoal = goals.find((g) => g.name.toLowerCase().includes('laptop'));
      if (laptopGoal) {
        const needed = Math.max(0, laptopGoal.targetAmount - laptopGoal.currentAmount);
        responseText = `For your "${laptopGoal.name}" goal, you have saved ${fmt(laptopGoal.currentAmount)} out of ${fmt(laptopGoal.targetAmount)}. You still need ${fmt(needed)} to reach your goal.`;
      }
    }

    return responseText.trim();
  }

  // 5. Financial Health Queries
  if (match(['score', 'health', 'improve', 'breakdown', 'pillars', 'financial health', 'health score'])) {
    if (accounts.length === 0 && transactions.length === 0 && investments.length === 0 && goals.length === 0) {
      return `Your Financial Health Score is currently uncalculated (0/100) because no accounts, transactions, or goals have been added yet. Link a bank account or wallet to calculate your 5-pillar health score!`;
    }

    const pillars = [
      { name: 'Emergency Fund', val: score.emergencyScore },
      { name: 'Savings Habit', val: score.savingsScore },
      { name: 'Investment Consistency', val: score.investmentScore },
      { name: 'Debt Management', val: score.debtScore },
      { name: 'Spending Control', val: score.spendingScore },
    ];
    const lowestPillar = pillars.sort((a, b) => a.val - b.val)[0];

    return `Your Financial Health Score is ${score.totalScore}/100.\n\n` +
      `Breakdown:\n` +
      `- Emergency Fund: ${score.emergencyScore}/20\n` +
      `- Savings Habit: ${score.savingsScore}/20\n` +
      `- Investment Consistency: ${score.investmentScore}/20\n` +
      `- Debt Management: ${score.debtScore}/20\n` +
      `- Spending Control: ${score.spendingScore}/20\n\n` +
      `Your biggest opportunity to improve is in ${lowestPillar.name} (${lowestPillar.val}/20). Focus on this area to increase your score!`;
  }

  // 6. Account Balance & Net Worth Queries
  if (match(['balance', 'cash', 'money', 'bank', 'wallet', 'accounts', 'net worth', 'total balance'])) {
    if (accounts.length === 0) {
      return `You have not connected any bank accounts or digital wallets yet. Link an institution under the Accounts tab to see your total balances and net worth!`;
    }

    const bankTotal = accounts.filter((a) => a.providerType === 'bank').reduce((sum, a) => sum + a.balance, 0);
    const walletTotal = accounts.filter((a) => a.providerType === 'wallet').reduce((sum, a) => sum + a.balance, 0);
    const total = bankTotal + walletTotal;

    const sortedAccs = [...accounts].sort((a, b) => b.balance - a.balance);
    const topAcc = sortedAccs[0];

    return `You have a total cash balance of ${fmt(total)} across ${accounts.length} connected accounts.\n\n` +
      `- Cash in Banks: ${fmt(bankTotal)}\n` +
      `- Cash in Digital Wallets: ${fmt(walletTotal)}\n` +
      `- Total Net Worth: ${fmt(netWorth)}\n\n` +
      `Your highest balance account is ${topAcc ? topAcc.providerName + ' (' + fmt(topAcc.balance) + ')' : 'none'}.`;
  }

  // Intelligent Fallback
  return `I am your FinHub Financial Coach. Here is what you can ask me:\n\n` +
    `- "How much did I spend this month?"\n` +
    `- "Where am I spending the most?"\n` +
    `- "How can I improve my savings?"\n` +
    `- "Show my active SIP payments"\n` +
    `- "How can I improve my financial score?"\n` +
    `- "What is my total bank balance?"`;
}
