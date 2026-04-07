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
  const [managers, setManagers] = useState([])
  const [monitoring, setMonitoring] = useState([])
  const [newUser, setNewUser] = useState({ email: '', password: '', role: 'employee', full_name: '' })
  const [showAddUser, setShowAddUser] = useState(false)
  const [status, setStatus] = useState('')
  const [myProfile, setMyProfile] = useState(null)

  const [attendanceLogs, setAttendanceLogs] = useState([])

  useEffect(() => {
    fetchMyProfile()
    if (activeTab === 'users') {
      fetchUsers()
      fetchManagers()
    }
    if (activeTab === 'live') {
      fetchLocationHistory()
    }
    if (activeTab === 'attendance') {
      fetchAttendanceLogs()
    }
  }, [activeTab])

  async function fetchAttendanceLogs() {
    if (!supabase) return
    const { data, error } = await supabase.from('attendance').select('*, profiles(full_name)').order('check_in_time', { ascending: false })
    if (error) {
      console.error("Error fetching attendance logs:", error)
    } else {
      setAttendanceLogs(data || [])
    }
  }

  async function approveAttendance(id, status) {
    if (!supabase) return
    await supabase.from('attendance').update({ approval_status: status }).eq('id', id)
    fetchAttendanceLogs()
  }

  async function fetchMyProfile() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setMyProfile(data)
    }
  }

  async function fetchManagers() {
    if (!supabase) return
    const { data } = await supabase.from('profiles').select('id, full_name').eq('role', 'manager')
    setManagers(data || [])
  }

  async function handleAddUser(e) {
    e.preventDefault()
    if (!supabase) return
    setStatus('Adding user...')

    // 1. Create user in auth
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email: newUser.email,
      password: newUser.password,
    })

    if (signUpError) {
      setStatus(`Error: ${signUpError.message}`)
      return
    }

    // 2. Add profile entry
    if (user) {
      const { error: profileError } = await supabase.from('profiles').update({
        full_name: newUser.full_name,
        role: newUser.role
      }).eq('id', user.id)

      if (profileError) {
        setStatus(`Error creating profile: ${profileError.message}`)
      } else {
        setStatus('User added successfully!')
        setNewUser({ email: '', password: '', role: 'employee', full_name: '' })
        setShowAddUser(false)
        fetchUsers() // Refresh list
      }
    } else {
        setStatus('Error: User created but profile could not be linked.')
    }
  }

  async function fetchUsers() {
    if (!supabase) return
    try {
      const { data, error } = await supabase.from('profiles').select('*')
      if (error) throw error
      setUsers(data || [])
    } catch (err) {
      console.error('Error fetching users:', err.message)
      setStatus("Error loading users. Please ensure SQL Master Script is run.")
    }
  }

  async function updateUserConfig(id, field, value) {
    if (!supabase) return
    const { error } = await supabase.from('profiles').update({ [field]: value }).eq('id', id)
    if (error) {
        console.error(`Error updating ${field}:`, error.message)
    } else {
        fetchUsers()
    }
  }

  async function fetchLocationHistory() {
    if (!supabase) return;
    // For now, we just fetch the last 20 logs. Roadmap view will be a separate component.
    const { data, error } = await supabase.from('location_history').select('*, profiles(full_name)').order('recorded_at', { ascending: false }).limit(50);
    if (error) {
      console.error("Error fetching location history:", error);
      setStatus("Could not load location history.");
      setMonitoring([]);
    } else {
      setMonitoring(data || []);
    }
  }



  const userColumns = [
    { header: "Name", accessor: "full_name" },
    { header: "Role", cell: (row) => (
      <select 
        value={row.role} 
        onChange={(e) => updateUserConfig(row.id, 'role', e.target.value)}
        className="text-xs border rounded p-1"
        disabled={myProfile?.role !== 'admin' && myProfile?.role !== 'owner'}
      >
        <option value="admin">Admin</option>
        <option value="manager">Manager</option>
        <option value="hr">HR</option>
        <option value="employee">Employee</option>
        <option value="owner">Owner</option>
        <option value="sales">Sales</option>
        <option value="service">Service</option>
        <option value="store">Store</option>
      </select>
    )},
    { header: "Manager", cell: (row) => (
      <select 
        value={row.reporting_manager_id || ''} 
        onChange={(e) => updateUserConfig(row.id, 'reporting_manager_id', e.target.value || null)}
        className="text-xs border rounded p-1 bg-white"
        disabled={myProfile?.role !== 'admin' && myProfile?.role !== 'owner'}
      >
        <option value="">- None -</option>
        {managers.map(m => (
          <option key={m.id} value={m.id}>{m.full_name}</option>
        ))}
      </select>
    )},
    { header: "Mode", cell: (row) => (
      <select 
        value={row.attendance_mode} 
        onChange={(e) => updateUserConfig(row.id, 'attendance_mode', e.target.value)}
        className="text-xs border rounded p-1"
        disabled={(row.role === 'admin' || row.role === 'hr') && myProfile?.role !== 'owner'}
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
          className="w-16 text-[10px] border p-1 rounded"
          disabled={(row.role === 'admin' || row.role === 'hr') && myProfile?.role !== 'owner'}
        />
        <input 
          placeholder="Lng" 
          defaultValue={row.assigned_lng} 
          onBlur={(e) => updateUserConfig(row.id, 'assigned_lng', parseFloat(e.target.value))}
          className="w-16 text-[10px] border p-1 rounded"
          disabled={(row.role === 'admin' || row.role === 'hr') && myProfile?.role !== 'owner'}
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
        {['dashboard', 'users', 'attendance', 'live'].map(t => (
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
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-navy">User Access Control</h2>
            <button 
              onClick={() => setShowAddUser(!showAddUser)}
              className="bg-navy text-white px-3 py-1 rounded-md text-sm font-semibold"
            >
              {showAddUser ? 'Cancel' : '+ Add User'}
            </button>
          </div>

          {showAddUser && (
            <form onSubmit={handleAddUser} className="bg-gray-50 p-4 rounded-lg mb-4 border space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Full Name" value={newUser.full_name} onChange={e => setNewUser({...newUser, full_name: e.target.value})} className="p-2 border rounded" required />
                <input type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} className="p-2 border rounded" required />
                <input type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} className="p-2 border rounded" required />
                <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})} className="p-2 border rounded bg-white">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                  <option value="sales">Sales</option>
                  <option value="service">Service</option>
                  <option value="store">Store</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                  <button type="submit" className="bg-gold text-white font-bold px-4 py-2 rounded-lg">Save User</button>
                  <p className="text-sm text-gray-600 font-medium">{status}</p>
              </div>
            </form>
          )}

          <DataTable columns={userColumns} data={users} />
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h2 className="text-lg font-bold text-navy mb-4">Attendance Approval</h2>
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-600">
                        <tr>
                            <th className="p-2">Employee</th>
                            <th className="p-2">Check In</th>
                            <th className="p-2">Check Out</th>
                            <th className="p-2">Hours</th>
                            <th className="p-2">Status</th>
                            <th className="p-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {attendanceLogs.map(log => (
                            <tr key={log.id} className="border-b">
                                <td className="p-2 font-semibold">{log.profiles?.full_name}</td>
                                <td className="p-2">{new Date(log.check_in_time).toLocaleString()}</td>
                                <td className="p-2">{log.check_out_time ? new Date(log.check_out_time).toLocaleString() : '-'}</td>
                                <td className="p-2">{log.total_hours || '-'}</td>
                                <td className="p-2 capitalize font-medium"><span className={`px-2 py-1 rounded-full text-xs ${log.approval_status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{log.approval_status}</span></td>
                                <td className="p-2">
                                    {log.approval_status === 'pending' && (
                                        <div className="flex gap-2">
                                            <button onClick={() => approveAttendance(log.id, 'approved')} className="bg-green-500 text-white px-2 py-1 text-xs rounded">Approve</button>
                                            <button onClick={() => approveAttendance(log.id, 'rejected')} className="bg-red-500 text-white px-2 py-1 text-xs rounded">Reject</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'live' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="text-lg font-bold text-navy mb-4">Field Executive Live Tracking</h2>
          <div className="space-y-3">
            {monitoring.length > 0 ? monitoring.map(m => (
              <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg text-xs">
                <span className="font-bold text-navy">{m.profiles?.full_name || 'Unknown User'}</span>
                <span className="text-gray-400">{new Date(m.recorded_at).toLocaleTimeString()}</span>
                <a 
                  href={`https://www.google.com/maps?q=${m.lat},${m.lng}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="bg-gold text-white px-2 py-1 rounded"
                >
                  View on Map
                </a>
              </div>
            )) : <p className="text-center text-gray-500 py-4">No location data recorded yet.</p>}
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