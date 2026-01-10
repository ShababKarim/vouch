import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('Start seeding...')

  // Create test users
  const alice = await prisma.user.create({
    data: {
      phone: '+15551234567',
      displayName: 'Alice Smith',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
    },
  })

  const bob = await prisma.user.create({
    data: {
      phone: '+15552345678',
      displayName: 'Bob Johnson',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
    },
  })

  const charlie = await prisma.user.create({
    data: {
      phone: '+15553456789',
      displayName: 'Charlie Brown',
      photoUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=charlie',
    },
  })

  console.log('Created 3 users')

  // Create test events
  const publicEvent = await prisma.event.create({
    data: {
      title: 'Weekend BBQ Party',
      datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      location: '123 Main St, Anytown, USA',
      description: 'Join us for a fun BBQ party in the backyard!',
      isPublic: true,
      status: 'UPCOMING',
    },
  })

  const privateEvent = await prisma.event.create({
    data: {
      title: 'Board Game Night',
      datetime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      location: '456 Oak Ave, Somewhere, USA',
      description: 'Bring your favorite board games and snacks!',
      isPublic: false,
      status: 'UPCOMING',
    },
  })

  console.log('Created 2 events')

  // Add event memberships
  await prisma.eventMembership.createMany({
    data: [
      {
        userId: alice.id,
        eventId: publicEvent.id,
        role: 'HOST',
        rsvpStatus: 'YES',
      },
      {
        userId: bob.id,
        eventId: publicEvent.id,
        role: 'ATTENDEE',
        rsvpStatus: 'YES',
      },
      {
        userId: charlie.id,
        eventId: publicEvent.id,
        role: 'ATTENDEE',
        rsvpStatus: 'MAYBE',
      },
      {
        userId: bob.id,
        eventId: privateEvent.id,
        role: 'HOST',
        rsvpStatus: 'YES',
      },
      {
        userId: alice.id,
        eventId: privateEvent.id,
        role: 'COHOST',
        rsvpStatus: 'YES',
      },
    ],
  })

  console.log('Created event memberships')

  // Create outcomes and options for public event
  const outcome1 = await prisma.outcome.create({
    data: {
      eventId: publicEvent.id,
      creatorId: alice.id,
      question: 'Will it rain during the BBQ?',
      status: 'OPEN',
    },
  })

  await prisma.option.createMany({
    data: [
      {
        outcomeId: outcome1.id,
        label: 'Yes',
      },
      {
        outcomeId: outcome1.id,
        label: 'No',
      },
    ],
  })

  const outcome2 = await prisma.outcome.create({
    data: {
      eventId: publicEvent.id,
      creatorId: bob.id,
      question: 'Will more than 10 people show up?',
      status: 'OPEN',
    },
  })

  await prisma.option.createMany({
    data: [
      {
        outcomeId: outcome2.id,
        label: 'Yes',
      },
      {
        outcomeId: outcome2.id,
        label: 'No',
      },
    ],
  })

  console.log('Created outcomes and options')

  // Get options for betting
  const options = await prisma.option.findMany({
    where: {
      outcome: {
        eventId: publicEvent.id,
      },
    },
  })

  // Create some bets
  await prisma.bet.createMany({
    data: [
      {
        userId: alice.id,
        optionId: options[0].id, // Alice bets Yes on rain
        amount: 10.00,
      },
      {
        userId: bob.id,
        optionId: options[1].id, // Bob bets No on rain
        amount: 20.00,
      },
      {
        userId: charlie.id,
        optionId: options[0].id, // Charlie bets Yes on rain
        amount: 15.00,
      },
      {
        userId: alice.id,
        optionId: options[2].id, // Alice bets Yes on attendance
        amount: 5.00,
      },
      {
        userId: bob.id,
        optionId: options[3].id, // Bob bets No on attendance
        amount: 10.00,
      },
    ],
  })

  console.log('Created bets')

  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
