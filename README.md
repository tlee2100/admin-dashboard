# Admin Dashboard

A robust Next.js administrative dashboard application designed to interface with the Chatbot API backend. It provides an interface for site management, user administration, chat monitoring, and document management.

## Tech Stack

This project is built with a modern React stack:

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Authentication**: [NextAuth.js (v5 beta)](https://authjs.dev/)
- **Data Fetching / Admin Framework**: [@refinedev/core](https://refine.dev/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Forms**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) for validation
- **Real-Time**: [Socket.io Client](https://socket.io/) for real-time chat and notifications

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- The NestJS backend (Chatbot API) must be running on `http://localhost:3000`

### Installation

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy the provided `.env.example` to `.env.local` and configure your local settings.

   ```bash
   cp .env.example .env.local
   ```

   _Note: Ensure `API_URL` and `NEXT_PUBLIC_API_URL` point to your backend API._

3. Start the development server:
   ```bash
   npm run dev
   ```

The application will start on [http://localhost:3001](http://localhost:3001) by default.

## Available Scripts

- `npm run dev` - Starts the development server on port 3001.
- `npm run build` - Builds the application for production.
- `npm run start` - Starts the production server on port 3001.
- `npm run lint` - Runs ESLint.
- `npm run format` - Formats code using Prettier.
- `npm run typecheck` - Validates TypeScript types without emitting compiled files.

## Project Structure

```text
admin-dashboard/
├── app/                  # Next.js App Router pages and API routes
├── components/           # Reusable UI components (Shadcn, Custom)
├── lib/                  # Utility functions and configurations
├── store/                # Zustand global state stores
├── types/                # TypeScript type definitions
├── auth.ts               # NextAuth configuration and providers
└── next.config.ts        # Next.js configuration
```

## Core Features

- **Authentication**: Secure login integrated with backend JWTs via NextAuth.
- **Site Management**: Create and manage configured sites.
- **Agent Dashboard**: Real-time interaction with visitors through WebSockets.
- **Documents**: File upload and management interface.
- **Notifications**: Real-time system notifications powered by Socket.io.
