/**
 * Auth Error Handler
 * Handles NextAuth errors gracefully
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const error = req.nextUrl.searchParams.get('error');

  const errorMessages: Record<string, string> = {
    Callback: 'There was an error connecting your account',
    OAuthSignin: 'Error connecting to OAuth provider',
    OAuthCallback: 'Error in OAuth callback',
    EmailCreateAccount: 'Could not create user account',
    Callback: 'Callback route handler error',
    OAuthAccountNotLinked: 'Email already linked to different account',
    EmailSignInError: 'Email sign-in error',
    CredentialsSignin: 'Invalid email or password',
    default: 'An error occurred during authentication',
  };

  const message = errorMessages[error as string] || errorMessages.default;

  return NextResponse.json(
    { error, message },
    { status: 401 }
  );
}
