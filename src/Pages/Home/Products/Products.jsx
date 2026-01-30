import React, { useEffect, useState } from "react";
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
  const [updatingProductId, setUpdatingProductId] = useState(null); // ✅ Track which product is updating

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

  // ❌ REMOVE THIS EVENT LISTENER - It's causing the problem!
  // useEffect(() => {
  //   const handleWishlistUpdate = () => {
  //     fetchUserWishlist();
  //   };
  //   window.addEventListener("wishlistUpdated", handleWishlistUpdate);
  //   return () => {
  //     window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
  //   };
  // }, []);

  // ✅ FETCH PRODUCTS WITH DEBUG
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

  // ✅ UPDATED: Fetch wishlist
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

      if (response.data && response.data.wishlist && Array.isArray(response.data.wishlist)) {
        // Create a map of productId -> wishlist items with FIRST FRAGRANCE
        const firstFragranceWishlistMap = {};

        response.data.wishlist.forEach(item => {
          if (item.productId && item.isActive) {
            const product = products.find(p => p.productId === item.productId);
            if (product) {
              const firstFragrance = product.colors?.[0]?.fragrances?.[0] || null;
              if (item.selectedFragrance === firstFragrance) {
                firstFragranceWishlistMap[item.productId] = true;
              }
            }
          }
        });

        // Set wishlist status based on the map
        products.forEach(product => {
          const productId = product.productId;
          // ✅ Don't update if this product is currently being updated
          if (productId !== updatingProductId) {
            wishlistStatus[productId] = firstFragranceWishlistMap[productId] || false;
          }
        });
      }

      setWishlist(prev => ({
        ...prev,
        ...wishlistStatus
      }));

      setUpdatingProductId(null); // ✅ Reset updating flag

    } catch (error) {
      console.error("Error fetching wishlist:", error);
      setUpdatingProductId(null); // ✅ Reset on error too
    }
  };

  // ✅ SIMPLE PRICE CALCULATION
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

    // ✅ Get FIRST FRAGRANCE from product
    const firstFragrance = product.colors?.[0]?.fragrances?.[0] || null;

    // ✅ Set updating flag
    setUpdatingProductId(productId);

    try {
      // ✅ Update UI IMMEDIATELY and PERSISTENTLY
      setWishlist(prev => ({
        ...prev,
        [productId]: !isCurrentlyWishlisted // Toggle state
      }));

      if (isCurrentlyWishlisted) {
        // ✅ Remove with FIRST FRAGRANCE
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
        // ✅ Add to wishlist with FIRST FRAGRANCE
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

      // ✅ FIX: ADD THIS LINE - Dispatch event to update navbar
      window.dispatchEvent(new Event('wishlistUpdated'));

      // ✅ You can remove this setTimeout if you want instant update
      // setTimeout(() => {
      //   fetchUserWishlist();
      // }, 500);

    } catch (error) {
      console.error("Error toggling wishlist:", error);

      // ✅ ROLLBACK if error occurs
      setWishlist(prev => ({
        ...prev,
        [productId]: isCurrentlyWishlisted
      }));

      setUpdatingProductId(null); // Reset flag

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("already in your wishlist")) {
          // Mark as wishlisted
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

  return (
    <>
      {/* Toast Container - Positioned at top center */}
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

      <section className="products-showcase">
        <div className="products-slider-container">
          {isLoading ? (
            <div className="loading-products">
              <div className="loading-spinner"></div>
              <p>Loading products...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p className="error-message">{error}</p>
              <button className="retry-btn" onClick={fetchProducts}>
                Try Again
              </button>
            </div>
          ) : products.length === 0 ? (
            <div className="empty-state">
              <p>No products found</p>
            </div>
          ) : (
            <Swiper
              modules={[Navigation]}
              slidesPerView={5}
              spaceBetween={32}
              navigation={{
                nextEl: ".prod-next",
                prevEl: ".prod-prev",
              }}
              breakpoints={{
                0: { slidesPerView: 2, spaceBetween: 15 },
                768: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 5, spaceBetween: 32 },
              }}
            >
              {products.map((product) => {
                const color = product.colors?.[0];
                const image = product.thumbnailImage || color?.images?.[0];
                const isWishlisted = wishlist[product.productId] || false;
                const isUpdating = updatingProductId === product.productId; // ✅ Check if updating

                const priceInfo = calculatePrice(color);

                return (
                  <SwiperSlide key={product.productId}>
                    <div
                      className="product-item"
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
                      <div className="image-wrapper">
                        {priceInfo.hasOffer && (
                          <div className="special-offer-badge">
                            {priceInfo.offerLabel}
                          </div>
                        )}

                        <button
                          className={`wishlist-btn ${isWishlisted ? 'wishlisted' : ''} ${isUpdating ? 'updating' : ''}`}
                          onClick={(e) => toggleWishlist(product, e)}
                          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                          disabled={isUpdating} // ✅ Disable while updating
                        >
                          {isUpdating ? (
                            <span className="loading-spinner-small"></span>
                          ) : isWishlisted ? (
                            <FaHeart className="wishlist-icon filled" />
                          ) : (
                            <FaRegHeart className="wishlist-icon" />
                          )}
                        </button>

                        {image && (
                          <img
                            src={image}
                            alt={product.productName}
                            loading="lazy"
                          />
                        )}
                      </div>

                      <h3 className="product-name">
                        {product.productName}
                      </h3>

                      <p className="desc">
                        {product.description || " "}
                      </p>

                      <div className="price-row">
                        <span className="price">
                          ₹{priceInfo.finalPrice}
                        </span>

                        {priceInfo.originalPrice > priceInfo.finalPrice && (
                          <span className="original">
                            ₹{priceInfo.originalPrice}
                          </span>
                        )}

                        {priceInfo.discount > 0 && (
                          <span className="off-badge">
                            {priceInfo.discount}% OFF
                          </span>
                        )}
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          )}

          <div className="slider-arrows">
            <button className="prod-prev" aria-label="Previous">
              <FaArrowLeft className="arrow-icon" />
            </button>
            <button className="prod-next" aria-label="Next">
              <FaArrowRight className="arrow-icon" />
            </button>
          </div>
        </div>
      </section>
    </>
  );
};

export default Products;