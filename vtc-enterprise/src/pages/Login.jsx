export default function Login() {
  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="w-full max-w-sm rounded-lg border border-gray-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-navy">Login</h1>
        <form className="mt-4 space-y-3">
          <input className="w-full border rounded-md px-3 py-2" placeholder="Email" />
          <input className="w-full border rounded-md px-3 py-2" placeholder="Password" type="password" />
          <button className="w-full rounded-md bg-navy text-white px-3 py-2">Sign In</button>
        </form>
      </div>
    </div>
  )
}
