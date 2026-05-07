import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { FaHeart } from "react-icons/fa";
import "./Wishlist.scss";
import LoginModal from "../../Components/Login/LoginModel/LoginModal";
import "react-toastify/dist/ReactToastify.css";
import placeholderimg from "../../assets/logo/logo.png";

// Product Card Component
const WishlistProductCard = ({ item, removingItem, removeFromWishlist, handleProductClick, productImages }) => {
  const [currentImage, setCurrentImage] = useState(placeholderimg);

  useEffect(() => {
    const images = productImages[item.productId];
    if (images) {
      setCurrentImage(images.defaultImage);
    }
  }, [productImages, item.productId]);

  const discount = (() => {
    const originalPrice = item.originalPrice || 0;
    const currentPrice = item.currentPrice || 0;
    if (originalPrice > 0 && currentPrice < originalPrice) {
      const discountPercentage = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
      return { hasDiscount: true, discountPercentage };
    }
    return { hasDiscount: false, discountPercentage: 0 };
  })();

  const isRemoving = removingItem === item.productId;
  const images = productImages[item.productId];

  const handleMouseEnter = () => {
    if (images?.hoverImage) {
      setCurrentImage(images.hoverImage);
    }
  };

  const handleMouseLeave = () => {
    if (images?.defaultImage) {
      setCurrentImage(images.defaultImage);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div
      className="wishlist-product-card"
      onClick={() => handleProductClick(item)}
    >
      <div className="wishlist-product-img-wrap">
        {discount.hasDiscount && (
          <span className="wishlist-offer-badge">
            {discount.discountPercentage}% OFF
          </span>
        )}

        <button
          className="wishlist-remove-btn"
          onClick={(e) => removeFromWishlist(item.productId, item.selectedFragrance, e)}
          disabled={isRemoving}
          aria-label="Remove from wishlist"
        >
          {isRemoving ? (
            <span className="wishlist-remove-spinner"></span>
          ) : (
            <FaHeart />
          )}
        </button>

        <img
          src={currentImage}
          alt={item.productName}
          loading="lazy"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = placeholderimg;
          }}
        />
      </div>

      <div className="wishlist-product-info">
        <h3 className="wishlist-product-name">{item.productName}</h3>

        {item.selectedFragrance && (
          <p className="wishlist-product-fragrance">
            Fragrance : {item.selectedFragrance}
          </p>
        )}

        <div className="wishlist-product-prices">
          <span className="wishlist-current-price">
            ₹{formatCurrency(item.currentPrice)}
          </span>
          {item.originalPrice && item.originalPrice > item.currentPrice && (
            <>
              <span className="wishlist-original-price">
                ₹{formatCurrency(item.originalPrice)}
              </span>
              {discount.hasDiscount && (
                <span className="wishlist-discount-badge">
                  {discount.discountPercentage}% OFF
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// Main Wishlist Component
function Wishlist() {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingItem, setRemovingItem] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [productImages, setProductImages] = useState({});

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

      const wishlistData = response.data.wishlist || [];
      setWishlistItems(wishlistData);

      await fetchProductImages(wishlistData);

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

  const fetchProductImages = async (items) => {
    const imagesMap = {};

    for (const item of items) {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/products/${item.productId}`
        );
        const productData = response.data;

        const thumbnailImage = productData.thumbnailImage || placeholderimg;
        const firstImage = productData.colors?.[0]?.images?.[0] || thumbnailImage;

        imagesMap[item.productId] = {
          defaultImage: thumbnailImage,
          hoverImage: firstImage
        };
      } catch (error) {
        console.error(`Error fetching product ${item.productId}:`, error);
        imagesMap[item.productId] = {
          defaultImage: placeholderimg,
          hoverImage: placeholderimg
        };
      }
    }

    setProductImages(imagesMap);
  };

  const removeFromWishlist = async (productId, selectedFragrance, e) => {
    e.stopPropagation();
    try {
      setRemovingItem(productId);

      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      const url = `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}?userId=${userId}&fragrance=${selectedFragrance}`;

      await axios.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setWishlistItems(prev => prev.filter(item =>
        !(item.productId === productId && item.selectedFragrance === selectedFragrance)
      ));

      setProductImages(prev => {
        const newMap = { ...prev };
        delete newMap[productId];
        return newMap;
      });

      window.dispatchEvent(new Event('wishlistUpdated'));
      toast.success("Removed from wishlist");

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
        ...(item.selectedSize && { size: item.selectedSize })
      }
    });
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const summary = calculateSummary();

  const renderSummaryCard = (summaryData) => {
    return (
      <div className="wishlist-summary-card">
        <h2>Wishlist Summary</h2>

        <div className="wishlist-summary-row">
          <span>Total Items</span>
          <span>{summaryData.totalItems}</span>
        </div>

        {summaryData.totalDiscount > 0 && (
          <div className="wishlist-summary-row">
            <span>Total Discount</span>
            <span>₹{formatCurrency(summaryData.totalDiscount)}</span>
          </div>
        )}

        <div className="wishlist-summary-row total">
          <span>Total Value</span>
          <span>₹{formatCurrency(summaryData.totalPrice)}</span>
        </div>

        <button
          className="wishlist-continue-btn"
          onClick={() => {
            toast.info("Continue shopping");
            navigate('/');
          }}
        >
          CONTINUE SHOPPING
        </button>
      </div>
    );
  };

  const renderProductsWithSummary = () => {
    const items = [...wishlistItems];
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      return (
        <>
          <div className="wishlist-products-grid">
            {items.map((item) => (
              <WishlistProductCard
                key={`${item.wishlistId}-${item.selectedFragrance}`}
                item={item}
                removingItem={removingItem}
                removeFromWishlist={removeFromWishlist}
                handleProductClick={handleProductClick}
                productImages={productImages}
              />
            ))}
          </div>
          <div className="wishlist-summary-mobile">
            {renderSummaryCard(summary)}
          </div>
        </>
      );
    } else {
      const isTablet = window.innerWidth <= 1024 && window.innerWidth > 768;
      const itemsPerRow = isTablet ? 2 : 3;

      if (items.length <= itemsPerRow) {
        return (
          <div className="wishlist-products-grid">
            {items.map((item) => (
              <WishlistProductCard
                key={`${item.wishlistId}-${item.selectedFragrance}`}
                item={item}
                removingItem={removingItem}
                removeFromWishlist={removeFromWishlist}
                handleProductClick={handleProductClick}
                productImages={productImages}
              />
            ))}
            {renderSummaryCard(summary)}
          </div>
        );
      } else {
        const firstRowItems = items.slice(0, itemsPerRow);
        const remainingItems = items.slice(itemsPerRow);

        return (
          <>
            <div className="wishlist-products-grid">
              {firstRowItems.map((item) => (
                <WishlistProductCard
                  key={`${item.wishlistId}-${item.selectedFragrance}`}
                  item={item}
                  removingItem={removingItem}
                  removeFromWishlist={removeFromWishlist}
                  handleProductClick={handleProductClick}
                  productImages={productImages}
                />
              ))}
              {renderSummaryCard(summary)}
            </div>
            {remainingItems.length > 0 && (
              <div className="wishlist-products-grid">
                {remainingItems.map((item) => (
                  <WishlistProductCard
                    key={`${item.wishlistId}-${item.selectedFragrance}`}
                    item={item}
                    removingItem={removingItem}
                    removeFromWishlist={removeFromWishlist}
                    handleProductClick={handleProductClick}
                    productImages={productImages}
                  />
                ))}
              </div>
            )}
          </>
        );
      }
    }
  };

  // Loading State
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
        <div className="wishlist-loading-container">
          <div className="wishlist-loading-spinner"></div>
        </div>
      </div>
    );
  }

  // No Token State
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
        <div className="wishlist-login-prompt">
          <h2>Login Required</h2>
          <p>Please login to view your wishlist.</p>
          <div className="wishlist-auth-buttons">
            <button
              className="wishlist-login-btn"
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

  // Empty Wishlist State
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
        <div className="wishlist-empty-container">
          <div className="wishlist-empty-icon">💔</div>
          <h2>Your wishlist is empty</h2>
          <p className="wishlist-empty-message">
            Looks like you haven't added any items to your wishlist yet.
          </p>
          <button
            className="wishlist-empty-btn"
            onClick={() => navigate('/')}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Error State
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
        <div className="wishlist-empty-container">
          <div className="wishlist-empty-icon">⚠️</div>
          <h2>Oops! Something went wrong</h2>
          <p className="wishlist-empty-message">{error}</p>
          <button
            className="wishlist-empty-btn"
            onClick={fetchWishlist}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Main Render
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

      <div className="wishlist-container">
        <div className="wishlist-header">
          <h1>My Wishlist</h1>
        </div>

        <div className="wishlist-content">
          {renderProductsWithSummary()}
        </div>
      </div>
    </div>
  );
}

export default Wishlist;