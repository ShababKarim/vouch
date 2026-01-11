import { prisma } from './prisma'

export async function checkEventMembership(userId: string, eventId: string) {
  const membership = await prisma.eventMembership.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  })
  
  return membership !== null
}

export async function checkEventRole(userId: string, eventId: string, allowedRoles: string[]) {
  const membership = await prisma.eventMembership.findUnique({
    where: {
      userId_eventId: {
        userId,
        eventId
      }
    }
  })
  
  return membership && allowedRoles.includes(membership.role)
}
