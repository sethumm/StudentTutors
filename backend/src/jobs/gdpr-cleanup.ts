/**
 * GDPR Hard-Delete Cleanup Job
 *
 * Finds all User records soft-deleted more than 30 days ago and:
 * 1. Anonymises associated Payment rows (set customerId = null)
 * 2. Anonymises associated Message rows (set content = "[deleted]", senderId = null)
 * 3. Hard-deletes the User record (cascades to profiles via DB constraints)
 *
 * Run via: ts-node src/jobs/gdpr-cleanup.ts
 */

import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function run(): Promise<void> {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const usersToDelete = await prisma.user.findMany({
    where: {
      deletedAt: { lt: cutoff },
    },
    select: {
      id: true,
      email: true,
      customerProfile: { select: { id: true } },
    },
  });

  if (usersToDelete.length === 0) {
    console.log('No users eligible for hard deletion.');
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${usersToDelete.length} user(s) eligible for hard deletion.`);

  let deletedCount = 0;

  for (const user of usersToDelete) {
    try {
      await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Anonymise Payment rows linked to this customer profile
        if (user.customerProfile) {
          await tx.payment.updateMany({
            where: { customerId: user.customerProfile.id },
            data: { customerId: null },
          });
        }

        // Anonymise Message rows sent by this user
        await tx.message.updateMany({
          where: { senderId: user.id },
          data: { senderId: null, content: '[deleted]' },
        });

        // Hard-delete the user (Prisma will cascade to related records
        // that have onDelete: Cascade, or we handle them explicitly)
        // First delete dependent records that block user deletion
        if (user.customerProfile) {
          // Delete reviews by this customer
          await tx.review.deleteMany({ where: { customerId: user.customerProfile.id } });
          // Delete customer profile
          await tx.customerProfile.delete({ where: { id: user.customerProfile.id } });
        }

        // Delete the user record
        await tx.user.delete({ where: { id: user.id } });
      });

      deletedCount++;
      console.log(`Hard-deleted user ${user.id} (${user.email})`);
    } catch (err) {
      console.error(`Failed to delete user ${user.id}:`, err);
    }
  }

  console.log(`GDPR cleanup complete. Hard-deleted ${deletedCount} user(s).`);
  await prisma.$disconnect();
}

run().catch((err) => {
  console.error('GDPR cleanup job failed:', err);
  process.exit(1);
});
