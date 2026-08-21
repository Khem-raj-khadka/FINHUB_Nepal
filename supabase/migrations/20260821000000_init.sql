-- FINHUB NEPAL SQL MIGRATION - INITIAL DB SCHEMA

-- 1. Enable UUID generation extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Users Table (inherits from supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Financial Accounts Table
CREATE TABLE IF NOT EXISTS public.financial_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    provider_name TEXT NOT NULL, -- e.g., 'Nabil Bank', 'eSewa'
    provider_type TEXT NOT NULL, -- e.g., 'bank', 'wallet'
    account_type TEXT NOT NULL,  -- e.g., 'Savings', 'Current', 'Fixed Deposit'
    masked_account_number TEXT NOT NULL, -- e.g., '**** 4582'
    balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    currency TEXT NOT NULL DEFAULT 'NPR',
    is_connected BOOLEAN NOT NULL DEFAULT true,
    last_synced TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.financial_accounts(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
    category TEXT NOT NULL, -- e.g., 'Food & Dining', 'Rent', 'Investment'
    date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Investments Table (SIPs, Stocks, Mutual Funds)
CREATE TABLE IF NOT EXISTS public.investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Nabil Flexi Cap Fund', 'NABIL Stock'
    investment_type TEXT NOT NULL, -- e.g., 'SIP', 'Stock', 'Mutual Fund', 'Fixed Deposit'
    quantity INTEGER NOT NULL DEFAULT 0, -- Used for stocks
    purchase_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    current_value DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    monthly_contribution DECIMAL(15, 2) DEFAULT 0.00, -- Used for SIP
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    next_payment_date TIMESTAMP WITH TIME ZONE, -- Used for SIP
    status TEXT NOT NULL CHECK (status IN ('Active', 'Paused', 'Completed', 'Payment Due', 'Hold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Savings Goals Table
CREATE TABLE IF NOT EXISTS public.savings_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g., 'Emergency Fund', 'New Laptop'
    target_amount DECIMAL(15, 2) NOT NULL,
    current_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    target_date TIMESTAMP WITH TIME ZONE NOT NULL,
    icon TEXT NOT NULL DEFAULT 'Target', -- Name of Lucide icon
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Goal Contributions Table
CREATE TABLE IF NOT EXISTS public.goal_contributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    goal_id UUID NOT NULL REFERENCES public.savings_goals(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    note TEXT
);

-- 8. Financial Scores Table
CREATE TABLE IF NOT EXISTS public.financial_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL CHECK (total_score BETWEEN 0 AND 100),
    emergency_score INTEGER NOT NULL CHECK (emergency_score BETWEEN 0 AND 20),
    savings_score INTEGER NOT NULL CHECK (savings_score BETWEEN 0 AND 20),
    investment_score INTEGER NOT NULL CHECK (investment_score BETWEEN 0 AND 20),
    debt_score INTEGER NOT NULL CHECK (debt_score BETWEEN 0 AND 20),
    spending_score INTEGER NOT NULL CHECK (spending_score BETWEEN 0 AND 20),
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL, -- e.g., 'sip_due', 'milestone', 'spending_alert', 'score_change'
    is_read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 11. Create RLS Policies

-- Users Policies
CREATE POLICY "Users can view their own profile" ON public.users 
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.users 
    FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.users 
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Financial Accounts Policies
CREATE POLICY "Users can manage their own accounts" ON public.financial_accounts 
    FOR ALL USING (auth.uid() = user_id);

-- Transactions Policies
CREATE POLICY "Users can manage their own transactions" ON public.transactions 
    FOR ALL USING (auth.uid() = user_id);

-- Investments Policies
CREATE POLICY "Users can manage their own investments" ON public.investments 
    FOR ALL USING (auth.uid() = user_id);

-- Savings Goals Policies
CREATE POLICY "Users can manage their own savings goals" ON public.savings_goals 
    FOR ALL USING (auth.uid() = user_id);

-- Goal Contributions Policies (through ownership of goal)
CREATE POLICY "Users can manage contributions to their own goals" ON public.goal_contributions 
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.savings_goals 
            WHERE public.savings_goals.id = public.goal_contributions.goal_id 
            AND public.savings_goals.user_id = auth.uid()
        )
    );

-- Financial Scores Policies
CREATE POLICY "Users can view their own financial scores" ON public.financial_scores 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own financial scores" ON public.financial_scores 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications Policies
CREATE POLICY "Users can manage their own notifications" ON public.notifications 
    FOR ALL USING (auth.uid() = user_id);

-- 12. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_financial_accounts_user ON public.financial_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON public.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_investments_user ON public.investments(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_goals_user ON public.savings_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_financial_scores_user ON public.financial_scores(user_id);

-- 13. Auto Updated At Trigger for Users
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
