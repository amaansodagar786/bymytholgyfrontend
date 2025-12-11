// components/AddressForm.jsx
import React, { useState } from 'react';
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
    { value: "home", label: "🏠 Home" },
    { value: "work", label: "💼 Work" },
    { value: "other", label: "📌 Other" }
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
        <h3>{mode === "edit" ? "Edit Address" : "Add New Address"}</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Personal Details */}
            <div className="form-group">
              <label>Full Name *</label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
                placeholder="Enter full name"
              />
            </div>

            <div className="form-group">
              <label>Mobile Number *</label>
              <input
                type="tel"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                required
                placeholder="10-digit mobile number"
                pattern="[6-9]{1}[0-9]{9}"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email"
              />
            </div>

            {/* Address Line 1 */}
            <div className="form-group full-width">
              <label>Address Line 1 *</label>
              <input
                type="text"
                name="addressLine1"
                value={formData.addressLine1}
                onChange={handleChange}
                required
                placeholder="House/Flat No., Building, Street"
              />
            </div>

            {/* Address Line 2 */}
            <div className="form-group full-width">
              <label>Address Line 2</label>
              <input
                type="text"
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleChange}
                placeholder="Area, Locality"
              />
            </div>

            {/* Landmark */}
            <div className="form-group">
              <label>Landmark</label>
              <input
                type="text"
                name="landmark"
                value={formData.landmark}
                onChange={handleChange}
                placeholder="Nearby landmark"
              />
            </div>

            {/* City, State, Pincode */}
            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label>State *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                required
                placeholder="State"
              />
            </div>

            <div className="form-group">
              <label>Pincode *</label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                required
                placeholder="6-digit pincode"
                pattern="[0-9]{6}"
              />
            </div>

            {/* Country */}
            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="Country"
                defaultValue="India"
              />
            </div>

            {/* Address Type */}
            <div className="form-group">
              <label>Address Type</label>
              <select
                name="addressType"
                value={formData.addressType}
                onChange={handleChange}
              >
                {addressTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Default Address Checkbox */}
            <div className="form-group checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={formData.isDefault}
                  onChange={handleChange}
                />
                <span>Set as default address</span>
              </label>
            </div>

            {/* Delivery Instructions */}
            <div className="form-group full-width">
              <label>Delivery Instructions</label>
              <textarea
                name="instructions"
                value={formData.instructions}
                onChange={handleChange}
                placeholder="Any special delivery instructions"
                rows="3"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">
              {mode === "edit" ? "Update Address" : "Save Address"}
            </button>
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;