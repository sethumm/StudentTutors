import { z } from 'zod';

const subjectUpdateSchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID'),
  level: z.enum(['gcse', 'a_level', 'both'], {
    errorMap: () => ({ message: 'level must be gcse, a_level, or both' }),
  }),
});

export const updateProfileSchema = z.object({
  bio: z.string().min(1).optional(),
  hourlyRate: z.number().positive('Hourly rate must be a positive number').optional(),
  institutionName: z.string().min(1).optional(),
  subjects: z.array(subjectUpdateSchema).min(1, 'At least one subject is required').optional(),
  yearGroups: z
    .array(z.number().int().min(7).max(13))
    .min(1, 'At least one year group is required')
    .optional(),
});

export const updateAvailabilitySchema = z.object({
  slots: z.array(
    z.object({
      dayOfWeek: z
        .number()
        .int()
        .min(0, 'dayOfWeek must be between 0 and 6')
        .max(6, 'dayOfWeek must be between 0 and 6'),
      startHour: z
        .number()
        .int()
        .min(6, 'startHour must be between 6 and 21')
        .max(21, 'startHour must be between 6 and 21'),
    }),
  ),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateAvailabilityInput = z.infer<typeof updateAvailabilitySchema>;
