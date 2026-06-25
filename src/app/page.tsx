'use client';

import { useEffect } from 'react';
import { useStore } from '@/lib/store';
import { applyTheme } from '@/lib/themes';
import { AppShell } from '@/components/AppShell';
import { Onboarding } from '@/components/views/Onboarding';

export default function Home() {
  const theme = useStore((s) => s.settings.theme);
  const hasOnboarded = useStore((s) => s.hasOnboarded);

  // Apply theme on mount and whenever it changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  if (!hasOnboarded) {
    return <Onboarding />;
  }

  return <AppShell />;
}
