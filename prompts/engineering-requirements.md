# Engineering Requirements Document: Vouch

> **Status:** Ready for Engineering  
> **Version:** 1.0  
> **Source:** [updated-product-requirements.md](./updated-product-requirements.md)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Environment Configuration](#environment-configuration)
5. [Database Schema](#database-schema)
6. [API Design](#api-design)
7. [Component Breakdown](#component-breakdown)
8. [Engineering Tasks](#engineering-tasks)
9. [Clarifying Questions](#clarifying-questions)

---

## System Overview

Vouch is a web application for event invitations with pari-mutuel betting. The system consists of:

- **Single containerized Next.js application** (API routes + React frontend)
- **PostgreSQL database** (via Prisma ORM)
- **External SMS service** (mocked in local, real in local-prod/production)
- **File storage for images** (mocked in local, S3 in production)

### Scale Assumptions

| Metric | Max Value |
|--------|-----------|
| Total users | 50 |
| Total events | 50 |
| Concurrent bets | 20 |
| Attendees per event | ~15 |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client (Browser)                      │
│                   Mobile-optimized React UI                  │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTPS
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     Next.js Application                      │
│  ┌─────────────────┐  ┌─────────────────────────────────┐   │
│  │   React Pages   │  │       API Routes (/api/*)       │   │
│  │   & Components  │  │  - Auth (OTP)                   │   │
│  │                 │  │  - Events                       │   │
│  │                 │  │  - Outcomes & Bets              │   │
│  │                 │  │  - Settlements                  │   │
│  └─────────────────┘  └─────────────────────────────────┘   │
│                                  │                           │
│                                  ▼                           │
│                        ┌─────────────────┐                   │
│                        │  Prisma Client  │                   │
│                        └────────┬────────┘                   │
└─────────────────────────────────┼───────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
     │  PostgreSQL │     │ SMS Service │     │ File Storage│
     │  (Docker)   │     │ (Twilio)    │     │ (S3/Local)  │
     └─────────────┘     └─────────────┘     └─────────────┘
```

### Deployment Architecture (ECS Fargate)

```
┌─────────────────────────────────────────────────────────────┐
│                          AWS                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Route 53  │─▶│     ALB     │─▶│    ECS Fargate      │  │
│  │   (DNS)     │  │             │  │  ┌───────────────┐  │  │
│  └─────────────┘  └─────────────┘  │  │  Next.js App  │  │  │
│                                     │  │  (1 task)     │  │  │
│                                     │  └───────────────┘  │  │
│                                     └─────────────────────┘  │
│                                              │               │
│                    ┌─────────────────────────┼───────┐       │
│                    ▼                         ▼       ▼       │
│           ┌─────────────┐           ┌─────────┐ ┌─────────┐  │
│           │  RDS Postgres│           │ Twilio  │ │   S3    │  │
│           │  (t3.micro) │           │ (ext)   │ │         │  │
│           └─────────────┘           └─────────┘ └─────────┘  │
└─────────────────────────────────────────────────────────────┘
```

> **Clarifying Question:** Should we use RDS or a self-managed Postgres on ECS for cost optimization? RDS t3.micro is ~$15/month; self-managed could be cheaper but adds operational burden.
[answer] RDS t3.micro
---

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.1.1 |
| **Language** | TypeScript | 5.x |
| **Database** | PostgreSQL | 16 |
| **ORM** | Prisma | Latest |
| **Styling** | Tailwind CSS | 3.x |
| **UI Components** | shadcn/ui | Latest |
| **Icons** | Lucide React | Latest |
| **Containerization** | Docker | Latest |
| **Local Orchestration** | Docker Compose | Latest |
| **Production Hosting** | AWS ECS Fargate | - |
| **SMS Provider** | Twilio | - |
| **File Storage** | AWS S3 (prod) / Local (dev) | - |

---

## Environment Configuration

### Environment Profiles

| Profile | Purpose | External Services                                     |
|---------|---------|-------------------------------------------------------|
| `local` | Development with mocks | All mocked (SMS logs to console, files to local disk) |
| `local-prod` | Local testing with real services | Real Twilio, real S3                                  |
| `production` | Deployed environment | Real Twilio, real S3, RDS                             |

### Environment Variables

```bash
# .env.example

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/vouch"

# Environment profile: local | local-prod | production
NODE_ENV="local"

# SMS (Twilio) - only needed for local-prod and production
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_PHONE_NUMBER=""

# File Storage (S3) - only needed for local-prod and production
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION=""
S3_BUCKET_NAME=""

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
JWT_SECRET="your-secret-key"
OTP_EXPIRY_MINUTES=5
```

### Docker Compose (Local Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://vouch:vouch@db:5432/vouch
      - NODE_ENV=local
    depends_on:
      - db
    volumes:
      - ./:/app
      - /app/node_modules
      - ./uploads:/app/uploads  # Local file storage

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: vouch
      POSTGRES_PASSWORD: vouch
      POSTGRES_DB: vouch
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐       ┌──────────────────┐       ┌─────────────┐
│    User     │       │  EventMembership │       │    Event    │
├─────────────┤       ├──────────────────┤       ├─────────────┤
│ id (PK)     │◄──────│ user_id (FK)     │───────▶│ id (PK)     │
│ phone       │       │ event_id (FK)    │       │ title       │
│ display_name│       │ role             │       │ datetime    │
│ photo_url   │       │ rsvp_status      │       │ location    │
│ created_at  │       │ created_at       │       │ description │
└─────────────┘       └──────────────────┘       │ cover_image │
      │                                          │ is_public   │
      │                                          │ status      │
      │                                          │ invite_code │
      │                                          │ created_at  │
      │                                          └─────────────┘
      │                                                 │
      │         ┌─────────────┐       ┌─────────────┐   │
      │         │   Option    │       │   Outcome   │   │
      │         ├─────────────┤       ├─────────────┤   │
      │         │ id (PK)     │◄──────│ id (PK)     │◄──┘
      │         │ outcome_id  │       │ event_id    │
      │         │ label       │       │ creator_id  │
      │         │ created_at  │       │ question    │
      │         └─────────────┘       │ status      │
      │                │              │ winning_opt │
      │                │              │ created_at  │
      │                ▼              └─────────────┘
      │         ┌─────────────┐
      │         │     Bet     │
      │         ├─────────────┤
      └────────▶│ id (PK)     │
                │ user_id     │
                │ option_id   │
                │ amount      │
                │ created_at  │
                │ updated_at  │
                └─────────────┘

┌───────────────────┐
│    Settlement     │
├───────────────────┤
│ id (PK)           │
│ event_id (FK)     │
│ from_user_id (FK) │
│ to_user_id (FK)   │
│ amount            │
│ is_settled        │
│ settled_at        │
│ created_at        │
└───────────────────┘

┌─────────────┐
│  OtpCode    │
├─────────────┤
│ id (PK)     │
│ phone       │
│ code        │
│ expires_at  │
│ verified    │
│ created_at  │
└─────────────┘
```

### Prisma Schema

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id          String   @id @default(cuid())
  phone       String   @unique
  displayName String   @map("display_name")
  photoUrl    String?  @map("photo_url")
  createdAt   DateTime @default(now()) @map("created_at")

  memberships  EventMembership[]
  bets         Bet[]
  outcomes     Outcome[]         @relation("OutcomeCreator")
  settlementsFrom Settlement[]   @relation("SettlementFrom")
  settlementsTo   Settlement[]   @relation("SettlementTo")

  @@map("users")
}

model Event {
  id          String      @id @default(cuid())
  title       String
  datetime    DateTime
  location    String
  description String?
  coverImage  String?     @map("cover_image")
  isPublic    Boolean     @default(false) @map("is_public")
  status      EventStatus @default(UPCOMING)
  inviteCode  String      @unique @map("invite_code")
  createdAt   DateTime    @default(now()) @map("created_at")

  memberships EventMembership[]
  outcomes    Outcome[]
  settlements Settlement[]

  @@map("events")
}

enum EventStatus {
  UPCOMING
  ACTIVE
  COMPLETED
  RESOLVED
}

model EventMembership {
  id         String     @id @default(cuid())
  userId     String     @map("user_id")
  eventId    String     @map("event_id")
  role       MemberRole
  rsvpStatus RsvpStatus @default(PENDING) @map("rsvp_status")
  createdAt  DateTime   @default(now()) @map("created_at")

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([userId, eventId])
  @@map("event_memberships")
}

enum MemberRole {
  HOST
  COHOST
  ATTENDEE
}

enum RsvpStatus {
  PENDING
  YES
  NO
  MAYBE
}

model Outcome {
  id              String        @id @default(cuid())
  eventId         String        @map("event_id")
  creatorId       String        @map("creator_id")
  question        String
  status          OutcomeStatus @default(OPEN)
  winningOptionId String?       @map("winning_option_id")
  createdAt       DateTime      @default(now()) @map("created_at")

  event   Event   @relation(fields: [eventId], references: [id], onDelete: Cascade)
  creator User    @relation("OutcomeCreator", fields: [creatorId], references: [id])
  options Option[]

  @@map("outcomes")
}

enum OutcomeStatus {
  OPEN
  LOCKED
  RESOLVED
  REFUNDED
}

model Option {
  id        String   @id @default(cuid())
  outcomeId String   @map("outcome_id")
  label     String
  createdAt DateTime @default(now()) @map("created_at")

  outcome Outcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  bets    Bet[]

  @@map("options")
}

model Bet {
  id        String   @id @default(cuid())
  userId    String   @map("user_id")
  optionId  String   @map("option_id")
  amount    Decimal  @db.Decimal(10, 2)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  option Option @relation(fields: [optionId], references: [id], onDelete: Cascade)

  @@unique([userId, optionId])
  @@map("bets")
}

model Settlement {
  id         String    @id @default(cuid())
  eventId    String    @map("event_id")
  fromUserId String    @map("from_user_id")
  toUserId   String    @map("to_user_id")
  amount     Decimal   @db.Decimal(10, 2)
  isSettled  Boolean   @default(false) @map("is_settled")
  settledAt  DateTime? @map("settled_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  event    Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  fromUser User  @relation("SettlementFrom", fields: [fromUserId], references: [id])
  toUser   User  @relation("SettlementTo", fields: [toUserId], references: [id])

  @@unique([eventId, fromUserId, toUserId])
  @@map("settlements")
}

model OtpCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expiresAt DateTime @map("expires_at")
  verified  Boolean  @default(false)
  createdAt DateTime @default(now()) @map("created_at")

  @@index([phone, code])
  @@map("otp_codes")
}
```

---

## API Design

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/request-otp` | Send OTP to phone number |
| POST | `/api/auth/verify-otp` | Verify OTP and return JWT |
| POST | `/api/auth/complete-profile` | Set display name and photo |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PATCH | `/api/users/:id` | Update user profile |

### Events

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | List user's events |
| POST | `/api/events` | Create event |
| GET | `/api/events/:id` | Get event details |
| PATCH | `/api/events/:id` | Update event |
| DELETE | `/api/events/:id` | Delete event |
| GET | `/api/events/invite/:code` | Get event by invite code |
| POST | `/api/events/:id/join` | Join event (public) |

### Event Membership

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:id/members` | List members |
| POST | `/api/events/:id/members` | Add member (by phone) |
| PATCH | `/api/events/:id/members/:userId` | Update role/RSVP |
| DELETE | `/api/events/:id/members/:userId` | Remove member |
| POST | `/api/events/:id/rsvp` | Update own RSVP |

### Text Blasts

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/events/:id/blast` | Send SMS to attendees |

### Outcomes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:id/outcomes` | List outcomes |
| POST | `/api/events/:id/outcomes` | Create outcome |
| PATCH | `/api/outcomes/:id` | Update outcome |
| DELETE | `/api/outcomes/:id` | Delete outcome |
| POST | `/api/outcomes/:id/resolve` | Resolve outcome (host only) |

### Bets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/outcomes/:id/bets` | List bets on outcome |
| POST | `/api/outcomes/:id/bets` | Place/update bet |
| DELETE | `/api/bets/:id` | Remove bet |

### Settlements

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events/:id/settlements` | Get settlement ledger |
| PATCH | `/api/settlements/:id` | Mark as settled |
| GET | `/api/users/:id/ledger` | Get user's overall ledger |

### File Upload

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload` | Upload image (profile/cover) |

---

## Component Breakdown

### Team 1: Infrastructure & Core Setup

**Scope:** Project scaffolding, Docker, database, authentication

### Team 2: Event Management

**Scope:** Event CRUD, membership, invites, text blasts

### Team 3: Betting System

**Scope:** Outcomes, bets, pari-mutuel calculation, resolution

### Team 4: Settlement & Ledger

**Scope:** Settlement tracking, ledger calculation, mark as settled

### Team 5: UI/UX

**Scope:** All frontend pages and components

---

## Engineering Tasks

### Epic 1: Infrastructure & Core Setup

#### Story 1.1: Project Scaffolding
**Points:** 3  
**Team:** Infrastructure

**Tasks:**
- [ ] Initialize Next.js 16.1.1 project with TypeScript
- [ ] Configure Tailwind CSS and shadcn/ui
- [ ] Set up ESLint and Prettier
- [ ] Create folder structure:
  ```
  /src
    /app          # Next.js app router
    /components   # React components
    /lib          # Utilities, services
    /services     # External service integrations
    /types        # TypeScript types
  /prisma         # Prisma schema and migrations
  ```
- [ ] Create `.env.example` with all variables
- [ ] Create README with setup instructions

#### Story 1.2: Docker Setup
**Points:** 2  
**Team:** Infrastructure

**Tasks:**
- [ ] Create `Dockerfile` for Next.js app
- [ ] Create `docker-compose.yml` with app and postgres services
- [ ] Create `docker-compose.local-prod.yml` override for local-prod
- [ ] Document docker commands in README

#### Story 1.3: Database Setup
**Points:** 3  
**Team:** Infrastructure

**Tasks:**
- [ ] Create Prisma schema (as defined above)
- [ ] Create initial migration
- [ ] Create seed script with test data
- [ ] Set up Prisma client singleton

#### Story 1.4: Environment Service
**Points:** 2  
**Team:** Infrastructure

**Tasks:**
- [ ] Create environment config module
- [ ] Implement service factory pattern for SMS/Storage
- [ ] Create mock SMS service (logs to console)
- [ ] Create mock storage service (saves to local disk)

#### Story 1.5: Authentication - OTP Flow
**Points:** 5  
**Team:** Infrastructure

**Tasks:**
- [ ] Implement `POST /api/auth/request-otp`
  - Generate 6-digit OTP
  - Store in OtpCode table with 5-min expiry
  - Send via SMS service (mock or real)
- [ ] Implement `POST /api/auth/verify-otp`
  - Validate OTP
  - Create user if new phone
  - Return JWT token
- [ ] Implement `POST /api/auth/complete-profile`
  - Set display name and photo URL
- [ ] Implement `GET /api/auth/me`
- [ ] Create auth middleware for protected routes
- [ ] Create JWT utility functions

---

### Epic 2: Event Management

#### Story 2.1: Event CRUD
**Points:** 5  
**Team:** Events

**Tasks:**
- [ ] Implement `POST /api/events`
  - Create event with invite code
  - Auto-add creator as HOST
- [ ] Implement `GET /api/events`
  - List events where user is member
- [ ] Implement `GET /api/events/:id`
  - Include members, outcomes summary
- [ ] Implement `PATCH /api/events/:id`
  - Host/co-host only
- [ ] Implement `DELETE /api/events/:id`
  - Host only
- [ ] Implement `GET /api/events/invite/:code`
  - Public endpoint for invite links

#### Story 2.2: Event Membership
**Points:** 5  
**Team:** Events

**Tasks:**
- [ ] Implement `GET /api/events/:id/members`
- [ ] Implement `POST /api/events/:id/members`
  - Add by phone number
  - Send SMS invite
  - Create pending membership
- [ ] Implement `PATCH /api/events/:id/members/:userId`
  - Update role (promote to co-host)
  - Host/co-host only
- [ ] Implement `DELETE /api/events/:id/members/:userId`
  - Host/co-host only
- [ ] Implement `POST /api/events/:id/rsvp`
  - Update own RSVP status
- [ ] Implement `POST /api/events/:id/join`
  - For public events via invite code

#### Story 2.3: Text Blasts
**Points:** 3  
**Team:** Events

**Tasks:**
- [ ] Implement `POST /api/events/:id/blast`
  - Accept message and filter (all/yes/maybe)
  - Send SMS to filtered members
  - Host/co-host only

#### Story 2.4: Event State Management
**Points:** 2  
**Team:** Events

**Tasks:**
- [ ] Implement event status transitions
  - UPCOMING → ACTIVE (when datetime passes)
  - ACTIVE → COMPLETED (manual by host)
  - COMPLETED → RESOLVED (when all outcomes resolved)
- [ ] Create cron job or check-on-access for auto-transitions

---

### Epic 3: Betting System

#### Story 3.1: Outcome CRUD
**Points:** 5  
**Team:** Betting

**Tasks:**
- [ ] Implement `GET /api/events/:id/outcomes`
  - Include options and bet counts
- [ ] Implement `POST /api/events/:id/outcomes`
  - Create outcome with options
  - Only before event starts
  - Any member can create
- [ ] Implement `PATCH /api/outcomes/:id`
  - Only if no bets placed
  - Creator or host/co-host
- [ ] Implement `DELETE /api/outcomes/:id`
  - Creator or host/co-host
  - Refund bets if any exist

#### Story 3.2: Betting
**Points:** 5  
**Team:** Betting

**Tasks:**
- [ ] Implement `GET /api/outcomes/:id/bets`
  - Show all bets (amounts visible to all)
- [ ] Implement `POST /api/outcomes/:id/bets`
  - Place or update bet
  - Only before event starts
  - Validate outcome is OPEN
- [ ] Implement `DELETE /api/bets/:id`
  - Only own bet
  - Only before event starts
- [ ] Lock all bets when event starts (status → LOCKED)

#### Story 3.3: Pari-Mutuel Calculation
**Points:** 5  
**Team:** Betting

**Tasks:**
- [ ] Create pari-mutuel calculation service
  ```typescript
  interface PayoutResult {
    userId: string;
    betAmount: number;
    payout: number;
    netGain: number;
  }
  
  function calculatePayouts(
    outcome: Outcome,
    winningOptionId: string,
    rake: number = 0.01
  ): PayoutResult[]
  ```
- [ ] Handle edge case: no bets on winning option (refund all)
- [ ] Handle edge case: only one bettor (return their bet minus rake)
- [ ] Write unit tests for calculation

#### Story 3.4: Outcome Resolution
**Points:** 3  
**Team:** Betting

**Tasks:**
- [ ] Implement `POST /api/outcomes/:id/resolve`
  - Host/co-host only
  - Set winning option
  - Calculate payouts
  - Generate settlement records
  - Update outcome status to RESOLVED

---

### Epic 4: Settlement & Ledger

#### Story 4.1: Settlement Generation
**Points:** 3  
**Team:** Settlement

**Tasks:**
- [ ] Generate settlements after outcome resolution
- [ ] Consolidate multiple settlements between same users
- [ ] Calculate net amounts (Splitwise-style)

#### Story 4.2: Settlement API
**Points:** 3  
**Team:** Settlement

**Tasks:**
- [ ] Implement `GET /api/events/:id/settlements`
  - Show who owes whom for this event
- [ ] Implement `PATCH /api/settlements/:id`
  - Mark as settled
  - Either party can mark
- [ ] Implement `GET /api/users/:id/ledger`
  - Cross-event ledger for user

---

### Epic 5: Frontend

#### Story 5.1: Layout & Navigation
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create app layout with mobile-first design
- [ ] Create bottom navigation (Events, Profile)
- [ ] Create header component
- [ ] Set up auth context and protected routes

#### Story 5.2: Authentication Pages
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create phone input page (`/login`)
- [ ] Create OTP verification page (`/verify`)
- [ ] Create profile setup page (`/setup`)
- [ ] Implement auth flow with redirects

#### Story 5.3: Events List Page
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create events list page (`/events`)
- [ ] Show upcoming and past events
- [ ] Create event card component
- [ ] Add "Create Event" FAB

#### Story 5.4: Event Creation Page
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create event form page (`/events/new`)
- [ ] Implement date/time picker
- [ ] Implement image upload for cover
- [ ] Implement privacy toggle

#### Story 5.5: Event Detail Page
**Points:** 5  
**Team:** UI

**Tasks:**
- [ ] Create event detail page (`/events/:id`)
- [ ] Show event info, attendees, outcomes
- [ ] Create tabs: Details, Attendees, Bets, Settlements
- [ ] Implement RSVP buttons
- [ ] Show share/invite link

#### Story 5.6: Attendee Management UI
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create attendee list component
- [ ] Create "Add Attendee" modal (phone input)
- [ ] Create role management UI (promote to co-host)
- [ ] Create text blast modal

#### Story 5.7: Outcomes & Betting UI
**Points:** 5  
**Team:** UI

**Tasks:**
- [ ] Create outcomes list component
- [ ] Create "Create Outcome" modal
- [ ] Create betting interface (select option, enter amount)
- [ ] Show pool totals and odds
- [ ] Create resolution UI for hosts

#### Story 5.8: Settlements UI
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create settlements tab on event page
- [ ] Show who owes whom
- [ ] Create "Mark as Settled" button
- [ ] Create user ledger page (`/ledger`)

#### Story 5.9: Profile Page
**Points:** 2  
**Team:** UI

**Tasks:**
- [ ] Create profile page (`/profile`)
- [ ] Show/edit display name and photo
- [ ] Show overall ledger summary
- [ ] Add logout button

#### Story 5.10: Invite Flow
**Points:** 3  
**Team:** UI

**Tasks:**
- [ ] Create invite landing page (`/invite/:code`)
- [ ] Handle logged-in vs logged-out users
- [ ] Auto-join event after auth

---

### Epic 6: External Services Integration

#### Story 6.1: Twilio SMS Integration
**Points:** 3  
**Team:** Infrastructure

**Tasks:**
- [ ] Create Twilio SMS service
- [ ] Implement OTP sending
- [ ] Implement invite SMS
- [ ] Implement blast SMS
- [ ] Handle errors and retries

> **Clarifying Question:** Should we use Twilio Verify for OTP or roll our own with Twilio SMS? Verify is simpler but costs more per verification.
[answer] Use Twilio Verify for OTP

#### Story 6.2: S3 File Storage
**Points:** 2  
**Team:** Infrastructure

**Tasks:**
- [ ] Create S3 storage service
- [ ] Implement presigned URL generation
- [ ] Implement `POST /api/upload` endpoint
- [ ] Handle image resizing (optional)

---

### Epic 7: Deployment

#### Story 7.1: ECS Fargate Setup
**Points:** 5  
**Team:** Infrastructure

**Tasks:**
- [ ] Create ECR repository
- [ ] Create ECS cluster
- [ ] Create task definition
- [ ] Create service with ALB
- [ ] Set up environment variables in Secrets Manager
- [ ] Create deployment script/CI pipeline

> **Clarifying Question:** Should we use Terraform/CDK for infrastructure as code, or manual AWS console setup for this small project?
[answer] We will avoid IAC for now. We will instead generate a plan for deploying using the AWS console

#### Story 7.2: RDS Setup
**Points:** 2  
**Team:** Infrastructure

**Tasks:**
- [ ] Create RDS PostgreSQL instance (t3.micro)
- [ ] Configure security groups
- [ ] Run migrations on deploy

#### Story 7.3: Domain & SSL
**Points:** 2  
**Team:** Infrastructure

**Tasks:**
- [ ] Set up Route 53 (if using custom domain)
- [ ] Configure ACM certificate
- [ ] Configure ALB HTTPS listener

> **Clarifying Question:** Do we have a domain name for this project, or should we use the default ALB DNS?
[answer] We can assume we will have one ready
---

## Clarifying Questions

### Infrastructure
1. **Database:** RDS vs self-managed Postgres on ECS? (Cost vs complexity tradeoff)
2. **SMS OTP:** Twilio Verify vs custom OTP with Twilio SMS?
3. **IaC:** Terraform/CDK or manual setup?
4. **Domain:** Custom domain or ALB default DNS?

### Product
5. **Image storage:** Should profile photos and cover images be required to have specific dimensions/sizes?
6. **OTP expiry:** 5 minutes is assumed — is this acceptable?
7. **Session duration:** How long should JWT tokens be valid?

### External Services
8. **Twilio account:** Is there an existing Twilio account, or should we create one?
9. **AWS account:** Is there an existing AWS account with appropriate permissions?

---

## Appendix

### Pari-Mutuel Calculation Example

**Scenario:**
- Outcome: "Will Brian be late?"
- Options: Yes, No
- Bets:
  - Alice: $10 on Yes
  - Bob: $20 on Yes
  - Charlie: $15 on No

**If "Yes" wins:**
1. Total pool: $45
2. Rake (1%): $0.45
3. Net pool: $44.55
4. Total bet on Yes: $30
5. Payouts:
   - Alice: ($10 / $30) × $44.55 = $14.85
   - Bob: ($20 / $30) × $44.55 = $29.70
   - Charlie: $0

**Settlements:**
- Charlie owes Alice: $4.85 ($14.85 - $10)
- Charlie owes Bob: $9.70 ($29.70 - $20)
- Rake: $0.45 (tracked but not collected in-app)

### File Structure

```
vouch/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── docker-compose.local-prod.yml
├── Dockerfile
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   └── setup/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── invite/[code]/page.tsx
│   │   ├── ledger/page.tsx
│   │   ├── profile/page.tsx
│   │   └── api/
│   │       ├── auth/
│   │       ├── events/
│   │       ├── outcomes/
│   │       ├── bets/
│   │       ├── settlements/
│   │       └── upload/
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── layout/
│   │   ├── events/
│   │   ├── outcomes/
│   │   └── settlements/
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   └── utils.ts
│   ├── services/
│   │   ├── sms/
│   │   │   ├── index.ts
│   │   │   ├── mock.ts
│   │   │   └── twilio.ts
│   │   ├── storage/
│   │   │   ├── index.ts
│   │   │   ├── mock.ts
│   │   │   └── s3.ts
│   │   └── betting/
│   │       └── pari-mutuel.ts
│   └── types/
│       └── index.ts
└── prompts/
    ├── product-requirements.md
    ├── updated-product-requirements.md
    └── engineering-requirements.md
```

---

## Next Steps

1. Review and answer clarifying questions
2. Assign teams to epics
3. Begin with Epic 1 (Infrastructure) as foundation
4. Parallelize Epics 2-4 once infrastructure is ready
5. Epic 5 (Frontend) can start UI components in parallel
6. Epic 6-7 (External Services & Deployment) after core features complete
