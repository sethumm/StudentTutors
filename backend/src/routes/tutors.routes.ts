import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import {
  listTutors,
  searchTutors,
  getTutorProfile,
  updateTutorProfile,
  updateAvailability,
} from '../controllers/tutors.controller';
import { submitReview, getReviews } from '../controllers/reviews.controller';

const router = Router();

// GET /api/tutors/me — authenticated tutor gets own profile
router.get('/me', authenticate, requireRole('tutor'), async (req, res) => {
  const { default: prisma } = await import('../lib/prisma');
  const profile = await prisma.tutorProfile.findUnique({
    where: { userId: req.user!.id },
    include: {
      user: { select: { emailVerified: true, deletedAt: true } },
      subjects: { include: { subject: { select: { name: true, id: true } } } },
      yearGroups: { select: { yearGroup: true } },
      availability: { select: { dayOfWeek: true, startHour: true } },
      reviews: { where: { isHidden: false }, select: { rating: true } },
    },
  });
  if (!profile) { res.status(404).json({ error: 'Profile not found' }); return; }
  const ratings = profile.reviews.map((r: { rating: number }) => r.rating);
  res.json({
    id: profile.id,
    fullName: profile.fullName,
    educationLevel: profile.educationLevel,
    institutionName: profile.institutionName,
    bio: profile.bio,
    hourlyRate: profile.hourlyRate.toString(),
    subjects: profile.subjects.map((s: { subjectId: string; subject: { name: string; id: string }; level: string }) => ({
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      level: s.level,
    })),
    yearGroups: profile.yearGroups.map((yg: { yearGroup: number }) => yg.yearGroup),
    availability: profile.availability,
    averageRating: ratings.length > 0 ? Math.round((ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length) * 10) / 10 : null,
    reviewCount: ratings.length,
  });
});

// GET /api/tutors — paginated listing (must be before /:id)
router.get('/', listTutors);

// GET /api/tutors/search — search by subject/yearGroup/day (must be before /:id)
router.get('/search', searchTutors);

// GET /api/tutors/:id — public profile
router.get('/:id', getTutorProfile);

// PUT /api/tutors/:id/profile — authenticated tutor updates own profile
router.put('/:id/profile', authenticate, requireRole('tutor'), updateTutorProfile);

// PUT /api/tutors/:id/availability — authenticated tutor updates own availability
router.put('/:id/availability', authenticate, requireRole('tutor'), updateAvailability);

// POST /api/tutors/:id/reviews — customer submits review
router.post('/:id/reviews', authenticate, requireRole('customer'), submitReview);

// GET /api/tutors/:id/reviews — public review listing
router.get('/:id/reviews', getReviews);

export default router;
