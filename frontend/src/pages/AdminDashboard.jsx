import React from 'react'

export default function AdminDashboard(){
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">Manage Users</div>
        <div className="card">Manage Products & Categories</div>
      </div>
    </div>
  )
}
