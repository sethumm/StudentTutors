import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from './prisma';

type UserRole = 'tutor' | 'customer' | 'admin';

interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
}

let io: SocketIOServer;

/**
 * Checks whether the given userId is a party to the connection.
 */
async function isPartyToConnection(
  connectionId: string,
  userId: string,
  role: UserRole,
): Promise<{ ok: boolean; connection: { status: string } | null }> {
  const connection = await prisma.connection.findUnique({
    where: { id: connectionId },
    include: {
      tutorProfile: { select: { userId: true } },
      customer: { select: { userId: true } },
    },
  });

  if (!connection) return { ok: false, connection: null };

  let isParty = false;
  if (role === 'customer') {
    isParty = connection.customer.userId === userId;
  } else if (role === 'tutor') {
    isParty = connection.tutorProfile.userId === userId;
  }

  return { ok: isParty, connection };
}

export function setupSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
      credentials: true,
    },
  });

  // ── Authentication middleware ──────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication required'));
    }

    const jwtSecret = process.env.JWT_SECRET ?? 'dev_secret';
    try {
      const payload = jwt.verify(token, jwtSecret) as JwtPayload;
      socket.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
      } satisfies SocketUser;
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  // ── Connection handler ─────────────────────────────────────────────────────
  io.on('connection', (socket: Socket) => {
    const user: SocketUser = socket.data.user;

    // join_room: verify party membership then join the room
    socket.on('join_room', async (connectionId: string) => {
      try {
        const { ok } = await isPartyToConnection(connectionId, user.id, user.role);
        if (!ok) {
          socket.emit('error', { message: 'Forbidden' });
          return;
        }
        await socket.join(connectionId);
      } catch (err) {
        console.error('join_room error:', err);
        socket.emit('error', { message: 'Internal server error' });
      }
    });

    // send_message: create message in DB and broadcast to room
    socket.on(
      'send_message',
      async (payload: { connectionId: string; content: string }) => {
        try {
          const { connectionId, content } = payload;

          if (!content || typeof content !== 'string' || content.trim() === '') {
            socket.emit('error', { message: 'Content must be a non-empty string' });
            return;
          }

          const { ok, connection } = await isPartyToConnection(
            connectionId,
            user.id,
            user.role,
          );

          if (!connection) {
            socket.emit('error', { message: 'Connection not found' });
            return;
          }

          if (connection.status !== 'accepted') {
            socket.emit('error', { message: 'Connection is not accepted' });
            return;
          }

          if (!ok) {
            socket.emit('error', { message: 'Forbidden' });
            return;
          }

          const message = await prisma.message.create({
            data: {
              connectionId,
              senderId: user.id,
              content: content.trim(),
              messageType: 'text',
              isRead: false,
            },
            select: {
              id: true,
              connectionId: true,
              senderId: true,
              content: true,
              messageType: true,
              isRead: true,
              createdAt: true,
            },
          });

          io.to(connectionId).emit('new_message', message);
        } catch (err) {
          console.error('send_message error:', err);
          socket.emit('error', { message: 'Internal server error' });
        }
      },
    );

    // disconnect
    socket.on('disconnect', (reason: string) => {
      console.log(`Socket disconnected: ${socket.id} (${user.email}) — ${reason}`);
    });
  });

  return io;
}

export { io };
