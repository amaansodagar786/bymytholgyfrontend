import React, { useState } from "react";
import axios from "axios";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FiEye, FiEyeOff, FiUser, FiMail, FiPhone } from "react-icons/fi";
import { Link } from "react-router-dom";
import "./Register.scss";
import { useNavigate } from "react-router-dom";


const Register = () => {
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
        position: "top-right",
        autoClose: 3000,
      });
      resetForm();

      setTimeout(() => {
        navigate("/login");
      }, 2000);

    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong", {
        position: "top-right",
        autoClose: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="register">
      <ToastContainer />
      <div className="register__container">
        <div className="register__left">
          <div className="register__image-wrapper">
            <img
              src="https://images.unsplash.com/photo-1594041680534-e8c8cdebd659?q=80&w=1600&auto=format&fit=crop"
              alt="Candle setup"
              className="register__image"
            />
            <div className="register__overlay">
              <div className="register__logo">ॐ</div>
              <h2 className="register__brand">Ramayan Series</h2>
              <p className="register__tagline">Illuminate your space with divine essence</p>
            </div>
          </div>
        </div>

        <div className="register__right">
          <div className="register__form-container">
            <div className="register__header">
              <h1 className="register__title">Create Account</h1>
              <p className="register__subtitle">Join our divine candle community</p>
            </div>

            <Formik
              initialValues={{ name: "", email: "", mobile: "", password: "" }}
              validationSchema={validationSchema}
              onSubmit={handleSubmit}
            >
              {({ errors, touched }) => (
                <Form className="register__form">
                  <div className="register__form-group">
                    <div className="register__input-wrapper">
                      <FiUser className="register__input-icon" />
                      <Field
                        name="name"
                        type="text"
                        placeholder="Full Name"
                        className={`register__input ${errors.name && touched.name ? "register__input--error" : ""
                          }`}
                      />
                    </div>
                    <ErrorMessage
                      name="name"
                      component="div"
                      className="register__error"
                    />
                  </div>

                  <div className="register__form-group">
                    <div className="register__input-wrapper">
                      <FiMail className="register__input-icon" />
                      <Field
                        name="email"
                        type="email"
                        placeholder="Email Address"
                        className={`register__input ${errors.email && touched.email ? "register__input--error" : ""
                          }`}
                      />
                    </div>
                    <ErrorMessage
                      name="email"
                      component="div"
                      className="register__error"
                    />
                  </div>

                  <div className="register__form-group">
                    <div className="register__input-wrapper">
                      <FiPhone className="register__input-icon" />
                      <Field
                        name="mobile"
                        type="tel"
                        placeholder="Mobile Number"
                        className={`register__input ${errors.mobile && touched.mobile ? "register__input--error" : ""
                          }`}
                      />
                    </div>
                    <ErrorMessage
                      name="mobile"
                      component="div"
                      className="register__error"
                    />
                  </div>

                  <div className="register__form-group">
                    <div className="register__input-wrapper">
                      <Field
                        name="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        className={`register__input ${errors.password && touched.password
                            ? "register__input--error"
                            : ""
                          }`}
                      />
                      <button
                        type="button"
                        className="register__password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </button>
                    </div>
                    <ErrorMessage
                      name="password"
                      component="div"
                      className="register__error"
                    />
                  </div>

                  <button
                    type="submit"
                    className="register__submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : "Register"}
                  </button>

                  <div className="register__footer">
                    <p className="register__login-text">
                      Already have an account?{" "}
                      <Link to="/login" className="register__login-link">
                        Login here
                      </Link>
                    </p>
                    
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;