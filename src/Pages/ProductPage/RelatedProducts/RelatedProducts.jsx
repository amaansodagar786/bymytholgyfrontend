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
import "./RelatedProducts.scss";

const RelatedProducts = ({
  productId,
  currentFragrances = [],
  categoryId,
  currentProductType,
  currentModelId
}) => {
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [showWishlistSidebar, setShowWishlistSidebar] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updatingProductId, setUpdatingProductId] = useState(null); // ✅ Track updating product
  const [swiper, setSwiper] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchRelatedProducts();
  }, [productId, currentFragrances, categoryId]);

  // ✅ Fetch wishlist when products load
  useEffect(() => {
    if (relatedProducts.length > 0) {
      fetchUserWishlist();
    }
  }, [relatedProducts]);

  // ✅ REMOVED event listener - No more wishlistUpdated event

  const fetchRelatedProducts = async () => {
    try {
      setLoading(true);
      
      // FIRST: Try to fetch products with offers from fragrance API
      if (currentFragrances && currentFragrances.length > 0) {
        try {
          // Get all products with offers first
          const offersResponse = await axios.get(
            `${import.meta.env.VITE_API_URL}/productoffers/public-products-with-offers`
          );
          
          // Then get fragrance-based related products
          const fragranceResponse = await axios.post(
            `${import.meta.env.VITE_API_URL}/products/related-by-fragrances`,
            {
              productId,
              fragrances: currentFragrances,
              categoryId,
              limit: 12
            }
          );
          
          if (fragranceResponse.data.success && fragranceResponse.data.products.length > 0) {
            // Create a map of products with offers for quick lookup
            const offersMap = {};
            offersResponse.data.forEach(product => {
              if (product.colors?.[0]?.hasOffer) {
                offersMap[product.productId] = {
                  ...product,
                  hasOffer: true,
                  offer: product.colors[0].offer
                };
              }
            });
            
            // Merge: Take fragrance-based products and add offer data if available
            const mergedProducts = fragranceResponse.data.products
              .filter(product => product.productId !== productId)
              .slice(0, 8)
              .map(product => {
                const productWithOffer = offersMap[product.productId];
                if (productWithOffer) {
                  return {
                    ...product,
                    colors: productWithOffer.colors
                  };
                }
                return product;
              });
            
            setRelatedProducts(mergedProducts);
            return;
          }
        } catch (offerErr) {
          console.log("Could not fetch offers data:", offerErr.message);
        }
      }
      
      // FALLBACK: Original logic without offers
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

      const filteredProducts = response.data
        .filter(product => product.productId !== productId)
        .slice(0, 8);

      setRelatedProducts(filteredProducts);
    } catch (error) {
      console.error("Error fetching all products:", error);
      setRelatedProducts([]);
    }
  };

  // ✅ UPDATED: Fetch wishlist with first fragrance logic
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
            const product = relatedProducts.find(p => p.productId === item.productId);
            if (product) {
              const firstFragrance = product.colors?.[0]?.fragrances?.[0] || null;
              if (item.selectedFragrance === firstFragrance) {
                firstFragranceWishlistMap[item.productId] = true;
              }
            }
          }
        });

        // Set wishlist status based on the map
        relatedProducts.forEach(product => {
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
      setUpdatingProductId(null);
    }
  };

  // ✅ Calculate price with offer
  const calculatePriceWithOffer = (color) => {
    if (!color) {
      return {
        finalPrice: 0,
        originalPrice: 0,
        discount: 0,
        hasOffer: false,
        offerLabel: null,
        offerPercentage: 0
      };
    }
    
    const originalPrice = Number(color.originalPrice) || 0;
    const baseCurrentPrice = Number(color.currentPrice) || originalPrice;
    const hasColorOffer = color.hasOffer && color.offer?.isCurrentlyValid;
    const offerPercentage = hasColorOffer ? Number(color.offer.offerPercentage) : 0;
    
    let finalPrice = baseCurrentPrice;
    let discountPercentage = 0;
    
    if (hasColorOffer && offerPercentage > 0) {
      const offerDiscountAmount = (baseCurrentPrice * offerPercentage) / 100;
      finalPrice = baseCurrentPrice - offerDiscountAmount;
      
      if (finalPrice < 0) finalPrice = 0;
      
      if (originalPrice > 0) {
        const totalDiscount = originalPrice - finalPrice;
        discountPercentage = Math.round((totalDiscount / originalPrice) * 100);
      }
    } else {
      if (originalPrice > 0 && baseCurrentPrice < originalPrice) {
        finalPrice = baseCurrentPrice;
        discountPercentage = Math.round(((originalPrice - baseCurrentPrice) / originalPrice) * 100);
      }
    }
    
    return {
      finalPrice: parseFloat(finalPrice.toFixed(2)),
      originalPrice: originalPrice,
      discount: discountPercentage,
      hasOffer: hasColorOffer,
      offerLabel: hasColorOffer ? color.offer.offerLabel : null,
      offerPercentage: offerPercentage
    };
  };

  // ✅ UPDATED: Improved toggleWishlist with immediate UI update
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
    const productIdToUpdate = product.productId;

    // ✅ Get FIRST FRAGRANCE from product
    const firstFragrance = product.colors?.[0]?.fragrances?.[0] || null;

    // ✅ Set updating flag
    setUpdatingProductId(productIdToUpdate);

    try {
      // ✅ Update UI IMMEDIATELY and PERSISTENTLY
      setWishlist(prev => ({
        ...prev,
        [productIdToUpdate]: !isCurrentlyWishlisted
      }));

      if (isCurrentlyWishlisted) {
        // ✅ Remove with FIRST FRAGRANCE
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/wishlist/remove/${productIdToUpdate}?userId=${userId}&fragrance=${firstFragrance}`,
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
        const priceInfo = calculatePriceWithOffer(color);

        const wishlistData = {
          userId,
          productId: productIdToUpdate,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          addedFrom: "related-products",
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

      // ✅ Refresh wishlist after delay to sync with server
      setTimeout(() => {
        fetchUserWishlist();
      }, 500);

    } catch (error) {
      console.error("Error toggling wishlist:", error);

      // ✅ ROLLBACK if error occurs
      setWishlist(prev => ({
        ...prev,
        [productIdToUpdate]: isCurrentlyWishlisted
      }));

      setUpdatingProductId(null); // Reset flag

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("already in your wishlist")) {
          // Mark as wishlisted
          setWishlist(prev => ({
            ...prev,
            [productIdToUpdate]: true
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

  const createProductSlug = (productName) => {
    return productName
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '-');
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
              0: {
                slidesPerView: 2,
                spaceBetween: 15
              },
              576: {
                slidesPerView: 2
              },
              992: {
                slidesPerView: 3
              },
              1200: {
                slidesPerView: 5
              },
            }}
          >
            {relatedProducts.map((product) => {
              const color = product.colors?.[0];
              const image = product.thumbnailImage || color?.images?.[0];
              const isWishlisted = wishlist[product.productId] || false;
              const isUpdating = updatingProductId === product.productId; // ✅ Check if updating
              
              const priceInfo = calculatePriceWithOffer(color);
              
              return (
                <SwiperSlide key={product.productId}>
                  <div
                    className="related-product-item"
                    onClick={() => {
                      const urlName = createProductSlug(product.productName);
                      navigate(`/product/${urlName}`, {
                        state: {
                          productId: product.productId
                        }
                      });
                    }}
                  >
                    <div className="image-wrapper">
                      {priceInfo.hasOffer && (
                        <div className="special-offer-badge">
                          {priceInfo.offerLabel || "Special Offer"}
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
                        ₹{formatCurrency(priceInfo.finalPrice)}
                      </span>

                      {priceInfo.originalPrice > priceInfo.finalPrice && (
                        <>
                          <span className="original">
                            ₹{formatCurrency(priceInfo.originalPrice)}
                          </span>
                          {priceInfo.discount > 0 && (
                            <span className="off-badge">
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