import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ProductCard from "../../Components/ProductCard/ProductCard";
import "./AllProducts.scss";

function AllProducts() {
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [wishlist, setWishlist] = useState({});
  const [loading, setLoading] = useState(true);
  const [visibleProducts, setVisibleProducts] = useState(12);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("featured");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchAllProducts();
    fetchCategories();
    if (localStorage.getItem("token")) {
      fetchUserWishlist();
    }
  }, []);

  useEffect(() => {
    // Apply filters whenever they change
    filterAndSortProducts();
  }, [searchTerm, sortBy, selectedCategory, products, visibleProducts]);

  // Fetch all products
  const fetchAllProducts = async () => {
    try {
      setLoading(true);

      // Fetch all products and offers
      const [productsRes, offersRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/products/all`),
        axios.get(`${import.meta.env.VITE_API_URL}/productoffers/active-color-offers`)
      ]);

      // Process products
      const allProducts = processProducts(productsRes.data, offersRes.data);
      
      setProducts(allProducts);
      setFilteredProducts(allProducts.slice(0, visibleProducts));

    } catch (error) {
      console.error("Error fetching all products:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/categories/get`);
      setCategories(res.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
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
        if (product.colors.length > 0) {
          const firstColor = product.colors[0];
          thumbnail = firstColor.images?.[0] || product.thumbnailImage;
          currentPrice = firstColor.currentPrice || product.currentPrice;
          originalPrice = firstColor.originalPrice || product.originalPrice;
          colors = product.colors.map(color => color.colorName);
        }

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

  // Filter and sort products
  const filterAndSortProducts = () => {
    let result = [...products];
    
    // Apply category filter
    if (selectedCategory !== "all") {
      result = result.filter(product => 
        product.categoryId === selectedCategory || 
        product.categoryName?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }
    
    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(product =>
        product.productName.toLowerCase().includes(term) ||
        product.categoryName?.toLowerCase().includes(term) ||
        product.description?.toLowerCase().includes(term) ||
        product.specs?.some(spec => spec.toLowerCase().includes(term))
      );
    }
    
    // Apply sorting
    switch (sortBy) {
      case "price-low":
        result.sort((a, b) => (a.currentPrice || 0) - (b.currentPrice || 0));
        break;
      case "price-high":
        result.sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
        break;
      case "name-asc":
        result.sort((a, b) => a.productName.localeCompare(b.productName));
        break;
      case "name-desc":
        result.sort((a, b) => b.productName.localeCompare(a.productName));
        break;
      case "discount":
        result.sort((a, b) => (b.discountPercent || 0) - (a.discountPercent || 0));
        break;
      default:
        // Keep original order (featured)
        break;
    }
    
    setFilteredProducts(result.slice(0, visibleProducts));
  };

  // Fetch user's wishlist
  const fetchUserWishlist = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (!token || !userId) return;

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/wishlist/my-wishlist?userId=${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

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
    } catch (error) {
      console.error("Error fetching wishlist:", error);
    }
  };

  // Handle wishlist toggle
  const toggleWishlist = async (product, e) => {
    e.stopPropagation();
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

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
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setWishlist(prev => {
          const newWishlist = { ...prev };
          delete newWishlist[product.productId];
          return newWishlist;
        });

      } else {
        // Add to wishlist
        const wishlistData = {
          userId,
          productId: product.productId,
          addedFrom: "all-products"
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

        setWishlist(prev => ({
          ...prev,
          [product.productId]: {
            isWishlisted: true,
            selectedModel: null,
            selectedColor: null
          }
        }));
      }

      window.dispatchEvent(new Event('wishlistUpdated'));

    } catch (error) {
      console.error("Error toggling wishlist:", error);
      alert("Error updating wishlist. Please try again.");
    }
  };

  // Load more products
  const loadMoreProducts = () => {
    setVisibleProducts(prev => prev + 12);
  };

  // Helper function to get color hex from color name
  const getColorHex = (colorName) => {
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

    if (!colorName) return '#718096';
    const lowerColor = colorName.toLowerCase();
    return colorMap[lowerColor] || '#718096';
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm("");
    setSortBy("featured");
    setSelectedCategory("all");
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="all-products-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>All Products</h1>
          <p>Browse our complete collection of {products.length} products</p>
        </div>
        <button className="back-btn" onClick={() => navigate("/")}>
          ← Back to Home
        </button>
      </div>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search products by name, category, or specs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>

          <div className="filter-controls">
            <div className="filter-item">
              <label>Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option 
                    key={category._id || category.categoryId} 
                    value={category.categoryId || category._id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-item">
              <label>Sort by:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="featured">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="name-desc">Name: Z to A</option>
                <option value="discount">Best Discount</option>
              </select>
            </div>

            {(searchTerm || selectedCategory !== "all" || sortBy !== "featured") && (
              <button className="reset-btn" onClick={resetFilters}>
                Reset Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Count */}
      <div className="products-count">
        <span className="count-number">{filteredProducts.length}</span> of{" "}
        <span className="total-number">{products.length}</span> products
        {searchTerm && <span> matching "<strong>{searchTerm}</strong>"</span>}
        {selectedCategory !== "all" && (
          <span> in <strong>{categories.find(c => (c.categoryId || c._id) === selectedCategory)?.name}</strong></span>
        )}
      </div>

      {/* Products Grid */}
      <div className="products-section">
        <div className="products-grid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.productId}
                product={product}
                wishlist={wishlist}
                toggleWishlist={toggleWishlist}
                getColorHex={getColorHex}
              />
            ))
          ) : (
            <div className="no-products">
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button onClick={resetFilters}>
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {visibleProducts < products.length && filteredProducts.length >= visibleProducts && (
          <div className="load-more">
            <button onClick={loadMoreProducts}>
              Load More Products ({products.length - visibleProducts} more)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AllProducts;