import React, { useState, useEffect } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiMail, FiLock, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import "./LoginModal.scss";
import RegisterModal from "../../Register/RegisterModel/RegisterModal";

const LoginModal = ({ onClose, showRegisterLink = true, onShowRegister }) => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password States
  const [showForgotModel, setShowForgotModel] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [forgotPassword, setForgotPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Register Modal State
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Login Validation Schema
  const loginSchema = Yup.object({
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    password: Yup.string().required("Password is required"),
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
        position: "top-center",
        autoClose: 2000,
      });

      // Store tokens
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      // Close modal and redirect
      setTimeout(() => {
        onClose();
        navigate("/");
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed", {
        position: "top-center",
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // FORGOT PASSWORD HANDLERS
  const handleSendOtp = async () => {
    if (!forgotEmail.trim()) {
      toast.error("Please enter your email", { position: "top-center" });
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
        toast.success("OTP sent to your email", { position: "top-center" });

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
        position: "top-center",
      });
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!forgotOtp.trim() || forgotOtp.length !== 4) {
      toast.error("Please enter valid 4-digit OTP", { position: "top-center" });
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/verify-otp`,
        { email: forgotEmail, otp: forgotOtp }
      );

      if (res.data.success) {
        setForgotStep(3);
        toast.success("OTP verified", { position: "top-center" });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP", {
        position: "top-center",
      });
    }
  };

  const handleResetPassword = async () => {
    if (!forgotPassword.trim() || forgotPassword.length < 6) {
      toast.error("Password must be at least 6 characters", {
        position: "top-center",
      });
      return;
    }

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/reset-password`,
        { email: forgotEmail, newPassword: forgotPassword }
      );

      if (res.data.success) {
        toast.success("Password reset successful! Please login", {
          position: "top-center",
          autoClose: 3000,
        });

        // Close model and reset states
        setTimeout(() => {
          setShowForgotModel(false);
          resetForgotFlow();
        }, 2000);
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to reset password",
        {
          position: "top-center",
        }
      );
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

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (event.key === "Escape") {
        if (showForgotModel) {
          setShowForgotModel(false);
          resetForgotFlow();
        } else if (showRegisterModal) {
          setShowRegisterModal(false);
        } else {
          onClose();
        }
      }
    };

    if (showForgotModel || showRegisterModal) {
      document.addEventListener("keydown", handleEscKey);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "auto";
    };
  }, [showForgotModel, showRegisterModal, onClose]);

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
        style={{ zIndex: 999999 }}
      />

      {/* MAIN LOGIN MODAL */}
      <div className="login-modal" style={{ 
        opacity: showRegisterModal ? 0.3 : 1,
        pointerEvents: showRegisterModal ? 'none' : 'auto'
      }}>
        <div className="login-modal__overlay" onClick={onClose} />
        <div className="login-modal__container">
          {/* CLOSE BUTTON */}
          <button className="login-modal__close" onClick={onClose}>
            <FiX />
          </button>

          {/* LEFT SIDE - FORM */}
          <div className="login-modal__left">
            <div className="login-modal__form-container">
              <div className="login-modal__header">
                <h1 className="login-modal__title">Welcome Back</h1>
                <p className="login-modal__subtitle">Sign in to your account</p>
              </div>

              <Formik
                initialValues={{ email: "", password: "" }}
                validationSchema={loginSchema}
                onSubmit={handleLogin}
              >
                {({ errors, touched }) => (
                  <Form className="login-modal__form">
                    <div className="login-modal__form-group">
                      <div className="login-modal__input-wrapper">
                        <FiMail className="login-modal__input-icon" />
                        <Field
                          name="email"
                          type="email"
                          placeholder="Email Address"
                          className={`login-modal__input ${
                            errors.email && touched.email
                              ? "login-modal__input--error"
                              : ""
                          }`}
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="login-modal__error"
                      />
                    </div>

                    <div className="login-modal__form-group">
                      <div className="login-modal__input-wrapper">
                        <FiLock className="login-modal__input-icon" />
                        <Field
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className={`login-modal__input ${
                            errors.password && touched.password
                              ? "login-modal__input--error"
                              : ""
                          }`}
                        />
                        <button
                          type="button"
                          className="login-modal__password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="login-modal__error"
                      />
                    </div>

                    <button
                      type="submit"
                      className="login-modal__submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing In..." : "Login"}
                    </button>

                    <div className="login-modal__footer">
                      {showRegisterLink && (
                        <p className="login-modal__register-text">
                          Don't have an account?{" "}
                          <button
                            type="button"
                            className="login-modal__register-link"
                            onClick={() => setShowRegisterModal(true)}
                          >
                            Register here
                          </button>
                        </p>
                      )}
                      <button
                        type="button"
                        className="login-modal__forgot-link"
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

          {/* RIGHT SIDE - IMAGE (Hidden on mobile) */}
          <div className="login-modal__right">
            <div className="login-modal__image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=1600&auto=format&fit=crop"
                alt="Candle meditation"
                className="login-modal__image"
              />
              <div className="login-modal__image-overlay">
                <div className="login-modal__logo">ॐ</div>
                <h2 className="login-modal__brand">Ramayan Series</h2>
                <p className="login-modal__tagline">
                  Return to your divine space
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModel && (
        <div className="forgot-password-modal">
          <div
            className="forgot-password-modal__overlay"
            onClick={() => {
              setShowForgotModel(false);
              resetForgotFlow();
            }}
          />
          <div className="forgot-password-modal__content">
            <button
              className="forgot-password-modal__close"
              onClick={() => {
                setShowForgotModel(false);
                resetForgotFlow();
              }}
            >
              <FiX />
            </button>

            <h2 className="forgot-password-modal__title">Reset Password</h2>

            {/* STEP 1: Enter Email */}
            {forgotStep === 1 && (
              <div className="forgot-password-modal__step">
                <p className="forgot-password-modal__description">
                  Enter your email address to receive a reset OTP
                </p>
                <div className="forgot-password-modal__input-group">
                  <FiMail className="forgot-password-modal__input-icon" />
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="forgot-password-modal__input"
                  />
                </div>
                <button
                  onClick={handleSendOtp}
                  disabled={otpLoading}
                  className="forgot-password-modal__btn"
                >
                  {otpLoading ? "Sending..." : "Send OTP"}
                </button>
              </div>
            )}

            {/* STEP 2: Enter OTP */}
            {forgotStep === 2 && (
              <div className="forgot-password-modal__step">
                <p className="forgot-password-modal__description">
                  Enter the 4-digit OTP sent to <strong>{forgotEmail}</strong>
                </p>
                <div className="forgot-password-modal__input-group">
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={forgotOtp}
                    onChange={(e) =>
                      setForgotOtp(
                        e.target.value.replace(/\D/g, "").slice(0, 4)
                      )
                    }
                    className="forgot-password-modal__input forgot-password-modal__input--otp"
                    maxLength={4}
                  />
                </div>
                <div className="forgot-password-modal__otp-actions">
                  {resendTimer > 0 ? (
                    <span className="forgot-password-modal__timer">
                      Resend OTP in {resendTimer}s
                    </span>
                  ) : (
                    <button
                      onClick={handleSendOtp}
                      className="forgot-password-modal__resend"
                    >
                      Resend OTP
                    </button>
                  )}
                </div>
                <button
                  onClick={handleVerifyOtp}
                  className="forgot-password-modal__btn"
                >
                  Verify OTP
                </button>
                <button
                  onClick={() => {
                    setForgotStep(1);
                    setForgotOtp("");
                  }}
                  className="forgot-password-modal__back"
                >
                  Change Email
                </button>
              </div>
            )}

            {/* STEP 3: New Password */}
            {forgotStep === 3 && (
              <div className="forgot-password-modal__step">
                <p className="forgot-password-modal__description">
                  Enter your new password
                </p>
                <div className="forgot-password-modal__input-group">
                  <FiLock className="forgot-password-modal__input-icon" />
                  <input
                    type="password"
                    placeholder="New password (min 6 characters)"
                    value={forgotPassword}
                    onChange={(e) => setForgotPassword(e.target.value)}
                    className="forgot-password-modal__input"
                  />
                </div>
                <button
                  onClick={handleResetPassword}
                  className="forgot-password-modal__btn"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => setForgotStep(2)}
                  className="forgot-password-modal__back"
                >
                  Back to OTP
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REGISTER MODAL - RENDER ON TOP */}
      {showRegisterModal && (
        <RegisterModal
          onClose={() => setShowRegisterModal(false)}
          showLoginLink={true}
        />
      )}
    </>
  );
};

export default LoginModal;