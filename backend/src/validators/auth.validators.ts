import { z } from 'zod';

const subjectSchema = z.object({
  subjectId: z.string().uuid('subjectId must be a valid UUID'),
  level: z.enum(['gcse', 'a_level', 'both'], {
    errorMap: () => ({ message: 'level must be gcse, a_level, or both' }),
  }),
});

export const tutorRegistrationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  educationLevel: z.enum(['a_level', 'university'], {
    errorMap: () => ({ message: 'educationLevel must be a_level or university' }),
  }),
  institutionName: z.string().min(1, 'Institution name is required'),
  bio: z.string().min(1, 'Bio is required'),
  hourlyRate: z.number().positive('Hourly rate must be a positive number'),
  subjects: z
    .array(subjectSchema)
    .min(1, 'At least one subject is required'),
  yearGroups: z
    .array(z.number().int().min(7).max(13))
    .min(1, 'At least one year group is required'),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms of Service and Privacy Policy' }),
  }),
});

export const customerRegistrationSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(1, 'Phone number is required'),
  role: z.enum(['student', 'parent'], {
    errorMap: () => ({ message: 'role must be student or parent' }),
  }),
  yearGroup: z.number().int().min(7).max(13).optional(),
  acceptedTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the Terms of Service and Privacy Policy' }),
  }),
}).refine(
  (data) => data.role !== 'student' || data.yearGroup !== undefined,
  { message: 'Year group is required for students', path: ['yearGroup'] },
);

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type TutorRegistrationInput = z.infer<typeof tutorRegistrationSchema>;
export type CustomerRegistrationInput = z.infer<typeof customerRegistrationSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
