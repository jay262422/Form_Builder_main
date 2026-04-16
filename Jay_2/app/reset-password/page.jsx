import { Suspense } from 'react';
import ResetPassword from '../../components/auth/ResetPassword';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <ResetPassword />
    </Suspense>
  );
}
