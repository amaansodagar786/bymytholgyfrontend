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

  /* ================= SUMMARY ================= */
  const calculateSummary = (items, apiSummary) => {
    const subtotal =
      apiSummary?.subtotal ||
      items.reduce((sum, i) => sum + i.totalPrice, 0);

    const totalSavings =
      apiSummary?.totalSavings ||
      items.reduce((sum, i) => {
        if (i.hasOffer && i.offerDetails) {
          return sum + i.offerDetails.savedAmount;
        }
        return sum;
      }, 0);

    const shipping = subtotal > 1000 ? 0 : 120;
    const tax = subtotal * 0.18;
    const total = subtotal + shipping + tax;

    setCartSummary({
      totalItems: items.reduce((s, i) => s + i.quantity, 0),
      subtotal,
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

  /* ================= CHECKOUT ================= */
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
        thumbnailImage:
          item.selectedColor?.images?.[0] || item.thumbnailImage || null
      })),
      summary: cartSummary,
      userId,
      totalItems: cartSummary.totalItems,
      grandTotal: cartSummary.total
    };

    navigate("/checkout", {
      state: { cartMode: true, cartData: checkoutCartData }
    });
  };

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
          {/* ===== EMPTY STATE ===== */}
          {!loading && cartItems.length === 0 && (
            <div className="empty-cart-center">
              <div className="empty-cart-icon">
                <FiShoppingBag size={80} />
              </div>              <h2>Your cart is empty</h2>
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
              {cartItems.map((item) => (
                <div className="bag-item" key={item._id}>
                  <img
                    src={
                      item.selectedColor?.images?.[0] ||
                      item.thumbnailImage
                    }
                    alt={item.productName}
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
                      {item.unitPrice && (
                        <span className="old">₹{item.unitPrice}</span>
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
              ))}
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