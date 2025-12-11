// Updated Profile.jsx with Address Management
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Profile.scss";
import AddressForm from '../../CheckOut/Address/AddressForm'; // Import from separate file


// Address Form Component
// const AddressForm = ({ address, onSubmit, onCancel, mode = "add" }) => {
//     const [formData, setFormData] = useState({
//         fullName: address?.fullName || "",
//         mobile: address?.mobile || "",
//         email: address?.email || "",
//         addressLine1: address?.addressLine1 || "",
//         addressLine2: address?.addressLine2 || "",
//         landmark: address?.landmark || "",
//         city: address?.city || "",
//         state: address?.state || "",
//         pincode: address?.pincode || "",
//         country: address?.country || "India",
//         addressType: address?.addressType || "home",
//         isDefault: address?.isDefault || false,
//         instructions: address?.instructions || ""
//     });

//     const addressTypes = [
//         { value: "home", label: "🏠 Home" },
//         { value: "work", label: "💼 Work" },
//         { value: "other", label: "📌 Other" }
//     ];

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value
//         }));
//     };

//     const handleSubmit = (e) => {
//         e.preventDefault();
//         onSubmit(formData);
//     };

//     return (
//         <div className="address-form-modal">
//             <div className="address-form-content">
//                 <h3>{mode === "edit" ? "Edit Address" : "Add New Address"}</h3>

//                 <form onSubmit={handleSubmit}>
//                     <div className="form-grid">
//                         {/* Personal Details */}
//                         <div className="form-group">
//                             <label>Full Name *</label>
//                             <input
//                                 type="text"
//                                 name="fullName"
//                                 value={formData.fullName}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="Enter full name"
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>Mobile Number *</label>
//                             <input
//                                 type="tel"
//                                 name="mobile"
//                                 value={formData.mobile}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="10-digit mobile number"
//                                 pattern="[6-9]{1}[0-9]{9}"
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>Email</label>
//                             <input
//                                 type="email"
//                                 name="email"
//                                 value={formData.email}
//                                 onChange={handleChange}
//                                 placeholder="Enter email"
//                             />
//                         </div>

//                         {/* Address Line 1 */}
//                         <div className="form-group full-width">
//                             <label>Address Line 1 *</label>
//                             <input
//                                 type="text"
//                                 name="addressLine1"
//                                 value={formData.addressLine1}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="House/Flat No., Building, Street"
//                             />
//                         </div>

//                         {/* Address Line 2 */}
//                         <div className="form-group full-width">
//                             <label>Address Line 2</label>
//                             <input
//                                 type="text"
//                                 name="addressLine2"
//                                 value={formData.addressLine2}
//                                 onChange={handleChange}
//                                 placeholder="Area, Locality"
//                             />
//                         </div>

//                         {/* Landmark */}
//                         <div className="form-group">
//                             <label>Landmark</label>
//                             <input
//                                 type="text"
//                                 name="landmark"
//                                 value={formData.landmark}
//                                 onChange={handleChange}
//                                 placeholder="Nearby landmark"
//                             />
//                         </div>

//                         {/* City, State, Pincode */}
//                         <div className="form-group">
//                             <label>City *</label>
//                             <input
//                                 type="text"
//                                 name="city"
//                                 value={formData.city}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="City"
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>State *</label>
//                             <input
//                                 type="text"
//                                 name="state"
//                                 value={formData.state}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="State"
//                             />
//                         </div>

//                         <div className="form-group">
//                             <label>Pincode *</label>
//                             <input
//                                 type="text"
//                                 name="pincode"
//                                 value={formData.pincode}
//                                 onChange={handleChange}
//                                 required
//                                 placeholder="6-digit pincode"
//                                 pattern="[0-9]{6}"
//                             />
//                         </div>

//                         {/* Country */}
//                         <div className="form-group">
//                             <label>Country</label>
//                             <input
//                                 type="text"
//                                 name="country"
//                                 value={formData.country}
//                                 onChange={handleChange}
//                                 placeholder="Country"
//                             />
//                         </div>

//                         {/* Address Type */}
//                         <div className="form-group">
//                             <label>Address Type</label>
//                             <select
//                                 name="addressType"
//                                 value={formData.addressType}
//                                 onChange={handleChange}
//                             >
//                                 {addressTypes.map(type => (
//                                     <option key={type.value} value={type.value}>
//                                         {type.label}
//                                     </option>
//                                 ))}
//                             </select>
//                         </div>

//                         {/* Default Address Checkbox */}
//                         <div className="form-group checkbox-group">
//                             <label className="checkbox-label">
//                                 <input
//                                     type="checkbox"
//                                     name="isDefault"
//                                     checked={formData.isDefault}
//                                     onChange={handleChange}
//                                 />
//                                 <span>Set as default address</span>
//                             </label>
//                         </div>

//                         {/* Delivery Instructions */}
//                         <div className="form-group full-width">
//                             <label>Delivery Instructions</label>
//                             <textarea
//                                 name="instructions"
//                                 value={formData.instructions}
//                                 onChange={handleChange}
//                                 placeholder="Any special delivery instructions"
//                                 rows="3"
//                             />
//                         </div>
//                     </div>

//                     <div className="form-actions">
//                         <button type="submit" className="save-btn">
//                             {mode === "edit" ? "Update Address" : "Save Address"}
//                         </button>
//                         <button type="button" className="cancel-btn" onClick={onCancel}>
//                             Cancel
//                         </button>
//                     </div>
//                 </form>
//             </div>
//         </div>
//     );
// };

// Address Card Component
const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
    return (
        <div className={`address-card ${address.isDefault ? 'default' : ''}`}>
            <div className="address-header">
                <div className="address-type">
                    <span className="type-icon">
                        {address.addressType === 'home' ? '🏠' :
                            address.addressType === 'work' ? '💼' : '📌'}
                    </span>
                    <span className="type-text">{address.addressType}</span>
                    {address.isDefault && (
                        <span className="default-badge">Default</span>
                    )}
                </div>

                <div className="address-actions">
                    <button onClick={() => onEdit(address)} className="action-btn edit">
                        ✏️ Edit
                    </button>
                    <button onClick={() => onDelete(address.addressId)} className="action-btn delete">
                        🗑️ Delete
                    </button>
                </div>
            </div>

            <div className="address-body">
                <p className="address-name">{address.fullName}</p>
                <p className="address-contact">
                    📱 {address.mobile}
                    {address.email && ` | ✉️ ${address.email}`}
                </p>

                <div className="address-details">
                    <p>{address.addressLine1}</p>
                    {address.addressLine2 && <p>{address.addressLine2}</p>}
                    {address.landmark && <p><strong>Landmark:</strong> {address.landmark}</p>}
                    <p>{address.city}, {address.state} - {address.pincode}</p>
                    <p>{address.country}</p>
                </div>

                {address.instructions && (
                    <div className="address-instructions">
                        <p><strong>Delivery Instructions:</strong> {address.instructions}</p>
                    </div>
                )}

                {!address.isDefault && (
                    <button
                        onClick={() => onSetDefault(address.addressId)}
                        className="set-default-btn"
                    >
                        ⭐ Set as Default
                    </button>
                )}
            </div>
        </div>
    );
};

