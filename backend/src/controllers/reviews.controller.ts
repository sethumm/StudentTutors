import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';

// ─── Profanity filter ─────────────────────────────────────────────────────────

const PROFANITY_LIST = ['fuck', 'shit', 'cunt', 'bastard', 'bitch', 'asshole'];

function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  return PROFANITY_LIST.some((word) => lower.includes(word));
}

// ─── Validators ───────────────────────────────────────────────────────────────

const submitReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().optional(),
});

const editReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  reviewText: z.string().optional(),
});

// ─── Task 12.1: POST /api/tutors/:id/reviews ─────────────────────────────────

export async function submitReview(req: Request, res: Response): Promise<void> {
  const tutorProfileId = req.params.id;
  const userId = req.user!.id;

  // Get customer profile
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!customerProfile) {
    res.status(404).json({ error: 'Customer profile not found' });
    return;
  }

  const customerId = customerProfile.id;

  // Gate: customer must have a completed Payment for this tutorProfileId
  const completedPayment = await prisma.payment.findFirst({
    where: {
      customerId,
      tutorProfileId,
      status: 'completed',
    },
  });

  if (!completedPayment) {
    res.status(403).json({ error: 'You must have a completed payment with this tutor to leave a review' });
    return;
  }

  // Validate body
  let body: z.infer<typeof submitReviewSchema>;
  try {
    body = submitReviewSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const { rating, reviewText } = body;

  // Profanity filter
  if (reviewText && containsProfanity(reviewText)) {
    res.status(400).json({ error: 'Review contains prohibited content' });
    return;
  }

  // Enforce one review per customer/tutor pair
  const existingReview = await prisma.review.findFirst({
    where: { customerId, tutorProfileId },
    select: { id: true },
  });

  if (existingReview) {
    res.status(409).json({
      error: 'You have already submitted a review for this tutor',
      existingReviewId: existingReview.id,
    });
    return;
  }

  // Create review
  const review = await prisma.review.create({
    data: {
      customerId,
      tutorProfileId,
      rating,
      reviewText: reviewText ?? null,
    },
    select: {
      id: true,
      rating: true,
      reviewText: true,
      createdAt: true,
    },
  });

  res.status(201).json({ review });
}

// ─── Task 12.3: GET /api/tutors/:id/reviews ──────────────────────────────────

export async function getReviews(req: Request, res: Response): Promise<void> {
  const tutorProfileId = req.params.id;

  const reviews = await prisma.review.findMany({
    where: { tutorProfileId, isHidden: false },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      rating: true,
      reviewText: true,
      createdAt: true,
      customer: {
        select: { fullName: true },
      },
    },
  });

  const formattedReviews = reviews.map((r: typeof reviews[number]) => ({
    id: r.id,
    reviewerFirstName: r.customer.fullName.split(' ')[0],
    rating: r.rating,
    reviewText: r.reviewText,
    createdAt: r.createdAt,
  }));

  const ratings = reviews.map((r: typeof reviews[number]) => r.rating);
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length) * 10) / 10
      : null;

  res.status(200).json({
    reviews: formattedReviews,
    averageRating,
    reviewCount: reviews.length,
  });
}

// ─── Task 12.5: PUT /api/reviews/:id ─────────────────────────────────────────

export async function editReview(req: Request, res: Response): Promise<void> {
  const reviewId = req.params.id;
  const userId = req.user!.id;

  // Get customer profile
  const customerProfile = await prisma.customerProfile.findUnique({
    where: { userId },
    select: { id: true },
  });

  if (!customerProfile) {
    res.status(404).json({ error: 'Customer profile not found' });
    return;
  }

  // Find review and verify ownership
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, customerId: true },
  });

  if (!review) {
    res.status(404).json({ error: 'Review not found' });
    return;
  }

  if (review.customerId !== customerProfile.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  // Validate body
  let body: z.infer<typeof editReviewSchema>;
  try {
    body = editReviewSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const { rating, reviewText } = body;

  // Profanity filter
  if (reviewText && containsProfanity(reviewText)) {
    res.status(400).json({ error: 'Review contains prohibited content' });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (rating !== undefined) updateData.rating = rating;
  if (reviewText !== undefined) updateData.reviewText = reviewText;

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: updateData,
    select: {
      id: true,
      rating: true,
      reviewText: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  res.status(200).json({ review: updated });
}
