'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import { api } from '@/utils/api';
import { type ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

export function TRPCReactProvider({
  children,
  headers,
}: {
  children: React.ReactNode;
  headers: ReadonlyHeaders;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    api.createClient({
      links: [
        httpBatchLink({
          url: '/api/trpc',
          headers() {
            const heads = new Map(headers);
            heads.set('x-trpc-source', 'react');
            return Object.fromEntries(heads);
          },
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <api.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </api.Provider>
  );
} 