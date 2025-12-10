import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.scss";

function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const loginAdmin = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/login`,
        {
          email,
          password,
        }
      );

      alert("Admin Login Successful!");

      // Save admin token
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("role", res.data.admin.role);


      // Check admin role
      if (res.data.admin.role === "admin") {
        navigate("/admin/dashboard"); // redirect to admin dashboard
      } else {
        alert("You are not an admin!");
      }

      console.log(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="admin-login">
      <div className="admin-login-box">
        <h2>Admin Login</h2>

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

        <button onClick={loginAdmin}>Login</button>
      </div>
    </div>
  );
}

export default AdminLogin;
