import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import WishlistSidebar from "../../Wishlist/Sidebar/WishlistSidebar";
import LoginModal from "../../../Components/Login/LoginModel/LoginModal";
import "swiper/css";
import "swiper/css/navigation";
import "react-toastify/dist/ReactToastify.css";
import "./Products.scss";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [showWishlistSidebar, setShowWishlistSidebar] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingProductId, setUpdatingProductId] = useState(null);

  const swiperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchUserWishlist();
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      fetchUserWishlist();
    }
  }, [products]);

  const fetchUserWishlist = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      return;
    }

    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/my-wishlist`,
        {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const wishlistStatus = {};
      if (response.data?.wishlist?.length > 0) {
        response.data.wishlist.forEach(item => {
          if (item.productId && item.isActive) {
            wishlistStatus[item.productId] = true;
          }
        });
      }

      setWishlist(wishlistStatus);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/public-products-with-offers`
      );
      setProducts(res.data);
    } catch (err) {
      console.error("❌ Error from API:", err.response?.data || err.message);
      setError("Failed to load products.");
      toast.error("Failed to load products. Please try again.");
      try {
        const fallbackRes = await axios.get(
          `${import.meta.env.VITE_API_URL}/products/all`
        );
        setProducts(fallbackRes.data);
        toast.info("Showing basic product list");
      } catch (fallbackErr) {
        console.error("❌ Fallback failed:", fallbackErr);
        toast.error("Could not load any products. Please check your connection.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePrice = (color) => {
    if (!color) return { finalPrice: 0, discount: 0, hasOffer: false };
    const originalPrice = Number(color.originalPrice) || 0;
    let currentPrice = Number(color.currentPrice) || originalPrice;
    let discount = 0;
    let hasOffer = false;
    let offerLabel = "";
    let offerPercentage = 0;

    if (color.hasOffer && color.offer?.isCurrentlyValid) {
      hasOffer = true;
      offerLabel = color.offer.offerLabel || "Special Offer";
      offerPercentage = Number(color.offer.offerPercentage) || 0;
      const offerDiscount = (currentPrice * offerPercentage) / 100;
      currentPrice = currentPrice - offerDiscount;
    }

    if (originalPrice > 0 && currentPrice < originalPrice) {
      discount = Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }

    return {
      finalPrice: parseFloat(currentPrice.toFixed(2)),
      originalPrice: originalPrice,
      discount: discount,
      hasOffer: hasOffer,
      offerLabel: offerLabel,
      offerPercentage: offerPercentage
    };
  };

  const toggleWishlist = async (product, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setShowLoginModal(true);
      toast.info("Please login to add items to wishlist");
      return;
    }

    const isCurrentlyWishlisted = wishlist[product.productId];
    const productId = product.productId;
    const firstFragrance = product.colors?.[0]?.fragrances?.[0] || null;

    setUpdatingProductId(productId); // ✅ Set updating

    try {
      // ✅ Update UI immediately
      setWishlist(prev => ({
        ...prev,
        [productId]: !isCurrentlyWishlisted
      }));

      if (isCurrentlyWishlisted) {
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/wishlist/remove/${productId}?userId=${userId}&fragrance=${firstFragrance}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success("Removed from wishlist");
      } else {
        const color = product.colors?.[0];
        const priceInfo = calculatePrice(color);
        const wishlistData = {
          userId,
          productId: productId,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          addedFrom: "home",
          selectedFragrance: firstFragrance,
          selectedModel: null,
          selectedSize: null,
          selectedColor: color ? {
            colorId: color.colorId,
            colorName: color.colorName,
            currentPrice: priceInfo.finalPrice,
            originalPrice: priceInfo.originalPrice
          } : null
        };

        await axios.post(
          `${import.meta.env.VITE_API_URL}/wishlist/add`,
          wishlistData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        toast.success("Added to wishlist!");
        if (window.innerWidth > 768) {
          setShowWishlistSidebar(true);
        }
      }

      // ✅ IMPORTANT: Reset updating flag after successful operation
      setUpdatingProductId(null);

      // Refresh wishlist to sync with server
      fetchUserWishlist();

      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (error) {
      console.error("Error toggling wishlist:", error);

      // ✅ Rollback UI on error
      setWishlist(prev => ({
        ...prev,
        [productId]: isCurrentlyWishlisted
      }));

      // ✅ Reset updating flag on error too
      setUpdatingProductId(null);

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("already in your wishlist")) {
          // If already in wishlist, mark it as wishlisted
          setWishlist(prev => ({
            ...prev,
            [productId]: true
          }));
          toast.info("Already in your wishlist");
        } else {
          toast.error(error.response.data.message);
        }
      } else {
        toast.error("Error updating wishlist. Please try again.");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
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

      <WishlistSidebar
        isOpen={showWishlistSidebar}
        onClose={() => setShowWishlistSidebar(false)}
      />

      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
            fetchUserWishlist();
          }}
          showRegisterLink={true}
        />
      )}

      <section className="product-showcase">
        <div className="product-section-header">
          <h2 className="product-section-title">Our Products</h2>
          <p className="product-section-subtitle">Discover our exclusive collection</p>
        </div>

        <div className="product-slider-container">
          {isLoading ? (
            <div className="product-loading">
              <div className="product-loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="product-error-state">
              <p className="product-error-message">{error}</p>
              <button className="product-retry-btn" onClick={fetchProducts}>
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="product-empty-state">
              <p>No products found</p>
            </div>
          ) : (
            <>
              <Swiper
                ref={swiperRef}
                modules={[Navigation]}
                slidesPerView={5}
                spaceBetween={48}
                loop={false}
                navigation={{
                  nextEl: ".product-next",
                  prevEl: ".product-prev",
                }}
                breakpoints={{
                  0: {
                    slidesPerView: 1,
                    spaceBetween: 15
                  },
                  576: {
                    slidesPerView: 2,
                    spaceBetween: 20
                  },
                  768: {
                    slidesPerView: 2,
                    spaceBetween: 20
                  },
                  992: {
                    slidesPerView: 3,
                    spaceBetween: 30
                  },
                  1200: {
                    slidesPerView: 5,
                    spaceBetween: 48
                  },
                }}
              >
                {products.map((product) => {
                  const color = product.colors?.[0];
                  const image = product.thumbnailImage || color?.images?.[0];
                  const isWishlisted = wishlist[product.productId] || false;
                  const isUpdating = updatingProductId === product.productId;
                  const priceInfo = calculatePrice(color);

                  return (
                    <SwiperSlide key={product.productId}>
                      <div
                        className="product-card"
                        onClick={() => {
                          const urlName = product.productName
                            .toLowerCase()
                            .replace(/[^\w\s]/g, '')
                            .replace(/\s+/g, '-');
                          navigate(`/product/${urlName}`, {
                            state: { productId: product.productId }
                          });
                        }}
                      >
                        <div className="product-image-container">
                          {priceInfo.hasOffer && (
                            <div className="product-special-badge">
                              {priceInfo.offerLabel}
                            </div>
                          )}

                          <button
                            className={`product-wishlist-btn ${isWishlisted ? 'product-wishlisted' : ''} ${isUpdating ? 'product-updating' : ''}`}
                            onClick={(e) => toggleWishlist(product, e)}
                            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                            disabled={isUpdating}
                          >
                            {isUpdating ? (
                              <span className="product-loading-small"></span>
                            ) : isWishlisted ? (
                              <FaHeart className="product-wishlist-icon product-filled" />
                            ) : (
                              <FaRegHeart className="product-wishlist-icon" />
                            )}
                          </button>

                          {image && (
                            <img
                              src={image}
                              alt={product.productName}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                              }}
                            />
                          )}
                        </div>

                        <h3 className="product-card-name">
                          {product.productName}
                        </h3>

                        <p className="product-card-desc">
                          {product.description || "Premium quality product"}
                        </p>

                        <div className="product-price-container">
                          <span className="product-price-current">
                            ₹{formatCurrency(priceInfo.finalPrice)}
                          </span>

                          {priceInfo.originalPrice > priceInfo.finalPrice && (
                            <>
                              <span className="product-price-original">
                                ₹{formatCurrency(priceInfo.originalPrice)}
                              </span>
                              {priceInfo.discount > 0 && (
                                <span className="product-discount-badge">
                                  {priceInfo.discount}% OFF
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>

              {/* ✅ ARROWS - Show only when there are enough products */}
              {products.length > 5 && (
                <div className="product-slider-arrows">
                  <button className="product-prev" aria-label="Previous">
                    <FaArrowLeft className="product-arrow-icon" />
                  </button>
                  <button className="product-next" aria-label="Next">
                    <FaArrowRight className="product-arrow-icon" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

export default Products;