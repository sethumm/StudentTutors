import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import { ZodError } from 'zod';
import prisma from '../lib/prisma';
import { sendVerificationEmail, sendPasswordResetEmail, sendLockoutEmail } from '../lib/email';
import {
  tutorRegistrationSchema,
  customerRegistrationSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators/auth.validators';

const BCRYPT_COST = 12;
const VERIFICATION_TOKEN_TTL_HOURS = 24;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;
const RESET_TOKEN_TTL_MINUTES = 60;
const ACCESS_TOKEN_TTL = '15m';
const REFRESH_TOKEN_TTL = '7d';
const REFRESH_COOKIE_NAME = 'refreshToken';

function tokenExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + VERIFICATION_TOKEN_TTL_HOURS);
  return expiry;
}

export async function registerTutor(req: Request, res: Response): Promise<void> {
  let body: ReturnType<typeof tutorRegistrationSchema.parse>;

  try {
    body = tutorRegistrationSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    res.status(409).json({ error: 'Email is already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);
  const verificationToken = randomUUID();
  const verificationTokenExpiry = tokenExpiry();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'tutor',
        verificationToken,
        verificationTokenExpiry,
      },
    });

    await tx.tutorProfile.create({
      data: {
        userId: user.id,
        fullName: body.fullName,
        educationLevel: body.educationLevel,
        institutionName: body.institutionName,
        bio: body.bio,
        hourlyRate: body.hourlyRate,
        subjects: {
          create: body.subjects.map((s) => ({
            subjectId: s.subjectId,
            level: s.level,
          })),
        },
        yearGroups: {
          create: body.yearGroups.map((yg) => ({ yearGroup: yg })),
        },
      },
    });
  });

  // Send verification email — failure is logged but does not block registration
  try {
    await sendVerificationEmail(body.email, verificationToken);
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr);
  }

  res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
}

export async function registerCustomer(req: Request, res: Response): Promise<void> {
  let body: ReturnType<typeof customerRegistrationSchema.parse>;

  try {
    body = customerRegistrationSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) {
    res.status(409).json({ error: 'Email is already registered' });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);
  const verificationToken = randomUUID();
  const verificationTokenExpiry = tokenExpiry();

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: body.email,
        passwordHash,
        role: 'customer',
        verificationToken,
        verificationTokenExpiry,
      },
    });

    await tx.customerProfile.create({
      data: {
        userId: user.id,
        fullName: body.fullName,
        phone: body.phone,
        role: body.role,
        yearGroup: body.yearGroup ?? null,
      },
    });
  });

  // Send verification email — failure is logged but does not block registration
  try {
    await sendVerificationEmail(body.email, verificationToken);
  } catch (emailErr) {
    console.error('Failed to send verification email:', emailErr);
  }

  res.status(201).json({ message: 'Registration successful. Please check your email to verify your account.' });
}

export async function verifyEmail(req: Request, res: Response): Promise<void> {
  const { token } = req.query;

  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Verification token is required' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: {
      verificationToken: token,
      verificationTokenExpiry: { gt: new Date() },
      deletedAt: null,
    },
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid or expired verification token' });
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      verificationToken: null,
      verificationTokenExpiry: null,
    },
  });

  res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
}

// ─── Task 3.5: Login ──────────────────────────────────────────────────────────

export async function login(req: Request, res: Response): Promise<void> {
  let body: ReturnType<typeof loginSchema.parse>;

  try {
    body = loginSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: { email: body.email, deletedAt: null },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  if (!user.emailVerified) {
    res.status(401).json({ error: 'Please verify your email before logging in' });
    return;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutesRemaining = Math.ceil(
      (user.lockedUntil.getTime() - Date.now()) / 60_000,
    );
    res.status(423).json({ error: 'Account locked', minutesRemaining });
    return;
  }

  const passwordMatch = await bcrypt.compare(body.password, user.passwordHash);

  if (!passwordMatch) {
    const newAttempts = user.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + LOCKOUT_MINUTES * 60_000)
      : null;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newAttempts,
        ...(shouldLock ? { lockedUntil } : {}),
      },
    });

    if (shouldLock) {
      try {
        await sendLockoutEmail(user.email);
      } catch (emailErr) {
        console.error('Failed to send lockout email:', emailErr);
      }
    }

    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Correct password — reset lockout state
  await prisma.user.update({
    where: { id: user.id },
    data: { failedLoginAttempts: 0, lockedUntil: null },
  });

  const jwtSecret = process.env.JWT_SECRET ?? 'dev_secret';
  const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret';

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  const refreshToken = jwt.sign(
    { sub: user.id },
    jwtRefreshSecret,
    { expiresIn: REFRESH_TOKEN_TTL },
  );

  res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  res.status(200).json({
    accessToken,
    user: { id: user.id, email: user.email, role: user.role },
  });
}

// ─── Task 3.8: Refresh Token & Logout ────────────────────────────────────────

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const token = req.cookies?.[REFRESH_COOKIE_NAME] as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Refresh token missing' });
    return;
  }

  let payload: { sub: string };
  try {
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET ?? 'dev_refresh_secret';
    payload = jwt.verify(token, jwtRefreshSecret) as { sub: string };
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
    return;
  }

  const user = await prisma.user.findFirst({
    where: { id: payload.sub, deletedAt: null },
  });

  if (!user) {
    res.status(401).json({ error: 'User not found' });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET ?? 'dev_secret';
  const accessToken = jwt.sign(
    { sub: user.id, role: user.role, email: user.email },
    jwtSecret,
    { expiresIn: ACCESS_TOKEN_TTL },
  );

  res.status(200).json({ accessToken });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.status(200).json({ message: 'Logged out successfully' });
}

// ─── Task 3.9: Forgot Password & Reset Password ───────────────────────────────

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  let body: ReturnType<typeof forgotPasswordSchema.parse>;

  try {
    body = forgotPasswordSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  // Always return 200 to avoid revealing whether the email exists
  const user = await prisma.user.findFirst({
    where: { email: body.email, deletedAt: null },
  });

  if (user) {
    const resetToken = randomUUID();
    const resetTokenExpiry = new Date(Date.now() + RESET_TOKEN_TTL_MINUTES * 60_000);

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExpiry },
    });

    try {
      await sendPasswordResetEmail(user.email, resetToken);
    } catch (emailErr) {
      console.error('Failed to send password reset email:', emailErr);
    }
  }

  res.status(200).json({ message: 'If that email is registered, a reset link has been sent.' });
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  let body: ReturnType<typeof resetPasswordSchema.parse>;

  try {
    body = resetPasswordSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(400).json({ error: 'Validation failed', details: err.errors });
      return;
    }
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: {
      resetToken: body.token,
      resetTokenExpiry: { gt: new Date() },
      deletedAt: null,
    },
  });

  if (!user) {
    res.status(400).json({ error: 'Invalid or expired reset token' });
    return;
  }

  const passwordHash = await bcrypt.hash(body.password, BCRYPT_COST);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetTokenExpiry: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
}
