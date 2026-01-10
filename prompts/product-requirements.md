# Product Requirements Document: Vouch

## Overview

Vouch is an event invitation and RSVP application with integrated pari-mutuel (pool) betting on event outcomes. Users can create events, invite attendees via SMS, and place friendly wagers on predictions related to the event.

---

## Core Features

### 1. User Registration & Authentication

- **Phone number-based signup** — Users register with their phone number as the primary identifier
- **Basic profile details** — Collect minimal information to get started

> **Clarifying Questions:**
> - What additional profile details are required beyond phone number? (e.g., display name, profile photo)
> - Should we support phone number verification via SMS OTP?
> - Is there a need for email as a secondary contact or recovery option?

---

### 2. Event Management

#### 2.1 Event Creation
- Hosts can create events with:
  - Event title
  - Date and time
  - Location (physical address or virtual link)
  - Description
  - Optional cover image

> **Clarifying Questions:**
> - Should events support recurring schedules (e.g., weekly game night)?
> - Are there event capacity limits?
> - Can events be private (invite-only) vs. public (shareable link)?

#### 2.2 Attendee Management
- Hosts can add attendees by phone number
- Attendees receive SMS invite links
- Attendees can RSVP (Yes / No / Maybe)

> **Clarifying Questions:**
> - Can attendees invite others (plus-ones or forwarding invites)?
> - Should hosts be able to set attendee limits?
> - Do we need waitlist functionality?

#### 2.3 Text Blasts
- Hosts can send SMS messages to all attendees or filtered groups (e.g., confirmed attendees only)

> **Clarifying Questions:**
> - Are there limits on the number of text blasts per event?
> - Should attendees be able to opt out of text blasts?
> - Do we need scheduling for text blasts (send later)?

---

### 3. Betting System (Pari-Mutuel / Pool Betting)

#### 3.1 Outcome Creation
- **Who can create:** Host or any attendee
- **Outcome structure:**
  - Question/prediction statement (e.g., "Brian will show up late to game night")
  - Multiple options to bet on (e.g., Yes / No, or custom options like "Before 7pm / 7-8pm / After 8pm")

> **Clarifying Questions:**
> - Is there a limit on the number of outcomes per event?
> - Can outcomes be edited or deleted after creation? Before bets are placed?
> - Should there be a deadline for creating outcomes (e.g., before event starts)?

#### 3.2 Placing Bets
- Users select an option for each outcome
- Bets are placed with a virtual stake amount

> **Clarifying Questions:**
> - What is the betting currency? Virtual points, fake dollars, or real money?
> - Is there a minimum/maximum bet amount?
> - Can users change their bet before the event?
> - Is there a betting deadline (e.g., event start time)?

#### 3.3 Pari-Mutuel Calculation
- All bets on an outcome are pooled together
- Winnings are distributed proportionally based on:
  - Total pool size
  - Amount wagered on the winning option
  - Individual bet amount

> **Clarifying Questions:**
> - Is there a house take (rake) or is the full pool distributed?
> - How do we handle ties or ambiguous outcomes?
> - What happens if no one bets on the winning option?

#### 3.4 Outcome Resolution
- After the event, the host inputs the correct answer for each outcome
- Results are displayed to all bettors showing:
  - Winning option
  - Payout amounts per user

> **Clarifying Questions:**
> - Can only the host resolve outcomes, or can the outcome creator?
> - Is there a dispute mechanism if attendees disagree with the result?
> - Is there a time limit for resolving outcomes after the event?

#### 3.5 Settlement
- **Out of scope:** Actual money transfer within the app
- The app displays who owes whom and how much
- Users settle up externally (Venmo, cash, etc.)

> **Clarifying Questions:**
> - Should we provide a "Mark as Settled" feature for tracking?
> - Do we show a consolidated ledger (net amounts owed between users)?

---

## User Roles

| Role | Permissions |
|------|-------------|
| **Host** | Create/edit/delete event, add attendees, send text blasts, create outcomes, resolve outcomes |
| **Attendee** | RSVP, create outcomes, place bets, view results |
| **Non-user (invited)** | Receive SMS invite, prompted to sign up to RSVP/bet |

> **Clarifying Questions:**
> - Can hosts transfer ownership of an event?
> - Can there be multiple co-hosts?

---

## User Flows

### Flow 1: Host Creates Event
1. Host signs up / logs in with phone number
2. Host creates event with details
3. Host adds attendees by phone number
4. System sends SMS invites with unique links
5. Attendees click link → sign up (if new) → RSVP

### Flow 2: Betting on an Outcome
1. Host or attendee creates an outcome with options
2. Attendees view outcomes and place bets
3. Event occurs
4. Host resolves outcomes by selecting correct answers
5. System calculates payouts using pari-mutuel formula
6. Users view results and settle up externally

---

## Non-Functional Requirements

- **Mobile-first design** — Primary usage expected on mobile devices
- **SMS delivery reliability** — Critical for invites and blasts
- **Low friction onboarding** — Minimal steps to sign up and participate

> **Clarifying Questions:**
> - What is the expected scale (users, events, concurrent bets)?
> - Are there any compliance/legal considerations for betting features (even if virtual)?
> - Should the app support web, iOS, Android, or all?

---

## Out of Scope (v1)

- In-app payment processing
- Real money betting
- Social features (comments, reactions, activity feed)
- Calendar integrations
- Push notifications (SMS only for v1)

> **Clarifying Questions:**
> - Are push notifications planned for a future version?
> - Should we design the data model to support real money betting later?

---

## Open Questions Summary

1. **Profile details:** What info is collected at signup beyond phone number?
2. **Betting currency:** Virtual points or fake dollars? Starting balance?
3. **Outcome creation permissions:** Any restrictions on who can create or when?
4. **Dispute resolution:** How to handle contested outcomes?
5. **Platform:** Web-only, native mobile, or both?
6. **Legal:** Any compliance considerations for pool betting mechanics?

---

## Next Steps

1. Resolve open questions with stakeholders
2. Hand off to system architect for technical design
3. Define MVP scope and prioritization
