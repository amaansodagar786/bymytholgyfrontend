import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiCheck,
  FiPackage,
  FiMapPin,
  FiCreditCard,
  FiTruck,
  FiTag,
  FiShoppingBag,
  FiHome,
  FiBriefcase,
  FiMap,
  FiEdit2,
  FiChevronLeft,
  FiChevronRight,
  FiArrowLeft,
  FiPlus,
  FiMinus
} from 'react-icons/fi';
import { IoCashOutline, IoCardOutline } from 'react-icons/io5';
import { MdOutlineLocalShipping } from 'react-icons/md';
import './Checkout.scss';
import AddressForm from './Address/AddressForm';

// Add this import with other imports
import LoginModal from "../../Components/Login/LoginModel/LoginModal"; // Adjust path as needed

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingQuantity, setUpdatingQuantity] = useState({});

  // Refs for scrolling to step
  const stepRef = useRef(null);
  const [filledSteps, setFilledSteps] = useState([1]); // Track filled steps for line animation
  const [showLoginModal, setShowLoginModal] = useState(false); // ← ADD THIS STATE



  // Cart Data
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0,
    totalItems: 0,
    totalSavings: 0
  });

  // Address Data
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  // User Data
  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  const [checkoutMode, setCheckoutMode] = useState('cart');
  const [buyNowData, setBuyNowData] = useState(null);

  // Step Names
  const steps = [
    { number: 1, name: 'Review', icon: <FiPackage />, fullName: 'Review Order' },
    { number: 2, name: 'Address', icon: <FiMapPin />, fullName: 'Select Address' },
    { number: 3, name: 'Payment', icon: <FiCreditCard />, fullName: 'Payment' }
  ];

  // Scroll to step when changed
  useEffect(() => {
    if (stepRef.current) {
      const offset = 300;
      const elementPosition = stepRef.current.offsetTop - offset;

      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      });
    }
  }, [currentStep]);

  // Update filled steps based on current step
  useEffect(() => {
    if (currentStep > 1 && !filledSteps.includes(currentStep - 1)) {
      setFilledSteps(prev => [...prev, currentStep - 1]);
    }
  }, [currentStep]);

  // ==================== INITIAL DATA FETCHING ====================
  useEffect(() => {
    if (!token || !userId) {
      setShowLoginModal(true);
      return;
    }

    if (location.state && location.state.buyNowMode) {
      setCheckoutMode('buy-now');
      setBuyNowData(location.state.productData);
      processBuyNowData(location.state.productData);
    } else if (location.state && location.state.cartMode) {
      setCheckoutMode('cart');
      setCartItems(location.state.cartData.items);
      setCartSummary(location.state.cartData.summary);
      fetchAddresses();
      setLoading(false);
    } else {
      setCheckoutMode('cart');
      fetchCartData();
      fetchAddresses();
    }
  }, [location.state]);

  // Process Buy Now data
  const processBuyNowData = async (productData) => {
    try {
      setLoading(true);

      const enhancedProductData = {
        ...productData,
        selectedFragrance: productData.selectedFragrance || null
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/buynow/create-checkout-session`,
        enhancedProductData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setCartItems(response.data.checkoutSession.cartItems);
        setCartSummary(response.data.summary);
      }

      await fetchAddresses();

    } catch (error) {
      console.error('Error processing Buy Now:', error);
      toast.error('Failed to process Buy Now. Please try again.');
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cart data
  const fetchCartData = async () => {
    try {
      setLoading(true);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.cartItems) {
        setCartItems(response.data.cartItems);
        calculateCartSummary(response.data.cartItems, response.data.summary);
      }
    } catch (error) {
      console.error('❌ Error fetching cart:', error);
      toast.error('Failed to load cart. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch user addresses
  const fetchAddresses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/profile/addresses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setAddresses(response.data.addresses);

        const defaultAddress = response.data.addresses.find(addr => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddress(defaultAddress);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching addresses:', error);
    }
  };

  // Calculate cart summary
  const calculateCartSummary = (items, apiSummary) => {
    const subtotal = items.reduce((sum, item) => sum + (item.finalPrice * item.quantity), 0);
    const totalSavings = items.reduce((sum, item) => {
      if (item.hasOffer && item.offerDetails?.savedAmount) {
        return sum + (item.offerDetails.savedAmount * item.quantity);
      }
      return sum;
    }, 0);
    const shipping = subtotal > 1000 ? 0 : 50;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    setCartSummary({
      subtotal,
      totalSavings,
      shipping,
      tax,
      total,
      totalItems
    });
  };

  // ==================== QUANTITY UPDATE FUNCTIONS ====================
  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    setUpdatingQuantity(prev => ({ ...prev, [itemId]: true }));

    try {
      const item = cartItems.find(item => item._id === itemId);
      if (!item) return;

      // Check inventory stock before allowing quantity increase
      if (newQuantity > item.quantity) {
        // User is increasing quantity - check inventory
        const inventoryResponse = await axios.get(
          `${import.meta.env.VITE_API_URL}/inventory/product/${item.productId}/status`,
          {
            params: {
              colorId: item.selectedColor?.colorId || "Default",
              fragrance: item.selectedFragrance || "Default"
            },
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        const availableStock = inventoryResponse.data.stock;

        // User-friendly error message (don't show exact numbers)
        if (availableStock < newQuantity) {
          if (availableStock === 0) {
            toast.error('This item is currently out of stock!');
          } else {
            toast.error('Not enough stock available for this item!');
          }
          setUpdatingQuantity(prev => ({ ...prev, [itemId]: false }));
          return;
        }
      }

      // Update local state only (no API call, no success toast)
      setCartItems(prev => prev.map(item =>
        item._id === itemId ? {
          ...item,
          quantity: newQuantity,
          totalPrice: item.finalPrice * newQuantity
        } : item
      ));

      // Recalculate summary
      setTimeout(() => {
        const updatedItems = cartItems.map(item =>
          item._id === itemId ? {
            ...item,
            quantity: newQuantity,
            totalPrice: item.finalPrice * newQuantity
          } : item
        );
        calculateCartSummary(updatedItems, cartSummary);
      }, 100);

      // ❌ NO SUCCESS TOAST HERE ❌

    } catch (error) {
      console.error('Error checking inventory:', error);
      // Still allow quantity change but show generic warning
      toast.warning('Unable to check stock availability');

      // Update local state anyway
      setCartItems(prev => prev.map(item =>
        item._id === itemId ? {
          ...item,
          quantity: newQuantity,
          totalPrice: item.finalPrice * newQuantity
        } : item
      ));

      setTimeout(() => {
        const updatedItems = cartItems.map(item =>
          item._id === itemId ? {
            ...item,
            quantity: newQuantity,
            totalPrice: item.finalPrice * newQuantity
          } : item
        );
        calculateCartSummary(updatedItems, cartSummary);
      }, 100);

    } finally {
      setUpdatingQuantity(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const incrementQuantity = (itemId) => {
    const item = cartItems.find(item => item._id === itemId);
    if (item) {
      handleQuantityChange(itemId, item.quantity + 1);
    }
  };

  const decrementQuantity = (itemId) => {
    const item = cartItems.find(item => item._id === itemId);
    if (item && item.quantity > 1) {
      handleQuantityChange(itemId, item.quantity - 1);
    }
  };

  // ==================== ADDRESS MANAGEMENT ====================
  const handleAddAddress = async (addressData) => {
    try {
      setSaving(true);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/profile/address/add`,
        addressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchAddresses();
        setSelectedAddress(response.data.address);
        setShowAddressForm(false);
        toast.success('Address added successfully!');
      }
    } catch (error) {
      console.error('❌ Error adding address:', error);
      toast.error(error.response?.data?.message || 'Failed to add address');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateAddress = async (addressData) => {
    try {
      setSaving(true);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/profile/address/update/${editingAddress.addressId}`,
        addressData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        await fetchAddresses();
        if (selectedAddress?.addressId === editingAddress.addressId) {
          setSelectedAddress(response.data.address);
        }
        setShowAddressForm(false);
        setEditingAddress(null);
        toast.success('Address updated successfully!');
      }
    } catch (error) {
      console.error('❌ Error updating address:', error);
      toast.error(error.response?.data?.message || 'Failed to update address');
    } finally {
      setSaving(false);
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowAddressForm(true);
  };

  const handleCancelAddressForm = () => {
    setShowAddressForm(false);
    setEditingAddress(null);
  };

  const handleSubmitAddress = (addressData) => {
    if (editingAddress) {
      handleUpdateAddress(addressData);
    } else {
      handleAddAddress(addressData);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddress(address);
  };

  // ==================== STEP NAVIGATION ====================
  const goToNextStep = () => {
    if (currentStep === 2 && !selectedAddress) {
      toast.warning('Please select or add a delivery address');
      return;
    }

    // Mark current step as filled when moving to next
    if (!filledSteps.includes(currentStep)) {
      setFilledSteps(prev => [...prev, currentStep]);
    }

    setCurrentStep(prev => Math.min(prev + 1, 3));
  };

  const goToPrevStep = () => {
    if (currentStep === 1) {
      navigate('/cart');
    } else {
      setCurrentStep(prev => Math.max(prev - 1, 1));
    }
  };

  // ==================== ORDER CREATION ====================
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.warning('Please select a delivery address');
      setCurrentStep(2);
      return;
    }

    try {
      setSaving(true);

      const orderData = {
        userId,
        checkoutMode,
        items: cartItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          finalPrice: item.finalPrice,
          totalPrice: item.totalPrice,
          selectedColor: item.selectedColor,
          selectedFragrance: item.selectedFragrance || null,
          selectedSize: item.selectedSize,
          selectedModel: item.selectedModel,
          hasOffer: item.hasOffer,
          offerDetails: item.offerDetails,
          thumbnailImage: item.selectedColor?.images?.[0] || item.thumbnailImage
        })),
        address: selectedAddress,
        paymentMethod: 'cod'
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/orders/create`,
        orderData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        toast.success(
          <div>
            <p style={{ fontWeight: 'bold', marginBottom: '8px' }}>✅ Order Placed Successfully!</p>
            <p>Order ID: {response.data.order.orderId}</p>
            <p>Total: ₹{response.data.order.pricing.total.toLocaleString()}</p>
          </div>,
          {
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          }
        );

        window.dispatchEvent(new Event('cartUpdated'));

        // Navigate after toast
        setTimeout(() => {
          navigate('/orders', {
            state: {
              orderSuccess: true,
              orderId: response.data.order.orderId,
              orderTotal: response.data.order.pricing.total
            }
          });
        }, 2000);
      } else {
        throw new Error(response.data.message || 'Failed to place order');
      }

    } catch (error) {
      console.error('❌ Error placing order:', error);
      let errorMessage = 'Failed to place order. Please try again.';

      if (error.response) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        }
        if (error.response.status === 400) {
          if (error.response.data.message.includes('Insufficient stock')) {
            errorMessage = 'Some items are out of stock. Please update your cart.';
            if (checkoutMode === 'cart') {
              await fetchCartData();
            }
          }
        }
      }
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // ==================== RENDER FUNCTIONS ====================

  // Render Product Review Step - UPDATED WITH QUANTITY CONTROLS
  const renderReviewStep = () => (
    <div className="checkout-step" ref={stepRef}>
      <div className="step-header">
        <div className="step-icon-wrapper">
          <FiPackage className="step-icon" />
        </div>
        <h2>Review Your Order</h2>
      </div>

      <div className="order-items">
        {cartItems.map(item => (
          <div key={item._id} className="order-item">
            <div className="item-image">
              <img
                src={item.selectedColor?.images?.[0] || item.thumbnailImage || "https://via.placeholder.com/100x100"}
                alt={item.productName}
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/100x100";
                }}
              />
            </div>

            <div className="item-details">
              <h4 className="item-name">{item.productName}</h4>

              <div className="item-variants">
                {/* {item.selectedModel && (
                  <span className="variant-chip">
                    <FiShoppingBag size={12} /> {item.selectedModel.modelName}
                  </span>
                )}
                {item.selectedColor && (
                  <span className="variant-chip">
                    <FiTag size={12} /> {item.selectedColor.colorName}
                  </span>
                )} */}
                {item.selectedFragrance && (
                  <span className="variant-chip fragrance">
                    Fragrance : {item.selectedFragrance}
                  </span>
                )}
                {item.selectedSize && (
                  <span className="variant-chip">Size: {item.selectedSize}</span>
                )}
              </div>

              <div className="item-quantity-price">
                <div className="quantity-controls">
                  <button
                    className="quantity-btn minus"
                    onClick={() => decrementQuantity(item._id)}
                    disabled={item.quantity <= 1 || updatingQuantity[item._id]}
                  >
                    <FiMinus size={14} />
                  </button>
                  <span className="quantity-display">
                    {updatingQuantity[item._id] ? (
                      <span className="quantity-loading"></span>
                    ) : (
                      item.quantity
                    )}
                  </span>
                  <button
                    className="quantity-btn plus"
                    onClick={() => incrementQuantity(item._id)}
                    disabled={updatingQuantity[item._id]}
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                <div className="price-wrapper">
                  <span className="price">
                    ₹{(item.finalPrice * item.quantity).toLocaleString()}
                  </span>
                  {item.hasOffer && (
                    <span className="original-price">
                      ₹{(item.unitPrice * item.quantity).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {item.hasOffer && item.offerDetails && (
                <div className="offer-label">
                  <FiTag size={14} /> {item.offerDetails.offerLabel} ({item.offerDetails.offerPercentage}% OFF)
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="order-summary-checkout">
        <h3 className="summary-title">Order Summary</h3>

        <div className="summary-content">
          <div className="summary-row">
            <span>Subtotal ({cartSummary.totalItems} items)</span>
            <span>₹{cartSummary.subtotal.toLocaleString()}</span>
          </div>

          {cartSummary.totalSavings > 0 && (
            <div className="summary-row discount">
              <span>Total Savings</span>
              <span className="savings">-₹{cartSummary.totalSavings.toLocaleString()}</span>
            </div>
          )}

          <div className="summary-row">
            <span>Shipping</span>
            <span className={cartSummary.shipping === 0 ? 'free' : ''}>
              {cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping}`}
            </span>
          </div>

          <div className="summary-row">
            <span>Tax (GST 18%)</span>
            <span>₹{cartSummary.tax.toLocaleString()}</span>
          </div>

          <div className="summary-row total">
            <span>Total Amount</span>
            <span className="total-amount">₹{cartSummary.total.toLocaleString()}</span>
          </div>

          {cartSummary.subtotal < 1000 && (
            <div className="free-shipping-note">
              <MdOutlineLocalShipping size={16} /> Add ₹{(1000 - cartSummary.subtotal).toLocaleString()} more for FREE shipping!
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Render Address Selection Step
  const renderAddressStep = () => (
    <div className="checkout-step address-step" ref={stepRef}>
      <div className="step-header">
        <div className="step-icon-wrapper">
          <FiMapPin className="step-icon" />
        </div>
        <h2>Select Delivery Address</h2>
      </div>

      <div className="address-step-container">
        {/* Left Side - Selected Address Preview */}
        {selectedAddress && (
          <div className="selected-address-section">
            <h3 className="section-subtitle">
              <FiCheck className="check-icon" /> Selected Address
            </h3>
            <div className="address-preview compact">
              <div className="address-header">
                <div className="address-name-mobile">
                  <p><strong>{selectedAddress.fullName}</strong></p>
                  <p>📱 {selectedAddress.mobile}</p>
                </div>
                {selectedAddress.isDefault && (
                  <span className="default-badge">Default</span>
                )}
              </div>
              <div className="address-details">
                <p>{selectedAddress.addressLine1}</p>
                {selectedAddress.addressLine2 && <p>{selectedAddress.addressLine2}</p>}
                <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
              </div>
            </div>
          </div>
        )}

        {/* Right Side - Address Options */}
        <div className="address-options-section">
          <h3 className="section-subtitle">Choose from saved addresses:</h3>

          {addresses.length === 0 ? (
            <div className="no-addresses">
              <div className="empty-state">
                <FiMap size={32} className="empty-icon" />
                <p>No addresses saved. Please add a delivery address.</p>
              </div>
            </div>
          ) : (
            <div className="address-options-list compact">
              {addresses.map(address => (
                <div
                  key={address.addressId}
                  className={`address-option-card ${selectedAddress?.addressId === address.addressId ? 'selected' : ''}`}
                  onClick={() => handleSelectAddress(address)}
                >
                  <div className="address-option-header">
                    <div className="address-radio">
                      <input
                        type="radio"
                        name="selectedAddress"
                        checked={selectedAddress?.addressId === address.addressId}
                        onChange={() => handleSelectAddress(address)}
                      />
                    </div>
                    <div className="address-option-title">
                      <h4>{address.fullName}</h4>
                      <div className="address-badges">
                        {address.isDefault && (
                          <span className="default-badge">Default</span>
                        )}
                        <span className="address-type-badge">
                          {address.addressType === 'home' ? <FiHome size={10} /> :
                            address.addressType === 'work' ? <FiBriefcase size={10} /> :
                              <FiMap size={10} />}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="address-option-content">
                    <p className="address-contact">📱 {address.mobile}</p>
                    <div className="address-details">
                      <p>{address.addressLine1}</p>
                      <p>{address.city}, {address.state}</p>
                    </div>
                    <div className="address-actions">
                      <button
                        className="edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditAddress(address);
                        }}
                      >
                        <FiEdit2 size={12} /> Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="add-address-section">
            <button
              className="add-address-btn"
              onClick={() => setShowAddressForm(true)}
              disabled={saving}
            >
              <FiMapPin size={14} /> Add New Address
            </button>
            <p className="add-address-note">
              {addresses.length === 0
                ? "Add your first delivery address"
                : "Add a new address"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  // Render Payment Step
  const renderPaymentStep = () => (
    <div className="checkout-step payment-step" ref={stepRef}>
      <div className="step-header">
        <div className="step-icon-wrapper">
          <FiCreditCard className="step-icon" />
        </div>
        <h2>Payment Method</h2>
      </div>

      <div className="payment-methods-grid">
        <div className="payment-method-card selected">
          <div className="method-header">
            <input
              type="radio"
              id="cod"
              name="payment"
              defaultChecked
              readOnly
            />
            <label htmlFor="cod">
              <div className="method-icon-wrapper">
                <IoCashOutline className="method-icon" />
              </div>
              <div className="method-info">
                <span className="method-name">Cash on Delivery</span>
                <span className="method-desc">Pay when you receive</span>
              </div>
            </label>
          </div>
          <div className="method-features">
            <span>✅ No online payment required</span>
            <span>✅ Pay to delivery executive</span>
          </div>
        </div>

        <div className="payment-method-card disabled">
          <div className="method-header">
            <input type="radio" id="card" name="payment" disabled />
            <label htmlFor="card">
              <div className="method-icon-wrapper">
                <IoCardOutline className="method-icon" />
              </div>
              <div className="method-info">
                <span className="method-name">Credit/Debit Card</span>
                <span className="method-desc">Coming Soon</span>
              </div>
            </label>
          </div>
        </div>

        <div className="payment-method-card disabled">
          <div className="method-header">
            <input type="radio" id="upi" name="payment" disabled />
            <label htmlFor="upi">
              <div className="method-icon-wrapper">
                <span className="method-icon">📱</span>
              </div>
              <div className="method-info">
                <span className="method-name">UPI</span>
                <span className="method-desc">Coming Soon</span>
              </div>
            </label>
          </div>
        </div>
      </div>

      <div className="order-confirmation">
        <h3 className="confirmation-title">Order Confirmation</h3>

        <div className="confirmation-content">
          <div className="delivery-address-section">
            <p className="section-label"><strong>Delivery Address:</strong></p>
            {selectedAddress ? (
              <div className="selected-address-summary">
                <div className="address-summary-header">
                  <p><strong>{selectedAddress.fullName}</strong></p>
                  <p>📱 {selectedAddress.mobile}</p>
                </div>
                <p>{selectedAddress.addressLine1}</p>
                <p>{selectedAddress.city}, {selectedAddress.state} - {selectedAddress.pincode}</p>
              </div>
            ) : (
              <p className="error">⚠️ No address selected</p>
            )}
          </div>

          <div className="order-summary-final">
            <div className="summary-row">
              <span>Items Total:</span>
              <span>₹{cartSummary.subtotal.toLocaleString()}</span>
            </div>
            <div className="summary-row">
              <span>Shipping:</span>
              <span className={cartSummary.shipping === 0 ? 'free' : ''}>
                {cartSummary.shipping === 0 ? 'FREE' : `₹${cartSummary.shipping}`}
              </span>
            </div>
            <div className="summary-row">
              <span>Tax (18% GST):</span>
              <span>₹{cartSummary.tax.toLocaleString()}</span>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <span className="total-price">₹{cartSummary.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="payment-info">
            <p><IoCashOutline size={16} /> <strong>Payment on Delivery:</strong> ₹{cartSummary.total.toLocaleString()}</p>
            <p><FiTruck size={16} /> <strong>Delivery:</strong> 3-7 business days</p>
          </div>
        </div>
      </div>
    </div>
  );

  // ==================== MAIN RENDER ====================
  if (!token || !userId) {
    return (
      <div className="checkout-page">
        <ToastContainer position="top-right" />
        <div className="login-required">
          <h2>Login Required</h2>
          <p>Please login to proceed with checkout.</p>
          {/* CHANGED: onClick opens modal instead of navigate */}
          <button onClick={() => setShowLoginModal(true)} className="auth-btn">
            Go to Login
          </button>
        </div>

        {/* ADD LoginModal component */}
        {showLoginModal && (
          <LoginModal
            onClose={() => {
              setShowLoginModal(false);
              // After login, check if user has token
              const token = localStorage.getItem('token');
              const userId = localStorage.getItem('userId');
              if (token && userId) {
                // User logged in, reload the checkout
                window.location.reload();
              }
            }}
            showRegisterLink={true}
          />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="checkout-page">
        <ToastContainer position="top-right" />
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <ToastContainer position="top-right" />
        <div className="empty-checkout">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some items to your cart before checkout.</p>
          <button onClick={() => navigate('/products')} className="continue-shopping-btn">
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <ToastContainer
        position="top-right"
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

      {/* Progress Indicator - UPDATED WITH ANIMATED LINES */}
      <div className="checkout-progress">
        {steps.map(step => {
          const isFilled = filledSteps.includes(step.number);
          const isActive = currentStep >= step.number;

          return (
            <div
              key={step.number}
              className={`progress-step ${isActive ? 'active' : ''} ${currentStep === step.number ? 'current' : ''}`}
              onClick={() => currentStep > step.number && setCurrentStep(step.number)}
            >
              <div className="step-circle">
                <div className="step-number">
                  {currentStep > step.number ? <FiCheck size={16} /> : step.number}
                </div>
                <div className="step-icon">{step.icon}</div>
              </div>
              <div className="step-info">
                <div className="step-name">{step.name}</div>
                <div className="step-full-name">{step.fullName}</div>
              </div>
              {step.number < 3 && (
                <div className="step-connector">
                  <div
                    className={`connector-fill ${isFilled ? 'filled' : ''}`}
                    style={{
                      transitionDelay: `${step.number * 0.1}s`,
                      width: isFilled ? '100%' : '0%'
                    }}
                  ></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Main Content */}
      <div className="checkout-content">
        {currentStep === 1 && renderReviewStep()}
        {currentStep === 2 && renderAddressStep()}
        {currentStep === 3 && renderPaymentStep()}
      </div>

      {/* Navigation Buttons */}
      <div className="checkout-navigation">
        <button className="back-btn" onClick={goToPrevStep}>
          <FiChevronLeft size={18} />
          {currentStep === 1 ? 'Back to Cart' : 'Back'}
        </button>

        <div className="step-indicator">
          Step {currentStep} of 3
        </div>

        {currentStep < 3 ? (
          <button className="next-btn" onClick={goToNextStep}>
            Continue to {currentStep === 1 ? 'Address' : 'Payment'}
            <FiChevronRight size={18} />
          </button>
        ) : (
          <button
            className="place-order-btn"
            onClick={handlePlaceOrder}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="loading-spinner-small"></span>
                Processing...
              </>
            ) : (
              'Place Order'
            )}
          </button>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && (
        <AddressForm
          address={editingAddress}
          onSubmit={handleSubmitAddress}
          onCancel={handleCancelAddressForm}
          mode={editingAddress ? 'edit' : 'add'}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
            const token = localStorage.getItem('token');
            const userId = localStorage.getItem('userId');
            if (token && userId) {
              window.location.reload();
            }
          }}
          showRegisterLink={true}
        />
      )}




    </div>
  );
};

export default Checkout;