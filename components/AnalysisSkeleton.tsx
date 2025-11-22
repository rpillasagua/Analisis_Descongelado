'use client';

export default function AnalysisSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 bg-slate-200 rounded w-48"></div>
                <div className="h-10 bg-slate-200 rounded w-32"></div>
            </div>

            {/* Tabs skeleton */}
            <div className="flex gap-2 border-b-2 border-gray-200 pb-2">
                <div className="h-10 bg-slate-200 rounded-t-lg w-32"></div>
                <div className="h-10 bg-slate-200 rounded-t-lg w-32"></div>
                <div className="h-10 bg-slate-200 rounded-t-lg w-24"></div>
            </div>

            {/* Cards skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                        <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[1, 2, 3].map((j) => (
                                <div key={j} className="space-y-2">
                                    <div className="h-4 bg-slate-200 rounded w-20"></div>
                                    <div className="h-10 bg-slate-200 rounded w-full"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
