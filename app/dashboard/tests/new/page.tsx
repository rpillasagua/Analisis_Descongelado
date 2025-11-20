'use client';

import React, { Suspense } from 'react';
import NewMultiAnalysisPageContent from './PageContent';

export const dynamic = 'force-dynamic';

export default function NewMultiAnalysisPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400 text-lg">Cargando análisis...</p>
                </div>
            </div>
        }>
            <NewMultiAnalysisPageContent />
        </Suspense>
    );
}
