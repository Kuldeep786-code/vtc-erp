export default function StatCard({ title, value, accent = "navy" }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${accent === "gold" ? "brand-gold" : "text-navy"}`}>{value}</div>
    </div>
  )
}
