import { Resend } from 'resend';
import { logger } from './logger';

/**
 * Email Service
 * Handles all email operations using Resend
 */

const resend = new Resend(process.env.RESEND_API_KEY);

interface VerificationEmailParams {
  email: string;
  firstName: string;
  verificationUrl: string;
}

interface PasswordResetEmailParams {
  email: string;
  firstName: string;
  resetUrl: string;
}

interface WelcomeEmailParams {
  email: string;
  firstName: string;
}

/**
 * Send verification email
 */
export async function sendVerificationEmail({
  email,
  firstName,
  verificationUrl,
}: VerificationEmailParams): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@getpitchconnect.com',
      to: email,
      subject: '🎯 Verify your PitchConnect email address',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F59E0B to #EA580C); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
              .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; }
              .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚽ PitchConnect</h1>
                <p>Your sports management platform</p>
              </div>

              <div class="content">
                <h2>Welcome to PitchConnect, ${firstName}!</h2>
                <p>Thank you for signing up. We're excited to have you on board.</p>

                <p>To complete your registration and get started, please verify your email address by clicking the button below:</p>

                <center>
                  <a href="${verificationUrl}" class="button">Verify Email Address</a>
                </center>

                <p style="font-size: 14px; color: #6b7280;">
                  If you didn't click the button, you can also copy and paste this link into your browser:
                </p>
                <p style="font-size: 12px; color: #6b7280; word-break: break-all;">
                  ${verificationUrl}
                </p>

                <p style="font-size: 14px; color: #6b7280;">
                  This link will expire in 24 hours.
                </p>
              </div>

              <div class="divider"></div>

              <p style="font-size: 14px; color: #6b7280;">
                If you didn't create this account, please ignore this email. If you have any questions, contact our support team at <a href="mailto:support@getpitchconnect.com">support@getpitchconnect.com</a>.
              </p>

              <div class="footer">
                <p>
                  © 2025 PitchConnect. All rights reserved.<br>
                  <a href="https://getpitchconnect.com/privacy" style="color: #F59E0B;">Privacy Policy</a> | 
                  <a href="https://getpitchconnect.com/terms" style="color: #F59E0B;">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    logger.info('Verification email sent', { email });
  } catch (error) {
    logger.error('Failed to send verification email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail({
  email,
  firstName,
  resetUrl,
}: PasswordResetEmailParams): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@getpitchconnect.com',
      to: email,
      subject: '🔐 Reset your PitchConnect password',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F59E0B to #EA580C); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
              .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; }
              .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚽ PitchConnect</h1>
                <p>Your sports management platform</p>
              </div>

              <div class="content">
                <h2>Reset your password</h2>
                <p>Hi ${firstName},</p>
                <p>We received a request to reset the password for your PitchConnect account. Click the button below to create a new password:</p>

                <center>
                  <a href="${resetUrl}" class="button">Reset Password</a>
                </center>

                <p style="font-size: 14px; color: #6b7280;">
                  If you didn't request this, you can ignore this email. Your password will remain unchanged.
                </p>

                <p style="font-size: 14px; color: #6b7280;">
                  This link will expire in 1 hour.
                </p>
              </div>

              <div class="divider"></div>

              <p style="font-size: 14px; color: #6b7280;">
                If you have any questions, contact our support team at <a href="mailto:support@getpitchconnect.com">support@getpitchconnect.com</a>.
              </p>

              <div class="footer">
                <p>
                  © 2025 PitchConnect. All rights reserved.<br>
                  <a href="https://getpitchconnect.com/privacy" style="color: #F59E0B;">Privacy Policy</a> | 
                  <a href="https://getpitchconnect.com/terms" style="color: #F59E0B;">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    logger.info('Password reset email sent', { email });
  } catch (error) {
    logger.error('Failed to send password reset email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Send welcome email after verification
 */
export async function sendWelcomeEmail({ email, firstName }: WelcomeEmailParams): Promise<void> {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'noreply@getpitchconnect.com',
      to: email,
      subject: '🎉 Welcome to PitchConnect!',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #F59E0B to #EA580C); color: white; padding: 30px; text-align: center; border-radius: 8px; margin-bottom: 30px; }
              .header h1 { margin: 0; font-size: 28px; }
              .content { background: #f9fafb; padding: 30px; border-radius: 8px; margin-bottom: 20px; }
              .button { display: inline-block; background: #F59E0B; color: white; padding: 12px 30px; border-radius: 6px; text-decoration: none; font-weight: bold; margin: 20px 0; }
              .features { list-style: none; padding: 0; }
              .features li { padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
              .features li:last-child { border-bottom: none; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; }
              .divider { border-top: 1px solid #e5e7eb; margin: 20px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>⚽ Welcome to PitchConnect!</h1>
                <p>Your sports management platform is ready</p>
              </div>

              <div class="content">
                <h2>You're all set, ${firstName}!</h2>
                <p>Your email has been verified and your PitchConnect account is now active.</p>

                <p>Here's what you can do now:</p>
                <ul class="features">
                  <li>✅ Create and manage your player profile</li>
                  <li>⚽ Join teams and track your statistics</li>
                  <li>📊 Access real-time analytics and insights</li>
                  <li>🎯 Participate in leagues and tournaments</li>
                  <li>💬 Communicate with your team</li>
                </ul>

                <center>
                  <a href="https://getpitchconnect.com/dashboard" class="button">Go to Dashboard</a>
                </center>
              </div>

              <div class="divider"></div>

              <p style="font-size: 14px; color: #6b7280;">
                If you have any questions or need help getting started, visit our <a href="https://getpitchconnect.com/help">Help Center</a> or contact <a href="mailto:support@getpitchconnect.com">support@getpitchconnect.com</a>.
              </p>

              <div class="footer">
                <p>
                  © 2025 PitchConnect. All rights reserved.<br>
                  <a href="https://getpitchconnect.com/privacy" style="color: #F59E0B;">Privacy Policy</a> | 
                  <a href="https://getpitchconnect.com/terms" style="color: #F59E0B;">Terms of Service</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    logger.info('Welcome email sent', { email });
  } catch (error) {
    logger.error('Failed to send welcome email', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}
