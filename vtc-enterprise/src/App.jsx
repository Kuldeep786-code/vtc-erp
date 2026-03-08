import { Routes, Route, Navigate } from "react-router-dom"
import Login from "./pages/Login.jsx"
import AdminDashboard from "./pages/AdminDashboard.jsx"
import EmployeeDashboard from "./pages/EmployeeDashboard.jsx"
import AMCManager from "./pages/AMCManager.jsx"
import SalesDashboard from "./pages/SalesDashboard.jsx"

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/dashboard" element={<EmployeeDashboard />} />
      <Route path="/amc" element={<AMCManager />} />
      <Route path="/sales" element={<SalesDashboard />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
