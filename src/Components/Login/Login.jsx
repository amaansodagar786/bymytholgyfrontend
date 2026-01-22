import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiMail, FiLock, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./Login.scss";

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password States
  const [showForgotModel, setShowForgotModel] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Login Validation Schema
  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string()
      .required("Password is required"),
  });

  // Login Handler
  const handleLogin = async (values) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/login`,
        {
          email: values.email,
          password: values.password,
        }
      );

      toast.success("Login Successful! 🎉", {
        position: "top-right",
        autoClose: 2000,
      });

      // Store tokens
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Redirect to home after 1.5 seconds
      setTimeout(() => {
        navigate("/");
      }, 1500);

    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD HANDLERS
  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email", { position: "top-right" });
      return;
    }

    setOtpLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/forgot-password`,
        { email: forgotEmail }
      );

      if (res.data.success) {
        setOtpSent(true);
        setForgotStep(2);
        toast.success("OTP sent to your email", { position: "top-right" });

        // Start resend timer (60 seconds)
        setResendTimer(60);
        const timer = setInterval(() => {
          setResendTimer((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP", {
        position: "top-right",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim() || forgotOtp.length !== 4) {
      toast.error("Please enter valid 4-digit OTP", { position: "top-right" });
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/verify-otp`,
        { email: forgotEmail, otp: forgotOtp }
      );

      if (res.data.success) {
        setForgotStep(3);
        toast.success("OTP verified", { position: "top-right" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP", {
        position: "top-right",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!forgotPassword.trim() || forgotPassword.length < 6) {
      toast.error("Password must be at least 6 characters", { position: "top-right" });
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/reset-password`,
        { email: forgotEmail, newPassword: forgotPassword }
      );

      if (res.data.success) {
        toast.success("Password reset successful! Please login", {
          position: "top-right",
          autoClose: 3000,
        });

        // Close model and reset states
        setTimeout(() => {
          setShowForgotModel(false);
          resetForgotFlow();
        }, 2000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password", {
        position: "top-right",
      });
    }
  };

  const resetForgotFlow = () => {
    setForgotStep(1);
    setForgotEmail("");
    setForgotOtp("");
    setForgotPassword("");
    setOtpSent(false);
    setResendTimer(0);
  };

  return (
    <>
      <ToastContainer />

      {/* LOGIN PAGE */}
      <div className="login">
        <div className="login__container">
          {/* LEFT SIDE - FORM */}
          <div className="login__left">
            <div className="login__form-container">
              <div className="login__header">
                <h1 className="login__title">Welcome Back</h1>
                <p className="login__subtitle">Sign in to your account</p>
              </div>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={loginSchema}
                onSubmit={handleLogin}
              >
                {({ errors, touched }) => (
                  <Form className="login__form">
                    <div className="login__form-group">
                      <div className="login__input-wrapper">
                        <FiMail className="login__input-icon" />
                        <Field
                          name="email"
                          type="email"
                          placeholder="Email Address"
                          className={`login__input ${errors.email && touched.email ? "login__input--error" : ""
                            }`}
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="login__error"
                      />
                    </div>

                    <div className="login__form-group">
                      <div className="login__input-wrapper">
                        <FiLock className="login__input-icon" />
                        <Field
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className={`login__input ${errors.password && touched.password
                              ? "login__input--error"
                              : ""
                            }`}
                        />
                        <button
                          type="button"
                          className="login__password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="login__error"
                      />
                    </div>

                    <button
                      type="submit"
                      className="login__submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Login"}
                    </button>

                    <div className="login__footer">
                      <p className="login__register-text">
                        Don't have an account?{" "}
                        <Link to="/register" className="login__register-link">
                          Register here
                        </Link>
                      </p>
                      <button
                        type="button"
                        className="login__forgot-link"
                        onClick={() => setShowForgotModel(true)}
                      >
                        Forgot Password?
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>

          {/* RIGHT SIDE - IMAGE */}
          <div className="login__right">
            <div className="login__image-wrapper">
              <img
              src="https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=1600&auto=format&fit=crop"
                alt="Candle meditation"
                className="login__image"
              />
              <div className="login__overlay">
                <div className="login__logo">ॐ</div>
                <h2 className="login__brand">Ramayan Series</h2>
                <p className="login__tagline">Return to your divine space</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODEL */}
      {showForgotModel && (
        <div className="forgot-model">
          <div className="forgot-model__overlay" onClick={() => setShowForgotModel(false)} />
          <div className="forgot-model__content">
            <button
              className="forgot-model__close"
              onClick={() => {
                setShowForgotModel(false);
                resetForgotFlow();
              }}
            >
              <FiX />
            </button>

            <h2 className="forgot-model__title">Reset Password</h2>

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <div className="forgot-model__step">
                <p className="forgot-model__description">
                  Enter your email address to receive a reset OTP
                </p>
                <div className="forgot-model__input-group">
                  <FiMail className="forgot-model__input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="forgot-model__input"
                  />
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="forgot-model__btn"
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {/* STEP 2: Enter OTP */}
            {forgotStep === 2 && (
              <div className="forgot-model__step">
                <p className="forgot-model__description">
                  Enter the 4-digit OTP sent to <strong>{forgotEmail}</strong>
                </p>
                <div className="forgot-model__input-group">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="forgot-model__input forgot-model__input--otp"
                    maxLength={4}
                  />
                </div>
                <div className="forgot-model__otp-actions">
                  {resendTimer > 0 ? (
                    <span className="forgot-model__timer">
                      Resend OTP in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="forgot-model__resend"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <button
                  onClick={handleVerifyOtp}
                  className="forgot-model__btn"
                >
                  Verify OTP
                </button>
                <button
                  onClick={() => {
                    setForgotStep(1);
                    setForgotOtp("");
                  }}
                  className="forgot-model__back"
                >
                  Change Email
                </button>
              </div>
            )}

            {/* STEP 3: New Password */}
            {forgotStep === 3 && (
              <div className="forgot-model__step">
                <p className="forgot-model__description">
                  Enter your new password
                </p>
                <div className="forgot-model__input-group">
                  <FiLock className="forgot-model__input-icon" />
                  <input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    className="forgot-model__input"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  className="forgot-model__btn"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => setForgotStep(2)}
                  className="forgot-model__back"
                >
                  Back to OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Login;