import DataTable from "../components/DataTable.jsx"

export default function Manager() {
  const columns = [
    { header: "Employee", accessor: "employee" },
    { header: "Date", accessor: "date" },
    { header: "Status", accessor: "status" }
  ]
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-navy">Manager Dashboard</h1>
      <DataTable columns={columns} data={[]} />
    </div>
  )
}
