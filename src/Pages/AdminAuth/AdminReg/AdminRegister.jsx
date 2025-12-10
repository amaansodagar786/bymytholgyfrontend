import React, { useState } from "react";
import axios from "axios";
import "./AdminRegister.scss";

function AdminRegister() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerAdmin = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/admin/register`, {
        name,
        email,
        password,
      });

      alert("Admin Registered Successfully!");
      console.log(res.data);
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="admin-register">
      <div className="admin-register-box">
        <h2>Create Admin Account</h2>

        <input
          type="text"
          placeholder="Admin Name"
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
          placeholder="Admin Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={registerAdmin}>Register</button>
      </div>
    </div>
  );
}

export default AdminRegister;
