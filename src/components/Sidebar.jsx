import React from "react"
import { NavLink } from "react-router-dom"
import { Globe } from "lucide-react"

function Logo() {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 border-b border-gray-100 bg-gray-50/50">
      <img 
        src="https://bprlpwlbwcgxqajskmxx.supabase.co/storage/v1/object/public/assets/vtc-logo.png" 
        alt="VTC Lifts" 
        className="h-16 w-auto object-contain drop-shadow-sm"
        onError={(e) => e.target.src = "https://placehold.co/150?text=VTC+Lifts"}
      />
      <div className="text-center">
        <div className="text-navy font-bold text-xs leading-tight tracking-tight">VTC Lifts & Escalators Pvt Ltd</div>
        <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1">Value to Customer</div>
        <a 
          href="https://vtclifts.co.in" 
          target="_blank" 
          rel="noreferrer"
          className="text-[9px] text-gold flex items-center justify-center gap-1 hover:underline mt-2 font-medium"
        >
          <Globe size={10} /> vtclifts.co.in
        </a>
      </div>
    </div>
  )
}

const links = [
  { to: "/dashboard", label: "Dashboard", roles: ['admin', 'manager', 'hr', 'sales', 'service', 'store', 'employee', 'owner'] },
  { to: "/admin", label: "User Management", roles: ['admin', 'owner'] },
  { to: "/sales-leads", label: "Sales & Leads", roles: ['admin', 'manager', 'sales', 'owner'] },
  { to: "/amc", label: "AMC & Services", roles: ['admin', 'manager', 'service', 'owner'] },
  { to: "/sales-workflow", label: "Sales Workflow", roles: ['admin', 'sales', 'owner'] },
  { to: "/payroll", label: "Payroll", roles: ['admin', 'hr', 'owner'] },
  { to: "/store", label: "Store & Inventory", roles: ['admin', 'store', 'owner'] },
  { to: "/attendance", label: "My Attendance", roles: ['employee', 'sales', 'service', 'manager', 'hr', 'admin', 'owner'] }
]

export default function Sidebar({ onClose }) {
  const [profile, setProfile] = React.useState(null)

  React.useEffect(() => {
    fetchProfile()
  }, [])

  async function fetchProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      setProfile(data)
    }
  }

  const filteredLinks = links.filter(link => 
    !profile || link.roles.includes(profile.role)
  )

  return (
    <aside className="w-64 h-full bg-white border-r border-gray-200 flex flex-col shadow-xl lg:shadow-none">
      <Logo />
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredLinks.map(l => (
          <NavLink
            key={l.to}
            to={l.to}
            onClick={() => onClose && onClose()}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive 
                ? "bg-navy text-white shadow-md transform scale-[1.02]" 
                : "text-gray-600 hover:bg-gray-50 hover:text-navy"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      
      {/* Sidebar Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50/30">
        <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
          VTC ERP v1.0
        </div>
      </div>
    </aside>
  )
}
