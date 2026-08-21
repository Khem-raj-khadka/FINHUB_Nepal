# FinHub Nepal

**One Dashboard. Every Investment. Every Goal.**

FinHub Nepal is a unified financial intelligence dashboard built specifically for the Nepalese ecosystem. It consolidates scattered financial information—such as multiple commercial bank accounts, digital wallets (eSewa, Khalti), SIP trackers, mutual funds, NEPSE stock holdings, savings targets, and outstanding liabilities—into a single, premium, cohesive mobile dashboard.

---

## 1. The Problem
Financial information in Nepal is highly fragmented. A typical user has checking and savings balances across multiple commercial banks (e.g. Nabil Bank, NIC Asia), uses several digital wallets (eSewa, Khalti) for utility payments, tracks SIP mutual funds on separate manager websites, logs stock holdings on NEPSE MeroShare, and writes savings goals on a notepad. To get a simple picture of their net worth, users must manually aggregate data across various screens.

## 2. The FinHub Nepal Solution
FinHub Nepal resolves this fragmentation by establishing a **single dashboard** for:
- **Net Worth Aggregation:** Computes assets (cash + investments) minus liabilities in real-time.
- **Financial Health Score:** Calculates a 100-point index evaluating Emergency Savings, Savings Habit, Investment Consistency, Debt levels, and Budget Control.
- **Smart Micro-Saving:** Round-up simulator supporting rounding thresholds (Rs. 10 to Rs. 500) from daily expense transactions.
- **AI Financial Coach:** A rule-based data analyst that inspects actual store balances and transaction categories to answer questions like *"Where did I spend the most this month?"* or *"How can I improve my health score?"*.
- **SIP Tracker & Reminders:** Lists active systematically invested funds and alerts when payments are due.

---

## 3. Technology Stack
- **Frontend Framework:** React Native with Expo (SDK 57, React Native 0.86, Expo Router, TypeScript).
- **State Management:** Zustand lightweight, in-memory state engine.
- **Form Management:** React Hook Form & Zod schema validation.
- **Charts:** Custom responsive SVG line and donut charts built with `react-native-svg`.
- **Database & Auth:** Supabase PostgreSQL with Row Level Security (RLS) configured.
- **Icons:** Lucide React Native.

---

## 4. Scalable Folder Structure
```text
FinHubNepal/
│
├── .env.example
├── README.md
│
├── src/
│   ├── app/                    # Expo Router file-based pages
│   │   ├── _layout.tsx         # Navigation Stack wrapper & Theme context
│   │   ├── index.tsx           # Session validator & router dispatcher
│   │   ├── onboarding.tsx      # Introduction carousel
│   │   │
│   │   ├── auth/               # Login, Sign up, Forgot Password forms
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot.tsx
│   │   │
│   │   ├── (tabs)/             # Main bottom tabs
│   │   │   ├── home.tsx        # Dashboard, Sparkline, Health score gauge
│   │   │   ├── accounts.tsx    # Cash accounts, Wallets
│   │   │   ├── investments.tsx # SIPs, Stock portfolios
│   │   │   ├── goals.tsx       # Savings goals, Micro-saving controls
│   │   │   └── ai-coach.tsx    # Contextual chatbot coach
│   │   │
│   │   ├── account/            # Details & connection
│   │   │   ├── [id].tsx        # Transaction history, search & filters
│   │   │   └── connect.tsx     # Simulated OTP-less connector
│   │   │
│   │   ├── investment/
│   │   │   └── add.tsx         # Add stock/SIP dynamic form
│   │   │
│   │   ├── goals/
│   │   │   └── add.tsx         # Add savings goal form
│   │   │
│   │   └── settings/
│   │       ├── profile.tsx     # Score breakdown & Theme toggle
│   │       ├── notifications.tsx # Alert inbox
│   │       └── privacy.tsx     # Security policy
│   │
│   ├── components/             # Reusable UI component layer
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── ProgressBar.tsx
│   │       ├── FinancialScore.tsx
│   │       └── SimpleChart.tsx # SVG LineChart & DonutChart
│   │
│   ├── constants/
│   │   └── theme.ts            # Light & Dark style design tokens
│   │
│   ├── services/               # Logic & Algorithms
│   │   ├── calculations.ts     # Health scores, net worth, savings rates
│   │   ├── aiCoach.ts          # Intelligent data-driven answers
│   │   └── mockData.ts         # Rich Nepal-centric dataset
│   │
│   ├── store/
│   │   └── useFinanceStore.ts  # Zustand global dispatcher
│   │
│   ├── types/
│   │   └── index.ts            # Core typescript interfaces
│   │
│   └── lib/
│       └── supabase.ts         # Supabase client wrapper
│
└── supabase/
    └── migrations/
        └── 20260821000000_init.sql # SQL migration schema
```

