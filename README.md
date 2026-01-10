# Vouch

Event invitations with betting.

## Setup

### Local Development

1. Copy environment variables:
```bash
cp .env.example .env.local
```

2. Start with Docker Compose:
```bash
docker-compose up
```

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Seed database (optional):
```bash
npx prisma db seed
```

### Local-Prod (Real Services)

1. Add real Twilio and AWS credentials to `.env.local`
2. Start with override:
```bash
docker-compose -f docker-compose.yml -f docker-compose.local-prod.yml up
```

## Development

- App runs on http://localhost:3000
- Database on localhost:5432
- Hot reload enabled with volume mounts

### Docker Commands

```bash
# Start local development
docker-compose up

# Start with real services (local-prod)
docker-compose -f docker-compose.yml -f docker-compose.local-prod.yml up

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Rebuild after changes
docker-compose up --build
```

## Tech Stack

- Next.js 16.1.1 with TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM with PostgreSQL
- Docker & Docker Compose
- Twilio Verify for OTP
- AWS S3 for file storage
