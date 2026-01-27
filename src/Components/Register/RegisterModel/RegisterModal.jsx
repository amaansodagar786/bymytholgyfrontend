import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone, FiX } from "react-icons/fi";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./RegisterModal.scss";

const RegisterModal = ({ onClose, showLoginLink = true, onShowLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(2, "Name must be at least 2 characters")
      .required("Name is required"),
    email: Yup.string()
      .email("Invalid email address")
      .required("Email is required"),
    mobile: Yup.string()
      .matches(/^[0-9]{10}$/, "Mobile must be 10 digits")
      .required("Mobile is required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is required"),
  });

  const handleSubmit = async (values, { resetForm }) => {
    setIsLoading(true);
    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/user/register`,
        {
          name: values.name,
          email: values.email,
          password: values.password,
          mobile: values.mobile,
        }
      );

      toast.success("Registration Successful! 🎉", {
        position: "top-center",
        autoClose: 3000,
      });
      resetForm();

      // Store tokens if API returns them
      if (res.data.token) {
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("userId", res.data.userId);
        localStorage.setItem("user", JSON.stringify(res.data.user));
      }

      setTimeout(() => {
        onClose();
        if (res.data.token) {
          navigate("/");
        } else {
          // Show login modal or navigate to login
          // You can trigger login modal from parent if needed
          navigate("/");
        }
      }, 2000);

    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong", {
        position: "top-center",
        autoClose: 4000,
      });
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
        style={{ zIndex: 999999 }}
      />

      {/* MAIN REGISTER MODAL */}
      <div className="register-modal">
        <div className="register-modal__backdrop" onClick={onClose} />
        <div className="register-modal__container">
          {/* CLOSE BUTTON */}
          <button className="register-modal__close" onClick={onClose}>
            <FiX />
          </button>

          {/* LEFT SIDE - IMAGE */}
          <div className="register-modal__left">
            <div className="register-modal__image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=1600&auto=format&fit=crop"
                alt="Candle setup"
                className="register-modal__image"
              />
              <div className="register-modal__image-overlay">
                <div className="register-modal__logo">ॐ</div>
                <h2 className="register-modal__brand">Ramayan Series</h2>
                <p className="register-modal__tagline">Illuminate your space with divine essence</p>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - FORM */}
          <div className="register-modal__right">
            <div className="register-modal__form-container">
              <div className="register-modal__header">
                <h1 className="register-modal__title">Create Account</h1>
                <p className="register-modal__subtitle">Join our divine candle community</p>
              </div>

              <Formik
                initialValues={{ name: "", email: "", mobile: "", password: "" }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ errors, touched }) => (
                  <Form className="register-modal__form">
                    <div className="register-modal__form-group">
                      <div className="register-modal__input-wrapper">
                        <FiUser className="register-modal__input-icon" />
                        <Field
                          name="name"
                          type="text"
                          placeholder="Full Name"
                          className={`register-modal__input ${errors.name && touched.name ? "register-modal__input--error" : ""
                            }`}
                        />
                      </div>
                      <ErrorMessage
                        name="name"
                        component="div"
                        className="register-modal__error"
                      />
                    </div>

                    <div className="register-modal__form-group">
                      <div className="register-modal__input-wrapper">
                        <FiMail className="register-modal__input-icon" />
                        <Field
                          name="email"
                          type="email"
                          placeholder="Email Address"
                          className={`register-modal__input ${errors.email && touched.email ? "register-modal__input--error" : ""
                            }`}
                        />
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="register-modal__error"
                      />
                    </div>

                    <div className="register-modal__form-group">
                      <div className="register-modal__input-wrapper">
                        <FiPhone className="register-modal__input-icon" />
                        <Field
                          name="mobile"
                          type="tel"
                          placeholder="Mobile Number"
                          className={`register-modal__input ${errors.mobile && touched.mobile ? "register-modal__input--error" : ""
                            }`}
                        />
                      </div>
                      <ErrorMessage
                        name="mobile"
                        component="div"
                        className="register-modal__error"
                      />
                    </div>

                    <div className="register-modal__form-group">
                      <div className="register-modal__input-wrapper">
                        <Field
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          className={`register-modal__input ${errors.password && touched.password
                            ? "register-modal__input--error"
                            : ""
                            }`}
                        />
                        <button
                          type="button"
                          className="register-modal__password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <FiEyeOff /> : <FiEye />}
                        </button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="register-modal__error"
                      />
                    </div>

                    <button
                      type="submit"
                      className="register-modal__submit-btn"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Register"}
                    </button>

                    <div className="register-modal__footer">
                      {showLoginLink && (
                        <p className="register-modal__login-text">
                          Already have an account?{" "}
                          <button
                            type="button"
                            className="register-modal__login-link"
                            onClick={() => onClose()}
                          >
                            Login here
                          </button>
                        </p>
                      )}
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterModal;