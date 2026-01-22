// components/AddressForm.jsx - Premium Styled Version
import React, { useState } from 'react';
import { FaHome, FaBriefcase, FaMapMarkerAlt, FaTimes } from 'react-icons/fa';
import './AddressForm.scss';

const AddressForm = ({ address, onSubmit, onCancel, mode = "add" }) => {
  const [formData, setFormData] = useState({
    fullName: address?.fullName || "",
    mobile: address?.mobile || "",
    email: address?.email || "",
    addressLine1: address?.addressLine1 || "",
    addressLine2: address?.addressLine2 || "",
    landmark: address?.landmark || "",
    city: address?.city || "",
    state: address?.state || "",
    pincode: address?.pincode || "",
    country: address?.country || "India",
    addressType: address?.addressType || "home",
    isDefault: address?.isDefault || false,
    instructions: address?.instructions || ""
  });

  const addressTypes = [
    { value: "home", label: "Home", icon: <FaHome /> },
    { value: "work", label: "Work", icon: <FaBriefcase /> },
    { value: "other", label: "Other", icon: <FaMapMarkerAlt /> }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="address-form-modal">
      <div className="address-form-content">
        <div className="form-header">
          <h3 className="form-title">{mode === "edit" ? "Edit Address" : "Add New Address"}</h3>
          <button type="button" className="close-btn" onClick={onCancel}>
            <FaTimes />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Personal Details */}
            <div className="form-group">
              <label className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter full name"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Mobile Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
                pattern="[6-9]{1}[0-9]{9}"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
                className="form-input"
              />
            </div>

            {/* Address Line 1 */}
            <div className="form-group full-width">
              <label className="form-label">
                Address Line 1 <span className="required">*</span>
              </label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                required
                placeholder="House/Flat No., Building, Street"
                className="form-input"
              />
            </div>

            {/* Address Line 2 */}
            <div className="form-group full-width">
              <label className="form-label">
                Address Line 2
              </label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Area, Locality"
                className="form-input"
              />
            </div>

            {/* Landmark */}
            <div className="form-group">
              <label className="form-label">
                Landmark
              </label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="Nearby landmark"
                className="form-input"
              />
            </div>

            {/* City, State, Pincode */}
            <div className="form-group">
              <label className="form-label">
                City <span className="required">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="City"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                State <span className="required">*</span>
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="State"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                Pincode <span className="required">*</span>
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="6-digit pincode"
                pattern="[0-9]{6}"
                className="form-input"
              />
            </div>

            {/* Country */}
            <div className="form-group">
              <label className="form-label">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                className="form-input"
                defaultValue="India"
              />
            </div>

            {/* Address Type */}
            <div className="form-group">
              <label className="form-label">
                Address Type
              </label>
              <div className="address-type-selector">
                {addressTypes.map(type => (
                  <label
                    key={type.value}
                    className={`type-option ${formData.addressType === type.value ? 'active' : ''}`}
                  >
                    <input
                      type="radio"
                      name="addressType"
                      value={type.value}
                      checked={formData.addressType === type.value}
                      onChange={handleChange}
                      className="type-radio"
                    />
                    <span className="type-icon">{type.icon}</span>
                    <span className="type-label">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Default Address Checkbox */}
            <div className="form-group checkbox-group full-width">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                  className="checkbox-input"
                />
                <span className="checkbox-custom"></span>
                <span className="checkbox-text">Set as default address</span>
              </label>
            </div>

            {/* Delivery Instructions */}
            <div className="form-group full-width">
              <label className="form-label">
                Delivery Instructions
              </label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Any special delivery instructions (optional)"
                rows="3"
                className="form-textarea"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn primary-btn">
              {mode === "edit" ? "Update Address" : "Save Address"}
            </button>
            <button type="button" className="cancel-btn secondary-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;