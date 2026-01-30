import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CartSidebar.scss";
import { FiShoppingBag, FiTag } from "react-icons/fi";

const CartSidebar = ({ isOpen, onClose }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    subtotal: 0,
    totalSavings: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingItem, setUpdatingItem] = useState(null);
  const navigate = useNavigate();

  // ✅ Create product slug function
  const createProductSlug = (productName) => {
    return productName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
  };

  // Fetch cart when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchCart();
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

  // ✅ UPDATED: Calculate summary with savings
  const calculateSummary = (items, apiSummary) => {
    // Calculate discounted subtotal (price after offers)
    const subtotal = items.reduce((sum, item) => {
      const itemTotal = item.totalPrice || (item.finalPrice || item.unitPrice) * item.quantity;
      return sum + itemTotal;
    }, 0);

    // Calculate original subtotal (price before offers)
    const originalSubtotal = items.reduce((sum, item) => {
      return sum + (item.unitPrice * item.quantity);
    }, 0);

    // Calculate total savings
    const totalSavings = items.reduce((sum, item) => {
      if (item.hasOffer || (item.unitPrice && item.unitPrice > item.finalPrice)) {
        const originalItemTotal = item.unitPrice * item.quantity;
        const discountedItemTotal = item.finalPrice * item.quantity;
        return sum + (originalItemTotal - discountedItemTotal);
      }
      return sum;
    }, 0);

    // Alternative simple calculation
    // const totalSavings = originalSubtotal - subtotal;

    const shipping = subtotal > 1000 ? 0 : 120;
    const tax = parseFloat((subtotal * 0.18).toFixed(2)); // ✅ Show only 2 decimal places
    const total = subtotal + shipping + tax;

    setCartSummary({
      totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: parseFloat(subtotal.toFixed(2)), // Discounted subtotal
      totalSavings: parseFloat(totalSavings.toFixed(2)),
      shipping,
      tax, // Now shows only 2 decimal places
      total: parseFloat(total.toFixed(2))
    });
  };

  // ✅ Calculate discount for individual item
  const calculateDiscount = (item) => {
    const unitPrice = item.unitPrice || 0;
    const finalPrice = item.finalPrice || unitPrice;
    
    if (unitPrice > 0 && finalPrice < unitPrice) {
      const discountAmount = unitPrice - finalPrice;
      const discountPercentage = Math.round((discountAmount / unitPrice) * 100);
      return {
        hasDiscount: true,
        discountAmount,
        discountPercentage
      };
    }
    
    return {
      hasDiscount: false,
      discountAmount: 0,
      discountPercentage: 0
    };
  };

  // ✅ Get total savings for the cart
  const getTotalSavings = () => {
    return cartItems.reduce((total, item) => {
      const discount = calculateDiscount(item);
      return total + (discount.discountAmount * item.quantity);
    }, 0);
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
        hasOffer: item.hasOffer || false,
        offerDetails: item.offerDetails || null,
        thumbnailImage: item.selectedColor?.images?.[0] || item.thumbnailImage || null
      })),
      summary: {
        ...cartSummary,
        originalSubtotal: cartSummary.subtotal + cartSummary.totalSavings, // Calculate original
        subtotal: cartSummary.subtotal,
        totalSavings: cartSummary.totalSavings,
        shipping: cartSummary.shipping,
        tax: cartSummary.tax,
        total: cartSummary.total,
        totalItems: cartSummary.totalItems
      },
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
              {cartItems.map((item) => {
                const discount = calculateDiscount(item);
                const totalSavingsForItem = discount.discountAmount * item.quantity;
                
                return (
                  <div className="cart-sidebar-item" key={item._id}>
                    {/* Make image clickable with slug */}
                    <img
                      src={
                        item.selectedColor?.images?.[0] ||
                        item.thumbnailImage ||
                        "https://via.placeholder.com/80x80?text=No+Image"
                      }
                      alt={item.productName}
                      onClick={() => {
                        const urlSlug = createProductSlug(item.productName);
                        navigate(`/product/${urlSlug}`, {
                          state: { 
                            productId: item.productId,
                            ...(item.selectedModel && { modelId: item.selectedModel.modelId }),
                            ...(item.selectedColor && { colorId: item.selectedColor.colorId }),
                            ...(item.selectedFragrance && { fragrance: item.selectedFragrance }),
                            ...(item.selectedSize && { size: item.selectedSize })
                          }
                        });
                        onClose();
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <div className="item-details">
                      {/* Make product name clickable with slug */}
                      <h4 onClick={() => {
                        const urlSlug = createProductSlug(item.productName);
                        navigate(`/product/${urlSlug}`, {
                          state: { 
                            productId: item.productId,
                            ...(item.selectedModel && { modelId: item.selectedModel.modelId }),
                            ...(item.selectedColor && { colorId: item.selectedColor.colorId }),
                            ...(item.selectedFragrance && { fragrance: item.selectedFragrance }),
                            ...(item.selectedSize && { size: item.selectedSize })
                          }
                        });
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
                          <>
                            <span className="old-price">₹{item.unitPrice}</span>
                            {/* Show discount badge */}
                            {discount.hasDiscount && (
                              <span className="off-badge">
                                <FiTag size={10} />
                                {discount.discountPercentage}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      {/* Show per item savings */}
                      {/* {discount.hasDiscount && (
                        <div className="item-savings">
                          <span className="savings-text">
                            Save ₹{totalSavingsForItem} on this item
                          </span>
                        </div>
                      )} */}

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
                );
              })}
            </div>
          )}
        </div>

        {/* Fixed Summary Section - UPDATED WITH SAVINGS */}
        <div className="cart-sidebar-summary">
          {/* Total Items */}
          <div className="summary-row">
            <span>Total Items</span>
            <span>{cartSummary.totalItems}</span>
          </div>

          {/* Original Price (if there are savings) */}
          {cartSummary.totalSavings > 0 && (
            <div className="summary-row original-price">
              <span>Original Price</span>
              <span className="strikethrough">
                ₹{(cartSummary.subtotal + cartSummary.totalSavings).toFixed(2)}
              </span>
            </div>
          )}

          {/* Discounted Subtotal */}
          <div className="summary-row">
            <span>Items Total</span>
            <span className="subtotal">₹{cartSummary.subtotal.toFixed(2)}</span>
          </div>

          {/* Total Savings */}
          {cartSummary.totalSavings > 0 && (
            <div className="summary-row discount">
              <span>Total Savings</span>
              <span className="savings">
                -₹{cartSummary.totalSavings.toFixed(2)}
              </span>
            </div>
          )}

          {/* Shipping */}
          <div className="summary-row">
            <span>Shipping</span>
            <span>
              {cartSummary.shipping === 0 ? "FREE" : `₹${cartSummary.shipping}`}
            </span>
          </div>

          {/* Tax - FIXED to show only 2 decimal places */}
          <div className="summary-row">
            <span>Tax (18%)</span>
            <span>₹{cartSummary.tax.toFixed(2)}</span> {/* ✅ Shows only 2 decimal places */}
          </div>

          {/* Estimated Total */}
          <div className="summary-row total">
            <span>Estimated Total</span>
            <span>₹{cartSummary.total.toFixed(2)}</span>
          </div>

          {/* Total Savings Summary */}
          {/* {cartSummary.totalSavings > 0 && (
            <div className="savings-summary">
              <FiTag className="savings-icon" />
              <span>You're saving ₹{cartSummary.totalSavings.toFixed(2)} on this order!</span>
            </div>
          )} */}

          {/* Checkout Button */}
          <button
            className="checkout-btn"
            onClick={proceedToCheckout}
            disabled={cartItems.length === 0}
          >
            PROCEED TO CHECKOUT
          </button>

          {/* View Full Cart Button */}
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