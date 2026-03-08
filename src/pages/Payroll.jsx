import React, { useState, useEffect } from "react"
import jsPDF from "jspdf"
import { supabase } from "../lib/supabaseClient.js"

export default function Payroll() {
  const [summary, setSummary] = useState({ 
    approvedDays: 0, 
    lateMarks: 0, 
    deductionsDays: 0,
    baseSalary: 15000,
    netPayable: 0,
    loading: false
  })
  const [userProfile, setUserProfile] = useState(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  async function fetchUserData() {
    if (!supabase) return
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setUserProfile(profile)
      if (profile?.base_salary) {
        setSummary(prev => ({ ...prev, baseSalary: profile.base_salary }))
      }
    }
  }

  async function calculatePayroll() {
    setSummary(prev => ({ ...prev, loading: true }))
    let approved = 0
    let late = 0
    
    if (supabase && userProfile) {
      const { data: attendance } = await supabase
        .from("attendance")
        .select("is_late, status")
        .eq('user_id', userProfile.id)
      
      const rows = attendance ?? []
      approved = rows.filter(r => r.status === "approved").length
      late = rows.filter(r => r.is_late).length
    }

    // Rule: Every 3 late marks = 0.5 day salary deduction
    const deductionsDays = Math.floor(late / 3) * 0.5
    const perDaySalary = summary.baseSalary / 30
    const deductionAmount = deductionsDays * perDaySalary
    const netPayable = summary.baseSalary - deductionAmount

    setSummary(prev => ({ 
      ...prev, 
      approvedDays: approved, 
      lateMarks: late, 
      deductionsDays,
      netPayable: netPayable.toFixed(2),
      loading: false
    }))
  }

  async function generateAndSaveSlip() {
    if (summary.netPayable <= 0) {
      alert("Please calculate payroll first!")
      return
    }

    const doc = new jsPDF()
    const monthYear = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
    
    // Branded Header
    doc.setFontSize(20)
    doc.setTextColor(0, 0, 128) // Navy
    doc.text("VTC Lifts & Escalators Pvt Ltd", 105, 20, { align: 'center' })
    doc.setFontSize(10)
    doc.setTextColor(212, 175, 55) // Gold
    doc.text("VALUE TO CUSTOMER", 105, 28, { align: 'center' })
    
    doc.setDrawColor(0, 0, 128)
    doc.line(20, 35, 190, 35)

    doc.setFontSize(14)
    doc.setTextColor(0, 0, 0)
    doc.text(`Salary Slip - ${monthYear}`, 105, 45, { align: 'center' })

    // Details Table
    doc.setFontSize(11)
    doc.text(`Employee: ${userProfile?.full_name || 'N/A'}`, 20, 60)
    doc.text(`Role: ${userProfile?.role || 'N/A'}`, 20, 68)
    
    doc.rect(20, 75, 170, 60)
    doc.text("Description", 25, 82)
    doc.text("Value", 150, 82)
    doc.line(20, 85, 190, 85)

    doc.text("Base Salary", 25, 95)
    doc.text(`Rs. ${summary.baseSalary}`, 150, 95)
    
    doc.text("Approved Days", 25, 105)
    doc.text(`${summary.approvedDays}`, 150, 105)

    doc.text("Late Marks", 25, 115)
    doc.text(`${summary.lateMarks}`, 150, 115)

    doc.setTextColor(255, 0, 0)
    doc.text(`Deductions (${summary.deductionsDays} days)`, 25, 125)
    doc.text(`- Rs. ${(summary.baseSalary - summary.netPayable).toFixed(2)}`, 150, 125)

    doc.setTextColor(0, 128, 0)
    doc.setFontSize(12)
    doc.text("Net Payable", 25, 145)
    doc.text(`Rs. ${summary.netPayable}`, 150, 145)

    // Save to Supabase History
    if (supabase && userProfile) {
      await supabase.from('salary_slips').insert({
        user_id: userProfile.id,
        month_year: monthYear,
        basic_salary: summary.baseSalary,
        deductions: (summary.baseSalary - summary.netPayable),
        net_payable: summary.netPayable
      })
    }

    doc.save(`Salary_Slip_${userProfile?.full_name}_${monthYear}.pdf`)
  }

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold text-navy border-b pb-2">HR & Payroll Management</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Employee Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg text-sm space-y-2">
              <p><span className="text-gray-500">Name:</span> {userProfile?.full_name || 'Loading...'}</p>
              <p><span className="text-gray-500">Base Salary:</span> Rs. {summary.baseSalary}</p>
              <p><span className="text-gray-500">Dept:</span> {userProfile?.department || 'N/A'}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700">Actions</h3>
            <div className="flex flex-col gap-3">
              <button 
                onClick={calculatePayroll} 
                disabled={summary.loading}
                className="w-full bg-navy text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-900 transition-all disabled:opacity-50"
              >
                {summary.loading ? "Calculating..." : "Fetch & Calculate Attendance"}
              </button>
              <button 
                onClick={generateAndSaveSlip}
                disabled={summary.netPayable <= 0}
                className="w-full bg-gold text-white px-4 py-2 rounded-lg font-medium hover:bg-yellow-600 transition-all disabled:opacity-50"
              >
                Generate & Save Salary Slip
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 border-t pt-6">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-600 uppercase font-bold">Approved Days</p>
            <p className="text-xl font-bold text-navy">{summary.approvedDays}</p>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <p className="text-xs text-yellow-600 uppercase font-bold">Late Marks</p>
            <p className="text-xl font-bold text-navy">{summary.lateMarks}</p>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <p className="text-xs text-red-600 uppercase font-bold">Deductions</p>
            <p className="text-xl font-bold text-red-600">{summary.deductionsDays} Days</p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-600 uppercase font-bold">Net Payable</p>
            <p className="text-xl font-bold text-green-700">Rs. {summary.netPayable}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
