# CollabPortal — Academia–Industry Collaboration Platform

A web platform connecting **Students**, **Faculty**, **Industries**, and **Institutions** to bridge the talent-readiness divide through **deterministic skill mapping**, **explainable opportunity matching**, **verifiable digital credentials**, and **structured academia–industry collaboration**.

---

## Architecture & System Overview

CollabPortal is designed as a high-performance modular monolith with strict role boundaries:

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, TanStack Query, React Router, Lucide Icons.
- **Backend**: NestJS 10, Node.js 20, TypeScript, Prisma ORM, PostgreSQL.
- **API Architecture**: RESTful `/api/v1` architecture with structured error masking, uniform JSON envelopes, and request correlation IDs.
- **Matching Engine**: 100% deterministic, rule-based matching and skill-gap evaluation. Transparent scoring criteria without black-box or non-deterministic algorithms.
- **Role-Based Access Control (RBAC)**: Distinct permissions for `STUDENT`, `FACULTY`, `INDUSTRY`, `INSTITUTION_ADMIN`, and `SUPER_ADMIN` enforced at both API guard and database query layers.

---

## Core Capabilities

- **Skill Profiling & Taxonomy**: Standardized skill catalog with self-declared and verified proficiency levels.
- **Skill Assessments**: Timed, domain-specific assessments with deterministic scoring.
- **Skill-Gap Analysis & Remediation**: Granular gap analysis comparing student profiles against live industry career roles with curated learning pathways.
- **Opportunity Marketplace**: Internship and placement listings with explainable fit scoring and deadline management.
- **Application & Recruitment Workflow**: Structured multi-stage recruitment pipeline (`APPLIED` → `UNDER_REVIEW` → `SHORTLISTED` → `INTERVIEW_SCHEDULED` → `SELECTED`).
- **Placement & Offer Management**: Formal offer letter tracking, institutional verification, and NOC workflow.
- **Mentorship Hub**: Mentor discovery, availability management, and 1-on-1 session tracking.
- **Academia–Industry Collaborations**: Faculty development programs (FDPs), industry research projects, workshops, and guest lecture initiatives.
- **Institutional Analytics**: Real-time dashboards on student readiness, department placement funnels, and live industry demand.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, TanStack Query 5, React Router 6 |
| **Backend** | NestJS 10, TypeScript, Node.js 20, Passport JWT, class-validator |
| **Database & ORM** | PostgreSQL, Prisma ORM 5.22 |
| **Testing** | Vitest, Testing Library |
| **Target Deployment** | Vercel (Frontend & Serverless Backend) + Supabase PostgreSQL |

---

## Local Development Setup

### Prerequisites

- **Node.js**: `v20.x` or higher
- **npm**: `v9.x` or higher
- **PostgreSQL**: `v16.x` or higher (local or managed instance such as Supabase)

### Setup Instructions

1. **Clone the repository and install dependencies:**
   ```bash
   git clone <repository-url>
   cd collabportal
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   cp frontend/.env.example frontend/.env
   ```
   *Edit `.env` and `frontend/.env` with your local database connection string and configuration settings.*

3. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

4. **Apply database migrations:**
   ```bash
   npm run prisma:migrate:deploy --workspace=backend
   ```

5. **Start development servers:**
   ```bash
   npm run dev
   ```
   - **Frontend Application**: `http://localhost:5173`
   - **Backend API**: `http://localhost:4000/api/v1`
   - **Swagger API Docs**: `http://localhost:4000/api/docs`

---

## Verification & Quality Assurance

The codebase includes automated unit and integration tests across both workspaces:

```bash
# Run all workspace test suites
npm run test

# Run backend test suite
npm run test:backend

# Run frontend test suite
npm run test:frontend

# Static TypeScript typecheck across all workspaces
npm run typecheck

# Code formatting and lint check
npm run lint

# Compile production builds
npm run build
```

---

## License

UNLICENSED — All rights reserved.
