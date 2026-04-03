import { Request, Response } from 'express';
import prisma from '../lib/prisma';

// ─── Task 14.1: DELETE /api/customers/:id ────────────────────────────────────

export async function deleteCustomer(req: Request, res: Response): Promise<void> {
  const targetUserId = req.params.id;
  const requestingUser = req.user!;

  // Only the owner or an admin can delete
  if (requestingUser.id !== targetUserId && requestingUser.role !== 'admin') {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { id: true, deletedAt: true },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.deletedAt !== null) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  await prisma.user.update({
    where: { id: targetUserId },
    data: { deletedAt: new Date() },
  });

  res.status(204).send();
}
