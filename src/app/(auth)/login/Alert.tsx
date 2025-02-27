'use client';

import { useSearchParams } from 'next/navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

export function ErrorAlert() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  if (!error) return null;

  return (
    <Alert variant="destructive" className="animate-in fade-in-50 slide-in-from-top-5">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}