import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "./Wishlist.scss";

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch wishlist data
  useEffect(() => {
    if (token) {
      fetchWishlist();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setError("Please login to view wishlist");
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/my-wishlist?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setWishlistItems(response.data.wishlist || []);

    } catch (err) {
      console.error("Error fetching wishlist:", err);
      setError("Failed to load wishlist. Please try again.");

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  // Remove item from wishlist
  const removeFromWishlist = async (productId) => {
    try {
      setRemovingItem(productId);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      await axios.delete(
        `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Update local state
      setWishlistItems(prev => prev.filter(item => item.productId !== productId));

      // Dispatch event for navbar update
      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (err) {
      console.error("Error removing from wishlist:", err);
      alert("Failed to remove item. Please try again.");
    } finally {
      setRemovingItem(null);
    }
  };

  // Handle product click WITH VARIANT PRE-SELECTION
  const handleProductClick = (item) => {
    let url = `/product/${item.productId}`;

    const params = new URLSearchParams();

    if (item.selectedModel && item.selectedModel.modelId) {
      params.append('model', item.selectedModel.modelId);
    }

    if (item.selectedColor && item.selectedColor.colorId) {
      params.append('color', item.selectedColor.colorId);
    }

    if (item.selectedSize) {
      params.append('size', item.selectedSize);
    }

    if (item.selectedFragrance) {
      params.append('fragrance', item.selectedFragrance);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    navigate(url);
  };

  // Calculate wishlist summary
  const calculateSummary = () => {
    const totalItems = wishlistItems.length;
    const totalPrice = wishlistItems.reduce((sum, item) => sum + (item.currentPrice || 0), 0);
    const totalDiscount = wishlistItems.reduce((sum, item) => {
      const discount = (item.originalPrice || 0) - (item.currentPrice || 0);
      return sum + (discount > 0 ? discount : 0);
    }, 0);

    return {
      totalItems,
      totalPrice,
      totalDiscount
    };
  };

  const summary = calculateSummary();

  // Render loading state
  if (loading) {
    return (
      <div className="wishlist-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  // Render login prompt if not logged in
  if (!token) {
    return (
      <div className="wishlist-page">
        <div className="login-prompt">
          <h2>Login Required</h2>
          <p>Please login to view your wishlist.</p>
          <div className="auth-buttons">
            <Link to="/login" className="auth-btn login-btn">
              Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Render empty wishlist
  if (wishlistItems.length === 0 && !error) {
    return (
      <div className="wishlist-page">
        {/* ===== HERO SECTION ===== */}
        <div className="wishlist-hero">
          <img
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef"
            alt="Wishlist Hero"
          />
        </div>

        <div className="wishlist-wrapper">
          {/* HEADER */}
          <div className="wishlist-header">
            <h1>Wishlist</h1>
            <button onClick={() => navigate(-1)}>×</button>
          </div>

          <div className="wishlist-body">
            <div className="empty-wishlist-center">
              <div className="empty-wishlist-icon">💔</div>
              <h2>Your wishlist is empty</h2>
              <p className="empty-wishlist-message">
                Looks like you haven't added any items to your wishlist yet.
              </p>
              <button 
                className="empty-wishlist-button" 
                onClick={() => navigate('/')}
              >
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="wishlist-page">
        <div className="wishlist-hero">
          <img
            src="https://images.unsplash.com/photo-1540555700478-4be289fbecef"
            alt="Wishlist Hero"
          />
        </div>

        <div className="wishlist-wrapper">
          <div className="wishlist-header">
            <h1>Wishlist</h1>
            <button onClick={() => navigate(-1)}>×</button>
          </div>

          <div className="wishlist-body">
            <div className="empty-wishlist-center">
              <div className="empty-wishlist-icon">⚠️</div>
              <h2>Oops! Something went wrong</h2>
              <p className="empty-wishlist-message">{error}</p>
              <button 
                className="empty-wishlist-button" 
                onClick={fetchWishlist}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render wishlist with items
  return (
    <div className="wishlist-page">
      {/* ===== HERO SECTION ===== */}
      <div className="wishlist-hero">
        <img
          src="https://images.unsplash.com/photo-1540555700478-4be289fbecef"
          alt="Wishlist Hero"
        />
      </div>

      <div className="wishlist-wrapper">
        {/* HEADER */}
        <div className="wishlist-header">
          <h1>Wishlist</h1>
          <button onClick={() => navigate(-1)}>×</button>
        </div>

        <div className="wishlist-body">
          {/* LEFT 65% - WISHLIST ITEMS */}
          <div className="wishlist-left">
            {wishlistItems.map((item) => (
              <div className="wishlist-item" key={item.wishlistId}>
                <img
                  src={item.thumbnailImage || "https://via.placeholder.com/140x140?text=No+Image"}
                  alt={item.productName}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/140x140?text=No+Image";
                  }}
                />

                <div className="wishlist-info">
                  <h3>{item.productName}</h3>

                  {/* Show fragrance if exists */}
                  {item.selectedFragrance && (
                    <p className="fragrance">
                      Fragrance : {item.selectedFragrance}
                    </p>
                  )}

                  {/* Show other variants */}
                  <div className="variants">
                    {item.selectedModel && (
                      <span className="variant-tag">Model: {item.selectedModel.modelName}</span>
                    )}
                    {/* {item.selectedColor && (
                      <span className="variant-tag">Color: {item.selectedColor.colorName}</span>
                    )} */}
                    {item.selectedSize && (
                      <span className="variant-tag">Size: {item.selectedSize}</span>
                    )}
                  </div>

                  <div className="price-row">
                    <span className="price">₹{item.currentPrice.toLocaleString()}</span>
                    {item.originalPrice && item.originalPrice > item.currentPrice && (
                      <span className="old">₹{item.originalPrice.toLocaleString()}</span>
                    )}
                  </div>

                  <div className="wishlist-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleProductClick(item)}
                    >
                      View Details
                    </button>
                  </div>
                </div>

                <button
                  className="remove"
                  onClick={() => removeFromWishlist(item.productId)}
                  disabled={removingItem === item.productId}
                  title="Remove from wishlist"
                >
                  {removingItem === item.productId ? '⏳' : '×'}
                </button>
              </div>
            ))}
          </div>

          {/* RIGHT 35% - WISHLIST SUMMARY */}
          <div className="wishlist-right">
            <h2>WISHLIST SUMMARY</h2>

            <div className="row">
              <span>Total Items</span>
              <span>{summary.totalItems}</span>
            </div>

            {summary.totalDiscount > 0 && (
              <div className="row">
                <span>Total Discount</span>
                <span>₹{summary.totalDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="row total">
              <span>Total Value</span>
              <span>₹{summary.totalPrice.toLocaleString()}</span>
            </div>

            <button 
              className="continue-shopping-btn"
              onClick={() => navigate('/')}
            >
              CONTINUE SHOPPING
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wishlist;