const ServerOverview = ({ serverName, cpuUsage, memoryUsage, diskUsage, uptime, dataSource }) => {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">{serverName}</h3>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-sm text-gray-600">CPU Usage:</p>
          <p className="text-md font-medium">{cpuUsage}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Memory Usage:</p>
          <p className="text-md font-medium">{memoryUsage}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Disk Usage:</p>
          <p className="text-md font-medium">{diskUsage}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Uptime:</p>
          <p className="text-md font-medium">{uptime}</p>
        </div>
      </div>
    </div>
  )
}

export default ServerOverview

