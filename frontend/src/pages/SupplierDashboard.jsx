import React from 'react'

export default function SupplierDashboard(){
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Supplier Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">Manage Products (CRUD)</div>
        <div className="card">Inventory Overview</div>
      </div>
    </div>
  )
}
