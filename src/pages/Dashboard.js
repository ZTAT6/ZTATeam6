import React, { useEffect, useState } from "react";

function Dashboard() {
  const [data, setData] = useState("");
  const [logs, setLogs] = useState([]);
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) {
      window.location.href = "/";
      return;
    }

    fetch("http://localhost:5000/dashboard", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((data) => setData(data.message));

    fetch("http://localhost:5000/activity", {
      headers: { Authorization: token },
    })
      .then((res) => res.json())
      .then((logData) => setLogs(logData));
  }, [token]);

  return (
    <div className="dashboard">
      <h2>Dashboard</h2>
      <p>{data}</p>
      <h4>Role: {role}</h4>

      {role === "admin" && <p>🔧 Admin panel active</p>}
      {role === "teacher" && <p>📚 Teacher dashboard</p>}
      {role === "student" && <p>🎓 Student dashboard</p>}

      <h3>Recent Activity</h3>
      <ul>
        {logs.map((log, i) => (
          <li key={i}>
            {new Date(log.timestamp).toLocaleString()} — {log.action}
          </li>
        ))}
      </ul>

      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = "/";
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
