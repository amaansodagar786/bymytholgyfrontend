import React, { useState } from "react";
import axios from "axios";
import "./Login.scss";
import { useNavigate } from "react-router-dom";  // ← ADD THIS


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const loginUser = async () => {
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/user/login`, {
        email,
        password,
      });

      alert("Login Successful!");
      navigate("/");
      console.log(res.data);

      localStorage.setItem("token", res.data.token);        // JWT for auth
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      alert(err.response.data.message);
    }
  };

  return (
    <div className="login">
      <div className="login-box">
        <h2>User Login</h2>

        <input
          type="email"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={loginUser}>Login</button>
      </div>
    </div>
  );
}

export default Login;
