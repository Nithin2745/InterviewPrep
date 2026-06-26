# ⚡ PlacementPrep Tracker

PlacementPrep Tracker is a premium, feature-rich web application designed to help software engineering students and job aspirants prepare for technical interviews and placement rounds. It combines live progress tracking, structured roadmaps, an interactive coding workspace, and a personalized AI coding coach.

---

## 🚀 Key Features

*   **📊 Dynamic Dashboard & Streak Tracker:** Visualizes preparation statistics, tracks a live consecutive-day practice streak (complete with glowing micro-animations), and displays active roadmap tasks.
*   **🗺️ Interactive Roadmaps:** Generates structured weekly schedules customized based on your onboarding score, technical background, and strengths/weaknesses.
*   **🧰 Full Practice Workspace:** An integrated code editor supporting **Python 🐍, C++ ⚡, Java ☕, and JavaScript 🟨**. Features include tab-spacings, bracket auto-closing, real-time debounced syntax compilation warnings, and an execution console.
*   **🤖 PrepBot (AI Coding Coach):** A floating AI-powered programming tutor and DSA assistant that:
    *   Has real-time, context-aware access to your editor code, recent terminal execution logs, active problem description, and profile details.
    *   Helps you identify syntax errors, logic bugs, and time/space complexity improvements.
    *   **Straitjacket Guardrails:** Strictly constrained to ONLY answer questions regarding programming, Data Structures & Algorithms (DSA), and PlacementPrep website guide, politely declining unrelated questions.
*   **🧩 Visual Pattern Library:** Explains core algorithmic concepts (e.g., Two Pointer, Sliding Window, Backtracking) with complexity breakdowns and worked examples.
*   **🏢 Company Prep:** Curated set of questions frequently asked in technical rounds for top tech companies (TCS, etc.).
*   **🧮 Aptitude & Resources:** Dedicated modules to prepare for quantitative reasoning, logical aptitude, and curated links for placement preparation.
*   **🔑 Device Syncing:** Synchronizes study progress, activity logs, streaks, settings, and roadmaps across multiple devices.

---

## 🛠️ Tech Stack

*   **Framework:** Next.js (App Router), React, TypeScript
*   **Styling:** Tailwind CSS v4, Vanilla CSS
*   **State Management:** Zustand (with local storage persistence middleware)
*   **Database & ORM:** Prisma ORM with Supabase (PostgreSQL)
*   **Icons:** Lucide React
*   **AI Integration:** OpenRouter API (calls models like Owl Alpha for code compilation simulation and tutoring)

---

## 📦 Getting Started

### Prerequisites

*   Node.js (v18.x or higher)
*   npm, yarn, or bun installed

### Installation & Configuration

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Nithin2745/InterviewPrep.git
    cd InterviewPrep
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the root directory and configure the following parameters:
    ```env
    # Supabase connection pooled URL (port 6543) - used by Next.js/Vercel
    DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

    # Supabase direct connection URL (port 5432) - used for Prisma migrations/pushes
    DIRECT_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[YOUR-REGION].pooler.supabase.com:5432/postgres"

    OPENROUTER_API_KEY="your_openrouter_api_key_here"
    OPENROUTER_MODEL="openrouter/owl-alpha"
    ```

4.  **Initialize the Database:**
    Generate the Prisma client and push the schema to Supabase:
    ```bash
    npx prisma db push
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    ```
    Open [http://localhost:3000](http://localhost:3000) in your browser to start tracking your interview prep!

---

## 🛠️ Git & Security Safeguards

*   **`.env`**: Configured to hold all database connections and AI API keys; git-ignored by default.
*   **Local Databases**: Previously used SQLite DB instances (`prisma/dev.db`, etc.) are ignored. The application is configured to run on cloud-hosted Supabase (PostgreSQL).