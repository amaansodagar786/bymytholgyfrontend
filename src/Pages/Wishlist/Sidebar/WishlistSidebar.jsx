import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify"; // ✅ Added ToastContainer import
import "./WishlistSidebar.scss";
import "react-toastify/dist/ReactToastify.css"; // ✅ Also need the CSS

const WishlistSidebar = ({ isOpen, onClose }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removingItem, setRemovingItem] = useState(null);
  const navigate = useNavigate();

  const createProductSlug = (productName) => {
    return productName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
  };

  const calculateDiscount = (item) => {
    const originalPrice = item.originalPrice || 0;
    const currentPrice = item.currentPrice || 0;
    
    if (originalPrice > 0 && currentPrice < originalPrice) {
      const discountAmount = originalPrice - currentPrice;
      const discountPercentage = Math.round((discountAmount / originalPrice) * 100);
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

  useEffect(() => {
    if (isOpen) {
      fetchWishlist();
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

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
        toast.info("Session expired. Please login again.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Remove item with fragrance parameter
  const removeFromWishlist = async (productId, selectedFragrance) => {
    try {
      setRemovingItem(productId);
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // ✅ ALWAYS pass fragrance parameter
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}?userId=${userId}&fragrance=${selectedFragrance}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // ✅ Remove from local state - match BOTH productId AND fragrance
      setWishlistItems((prev) => prev.filter((item) => 
        !(item.productId === productId && item.selectedFragrance === selectedFragrance)
      ));
      
      window.dispatchEvent(new Event("wishlistUpdated"));
      toast.success("Removed from wishlist");
    } catch (err) {
      console.error("Error removing from wishlist:", err);
      toast.error("Failed to remove item. Please try again.");
    } finally {
      setRemovingItem(null);
    }
  };

  const handleProductClick = (item) => {
    const urlSlug = createProductSlug(item.productName);
    let url = `/product/${urlSlug}`;
    
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

    navigate(url, {
      state: { 
        productId: item.productId,
        ...(item.selectedModel && { modelId: item.selectedModel.modelId }),
        ...(item.selectedColor && { colorId: item.selectedColor.colorId }),
        ...(item.selectedFragrance && { fragrance: item.selectedFragrance }),
        ...(item.selectedSize && { size: item.selectedSize }),
        
      }
    });
    
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <>
      {/* ✅ Added ToastContainer for sidebar notifications */}
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      
      <div className="wishlist-sidebar-overlay" onClick={onClose}></div>

      <div className="wishlist-sidebar">
        <div className="wishlist-sidebar-header">
          <h2>My Wishlist</h2>
          <button className="close-sidebar-btn" onClick={onClose} title="Close">
            ×
          </button>
        </div>

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
              {wishlistItems.map((item) => {
                const discount = calculateDiscount(item);
                
                return (
                  <div className="wishlist-sidebar-item" key={item.wishlistId}>
                    <img
                      src={item.thumbnailImage || "https://via.placeholder.com/80x80?text=No+Image"}
                      alt={item.productName}
                      onClick={() => handleProductClick(item)}
                    />
                    <div className="item-details">
                      <h4 onClick={() => handleProductClick(item)}>{item.productName}</h4>
                      {/* ✅ Show fragrance (always exists) */}
                      <p className="fragrance">Fragrance: {item.selectedFragrance}</p>
                      <div className="variants">
                        {item.selectedModel && (
                          <span>Model: {item.selectedModel.modelName}</span>
                        )}
                        {item.selectedSize && <span>Size: {item.selectedSize}</span>}
                      </div>
                      <div className="price-row">
                        <span className="price">₹{item.currentPrice?.toLocaleString()}</span>
                        
                        {item.originalPrice && item.originalPrice > item.currentPrice && (
                          <>
                            <span className="old-price">₹{item.originalPrice?.toLocaleString()}</span>
                            {discount.hasDiscount && (
                              <span className="off-badge">
                                {discount.discountPercentage}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {/* ✅ Pass fragrance to remove function */}
                    <button
                      className="remove-item-btn"
                      onClick={() => removeFromWishlist(item.productId, item.selectedFragrance)}
                      disabled={removingItem === item.productId}
                      title="Remove"
                    >
                      {removingItem === item.productId ? "⏳" : "×"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

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