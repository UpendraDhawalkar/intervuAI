"use client";
import React from "react";

function ProjectSetupPage() {
  return (
    <div className="p-10 max-w-5xl mx-auto text-gray-900 dark:text-gray-200">
      <h1 className="text-4xl font-bold text-primary mb-6">
        Project Setup Guide
      </h1>

      <p className="text-gray-700 dark:text-gray-400 mb-8">
        This page provides all steps required to build and run the Mock
        Interview Web App from scratch using Next.js, Clerk, Drizzle, Stripe,
        and other technologies.
      </p>

      {/* 1. Install Next.js */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">1. Install Next.js</h2>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`PS E:\\yt~ npx create-next-app@latest intervuai
√ Would you like to use TypeScript? ... No / Yes
√ Which linter would you like to use? » None
√ Would you like to use Tailwind CSS? ... No / Yes
√ Would you like your code inside a src/ directory? ... No / Yes
√ Would you like to use App Router? (recommended) ... No / Yes
√ Would you like to use Turbopack? (recommended) ... No / Yes
√ Would you like to customize the import alias (@/* by default)? ... No / Yes`}
        </pre>
      </section>

      {/* Clerk Setup */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">2. Set Up Clerk Authentication</h2>
        
        <p className="pb-2 text-gray-700 dark:text-gray-400">
          Clerk handles authentication and user management.
        </p>

        <p>Install it:</p>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`npm install @clerk/nextjs`}
        </pre>

        <p className="text-gray-700 dark:text-gray-400 mb-2 pt-2">
          Get API keys from{" "}
          <a
            href="https://clerk.com"
            target="_blank"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            Clerk Dashboard
          </a>
        </p>

        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`// .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_key_here
CLERK_SECRET_KEY=your_secret_here`}
        </pre>
      </section>

      {/* Drizzle ORM Setup */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">3. Configure Drizzle ORM</h2>

        <p className="text-gray-700 dark:text-gray-400 mb-2">
          Install:
        </p>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`npm i drizzle-orm @neondatabase/serverless
npm i -D drizzle-kit`}
        </pre>

        <p className="text-gray-700 dark:text-gray-400 mb-2 mt-2">db.js</p>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.NEXT_PUBLIC_DRIZZLE_DB_URL);
export const db = drizzle({ client: sql }, { schema });`}
        </pre>

        <p className="text-gray-700 dark:text-gray-400 mt-2">schema.js</p>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`import { pgTable, serial, text, varchar } from "drizzle-orm/pg-core";

export const MockInterview = pgTable('mockInterview', {
  id: serial('id').primaryKey(),
  jsonMockResp: text('jsonMockResp').notNull(),
  jobPosition: varchar('jobPosition').notNull(),
  jobDesc: varchar('jobDesc').notNull(),
  jobExperience: varchar('jobExperience').notNull(),
  createdBy: varchar('createdBy').notNull(),
  createdAt: varchar('createdAt'),
  mockId: varchar('mockId').notNull()
})`}
        </pre>

        <p className="text-gray-700 dark:text-gray-400 mt-2">Run:</p>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`npm run db:push
npm run db:studio`}
        </pre>
      </section>

      {/* Stripe Setup */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">4. Integrate Stripe</h2>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`link: "https://buy.stripe.com/test_XXXXXXXXXXXX"
priceId: "price_XXXXXXXXXX"`}
        </pre>
      </section>

      {/* Gemini Integration */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">5. Integrate Gemini API</h2>

        <p className="text-gray-700 dark:text-gray-400">
          Get API key from{" "}
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            className="text-blue-600 dark:text-blue-400 underline"
          >
            Google AI Studio
          </a>
        </p>

        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`GEMINI_API_KEY=your_gemini_api_key`}
        </pre>
      </section>

      {/* shadcn UI */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">6. UI Components</h2>
        <p className="text-gray-700 dark:text-gray-400">
          Tailwind + shadcn/ui for UI.
        </p>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`npx shadcn-ui init
npx shadcn-ui add button card dialog`}
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-3">7. Running the Project</h2>
        <pre className="bg-gray-900 text-white dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
{`npm run dev
👉 Open http://localhost:3000`}
        </pre>
      </section>

      <p className="text-center text-gray-700 dark:text-gray-300 mt-10">
        🚀 You're now ready to build your AI-powered Mock Interview web app!
      </p>
    </div>
  );
}

export default ProjectSetupPage;
