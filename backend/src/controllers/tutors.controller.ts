import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { updateProfileSchema, updateAvailabilitySchema } from '../validators/tutors.validators';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function buildPublicProfile(tutorProfileId: string) {
  const profile = await prisma.tutorProfile.findUnique({
    where: { id: tutorProfileId },
    include: {
      user: { select: { emailVerified: true, deletedAt: true } },
      subjects: {
        include: { subject: { select: { name: true } } },
      },
      yearGroups: { select: { yearGroup: true } },
      availability: { select: { dayOfWeek: true, startHour: true } },
      reviews: {
        where: { isHidden: false },
        select: { rating: true },
      },
    },
  });

  return profile;
}

function formatPublicProfile(profile: NonNullable<Awaited<ReturnType<typeof buildPublicProfile>>>) {
  const ratings = profile.reviews.map((r: { rating: number }) => r.rating);
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum: number, r: number) => sum + r, 0) / ratings.length) * 10) / 10
      : null;

  return {
    id: profile.id,
    fullName: profile.fullName,
    educationLevel: profile.educationLevel,
    institutionName: profile.institutionName,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate.toString(),
    isActive: profile.isActive,
    subjects: profile.subjects.map((s: { subjectId: string; subject: { name: string }; level: string }) => ({
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      level: s.level,
    })),
    yearGroups: profile.yearGroups.map((yg: { yearGroup: number }) => yg.yearGroup),
    availability: profile.availability.map((a: { dayOfWeek: number; startHour: number }) => ({
      dayOfWeek: a.dayOfWeek,
      startHour: a.startHour,
    })),
    averageRating,
    reviewCount: ratings.length,
  };
}

// ─── Shared Prisma include for listing/search ────────────────────────────────

const TUTOR_LIST_INCLUDE = {
  user: { select: { emailVerified: true, deletedAt: true } },
  subjects: {
    include: { subject: { select: { name: true, id: true } } },
  },
  yearGroups: { select: { yearGroup: true } },
  availability: { select: { dayOfWeek: true } },
  reviews: {
    where: { isHidden: false },
    select: { rating: true },
  },
} as const;

function formatListingEntry(profile: {
  id: string;
  fullName: string;
  educationLevel: string;
  institutionName: string;
  hourlyRate: { toString(): string };
  subjects: Array<{ subject: { name: string; id: string }; level: string }>;
  yearGroups: Array<{ yearGroup: number }>;
  availability: Array<{ dayOfWeek: number }>;
  reviews: Array<{ rating: number }>;
}) {
  const ratings = profile.reviews.map((r) => r.rating);
  const averageRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((sum, r) => sum + r, 0) / ratings.length) * 10) / 10
      : null;

  const daysAvailable = [...new Set(profile.availability.map((a) => a.dayOfWeek))].sort();

  return {
    id: profile.id,
    fullName: profile.fullName,
    educationLevel: profile.educationLevel,
    institutionName: profile.institutionName,
    hourlyRate: profile.hourlyRate.toString(),
    location: (profile as { location?: string | null }).location ?? null,
    subjects: profile.subjects.map((s) => ({
      name: s.subject.name,
      level: s.level,
    })),
    yearGroups: profile.yearGroups.map((yg) => yg.yearGroup),
    availability: { daysAvailable },
    averageRating,
    reviewCount: ratings.length,
  };
}

// ─── Task 6.1: GET /api/tutors ────────────────────────────────────────────────

