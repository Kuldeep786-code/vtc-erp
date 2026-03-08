import React, { useState, useEffect } from "react"
import { supabase } from "../lib/supabaseClient.js"
import DataTable from "../components/DataTable.jsx"
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
  const [activeTab, setActiveTab] = useState('dashboard')
  const [users, setUsers] = useState([])
  const [monitoring, setMonitoring] = useState([])

  useEffect(() => {
    if (activeTab === 'users') fetchUsers()
    if (activeTab === 'live') fetchLiveLocation()
  }, [activeTab])

  async function fetchUsers() {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('*')
    setUsers(data || [])
  }

  async function fetchLiveLocation() {
    if (!supabase) return
    const { data } = await supabase.from('location_logs').select('*, profiles(full_name)').order('recorded_at', { ascending: false }).limit(20)
    setMonitoring(data || [])
  }

  async function updateUserConfig(id, field, value) {
    if (!supabase) return
    await supabase.from('profiles').update({ [field]: value }).eq('id', id)
    fetchUsers()
  }

  const userColumns = [
    { header: "Name", accessor: "full_name" },
    { header: "Role", cell: (row) => (
      <select 
        value={row.role} 
        onChange={(e) => updateUserConfig(row.id, 'role', e.target.value)}
        className="text-xs border rounded p-1"
      >
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="hr">HR</option>
        <option value="employee">Employee</option>
        <option value="owner">Owner</option>
      </select>
    )},
    { header: "Mode", cell: (row) => (
      <select 
        value={row.attendance_mode} 
        onChange={(e) => updateUserConfig(row.id, 'attendance_mode', e.target.value)}
        className="text-xs border rounded p-1"
      >
        <option value="strict">Strict</option>
        <option value="flexible">Flexible</option>
      </select>
    )},
    { header: "Location (Lat,Lng)", cell: (row) => (
      <div className="flex gap-1">
        <input 
          placeholder="Lat" 
          defaultValue={row.assigned_lat} 
          onBlur={(e) => updateUserConfig(row.id, 'assigned_lat', parseFloat(e.target.value))}
          className="w-12 text-[10px] border p-1"
        />
        <input 
          placeholder="Lng" 
          defaultValue={row.assigned_lng} 
          onBlur={(e) => updateUserConfig(row.id, 'assigned_lng', parseFloat(e.target.value))}
          className="w-12 text-[10px] border p-1"
        />
      </div>
    )}
  ]

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
    <div className="space-y-6 p-4">
      <div className="flex gap-4 border-b border-gray-200 mb-4">
        {['dashboard', 'users', 'live'].map(t => (
          <button 
            key={t}
            onClick={() => setActiveTab(t)}
            className={`pb-2 px-2 text-sm font-bold capitalize transition-all ${activeTab === t ? "border-b-2 border-navy text-navy" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-navy mb-4">User Access Control</h2>
          <DataTable columns={userColumns} data={users} />
        </div>
      )}

      {activeTab === 'live' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-navy mb-4">Field Executive Live Tracking</h2>
          <div className="space-y-3">
            {monitoring.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-xs">
                <span className="font-bold text-navy">{m.profiles?.full_name}</span>
                <span className="text-gray-400">{new Date(m.recorded_at).toLocaleTimeString()}</span>
                <a 
                  href={`https://www.google.com/maps?q=${m.lat},${m.lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-gold text-white px-2 py-1 rounded"
                >
                  View Map
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard title="Total Users" value={users.length} />
            <StatCard title="Pending Approvals" value="0" accent="gold" />
            <StatCard title="AMC Alerts" value="0" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 font-medium text-gray-700">Attendance (Last 5 Days)</div>
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
            <div className="rounded-lg border bg-white p-4 shadow-sm">
              <div className="mb-4 font-medium text-gray-700">Sales (Booked vs Paid)</div>
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
      )}
    </div>
  )
}
