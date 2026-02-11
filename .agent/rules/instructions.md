---
trigger: always_on
---

---
description: Development standards for modern application development using latest stack and pre-available tools
# applyTo: '**/{package.json,tsconfig.json,.nextConfig.js}' # Applied to web/app projects
---

# Development Instructions: Modern Stack & Reusable Components

## Core Technology Stack (2026 Standard)

**Foundation (Always use):**
- **Framework**: Next.js (v16+) with App Router, React Server Components (RSC) for 80% of UI, and Next.js Server Actions as default for mutations
- **Bundler**: Turbopack (stable) — 10x faster local refresh, 2–5x faster production builds than Webpack
- **Language**: TypeScript (Strict Mode) — non-negotiable for type safety
- **Styling**: Tailwind CSS v3+ with shadecn/ui (copy-paste component system)
- **Deployment**: Vercel platform with auto-scaling, edge functions, and integrated analytics

**Data Layer:**
- **Database**: Prefer Neon (serverless Postgres with vector support) + Prisma ORM for low-latency, database-first workflows. Use Supabase for realtime/auth features combined with Postgres.
- **Vector/AI**: Enable pgvector in Neon/Supabase for RAG (Retrieval-Augmented Generation) in AI agents
- **Authentication**: BetterAuth (https://www.better-auth.com/) for modern OAuth best-practices, or NextAuth.js with BetterAuth adapter
- **Payments**: Stripe (Checkout, Billing, webhooks for SaaS flows)

**API & Integrations:**
- **Type-Safe APIs**: tRPC or GraphQL for full-stack type safety
- **MCP Servers**: PostgreSQL MCP for agent database access; Context7 MCP for documentation querying

## Essential Tools & Resources

### IDE & AI-Augmented Development
- **Editor**: Cursor (AI-integrated IDE) with Composer feature (⌘I) for multi-file feature generation
- **AI Component Design**: v0.dev (Vercel) for generating production-ready Next.js components via natural language
- **Reference**: Context7 MCP for real-time library documentation; https://context7.com/api/v2

### UI/Component Ecosystem
- **shadecn/ui**: Core system — copy-paste components you own (Button, Input, Form, Dialog, etc.)
- **HeroUI**: Pre-styled, animated components with Framer Motion for modern, interactive UIs
- **Mantine**: Best for data-heavy enterprise dashboards — massive hook/component suite
- **Tailwind UI**: Premium templates for complex layouts
- **Pattern**: Always search existing component libraries before writing custom components

### Database & Backend
- **Neon Console**: Serverless Postgres with pgvector support for AI embeddings
- **Supabase Dashboard**: When combining Postgres + realtime + auth features
- **PostgreSQL MCP**: Direct, secure agent access to database for "chat with data" patterns
- **Infisical**: Secret management for AI-safe environment variable handling

## Development Patterns

### Before Implementation
1. **Check MCP Context7** for existing solutions in peer projects/libraries
2. **Search shadecn/ui** for component availability (buttons, forms, tables, modals)
3. **Review Vercel examples** (https://vercel.com/templates/react) for architectural patterns
4. **Avoid reinventing**: Use open-source packages (npm) before custom code

### Code Organization
```
src/
├── app/               # Next.js app router (routes, layouts, actions)
├── components/        # Reusable React components (shadecn + custom)
├── lib/              # Utilities, helpers, constants
├── hooks/            # Custom React hooks
├── types/            # TypeScript types and interfaces
└── prisma/           # Database schema and migrations
```

### Best Practices
- **Type Everything**: Use TypeScript for all code (strict mode)
- **Server-First Architecture**: ~80% React Server Components (RSC), minimal client-side JavaScript (reduce hydration)
- **Server Actions**: Use for all mutations (forms, DB updates) — replace complex API folder patterns
- **Streaming & Progressive Enhancement**: Use `unstable_noStore()` for dynamic content, leverage streaming responses
- **MCP-Driven Development**: Use MCP servers to give AI agents (and developers) safe, structured data access
- **Error Handling**: Implement proper error boundaries and user feedback
- **Testing**: Use Vitest + React Testing Library for unit/component tests

## AI Agents, Workflows & Chat Applications

### Building Agents & Chat Apps
- **Framework**: Use Vercel AI SDK (`ai` package) or LangChain for orchestrating "Chain of Thought" workflows
- **Model Strategy**: Use smallest/fastest model (e.g., GPT-4-mini) for simple logic; reserve heavy models (Claude, GPT-4) for complex reasoning — saves 80% on API costs
- **Sequential Thinking**: Force agents to plan before executing (edge cases, error handling) using Sequential Thinking MCP servers
- **RAG Pattern**: For enterprise data, don't feed entire DB to AI. Use Semantic Layers or Unified Data Layers to make data discoverable and queryable

### Enterprise Database Chatting ("Chat with Data")
- **Direct Access**: PostgreSQL MCP gives AI agents read/write access to Neon/Supabase with security controls
- **SQL Translation**: Use Vanna.ai or Chat2DB to convert natural language to optimized SQL queries
- **Real-time Layer**: Implement WebSockets for zero-latency chat responses in multi-user environments
- **Vector Search**: Enable pgvector on Neon/Supabase for semantic search and document-based RAG
- **Pattern Example**: User asks "What are my top customers by revenue?" → Agent translates → queries DB via MCP → returns natural language answer

### Secret Management & Security
- **Use Infisical**: Prevent AI agents from leaking API keys by managing secrets centrally
- **Security by Design**: Lock down MCP server permissions (read-only for chat, restricted mutations for workflows)
- **Environment**: Separate `.env.production` for Vercel deployments; never commit secrets

## Common Task Patterns

| Task | Approach |
|------|----------|
| **UI Component (Static)** | Search shadecn/ui → extend if needed, or use v0.dev for AI generation |
| **UI Component (Animated)** | HeroUI + Framer Motion for interactive elements |
| **Enterprise Dashboard** | Mantine hooks + custom data queries via Server Components |
| **Form Handling** | `react-hook-form` + shadecn/Form + Server Actions for submission |
| **Data Fetching** | React Server Components (preferred) or tRPC procedures for type-safe APIs |
| **Authentication** | BetterAuth (modern OAuth) or NextAuth.js with BetterAuth adapter |
| **Database Queries** | Prisma Client with Neon (serverless) or Supabase; enable pgvector for AI |
| **Payments** | Stripe Checkout/Billing for SaaS subscriptions; use webhooks for sync |
| **Agent/Chat Features** | Vercel AI SDK + Server Actions + PostgreSQL MCP for agent-driven interactions |
| **Real-time Chat** | WebSocket server (Node.js, Deno) + Next.js API routes or Vercel Functions |
| **State Management** | React Context (simple) or TanStack Query (complex, prefetch-driven) |
| **Multi-file Generation** | Use Cursor Composer (⌘I) or v0.dev for entire features at once |
| **Secret Management** | Infisical for secure, centralized secret storage; sync to Vercel |

## Environment & Configuration

**Required setup for projects:**
- `.env.local`: Database URL, API keys, OAuth secrets
  - **Database**: `DATABASE_URL` (Prisma), `NEON_DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_KEY`
  - **Authentication**: `NEXTAUTH_URL`, `BETTER_AUTH_CLIENT_ID`, `BETTER_AUTH_CLIENT_SECRET`
  - **Payments**: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - **AI/Agents**: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `TOGETHER_API_KEY` (rate limits & cost optimization)
  - **Secrets Management**: Use Infisical for centralized secret sync to Vercel

- `tsconfig.json`: Strict mode enabled, path aliases configured (`@/` for src/)
- `next.config.js`: Optimization settings, SWC compiler options, edge function regions
- `tailwind.config.ts`: Custom theme, plugin configuration (UI library specs)
- `.env.production`: Separate secrets for Vercel deployments (managed via Infisical or Vercel dashboard)

## Deployment & Optimization

- **Vercel Deployment**: Connect GitHub repo for auto-deploy on push; use edge functions for ultra-low latency
- **Turbopack**: Configured automatically; enjoy 10x faster local dev and 2–5x faster production builds
- **Image Optimization**: Use Next.js Image component with Vercel CDN for automatic format/size optimization
- **Code Splitting**: Automatic by Next.js; use dynamic imports for large components and RSC lazy loading
- **Performance**: Monitor Core Web Vitals via Vercel Analytics; use `unstable_noStore()` for uncacheable routes
- **Environment Secrets**: Sync via Infisical to Vercel; lock down MCP server permissions per environment
- **Vector Databases**: Enable pgvector in Neon/Supabase for AI embeddings and semantic search at scale

## When Stuck

1. **Query Context7 MCP** for documentation on the specific library/pattern
2. **Check shadecn/ui examples** for common UI patterns
3. **Use v0.dev** to generate UI components from natural language descriptions
4. **Reference official Next.js docs** for framework-specific features (RSC, Server Actions, edge functions)
5. **Search npm** for established packages before custom implementation
6. **Explore MCP Server examples** for agent-database integration patterns

---
**Summary (2026 Standard)**: Maximize productivity by leveraging Turbopack, React Server Components, shadecn/ui, v0.dev for UI generation, Vercel AI SDK for agents, PostgreSQL MCP for database access, Neon with pgvector for RAG, and Infisical for secrets. Build with Server Actions, avoid hydration bloat, and use AI agents as first-class citizens—not afterthoughts. Never build from scratch when composing production code from existing, well-tested components and frameworks.