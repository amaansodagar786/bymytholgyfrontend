import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Cart.scss";
import { FiShoppingBag } from "react-icons/fi";

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const [cartSummary, setCartSummary] = useState({
    totalItems: 0,
    subtotal: 0,
    totalSavings: 0,
    shipping: 0,
    tax: 0,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [updatingItem, setUpdatingItem] = useState(null);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const navigate = useNavigate();

  // ✅ CHANGE 1: Create product slug function
  const createProductSlug = (productName) => {
    return productName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
  };

  /* ================= FETCH CART ================= */
  useEffect(() => {
    if (token && userId) fetchCart();
  }, [token, userId]);

  useEffect(() => {
    const handleCartUpdate = () => {
      if (token && userId) fetchCart();
    };
    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, [token, userId]);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/cart/${userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setCartItems(res.data.cartItems || []);
      calculateSummary(res.data.cartItems || [], res.data.summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (items, apiSummary) => {
    // Calculate discounted subtotal
    const subtotal = items.reduce((sum, i) => sum + i.totalPrice, 0);

    // Calculate original subtotal
    const originalSubtotal = items.reduce((sum, i) => sum + (i.unitPrice * i.quantity), 0);

    // Calculate total savings correctly
    const totalSavings = items.reduce((sum, i) => {
      if (i.hasOffer) {
        const originalItemTotal = i.unitPrice * i.quantity;
        const discountedItemTotal = i.finalPrice * i.quantity;
        return sum + (originalItemTotal - discountedItemTotal);
      }
      return sum;
    }, 0);

    // Alternative: totalSavings = originalSubtotal - subtotal
    // const totalSavings = originalSubtotal - subtotal;

    const shipping = subtotal > 1000 ? 0 : 120;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;

    setCartSummary({
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      subtotal, // Discounted subtotal
      originalSubtotal, // ← ADD THIS LINE
      totalSavings,
      shipping,
      tax,
      total
    });
  };

  /* ================= QTY UPDATE ================= */
  const updateQuantity = async (itemId, qty) => {
    if (!token || qty < 1 || qty > 99) return;

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
            totalPrice: item.finalPrice * qty
          }
          : item
      );

      setCartItems(updated);
      calculateSummary(updated);
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingItem(null);
    }
  };

  /* ================= REMOVE ITEM ================= */
  const removeItem = async (itemId) => {
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
      console.error(err);
    }
  };

  const proceedToCheckout = () => {
    if (cartItems.length === 0) return;

    console.log('📍 Cart Summary BEFORE sending to checkout:', cartSummary);
    console.log('📍 totalSavings value:', cartSummary.totalSavings);

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
        ...cartSummary, // This now includes originalSubtotal
        // Make sure all fields are present
        subtotal: cartSummary.subtotal,
        originalSubtotal: cartSummary.originalSubtotal, // ← Ensure this is included
        totalSavings: cartSummary.totalSavings,  // ← YOU HAVE THIS!
        shipping: cartSummary.shipping,
        tax: cartSummary.tax,
        total: cartSummary.total,
        totalItems: cartSummary.totalItems
      },
      userId,
      totalItems: cartSummary.totalItems,
      grandTotal: cartSummary.total
    };

    console.log('📍 Checkout Cart Data being sent:', checkoutCartData);
    console.log('📍 Checkout Summary being sent:', checkoutCartData.summary);

    navigate("/checkout", {
      state: { cartMode: true, cartData: checkoutCartData }
    });
  };;
  /* ================= JSX ================= */
  return (
    <>
      {/* ===== HERO SECTION ===== */}
      <div className="cart-hero">
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef"
          alt="Cart Hero"
        />
      </div>

      <div className="bag-wrapper">
        {/* HEADER */}
        <div className="bag-header">
          <h1>Bag</h1>
          <button onClick={() => navigate(-1)}>×</button>
        </div>

        <div className="bag-body">
          {/* ===== EMPTY STATE ===== */}
          {!loading && cartItems.length === 0 && (
            <div className="empty-cart-center">
              <div className="empty-cart-icon">
                <FiShoppingBag size={80} />
              </div>
              <h2>Your cart is empty</h2>
              <p className="empty-cart-message">
                Looks like you haven't added any items to your cart yet.
              </p>
              <button
                className="empty-cart-button"
                onClick={() => navigate('/')}
              >
                Continue Shopping
              </button>
            </div>
          )}

          {/* LEFT 65% */}
          {cartItems.length > 0 && (
            <div className="bag-left">
              {cartItems.map((item) => {
                // ✅ CHANGE 2: Calculate discount
                const hasDiscount = item.unitPrice && item.unitPrice > item.finalPrice;
                const discountPercentage = hasDiscount
                  ? Math.round(((item.unitPrice - item.finalPrice) / item.unitPrice) * 100)
                  : 0;

                return (
                  <div className="bag-item" key={item._id}>
                    {/* ✅ CHANGE 1: Make image clickable */}
                    <img
                      src={
                        item.selectedColor?.images?.[0] ||
                        item.thumbnailImage
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
                      }}
                      style={{ cursor: 'pointer' }}
                    />

                    <div className="bag-info">
                      <h3>{item.productName}</h3>

                      {item.selectedFragrance && (
                        <p className="fragrance">
                          Fragrance : {item.selectedFragrance}
                        </p>
                      )}

                      <div className="price-row">
                        <span className="price">₹{item.finalPrice}</span>
                        {item.unitPrice && item.unitPrice > item.finalPrice && (
                          <>
                            <span className="old">₹{item.unitPrice}</span>
                            {/* ✅ CHANGE 2: Show discount badge */}
                            {discountPercentage > 0 && (
                              <span className="off-badge">
                                {discountPercentage}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="qty">
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity - 1)
                          }
                        >
                          −
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          onClick={() =>
                            updateQuantity(item._id, item.quantity + 1)
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      className="remove"
                      onClick={() => removeItem(item._id)}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* RIGHT 35% (ONLY IF CART NOT EMPTY) */}
          {cartItems.length > 0 && (
            <div className="bag-right">
              <h2>ORDER SUMMARY</h2>

              <div className="row">
                <span>Subtotal</span>
                <span>₹{cartSummary.subtotal}</span>
              </div>

              <div className="row">
                <span>Shipping</span>
                <span>
                  {cartSummary.shipping === 0
                    ? "FREE"
                    : `₹${cartSummary.shipping}`}
                </span>
              </div>

              <div className="row">
                <span>Tax (18%)</span>
                <span>₹{cartSummary.tax}</span>
              </div>

              <div className="row total">
                <span>Estimated Total</span>
                <span>₹{cartSummary.total}</span>
              </div>

              <button onClick={proceedToCheckout}>
                CHECKOUT
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Cart;