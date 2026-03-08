import jsPDF from "jspdf"
import { useState } from "react"
import { supabase } from "../lib/supabaseClient.js"

export default function HR() {
  const [summary, setSummary] = useState({ approvedDays: 0, lateMarks: 0, deductionsDays: 0 })

  async function fetchAttendance() {
    let approved = 0
    let late = 0
    if (supabase) {
      const { data } = await supabase.from("attendance").select("is_late,status")
      const rows = data ?? []
      approved = rows.filter(r => r.status === "approved").length
      late = rows.filter(r => r.is_late).length
    }
    const deductions = Math.floor(late / 3) * 0.5
    setSummary({ approvedDays: approved, lateMarks: late, deductionsDays: deductions })
  }

  function generatePDF() {
    const doc = new jsPDF()
    doc.setFontSize(16)
    doc.text("VTC Lifts & Escalators Pvt Ltd", 20, 20)
    doc.setFontSize(11)
    doc.text("VALUE TO CUSTOMER", 20, 28)
    doc.text("Salary Slip", 20, 40)
    doc.text(`Approved Attendance Days: ${summary.approvedDays}`, 20, 52)
    doc.text(`Late Marks: ${summary.lateMarks}`, 20, 60)
    doc.text(`Deduction (days): ${summary.deductionsDays}`, 20, 68)
    doc.save("salary-slip.pdf")
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">HR & Payroll</h1>
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex gap-3">
          <button onClick={fetchAttendance} className="rounded-md bg-navy text-white px-3 py-2">Fetch Attendance</button>
          <button onClick={generatePDF} className="rounded-md bg-gold text-white px-3 py-2">Generate Salary Slip</button>
        </div>
        <div className="mt-4 text-sm text-gray-700">
          <div>Approved Days: {summary.approvedDays}</div>
          <div>Late Marks: {summary.lateMarks}</div>
          <div>Deduction (days): {summary.deductionsDays}</div>
        </div>
      </div>
    </div>
  )
}
