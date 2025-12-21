'use client';

import { ReactNode } from 'react';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';

interface ClientSessionProviderProps {
  children: ReactNode;
  session: SessionProviderProps['session'];
}

export function ClientSessionProvider({
  children,
  session,
}: ClientSessionProviderProps) {
  return (
    <SessionProvider session={session}>
      {children}
    </SessionProvider>
  );
}

export default ClientSessionProvider;