export async function listTutors(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const where = {
    isActive: true,
    user: {
      emailVerified: true,
      deletedAt: null,
    },
  };

  const [profiles, total] = await Promise.all([
    prisma.tutorProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: TUTOR_LIST_INCLUDE,
    }),
    prisma.tutorProfile.count({ where }),
  ]);

  res.status(200).json({
    tutors: profiles.map(formatListingEntry),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// ─── Task 6.3: GET /api/tutors/search ─────────────────────────────────────────

export async function searchTutors(req: Request, res: Response): Promise<void> {
  const { subject, yearGroup, day, minRating, location } = req.query;

  const yearGroupInt = yearGroup !== undefined ? parseInt(yearGroup as string) : undefined;
  const dayInt = day !== undefined ? parseInt(day as string) : undefined;
  const minRatingFloat = minRating !== undefined ? parseFloat(minRating as string) : undefined;

  if (yearGroupInt !== undefined && (isNaN(yearGroupInt) || yearGroupInt < 7 || yearGroupInt > 13)) {
    res.status(400).json({ error: 'yearGroup must be an integer between 7 and 13' });
    return;
  }

  if (dayInt !== undefined && (isNaN(dayInt) || dayInt < 0 || dayInt > 6)) {
    res.status(400).json({ error: 'day must be an integer between 0 and 6' });
    return;
  }

  const where: Record<string, unknown> = {
    isActive: true,
    user: { emailVerified: true, deletedAt: null },
  };

  if (subject && typeof subject === 'string' && subject.trim()) {
    const searchTerm = subject.trim();

    // Build synonym list for common abbreviations
    const synonyms: string[] = [searchTerm];
    const lower = searchTerm.toLowerCase();
    if (lower === 'maths' || lower === 'math') {
      synonyms.push('Mathematics');
    } else if (lower === 'mathematics') {
      synonyms.push('Maths', 'Math');
    } else if (lower === 'english') {
      synonyms.push('English Language', 'English Literature');
    } else if (lower === '11+' || lower === '11 plus' || lower === 'eleven plus') {
      synonyms.push('11 Plus (11+)', '11+', 'Eleven Plus');
    }

    where.subjects = {
      some: {
        subject: {
          OR: synonyms.map((s) => ({ name: { contains: s, mode: 'insensitive' } })),
        },
      },
    };
  }

  if (yearGroupInt !== undefined) {
    where.yearGroups = { some: { yearGroup: yearGroupInt } };
  }

  if (dayInt !== undefined) {
    where.availability = { some: { dayOfWeek: dayInt } };
  }

  if (location && typeof location === 'string' && location.trim()) {
    where.location = { contains: location.trim(), mode: 'insensitive' };
  }

  let profiles = await prisma.tutorProfile.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: TUTOR_LIST_INCLUDE,
  });

  // Filter by minimum rating in memory (requires computing average)
  if (minRatingFloat !== undefined && !isNaN(minRatingFloat)) {
    profiles = profiles.filter((p) => {
      const ratings = p.reviews.map((r: { rating: number }) => r.rating);
      if (ratings.length === 0) return false;
      const avg = ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length;
      return avg >= minRatingFloat;
    });
  }

  if (profiles.length === 0) {
    res.status(200).json({
      tutors: [],
      total: 0,
      message: 'No tutors found. Try broadening your search.',
    });
    return;
  }

  res.status(200).json({
    tutors: profiles.map(formatListingEntry),
    total: profiles.length,
  });
}

// ─── Task 5.2: GET /api/tutors/:id ────────────────────────────────────────────

export async function getTutorProfile(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const profile = await buildPublicProfile(id);

  if (
    !profile ||
    !profile.isActive ||
    !profile.user.emailVerified ||
    profile.user.deletedAt !== null
  ) {
    res.status(404).json({ error: 'Tutor not found' });
    return;
  }

  res.status(200).json(formatPublicProfile(profile));
}

// ─── Task 5.4: PUT /api/tutors/:id/profile ────────────────────────────────────

export async function updateTutorProfile(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Verify ownership
  const profile = await prisma.tutorProfile.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!profile) {
    res.status(404).json({ error: 'Tutor not found' });
    return;
  }

  if (profile.userId !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  let body: ReturnType<typeof updateProfileSchema.parse>;
  try {
    body = updateProfileSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Replace subjects atomically if provided
    if (body.subjects !== undefined) {
      await tx.tutorSubject.deleteMany({ where: { tutorProfileId: id } });
      await tx.tutorSubject.createMany({
        data: body.subjects.map((s) => ({
          tutorProfileId: id,
          subjectId: s.subjectId,
          level: s.level,
        })),
      });
    }

    // Replace year groups atomically if provided
    if (body.yearGroups !== undefined) {
      await tx.tutorYearGroup.deleteMany({ where: { tutorProfileId: id } });
      await tx.tutorYearGroup.createMany({
        data: body.yearGroups.map((yg) => ({
          tutorProfileId: id,
          yearGroup: yg,
        })),
      });
    }

    // Update scalar fields
    const scalarUpdates: Record<string, unknown> = {};
    if (body.bio !== undefined) scalarUpdates.bio = body.bio;
    if (body.hourlyRate !== undefined) scalarUpdates.hourlyRate = body.hourlyRate;
    if (body.institutionName !== undefined) scalarUpdates.institutionName = body.institutionName;

    if (Object.keys(scalarUpdates).length > 0) {
      await tx.tutorProfile.update({ where: { id }, data: scalarUpdates });
    }
  });

  const updated = await buildPublicProfile(id);
  if (!updated) {
    res.status(404).json({ error: 'Tutor not found' });
    return;
  }

  res.status(200).json(formatPublicProfile(updated));
}

// ─── Task 5.6: PUT /api/tutors/:id/availability ───────────────────────────────

export async function updateAvailability(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  // Verify ownership
  const profile = await prisma.tutorProfile.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!profile) {
    res.status(404).json({ error: 'Tutor not found' });
    return;
  }

  if (profile.userId !== req.user!.id) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  let body: ReturnType<typeof updateAvailabilitySchema.parse>;
  try {
    body = updateAvailabilitySchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const slots = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.availability.deleteMany({ where: { tutorProfileId: id } });
    await tx.availability.createMany({
      data: body.slots.map((s) => ({
        tutorProfileId: id,
        dayOfWeek: s.dayOfWeek,
        startHour: s.startHour,
      })),
    });

    return tx.availability.findMany({
      where: { tutorProfileId: id },
      select: { dayOfWeek: true, startHour: true },
    });
  });

  res.status(200).json({ slots });
}
