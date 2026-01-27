import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CartSidebar.scss";
import { FiShoppingBag } from "react-icons/fi";

const CartSidebar = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    subtotal: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const navigate = useNavigate();

  // Fetch cart when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchCart();
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Listen for cart updates
  useEffect(() => {
    const handleCartUpdate = () => {
      if (isOpen) fetchCart();
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => {
      window.removeEventListener("cartUpdated", handleCartUpdate);
    };
  }, [isOpen]);

  // Fetch cart data
  const fetchCart = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const items = res.data.cartItems || [];
      setCartItems(items);
      calculateSummary(items, res.data.summary);
    } catch (err) {
      console.error("Error fetching cart:", err);
    } finally {
      setLoading(false);
    }
  };

  // Calculate summary
  const calculateSummary = (items, apiSummary) => {
    const subtotal =
      apiSummary?.subtotal ||
      items.reduce((sum, i) => sum + (i.totalPrice || 0), 0);

    const shipping = subtotal > 1000 ? 0 : 120;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;

    setCartSummary({
      totalItems: items.reduce((s, i) => s + (i.quantity || 0), 0),
      subtotal,
      shipping,
      tax,
      total
    });
  };

  // Update quantity
  const updateQuantity = async (itemId, qty) => {
    if (qty < 1 || qty > 99) return;

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token) return;

    try {
      setUpdatingItem(itemId);

      await axios.put(
        `${import.meta.env.VITE_API_URL}/cart/update/${itemId}`,
        { quantity: qty, userId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = cartItems.map((item) =>
        item._id === itemId
          ? {
            ...item,
            quantity: qty,
            totalPrice: (item.finalPrice || item.unitPrice) * qty
          }
          : item
      );

      setCartItems(updated);
      calculateSummary(updated);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error updating quantity:", err);
    } finally {
      setUpdatingItem(null);
    }
  };

  // Remove item
  const removeItem = async (itemId) => {
    const token = localStorage.getItem("token");

    if (!token) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/cart/remove/${itemId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updated = cartItems.filter((i) => i._id !== itemId);
      setCartItems(updated);
      calculateSummary(updated);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error("Error removing item:", err);
    }
  };

  // Handle checkout
  const proceedToCheckout = () => {
    if (cartItems.length === 0) return;

    const checkoutCartData = {
      items: cartItems.map((item) => ({
        _id: item._id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        finalPrice: item.finalPrice,
        totalPrice: item.totalPrice,
        selectedModel: item.selectedModel || null,
        selectedColor: item.selectedColor || null,
        selectedFragrance: item.selectedFragrance || null,
        selectedSize: item.selectedSize || null,
        thumbnailImage: item.selectedColor?.images?.[0] || item.thumbnailImage || null
      })),
      summary: cartSummary,
      userId: localStorage.getItem("userId"),
      totalItems: cartSummary.totalItems,
      grandTotal: cartSummary.total
    };

    navigate("/checkout", {
      state: { cartMode: true, cartData: checkoutCartData }
    });
    onClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="cart-sidebar-overlay" onClick={onClose}></div>

      {/* Sidebar */}
      <div className="cart-sidebar">
        {/* Header */}
        <div className="cart-sidebar-header">
          <h2>My Cart</h2>
          <button className="close-sidebar-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        {/* Scrollable Product List */}
        <div className="cart-sidebar-content">
          {loading ? (
            <div className="sidebar-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart-sidebar">
              <div className="empty-icon">
                <FiShoppingBag size={50} />
              </div>
              <p>Your cart is empty</p>
              <p className="empty-subtext">Add items to see them here</p>
            </div>
          ) : (
            <div className="cart-items-container">
              {cartItems.map((item) => (
                <div className="cart-sidebar-item" key={item._id}>
                  <img
                    src={
                      item.selectedColor?.images?.[0] ||
                      item.thumbnailImage ||
                      "https://via.placeholder.com/80x80?text=No+Image"
                    }
                    alt={item.productName}
                    onClick={() => {
                      navigate(`/product/${item.productId}`);
                      onClose();
                    }}
                  />
                  <div className="item-details">
                    <h4 onClick={() => {
                      navigate(`/product/${item.productId}`);
                      onClose();
                    }}>
                      {item.productName}
                    </h4>
                    
                    {item.selectedFragrance && (
                      <p className="fragrance">Fragrance: {item.selectedFragrance}</p>
                    )}

                    <div className="variants">
                      {item.selectedModel && (
                        <span>Model: {item.selectedModel.modelName}</span>
                      )}
                      {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                    </div>

                    <div className="price-row">
                      <span className="price">₹{item.finalPrice || item.unitPrice}</span>
                      {item.unitPrice && item.unitPrice > (item.finalPrice || item.unitPrice) && (
                        <span className="old-price">₹{item.unitPrice}</span>
                      )}
                    </div>

                    <div className="qty-controls">
                      <div className="qty">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          disabled={updatingItem === item._id || item.quantity <= 1}
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          disabled={updatingItem === item._id || item.quantity >= 99}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    className="remove-item-btn"
                    onClick={() => removeItem(item._id)}
                    disabled={updatingItem === item._id}
                    title="Remove"
                  >
                    {updatingItem === item._id ? "⏳" : "×"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Summary Section */}
        <div className="cart-sidebar-summary">
          <div className="summary-row">
            <span>Total Items</span>
            <span>{cartSummary.totalItems}</span>
          </div>

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{cartSummary.subtotal.toLocaleString()}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>
              {cartSummary.shipping === 0 ? "FREE" : `₹${cartSummary.shipping}`}
            </span>
          </div>

          <div className="summary-row">
            <span>Tax (18%)</span>
            <span>₹{cartSummary.tax.toFixed(0)}</span>
          </div>

          <div className="summary-row total">
            <span>Estimated Total</span>
            <span>₹{cartSummary.total.toLocaleString()}</span>
          </div>

          <button
            className="checkout-btn"
            onClick={proceedToCheckout}
            disabled={cartItems.length === 0}
          >
            CHECKOUT
          </button>

          <button
            className="view-cart-btn"
            onClick={() => {
              navigate("/cart");
              onClose();
            }}
          >
            VIEW FULL CART
          </button>
        </div>
      </div>
    </>
  );
};

export default CartSidebar;