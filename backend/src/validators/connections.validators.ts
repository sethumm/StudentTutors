import { z } from 'zod';

export const createConnectionSchema = z.object({
  tutorProfileId: z.string().uuid('tutorProfileId must be a valid UUID'),
});

export const updateConnectionSchema = z.object({
  action: z.enum(['accept', 'decline'], {
    errorMap: () => ({ message: 'action must be "accept" or "decline"' }),
  }),
});

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
