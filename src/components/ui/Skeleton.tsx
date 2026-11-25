import React from "react";

export function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-[#DDE4E2]/70 ${className}`}
      aria-hidden="true"
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <SkeletonBox className="h-7 w-44" />
          <SkeletonBox className="h-4 w-64" />
        </div>
        <SkeletonBox className="h-11 w-36 rounded-xl" />
      </div>

      <div className="bg-white border border-[#DDE4E2] rounded-2xl grid grid-cols-2 lg:grid-cols-4 overflow-hidden">
        {[
          "border-r border-b lg:border-b-0 border-[#DDE4E2]",
          "border-b lg:border-b-0 lg:border-r border-[#DDE4E2]",
          "border-r border-[#DDE4E2]",
          "",
        ].map((borderClass, i) => (
          <div key={i} className={`p-5 space-y-3 ${borderClass}`}>
            <SkeletonBox className="h-4 w-28" />
            <SkeletonBox className="h-7 w-32" />
            <SkeletonBox className="h-3.5 w-20" />
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DDE4E2] rounded-2xl p-5 space-y-4">
        <SkeletonBox className="h-5 w-48" />
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}