---

## 5. Environment Variables
To connect the application to a live backend, duplicate `.env.example` as `.env` and fill in your details:
```ini
EXPO_PUBLIC_SUPABASE_URL=your-supabase-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_AI_API_KEY=optional-api-key
```
*Note: If these keys are not supplied, the application automatically enters **Mock Demo Mode**, loading all rich Nepali financial datasets immediately.*

---

## 6. How to Run the Application
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Start the Development Server:**
   ```bash
   npm start
   ```
3. **Deploy or Run Platform Targets:**
   - Run on Android emulator/device: Press `a` (ensure Android SDK is installed).
   - Run on Web browser: Press `w` (loads the responsive web shell).
   - Run on iOS: Press `i` (macOS required).

---

## 7. Hackathon Demo Guide & Flows
The application features three pre-configured judgment flows:
- **Flow 1 (The Demo User):** Splash -> Login Screen -> Tap *"Continue with Demo Account"*. This logs in user **Khem Raj**, loaded with active balance summaries, five accounts (Nabil, NMB, NIC Asia, eSewa, Khalti), active SIPs, stocks, goals, and notifications.
- **Flow 2 (Link Institution):** Go to *Accounts* -> Tap *Link* -> Choose *NMB Bank* or *eSewa* -> Configure account type -> Tap *Connect Demo Account*. The dashboard and cash balance immediately calculate the new values.
- **Flow 3 (Add SIP):** Go to *Investments* -> Tap *Add* -> Fill name, category "Stock" or "SIP", contribution amount, and save -> Portfolio current valuation and return calculations update.
- **Flow 4 (Goals Save/Withdraw):** Go to *Goals* -> Tap *Add Money* on Laptop Goal -> Enter *Rs. 5,000* -> Balance is subtracted from Nabil Bank savings, Laptop goal increases, and the overall score calculates.
- **Flow 5 (AI Chat Coach):** Go to *AI Coach* -> Tap quick chip *"Where did I spend the most this month?"* -> The coach parses actual transaction arrays and answers: *"Your highest spending category this month was Food & Dining. You spent Rs. 8,250 (19% of total)..."*

---

## 8. Database Architecture
The PostgreSQL schema (refer to `supabase/migrations/20260821000000_init.sql`) includes:
- **`users`:** Integrates with Supabase `auth.users` for user management.
- **`financial_accounts`:** Linked credit/checking/wallet connections.
- **`transactions`:** Double-entry ledger (incomes/expenses, category index, date).
- **`investments`:** SIP and NEPSE portfolio values.
- **`savings_goals`:** Targets, timelines, and accumulated balances.
- **`financial_scores`:** Logs historical metrics for score breakdowns.
- **`notifications`:** Tracks inbox alerts for payment schedules or milestones.
All tables enforce **Row Level Security (RLS)** ensuring users only query rows belonging to their own `auth.uid() = user_id`.

---

## 9. Contributors

- **Shreeyan Dangi** ([@shreeyan12](https://github.com/shreeyan12))
- **Khem Raj Khadka** ([@Khem-raj-khadka](https://github.com/Khem-raj-khadka))
- **Sashwot Khadgi** ([@0rdinary-guy](https://github.com/0rdinary-guy))
- **Shekhar Rai** ([@Shekharrai-456](https://github.com/Shekharrai-456))
  
