import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "./Products.scss";

const Products = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
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

  return (
    <section className="products-showcase">
      {/* <h2 className="section-title">Our Products</h2>  */}

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
            const image =
              color?.images?.[0] || product.thumbnailImage;

            const currentPrice = color?.currentPrice ?? 0;
            const originalPrice = color?.originalPrice ?? 0;

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
                  onClick={() =>
                    navigate(`/product/${product.productId}`)
                  }
                >
                  <div className="image-wrapper">
                    {/* Wishlist */}
                    <button
                      className="wishlist-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        // wishlist logic can be added here
                      }}
                    >
                      ♡
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

        {/* Navigation Arrows */}
        <div className="slider-arrows">
          <button className="prod-prev" aria-label="Previous">
            <svg viewBox="0 0 24 24">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <button className="prod-next" aria-label="Next">
            <svg viewBox="0 0 24 24">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

export default Products;
