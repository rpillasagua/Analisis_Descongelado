'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function EditAnalysisRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const analysisId = searchParams.get('id');

  useEffect(() => {
    if (analysisId) {
      // Redirect to the new page with the id parameter
      // The new page already has full edit functionality
      router.replace(`/dashboard/tests/new?id=${analysisId}`);
    } else {
      // No ID provided, go back to dashboard
      router.replace('/');
    }
  }, [analysisId, router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
        <p className="mt-4 text-gray-600 font-medium">Redirigiendo...</p>
      </div>
    </div>
  );
}

export default function EditAnalysisPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-[#f3f4f6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    }>
      <EditAnalysisRedirect />
    </Suspense>
  );
}
