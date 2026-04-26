import { Request, Response } from 'express';
import { z, ZodError } from 'zod';
import prisma from '../lib/prisma';

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
});

// GET /api/posts — public feed, paginated
export async function listPosts(req: Request, res: Response): Promise<void> {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(req.query.limit as string) || 10));
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        tutorProfile: {
          select: {
            id: true,
            fullName: true,
            educationLevel: true,
            institutionName: true,
            subjects: {
              include: { subject: { select: { name: true } } },
              take: 3,
            },
          },
        },
      },
    }),
    prisma.post.count(),
  ]);

  res.json({
    posts: posts.map((p) => ({
      id: p.id,
      content: p.content,
      createdAt: p.createdAt,
      tutor: {
        id: p.tutorProfile.id,
        fullName: p.tutorProfile.fullName,
        educationLevel: p.tutorProfile.educationLevel,
        institutionName: p.tutorProfile.institutionName,
        subjects: p.tutorProfile.subjects.map((s) => s.subject.name),
      },
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

// POST /api/posts — tutor creates a post
export async function createPost(req: Request, res: Response): Promise<void> {
  let body: z.infer<typeof createPostSchema>;
  try {
    body = createPostSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const tutorProfile = await prisma.tutorProfile.findUnique({
    where: { userId: req.user!.id },
    select: { id: true },
  });

  if (!tutorProfile) {
    res.status(404).json({ error: 'Tutor profile not found' });
    return;
  }

  const post = await prisma.post.create({
    data: { tutorProfileId: tutorProfile.id, content: body.content },
    include: {
      tutorProfile: { select: { id: true, fullName: true, educationLevel: true, institutionName: true } },
    },
  });

  res.status(201).json({
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    tutor: {
      id: post.tutorProfile.id,
      fullName: post.tutorProfile.fullName,
      educationLevel: post.tutorProfile.educationLevel,
      institutionName: post.tutorProfile.institutionName,
    },
  });
}

// DELETE /api/posts/:id — tutor deletes own post
export async function deletePost(req: Request, res: Response): Promise<void> {
  const post = await prisma.post.findUnique({
    where: { id: req.params.id },
    include: { tutorProfile: { select: { userId: true } } },
  });

  if (!post) { res.status(404).json({ error: 'Post not found' }); return; }
  if (post.tutorProfile.userId !== req.user!.id) { res.status(403).json({ error: 'Forbidden' }); return; }

  await prisma.post.delete({ where: { id: req.params.id } });
  res.status(204).send();
}
