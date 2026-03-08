import React from "react"
import { NavLink } from "react-router-dom"
import { Globe } from "lucide-react"

function Logo() {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-6 border-b border-gray-100">
      <img 
        src="https://bprlpwlbwcgxqajskmxx.supabase.co/storage/v1/object/public/assets/vtc-logo.png" 
        alt="VTC Lifts" 
        className="h-16 w-auto object-contain"
        onError={(e) => e.target.src = "https://via.placeholder.com/150?text=VTC+Lifts"}
      />
      <div className="text-center">
        <div className="text-navy font-bold text-sm leading-tight">VTC Lifts & Escalators</div>
        <a 
          href="https://vtclifts.co.in" 
          target="_blank" 
          rel="noreferrer"
          className="text-[10px] text-gold flex items-center justify-center gap-1 hover:underline"
        >
          <Globe size={10} /> vtclifts.co.in
        </a>
      </div>
    </div>
  )
}

const links = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/admin", label: "Admin" },
  { to: "/manager", label: "Manager" },
  { to: "/sales", label: "Sales" },
  { to: "/accounts", label: "Accounts" },
  { to: "/sales-workflow", label: "Sales Workflow" },
  { to: "/attendance", label: "Attendance" },
  { to: "/payroll", label: "Payroll" },
  { to: "/store", label: "Store" },
  { to: "/service", label: "Service" },
  { to: "/hr", label: "HR" }
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <Logo />
      <nav className="px-2 space-y-1">
        {links.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            className={({ isActive }) =>
              `block px-3 py-2 rounded-md text-sm ${isActive ? "bg-navy text-white" : "text-gray-700 hover:bg-gray-100"}`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
