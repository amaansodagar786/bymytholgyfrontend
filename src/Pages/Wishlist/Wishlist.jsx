import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify"; // ✅ Added ToastContainer import
import "./Wishlist.scss";
import LoginModal from "../../Components/Login/LoginModel/LoginModal";
import "react-toastify/dist/ReactToastify.css"; // ✅ Added CSS import

function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

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
      toast.error("Failed to load wishlist. Please try again.");

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("userId");
        toast.info("Session expired. Please login again.");
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId, selectedFragrance) => {
    try {
      setRemovingItem(productId);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      // ✅ SIMPLE: Always pass the fragrance (it's always there)
      const url = `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}?userId=${userId}&fragrance=${selectedFragrance}`;

      await axios.delete(
        url,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // ✅ Remove from local state - match BOTH productId AND fragrance
      setWishlistItems(prev => prev.filter(item => 
        !(item.productId === productId && item.selectedFragrance === selectedFragrance)
      ));

      // Dispatch event for navbar update
      window.dispatchEvent(new Event('wishlistUpdated'));

      toast.success("Item removed from wishlist");

    } catch (err) {
      console.error("Error removing from wishlist:", err);
      toast.error("Failed to remove item. Please try again.");
    } finally {
      setRemovingItem(null);
    }
  };

  const createProductSlug = (productName) => {
    return productName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
  };

  const handleProductClick = (item) => {
    const urlSlug = createProductSlug(item.productName);
    let url = `/product/${urlSlug}`;

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

    navigate(url, {
      state: { 
        productId: item.productId,
        ...(item.selectedModel && { modelId: item.selectedModel.modelId }),
        ...(item.selectedColor && { colorId: item.selectedColor.colorId }),
        ...(item.selectedFragrance && { fragrance: item.selectedFragrance }),
        ...(item.selectedSize && { size: item.selectedSize }) ,
        // fragranceFromWishlist: item.selectedFragrance,
      }
    });
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

  if (loading) {
    return (
      <div className="wishlist-page">
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
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="wishlist-page">
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
        <div className="login-prompt">
          <h2>Login Required</h2>
          <p>Please login to view your wishlist.</p>
          <div className="auth-buttons">
            <button
              className="auth-btn login-btn"
              onClick={() => setShowLoginModal(true)}
            >
              Login
            </button>
          </div>
        </div>

        {showLoginModal && (
          <LoginModal
            onClose={() => {
              setShowLoginModal(false);
              const token = localStorage.getItem("token");
              if (token) {
                toast.success("Login successful!");
                window.location.reload();
              }
            }}
            showRegisterLink={true}
          />
        )}
      </div>
    );
  }

  if (wishlistItems.length === 0 && !error) {
    return (
      <div className="wishlist-page">
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

  if (error) {
    return (
      <div className="wishlist-page">
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

  return (
    <div className="wishlist-page">
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
          <div className="wishlist-left">
            {wishlistItems.map((item) => {
              const discount = calculateDiscount(item);
              
              return (
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

                    {/* ✅ ALWAYS show fragrance (it's always there) */}
                    <p className="fragrance">
                      Fragrance : {item.selectedFragrance}
                    </p>

                    <div className="variants">
                      {item.selectedModel && (
                        <span className="variant-tag">Model: {item.selectedModel.modelName}</span>
                      )}
                      {item.selectedSize && (
                        <span className="variant-tag">Size: {item.selectedSize}</span>
                      )}
                    </div>

                    <div className="price-row">
                      <span className="price">₹{item.currentPrice.toLocaleString()}</span>
                      
                      {item.originalPrice && item.originalPrice > item.currentPrice && (
                        <>
                          <span className="old">₹{item.originalPrice.toLocaleString()}</span>
                          {discount.hasDiscount && (
                            <span className="off-badge">
                              {discount.discountPercentage}% OFF
                            </span>
                          )}
                        </>
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

                  {/* ✅ PASS FRAGRANCE TO REMOVE FUNCTION */}
                  <button
                    className="remove"
                    onClick={() => removeFromWishlist(item.productId, item.selectedFragrance)}
                    disabled={removingItem === item.productId}
                    title="Remove from wishlist"
                  >
                    {removingItem === item.productId ? '⏳' : '×'}
                  </button>
                </div>
              );
            })}
          </div>

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
              onClick={() => {
                toast.info("Continue shopping");
                navigate('/');
              }}
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