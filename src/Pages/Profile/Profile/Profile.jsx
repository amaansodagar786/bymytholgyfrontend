// Updated Profile.jsx with fixed AddressForm centering
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ReactDOM from "react-dom"; // Import ReactDOM for Portal
import "./Profile.scss";
import AddressForm from '../../CheckOut/Address/AddressForm';

// React Icons
import { 
  FaHome, FaBriefcase, FaMapMarkerAlt, FaPhone, FaEnvelope, 
  FaEdit, FaTrash, FaStar, FaUser, FaLock, FaMapMarker, 
  FaHeart, FaBox, FaSignOutAlt, FaCheck, FaExclamationTriangle 
} from 'react-icons/fa';
import { IoMdArrowDropdown } from 'react-icons/io';

// Toast configuration
const toastConfig = {
  position: "top-center",
  autoClose: 4000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light",
};

// Success toast
const showSuccess = (message) => {
  toast.success(message, {
    ...toastConfig,
    icon: <FaCheck className="toast-icon success" />,
  });
};

// Error toast
const showError = (message) => {
  toast.error(message, {
    ...toastConfig,
    icon: <FaExclamationTriangle className="toast-icon error" />,
  });
};

// Address Card Component with React Icons
const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
    // Choose icon based on address type
    const getAddressIcon = () => {
        switch (address.addressType) {
            case 'home': return <FaHome className="icon" />;
            case 'work': return <FaBriefcase className="icon" />;
            default: return <FaMapMarkerAlt className="icon" />;
        }
    };

    return (
        <div className={`address-card ${address.isDefault ? 'default' : ''}`}>
            <div className="address-card-inner">
                <div className="address-header">
                    <div className="address-type">
                        <div className="type-icon-wrapper">
                            {getAddressIcon()}
                        </div>
                        <div className="type-info">
                            <span className="type-text">{address.addressType}</span>
                            {address.isDefault && (
                                <span className="default-badge">
                                    <FaStar className="star-icon" /> Default
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="address-actions">
                        <button onClick={() => onEdit(address)} className="action-btn edit">
                            <FaEdit className="btn-icon" /> Edit
                        </button>
                        <button onClick={() => onDelete(address.addressId)} className="action-btn delete">
                            <FaTrash className="btn-icon" /> Delete
                        </button>
                    </div>
                </div>

                <div className="address-body">
                    <p className="address-name">{address.fullName}</p>
                    <p className="address-contact">
                        <FaPhone className="contact-icon" /> {address.mobile}
                        {address.email && (
                            <>
                                <span className="separator">|</span>
                                <FaEnvelope className="contact-icon" /> {address.email}
                            </>
                        )}
                    </p>

                    <div className="address-details">
                        <p>{address.addressLine1}</p>
                        {address.addressLine2 && <p>{address.addressLine2}</p>}
                        {address.landmark && (
                            <p className="landmark">
                                <strong>Landmark:</strong> {address.landmark}
                            </p>
                        )}
                        <p>{address.city}, {address.state} - {address.pincode}</p>
                        <p>{address.country}</p>
                    </div>

                    {address.instructions && (
                        <div className="address-instructions">
                            <p>
                                <strong>Delivery Instructions:</strong> {address.instructions}
                            </p>
                        </div>
                    )}

                    {!address.isDefault && (
                        <button
                            onClick={() => onSetDefault(address.addressId)}
                            className="set-default-btn"
                        >
                            <FaStar className="star-icon" /> Set as Default
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// Create a Portal for AddressForm
const AddressFormPortal = ({ children }) => {
    return ReactDOM.createPortal(
        children,
        document.body
    );
};

// Main Profile Component
const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");

    // Profile data
    const [profile, setProfile] = useState({
        name: "",
        email: "",
        mobile: "",
        age: "",
        gender: ""
    });

    // Password data
    const [passwords, setPasswords] = useState({
        oldPassword: "",
        newPassword: "",
        confirmPassword: ""
    });

    // Address data
    const [addresses, setAddresses] = useState([]);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState(null);

    const genderOptions = [
        { value: "", label: "Select Gender" },
        { value: "male", label: "Male" },
        { value: "female", label: "Female" },
        { value: "other", label: "Other" },
        { value: "prefer-not-to-say", label: "Prefer not to say" }
    ];

    // Get auth token
    const getToken = () => localStorage.getItem("token");

    // Fetch user profile
    const fetchProfile = async () => {
        try {
            setLoading(true);

            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/profile/get`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                const user = response.data.user;
                setProfile({
                    name: user.name || "",
                    email: user.email || "",
                    mobile: user.mobile || "",
                    age: user.age || "",
                    gender: user.gender || ""
                });
            }
        } catch (err) {
            console.error("Error fetching profile:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                showError("Failed to load profile. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Fetch addresses
    const fetchAddresses = async () => {
        try {
            const token = getToken();
            if (!token) return;

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/profile/addresses`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setAddresses(response.data.addresses);
            }
        } catch (err) {
            console.error("Error fetching addresses:", err);
            if (err.response?.status === 401) {
                handleLogout();
            }
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    useEffect(() => {
        if (activeTab === "addresses") {
            fetchAddresses();
        }
    }, [activeTab]);

    // Handle profile update
    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            const profileData = {
                name: profile.name.trim(),
                email: profile.email.trim(),
                mobile: profile.mobile.trim(),
                age: profile.age ? parseInt(profile.age) : null,
                gender: profile.gender
            };

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/update`,
                profileData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showSuccess("Profile updated successfully!");

                if (response.data.token) {
                    localStorage.setItem("token", response.data.token);
                }

                setProfile({
                    name: response.data.user.name,
                    email: response.data.user.email,
                    mobile: response.data.user.mobile,
                    age: response.data.user.age || "",
                    gender: response.data.user.gender
                });
            }
        } catch (err) {
            console.error("Error updating profile:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                showError(err.response?.data?.message || "Failed to update profile.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Handle password change
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);

            const token = getToken();
            if (!token) {
                navigate("/login");
                return;
            }

            // Validate passwords match
            if (passwords.newPassword !== passwords.confirmPassword) {
                showError("New password and confirm password do not match.");
                return;
            }

            if (passwords.newPassword.length < 6) {
                showError("New password must be at least 6 characters.");
                return;
            }

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/change-password`,
                passwords,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showSuccess("Password changed successfully!");
                setPasswords({
                    oldPassword: "",
                    newPassword: "",
                    confirmPassword: ""
                });
            }
        } catch (err) {
            console.error("Error changing password:", err);
            if (err.response?.status === 401) {
                handleLogout();
            } else {
                showError(err.response?.data?.message || "Failed to change password.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Address CRUD Operations
    const handleAddAddress = async (addressData) => {
        try {
            setSaving(true);

            const token = getToken();
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/profile/address/add`,
                addressData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showSuccess("Address added successfully!");
                setShowAddressForm(false);
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error adding address:", err);
            showError(err.response?.data?.message || "Failed to add address.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAddress = async (addressData) => {
        try {
            setSaving(true);

            const token = getToken();
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/address/update/${editingAddress.addressId}`,
                addressData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showSuccess("Address updated successfully!");
                setShowAddressForm(false);
                setEditingAddress(null);
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error updating address:", err);
            showError(err.response?.data?.message || "Failed to update address.");
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAddress = async (addressId) => {
        if (!window.confirm("Are you sure you want to delete this address?")) {
            return;
        }

        try {
            setSaving(true);

            const token = getToken();
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/profile/address/delete/${addressId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showSuccess("Address deleted successfully!");
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error deleting address:", err);
            showError(err.response?.data?.message || "Failed to delete address.");
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            setSaving(true);

            const token = getToken();
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/address/set-default/${addressId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                showSuccess("Default address updated!");
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error setting default address:", err);
            showError(err.response?.data?.message || "Failed to set default address.");
        } finally {
            setSaving(false);
        }
    };

    // Edit address
    const handleEditAddress = (address) => {
        setEditingAddress(address);
        setShowAddressForm(true);
    };

    // Cancel address form
    const handleCancelAddressForm = () => {
        setShowAddressForm(false);
        setEditingAddress(null);
    };

    // Submit address form
    const handleSubmitAddress = (addressData) => {
        if (editingAddress) {
            handleUpdateAddress(addressData);
        } else {
            handleAddAddress(addressData);
        }
    };

    // Handle logout
    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        localStorage.removeItem("user");
        showSuccess("Logged out successfully!");
        setTimeout(() => {
            navigate("/login");
        }, 1500);
    };

    // Handle input changes
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChangeInput = (e) => {
        const { name, value } = e.target;
        setPasswords(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Render loading state
    if (loading && activeTab === "profile") {
        return (
            <div className="profile-container">
                <ToastContainer />
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    // Check authentication
    const token = getToken();
    if (!token) {
        return (
            <div className="profile-container">
                <ToastContainer />
                <div className="login-prompt">
                    <h2>Login Required</h2>
                    <p>Please login to view your profile.</p>
                    <button onClick={() => navigate("/login")} className="auth-btn">
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {/* Toast Container */}
            <ToastContainer
                position="top-center"
                autoClose={4000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />

            <div className="profile-header">
                <div className="header-content">
                    <h1 className="page-title">My Profile</h1>
                    <p className="page-subtitle">Manage your account settings and preferences</p>
                </div>
                <button onClick={handleLogout} className="logout-btn">
                    <FaSignOutAlt className="logout-icon" /> Logout
                </button>
            </div>

            <div className="profile-content">
                {/* Sidebar Navigation */}
                <div className="profile-sidebar">
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <h3 className="user-name">{profile.name}</h3>
                            <p className="user-email">{profile.email}</p>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <span className="nav-icon"><FaUser /></span>
                            <span className="nav-text">Personal Info</span>
                        </button>
                        <button
                            className={`nav-btn ${activeTab === "password" ? "active" : ""}`}
                            onClick={() => setActiveTab("password")}
                        >
                            <span className="nav-icon"><FaLock /></span>
                            <span className="nav-text">Change Password</span>
                        </button>
                        <button
                            className={`nav-btn ${activeTab === "addresses" ? "active" : ""}`}
                            onClick={() => setActiveTab("addresses")}
                        >
                            <span className="nav-icon"><FaMapMarker /></span>
                            <span className="nav-text">My Addresses</span>
                            {addresses.length > 0 && (
                                <span className="nav-badge">{addresses.length}</span>
                            )}
                        </button>
                        <button className="nav-btn" onClick={() => navigate("/wishlist")}>
                            <span className="nav-icon"><FaHeart /></span>
                            <span className="nav-text">My Wishlist</span>
                        </button>
                        <button className="nav-btn" onClick={() => navigate("/orders")}>
                            <span className="nav-icon"><FaBox /></span>
                            <span className="nav-text">My Orders</span>
                        </button>
                        <button className="nav-btn" onClick={() => navigate("/my-reviews")}>
                            <span className="nav-icon"><FaStar  /></span>
                            <span className="nav-text">My Reviews</span>
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="profile-main">
                    {activeTab === "profile" && (
                        <form className="profile-form" onSubmit={handleProfileUpdate}>
                            <div className="section-header">
                                <h2 className="section-title">Personal Information</h2>
                                <p className="section-subtitle">Update your personal details</p>
                            </div>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name" className="form-label">
                                        Full Name <span className="required">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={saving}
                                        placeholder="Enter your full name"
                                        className="form-input"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email" className="form-label">
                                        Email Address <span className="required">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={saving}
                                        placeholder="Enter your email"
                                        className="form-input"
                                    />
                                    {/* <small className="form-help">
                                        Changing email will require re-login
                                    </small> */}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="mobile" className="form-label">
                                        Mobile Number
                                    </label>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        name="mobile"
                                        value={profile.mobile}
                                        onChange={handleProfileChange}
                                        disabled={saving}
                                        placeholder="Enter 10-digit mobile number"
                                        className="form-input"
                                        maxLength="10"
                                        pattern="[6-9]{1}[0-9]{9}"
                                    />
                                    <small className="form-help">
                                        Optional - 10 digit Indian number
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="age" className="form-label">
                                        Age
                                    </label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={profile.age}
                                        onChange={handleProfileChange}
                                        disabled={saving}
                                        placeholder="Enter your age"
                                        className="form-input"
                                        min="1"
                                        max="120"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="gender" className="form-label">
                                        Gender
                                    </label>
                                    <div className="select-wrapper">
                                        <select
                                            id="gender"
                                            name="gender"
                                            value={profile.gender}
                                            onChange={handleProfileChange}
                                            disabled={saving}
                                            className="form-select"
                                        >
                                            {genderOptions.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select>
                                        <IoMdArrowDropdown className="select-arrow" />
                                    </div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="save-btn primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-btn"></span>
                                            Saving...
                                        </>
                                    ) : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn secondary-btn"
                                    onClick={fetchProfile}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === "password" && (
                        <form className="password-form" onSubmit={handlePasswordChange}>
                            <div className="section-header">
                                <h2 className="section-title">Change Password</h2>
                                <p className="section-subtitle">
                                    For security, please enter your current password and then your new password.
                                </p>
                            </div>

                            <div className="form-group">
                                <label htmlFor="oldPassword" className="form-label">
                                    Current Password <span className="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="oldPassword"
                                    name="oldPassword"
                                    value={passwords.oldPassword}
                                    onChange={handlePasswordChangeInput}
                                    required
                                    disabled={saving}
                                    placeholder="Enter current password"
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword" className="form-label">
                                    New Password <span className="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChangeInput}
                                    required
                                    disabled={saving}
                                    placeholder="Enter new password (min 6 characters)"
                                    className="form-input"
                                    minLength="6"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword" className="form-label">
                                    Confirm New Password <span className="required">*</span>
                                </label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChangeInput}
                                    required
                                    disabled={saving}
                                    placeholder="Re-enter new password"
                                    className="form-input"
                                    minLength="6"
                                />
                            </div>

                            <div className="password-requirements">
                                <h4 className="requirements-title">Password Requirements:</h4>
                                <ul className="requirements-list">
                                    <li>Minimum 6 characters</li>
                                    <li>Use a mix of letters and numbers</li>
                                    <li>Avoid common words or patterns</li>
                                </ul>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="save-btn primary-btn"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <>
                                            <span className="spinner-btn"></span>
                                            Changing Password...
                                        </>
                                    ) : "Change Password"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn secondary-btn"
                                    onClick={() => {
                                        setPasswords({
                                            oldPassword: "",
                                            newPassword: "",
                                            confirmPassword: ""
                                        });
                                        setActiveTab("profile");
                                    }}
                                    disabled={saving}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === "addresses" && (
                        <div className="addresses-tab">
                            <div className="section-header">
                                <div className="header-content">
                                    <h2 className="section-title">My Addresses</h2>
                                    <p className="section-subtitle">
                                        Manage your shipping addresses for faster checkout
                                    </p>
                                </div>
                                <button
                                    className="add-address-btn primary-btn"
                                    onClick={() => setShowAddressForm(true)}
                                    disabled={saving || showAddressForm}
                                >
                                    <span className="btn-icon">+</span> Add New Address
                                </button>
                            </div>

                            {addresses.length === 0 && !showAddressForm ? (
                                <div className="no-addresses">
                                    <div className="empty-state">
                                        <div className="empty-icon">
                                            <FaMapMarkerAlt />
                                        </div>
                                        <h3>No addresses saved</h3>
                                        <p>Add your first address to make checkout faster!</p>
                                        <button
                                            className="add-first-btn primary-btn"
                                            onClick={() => setShowAddressForm(true)}
                                        >
                                            Add Your First Address
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="addresses-grid">
                                    {addresses.map(address => (
                                        <AddressCard
                                            key={address.addressId}
                                            address={address}
                                            onEdit={handleEditAddress}
                                            onDelete={handleDeleteAddress}
                                            onSetDefault={handleSetDefaultAddress}
                                        />
                                    ))}
                                </div>
                            )}

                            {addresses.length > 0 && (
                                <div className="addresses-stats">
                                    <div className="stat-item">
                                        <span className="stat-label">Total addresses:</span>
                                        <span className="stat-value">{addresses.length}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Default address:</span>
                                        <span className="stat-value">
                                            {addresses.find(a => a.isDefault)?.city || "Not set"}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Render AddressForm as a Portal to body (outside the normal flow) */}
            {showAddressForm && (
                <AddressFormPortal>
                    <AddressForm
                        address={editingAddress}
                        onSubmit={handleSubmitAddress}
                        onCancel={handleCancelAddressForm}
                        mode={editingAddress ? 'edit' : 'add'}
                    />
                </AddressFormPortal>
            )}
        </div>
    );
};

export default Profile;