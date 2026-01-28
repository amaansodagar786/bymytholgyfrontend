import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import WishlistSidebar from "../../Wishlist/Sidebar/WishlistSidebar";
import LoginModal from "../../../Components/Login/LoginModel/LoginModal";
import "swiper/css";
import "swiper/css/navigation";
import "./RelatedProducts.scss";

const RelatedProducts = ({
  productId,
  currentFragrances = [],
  categoryId,
  currentProductType,
  currentModelId
}) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlistStatus, setWishlistStatus] = useState({});
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const [showWishlistSidebar, setShowWishlistSidebar] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [swiper, setSwiper] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId, currentFragrances, categoryId]);

  // Fetch wishlist status for all related products
  useEffect(() => {
    if (relatedProducts.length > 0) {
      fetchUserWishlist();
    }
  }, [relatedProducts]);

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = () => {
      fetchUserWishlist();
    };

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => {
      window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
    };
  }, []);

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);

      // If we have fragrances, find products with same fragrances
      if (currentFragrances && currentFragrances.length > 0) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/products/related-by-fragrances`,
          {
            productId,
            fragrances: currentFragrances,
            categoryId,
            limit: 8
          }
        );

        if (response.data.success) {
          setRelatedProducts(response.data.products);
        } else {
          await fetchByCategory();
        }
      } else {
        await fetchByCategory();
      }
    } catch (error) {
      console.error("Error fetching related products:", error);
      await fetchByCategory();
    } finally {
      setLoading(false);
    }
  };

  const fetchByCategory = async () => {
    try {
      if (!categoryId) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/category/${categoryId}`
      );

      // Filter out current product and limit to 8
      const filteredProducts = response.data
        .filter(product => product.productId !== productId)
        .slice(0, 8);

      setRelatedProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching category products:", error);
      await fetchAllProducts();
    }
  };

  const fetchAllProducts = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/all`
      );

      // Filter out current product and limit to 8
      const filteredProducts = response.data
        .filter(product => product.productId !== productId)
        .slice(0, 8);

      setRelatedProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching all products:", error);
      setRelatedProducts([]);
    }
  };

  // ✅ FIXED: Correct wishlist endpoint
  const fetchUserWishlist = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setLoadingWishlist(false);
      return;
    }

    try {
      setLoadingWishlist(true);

      // ✅ CORRECT ENDPOINT: /wishlist/my-wishlist with userId as query param
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/my-wishlist`,
        {
          params: { userId },
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const wishlistStatus = {};

      // ✅ Correct response structure: response.data.wishlist
      if (response.data && response.data.wishlist && Array.isArray(response.data.wishlist)) {
        response.data.wishlist.forEach(item => {
          if (item.productId) {
            wishlistStatus[item.productId] = true;
          }
        });
      }

      setWishlistStatus(wishlistStatus);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  // ✅ FIXED: Correct wishlist toggle
  const toggleWishlist = async (product, e) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setShowLoginModal(true);
      return;
    }

    const isCurrentlyWishlisted = wishlistStatus[product.productId];
    const productIdToUpdate = product.productId;

    try {
      if (isCurrentlyWishlisted) {
        // ✅ CORRECT DELETE ENDPOINT
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/wishlist/remove/${productIdToUpdate}?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setWishlistStatus(prev => ({
          ...prev,
          [productIdToUpdate]: false
        }));

      } else {
        // ✅ CORRECT ADD TO WISHLIST
        const wishlistData = {
          userId,
          productId: productIdToUpdate,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          addedFrom: "related-products",
          selectedFragrance: product.colors?.[0]?.fragrances?.[0] || null,
          selectedModel: null,
          selectedSize: null,
          selectedColor: product.colors?.[0] ? {
            colorId: product.colors[0].colorId,
            colorName: product.colors[0].colorName,
            currentPrice: product.colors[0].currentPrice || 0,
            originalPrice: product.colors[0].originalPrice || 0
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

        setWishlistStatus(prev => ({
          ...prev,
          [productIdToUpdate]: true
        }));

        // Open wishlist sidebar on desktop
        if (window.innerWidth > 768) {
          setShowWishlistSidebar(true);
        }
      }

      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  if (loading) {
    return (
      <div className="related-products-loading">
        <div className="loading-spinner"></div>
        <p>Loading related products...</p>
      </div>
    );
  }

  if (relatedProducts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Wishlist Sidebar */}
      <WishlistSidebar
        isOpen={showWishlistSidebar}
        onClose={() => setShowWishlistSidebar(false)}
      />

      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal
          onClose={() => {
            setShowLoginModal(false);
            fetchUserWishlist();
          }}
          showRegisterLink={true}
        />
      )}

      {/* Related Products Section */}
      <section className="related-products-showcase">
        <div className="section-header">
          <h2 className="section-title">You Might Also Like</h2>
          <p className="section-subtitle">Products with similar fragrances</p>
        </div>

        <div className="related-products-slider-container">
          <Swiper
            onSwiper={setSwiper}
            modules={[Navigation]}
            slidesPerView={4}
            spaceBetween={48}
            navigation={{
              nextEl: ".related-prod-next",
              prevEl: ".related-prod-prev",
            }}
            breakpoints={{
              0: { slidesPerView: 1 },
              576: { slidesPerView: 2 },
              992: { slidesPerView: 3 },
              1200: { slidesPerView: 4 },
            }}
          >
            {relatedProducts.map((product) => {
              const color = product.colors?.[0];
              const image = color?.images?.[0] || product.thumbnailImage;
              const currentPrice = color?.currentPrice ?? 0;
              const originalPrice = color?.originalPrice ?? 0;
              const isWishlisted = wishlistStatus[product.productId] || false;

              const discount =
                originalPrice > currentPrice
                  ? Math.round(
                    ((originalPrice - currentPrice) / originalPrice) * 100
                  )
                  : 0;

              return (
                <SwiperSlide key={product.productId}>
                  <div
                    className="related-product-item"
                    onClick={() => {
                      // Create URL-friendly name
                      const urlName = product.productName
                        .toLowerCase()
                        .replace(/[^\w\s]/g, '') // Remove special chars
                        .replace(/\s+/g, '-');   // Replace spaces with hyphens

                      // Navigate with state
                      navigate(`/product/${urlName}`, {
                        state: {
                          productId: product.productId  // Pass ID in state
                        }
                      });
                    }}
                  >
                    <div className="image-wrapper">
                      {/* Wishlist Button */}
                      <button
                        className={`wishlist-btn ${isWishlisted ? 'wishlisted' : ''}`}
                        onClick={(e) => toggleWishlist(product, e)}
                        aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                        disabled={loadingWishlist}
                      >
                        {loadingWishlist ? (
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
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
                          }}
                        />
                      )}
                    </div>

                    <h3 className="product-name">
                      {product.productName}
                    </h3>

                    <div className="price-row">
                      <span className="price">
                        ₹{currentPrice.toLocaleString()}
                      </span>

                      {originalPrice > currentPrice && (
                        <>
                          <span className="original">
                            ₹{originalPrice.toLocaleString()}
                          </span>
                          {discount > 0 && (
                            <span className="off-badge">
                              {discount}% OFF
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

          {relatedProducts.length > 4 && (
            <div className="slider-arrows">
              <button className="related-prod-prev" aria-label="Previous">
                <FaArrowLeft className="arrow-icon" />
              </button>
              <button className="related-prod-next" aria-label="Next">
                <FaArrowRight className="arrow-icon" />
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default RelatedProducts;