export function FormSkeleton() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
            <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
    );
}

export function TableSkeleton({ rows = 5 }) {
    return (
        <div className="space-y-4 animate-pulse">
            {/* Header */}
            <div className="flex gap-4 pb-4 border-b">
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-4 bg-gray-200 rounded flex-1"></div>
                ))}
            </div>
            {/* Rows */}
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex gap-4 py-3">
                    {[1, 2, 3, 4, 5].map(j => (
                        <div key={j} className="h-6 bg-gray-100 rounded flex-1"></div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export function CardSkeleton() {
    return (
        <div className="bg-white rounded-lg border p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="space-y-3">
                <div className="h-4 bg-gray-100 rounded w-full"></div>
                <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                <div className="h-4 bg-gray-100 rounded w-4/6"></div>
            </div>
        </div>
    );
}

export function AnalyticsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="bg-white rounded-lg border p-6">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                        <div className="h-8 bg-gray-300 rounded w-3/4"></div>
                    </div>
                ))}
            </div>
            {/* Chart */}
            <div className="bg-white rounded-lg border p-6">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-6"></div>
                <div className="h-64 bg-gray-100 rounded"></div>
            </div>
        </div>
    );
}
