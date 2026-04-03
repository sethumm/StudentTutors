import prisma from './prisma';

export async function logAudit(
  adminUserId: string,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await prisma.auditLog.create({
    data: {
      adminUserId,
      action,
      targetType,
      targetId,
      metadata: metadata ?? null,
    },
  });
}
