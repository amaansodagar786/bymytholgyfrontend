import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Home.scss";

function Home() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [wishlist, setWishlist] = useState({}); // Changed to object with productId as key
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [currentSlide, setCurrentSlide] = useState(0);
  const [visibleProducts, setVisibleProducts] = useState(8);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Category icons for dummy images
  const categoryIcons = [
    "📱", "💻", "👕", "👟", "🛋️", "📚", "🍳", "🎮", "⚽", "💄"
  ];

  // Fetch categories, products, and wishlist
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch categories
      const categoriesRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/categories/get`
      );

      // Add icons to categories for dummy images
      const categoriesWithIcons = categoriesRes.data.map((cat, index) => ({
        ...cat,
        icon: categoryIcons[index % categoryIcons.length]
      }));
      setCategories(categoriesWithIcons);

      // Fetch products
      const [productsRes, offersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/products/all`),
        axios.get(`${import.meta.env.VITE_API_URL}/productoffers/active-color-offers`)
      ]);

      const processedProducts = processProducts(productsRes.data, offersRes.data);
      setProducts(processedProducts);
      setFilteredProducts(processedProducts);

      // Fetch user's wishlist if logged in
      if (token) {
        await fetchUserWishlist();
      }

    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch user's wishlist from backend
  const fetchUserWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) {
        console.warn("No token or userId found");
        return;
      }

      // ✅ CORRECT: Use query parameters in URL
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/my-wishlist?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
          // ❌ REMOVE THIS: data: { userId } - NO data in GET requests!
        }
      );

      // Convert wishlist array to object for quick lookup
      const wishlistObj = {};
      response.data.wishlist.forEach(item => {
        wishlistObj[item.productId] = {
          isWishlisted: true,
          wishlistId: item.wishlistId,
          selectedModel: item.selectedModel,
          selectedColor: item.selectedColor
        };
      });

      setWishlist(wishlistObj);
      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (error) {
      console.error("Error fetching wishlist:", error.response?.data || error.message);
    }
  };

  // Handle wishlist toggle
  const toggleWishlist = async (product, e) => {
    e.stopPropagation();


    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // Check if user is logged in
    if (!token) {
      alert("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    const isCurrentlyWishlisted = wishlist[product.productId]?.isWishlisted;

    try {
      if (isCurrentlyWishlisted) {
        // Remove from wishlist
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/wishlist/remove/${product.productId}?userId=${userId}`,
          // ✅ CORRECT: using product.productId
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        // Update local state
        setWishlist(prev => {
          const newWishlist = { ...prev };
          delete newWishlist[product.productId];
          return newWishlist;
        });

      } else {
        // Add to wishlist (from home page - no model/color selection)
        const wishlistData = {
          userId,
          productId: product.productId,
          addedFrom: "home"
          // No selectedModel or selectedColor for home page
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

        // Update local state
        setWishlist(prev => ({
          ...prev,
          [product.productId]: {
            isWishlisted: true,
            selectedModel: null,
            selectedColor: null
          }
        }));
      }

      // Dispatch event for navbar update
      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (error) {
      console.error("Error toggling wishlist:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Error updating wishlist. Please try again.");
      }
    }
  };

  // Process products to group by productId and handle variants WITH OFFERS
  const processProducts = (productList, offers = []) => {
    const productMap = new Map();

    // Create offer map for quick lookup
    const offerMap = {};
    offers.forEach(offer => {
      if (offer.isCurrentlyValid) {
        const key = offer.variableModelId
          ? `${offer.productId}_${offer.variableModelId}_${offer.colorId}`
          : `${offer.productId}_${offer.colorId}`;
        offerMap[key] = offer;
      }
    });

    productList.forEach(product => {
      // Get the first color for thumbnail
      let thumbnail = product.thumbnailImage;
      let currentPrice = product.currentPrice;
      let originalPrice = product.originalPrice;
      let colors = [];
      let productOffers = []; // Array to store all offers for this product

      // Check offers for this product
      if (product.type === "simple" && product.colors) {
        product.colors.forEach(color => {
          const key = `${product.productId}_${color.colorId}`;
          const offer = offerMap[key];
          if (offer) {
            productOffers.push({
              colorId: color.colorId,
              colorName: color.colorName,
              offerPercentage: offer.offerPercentage,
              offerLabel: offer.offerLabel || `${offer.offerPercentage}% OFF`,
              isCurrentlyValid: offer.isCurrentlyValid
            });
          }
        });

        // Use first color for display
        const firstColor = product.colors[0];
        thumbnail = firstColor.images?.[0] || product.thumbnailImage;
        currentPrice = firstColor.currentPrice || product.currentPrice;
        originalPrice = firstColor.originalPrice || product.originalPrice;
        colors = product.colors.map(color => color.colorName);

      } else if (product.type === "variable" && product.models && product.models.length > 0) {
        product.models.forEach((model, modelIndex) => {
          if (model.colors) {
            model.colors.forEach(color => {
              const variableModelId = model._id || model.modelId || "";
              const key = `${product.productId}_${variableModelId}_${color.colorId}`;
              const offer = offerMap[key];
              if (offer) {
                productOffers.push({
                  colorId: color.colorId,
                  colorName: color.colorName,
                  modelName: model.modelName,
                  offerPercentage: offer.offerPercentage,
                  offerLabel: offer.offerLabel || `${offer.offerPercentage}% OFF`,
                  isCurrentlyValid: offer.isCurrentlyValid
                });
              }
            });
          }
        });

        // Use first model's first color for display
        const firstModel = product.models[0];
        if (firstModel.colors && firstModel.colors.length > 0) {
          const firstColor = firstModel.colors[0];
          thumbnail = firstColor.images?.[0] || product.thumbnailImage;
          currentPrice = firstColor.currentPrice || product.currentPrice;
          originalPrice = firstColor.originalPrice || product.originalPrice;

          // Collect colors from all models
          product.models.forEach(model => {
            if (model.colors) {
              model.colors.forEach(color => {
                if (!colors.includes(color.colorName)) {
                  colors.push(color.colorName);
                }
              });
            }
          });
        }
      }

      // Find the BEST offer (highest percentage)
      let bestOffer = null;
      if (productOffers.length > 0) {
        bestOffer = productOffers.reduce((best, current) =>
          current.offerPercentage > best.offerPercentage ? current : best
        );
      }

      // Extract first few specifications
      let specs = [];
      if (product.specifications && product.specifications.length > 0) {
        specs = product.specifications.slice(0, 3).map(spec => `${spec.key}: ${spec.value}`);
      }

      productMap.set(product.productId, {
        productId: product.productId,
        productName: product.productName,
        categoryId: product.categoryId,
        categoryName: product.categoryName,
        description: product.description,
        thumbnail: thumbnail,
        currentPrice: currentPrice,
        originalPrice: originalPrice,
        type: product.type,
        colors: colors.slice(0, 5), // Limit to 5 colors for display
        colorCount: colors.length,
        specs: specs,
        hasDiscount: originalPrice > currentPrice,
        discountPercent: originalPrice > 0
          ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
          : 0,
        // Offer information
        hasOffer: !!bestOffer,
        bestOffer: bestOffer,
        allOffers: productOffers,
        offerCount: productOffers.length,
        // Include full product data for wishlist
        fullProduct: product
      });
    });

    return Array.from(productMap.values());
  };

  // Filter products by category
  const filterByCategory = (categoryId) => {
    setActiveCategory(categoryId);

    if (categoryId === "all") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product => product.categoryId === categoryId);
      setFilteredProducts(filtered);
    }
    setVisibleProducts(8);
  };


  // Handle product click
  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Handle category click
  const handleCategoryClick = (categoryId) => {
    filterByCategory(categoryId);
    navigate(`/category/${categoryId}`);
  };

  // Handle slide navigation
  const handleNextSlide = () => {
    const totalSlides = Math.ceil(categories.length / 4);
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const handlePrevSlide = () => {
    const totalSlides = Math.ceil(categories.length / 4);
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Load more products
  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 8);
  };

  // Calculate visible categories based on current slide
  const getVisibleCategories = () => {
    const start = currentSlide * 4;
    return categories.slice(start, start + 4);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* HERO SECTION */}
      <div className="hero-section">
        <h1>Welcome to Our E-Commerce Store</h1>
        <p>Discover amazing products at unbeatable prices. Shop with confidence and style!</p>
        <button className="shop-btn" onClick={() => navigate('/products')}>
          Shop Now
        </button>
      </div>

      {/* CATEGORIES SECTION */}
      <div className="categories-section">
        <div className="section-title">
          <h2>Shop by Category</h2>
        </div>

        <div className="categories-container">
          <div className="categories-slider">
            {getVisibleCategories().map((category, index) => (
              <div
                key={category._id || index}
                className="category-card"
                onClick={() => handleCategoryClick(category.categoryId || category._id)}
              >
                <div className="category-image">
                  <div className="category-icon">{category.icon}</div>
                </div>
                <div className="category-info">
                  <h3>{category.name}</h3>
                  <div className="product-count">
                    {products.filter(p => p.categoryId === (category.categoryId || category._id)).length} products
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Arrows */}
          {categories.length > 4 && (
            <div className="nav-arrows">
              <button
                className={`arrow ${currentSlide === 0 ? 'disabled' : ''}`}
                onClick={handlePrevSlide}
                disabled={currentSlide === 0}
              >
                ‹
              </button>
              <button
                className={`arrow ${currentSlide >= Math.ceil(categories.length / 4) - 1 ? 'disabled' : ''}`}
                onClick={handleNextSlide}
                disabled={currentSlide >= Math.ceil(categories.length / 4) - 1}
              >
                ›
              </button>
            </div>
          )}

          {/* Slider Dots */}
          {categories.length > 4 && (
            <div className="slider-nav">
              {Array.from({ length: Math.ceil(categories.length / 4) }).map((_, index) => (
                <div
                  key={index}
                  className={`slider-dot ${currentSlide === index ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* PRODUCTS SECTION */}
      <div className="products-section">
        <div className="section-title">
          <h2>Featured Products</h2>
        </div>

        {/* Category Filter */}
        <div className="category-filter" style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '10px',
          marginBottom: '30px',
          flexWrap: 'wrap'
        }}>
          <button
            className={`filter-btn ${activeCategory === 'all' ? 'active' : ''}`}
            onClick={() => filterByCategory('all')}
            style={{
              padding: '8px 20px',
              borderRadius: '20px',
              border: 'none',
              background: activeCategory === 'all' ? '#667eea' : '#f7fafc',
              color: activeCategory === 'all' ? 'white' : '#2d3748',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            All Products
          </button>

          {categories.slice(0, 6).map(category => (
            <button
              key={category._id}
              className={`filter-btn ${activeCategory === (category.categoryId || category._id) ? 'active' : ''}`}
              onClick={() => filterByCategory(category.categoryId || category._id)}
              style={{
                padding: '8px 20px',
                borderRadius: '20px',
                border: 'none',
                background: activeCategory === (category.categoryId || category._id) ? '#667eea' : '#f7fafc',
                color: activeCategory === (category.categoryId || category._id) ? 'white' : '#2d3748',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="products-grid">
          {filteredProducts.slice(0, visibleProducts).map((product) => (
            <div
              key={product.productId}
              className="product-card"
              onClick={() => handleProductClick(product.productId)}
            >
              {/* Wishlist Button - UPDATED */}
              <button
                className={`wishlist-btn ${wishlist[product.productId]?.isWishlisted ? 'in-wishlist' : ''}`}
                onClick={(e) => toggleWishlist(product, e)}
                title={wishlist[product.productId]?.isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
              >
                {wishlist[product.productId]?.isWishlisted ? '♥' : '♡'}
              </button>

              {/* Product Image */}
              <div className="product-image">
                {product.thumbnail ? (
                  <img
                    src={product.thumbnail}
                    alt={product.productName}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
                    }}
                  />
                ) : (
                  <div className="no-image">No Image Available</div>
                )}
              </div>

              {product.hasOffer && (
                <div className={`offer-badge ${product.offerCount > 1 ? 'multiple-offers' : ''}`}>
                  {product.offerCount > 1 ? (
                    <>
                      <span className="offer-icon">🔥</span>
                      {product.bestOffer.offerLabel}
                      <span className="offer-count">+{product.offerCount - 1}</span>
                    </>
                  ) : (
                    <>
                      <span className="offer-icon">🎯</span>
                      {product.bestOffer.offerLabel}
                    </>
                  )}
                </div>
              )}

              {/* Product Info */}
              <div className="product-info">
                <div className="product-category">
                  {product.categoryName || "Uncategorized"}
                </div>

                <h3 className="product-name" title={product.productName}>
                  {product.productName}
                </h3>

                {product.specs && product.specs.length > 0 && (
                  <div className="product-specs">
                    {product.specs.join(" • ")}
                  </div>
                )}

                <div className="price-section">
                  <span className="current-price">
                    ₹{product.currentPrice?.toLocaleString() || "0"}
                  </span>

                  {product.hasDiscount && (
                    <>
                      <span className="original-price">
                        ₹{product.originalPrice?.toLocaleString()}
                      </span>
                      <span className="discount">
                        {product.discountPercent}% OFF
                      </span>
                    </>
                  )}
                </div>

                {product.colors && product.colors.length > 0 && (
                  <div className="variants-info">
                    <div className="color-dots">
                      {product.colors.slice(0, 4).map((color, index) => (
                        <div
                          key={index}
                          className="color-dot"
                          style={{
                            backgroundColor: getColorHex(color),
                            borderColor: getColorHex(color)
                          }}
                          title={color}
                        />
                      ))}
                      {product.colorCount > 4 && (
                        <div className="color-dot" style={{
                          backgroundColor: '#718096',
                          color: 'white',
                          fontSize: '10px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }} title={`+${product.colorCount - 4} more`}>
                          +{product.colorCount - 4}
                        </div>
                      )}
                    </div>
                    <span className="variant-count">
                      {product.colorCount} {product.colorCount === 1 ? 'color' : 'colors'}
                    </span>
                  </div>
                )}

                <button className="view-details-btn">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        {visibleProducts < filteredProducts.length && (
          <div className="load-more">
            <button onClick={loadMoreProducts}>
              Load More Products
            </button>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="home-footer">
        <p>© 2024 My E-Commerce Store. All rights reserved.</p>
      </div>
    </div>
  );
}

// Helper function to get color hex from color name
function getColorHex(colorName) {
  const colorMap = {
    'red': '#ff4757',
    'blue': '#3742fa',
    'green': '#2ed573',
    'yellow': '#ffa502',
    'black': '#2f3542',
    'white': '#ffffff',
    'gray': '#a4b0be',
    'pink': '#ff6b81',
    'purple': '#6c5ce7',
    'orange': '#ff7f00',
    'brown': '#795548',
    'navy': '#273c75',
    'maroon': '#c23616',
    'teal': '#0097a7',
    'cyan': '#00d2d3',
    'gold': '#ff9f1a',
    'silver': '#bdc3c7'
  };

  const lowerColor = colorName.toLowerCase();
  return colorMap[lowerColor] || '#718096';
}

export default Home;