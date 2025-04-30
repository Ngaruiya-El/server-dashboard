import { useEffect, useState, useRef } from "react";
import NairobiLogo from "./assets/nairobi-logo.png";

export default function ServerDashboard() {
  const [servers, setServers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("All");
  const [prevServers, setPrevServers] = useState({});
  const [formError, setFormError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newServer, setNewServer] = useState({ name: "", ip: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [serverToDelete, setServerToDelete] = useState(null);
  const notificationPermissionRef = useRef(null);

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        notificationPermissionRef.current = permission;
      });
    }
  }, []);

  // Fetch server status
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.REACT_APP_API_URL || "/api/status";
        console.log("Fetching from:", `${apiUrl}/api/status`);
        const res = await fetch(`${apiUrl}/api/status`);
        if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
        const data = await res.json();
        console.log("API response:", data);

        if ("Notification" in window && notificationPermissionRef.current === "granted") {
          Object.entries(data).forEach(([name, current]) => {
            const prev = prevServers[name];
            if (prev && prev.status === "Online" && current.status === "Offline") {
              new Notification(`${name} is Offline`, {
                body: `Server ${name} (${current.ip}) went offline at ${new Date().toLocaleString()}.`,
                icon: NairobiLogo,
              });
            }
          });
        }

        setPrevServers(servers);
        setServers(data);
        setError(null);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to fetch server status. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [servers]);

  // Client-side validation for add server
  const isValidName = newServer.name.trim() && !Object.keys(servers).includes(newServer.name.trim());
  const isValidIp = newServer.ip && /^(?:\d{1,3}\.){3}\d{1,3}$|^[a-zA-Z0-9.-]+$/.test(newServer.ip);
  const isFormValid = isValidName && isValidIp;

  // Handle add server
  const handleAddServer = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSuccess(null);

    if (!isFormValid) {
      setFormError("Please provide a valid, unique server name and IP/hostname");
      return;
    }

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "";
      const res = await fetch(`${apiUrl}/api/add-server`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newServer),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      setSuccess("Server added successfully");
      setTimeout(() => setSuccess(null), 3000);
      setNewServer({ name: "", ip: "" });
      setIsModalOpen(false);
      const statusRes = await fetch(`${apiUrl}/api/status`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setServers(data);
      }
    } catch (err) {
      setFormError(err.message || "Failed to add server");
    }
  };

  // Handle remove server
  const handleRemoveServer = async () => {
    setSuccess(null);
    setError(null);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || "";
      const res = await fetch(`${apiUrl}/api/remove-server`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: serverToDelete }),
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error);
      }

      setSuccess(`Server "${serverToDelete}" removed successfully`);
      setTimeout(() => setSuccess(null), 3000);
      setIsDeleteModalOpen(false);
      setServerToDelete(null);
      const statusRes = await fetch(`${apiUrl}/api/status`);
      if (statusRes.ok) {
        const data = await statusRes.json();
        setServers(data);
      }
    } catch (err) {
      setError(err.message || "Failed to remove server");
    }
  };

  // Filter servers
  const filteredServers = Object.entries(servers).filter(([_, data]) => {
    if (filter === "All") return true;
    return data.status === filter;
  });

  return (
    <div className="min-h-screen bg-nairobi-light-gray text-nairobi-dark-gray flex flex-col">
      {/* Header */}
      <header className="bg-nairobi-dark text-white sticky top-0 z-10 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={NairobiLogo}
              alt="Nairobi City County Logo"
              className="h-8 w-auto"
            />
            <h2 className="text-2xl semi-bold">NCCG Servers Status</h2>
          </div>
          <nav>
            <a
              href="https://mail.nairobi.go.ke/owa/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-nairobi-orange hover:text-nairobi-green transition-colors"
            >
              Check Email
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-800 bg-opacity-50 rounded-lg text-red-200 text-center">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-nairobi-green bg-opacity-50 rounded-lg text-nairobi-green text-center">
            {success}
          </div>
        )}

        {/* Add Server Button */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setIsModalOpen(true)}
            className="p-2 bg-nairobi-green text-white rounded-lg hover:bg-nairobi-dark transition-colors"
          >
            Add New Server
          </button>
        </div>

        {/* Add Server Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
              <h2 className="text-lg font-semibold text-nairobi-dark-gray mb-4">
                Add New Server
              </h2>
              <form onSubmit={handleAddServer} className="flex flex-col gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Server Name"
                    value={newServer.name}
                    onChange={(e) => setNewServer({ ...newServer, name: e.target.value })}
                    className={`p-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                      newServer.name && !isValidName
                        ? "border-red-500 focus:ring-red-500"
                        : "border-nairobi-light-green focus:ring-nairobi-green"
                    }`}
                    required
                  />
                  {newServer.name && !isValidName && (
                    <p className="text-sm text-red-500 mt-1">
                      Name must be unique
                    </p>
                  )}
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="IP or Hostname"
                    value={newServer.ip}
                    onChange={(e) => setNewServer({ ...newServer, ip: e.target.value })}
                    className={`p-2 border rounded-lg w-full focus:outline-none focus:ring-2 ${
                      newServer.ip && !isValidIp
                        ? "border-red-500 focus:ring-red-500"
                        : "border-nairobi-light-green focus:ring-nairobi-green"
                    }`}
                    required
                  />
                  {newServer.ip && !isValidIp && (
                    <p className="text-sm text-red-500 mt-1">
                      Invalid IP or hostname
                    </p>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`p-2 rounded-lg text-white flex-1 ${
                      isFormValid
                        ? "bg-nairobi-green hover:bg-nairobi-dark"
                        : "bg-gray-400 cursor-not-allowed"
                    } transition-colors`}
                  >
                    Add Server
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setNewServer({ name: "", ip: "" });
                      setFormError(null);
                    }}
                    className="p-2 bg-red-500 text-white rounded-lg flex-1 hover:bg-red-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {formError && (
                <div className="mt-4 p-2 bg-red-800 bg-opacity-50 rounded-lg text-red-200 text-center">
                  {formError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-md">
              <h2 className="text-lg font-semibold text-nairobi-dark-gray mb-4">
                Confirm Deletion
              </h2>
              <p className="text-nairobi-dark-gray mb-4">
                Are you sure you want to remove the server "{serverToDelete}"?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={handleRemoveServer}
                  className="p-2 border border-nairobi-green text-nairobi-green bg-transparent rounded-lg flex-1 hover:bg-nairobi-light-green hover:text-nairobi-dark transition-colors"
                >
                  Remove
                </button>
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setServerToDelete(null);
                  }}
                  className="p-2 bg-nairobi-dark text-white rounded-lg flex-1 hover:bg-nairobi-dark-gray transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filter Dropdown */}
        <div className="mb-6 flex items-center justify-end">
          <label htmlFor="status-filter" className="mr-2 text-nairobi-dark-gray font-medium">
            Filter by Status:
          </label>
          <select
            id="status-filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="p-2 border border-nairobi-light-green rounded-lg bg-white text-nairobi-dark-gray focus:outline-none focus:ring-2 focus:ring-nairobi-green"
          >
            <option value="All">All</option>
            <option value="Online">Online</option>
            <option value="Offline">Offline</option>
          </select>
        </div>

        {isLoading && Object.keys(servers).length === 0 ? (
          <div className="p-6 text-center text-nairobi-dark-gray">
            <svg
              className="animate-spin h-8 w-8 mx-auto mb-4 text-nairobi-green"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            Loading server status...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredServers.map(([name, data]) => (
              <div
                key={name}
                className="bg-white shadow-md rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <h2 className="text-lg font-semibold text-nairobi-dark-gray mb-2">
                  {name}
                </h2>
                <p className="text-sm text-nairobi-dark-gray mb-2">
                  <span className="font-medium">IP/Hostname:</span> {data.ip}
                </p>
                <p className="text-sm mb-2">
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      data.status === "Online"
                        ? "bg-nairobi-green bg-opacity-20 text-nairobi-green"
                        : "bg-red-500 bg-opacity-20 text-red-500"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full mr-2 ${
                        data.status === "Online" ? "bg-nairobi-green" : "bg-red-500"
                      }`}
                    ></span>
                    {data.status}
                  </span>
                </p>
                <p className="text-sm text-nairobi-dark-gray mb-4">
                  <span className="font-medium">Last Checked:</span>{" "}
                  {new Date(data.last_checked).toLocaleString()}
                </p>
                <button
                  onClick={() => {
                    setServerToDelete(name);
                    setIsDeleteModalOpen(true);
                  }}
                  className="w-full p-2 border border-nairobi-green text-nairobi-green bg-transparent rounded-lg hover:bg-nairobi-light-green hover:text-nairobi-dark transition-colors"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        {filteredServers.length === 0 && !isLoading && !error && (
          <div className="mt-6 p-4 bg-white rounded-lg text-nairobi-dark-gray text-center">
            No {filter.toLowerCase()} servers found.
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-nairobi-dark text-white py-4 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <p>Smart Nairobi - 2025</p>
        </div>
      </footer>
    </div>
  );
}