import React from "react"
import { Routes, Route, Navigate } from "react-router-dom"
import Layout from "./components/Layout.jsx"

// Pages Import
import Admin from "./pages/Admin.jsx"
import Manager from "./pages/Manager.jsx"
import Dashboard from "./pages/Dashboard.jsx"
import Sales from "./pages/Sales.jsx"
import Accounts from "./pages/Accounts.jsx"
import Store from "./pages/Store.jsx"
import Service from "./pages/Service.jsx"
import HR from "./pages/HR.jsx"
import SalesWorkflow from "./pages/SalesWorkflow.jsx"
import AttendanceStrict from "./pages/AttendanceStrict.jsx"
import Payroll from "./pages/Payroll.jsx"
import Login from "./pages/Login.jsx"

export default function App() {
  return (
    <Routes>
      {/* 1. Login Route (Bina Layout ke) */}
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* 2. Protected Routes (Layout ke andar) */}
      <Route path="/*" element={
        <Layout>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/manager" element={<Manager />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/sales-workflow" element={<SalesWorkflow />} />
            <Route path="/attendance" element={<AttendanceStrict />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/store" element={<Store />} />
            <Route path="/service" element={<Service />} />
            <Route path="/hr" element={<HR />} />
            {/* Agar koi galat URL dale toh Dashboard par bhejo */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Layout>
      } />
    </Routes>
  )
}