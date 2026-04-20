export default function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Nav placeholder */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="h-6 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-9 w-24 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Gauge card */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-col items-center">
            <div className="mb-2 h-3 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="mb-4 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />

            {/* Gauge arc placeholder */}
            <div className="relative mb-4" style={{ width: 300, height: 160 }}>
              <svg viewBox="0 0 320 180" width="100%" style={{ maxWidth: 300 }}>
                <path
                  d="M 20,180 A 140,140 0 0 1 300,180"
                  fill="none"
                  strokeWidth={18}
                  strokeLinecap="round"
                  className="animate-pulse stroke-gray-200 dark:stroke-gray-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <div className="h-12 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
            </div>

            <div className="h-7 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="mt-4 h-10 w-64 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
          </div>
        </div>

        {/* Factor breakdown card */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 h-5 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="h-2.5 w-full animate-pulse rounded-full bg-gray-100 dark:bg-gray-800" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations card */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 h-5 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
          <div className="space-y-5">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-700 dark:bg-gray-800">
                <div className="mb-3 flex items-center gap-2">
                  <div className="h-6 w-6 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" />
                  <div className="h-4 w-48 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                  <div className="h-3 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
