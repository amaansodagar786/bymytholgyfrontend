import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import { FaArrowLeft, FaArrowRight } from "react-icons/fa6";
import { FaRegHeart, FaHeart } from "react-icons/fa";
import "swiper/css";
import "swiper/css/navigation";
import "./Products.scss";

const Products = () => {
  const [products, setProducts] = useState([]);
  const [wishlist, setWishlist] = useState({}); // Track wishlist status
  const [loadingWishlist, setLoadingWishlist] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    fetchUserWishlist();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/all`
      );
      setProducts(res.data);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  // Fetch user's wishlist from API
  const fetchUserWishlist = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      setLoadingWishlist(false);
      return;
    }

    try {
      setLoadingWishlist(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/user/${userId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Create wishlist status object from API data
      const wishlistStatus = {};
      if (response.data && Array.isArray(response.data)) {
        response.data.forEach(item => {
          if (item.productId) {
            wishlistStatus[item.productId] = true;
          }
        });
      }

      setWishlist(wishlistStatus);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    } finally {
      setLoadingWishlist(false);
    }
  };

  // Toggle wishlist status using API
  const toggleWishlist = async (product, e) => {
    e.stopPropagation();

    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // Check if user is logged in
    if (!token || !userId) {
      alert("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    const isCurrentlyWishlisted = wishlist[product.productId];
    const productId = product.productId;

    try {
      if (isCurrentlyWishlisted) {
        // Remove from wishlist
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
        setWishlist(prev => ({
          ...prev,
          [productId]: false
        }));

      } else {
        // Add to wishlist (without fragrance/model/size selection)
        const wishlistData = {
          userId,
          productId: productId,
          productName: product.productName,
          categoryId: product.categoryId,
          categoryName: product.categoryName,
          addedFrom: "home",
          selectedFragrance: null,  // No fragrance selection
          selectedModel: null,       // No model selection
          selectedSize: null,        // No size selection
          // Include default color if available
          selectedColor: product.colors?.[0] ? {
            colorId: product.colors[0].colorId,
            colorName: product.colors[0].colorName,
            currentPrice: product.colors[0].currentPrice || 0,
            originalPrice: product.colors[0].originalPrice || 0
          } : null
        };

        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/wishlist/add`,
          wishlistData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Update local state
        setWishlist(prev => ({
          ...prev,
          [productId]: true
        }));
      }

      // Dispatch event for other components to update
      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (error) {
      console.error("Error toggling wishlist:", error);

      if (error.response?.data?.message) {
        if (error.response.data.message.includes("already in your wishlist")) {
          // Product already in wishlist, update state
          setWishlist(prev => ({
            ...prev,
            [productId]: true
          }));
        } else {
          alert(error.response.data.message);
        }
      } else {
        alert("Error updating wishlist. Please try again.");
      }
    }
  };

  return (
    <section className="products-showcase">
      <div className="products-slider-container">
        <Swiper
          modules={[Navigation]}
          slidesPerView={4}
          spaceBetween={48}
          navigation={{
            nextEl: ".prod-next",
            prevEl: ".prod-prev",
          }}
          breakpoints={{
            0: { slidesPerView: 1 },
            768: { slidesPerView: 2 },
            1024: { slidesPerView: 4 },
          }}
        >
          {products.map((product) => {
            const color = product.colors?.[0];
            const image = color?.images?.[0] || product.thumbnailImage;
            const currentPrice = color?.currentPrice ?? 0;
            const originalPrice = color?.originalPrice ?? 0;

            // Check if product is in wishlist
            const isWishlisted = wishlist[product.productId] || false;

            const discount =
              originalPrice > currentPrice
                ? Math.round(
                  ((originalPrice - currentPrice) / originalPrice) * 100
                )
                : 0;

            return (
              <SwiperSlide key={product.productId}>
                <div
                  className="product-item"
                  onClick={() => navigate(`/product/${product.productId}`)}
                >
                  <div className="image-wrapper">
                    {/* Wishlist Button with Conditional Icon */}
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
                      />
                    )}
                  </div>

                  <h3 className="product-name">
                    {product.productName}
                  </h3>

                  {/* Always reserve 2 lines */}
                  <p className="desc">
                    {product.description || " "}
                  </p>

                  <div className="price-row">
                    <span className="price">
                      ₹{currentPrice}
                    </span>

                    {originalPrice > currentPrice && (
                      <span className="original">
                        ₹{originalPrice}
                      </span>
                    )}

                    {discount > 0 && (
                      <span className="off-badge">
                        {discount}% OFF
                      </span>
                    )}
                  </div>
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>

        {/* Navigation Arrows with React Icons */}
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
  );
};

export default Products;