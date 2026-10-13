# Admin Dashboard — AI Customer Support & Multi-Tenant Management Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.2.10-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.0-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![Auth.js](https://img.shields.io/badge/NextAuth.js-v5_Beta-purple?logo=auth0)](https://authjs.dev/)
[![Socket.io](https://img.shields.io/badge/Socket.io-v4.8-white?logo=socketdotio)](https://socket.io/)

An enterprise-grade administrative dashboard built with **Next.js 16 (App Router)**, **React 19**, and **Tailwind CSS 4**. Designed to interface directly with the **NestJS Chatbot API** backend, this platform provides multi-tenant website onboarding, AI training document management (RAG knowledge base), live agent conversation monitoring, and real-time AI response streaming with automatic agent takeover.

---

## 📖 Table of Contents

- [Overview & Architecture](#-overview--architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Local Installation & Setup](#-local-installation--setup)
- [Environment Variables](#-environment-variables)
- [Running the Application](#-running-the-application)
- [Testing & Simulating Visitor Chats](#-testing--simulating-visitor-chats)
- [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
- [Available Scripts](#-available-scripts)
- [Code Quality & Best Practices](#-code-quality--best-practices)

---

## 🔭 Overview & Architecture

The application serves as the centralized command center for website operators and live support agents. It acts as the frontend companion to the `chatbot-api` NestJS service:

1. **Server-Side Rendered Performance**: The main analytics dashboard leverages React Server Components (RSC) to aggregate metrics, message trends, and recent activities directly on the server without client-side waterfall requests.
2. **Real-Time Communication**: Integrates with Socket.io WebSockets for bidirectional agent-visitor messaging, instant system notifications, typing indicators, and message delivery statuses.
3. **Automated AI & Human-in-the-Loop Handover**: Supports hybrid AI chatbot and human customer support. When an agent joins or responds in an active conversation, the AI assistant is automatically paused to ensure smooth, non-conflicting customer communication.
4. **Resilient Client State**: Built on Zustand 5 with `useSyncExternalStore` for persistent UI preferences (sidebar toggle, layout state) that eliminate React hydration mismatches and prevent layout shifts.
5. **Declarative Resource Management**: Powered by `@refinedev/core` with custom data providers, role-based access control (RBAC), and debounced search filters.

---

## ✨ Key Features

- 🏢 **Multi-Tenant Administration**: Manage organizations, onboard client websites, and assign role-based permissions (`super_admin`, `admin`, `agent`).
- 📚 **AI Knowledge Base (RAG)**: Upload domain-specific knowledge documents (`.pdf`, `.txt`) with real-time vector processing tracking (`pending`, `processing`, `ready`).
- 💬 **Live Agent Inbox**:
  - Real-time conversation stream powered by WebSockets.
  - Automatic AI takeover logic (AI automatically shuts off when an agent joins or sends a message).
  - Visitor presence indicators, message read receipts, and typing indicators.
- 🧪 **Visitor Chat Simulator**: Integrated visitor widget preview at `/test-chat/[siteId]` to simulate customer interactions and test real-time chat flows.
- 📊 **Analytics & Metrics**: Interactive KPI summary cards, SVG message trend charts, and document distribution breakdown.
- 🛡️ **Enterprise Security & Auth**:
  - NextAuth.js v5 with automatic JWT refresh token rotation.
  - Two-Factor Authentication (2FA) verification flow.
  - Google reCAPTCHA v3 bot prevention (with development bypass toggle).
  - Next.js 16 `proxy.ts` request middleware protecting unauthorized route access.
- 🎨 **Modern Design & Theming**: Dark/Light mode support with Shadcn UI, Radix primitives, and fluid Tailwind CSS 4 styling.

---

## 🛠️ Tech Stack

| Layer                        | Technologies                                                                                                                         |
| :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
| **Framework**                | [Next.js 16.2](https://nextjs.org/) (App Router, Turbopack) & [React 19](https://react.dev/)                                         |
| **Styling & UI**             | [Tailwind CSS 4](https://tailwindcss.com/), [Shadcn UI](https://ui.shadcn.com/) (Radix/Base UI), [Lucide Icons](https://lucide.dev/) |
| **Authentication**           | [NextAuth.js v5 Beta](https://authjs.dev/) (JWT rotation, Credentials provider, 2FA)                                                 |
| **Data & Tables**            | [@refinedev/core](https://refine.dev/), [@refinedev/react-hook-form](https://refine.dev/), Custom Data Providers                     |
| **State Management**         | [Zustand 5](https://zustand-demo.pmnd.rs/) with SSR-safe hydration                                                                   |
| **Forms & Validation**       | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)                                                            |
| **Real-Time & AI**           | [Socket.io Client](https://socket.io/) (bidirectional events) & [Vercel AI SDK](https://sdk.vercel.ai/)                              |
| **Feedback & Notifications** | [Sonner](https://sonner.emilkowal.ski/) toast system & WebSocket notification streams                                                |

---

## 📁 Project Structure

```text
admin-dashboard/
├── app/                          # Next.js App Router
│   ├── (auth)/login/             # Login & 2FA verification pages
│   ├── api/                      # Next.js BFF Route Handlers (auth, refresh proxy)
│   ├── dashboard/                # Protected admin console pages
│   │   ├── chats/                # Live agent chat inbox & conversation rooms
│   │   ├── documents/            # AI training documents & upload portal
│   │   ├── organizations/        # Organization hierarchy (Super Admin)
│   │   ├── profile/              # User profile & avatar management
│   │   ├── sites/                # Website integration & agent assignments
│   │   ├── users/                # User management & role assignment
│   │   ├── layout.tsx            # Authenticated layout (Sidebar, Header, Breadcrumbs)
│   │   └── page.tsx              # Server Component analytics dashboard
│   ├── test-chat/                # Embedded customer widget simulator (/test-chat/[siteId])
│   ├── layout.tsx                # Root layout with ThemeProvider and SessionProvider
│   └── provider.tsx              # SessionProvider client wrapper
├── components/                   # Reusable UI & business components
│   ├── chat/                     # Message lists, input bar, chat widgets
│   ├── dashboard/                # KPI cards, charts, drawers, pagination, dialogs
│   ├── providers/                # Refine DataProvider & AccessControlProvider
│   ├── sites/                    # Decomposed site table & site modal dialogs
│   ├── ui/                       # Shadcn UI primitives (Button, Dialog, Card, Badge, etc.)
│   └── users/                    # Decomposed user table & user modal dialogs
├── hooks/                        # Custom reusable hooks (e.g. useTableFilter)
├── lib/                          # Utilities, reCAPTCHA loader, Zod schemas
├── services/                     # Server-side data access layer (dashboard.service.ts)
├── store/                        # Zustand stores (UI, Notifications, Agent & Visitor chat)
├── types/                        # TypeScript domain interfaces & Refine declarations
├── auth.ts                       # NextAuth configuration and token refresh handlers
├── proxy.ts                      # Next.js 16 proxy convention for route protection
└── next.config.ts                # Next.js configuration
```

---

## 📋 Prerequisites

Before setting up the dashboard, ensure you have the following installed:

- **Node.js**: `v20.x` or higher (Node 20+ LTS recommended)
- **npm** (comes with Node), **pnpm**, or **yarn**
- **Docker** (recommended for running the PostgreSQL database with vector support)
- **Chatbot API Backend**: The NestJS backend (`chatbot-api`) running on port `3000`

---

## ⚙️ Local Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd admin-dashboard
```

### 2. Install Dependencies

Install the project packages using `npm`:

```bash
npm install
```

> **Note**: This project utilizes React 19 and Next.js 16. Dependencies are pre-configured to install smoothly without peer dependency conflicts.

---

### 3. Configure Environment Variables

Create a local `.env.local` file by copying the provided example:

```bash
cp .env.example .env.local
```

Open `.env.local` in your editor and configure the variables:

```env
# NextAuth Secret: Generate one using `npx auth secret` or `openssl rand -base64 32`
AUTH_SECRET=your_auth_secret_here

# Server-Side Backend URL (used by Server Components, Server Actions, auth.ts)
API_URL=http://localhost:3000

# Client-Side Backend URL (used by browser fetches and Refine data provider)
NEXT_PUBLIC_API_URL=http://localhost:3000

# WebSocket Gateway URL for live notifications and alerts
NEXT_PUBLIC_WS_URL=http://localhost:3000/notifications

# Google reCAPTCHA v3 Configuration
# Set to 'true' during local development to bypass reCAPTCHA verification
NEXT_PUBLIC_DISABLE_RECAPTCHA=true
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_site_key_here

# Chat pagination default
NEXT_PUBLIC_CHAT_PAGE_SIZE=10
```

---

### 4. Ensure the Backend (`chatbot-api`) is Running

The dashboard requires the NestJS backend to authenticate users and persist data.

1. Navigate to the `chatbot-api` directory:
   ```bash
   cd ../chatbot-api
   ```
2. Start the PostgreSQL container (with `pgvector`):
   ```bash
   docker compose up -d
   ```
3. Run TypeORM migrations:
   ```bash
   npm run migration:run
   ```
4. Start the NestJS backend server:
   ```bash
   npm run start:dev
   ```
   _The backend will be available at `http://localhost:3000` with Swagger docs at `http://localhost:3000/api`._

---

### 5. Start the Admin Dashboard

Return to the `admin-dashboard` directory:

```bash
cd ../admin-dashboard
npm run dev
```

Open your browser and navigate to:

```
http://localhost:3001
```

_(The dashboard runs on port `3001` to prevent collisions with the backend on port `3000`.)_

---

## 🧪 Testing & Simulating Visitor Chats

To test end-to-end conversation flows and AI streaming in local development:

1. **Log In**:
   - Access `http://localhost:3001/login`.
   - Log in with your admin credentials (or create one using the backend `POST /users` endpoint or Swagger at `http://localhost:3000/api`).
2. **Create a Website**:
   - Navigate to **Websites** (`/dashboard/sites`).
   - Click **Add Website**, input a name (e.g. `My Store`) and URL (e.g. `https://mystore.com`), and save.
3. **Launch the Visitor Chat Simulator**:
   - In the websites table, click the **Test-Chatting** button on your site row.
   - This opens the simulator at `/test-chat/[siteId]`.
   - Enter a visitor name and email, then click **Start Chat**.
   - Send messages to trigger AI responses or document-based answers.
4. **Agent Live Takeover**:
   - In another browser window/tab, log in as an Agent or Admin and navigate to **Live Chats** (`/dashboard/chats`).
   - Open the active conversation room.
   - Send a message as an agent: the AI assistant will automatically be paused, and the visitor will receive responses directly from the human agent in real time.

---

## 🔐 Role-Based Access Control (RBAC)

The dashboard enforces role-based access control across navigation, data fetching, and action buttons:

| Resource / Feature           |        SUPER_ADMIN         |          ADMIN          |         AGENT         |
| :--------------------------- | :------------------------: | :---------------------: | :-------------------: |
| **Analytics Dashboard**      |        Full Access         |       Full Access       |      Full Access      |
| **Organizations Management** | View, Create, Edit, Delete |         Hidden          |        Hidden         |
| **User Administration**      |  Manage all users & roles  | Manage own organization |        Hidden         |
| **Websites Management**      |         Full CRUD          |   Full CRUD (own org)   | View & Test Chat only |
| **AI Documents (RAG)**       |      Upload & Delete       |     Upload & Delete     |       View only       |
| **Live Chat Inbox**          |     All conversations      |    All conversations    |   Assigned websites   |

---

## 📜 Available Scripts

| Command                | Description                                                                 |
| :--------------------- | :-------------------------------------------------------------------------- |
| `npm run dev`          | Starts the Next.js development server with Turbopack on port `3001`         |
| `npm run build`        | Compiles and validates the production application bundle                    |
| `npm run start`        | Runs the compiled production server on port `3001`                          |
| `npm run typecheck`    | Runs the TypeScript compiler (`tsc --noEmit`) to verify types               |
| `npm run lint`         | Runs ESLint 9 to inspect code quality and adherence to React best practices |
| `npm run format`       | Automatically formats the entire codebase with Prettier                     |
| `npm run format:check` | Verifies code formatting consistency without modifying files                |

---

## 💎 Code Quality & Best Practices

- **Strict TypeScript**: Every component, hook, and service is fully typed with zero `any` evasions.
- **Modern Next.js 16 Conventions**: Uses `proxy.ts` for edge request filtering and Server Actions for authentication.
- **Component Decomposition**: Large views are split into single-responsibility subcomponents (`SiteTable`, `SiteFormDialog`, `UserTable`, `UserFormDialog`, `KpiCards`, `MessageTrendChart`).
- **Shared Data Hooks**: URL-synced search filtering and debounced queries are standardized via `useTableFilter`.
- **Zero Hydration Mismatch**: Client stores utilizing `localStorage` use `useSyncExternalStore` subscriptions to maintain SSR integrity.
