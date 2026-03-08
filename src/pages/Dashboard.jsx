import StatCard from "../components/StatCard.jsx"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Employee Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Today Status" value="-" />
        <StatCard title="Late Marks" value="0" accent="gold" />
        <StatCard title="Earned Leave" value="0" />
      </div>
    </div>
  )
}
