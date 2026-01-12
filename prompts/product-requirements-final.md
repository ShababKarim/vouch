# Product Requirements Document: Vouch (Final)

> **Status:** Ready for System Architecture Handoff  
> **Version:** 1.0  
> **Platform:** Web (mobile browser optimized)

---

## Overview

Vouch is an event invitation and RSVP application with integrated pari-mutuel (pool) betting on event outcomes. Users can create events, invite attendees via SMS or shareable links, and place friendly wagers (in USD) on predictions related to the event. Settlement occurs outside the app.

---

## Core Features

### 1. User Registration & Authentication

| Requirement            | Details                     |
| ---------------------- | --------------------------- |
| **Primary identifier** | Phone number                |
| **Verification**       | SMS OTP required            |
| **Profile fields**     | Display name, profile photo |
| **Email**              | Not required                |

**User Flow:**

1. User enters phone number
2. System sends SMS OTP
3. User verifies OTP
4. User enters display name and optional profile photo
5. Account created

---

### 2. Event Management

#### 2.1 Event Creation

Hosts can create events with the following fields:

| Field           | Required | Notes                                            |
| --------------- | -------- | ------------------------------------------------ |
| Event title     | Yes      |                                                  |
| Date and time   | Yes      |                                                  |
| Location        | Yes      | Physical address or virtual link                 |
| Description     | No       |                                                  |
| Cover image     | No       |                                                  |
| Privacy setting | Yes      | Private (invite-only) or Public (shareable link) |

**Constraints:**

- No recurring events
- No capacity limits (assume max ~15 attendees per event)

#### 2.2 Attendee Management

- Hosts can add attendees by phone number (triggers SMS invite)
- Hosts can share a public link for attendees to self-join (for public events)
- Attendees can RSVP: **Yes / No / Maybe**
- Attendees cannot invite others (no plus-ones)
- No waitlist functionality

#### 2.3 Co-Hosts

- Events can have multiple co-hosts
- Co-hosts have the same permissions as the original host
- Hosts cannot transfer ownership

#### 2.4 Text Blasts

- Hosts/co-hosts can send SMS messages to all attendees or filtered groups (e.g., confirmed only)
- No limits on number of blasts
- No opt-out mechanism
- No scheduled/delayed sending

---

### 3. Betting System (Pari-Mutuel / Pool Betting)

#### 3.1 Outcome Creation

| Attribute          | Details                                              |
| ------------------ | ---------------------------------------------------- |
| **Who can create** | Host, co-host, or any attendee                       |
| **Deadline**       | All outcomes must be created before event start time |
| **Limit**          | No limit on number of outcomes per event             |

**Outcome Structure:**

- Question/prediction statement (e.g., "Brian will show up late")
- Multiple options (e.g., Yes/No, or custom options like "Before 7pm / 7-8pm / After 8pm")

**Editing Rules:**

- Outcomes can be edited **only before** any user places a bet
- Once a bet is placed, the outcome can only be **deleted** (not edited)

#### 3.2 Placing Bets

| Attribute         | Details                                              |
| ----------------- | ---------------------------------------------------- |
| **Currency**      | USD (displayed, settled externally)                  |
| **Min/Max bet**   | None                                                 |
| **Deadline**      | Event start time                                     |
| **Modifications** | Users can change their bet/amount until event starts |

#### 3.3 Pari-Mutuel Calculation

**Formula:**

1. All bets on an outcome are pooled
2. 1% rake is deducted from the pool (application fee)
3. Remaining pool is distributed proportionally to winners based on their stake

**Edge Cases:**

- **Ties/ambiguous outcomes:** Host selects the winning option
- **No bets on winning option:** All bets are refunded to users

#### 3.4 Outcome Resolution

| Attribute        | Details                               |
| ---------------- | ------------------------------------- |
| **Who resolves** | Host or co-host only                  |
| **Deadline**     | No time limit after event             |
| **Disputes**     | Out of scope (host decision is final) |

