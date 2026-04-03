import { Request, Response } from 'express';
import prisma from '../lib/prisma';
import { logAudit } from '../lib/audit';

// ─── Task 13.1: GET /api/admin/dashboard ─────────────────────────────────────

export async function getDashboard(_req: Request, res: Response): Promise<void> {
  const [
    totalTutors,
    totalCustomers,
    totalActiveConnections,
    totalCompletedPayments,
    totalReviews,
  ] = await Promise.all([
    prisma.tutorProfile.count(),
    prisma.customerProfile.count(),
    prisma.connection.count({ where: { status: 'accepted' } }),
    prisma.payment.count({ where: { status: 'completed' } }),
    prisma.review.count(),
  ]);

  res.status(200).json({
    totalTutors,
    totalCustomers,
    totalActiveConnections,
    totalCompletedPayments,
    totalReviews,
  });
}

// ─── Task 13.2: GET /api/admin/users ─────────────────────────────────────────

export async function listUsers(req: Request, res: Response): Promise<void> {
  const search = typeof req.query.search === 'string' ? req.query.search : undefined;
  const role = typeof req.query.role === 'string' ? req.query.role : undefined;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  // Build where clause
  const where: Record<string, unknown> = { deletedAt: null };

  if (role === 'tutor') {
    where.role = 'tutor';
  } else if (role === 'customer') {
    where.role = 'customer';
  }

  if (search) {
    where.OR = [
      {
        tutorProfile: {
          fullName: { contains: search, mode: 'insensitive' },
        },
      },
      {
        customerProfile: {
          fullName: { contains: search, mode: 'insensitive' },
        },
      },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        tutorProfile: {
          select: { fullName: true, isActive: true },
        },
        customerProfile: {
          select: { fullName: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  type UserRow = (typeof users)[number];

  const formatted = users.map((u: UserRow) => ({
    id: u.id,
    email: u.email,
    role: u.role,
    emailVerified: u.emailVerified,
    createdAt: u.createdAt,
    fullName: u.tutorProfile?.fullName ?? u.customerProfile?.fullName ?? null,
    isActive: u.tutorProfile?.isActive ?? null,
  }));

  res.status(200).json({
    users: formatted,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// ─── Task 13.2: PATCH /api/admin/users/:id/status ────────────────────────────

export async function updateUserStatus(req: Request, res: Response): Promise<void> {
  const userId = req.params.id;
  const adminUserId = req.user!.id;
  const { status } = req.body;

  if (status !== 'active' && status !== 'inactive') {
    res.status(400).json({ error: 'status must be "active" or "inactive"' });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      tutorProfile: { select: { id: true } },
    },
  });

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  if (user.role === 'tutor' && user.tutorProfile) {
    await prisma.tutorProfile.update({
      where: { id: user.tutorProfile.id },
      data: { isActive: status === 'active' },
    });
  }

  const action = status === 'active' ? 'activate_user' : 'deactivate_user';
  await logAudit(adminUserId, action, 'user', userId);

  res.status(200).json({ message: `User ${status === 'active' ? 'activated' : 'deactivated'} successfully` });
}

// ─── Task 13.4: GET /api/admin/reviews ───────────────────────────────────────

export async function listAllReviews(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        rating: true,
        reviewText: true,
        isHidden: true,
        createdAt: true,
        tutorProfile: { select: { fullName: true } },
        customer: { select: { fullName: true } },
      },
    }),
    prisma.review.count(),
  ]);

  type ReviewRow = (typeof reviews)[number];

  const formatted = reviews.map((r: ReviewRow) => ({
    id: r.id,
    rating: r.rating,
    reviewText: r.reviewText,
    isHidden: r.isHidden,
    createdAt: r.createdAt,
    tutorName: r.tutorProfile.fullName,
    reviewerFirstName: r.customer.fullName.split(' ')[0],
  }));

  res.status(200).json({
    reviews: formatted,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// ─── Task 13.4: DELETE /api/admin/reviews/:id ────────────────────────────────

export async function removeReview(req: Request, res: Response): Promise<void> {
  const reviewId = req.params.id;
  const adminUserId = req.user!.id;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true },
  });

  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  await prisma.review.update({
    where: { id: reviewId },
    data: { isHidden: true },
  });

  await logAudit(adminUserId, 'remove_review', 'review', reviewId);

  res.status(200).json({ message: 'Review hidden successfully' });
}

// ─── Task 13.6: GET /api/admin/audit ─────────────────────────────────────────

export async function getAuditLog(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        adminUserId: true,
        action: true,
        targetType: true,
        targetId: true,
        metadata: true,
        createdAt: true,
      },
    }),
    prisma.auditLog.count(),
  ]);

  res.status(200).json({
    logs,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}
