import React, { useState } from "react";
import axios from "axios";
import "./Register.scss";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const registerUser = async () => {
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/register`,
        {
          name,
          email,
          password,
        }
      );

      alert("Registration Successful!");
      console.log(res.data);
    } catch (err) {
      alert(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="register">
      <div className="register-box">
        <h2>Create Account</h2>

        <input
          type="text"
          placeholder="Full Name"
          onChange={(e) => setName(e.target.value)}
        />

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

        <button onClick={registerUser}>Register</button>
      </div>
    </div>
  );
}

export default Register;
