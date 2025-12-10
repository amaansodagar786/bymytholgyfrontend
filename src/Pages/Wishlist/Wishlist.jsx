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

      // ✅ CORRECT: Use query parameters
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
      const userId = localStorage.getItem("userId"); // Get userId

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

  // Move item to cart (you'll need to implement cart API later)
  const moveToCart = async (item) => {
    try {
      // First, add to cart
      const cartData = {
        productId: item.productId,
        quantity: 1,
        selectedModel: item.selectedModel,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize
      };

      // TODO: Implement your cart API endpoint
      await axios.post(
        `${import.meta.env.VITE_API_URL}/cart/add`,
        cartData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Then remove from wishlist
      await removeFromWishlist(item.productId);

      alert("Item moved to cart successfully!");

      // Dispatch event for cart update
      window.dispatchEvent(new Event('cartUpdated'));

    } catch (err) {
      console.error("Error moving to cart:", err);
      alert(err.response?.data?.message || "Failed to move to cart. Please try again.");
    }
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

  // In Wishlist.js - UPDATE THE handleProductClick FUNCTION:

  // Handle product click WITH VARIANT PRE-SELECTION
  const handleProductClick = (item) => {
    // Build URL with query parameters for variant pre-selection
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

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    navigate(url);
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
          <p>Please login to view your wishlist. Your wishlist items are saved to your account and will be available whenever you login.</p>
          <div className="auth-buttons">
            <Link to="/login" className="auth-btn login-btn">
              Login
            </Link>
            <Link to="/register" className="auth-btn register-btn">
              Register
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
        <div className="page-header">
          <h1>My Wishlist</h1>
          <div className="wishlist-count">0 items</div>
        </div>

        <div className="empty-wishlist">
          <div className="empty-icon">💔</div>

          <h2>Your wishlist is empty</h2>
          <p>Looks like you haven't added any items to your wishlist yet. Start browsing our collection and add your favorite products!</p>
          <button
            className="browse-btn"
            onClick={() => navigate("/")}
          >
            Start Shopping
          </button>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="wishlist-page">
        <div className="page-header">
          <h1>My Wishlist</h1>
        </div>

        <div className="empty-wishlist">
          <div className="empty-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button
            className="browse-btn"
            onClick={fetchWishlist}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Render wishlist with items
  return (
    <div className="wishlist-page">
      <div className="page-header">
        <h1>My Wishlist</h1>
        <div className="wishlist-count">{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</div>
      </div>

      <div className="wishlist-container">
        {/* Wishlist Items */}
        <div className="wishlist-items">
          {wishlistItems.map((item) => (
            <div key={item.wishlistId} className="wishlist-item">
              <div className="item-content">
                {/* Product Image */}
                <div className="item-image">
                  {item.thumbnailImage ? (
                    <img
                      src={item.thumbnailImage}
                      alt={item.productName}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/200x200?text=No+Image";
                      }}
                    />
                  ) : (
                    <div className="no-image">No Image</div>
                  )}
                </div>

                {/* Product Details */}
                <div className="item-details">
                  <div className="item-header">
                    <div className="item-title">
                      <div className="category-badge">
                        {item.categoryName || "Uncategorized"}
                      </div>
                      <h3 onClick={() => handleProductClick(item.productId, item.selectedModel, item.selectedColor)}>
                        {item.productName}
                      </h3>
                    </div>

                    <button
                      className="remove-btn"
                      onClick={() => removeFromWishlist(item.productId)}
                      disabled={removingItem === item.productId}
                      title="Remove from wishlist"
                    >
                      {removingItem === item.productId ? '⏳' : '×'}
                    </button>
                  </div>

                  {/* Variant Information */}
                  <div className="item-variants">
                    {item.selectedModel && (
                      <div className="variant-info">
                        <span className="variant-label">Model:</span>
                        <span className="variant-value">{item.selectedModel.modelName}</span>
                      </div>
                    )}

                    {item.selectedColor && (
                      <div className="variant-info">
                        <span className="variant-label">Color:</span>
                        <span className="variant-value">{item.selectedColor.colorName}</span>
                        {item.selectedColor.currentPrice && item.selectedColor.currentPrice !== item.currentPrice && (
                          <span className="variant-price">
                            (₹{item.selectedColor.currentPrice.toLocaleString()})
                          </span>
                        )}
                      </div>
                    )}

                    {item.selectedSize && (
                      <div className="variant-info">
                        <span className="variant-label">Size:</span>
                        <span className="variant-value">{item.selectedSize}</span>
                      </div>
                    )}

                    <div className="variant-info">
                      <span className="variant-label">Type:</span>
                      <span className="variant-value">
                        {item.productType === "variable" ? "Variable Product" : "Simple Product"}
                      </span>
                    </div>

                    {item.addedFrom && (
                      <div className="variant-info">
                        <span className="variant-label">Added from:</span>
                        <span className="variant-value">
                          {item.addedFrom === "product" ? "Product Page" : "Home Page"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Price Information */}
                  <div className="price-section">
                    <span className="current-price">
                      ₹{item.currentPrice.toLocaleString()}
                    </span>

                    {item.originalPrice && item.originalPrice > item.currentPrice && (
                      <>
                        <span className="original-price">
                          ₹{item.originalPrice.toLocaleString()}
                        </span>
                        <span className="discount-badge">
                          {Math.round(((item.originalPrice - item.currentPrice) / item.originalPrice) * 100)}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="item-actions">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleProductClick(item)}
                    >
                      View Details
                    </button>

                    {/* <button
                      className="action-btn cart-btn"
                      onClick={() => moveToCart(item)}
                    >
                      Add to Cart
                    </button> */}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Wishlist Summary */}
        <div className="wishlist-summary">
          <h3 className="summary-title">Wishlist Summary</h3>

          <div className="summary-items">
            <div className="summary-row">
              <span className="row-label">Total Items</span>
              <span className="row-value">{summary.totalItems}</span>
            </div>

            {summary.totalDiscount > 0 && (
              <div className="summary-row">
                <span className="row-label">Total Discount</span>
                <span className="row-value">₹{summary.totalDiscount.toLocaleString()}</span>
              </div>
            )}

            <div className="summary-row total">
              <span className="row-label">Total Value</span>
              <span className="row-value">₹{summary.totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <div className="summary-actions">
            <Link to="/" className="summary-btn continue-btn">
              Continue Shopping
            </Link>

            <button
              className="summary-btn checkout-btn"
              onClick={() => {
                // You can implement bulk add to cart or checkout from wishlist
                alert("Feature coming soon! For now, add items individually to cart.");
              }}
            >
              Add All to Cart
            </button>
          </div>

          <div className="wishlist-notes">
            <div className="notes-title">Wishlist Notes</div>
            <div className="notes-text">
              • Items in your wishlist are saved to your account<br />
              • You can add items to cart individually<br />
              • Price may change if product prices are updated
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Wishlist;