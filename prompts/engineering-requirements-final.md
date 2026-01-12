# Engineering Requirements Document: Vouch (Final)

> **Status:** Ready for Implementation  
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
9. [AWS Deployment Guide](#aws-deployment-guide)
10. [Appendix](#appendix)

---

## System Overview

Vouch is a web application for event invitations with pari-mutuel betting. The system consists of:

- **Single containerized Next.js application** (API routes + React frontend)
- **PostgreSQL database** (via Prisma ORM)
- **Twilio Verify** for SMS OTP authentication
- **Twilio SMS** for invites and text blasts
- **AWS S3** for file storage (profile photos, event covers)

### Scale Assumptions

| Metric              | Max Value |
| ------------------- | --------- |
| Total users         | 50        |
| Total events        | 50        |
| Concurrent bets     | 20        |
| Attendees per event | ~15       |

---

## Architecture

### Application Architecture

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
│  │   & Components  │  │  - Auth (Twilio Verify)         │   │
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
     │  PostgreSQL │     │   Twilio    │     │   AWS S3    │
     │             │     │ Verify/SMS  │     │             │
     └─────────────┘     └─────────────┘     └─────────────┘
```

### Production Deployment (AWS ECS Fargate)

```
┌─────────────────────────────────────────────────────────────┐
│                          AWS                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Route 53  │─▶│     ALB     │─▶│    ECS Fargate      │  │
│  │   (DNS)     │  │   (HTTPS)   │  │  ┌───────────────┐  │  │
│  └─────────────┘  └─────────────┘  │  │  Next.js App  │  │  │
│                                     │  │  (1 task)     │  │  │
│  ┌─────────────┐                   │  └───────────────┘  │  │
│  │     ACM     │                   └─────────────────────┘  │
│  │ (SSL Cert)  │                            │               │
│  └─────────────┘     ┌──────────────────────┼───────┐       │
│                      ▼                      ▼       ▼       │
│             ┌─────────────┐         ┌─────────┐ ┌─────────┐ │
│             │     RDS     │         │ Secrets │ │   S3    │ │
│             │  t3.micro   │         │ Manager │ │ Bucket  │ │
│             │  Postgres   │         └─────────┘ └─────────┘ │
│             └─────────────┘                                 │
└─────────────────────────────────────────────────────────────┘
                      │
                      ▼
             ┌─────────────┐
             │   Twilio    │
             │  (External) │
             └─────────────┘
```

---

## Technology Stack

| Layer                   | Technology          | Version       |
| ----------------------- | ------------------- | ------------- |
| **Framework**           | Next.js             | 16.1.1        |
| **Language**            | TypeScript          | 5.x           |
| **Database**            | PostgreSQL          | 16            |
| **ORM**                 | Prisma              | Latest        |
| **Styling**             | Tailwind CSS        | 3.x           |
| **UI Components**       | shadcn/ui           | Latest        |
| **Icons**               | Lucide React        | Latest        |
| **Containerization**    | Docker              | Latest        |
| **Local Orchestration** | Docker Compose      | Latest        |
| **Production Hosting**  | AWS ECS Fargate     | -             |
| **Production Database** | AWS RDS (t3.micro)  | PostgreSQL 16 |
| **SMS/OTP Provider**    | Twilio Verify + SMS | -             |
| **File Storage**        | AWS S3              | -             |
| **Secrets**             | AWS Secrets Manager | -             |
| **SSL**                 | AWS ACM             | -             |
| **DNS**                 | AWS Route 53        | -             |

---

## Environment Configuration

### Environment Profiles

| Profile      | Purpose             | Database        | SMS                | Storage                  |
| ------------ | ------------------- | --------------- | ------------------ | ------------------------ |
| `local`      | Development         | Docker Postgres | Mock (console log) | Local disk (`./uploads`) |
| `local-prod` | Integration testing | Docker Postgres | Real Twilio        | Real S3                  |
| `production` | Deployed            | RDS t3.micro    | Real Twilio        | Real S3                  |

### Environment Variables

```bash
# .env.example

# ===================
# Database
# ===================
DATABASE_URL="postgresql://vouch:vouch@localhost:5432/vouch"

# ===================
# Environment
# ===================
# local | local-prod | production
NODE_ENV="local"

# ===================
# App URLs
# ===================
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# ===================
# Authentication
# ===================
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRY_HOURS=168  # 7 days

# ===================
# Twilio (local-prod & production only)
# ===================
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
TWILIO_VERIFY_SERVICE_SID=""  # For OTP via Twilio Verify
TWILIO_PHONE_NUMBER=""         # For SMS invites/blasts

# ===================
# AWS S3 (local-prod & production only)
# ===================
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="us-east-1"
S3_BUCKET_NAME="vouch-uploads"
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
            - '3000:3000'
        environment:
            - DATABASE_URL=postgresql://vouch:vouch@db:5432/vouch
            - NODE_ENV=local
            - NEXT_PUBLIC_APP_URL=http://localhost:3000
            - JWT_SECRET=local-dev-secret-key-min-32-characters
            - JWT_EXPIRY_HOURS=168
        depends_on:
            db:
                condition: service_healthy
        volumes:
            - ./src:/app/src
            - ./prisma:/app/prisma
            - ./public:/app/public
            - ./uploads:/app/uploads

    db:
        image: postgres:16-alpine
        environment:
            POSTGRES_USER: vouch
            POSTGRES_PASSWORD: vouch
            POSTGRES_DB: vouch
        ports:
            - '5432:5432'
        volumes:
            - postgres_data:/var/lib/postgresql/data
        healthcheck:
            test: ['CMD-SHELL', 'pg_isready -U vouch']
            interval: 5s
            timeout: 5s
            retries: 5

volumes:
    postgres_data:
```

### Docker Compose Override (Local-Prod)

```yaml
# docker-compose.local-prod.yml
version: '3.8'

services:
    app:
        environment:
            - NODE_ENV=local-prod
            - TWILIO_ACCOUNT_SID=${TWILIO_ACCOUNT_SID}
            - TWILIO_AUTH_TOKEN=${TWILIO_AUTH_TOKEN}
            - TWILIO_VERIFY_SERVICE_SID=${TWILIO_VERIFY_SERVICE_SID}
            - TWILIO_PHONE_NUMBER=${TWILIO_PHONE_NUMBER}
            - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
            - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
            - AWS_REGION=${AWS_REGION}
            - S3_BUCKET_NAME=${S3_BUCKET_NAME}
```

### Dockerfile

```dockerfile
# Dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

# Development image
FROM base AS dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate

EXPOSE 3000
ENV PORT 3000

CMD ["npm", "run", "dev"]

# Production build
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npx prisma generate
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

USER nextjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
```

---

## Database Schema

### Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ===================
// User
// ===================
model User {
  id          String   @id @default(cuid())
  phone       String   @unique
  displayName String   @map("display_name")
  photoUrl    String?  @map("photo_url")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  memberships     EventMembership[]
  bets            Bet[]
  outcomes        Outcome[]    @relation("OutcomeCreator")
  settlementsFrom Settlement[] @relation("SettlementFrom")
  settlementsTo   Settlement[] @relation("SettlementTo")

  @@map("users")
}

// ===================
// Event
// ===================
model Event {
  id          String      @id @default(cuid())
  title       String
  datetime    DateTime
  location    String
  description String?
  coverImage  String?     @map("cover_image")
  isPublic    Boolean     @default(false) @map("is_public")
  status      EventStatus @default(UPCOMING)
  inviteCode  String      @unique @default(cuid()) @map("invite_code")
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  memberships EventMembership[]
  outcomes    Outcome[]
  settlements Settlement[]

  @@map("events")
}

enum EventStatus {
  UPCOMING   // Before event datetime
  ACTIVE     // Event datetime has passed, betting locked
  COMPLETED  // Host marked as completed
  RESOLVED   // All outcomes resolved
}

// ===================
// Event Membership
// ===================
model EventMembership {
  id         String     @id @default(cuid())
  userId     String     @map("user_id")
  eventId    String     @map("event_id")
  role       MemberRole @default(ATTENDEE)
  rsvpStatus RsvpStatus @default(PENDING) @map("rsvp_status")
  createdAt  DateTime   @default(now()) @map("created_at")
  updatedAt  DateTime   @updatedAt @map("updated_at")

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

// ===================
// Outcome (Betting Question)
// ===================
model Outcome {
  id              String        @id @default(cuid())
  eventId         String        @map("event_id")
  creatorId       String        @map("creator_id")
  question        String
  status          OutcomeStatus @default(OPEN)
  winningOptionId String?       @map("winning_option_id")
  createdAt       DateTime      @default(now()) @map("created_at")
  updatedAt       DateTime      @updatedAt @map("updated_at")

  event   Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)
  creator User     @relation("OutcomeCreator", fields: [creatorId], references: [id])
  options Option[]

  @@map("outcomes")
}

enum OutcomeStatus {
  OPEN     // Accepting bets
  LOCKED   // Event started, no more bets
  RESOLVED // Winner selected, payouts calculated
  REFUNDED // Outcome deleted or no winner, bets returned
}

// ===================
// Option (Betting Choice)
// ===================
model Option {
  id        String   @id @default(cuid())
  outcomeId String   @map("outcome_id")
  label     String
  createdAt DateTime @default(now()) @map("created_at")

  outcome Outcome @relation(fields: [outcomeId], references: [id], onDelete: Cascade)
  bets    Bet[]

  @@map("options")
}

// ===================
// Bet
// ===================
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

// ===================
// Settlement
// ===================
model Settlement {
  id         String    @id @default(cuid())
  eventId    String    @map("event_id")
  fromUserId String    @map("from_user_id")
  toUserId   String    @map("to_user_id")
  amount     Decimal   @db.Decimal(10, 2)
  isSettled  Boolean   @default(false) @map("is_settled")
  settledAt  DateTime? @map("settled_at")
  createdAt  DateTime  @default(now()) @map("created_at")
  updatedAt  DateTime  @updatedAt @map("updated_at")

  event    Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  fromUser User  @relation("SettlementFrom", fields: [fromUserId], references: [id])
  toUser   User  @relation("SettlementTo", fields: [toUserId], references: [id])

  @@unique([eventId, fromUserId, toUserId])
  @@map("settlements")
}
```

---

## API Design

### Authentication

| Method | Endpoint                     | Description                | Auth     |
| ------ | ---------------------------- | -------------------------- | -------- |
| POST   | `/api/auth/request-otp`      | Send OTP via Twilio Verify | Public   |
| POST   | `/api/auth/verify-otp`       | Verify OTP, return JWT     | Public   |
| POST   | `/api/auth/complete-profile` | Set display name and photo | Required |
| GET    | `/api/auth/me`               | Get current user           | Required |
| POST   | `/api/auth/logout`           | Invalidate session         | Required |

### Users

| Method | Endpoint         | Description        | Auth                 |
| ------ | ---------------- | ------------------ | -------------------- |
| GET    | `/api/users/:id` | Get user profile   | Required             |
| PATCH  | `/api/users/:id` | Update own profile | Required (self only) |

### Events

| Method | Endpoint                   | Description              | Auth                   |
| ------ | -------------------------- | ------------------------ | ---------------------- |
| GET    | `/api/events`              | List user's events       | Required               |
| POST   | `/api/events`              | Create event             | Required               |
| GET    | `/api/events/:id`          | Get event details        | Required (member)      |
| PATCH  | `/api/events/:id`          | Update event             | Required (host/cohost) |
| DELETE | `/api/events/:id`          | Delete event             | Required (host only)   |
| GET    | `/api/events/invite/:code` | Get event by invite code | Public                 |
| POST   | `/api/events/:id/join`     | Join public event        | Required               |

### Event Membership

| Method | Endpoint                          | Description     | Auth                   |
| ------ | --------------------------------- | --------------- | ---------------------- |
| GET    | `/api/events/:id/members`         | List members    | Required (member)      |
| POST   | `/api/events/:id/members`         | Invite by phone | Required (host/cohost) |
| PATCH  | `/api/events/:id/members/:userId` | Update role     | Required (host/cohost) |
| DELETE | `/api/events/:id/members/:userId` | Remove member   | Required (host/cohost) |
| POST   | `/api/events/:id/rsvp`            | Update own RSVP | Required (member)      |

### Text Blasts

| Method | Endpoint                | Description           | Auth                   |
| ------ | ----------------------- | --------------------- | ---------------------- |
| POST   | `/api/events/:id/blast` | Send SMS to attendees | Required (host/cohost) |

### Outcomes

| Method | Endpoint                    | Description     | Auth                             |
| ------ | --------------------------- | --------------- | -------------------------------- |
| GET    | `/api/events/:id/outcomes`  | List outcomes   | Required (member)                |
| POST   | `/api/events/:id/outcomes`  | Create outcome  | Required (member, before event)  |
| PATCH  | `/api/outcomes/:id`         | Update outcome  | Required (creator/host, no bets) |
| DELETE | `/api/outcomes/:id`         | Delete outcome  | Required (creator/host)          |
| POST   | `/api/outcomes/:id/resolve` | Resolve outcome | Required (host/cohost)           |

### Bets

| Method | Endpoint                 | Description          | Auth                            |
| ------ | ------------------------ | -------------------- | ------------------------------- |
| GET    | `/api/outcomes/:id/bets` | List bets on outcome | Required (member)               |
| POST   | `/api/outcomes/:id/bets` | Place/update bet     | Required (member, before event) |
| DELETE | `/api/bets/:id`          | Remove own bet       | Required (self, before event)   |

### Settlements

| Method | Endpoint                      | Description                   | Auth                    |
| ------ | ----------------------------- | ----------------------------- | ----------------------- |
| GET    | `/api/events/:id/settlements` | Get event settlements         | Required (member)       |
| PATCH  | `/api/settlements/:id`        | Mark as settled               | Required (from/to user) |
| GET    | `/api/users/:id/ledger`       | Get user's cross-event ledger | Required (self)         |

### File Upload

| Method | Endpoint      | Description              | Auth     |
| ------ | ------------- | ------------------------ | -------- |
| POST   | `/api/upload` | Upload image, return URL | Required |

---

## Component Breakdown

### Team 1: Infrastructure & Core Setup

**Owner:** Backend Engineer  
**Scope:** Project scaffolding, Docker, database, authentication, external services

### Team 2: Event Management

**Owner:** Backend Engineer  
**Scope:** Event CRUD, membership, invites, text blasts, state management

### Team 3: Betting System

**Owner:** Backend Engineer  
**Scope:** Outcomes, bets, pari-mutuel calculation, resolution

### Team 4: Settlement & Ledger

**Owner:** Backend Engineer  
**Scope:** Settlement tracking, ledger calculation, mark as settled

### Team 5: Frontend

**Owner:** Frontend Engineer  
**Scope:** All pages and components

---

## Engineering Tasks

### Epic 1: Infrastructure & Core Setup

#### Story 1.1: Project Scaffolding

**Points:** 3 | **Team:** Infrastructure

**Acceptance Criteria:**

- Next.js 16.1.1 project initialized with TypeScript
- Tailwind CSS and shadcn/ui configured
- ESLint and Prettier configured
- Folder structure created
- README with setup instructions

**Tasks:**

- [ ] `npx create-next-app@16.1.1 vouch --typescript --tailwind --eslint --app`
- [ ] Install and configure shadcn/ui
- [ ] Configure Prettier with Tailwind plugin
- [ ] Create folder structure:
    ```
    src/
      app/           # Next.js app router pages
      components/    # React components
        ui/          # shadcn components
        layout/      # Layout components
        events/      # Event-related components
        outcomes/    # Betting components
        settlements/ # Settlement components
      lib/           # Utilities
      services/      # External service integrations
      types/         # TypeScript types
    prisma/          # Database schema
    ```
- [ ] Create `.env.example`
- [ ] Create README.md with setup instructions

---

#### Story 1.2: Docker Setup

**Points:** 2 | **Team:** Infrastructure

**Acceptance Criteria:**

- `docker-compose up` starts app and database
- Hot reload works in development
- `docker-compose -f docker-compose.yml -f docker-compose.local-prod.yml up` works

**Tasks:**

- [ ] Create `Dockerfile` (multi-stage: dev + production)
- [ ] Create `docker-compose.yml`
- [ ] Create `docker-compose.local-prod.yml`
- [ ] Add docker commands to README
- [ ] Test hot reload with volume mounts

---

#### Story 1.3: Database Setup

**Points:** 3 | **Team:** Infrastructure

**Acceptance Criteria:**

- Prisma schema matches spec
- Migrations run successfully
- Seed script creates test data

**Tasks:**

- [ ] Create `prisma/schema.prisma`
- [ ] Run `npx prisma migrate dev --name init`
- [ ] Create `prisma/seed.ts` with test data:
    - 3 test users
    - 2 test events (1 public, 1 private)
    - Sample outcomes and bets
- [ ] Create `src/lib/prisma.ts` (singleton client)
- [ ] Add seed script to `package.json`

---

#### Story 1.4: Environment & Service Factory

**Points:** 2 | **Team:** Infrastructure

**Acceptance Criteria:**

- Environment config loads correctly per profile
- Mock services work in `local` profile
- Real services work in `local-prod` profile

**Tasks:**

- [ ] Create `src/lib/env.ts` (typed env config)
- [ ] Create `src/services/sms/index.ts` (factory)
- [ ] Create `src/services/sms/mock.ts` (console.log)
- [ ] Create `src/services/storage/index.ts` (factory)
- [ ] Create `src/services/storage/mock.ts` (local disk)

---

#### Story 1.5: Authentication - Twilio Verify OTP

**Points:** 5 | **Team:** Infrastructure

**Acceptance Criteria:**

- Users can request OTP via phone number
- OTP verification returns JWT
- Protected routes require valid JWT
- Profile completion flow works

**Tasks:**

- [ ] Create `src/services/sms/twilio.ts`
    - `sendOtp(phone)` - uses Twilio Verify
    - `verifyOtp(phone, code)` - verifies with Twilio
    - `sendSms(phone, message)` - for invites/blasts
- [ ] Create `src/lib/auth.ts`
    - `signJwt(userId)` - create token
    - `verifyJwt(token)` - validate token
    - `getSession(request)` - extract user from request
- [ ] Implement `POST /api/auth/request-otp`
- [ ] Implement `POST /api/auth/verify-otp`
- [ ] Implement `POST /api/auth/complete-profile`
- [ ] Implement `GET /api/auth/me`
- [ ] Create auth middleware for protected routes

---

### Epic 2: Event Management

#### Story 2.1: Event CRUD

**Points:** 5 | **Team:** Events

**Acceptance Criteria:**

- Hosts can create events with all fields
- Events have unique invite codes
- Only members can view event details
- Only host can delete event

**Tasks:**

- [ ] Implement `POST /api/events`
    - Generate unique invite code
    - Auto-add creator as HOST
- [ ] Implement `GET /api/events`
    - Return events where user is member
    - Include member count, outcome count
- [ ] Implement `GET /api/events/:id`
    - Verify membership
    - Include members, outcomes summary
- [ ] Implement `PATCH /api/events/:id`
    - Verify host/cohost role
- [ ] Implement `DELETE /api/events/:id`
    - Verify host role
- [ ] Implement `GET /api/events/invite/:code`
    - Public endpoint for invite preview

---

#### Story 2.2: Event Membership

**Points:** 5 | **Team:** Events

**Acceptance Criteria:**

- Hosts can invite by phone number
- Invitees receive SMS with link
- Users can RSVP
- Hosts can promote to co-host

**Tasks:**

- [ ] Implement `GET /api/events/:id/members`
- [ ] Implement `POST /api/events/:id/members`
    - Create membership (or find existing user)
    - Send SMS invite via Twilio
- [ ] Implement `PATCH /api/events/:id/members/:userId`
    - Update role (ATTENDEE → COHOST)
- [ ] Implement `DELETE /api/events/:id/members/:userId`
- [ ] Implement `POST /api/events/:id/rsvp`
- [ ] Implement `POST /api/events/:id/join`
    - For public events via invite code

---

#### Story 2.3: Text Blasts

**Points:** 3 | **Team:** Events

**Acceptance Criteria:**

- Hosts can send SMS to all or filtered attendees
- Filter options: all, yes, maybe

**Tasks:**

- [ ] Implement `POST /api/events/:id/blast`
    - Accept `{ message, filter: 'all' | 'yes' | 'maybe' }`
    - Send SMS to filtered members
    - Verify host/cohost role

---

#### Story 2.4: Event State Management

**Points:** 2 | **Team:** Events

**Acceptance Criteria:**

- Events auto-transition UPCOMING → ACTIVE at datetime
- Hosts can mark ACTIVE → COMPLETED
- Events become RESOLVED when all outcomes resolved

**Tasks:**

- [ ] Create `src/lib/event-status.ts`
    - `checkAndUpdateStatus(event)` - auto-transition logic
- [ ] Add status check to `GET /api/events/:id`
- [ ] Implement `POST /api/events/:id/complete`
    - Host/cohost only
    - Transition to COMPLETED

---

### Epic 3: Betting System

#### Story 3.1: Outcome CRUD

**Points:** 5 | **Team:** Betting

**Acceptance Criteria:**

- Members can create outcomes before event starts
- Outcomes have 2+ options
- Outcomes can only be edited if no bets exist
- Outcomes can be deleted (refunds bets)

**Tasks:**

- [ ] Implement `GET /api/events/:id/outcomes`
    - Include options with bet totals
    - Include user's bet if exists
- [ ] Implement `POST /api/events/:id/outcomes`
    - Verify event is UPCOMING
    - Create outcome with options
- [ ] Implement `PATCH /api/outcomes/:id`
    - Verify no bets exist
    - Verify creator or host/cohost
- [ ] Implement `DELETE /api/outcomes/:id`
    - Mark as REFUNDED if bets exist
    - Verify creator or host/cohost

---

#### Story 3.2: Betting

**Points:** 5 | **Team:** Betting

**Acceptance Criteria:**

- Members can place bets before event starts
- Users can change bet amount until event starts
- Bets are locked when event becomes ACTIVE

**Tasks:**

- [ ] Implement `GET /api/outcomes/:id/bets`
    - Return all bets with user info
- [ ] Implement `POST /api/outcomes/:id/bets`
    - Upsert bet (create or update)
    - Verify event is UPCOMING
    - Verify outcome is OPEN
- [ ] Implement `DELETE /api/bets/:id`
    - Verify own bet
    - Verify event is UPCOMING
- [ ] Add outcome locking to event status transition
    - When UPCOMING → ACTIVE, set all outcomes to LOCKED

---

#### Story 3.3: Pari-Mutuel Calculation

**Points:** 5 | **Team:** Betting

**Acceptance Criteria:**

- Correct payout calculation with 1% rake
- Handles edge case: no bets on winner (refund all)
- Handles edge case: single bettor
- Unit tests pass

**Tasks:**

- [ ] Create `src/services/betting/pari-mutuel.ts`

    ```typescript
    interface BetWithUser {
        userId: string;
        optionId: string;
        amount: number;
    }

    interface PayoutResult {
        userId: string;
        betAmount: number;
        payout: number;
        netGain: number; // payout - betAmount
    }

    function calculatePayouts(bets: BetWithUser[], winningOptionId: string, rakePercent: number = 0.01): PayoutResult[];
    ```

- [ ] Implement calculation logic
- [ ] Handle edge case: no bets on winning option
- [ ] Handle edge case: only one bettor
- [ ] Create `src/services/betting/pari-mutuel.test.ts`

---

#### Story 3.4: Outcome Resolution

**Points:** 3 | **Team:** Betting

**Acceptance Criteria:**

- Host can select winning option
- Payouts are calculated
- Settlements are generated
- Outcome status becomes RESOLVED

**Tasks:**

- [ ] Implement `POST /api/outcomes/:id/resolve`
    - Verify host/cohost role
    - Verify outcome is LOCKED
    - Set winning option
    - Calculate payouts
    - Generate settlement records
    - Update status to RESOLVED
- [ ] Check if all outcomes resolved → update event to RESOLVED

---

### Epic 4: Settlement & Ledger

#### Story 4.1: Settlement Generation

**Points:** 3 | **Team:** Settlement

**Acceptance Criteria:**

- Settlements are created after outcome resolution
- Multiple settlements between same users are consolidated
- Net amounts are calculated (Splitwise-style)

**Tasks:**

- [ ] Create `src/services/betting/settlement.ts`
    - `generateSettlements(eventId, payoutResults)`
    - Consolidate: if A owes B $10 and B owes A $3, net is A owes B $7
- [ ] Integrate with outcome resolution

---

#### Story 4.2: Settlement API

**Points:** 3 | **Team:** Settlement

**Acceptance Criteria:**

- Users can view event settlements
- Either party can mark as settled
- Users can view cross-event ledger

**Tasks:**

- [ ] Implement `GET /api/events/:id/settlements`
    - Return settlements with user info
- [ ] Implement `PATCH /api/settlements/:id`
    - Verify user is from or to
    - Set isSettled = true, settledAt = now
- [ ] Implement `GET /api/users/:id/ledger`
    - Aggregate unsettled amounts across events
    - Return net amounts per counterparty

---

### Epic 5: Frontend

#### Story 5.1: Layout & Navigation

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create `src/app/layout.tsx` with providers
- [ ] Create `src/components/layout/Header.tsx`
- [ ] Create `src/components/layout/BottomNav.tsx` (Events, Profile)
- [ ] Create `src/components/layout/AuthProvider.tsx`
- [ ] Create protected route wrapper

---

#### Story 5.2: Authentication Pages

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create `/login` page (phone input)
- [ ] Create `/verify` page (OTP input)
- [ ] Create `/setup` page (display name, photo)
- [ ] Implement auth flow with redirects
- [ ] Store JWT in httpOnly cookie

---

#### Story 5.3: Events List Page

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create `/events` page
- [ ] Create `EventCard` component
- [ ] Show upcoming vs past events
- [ ] Add floating "Create Event" button

---

#### Story 5.4: Event Creation Page

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create `/events/new` page
- [ ] Create event form with validation
- [ ] Implement date/time picker
- [ ] Implement cover image upload
- [ ] Implement privacy toggle (public/private)

---

#### Story 5.5: Event Detail Page

**Points:** 5 | **Team:** UI

**Tasks:**

- [ ] Create `/events/[id]` page
- [ ] Create tabs: Details, Attendees, Bets, Settlements
- [ ] Show event info and cover image
- [ ] Implement RSVP buttons (Yes/No/Maybe)
- [ ] Show share button with invite link
- [ ] Show host controls (edit, complete, delete)

---

#### Story 5.6: Attendee Management UI

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create `AttendeeList` component
- [ ] Create `AddAttendeeModal` (phone input)
- [ ] Create role badge (Host, Co-host, Attendee)
- [ ] Create promote/remove actions for hosts
- [ ] Create `TextBlastModal`

---

#### Story 5.7: Outcomes & Betting UI

**Points:** 5 | **Team:** UI

**Tasks:**

- [ ] Create `OutcomeList` component
- [ ] Create `OutcomeCard` with options and pool totals
- [ ] Create `CreateOutcomeModal`
- [ ] Create betting interface (select option, enter amount)
- [ ] Show implied odds based on pool
- [ ] Create `ResolveOutcomeModal` for hosts

---

#### Story 5.8: Settlements UI

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create Settlements tab content
- [ ] Create `SettlementCard` (who owes whom)
- [ ] Create "Mark as Settled" button
- [ ] Create `/ledger` page (cross-event view)

---

#### Story 5.9: Profile Page

**Points:** 2 | **Team:** UI

**Tasks:**

- [ ] Create `/profile` page
- [ ] Show/edit display name
- [ ] Show/edit profile photo
- [ ] Show ledger summary (total owed/owing)
- [ ] Add logout button

---

#### Story 5.10: Invite Flow

**Points:** 3 | **Team:** UI

**Tasks:**

- [ ] Create `/invite/[code]` page
- [ ] Show event preview (public info)
- [ ] Handle logged-in user → auto-join
- [ ] Handle logged-out user → login → join

---

### Epic 6: External Services Integration

#### Story 6.1: Twilio Integration

**Points:** 3 | **Team:** Infrastructure

**Tasks:**

- [ ] Create Twilio Verify service for OTP
- [ ] Create Twilio SMS service for invites/blasts
- [ ] Handle rate limiting
- [ ] Handle errors gracefully

---

#### Story 6.2: S3 File Storage

**Points:** 2 | **Team:** Infrastructure

**Tasks:**

- [ ] Create `src/services/storage/s3.ts`
- [ ] Implement presigned URL upload
- [ ] Implement `POST /api/upload`
- [ ] Configure CORS on S3 bucket

---

### Epic 7: Deployment

#### Story 7.1: AWS Console Deployment

**Points:** 5 | **Team:** Infrastructure

**Tasks:**

- [ ] Follow AWS Deployment Guide (see below)
- [ ] Create ECR repository
- [ ] Push Docker image
- [ ] Create ECS cluster and service
- [ ] Configure ALB with HTTPS
- [ ] Set up Secrets Manager

---

#### Story 7.2: RDS Setup

**Points:** 2 | **Team:** Infrastructure

**Tasks:**

- [ ] Create RDS PostgreSQL t3.micro instance
- [ ] Configure security group (ECS → RDS)
- [ ] Run Prisma migrations
- [ ] Verify connectivity

---

#### Story 7.3: Domain & SSL

**Points:** 2 | **Team:** Infrastructure

**Tasks:**

- [ ] Create ACM certificate for domain
- [ ] Configure Route 53 DNS
- [ ] Configure ALB HTTPS listener
- [ ] Redirect HTTP → HTTPS

---

## AWS Deployment Guide

### Prerequisites

- AWS Account with appropriate permissions
- Domain name ready
- Twilio account with Verify service

### Step 1: Create ECR Repository

1. Go to **ECR** → **Create repository**
2. Name: `vouch`
3. Keep defaults, create

### Step 2: Build and Push Docker Image

```bash
# Authenticate Docker to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build production image
docker build -t vouch --target runner .

# Tag and push
docker tag vouch:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/vouch:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/vouch:latest
```

### Step 3: Create RDS PostgreSQL

1. Go to **RDS** → **Create database**
2. Engine: PostgreSQL 16
3. Template: Free tier
4. Instance: db.t3.micro
5. Storage: 20 GB gp2
6. DB identifier: `vouch-db`
7. Master username: `vouch`
8. Auto-generate password (save it!)
9. VPC: Default
10. Public access: No
11. Create database

### Step 4: Create S3 Bucket

1. Go to **S3** → **Create bucket**
2. Name: `vouch-uploads-<unique-suffix>`
3. Region: us-east-1
4. Uncheck "Block all public access" (for public image URLs)
5. Add bucket policy for public read:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::vouch-uploads-*/*"
        }
    ]
}
```

6. Configure CORS:

```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "PUT", "POST"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": []
    }
]
```

### Step 5: Create Secrets in Secrets Manager

1. Go to **Secrets Manager** → **Store a new secret**
2. Secret type: Other
3. Key/value pairs:
    - `DATABASE_URL`: `postgresql://vouch:<password>@<rds-endpoint>:5432/vouch`
    - `JWT_SECRET`: `<generate-32-char-secret>`
    - `TWILIO_ACCOUNT_SID`: `<your-sid>`
    - `TWILIO_AUTH_TOKEN`: `<your-token>`
    - `TWILIO_VERIFY_SERVICE_SID`: `<your-verify-sid>`
    - `TWILIO_PHONE_NUMBER`: `<your-number>`
    - `AWS_ACCESS_KEY_ID`: `<key>`
    - `AWS_SECRET_ACCESS_KEY`: `<secret>`
    - `S3_BUCKET_NAME`: `vouch-uploads-<suffix>`
4. Secret name: `vouch/production`

### Step 6: Create ECS Cluster

1. Go to **ECS** → **Create cluster**
2. Name: `vouch-cluster`
3. Infrastructure: AWS Fargate
4. Create

### Step 7: Create Task Definition

1. Go to **ECS** → **Task definitions** → **Create**
2. Family: `vouch-task`
3. Launch type: Fargate
4. CPU: 0.25 vCPU
5. Memory: 0.5 GB
6. Task role: Create new (needs Secrets Manager access)
7. Container:
    - Name: `vouch`
    - Image: `<account-id>.dkr.ecr.us-east-1.amazonaws.com/vouch:latest`
    - Port: 3000
    - Environment variables from Secrets Manager
8. Create

### Step 8: Create Application Load Balancer

1. Go to **EC2** → **Load Balancers** → **Create**
2. Type: Application Load Balancer
3. Name: `vouch-alb`
4. Scheme: Internet-facing
5. Listeners: HTTP (80), HTTPS (443)
6. Create target group:
    - Type: IP
    - Name: `vouch-tg`
    - Port: 3000
    - Health check: `/api/health`
7. Create ALB

### Step 9: Create ECS Service

1. Go to **ECS** → **vouch-cluster** → **Create service**
2. Launch type: Fargate
3. Task definition: `vouch-task`
4. Service name: `vouch-service`
5. Desired tasks: 1
6. Networking:
    - VPC: Default
    - Subnets: Select all
    - Security group: Create new (allow 3000 from ALB)
7. Load balancing:
    - Select ALB: `vouch-alb`
    - Target group: `vouch-tg`
8. Create

### Step 10: Configure Domain & SSL

1. Go to **ACM** → **Request certificate**
2. Domain: `vouch.yourdomain.com`
3. Validate via DNS
4. Go to **Route 53** → Create A record
    - Name: `vouch`
    - Alias: Yes
    - Target: ALB
5. Go to **EC2** → **Load Balancers** → **vouch-alb**
6. Add HTTPS listener with ACM certificate
7. Redirect HTTP to HTTPS

### Step 11: Run Migrations

```bash
# Connect to RDS via bastion or ECS exec
npx prisma migrate deploy
```

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

1. Total pool: $45.00
2. Rake (1%): $0.45
3. Net pool: $44.55
4. Total bet on Yes: $30.00
5. Payouts:
    - Alice: ($10 / $30) × $44.55 = **$14.85**
    - Bob: ($20 / $30) × $44.55 = **$29.70**
    - Charlie: **$0.00**

**Net gains:**

- Alice: $14.85 - $10.00 = +$4.85
- Bob: $29.70 - $20.00 = +$9.70
- Charlie: $0.00 - $15.00 = -$15.00

**Settlements:**

- Charlie owes Alice: $4.85
- Charlie owes Bob: $9.70

_(Rake of $0.45 is tracked but not collected in-app)_

---

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
├── README.md
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── globals.css
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── verify/page.tsx
│   │   │   └── setup/page.tsx
│   │   ├── events/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── invite/
│   │   │   └── [code]/page.tsx
│   │   ├── ledger/page.tsx
│   │   ├── profile/page.tsx
│   │   └── api/
│   │       ├── health/route.ts
│   │       ├── auth/
│   │       │   ├── request-otp/route.ts
│   │       │   ├── verify-otp/route.ts
│   │       │   ├── complete-profile/route.ts
│   │       │   └── me/route.ts
│   │       ├── events/
│   │       │   ├── route.ts
│   │       │   ├── [id]/route.ts
│   │       │   ├── [id]/members/route.ts
│   │       │   ├── [id]/rsvp/route.ts
│   │       │   ├── [id]/blast/route.ts
│   │       │   ├── [id]/outcomes/route.ts
│   │       │   ├── [id]/settlements/route.ts
│   │       │   └── invite/[code]/route.ts
│   │       ├── outcomes/
│   │       │   ├── [id]/route.ts
│   │       │   ├── [id]/bets/route.ts
│   │       │   └── [id]/resolve/route.ts
│   │       ├── bets/
│   │       │   └── [id]/route.ts
│   │       ├── settlements/
│   │       │   └── [id]/route.ts
│   │       ├── users/
│   │       │   ├── [id]/route.ts
│   │       │   └── [id]/ledger/route.ts
│   │       └── upload/route.ts
│   ├── components/
│   │   ├── ui/              # shadcn components
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   ├── BottomNav.tsx
│   │   │   └── AuthProvider.tsx
│   │   ├── events/
│   │   │   ├── EventCard.tsx
│   │   │   ├── EventForm.tsx
│   │   │   └── AttendeeList.tsx
│   │   ├── outcomes/
│   │   │   ├── OutcomeCard.tsx
│   │   │   ├── OutcomeForm.tsx
│   │   │   └── BettingInterface.tsx
│   │   └── settlements/
│   │       ├── SettlementCard.tsx
│   │       └── LedgerView.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── env.ts
│   │   ├── utils.ts
│   │   └── event-status.ts
│   ├── services/
│   │   ├── sms/
│   │   │   ├── index.ts
│   │   │   ├── mock.ts
│   │   │   └── twilio.ts
│   │   ├── storage/
│   │   │   ├── index.ts
│   │   │   ├── mock.ts
│   │   │   └── s3.ts
│   │   ├── betting/
│   │   │   ├── pari-mutuel.ts
│   │   │   └── pari-mutuel.test.ts
│   │   └── settlement/
│   │       └── settlement.ts
│   └── types/
│       └── index.ts
└── prompts/
    ├── product-requirements.md
    ├── updated-product-requirements.md
    ├── engineering-requirements.md
    └── engineering-requirements-final.md
```

---

## Implementation Order

### Phase 1: Foundation (Week 1)

1. **Story 1.1** - Project Scaffolding
2. **Story 1.2** - Docker Setup
3. **Story 1.3** - Database Setup
4. **Story 1.4** - Environment & Service Factory

### Phase 2: Auth & Events (Week 2)

5. **Story 1.5** - Authentication
6. **Story 2.1** - Event CRUD
7. **Story 2.2** - Event Membership
8. **Story 5.1** - Layout & Navigation
9. **Story 5.2** - Authentication Pages

### Phase 3: Betting (Week 3)

10. **Story 3.1** - Outcome CRUD
11. **Story 3.2** - Betting
12. **Story 3.3** - Pari-Mutuel Calculation
13. **Story 3.4** - Outcome Resolution
14. **Story 5.7** - Outcomes & Betting UI

### Phase 4: Settlement & Polish (Week 4)

15. **Story 4.1** - Settlement Generation
16. **Story 4.2** - Settlement API
17. **Story 2.3** - Text Blasts
18. **Story 2.4** - Event State Management
19. **Story 5.3-5.6, 5.8-5.10** - Remaining UI

### Phase 5: External Services & Deploy (Week 5)

20. **Story 6.1** - Twilio Integration
21. **Story 6.2** - S3 File Storage
22. **Story 7.1-7.3** - AWS Deployment

---

## Summary

| Metric                 | Value         |
| ---------------------- | ------------- |
| **Total Epics**        | 7             |
| **Total Stories**      | 24            |
| **Total Story Points** | ~80           |
| **Estimated Duration** | 5 weeks       |
| **Team Size**          | 2-3 engineers |

**Key Decisions:**

- **Database:** AWS RDS t3.micro (~$15/month)
- **OTP:** Twilio Verify (managed service)
- **IaC:** Manual AWS Console setup (no Terraform/CDK)
- **Domain:** Custom domain assumed ready

**External Dependencies:**

- Twilio account with Verify service enabled
- AWS account with appropriate permissions
- Domain name with DNS access