**Results Display:**

- Winning option
- Payout amounts per user

#### 3.5 Settlement

- **No in-app payments** — Users settle externally (Venmo, cash, etc.)
- **"Mark as Settled" feature** — Users can mark debts as settled for tracking
- **Consolidated ledger** — Show net amounts owed between users (Splitwise-style)

---

## User Roles & Permissions

| Role                   | Permissions                                                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Host / Co-Host**     | Create/edit/delete event, add attendees, send text blasts, create outcomes, resolve outcomes, mark settlements |
| **Attendee**           | RSVP, create outcomes, place bets, view results, mark settlements                                              |
| **Non-user (invited)** | Receive SMS invite, prompted to sign up to RSVP/bet                                                            |

---

## User Flows

### Flow 1: Host Creates Event & Invites Attendees

```
1. Host signs up / logs in with phone number (SMS OTP)
2. Host creates event with details and privacy setting
3. Host invites attendees via:
   a. Adding phone numbers (triggers SMS invites), OR
   b. Sharing public event link
4. Attendees click link → sign up (if new) → RSVP
```

### Flow 2: Betting on an Outcome

```
1. Host or attendee creates an outcome with options (before event starts)
2. Attendees view outcomes and place bets (before event starts)
3. Event occurs
4. Host resolves each outcome by selecting the correct answer
5. System calculates payouts (pool minus 1% rake, distributed proportionally)
6. Users view results and consolidated ledger
7. Users settle up externally and mark as settled in app
```

---

## Non-Functional Requirements

| Requirement         | Details                                   |
| ------------------- | ----------------------------------------- |
| **Platform**        | Web only (mobile browser optimized)       |
| **Design approach** | Web-first, responsive for mobile browsers |
| **SMS reliability** | Critical for invites and blasts           |
| **Onboarding**      | Low friction (phone + OTP + display name) |

### Scale Assumptions

| Metric          | Max Value |
| --------------- | --------- |
| Total users     | 50        |
| Total events    | 50        |
| Concurrent bets | 20        |

---

## Out of Scope (v1)

| Feature                           | Notes                                     |
| --------------------------------- | ----------------------------------------- |
| In-app payment processing         | Settlement is external                    |
| Real money betting infrastructure | No payment rails needed                   |
| Social features                   | No comments, reactions, activity feed     |
| Calendar integrations             | Not supported                             |
| Push notifications                | SMS only for v1 (push planned for future) |
| Recurring events                  | Not supported                             |
| Dispute resolution                | Host decision is final                    |
| Attendee opt-out from blasts      | Not supported                             |
| Native mobile apps                | Web only                                  |

---

## Technical Considerations for System Architect

1. **Phone verification** — Integrate SMS OTP provider (e.g., Twilio Verify)
2. **SMS delivery** — Reliable SMS gateway for invites and blasts
3. **Pari-mutuel calculation** — Implement pool betting math with 1% rake
4. **Ledger system** — Track net balances between users (similar to Splitwise)
5. **Event state machine** — Handle transitions: Draft → Active → Completed → Resolved
6. **Bet locking** — Enforce deadline at event start time
7. **Outcome state machine** — Handle: Open → Locked → Resolved

---

## Data Model Hints

### Core Entities

- **User** — phone, display_name, profile_photo_url
- **Event** — title, datetime, location, description, cover_image, is_public, status
- **EventMembership** — user_id, event_id, role (host/co-host/attendee), rsvp_status
- **Outcome** — event_id, creator_id, question, status, winning_option_id
- **Option** — outcome_id, label
- **Bet** — user_id, option_id, amount
- **Settlement** — from_user_id, to_user_id, event_id, amount, is_settled

---

## Success Metrics (Future)

- Event creation rate
- RSVP conversion rate
- Betting participation rate
- Settlement completion rate

---

## Next Steps

1. ✅ Requirements finalized
2. → Hand off to system architect for technical design
3. Define API contracts and data schema
4. Build MVP
