import React, { useState, useEffect } from "react"
import DataTable from "../components/DataTable.jsx"
import { supabase } from "../lib/supabaseClient.js"

export default function SalesWorkflow() {
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchLeads()
  }, [])

  async function fetchLeads() {
    if (!supabase) return
    const { data } = await supabase
      .from('sales_leads')
      .select('*')
      .order('created_at', { ascending: false })
    setLeads(data || [])
  }

  async function addNewLead() {
    const name = prompt("Enter Customer Name:")
    const amount = prompt("Enter Contract Amount:")
    if (!name || !amount) return

    if (supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      await supabase.from('sales_leads').insert({
        customer_name: name,
        amount: parseFloat(amount),
        status: 'new',
        booked_by: user?.id
      })
      fetchLeads()
    }
  }

  async function updateStatus(id, newStatus) {
    if (supabase) {
      await supabase
        .from('sales_leads')
        .update({ status: newStatus, accounts_verified: newStatus === 'paid' })
        .eq('id', id)
      fetchLeads()
    }
  }

  const columns = [
    { header: "Customer", accessor: "customer_name" },
    { header: "Amount", cell: (row) => `Rs. ${row.amount}` },
    { header: "Status", cell: (row) => (
      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
        row.status === 'paid' ? 'bg-green-100 text-green-700' : 
        row.status === 'booked' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
      }`}>
        {row.status.toUpperCase()}
      </span>
    )},
    { header: "Actions", cell: (row) => (
      <div className="flex gap-2">
        {row.status === 'new' && (
          <button onClick={() => updateStatus(row.id, 'booked')} className="text-xs bg-navy text-white px-2 py-1 rounded">Book</button>
        )}
        {row.status === 'booked' && (
          <button onClick={() => updateStatus(row.id, 'paid')} className="text-xs bg-gold text-white px-2 py-1 rounded">Verify Payment</button>
        )}
      </div>
    )}
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-navy">Sales Pipeline</h1>
        <button onClick={addNewLead} className="bg-navy text-white px-4 py-2 rounded-lg hover:bg-blue-900 transition-all">
          + Add New Lead
        </button>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
        <DataTable columns={columns} data={leads} />
      </div>
    </div>
  )
}
