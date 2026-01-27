import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./WishlistSidebar.scss";

const WishlistSidebar = ({ isOpen, onClose }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState(null);
  const navigate = useNavigate();

  // Fetch wishlist when sidebar opens
  useEffect(() => {
    if (isOpen) {
      fetchWishlist();
      // Prevent body scroll when sidebar is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      if (isOpen) fetchWishlist();
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, [isOpen]);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        setLoading(false);
        return;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/my-wishlist?userId=${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setWishlistItems(response.data.wishlist || []);
    } catch (err) {
      console.error("Error fetching wishlist:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
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
            "Content-Type": "application/json",
          },
        }
      );

      setWishlistItems((prev) => prev.filter((item) => item.productId !== productId));
      window.dispatchEvent(new Event("wishlistUpdated"));
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      alert("Failed to remove item. Please try again.");
    } finally {
      setRemovingItem(null);
    }
  };

  // Handle product click
  const handleProductClick = (item) => {
    let url = `/product/${item.productId}`;
    const params = new URLSearchParams();

    if (item.selectedModel?.modelId) {
      params.append("model", item.selectedModel.modelId);
    }
    if (item.selectedColor?.colorId) {
      params.append("color", item.selectedColor.colorId);
    }
    if (item.selectedSize) {
      params.append("size", item.selectedSize);
    }
    if (item.selectedFragrance) {
      params.append("fragrance", item.selectedFragrance);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    navigate(url);
    onClose(); // Close sidebar after navigation
  };

  // Calculate summary
  const calculateSummary = () => {
    const totalItems = wishlistItems.length;
    const totalPrice = wishlistItems.reduce((sum, item) => sum + (item.currentPrice || 0), 0);
    const totalDiscount = wishlistItems.reduce((sum, item) => {
      const discount = (item.originalPrice || 0) - (item.currentPrice || 0);
      return sum + (discount > 0 ? discount : 0);
    }, 0);

    return { totalItems, totalPrice, totalDiscount };
  };

  const summary = calculateSummary();

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="wishlist-sidebar-overlay" onClick={onClose}></div>

      {/* Sidebar */}
      <div className="wishlist-sidebar">
        {/* Header */}
        <div className="wishlist-sidebar-header">
          <h2>My Wishlist</h2>
          <button className="close-sidebar-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>

        {/* Scrollable Product List */}
        <div className="wishlist-sidebar-content">
          {loading ? (
            <div className="sidebar-loading">
              <div className="loading-spinner"></div>
            </div>
          ) : wishlistItems.length === 0 ? (
            <div className="empty-wishlist-sidebar">
              <div className="empty-icon">💔</div>
              <p>Your wishlist is empty</p>
              <p className="empty-subtext">Add items you love to see them here</p>
            </div>
          ) : (
            <div className="wishlist-items-container">
              {wishlistItems.map((item) => (
                <div className="wishlist-sidebar-item" key={item.wishlistId}>
                  <img
                    src={item.thumbnailImage || "https://via.placeholder.com/80x80?text=No+Image"}
                    alt={item.productName}
                    onClick={() => handleProductClick(item)}
                  />
                  <div className="item-details">
                    <h4 onClick={() => handleProductClick(item)}>{item.productName}</h4>
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
                      <span className="price">₹{item.currentPrice?.toLocaleString()}</span>
                      {item.originalPrice && item.originalPrice > item.currentPrice && (
                        <span className="old-price">₹{item.originalPrice?.toLocaleString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="remove-item-btn"
                    onClick={() => removeFromWishlist(item.productId)}
                    disabled={removingItem === item.productId}
                    title="Remove"
                  >
                    {removingItem === item.productId ? "⏳" : "×"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fixed Summary Section */}
        <div className="wishlist-sidebar-summary">
          <div className="summary-row">
            <span>Total Items</span>
            <span>{summary.totalItems}</span>
          </div>
          {summary.totalDiscount > 0 && (
            <div className="summary-row">
              <span>Total Discount</span>
              <span>₹{summary.totalDiscount.toLocaleString()}</span>
            </div>
          )}
          <div className="summary-row total">
            <span>Total Value</span>
            <span>₹{summary.totalPrice.toLocaleString()}</span>
          </div>

          <button
            className="view-all-btn"
            onClick={() => {
              navigate("/wishlist");
              onClose();
            }}
          >
            VIEW ALL WISHLIST ITEMS
          </button>
        </div>
      </div>
    </>
  );
};

export default WishlistSidebar;