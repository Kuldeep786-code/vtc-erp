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
import SalesLeads from "./pages/SalesLeads.jsx"
import AMCManagement from "./pages/AMCManagement.jsx"

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/manager" element={<Manager />} />
        <Route path="/sales-leads" element={<SalesLeads />} />
        <Route path="/amc" element={<AMCManagement />} />
        <Route path="/sales-workflow" element={<SalesWorkflow />} />
        <Route path="/attendance" element={<AttendanceStrict />} />
        <Route path="/payroll" element={<Payroll />} />
        <Route path="/store" element={<Store />} />
        <Route path="/service" element={<Service />} />
        <Route path="/hr" element={<HR />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}