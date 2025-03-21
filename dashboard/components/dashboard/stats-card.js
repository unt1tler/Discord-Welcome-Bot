function StatsCard({ title, value, description, icon, color }) {
  return (
    <div className="bg-white shadow rounded-lg p-4 flex items-center space-x-4">
      <div className={`p-3 rounded-full bg-${color}-100`}>{icon}</div>
      <div>
        <p className="text-gray-500 font-medium">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-gray-400">{description}</p>
      </div>
    </div>
  )
}

export default StatsCard

