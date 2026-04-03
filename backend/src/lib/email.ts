import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY ?? '');

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL ?? 'noreply@example.com';
const APP_URL = process.env.APP_URL ?? 'http://localhost:3000';

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`;

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Verify your email — UK Tutor Marketplace',
    text: `Please verify your email by visiting: ${verifyUrl}`,
    html: `<p>Please verify your email by clicking the link below:</p>
           <p><a href="${verifyUrl}">Verify Email</a></p>
           <p>This link expires in 24 hours.</p>`,
  });
}

export async function sendConfirmationEmail(to: string): Promise<void> {
  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Welcome to UK Tutor Marketplace',
    text: 'Your account has been created successfully. You can now log in.',
    html: `<p>Welcome to UK Tutor Marketplace!</p>
           <p>Your account has been created successfully. You can now log in.</p>`,
  });
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const resetUrl = `${APP_URL}/reset-password?token=${token}`;

  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Reset your password — UK Tutor Marketplace',
    text: `Reset your password by visiting: ${resetUrl}\n\nThis link expires in 60 minutes.`,
    html: `<p>You requested a password reset. Click the link below to set a new password:</p>
           <p><a href="${resetUrl}">Reset Password</a></p>
           <p>This link expires in 60 minutes. If you did not request this, you can ignore this email.</p>`,
  });
}

export async function sendLockoutEmail(to: string): Promise<void> {
  await sgMail.send({
    to,
    from: FROM_EMAIL,
    subject: 'Account temporarily locked — UK Tutor Marketplace',
    text: 'Your account has been temporarily locked for 15 minutes due to 5 consecutive failed login attempts. Please try again later.',
    html: `<p>Your account has been temporarily locked for <strong>15 minutes</strong> due to 5 consecutive failed login attempts.</p>
           <p>If this was not you, please reset your password after the lockout period.</p>`,
  });
}
