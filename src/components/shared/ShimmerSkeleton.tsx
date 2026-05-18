export default function ShimmerSkeleton() {
  return (
    <div className="space-y-3">
      {[75, 100, 83, 60].map((w, i) => (
        <div
          key={i}
          className="h-4 rounded-full shimmer"
          style={{ width: `${w}%` }}
        />
      ))}
    </div>
  )
}
