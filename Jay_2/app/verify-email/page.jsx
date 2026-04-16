import { Suspense } from 'react';
import VerifyEmail from '../../components/auth/VerifyEmail';

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <VerifyEmail />
    </Suspense>
  );
}
