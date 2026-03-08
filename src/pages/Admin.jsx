import StatCard from "../components/StatCard.jsx"
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts"

export default function Admin() {
  const attendanceData = [
    { day: "Mon", count: 10 },
    { day: "Tue", count: 12 },
    { day: "Wed", count: 11 },
    { day: "Thu", count: 13 },
    { day: "Fri", count: 12 }
  ]
  const salesData = [
    { month: "Jan", booked: 8, paid: 6 },
    { month: "Feb", booked: 10, paid: 9 },
    { month: "Mar", booked: 12, paid: 10 }
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Users" value="0" />
        <StatCard title="Pending Approvals" value="0" accent="gold" />
        <StatCard title="AMC Alerts" value="0" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 font-medium text-gray-700">Attendance (Last 5 Days)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#000080" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <div className="mb-2 font-medium text-gray-700">Sales (Booked vs Paid)</div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="booked" fill="#000080" />
                <Bar dataKey="paid" fill="#D4AF37" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
