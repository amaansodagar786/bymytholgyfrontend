import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiUser, FiMail, FiLock, FiShield, FiKey } from "react-icons/fi";
import "./AdminAuth.scss";

const AdminAuth = () => {
  const navigate = useNavigate();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Login States
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register States
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);

  // Admin Login Handler
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Please fill all fields", { position: "top-center" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/login`,
        {
          email: loginEmail,
          password: loginPassword,
        }
      );

      toast.success("Admin Login Successful! 🔐", {
        position: "top-center",
        autoClose: 2000,
      });

      // Save admin tokens
      localStorage.setItem("adminToken", res.data.token);
      localStorage.setItem("adminId", res.data.admin._id);
      localStorage.setItem("role", res.data.admin.role);
      localStorage.setItem("admin", JSON.stringify(res.data.admin));

      // Check admin role
      if (res.data.admin.role === "admin") {
        setTimeout(() => {
          navigate("/admin/dashboard");
        }, 1500);
      } else {
        toast.error("You are not authorized as admin!", {
          position: "top-center",
        });
        localStorage.clear();
      }

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Admin login failed",
        { position: "top-center" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Admin Register Handler
  const handleAdminRegister = async (e) => {
    e.preventDefault();
    
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      toast.error("Please fill all fields", { position: "top-center" });
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("Password must be at least 6 characters", {
        position: "top-center",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/admin/register`,
        {
          name: registerName,
          email: registerEmail,
          password: registerPassword,
        }
      );

      toast.success("Admin Account Created! ✅", {
        position: "top-center",
        autoClose: 3000,
      });

      // Clear form
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");

      // Auto switch to login after successful registration
      setTimeout(() => {
        setIsLoginMode(true);
        setLoginEmail(registerEmail);
        setLoginPassword("");
      }, 2000);

    } catch (err) {
      toast.error(
        err.response?.data?.message || "Registration failed",
        { position: "top-center" }
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <div className="admin-auth">
        <div className="admin-auth__container">
          {/* LEFT SIDE - BRANDING & INFO */}
          <div className="admin-auth__left">
            <div className="admin-auth__brand">
              <div className="admin-auth__logo">
                <FiShield className="admin-auth__logo-icon" />
                <span className="admin-auth__logo-text">ADMIN</span>
              </div>
              <h1 className="admin-auth__title">ByMythology</h1>
              <h2 className="admin-auth__subtitle">Admin Control Panel</h2>
              <p className="admin-auth__description">
                Secure access to manage products, orders, users, and content.
                Restricted to authorized personnel only.
              </p>
              <div className="admin-auth__features">
                <div className="admin-auth__feature">
                  <FiKey className="admin-auth__feature-icon" />
                  <span>Secure Authentication</span>
                </div>
                <div className="admin-auth__feature">
                  <FiShield className="admin-auth__feature-icon" />
                  <span>Role-Based Access</span>
                </div>
                <div className="admin-auth__feature">
                  <FiUser className="admin-auth__feature-icon" />
                  <span>Admin Management</span>
                </div>
              </div>
              <div className="admin-auth__warning">
                ⚠️ This panel is restricted to authorized administrators only.
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="admin-auth__right">
            <div className="admin-auth__form-wrapper">
              {/* HEADER WITH MODE SWITCH */}
              <div className="admin-auth__header">
                <div className="admin-auth__mode-switch">
                  <button
                    className={`admin-auth__mode-btn ${isLoginMode ? "admin-auth__mode-btn--active" : ""
                      }`}
                    onClick={() => setIsLoginMode(true)}
                  >
                    Admin Login
                  </button>
                  <button
                    className={`admin-auth__mode-btn ${!isLoginMode ? "admin-auth__mode-btn--active" : ""
                      }`}
                    onClick={() => setIsLoginMode(false)}
                  >
                    Create Admin
                  </button>
                </div>
                <p className="admin-auth__mode-description">
                  {isLoginMode
                    ? "Sign in to access admin dashboard"
                    : "Create new admin account (Restricted)"}
                </p>
              </div>

              {/* LOGIN FORM */}
              {isLoginMode ? (
                <form className="admin-auth__form" onSubmit={handleAdminLogin}>
                  <div className="admin-auth__form-group">
                    <label className="admin-auth__label">
                      <FiMail className="admin-auth__label-icon" />
                      Admin Email
                    </label>
                    <input
                      type="email"
                      className="admin-auth__input"
                      placeholder="admin@ramayanseries.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-auth__form-group">
                    <label className="admin-auth__label">
                      <FiLock className="admin-auth__label-icon" />
                      Password
                    </label>
                    <div className="admin-auth__password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="admin-auth__input"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="admin-auth__password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-auth__submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="admin-auth__spinner"></span>
                        Authenticating...
                      </>
                    ) : (
                      "Login to Dashboard"
                    )}
                  </button>

                  <div className="admin-auth__footer">
                    <p className="admin-auth__note">
                      🔒 Use credentials provided by super admin
                    </p>
                    {/* Comment out this line if you don't want register option visible */}
                    <button
                      type="button"
                      className="admin-auth__switch-link"
                      onClick={() => setIsLoginMode(false)}
                    >
                      Need admin access? Contact super admin
                    </button>
                  </div>
                </form>
              ) : (
                /* REGISTER FORM */
                <form className="admin-auth__form" onSubmit={handleAdminRegister}>
                  <div className="admin-auth__form-group">
                    <label className="admin-auth__label">
                      <FiUser className="admin-auth__label-icon" />
                      Admin Name
                    </label>
                    <input
                      type="text"
                      className="admin-auth__input"
                      placeholder="Full Name"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-auth__form-group">
                    <label className="admin-auth__label">
                      <FiMail className="admin-auth__label-icon" />
                      Admin Email
                    </label>
                    <input
                      type="email"
                      className="admin-auth__input"
                      placeholder="admin@ramayanseries.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="admin-auth__form-group">
                    <label className="admin-auth__label">
                      <FiLock className="admin-auth__label-icon" />
                      Password (min 6 characters)
                    </label>
                    <div className="admin-auth__password-wrapper">
                      <input
                        type={showPassword ? "text" : "password"}
                        className="admin-auth__input"
                        placeholder="••••••••"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        className="admin-auth__password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="admin-auth__submit-btn admin-auth__submit-btn--register"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="admin-auth__spinner"></span>
                        Creating Admin...
                      </>
                    ) : (
                      "Create Admin Account"
                    )}
                  </button>

                  <div className="admin-auth__footer">
                    <p className="admin-auth__note">
                      ⚠️ Admin registration is restricted. Only authorized personnel can create accounts.
                    </p>
                    <button
                      type="button"
                      className="admin-auth__switch-link"
                      onClick={() => setIsLoginMode(true)}
                    >
                      Already have admin account? Login here
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminAuth;