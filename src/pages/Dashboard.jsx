import React, { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient.js"
import StatCard from "../components/StatCard.jsx"
import { UsersIcon, CurrencyRupeeIcon, CalendarIcon, MapPinIcon } from "@heroicons/react/24/outline"

export default function Dashboard() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState({ users: 0, attendance: 0, leads: 0 })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(prof)
      
      // Fetch Global Stats for Admin
      if (prof.role === 'admin' || prof.role === 'owner') {
        const { count: uCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
        const { count: aCount } = await supabase.from('attendance').select('*', { count: 'exact', head: true })
        const { count: lCount } = await supabase.from('sales_leads').select('*', { count: 'exact', head: true })
        setStats({ users: uCount || 0, attendance: aCount || 0, leads: lCount || 0 })
      }
    }
  }

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-navy uppercase tracking-tighter">Enterprise Resource Planning</h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">VTC Lifts & Escalators Pvt Ltd | Welcome, {profile?.full_name}</p>
        </div>
        <div className="bg-navy text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">
          Role: {profile?.role}
        </div>
      </header>

      {/* SAP Style Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Workforce" value={stats.users} icon={<UsersIcon className="w-6 h-6"/>} color="bg-blue-600" />
        <StatCard title="Today's Presence" value={stats.attendance} icon={<MapPinIcon className="w-6 h-6"/>} color="bg-green-600" />
        <StatCard title="Sales Pipeline" value={stats.leads} icon={<CurrencyRupeeIcon className="w-6 h-6"/>} color="bg-gold" />
        <StatCard title="AMC Contracts" value="Active" icon={<CalendarIcon className="w-6 h-6"/>} color="bg-purple-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Role Specific Actions */}
        <div className="bg-white p-6 rounded-3xl border-2 border-gray-100 shadow-xl">
          <h3 className="font-black text-navy uppercase text-sm mb-4 tracking-widest">Quick Operations</h3>
          <div className="grid grid-cols-2 gap-4">
            {profile?.role === 'admin' && (
              <button className="bg-gray-50 hover:bg-navy hover:text-white p-4 rounded-2xl border-2 border-gray-100 transition-all font-bold text-xs text-left">
                Generate Monthly Payroll
              </button>
            )}
            {(profile?.role === 'sales' || profile?.role === 'admin') && (
              <button className="bg-gray-50 hover:bg-gold hover:text-white p-4 rounded-2xl border-2 border-gray-100 transition-all font-bold text-xs text-left">
                New Sales Quotation
              </button>
            )}
            <button className="bg-gray-50 hover:bg-green-600 hover:text-white p-4 rounded-2xl border-2 border-gray-100 transition-all font-bold text-xs text-left">
              View Personal Profile
            </button>
          </div>
        </div>

        {/* System Health / Logs */}
        <div className="bg-navy p-6 rounded-3xl shadow-2xl text-white">
          <h3 className="font-black uppercase text-sm mb-4 tracking-widest opacity-50">Real-time System Logs</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Database Connection: STABLE
            </div>
            <div className="flex items-center gap-3 text-[10px] font-bold">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Biometric Selfie API: ONLINE
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
