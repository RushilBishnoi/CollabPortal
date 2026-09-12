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
# SIH 2026 Project Repository

This repository contains the implementation of an **Academia–Industry Collaboration Platform for Skill Mapping, Internships and Placement** developed as a solution for SIH 2026.

The platform connects **students, faculty, industries/recruiters, and institutions** through a unified web-based system for skill assessment, career mapping, industry collaboration, internships, recruitment, and placement.

## 1. Project Information

- **Project Title:** Academia–Industry Collaboration Platform for Skill Mapping, Internships and Placement
- **PS ID:** SIH2026-PS-44
- **PS Title:** Portal for Academia–Industry Collaboration for Skill Mapping, Internships and Placement
- **Category:** Software
- **Theme:** Education / Skill Development / Employment

## 2. Problem Statement

Students may have difficulty understanding their current skill levels, identifying skill gaps, finding suitable career opportunities, and connecting with relevant industries.

At the same time, industries may face challenges in finding candidates with the required skills, while institutions and faculty need better mechanisms to coordinate internships, placements, industry collaborations, training, mentorship, and academic-industry activities.

A unified platform is required to connect these stakeholders and provide a structured workflow for **skill mapping, skill-gap identification, opportunity discovery, industry collaboration, recruitment, and placement tracking**.

## 3. Proposed Solution

Our platform provides a centralized web-based ecosystem connecting **students, faculty, industries/recruiters, and institutions/administrators**.

Students can create skill profiles, complete assessments, identify skill gaps, explore career roles, discover internships and jobs, apply for opportunities, track applications, and maintain verified digital portfolios.

Industries can define required skills, publish opportunities, discover eligible candidates, manage applications, and conduct recruitment activities.

Faculty can participate in industry internships, FDPs, research, consultancy, mentorship, workshops, guest lectures, and live projects.

Institutions can monitor student skills, internships, placements, industry engagement, and overall outcomes through dashboards and analytics.

The platform uses **deterministic, rule-based and explainable matching algorithms** rather than depending on machine learning as a core requirement.

## 4. Key Features

- User registration and secure authentication
- Role-based access control
- Student skill profiling
- Faculty profiles
- Industry and recruiter profiles
- Institution and administrator dashboards
- Skill assessment
- Skill-gap analysis
- Career-role mapping
- Industry skill requirement management
- Internship discovery
- Job and placement opportunities
- Apprenticeship and training opportunities
- Deterministic opportunity matching
- Explainable candidate ranking
- Application management
- Recruitment pipeline tracking
- Interview and selection workflow
- Digital student portfolios
- Certification and document management
- Portfolio and credential verification
- Faculty internships and FDP opportunities
- Research and consultancy collaboration
- Mentorship programs
- Workshops and guest lectures
- Industry live projects
- Notifications
- Institutional analytics and reporting
- Industry skill-demand analytics
- Placement and internship tracking
- Secure document storage

## 5. Technology Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Frontend State / Data:** TanStack Query
- **Forms & Validation:** React Hook Form, Zod
- **Routing:** React Router
- **Charts & Analytics:** Recharts
- **Backend:** Node.js, TypeScript, NestJS
- **API:** REST API
- **Authentication:** JWT with access and refresh tokens
- **Authorization:** Role-Based Access Control (RBAC)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **File Storage:** Object Storage
- **Deployment:** Docker / Cloud

## 6. Architecture

See [docs/architecture.md](docs/architecture.md).

```text
Students
   |
Faculty
   |
Industry / Recruiters
   |
Institutions / Admin
   |
   v
Frontend Web Application
   |
   v
Backend API
   |
   +--------------------> PostgreSQL Database
   |
   +--------------------> File / Object Storage
   |
   +--------------------> Skill Assessment
   |
   +--------------------> Skill Gap Engine
   |
   +--------------------> Matching Engine
   |
   +--------------------> Opportunity Management
   |
   +--------------------> Application & Recruitment
   |
   +--------------------> Collaboration Management
   |
   +--------------------> Analytics & Reporting
   |
   v
Ranked Opportunities / Applications /
Collaboration / Placement Outcomes
   |
   v
Frontend Dashboards

CORE PLATFORM WORKFLOW:
Student
   |
   v
Skill Assessment
   |
   v
Skill Profile
   |
   v
Skill Gap Analysis
   |
   v
Career Role Mapping
   |
   v
Industry Skill Requirements
   |
   v
Deterministic Matching Engine
   |
   v
Ranked Opportunities
   |
   v
Application
   |
   v
Recruitment Process
   |
   v
Internship / Placement
   |
   v
Portfolio & Outcome Update

6.REPOSITORY STRUCTURE:

YOUR-SIH-PROJECT/
├── README.md
├── SUBMISSION_GUIDE.md
├── submission/
│   ├── PRESENTATION.md
│   └── DEMO.md
├── frontend/
│   ├── src/
│   ├── public/
│   └── ...
├── backend/
│   ├── src/
│   ├── prisma/
│   └── ...
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   ├── api-specification.md
│   ├── security-requirements.md
│   ├── ui-ux-guidelines.md
│   └── development-principles.md
├── assets/
│   └── screenshots/
│       └── README.md
├── .antigravity/
│   ├── rules.md
│   ├── workflows/
│   └── docs/
├── .gitignore
├── LICENSE
└── package.json

7.WHAT GOES WHERE?

| Item                                   | Location              |
| -------------------------------------- | --------------------- |
| Frontend source code                   | `frontend/`           |
| Backend source code                    | `backend/`            |
| Database schema / migrations           | `backend/prisma/`     |
| Architecture / technical documentation | `docs/`               |
| AI coding-agent rules and workflows    | `.antigravity/`       |
| Project screenshots                    | `assets/screenshots/` |
| Final PPT / presentation               | `submission/`         |
| Demo video link                        | `submission/DEMO.md`  |
| Project overview                       | `README.md`           |

8. Final Presentation

https://drive.google.com/file/d/1-rcDOcgFAC0FgyvkB1Wro1MCskSIcCLf/view?usp=drivesdk

10. Screenshots / Prototype Photos

See assets/screenshots/README.md for examples and naming conventions.

11. Installation

git clone <https://github.com/RushilBishnoi/CollabPortal.git>
cd <GIT SIH>

Install frontend dependencies:

cd frontend
npm install

Install backend dependencies:

cd ../backend
npm install

Initialize the database according to the Prisma configuration:

npx prisma generate
npx prisma migrate dev

12. Run

Start the backend:

cd backend
npm run start:dev

Start the frontend in another terminal:

cd frontend
npm run dev

13. Future Scope

The platform can be extended with additional features such as:

Advanced industry–academia collaboration workflows
Integration with external job and internship portals
University ERP integration
External certification verification
Automated placement reports
Advanced career-path planning
Mobile application support
Multi-institution deployment
Additional analytics and benchmarking
Calendar and interview scheduling integrations
Advanced notification channels
AI-assisted career guidance as an optional future enhancement
AI-assisted resume and portfolio analysis as an optional future enhancement

The core platform is designed so that future AI/ML capabilities can be introduced without making them a dependency for the primary workflows.
