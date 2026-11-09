import React from 'react';
import { StoreProvider } from '@/lib/store-context';
import AppShell from '@/components/AppShell';

export default function HomePage() {
  return (
    <StoreProvider>
      <AppShell />
    </StoreProvider>
  );
}
