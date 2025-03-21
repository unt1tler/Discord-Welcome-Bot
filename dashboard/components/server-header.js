const ServerHeader = () => {
  return (
    <div className="bg-gray-100 py-4 px-6 rounded-md shadow-md">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Server Status</h2>
        {/* Add any other server status information here */}
      </div>
      <div className="mt-4">
        {/* Server details or metrics can be displayed here */}
        <p className="text-gray-600">This is a placeholder for server status information.</p>
      </div>
    </div>
  )
}

export default ServerHeader

