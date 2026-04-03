import { Request, Response } from 'express';
import { ZodError, z } from 'zod';
import prisma from '../lib/prisma';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolves whether the authenticated user is a party to the given connection.
 * Returns the connection if the user is a party, or null otherwise.
 */
async function getConnectionForUser(
  connectionId: string,
  userId: string,
  role: string,
) {
  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    include: {
      tutorProfile: { select: { userId: true } },
      customer: { select: { userId: true } },
    },
  });

  if (!connection) return { connection: null, isParty: false };

  let isParty = false;
  if (role === 'customer') {
    isParty = connection.customer.userId === userId;
  } else if (role === 'tutor') {
    isParty = connection.tutorProfile.userId === userId;
  }

  return { connection, isParty };
}

// ─── Task 9.1: GET /api/messages/:connectionId ───────────────────────────────

export async function getMessages(req: Request, res: Response): Promise<void> {
  const { connectionId } = req.params;
  const { id: userId, role } = req.user!;

  const { connection, isParty } = await getConnectionForUser(connectionId, userId, role);

  if (!connection) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }

  if (!isParty) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Fetch messages ordered by createdAt ASC
  const messages = await prisma.message.findMany({
    where: { connectionId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      senderId: true,
      content: true,
      messageType: true,
      isRead: true,
      createdAt: true,
    },
  });

  // Mark messages from the other party as read
  await prisma.message.updateMany({
    where: {
      connectionId,
      senderId: { not: userId },
      isRead: false,
    },
    data: { isRead: true },
  });

  res.status(200).json({ messages });
}

// ─── Task 9.2: POST /api/messages/:connectionId ──────────────────────────────

const sendMessageSchema = z.object({
  content: z.string().min(1, 'Content must be a non-empty string'),
});

export async function sendMessage(req: Request, res: Response): Promise<void> {
  const { connectionId } = req.params;
  const { id: userId, role } = req.user!;

  let body: ReturnType<typeof sendMessageSchema.parse>;
  try {
    body = sendMessageSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const { connection, isParty } = await getConnectionForUser(connectionId, userId, role);

  if (!connection) {
    res.status(404).json({ error: 'Connection not found' });
    return;
  }

  if (connection.status !== 'accepted') {
    res.status(400).json({ error: 'Connection is not accepted' });
    return;
  }

  if (!isParty) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const message = await prisma.message.create({
    data: {
      connectionId,
      senderId: userId,
      content: body.content,
      messageType: 'text',
      isRead: false,
    },
    select: {
      id: true,
      senderId: true,
      content: true,
      messageType: true,
      isRead: true,
      createdAt: true,
    },
  });

  res.status(201).json(message);
}
