// src/lib/email.ts
export async function sendVerificationEmail(
  to: string,
  name: string,
  token: string,
  userId: string
) {
  // Replace with production email integration
  console.log(`[DEV] Sending verification email to: ${to}
    Name: ${name}
    Token: ${token}
    UserId: ${userId}
    -- This is a placeholder. Integrate with real email provider later.`);
  return;
}