// Main Profile Component
const Profile = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("profile");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

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
    ];

    // Get auth token
    const getToken = () => localStorage.getItem("token");

    // Fetch user profile
    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError("");

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
                setError("Failed to load profile. Please try again.");
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
            setError("");
            setSuccess("");

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
                setSuccess("Profile updated successfully!");

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
                setError(err.response?.data?.message || "Failed to update profile.");
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
            setError("");
            setSuccess("");

            const token = getToken();
            if (!token) {
                navigate("/login");
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
                setSuccess("Password changed successfully!");
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
                setError(err.response?.data?.message || "Failed to change password.");
            }
        } finally {
            setSaving(false);
        }
    };

    // Address CRUD Operations
    const handleAddAddress = async (addressData) => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token = getToken();
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/profile/address/add`,
                addressData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccess("Address added successfully!");
                setShowAddressForm(false);
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error adding address:", err);
            setError(err.response?.data?.message || "Failed to add address.");
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateAddress = async (addressData) => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token = getToken();
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/address/update/${editingAddress.addressId}`,
                addressData,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccess("Address updated successfully!");
                setShowAddressForm(false);
                setEditingAddress(null);
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error updating address:", err);
            setError(err.response?.data?.message || "Failed to update address.");
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
            setError("");
            setSuccess("");

            const token = getToken();
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/profile/address/delete/${addressId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccess("Address deleted successfully!");
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error deleting address:", err);
            setError(err.response?.data?.message || "Failed to delete address.");
        } finally {
            setSaving(false);
        }
    };

    const handleSetDefaultAddress = async (addressId) => {
        try {
            setSaving(true);
            setError("");
            setSuccess("");

            const token = getToken();
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/profile/address/set-default/${addressId}`,
                {},
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                setSuccess("Default address updated!");
                fetchAddresses();
            }
        } catch (err) {
            console.error("Error setting default address:", err);
            setError(err.response?.data?.message || "Failed to set default address.");
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
        navigate("/login");
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
            <div className="profile-header">
                <h1>My Profile</h1>
                <button onClick={handleLogout} className="logout-btn">
                    Logout
                </button>
            </div>

            {/* Success/Error Messages */}
            {success && (
                <div className="alert success">
                    <span>✓ {success}</span>
                    <button onClick={() => setSuccess("")}>×</button>
                </div>
            )}

            {error && (
                <div className="alert error">
                    <span>⚠ {error}</span>
                    <button onClick={() => setError("")}>×</button>
                </div>
            )}

            <div className="profile-content">
                {/* Sidebar Navigation */}
                <div className="profile-sidebar">
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {profile.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="user-info">
                            <h3>{profile.name}</h3>
                            <p>{profile.email}</p>
                        </div>
                    </div>

                    <nav className="sidebar-nav">
                        <button
                            className={`nav-btn ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <span>👤</span> Personal Info
                        </button>
                        <button
                            className={`nav-btn ${activeTab === "password" ? "active" : ""}`}
                            onClick={() => setActiveTab("password")}
                        >
                            <span>🔒</span> Change Password
                        </button>
                        <button
                            className={`nav-btn ${activeTab === "addresses" ? "active" : ""}`}
                            onClick={() => setActiveTab("addresses")}
                        >
                            <span>📍</span> My Addresses
                        </button>
                        <button className="nav-btn" onClick={() => navigate("/wishlist")}>
                            <span>❤️</span> My Wishlist
                        </button>
                        <button className="nav-btn" onClick={() => navigate("/orders")}>
                            <span>📦</span> My Orders
                        </button>
                    </nav>
                </div>

                {/* Main Content */}
                <div className="profile-main">
                    {activeTab === "profile" && (
                        <form className="profile-form" onSubmit={handleProfileUpdate}>
                            <h2>Personal Information</h2>

                            <div className="form-grid">
                                <div className="form-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={profile.name}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={saving}
                                        placeholder="Enter your full name"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={profile.email}
                                        onChange={handleProfileChange}
                                        required
                                        disabled={saving}
                                        placeholder="Enter your email"
                                    />
                                    <small className="form-help">
                                        Changing email will require re-login
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="mobile">Mobile Number</label>
                                    <input
                                        type="tel"
                                        id="mobile"
                                        name="mobile"
                                        value={profile.mobile}
                                        onChange={handleProfileChange}
                                        disabled={saving}
                                        placeholder="Enter 10-digit mobile number"
                                        maxLength="10"
                                        pattern="[6-9]{1}[0-9]{9}"
                                    />
                                    <small className="form-help">
                                        Optional - 10 digit Indian number
                                    </small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="age">Age</label>
                                    <input
                                        type="number"
                                        id="age"
                                        name="age"
                                        value={profile.age}
                                        onChange={handleProfileChange}
                                        disabled={saving}
                                        placeholder="Enter your age"
                                        min="1"
                                        max="120"
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label htmlFor="gender">Gender</label>
                                    <select
                                        id="gender"
                                        name="gender"
                                        value={profile.gender}
                                        onChange={handleProfileChange}
                                        disabled={saving}
                                    >
                                        {genderOptions.map(option => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={saving}
                                >
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
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
                            <h2>Change Password</h2>
                            <p className="form-description">
                                For security, please enter your current password and then your new password.
                            </p>

                            <div className="form-group">
                                <label htmlFor="oldPassword">Current Password *</label>
                                <input
                                    type="password"
                                    id="oldPassword"
                                    name="oldPassword"
                                    value={passwords.oldPassword}
                                    onChange={handlePasswordChangeInput}
                                    required
                                    disabled={saving}
                                    placeholder="Enter current password"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="newPassword">New Password *</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    value={passwords.newPassword}
                                    onChange={handlePasswordChangeInput}
                                    required
                                    disabled={saving}
                                    placeholder="Enter new password (min 6 characters)"
                                    minLength="6"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="confirmPassword">Confirm New Password *</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    value={passwords.confirmPassword}
                                    onChange={handlePasswordChangeInput}
                                    required
                                    disabled={saving}
                                    placeholder="Re-enter new password"
                                    minLength="6"
                                />
                            </div>

                            <div className="password-requirements">
                                <h4>Password Requirements:</h4>
                                <ul>
                                    <li>Minimum 6 characters</li>
                                    <li>Use a mix of letters and numbers</li>
                                    <li>Avoid common words or patterns</li>
                                </ul>
                            </div>

                            <div className="form-actions">
                                <button
                                    type="submit"
                                    className="save-btn"
                                    disabled={saving}
                                >
                                    {saving ? "Changing Password..." : "Change Password"}
                                </button>
                                <button
                                    type="button"
                                    className="cancel-btn"
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
                            <div className="addresses-header">
                                <h2>My Addresses</h2>
                                <button
                                    className="add-address-btn"
                                    onClick={() => setShowAddressForm(true)}
                                    disabled={saving}
                                >
                                    ＋ Add New Address
                                </button>
                            </div>

                            {showAddressForm && (
                                <AddressForm
                                    address={editingAddress}
                                    onSubmit={handleSubmitAddress}
                                    onCancel={handleCancelAddressForm}
                                    mode={editingAddress ? 'edit' : 'add'}
                                />
                            )}

                            {addresses.length === 0 && !showAddressForm ? (
                                <div className="no-addresses">
                                    <div className="empty-state">
                                        <span className="empty-icon">📍</span>
                                        <h3>No addresses saved</h3>
                                        <p>Add your first address to make checkout faster!</p>
                                        <button
                                            className="add-first-btn"
                                            onClick={() => setShowAddressForm(true)}
                                        >
                                            Add Your First Address
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="addresses-list">
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
                                    <p>Total addresses: {addresses.length}</p>
                                    <p>Default address: {addresses.find(a => a.isDefault)?.city || "Not set"}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Profile;