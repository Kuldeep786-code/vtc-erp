import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabaseClient.js"
import { useState } from "react"

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function signIn(e) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      if (!supabase) throw new Error("Database not connected. Check .env file.")

      // 1. Auth Check
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      })
      
      if (authError) throw authError

      // 2. Role Check (Kaunsa dashboard dikhana hai?)
      if (authData?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single()

        // Role ke hisaab se redirect
        if (profile?.role === 'admin') navigate("/admin", { replace: true })
        else if (profile?.role === 'manager') navigate("/manager", { replace: true })
        else navigate("/dashboard", { replace: true })
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen grid place-items-center bg-cover bg-center bg-no-repeat relative"
      style={{ backgroundImage: 'url("https://bprlpwlbwcgxqajskmxx.supabase.co/storage/v1/object/public/assets/elevator-bg.jpg")' }}
    >
      {/* Overlay to make text readable */}
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm"></div>

      <div className="w-full max-w-sm rounded-2xl border border-white/20 bg-white/90 backdrop-blur-md p-8 shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <img 
            src="https://bprlpwlbwcgxqajskmxx.supabase.co/storage/v1/object/public/assets/vtc-logo.png" 
            alt="VTC Lifts" 
            className="h-20 mx-auto mb-4"
          />
          <h1 className="text-2xl font-black text-navy tracking-tight">VTC ERP SYSTEM</h1>
          <p className="text-gray-600 text-xs font-medium uppercase tracking-widest mt-1">Value to Customer</p>
        </div>
        
        <form onSubmit={signIn} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-navy focus:outline-none" 
              placeholder="admin@vtclifts.com" 
              type="email"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-navy focus:outline-none" 
              placeholder="••••••••" 
              type="password"
              required
            />
          </div>

          <button 
            disabled={loading}
            className="w-full rounded-md bg-navy text-white px-3 py-2 font-semibold hover:bg-blue-900 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
          
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 rounded border border-red-200 text-center">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}