import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProductPage.scss";

function ProductPage() {
  const { productId } = useParams();
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // OFFER DATA
  const [offers, setOffers] = useState([]);
  const [currentOffer, setCurrentOffer] = useState(null);

  // For simple products
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // For variable products
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedModelColor, setSelectedModelColor] = useState(null);
  const [selectedModelSize, setSelectedModelSize] = useState(null);

  // Quantity selector
  const [quantity, setQuantity] = useState(1);

  const [mainImage, setMainImage] = useState("");
  const [images, setImages] = useState([]);
  const [wishlist, setWishlist] = useState(false);
  const [wishlistItem, setWishlistItem] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);

  const [inventoryStatus, setInventoryStatus] = useState({
    stock: 0,
    threshold: 0,
    status: 'checking'
  });

  // NEW: Max quantity based on stock
  const [maxQuantity, setMaxQuantity] = useState(99);

  // Fetch product data AND offers
  useEffect(() => {
    fetchProduct();
  }, [productId]);


  useEffect(() => {
    if (product) {
      fetchInventoryStatus();
    }
  }, [product, selectedColor, selectedModel, selectedModelColor]);

  // Update max quantity when inventory status changes
  useEffect(() => {
    if (inventoryStatus.status === 'in-stock' || inventoryStatus.status === 'low-stock') {
      // Set max quantity to available stock
      setMaxQuantity(inventoryStatus.stock);

      // Adjust current quantity if it exceeds stock
      if (quantity > inventoryStatus.stock) {
        setQuantity(inventoryStatus.stock);
      }
    } else if (inventoryStatus.status === 'out-of-stock') {
      setMaxQuantity(0);
      setQuantity(0);
    }
  }, [inventoryStatus]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch product details
      const productRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/${productId}`
      );

      const productData = productRes.data;
      setProduct(productData);

      // Fetch offers for this product
      const offersRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/product-color-offers/${productId}`
      );

      const offersData = offersRes.data;
      setOffers(offersData);

      // Initialize selections based on product type
      if (productData.type === "simple") {
        // Simple product - initialize with first color
        if (productData.colors && productData.colors.length > 0) {
          const firstColor = productData.colors[0];
          setSelectedColor(firstColor);

          // Check if first color has offer - PASS THE OFFERS DATA
          checkAndSetOfferWithData(productData, firstColor, null, offersData);

          // Set images from selected color
          if (firstColor.images && firstColor.images.length > 0) {
            setMainImage(firstColor.images[0]);
            setImages(firstColor.images);
          } else if (productData.thumbnailImage) {
            setMainImage(productData.thumbnailImage);
            setImages([productData.thumbnailImage]);
          }

          // Initialize with first size if available
          if (firstColor.sizes && firstColor.sizes.length > 0) {
            setSelectedSize(firstColor.sizes[0]);
          }
        } else {
          // No colors - use product thumbnail
          if (productData.thumbnailImage) {
            setMainImage(productData.thumbnailImage);
            setImages([productData.thumbnailImage]);
          }
        }
      } else if (productData.type === "variable") {
        // Variable product - initialize with first model and its first color
        if (productData.models && productData.models.length > 0) {
          const firstModel = productData.models[0];
          setSelectedModel(firstModel);

          if (firstModel.colors && firstModel.colors.length > 0) {
            const firstModelColor = firstModel.colors[0];
            setSelectedModelColor(firstModelColor);

            // Check if first model color has offer - PASS THE OFFERS DATA
            checkAndSetOfferWithData(productData, firstModelColor, firstModel, offersData);

            // Set images from selected model color
            if (firstModelColor.images && firstModelColor.images.length > 0) {
              setMainImage(firstModelColor.images[0]);
              setImages(firstModelColor.images);
            } else if (productData.thumbnailImage) {
              setMainImage(productData.thumbnailImage);
              setImages([productData.thumbnailImage]);
            }

            // Initialize with first size if available
            if (firstModelColor.sizes && firstModelColor.sizes.length > 0) {
              setSelectedModelSize(firstModelColor.sizes[0]);
            }
          }
        }
      }

      // Fetch related products from same category
      const relatedRes = await axios.get(
        `${import.meta.env.VITE_API_URL}/products/all`
      );

      const sameCategoryProducts = relatedRes.data
        .filter(p => p.categoryId === productData.categoryId && p.productId !== productData.productId)
        .slice(0, 4);

      setRelatedProducts(sameCategoryProducts);

    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Product not found or error loading product details.");
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryStatus = async () => {
    if (!product) return;

    try {
      setInventoryStatus(prev => ({ ...prev, status: 'checking' }));

      const params = new URLSearchParams();

      const currentColor = product.type === "simple" ? selectedColor : selectedModelColor;
      if (currentColor?.colorId) {
        params.append('colorId', currentColor.colorId);
      }

      if (product.type === "variable" && selectedModel?._id) {
        params.append('modelId', selectedModel._id);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/product/${product.productId}/status?${params.toString()}`
      );

      // Set ALL data from backend including actual threshold
      setInventoryStatus({
        stock: response.data.stock,
        threshold: response.data.threshold, // From DB
        status: response.data.status // From DB logic
      });

    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryStatus({
        stock: 0,
        threshold: 10, // Fallback
        status: 'error'
      });
    }
  };

  // Function to check and set offer with data
  const checkAndSetOfferWithData = (productData, color, model, offersArray) => {
    if (!color || !color.colorId) {
      setCurrentOffer(null);
      return;
    }

    const variableModelId = model ? (model._id || model.modelId) : "";

    const offer = offersArray.find(offer =>
      offer.productId === productData.productId &&
      offer.colorId === color.colorId &&
      (variableModelId ? offer.variableModelId === variableModelId : !offer.variableModelId) &&
      offer.isCurrentlyValid
    );

    setCurrentOffer(offer || null);
  };

  // Function to check and set offer
  const checkAndSetOffer = (productData, color, model) => {
    checkAndSetOfferWithData(productData, color, model, offers);
  };

  // Fetch wishlist status when product loads or changes
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (product && token) {
        try {
          const userId = localStorage.getItem("userId");
          if (!userId) return;

          // Build query parameters for specific variant
          const params = new URLSearchParams();
          params.append('userId', userId);

          // Add variant details if available
          const currentColor = product.type === "simple" ? selectedColor : selectedModelColor;
          if (currentColor && currentColor.colorId) {
            params.append('colorId', currentColor.colorId);
          }

          if (product.type === "variable" && selectedModel && selectedModel._id) {
            params.append('modelId', selectedModel._id);
          }

          const currentSize = product.type === "simple" ? selectedSize : selectedModelSize;
          if (currentSize) {
            params.append('size', currentSize);
          }

          // Check if SPECIFIC VARIANT is in wishlist
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/wishlist/check/${product.productId}?${params.toString()}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          setWishlist(response.data.isInWishlist);
          setWishlistItem(response.data.wishlistItem);

        } catch (error) {
          console.error("Error checking wishlist status:", error);
        }
      }
    };

    if (product) {
      checkWishlistStatus();
    }
  }, [product, token, selectedColor, selectedModel, selectedModelColor, selectedSize, selectedModelSize]);

  // Handle pre-selection from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (product) {
      // Check for model selection
      const modelId = urlParams.get('model');
      if (modelId && product.type === "variable" && product.models) {
        const model = product.models.find(m =>
          m._id === modelId || m.modelId === modelId
        );
        if (model) {
          setSelectedModel(model);

          // Check for color within this model
          const colorId = urlParams.get('color');
          if (colorId && model.colors) {
            const color = model.colors.find(c => c.colorId === colorId);
            if (color) {
              setSelectedModelColor(color);
              // Check offer for this selection
              checkAndSetOffer(product, color, model);
              // Set images
              if (color.images && color.images.length > 0) {
                setMainImage(color.images[0]);
                setImages(color.images);
              }
            }
          }
        }
      }

      // Check for color selection (for simple products or if model not specified)
      const colorId = urlParams.get('color');
      if (colorId && !urlParams.get('model')) {
        if (product.type === "simple" && product.colors) {
          const color = product.colors.find(c => c.colorId === colorId);
          if (color) {
            setSelectedColor(color);
            // Check offer for this selection
            checkAndSetOffer(product, color, null);
            // Set images
            if (color.images && color.images.length > 0) {
              setMainImage(color.images[0]);
              setImages(color.images);
            }
          }
        }
      }

      // Check for size selection
      const size = urlParams.get('size');
      if (size) {
        if (product.type === "simple" && selectedColor) {
          setSelectedSize(size);
        } else if (product.type === "variable" && selectedModelColor) {
          setSelectedModelSize(size);
        }
      }
    }
  }, [product, window.location.search]);

  // Handle color selection for simple products
  const handleColorSelect = (color) => {
    setSelectedColor(color);

    // Check offer for selected color
    checkAndSetOffer(product, color, null);

    // Update images for selected color
    if (color.images && color.images.length > 0) {
      setMainImage(color.images[0]);
      setImages(color.images);
    }

    // Reset size selection
    if (color.sizes && color.sizes.length > 0) {
      setSelectedSize(color.sizes[0]);
    } else {
      setSelectedSize(null);
    }
  };

  // Handle model selection for variable products
  const handleModelSelect = (model) => {
    setSelectedModel(model);

    // Reset color and size selections
    setSelectedModelColor(null);
    setSelectedModelSize(null);

    // Set images from model's first color
    if (model.colors && model.colors.length > 0) {
      const firstColor = model.colors[0];
      setSelectedModelColor(firstColor);

      // Check offer for this model's first color
      checkAndSetOffer(product, firstColor, model);

      if (firstColor.images && firstColor.images.length > 0) {
        setMainImage(firstColor.images[0]);
        setImages(firstColor.images);
      }

      if (firstColor.sizes && firstColor.sizes.length > 0) {
        setSelectedModelSize(firstColor.sizes[0]);
      }
    }
  };

  // Handle model color selection for variable products
  const handleModelColorSelect = (color) => {
    setSelectedModelColor(color);

    // Check offer for selected color
    checkAndSetOffer(product, color, selectedModel);

    // Update images for selected color
    if (color.images && color.images.length > 0) {
      setMainImage(color.images[0]);
      setImages(color.images);
    }

    // Reset size selection
    if (color.sizes && color.sizes.length > 0) {
      setSelectedModelSize(color.sizes[0]);
    } else {
      setSelectedModelSize(null);
    }
  };

  // NEW: Updated handle quantity change with stock validation
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;

    // Check if product is out of stock
    if (inventoryStatus.status === 'out-of-stock') {
      alert("Product is out of stock!");
      return;
    }

    // Check if new quantity exceeds available stock
    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      if (newQuantity > inventoryStatus.stock) {
        alert(`Only ${inventoryStatus.stock} items available in stock!`);
        return;
      }
    }

    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // NEW: Check if product can be purchased (for button disabling)
  const canPurchaseProduct = () => {
    // Check stock status
    if (inventoryStatus.status === 'checking' || inventoryStatus.status === 'error') {
      return true; // Allow while checking (existing behavior)
    }

    if (inventoryStatus.status === 'out-of-stock') {
      return false; // Disable if out of stock
    }

    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      // Check if quantity exceeds available stock
      return quantity <= inventoryStatus.stock && quantity > 0;
    }

    return true; // Default fallback
  };

  // Get base price (without offer)
  const getBasePrice = () => {
    if (product.type === "simple" && selectedColor) {
      return selectedColor.currentPrice || product.currentPrice || 0;
    } else if (product.type === "variable" && selectedModelColor) {
      return selectedModelColor.currentPrice || selectedModel?.colors?.[0]?.currentPrice || product.currentPrice || 0;
    }
    return product.currentPrice || 0;
  };

  // Get original price (first strikethrough price)
  const getOriginalPrice = () => {
    if (product.type === "simple" && selectedColor) {
      return selectedColor.originalPrice || product.originalPrice || 0;
    } else if (product.type === "variable" && selectedModelColor) {
      return selectedModelColor.originalPrice || selectedModel?.colors?.[0]?.originalPrice || product.originalPrice || 0;
    }
    return product.originalPrice || 0;
  };

  // Get regular discount percentage (before any offer)
  const getRegularDiscountPercent = () => {
    const originalPrice = getOriginalPrice();
    const basePrice = getBasePrice();

    if (originalPrice > 0 && originalPrice > basePrice) {
      return Math.round(((originalPrice - basePrice) / originalPrice) * 100);
    }
    return 0;
  };

  // Get offer price (with discount)
  const getOfferPrice = () => {
    const basePrice = getBasePrice();
    if (currentOffer && currentOffer.offerPercentage > 0) {
      const discountAmount = (basePrice * currentOffer.offerPercentage) / 100;
      return Math.max(0, basePrice - discountAmount);
    }
    return basePrice;
  };

  // Get total price (offer price * quantity)
  const getTotalPrice = () => {
    return getOfferPrice() * quantity;
  };

  // Get product description
  const getDescription = () => {
    if (product.type === "simple") {
      return product.description || "No description available.";
    } else if (product.type === "variable" && selectedModel) {
      return selectedModel.description || product.description || "No description available.";
    }
    return product.description || "No description available.";
  };

  // Get specifications (ALWAYS use color specifications)
  const getSpecifications = () => {
    const specs = [];

    if (product.type === "simple" && selectedColor && selectedColor.colorSpecifications) {
      // Use color specifications for simple products
      selectedColor.colorSpecifications.forEach(spec => {
        specs.push({ key: spec.key, value: spec.value });
      });
    } else if (product.type === "variable" && selectedModelColor && selectedModelColor.colorSpecifications) {
      // Use color specifications for variable products
      selectedModelColor.colorSpecifications.forEach(spec => {
        specs.push({ key: spec.key, value: spec.value });
      });
    } else if (product.specifications) {
      // Fallback to product specifications
      product.specifications.forEach(spec => {
        specs.push({ key: spec.key, value: spec.value });
      });
    }

    return specs;
  };

  // Get available sizes
  const getAvailableSizes = () => {
    if (product.type === "simple" && selectedColor) {
      return selectedColor.sizes || [];
    } else if (product.type === "variable" && selectedModelColor) {
      return selectedModelColor.sizes || [];
    }
    return [];
  };

  // NEW: Updated isOutOfStock function
  const isOutOfStock = () => {
    return inventoryStatus.status === 'out-of-stock';
  };

  // Check if current selections match wishlist item
  const isCurrentSelectionInWishlist = () => {
    if (!wishlistItem) return false;

    // Check if color matches
    if (product.type === "simple" && selectedColor) {
      if (wishlistItem.selectedColor && wishlistItem.selectedColor.colorId !== selectedColor.colorId) {
        return false;
      }
    } else if (product.type === "variable" && selectedModelColor) {
      if (wishlistItem.selectedColor && wishlistItem.selectedColor.colorId !== selectedModelColor.colorId) {
        return false;
      }
    }

    // Check if model matches for variable products
    if (product.type === "variable" && selectedModel && wishlistItem.selectedModel) {
      const wishlistModelId = wishlistItem.selectedModel.modelId;
      const currentModelId = selectedModel._id || selectedModel.modelId;

      if (wishlistModelId !== currentModelId) {
        return false;
      }
    }

    // Check if size matches
    const currentSize = product.type === "simple" ? selectedSize : selectedModelSize;
    if (currentSize && wishlistItem.selectedSize && wishlistItem.selectedSize !== currentSize) {
      return false;
    }

    return true;
  };

  // =========== UPDATED WISHLIST TOGGLE FUNCTION ===========
  const toggleWishlist = async () => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      alert("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    const isCurrentlyWishlisted = wishlist;

    try {
      if (isCurrentlyWishlisted) {
        // Remove from wishlist - USING QUERY PARAMS
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/wishlist/remove/${product.productId}?userId=${userId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        setWishlist(false);
        setWishlistItem(null);

      } else {
        // Add to wishlist (from product page - with model/color selections)
        const wishlistData = {
          userId,
          productId: product.productId,
          addedFrom: "product"
        };

        // Add selected model for variable products
        if (product.type === "variable" && selectedModel) {
          wishlistData.selectedModel = {
            modelId: selectedModel._id || selectedModel.modelId,
            modelName: selectedModel.modelName,
            SKU: selectedModel.SKU
          };
        }

        // Add selected color if available
        const selectedColorData = product.type === "simple" ? selectedColor : selectedModelColor;
        if (selectedColorData) {
          wishlistData.selectedColor = {
            colorId: selectedColorData.colorId,
            colorName: selectedColorData.colorName,
            currentPrice: getBasePrice(), // Base price
            originalPrice: selectedColorData.originalPrice || product.originalPrice || 0
          };
        }

        // Add selected size if available
        const selectedSizeData = product.type === "simple" ? selectedSize : selectedModelSize;
        if (selectedSizeData) {
          wishlistData.selectedSize = selectedSizeData;
        }

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

        setWishlist(true);
        setWishlistItem(response.data.wishlist);
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

  // NEW: Updated handle add to cart WITH STOCK VALIDATION
  const handleAddToCart = async () => {
    // Check stock before proceeding
    if (!canPurchaseProduct()) {
      if (inventoryStatus.status === 'out-of-stock') {
        alert("This product is currently out of stock!");
      } else if (quantity > inventoryStatus.stock) {
        alert(`Only ${inventoryStatus.stock} items available in stock!`);
      }
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      alert("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const basePrice = getBasePrice();
    const offerPrice = getOfferPrice();
    const hasOffer = currentOffer && currentOffer.offerPercentage > 0;

    // Prepare cart data
    const cartData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: basePrice,
      finalPrice: offerPrice,
      totalPrice: getTotalPrice(),
      selectedColor: product.type === "simple" ? selectedColor : selectedModelColor,
      selectedSize: product.type === "simple" ? selectedSize : selectedModelSize,
      hasOffer: hasOffer,
      offerDetails: hasOffer ? {
        offerId: currentOffer._id,
        offerPercentage: currentOffer.offerPercentage,
        offerLabel: currentOffer.offerLabel,
        originalPrice: basePrice,
        offerPrice: offerPrice,
        savedAmount: (basePrice - offerPrice) * quantity
      } : null
    };

    if (product.type === "variable" && selectedModel) {
      cartData.selectedModel = {
        modelId: selectedModel._id || selectedModel.modelId,
        modelName: selectedModel.modelName,
        SKU: selectedModel.SKU
      };
    }

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/cart/add`,
        cartData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      alert(`Added ${quantity} item${quantity > 1 ? 's' : ''} to cart!`);

      // Dispatch event for navbar and cart update
      window.dispatchEvent(new Event('cartUpdated'));

      // You can open cart sidebar here if you want
      // setIsCartOpen(true);

    } catch (error) {
      console.error("Error adding to cart:", error);
      if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Error adding to cart. Please try again.");
      }
    }
  };

  // NEW: Updated handle buy now WITH STOCK VALIDATION
  const handleBuyNow = () => {
    // Check stock before proceeding
    if (!canPurchaseProduct()) {
      if (inventoryStatus.status === 'out-of-stock') {
        alert("This product is currently out of stock!");
      } else if (quantity > inventoryStatus.stock) {
        alert(`Only ${inventoryStatus.stock} items available in stock!`);
      }
      return;
    }

    // First add to cart, then navigate to checkout
    handleAddToCart();
    navigate("/checkout");
  };

  if (loading) {
    return (
      <div className="product-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="product-page">
        <div className="error-container">
          <h2>{error || "Product not found"}</h2>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  const basePrice = getBasePrice();
  const offerPrice = getOfferPrice();
  const totalPrice = getTotalPrice();
  const originalPrice = getOriginalPrice();
  const regularDiscountPercent = getRegularDiscountPercent();
  const description = getDescription();
  const specifications = getSpecifications();
  const availableSizes = getAvailableSizes();
  const isExactWishlistMatch = isCurrentSelectionInWishlist();
  const hasOffer = currentOffer && currentOffer.offerPercentage > 0;
  const savedAmount = hasOffer ? (basePrice - offerPrice) * quantity : 0;
  const totalSavingsFromOriginal = originalPrice > 0 ? (originalPrice - offerPrice) * quantity : 0;
  const totalDiscountPercent = originalPrice > 0 ? Math.round(((originalPrice - offerPrice) / originalPrice) * 100) : 0;

  // NEW: Get purchase eligibility
  const canPurchase = canPurchaseProduct();

  return (
    <div className="product-page">
      {/* Back Button */}
      <button className="back-button" onClick={() => navigate(-1)}>
        ← Back to Products
      </button>

      <div className="product-container">
        {/* Left Column - Images */}
        <div className="product-images-section">
          <div className="main-image">
            {mainImage ? (
              <img
                src={mainImage}
                alt={product.productName}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://via.placeholder.com/500x400?text=No+Image";
                }}
              />
            ) : (
              <div className="no-image">No Image Available</div>
            )}

            {/* OFFER BADGE ON MAIN IMAGE */}
            {hasOffer && (
              <div className="offer-badge-main">
                <span className="offer-badge-icon">🎯</span>
                <div className="offer-badge-content">
                  <div className="offer-badge-title">{currentOffer.offerLabel}</div>
                  <div className="offer-badge-percent">{currentOffer.offerPercentage}% OFF</div>
                </div>
              </div>
            )}
          </div>

          {images.length > 1 && (
            <div className="thumbnail-images">
              {images.map((img, index) => (
                <div
                  key={index}
                  className={`thumbnail ${img === mainImage ? 'active' : ''}`}
                  onClick={() => setMainImage(img)}
                >
                  <img
                    src={img}
                    alt={`${product.productName} - View ${index + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/80x80?text=No+Image";
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Details */}
        <div className="product-details-section">
          {/* Product Header */}
          <div className="product-header">
            <div className="category-badge">
              {product.categoryName || "Uncategorized"}
            </div>
            <h1>{product.productName}</h1>
            <div className="product-sku">
              SKU: {product.SKU || "Not specified"}
              {hasOffer && (
                <span className="offer-tag-mini">
                  <span className="offer-icon-mini">🎁</span>
                  Color Offer Available
                </span>
              )}
            </div>
          </div>

          {/* Price Section WITH PROPER BREAKDOWN */}
          <div className="price-section">
            <div className="price-display">
              {/* PRICE BREAKDOWN: Original -> Discounted -> With Offer */}
              <div className="price-breakdown">
                {/* ORIGINAL PRICE (with strikethrough) */}
                <div className="price-row original-price-row">
                  <span className="price-label">Original Price:</span>
                  <span className="price-value struck">₹{originalPrice.toLocaleString()}</span>
                </div>

                {/* DISCOUNTED PRICE (regular discount) */}
                {regularDiscountPercent > 0 && (
                  <div className="price-row discounted-price-row">
                    <span className="price-label">Discounted Price:</span>
                    <span className="price-value struck">₹{basePrice.toLocaleString()}</span>
                    <span className="regular-discount-badge">{regularDiscountPercent}% OFF</span>
                  </div>
                )}

                {/* FINAL PRICE WITH OFFER (or just discounted price if no offer) */}
                {hasOffer ? (
                  <>
                    <div className="price-row final-price-row">
                      <span className="price-label">Offer Price:</span>
                      <span className="price-value final-price">₹{offerPrice.toLocaleString()}</span>
                      <span className="offer-percent-badge">{currentOffer.offerPercentage}% OFF</span>
                    </div>

                    {/* Total savings */}
                    <div className="price-row total-savings-row">
                      <span className="price-label">You Save:</span>
                      <span className="price-value save-amount">
                        ₹{totalSavingsFromOriginal.toLocaleString()}
                      </span>
                      <span className="save-percent">
                        ({totalDiscountPercent}% off)
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="price-row final-price-row">
                    <span className="price-label">Final Price:</span>
                    <span className="price-value final-price">₹{basePrice.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Offer label if exists */}
              {hasOffer && (
                <div className="offer-label-display">
                  <span className="offer-icon-small">🎁</span>
                  <span className="offer-label">{currentOffer.offerLabel}</span>
                  <span className="offer-validity">
                    ({currentOffer.endDate ? `Valid till ${new Date(currentOffer.endDate).toLocaleDateString()}` : 'Limited Time Offer'})
                  </span>
                </div>
              )}
            </div>

            {/* You Save Section */}
            {hasOffer && (
              <div className="you-save-section">
                <span className="save-label">You save on this item:</span>
                <span className="save-amount">₹{(basePrice - offerPrice).toLocaleString()} per item</span>
                <span className="save-percent">({currentOffer.offerPercentage}% off)</span>
              </div>
            )}

            {/* NEW: Enhanced stock status with quantity info */}
            <div className={`stock-status ${inventoryStatus.status}`}>
              {inventoryStatus.status === 'checking' ? (
                <>⏳ Checking stock...</>
              ) : inventoryStatus.status === 'error' ? (
                <>⚠️ Stock check failed</>
              ) : inventoryStatus.status === 'out-of-stock' ? (
                <>
                  ❌ Out of Stock
                  {/* {inventoryStatus.threshold > 0 && (
                    <span className="stock-info">(Restocking threshold: {inventoryStatus.threshold})</span>
                  )} */}
                </>
              ) : inventoryStatus.status === 'low-stock' ? (
                <>
                  ⚠️ Low Stock - 
                  {/* {inventoryStatus.threshold > 0 && (
                    <span className="stock-info">(Threshold: {inventoryStatus.threshold})</span>
                  )} */}
                </>
              ) : (
                <>
                  ✅ In Stock
                  <span className="stock-info">
                    ({inventoryStatus.stock} available)
                  </span>
                </>
              )}
            </div>

            {/* Wishlist Status Info */}
            {wishlist && wishlistItem && !isExactWishlistMatch && (
              <div className="wishlist-info">
                ⚠️ This product is in your wishlist with different selections.
              </div>
            )}
          </div>

          {/* NEW: Updated QUANTITY SELECTOR with stock limits */}
          <div className="quantity-section">
            <div className="section-title">Quantity</div>
            <div className="quantity-selector">
              <button
                className="quantity-btn minus"
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1 || inventoryStatus.status === 'out-of-stock'}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;

                  // Check if value exceeds available stock
                  if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
                    if (value > inventoryStatus.stock) {
                      alert(`Only ${inventoryStatus.stock} items available in stock!`);
                      return;
                    }
                  }

                  if (value >= 1 && value <= maxQuantity) {
                    setQuantity(value);
                  }
                }}
                className="quantity-input"
                disabled={inventoryStatus.status === 'out-of-stock'}
              />
              <button
                className="quantity-btn plus"
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity || inventoryStatus.status === 'out-of-stock'}
              >
                +
              </button>
              <div className="quantity-total">
                Total: <span className="total-price">₹{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* NEW: Stock limit warning */}
            {(inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') && (
              <div className="stock-limit-warning">
                ⚠️ Maximum {inventoryStatus.stock} items available
              </div>
            )}

            {savedAmount > 0 && (
              <div className="total-savings">
                🎉 You save ₹{savedAmount.toLocaleString()} on {quantity} item{quantity > 1 ? 's' : ''}!
              </div>
            )}
          </div>

          {/* Variant Selection Section */}
          <div className="variant-section">
            {/* For Variable Products - Model Selection */}
            {product.type === "variable" && product.models && product.models.length > 0 && (
              <div className="model-selection">
                <div className="section-title">
                  Select Model
                  {selectedModel && (
                    <span className="selected-variant">Selected: {selectedModel.modelName}</span>
                  )}
                </div>

                <div className="model-options">
                  {product.models.map((model, index) => (
                    <div
                      key={index}
                      className={`model-option ${selectedModel?.modelName === model.modelName ? 'selected' : ''}`}
                      onClick={() => handleModelSelect(model)}
                    >
                      <div className="model-name">{model.modelName}</div>
                      <div className="model-price">
                        ₹{(model.colors?.[0]?.currentPrice || product.currentPrice || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection WITH OFFER INDICATORS */}
            <div className="color-selection">
              <div className="section-title">
                Select Color
                {(selectedColor || selectedModelColor) && (
                  <span className="selected-variant">
                    Selected: {(selectedColor || selectedModelColor)?.colorName}
                  </span>
                )}
              </div>

              <div className="color-options">
                {product.type === "simple" && product.colors && product.colors.length > 0 ? (
                  // Simple product colors
                  product.colors.map((color, index) => {
                    const colorOffer = offers.find(offer =>
                      offer.colorId === color.colorId &&
                      !offer.variableModelId &&
                      offer.isCurrentlyValid
                    );

                    return (
                      <div
                        key={index}
                        className="color-option"
                        onClick={() => handleColorSelect(color)}
                      >
                        <div className={`color-circle ${selectedColor?.colorId === color.colorId ? 'selected' : ''} ${colorOffer ? 'has-offer' : ''}`}>
                          {color.images && color.images.length > 0 ? (
                            <img
                              src={color.images[0]}
                              alt={color.colorName}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.backgroundColor = getColorHex(color.colorName);
                              }}
                            />
                          ) : (
                            <div
                              className="color-swatch"
                              style={{ backgroundColor: getColorHex(color.colorName) }}
                            >
                              <div className="color-name-overlay">{color.colorName}</div>
                            </div>
                          )}
                          {colorOffer && (
                            <div className="color-offer-badge">
                              {colorOffer.offerPercentage}% OFF
                            </div>
                          )}
                        </div>

                        <div className="color-info">
                          <div className="color-name">{color.colorName}</div>
                          <div className="color-price">
                            {colorOffer ? (
                              <>
                                <div className="color-price-breakdown">
                                  <span className="color-original-price struck">₹{color.originalPrice?.toLocaleString() || color.currentPrice.toLocaleString()}</span>
                                  <span className="color-discounted-price struck">₹{color.currentPrice.toLocaleString()}</span>
                                  <span className="color-final-price">₹{Math.max(0, color.currentPrice * (1 - colorOffer.offerPercentage / 100)).toLocaleString()}</span>
                                </div>
                                <span className="color-offer-percent">{colorOffer.offerPercentage}% OFF</span>
                              </>
                            ) : (
                              <>
                                {color.originalPrice && color.originalPrice > color.currentPrice ? (
                                  <div className="color-price-breakdown">
                                    <span className="color-original-price struck">₹{color.originalPrice.toLocaleString()}</span>
                                    <span className="color-discounted-price">₹{color.currentPrice.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <span className="color-price-single">₹{color.currentPrice.toLocaleString()}</span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : product.type === "variable" && selectedModel && selectedModel.colors && selectedModel.colors.length > 0 ? (
                  // Variable product model colors
                  selectedModel.colors.map((color, index) => {
                    const colorOffer = offers.find(offer =>
                      offer.colorId === color.colorId &&
                      offer.variableModelId === (selectedModel._id || selectedModel.modelId) &&
                      offer.isCurrentlyValid
                    );

                    return (
                      <div
                        key={index}
                        className="color-option"
                        onClick={() => handleModelColorSelect(color)}
                      >
                        <div className={`color-circle ${selectedModelColor?.colorId === color.colorId ? 'selected' : ''} ${colorOffer ? 'has-offer' : ''}`}>
                          {color.images && color.images.length > 0 ? (
                            <img
                              src={color.images[0]}
                              alt={color.colorName}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.backgroundColor = getColorHex(color.colorName);
                              }}
                            />
                          ) : (
                            <div
                              className="color-swatch"
                              style={{ backgroundColor: getColorHex(color.colorName) }}
                            >
                              <div className="color-name-overlay">{color.colorName}</div>
                            </div>
                          )}
                          {colorOffer && (
                            <div className="color-offer-badge">
                              {colorOffer.offerPercentage}% OFF
                            </div>
                          )}
                        </div>

                        <div className="color-info">
                          <div className="color-name">{color.colorName}</div>
                          <div className="color-price">
                            {colorOffer ? (
                              <>
                                <span className="color-offer-price">₹{Math.max(0, color.currentPrice * (1 - colorOffer.offerPercentage / 100)).toLocaleString()}</span>
                                <span className="color-original-price">₹{color.currentPrice.toLocaleString()}</span>
                              </>
                            ) : (
                              <span>₹{color.currentPrice.toLocaleString()}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p>No colors available for this product.</p>
                )}
              </div>

              {/* Offer details for current selection */}
              {hasOffer && (
                <div className="current-offer-details">
                  <div className="offer-details-title">
                    <span className="offer-icon">🎯</span>
                    Current Offer
                  </div>
                  <div className="offer-details-content">
                    <p><strong>{currentOffer.colorName}</strong> has <strong>{currentOffer.offerPercentage}% OFF</strong></p>
                    <p className="offer-validity">
                      Valid: {new Date(currentOffer.startDate).toLocaleDateString()}
                      {currentOffer.endDate && ` to ${new Date(currentOffer.endDate).toLocaleDateString()}`}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="size-selection">
                <div className="section-title">
                  Select Size
                  {(selectedSize || selectedModelSize) && (
                    <span className="selected-variant">
                      Selected: {selectedSize || selectedModelSize}
                    </span>
                  )}
                </div>

                <div className="size-options">
                  {availableSizes.map((size, index) => {
                    const isSelected = product.type === "simple"
                      ? selectedSize === size
                      : selectedModelSize === size;

                    return (
                      <div
                        key={index}
                        className={`size-option ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (product.type === "simple") {
                            setSelectedSize(size);
                          } else {
                            setSelectedModelSize(size);
                          }
                        }}
                      >
                        {size}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Description Section */}
          <div className="description-section">
            <div className="section-title">Description</div>
            <div className="description-content">
              {description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>

          {/* Specifications Section */}
          {specifications.length > 0 && (
            <div className="specifications-section">
              <div className="section-title">Specifications</div>
              <table className="specifications-table">
                <tbody>
                  {specifications.map((spec, index) => (
                    <tr key={index}>
                      <td>{spec.key}</td>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* NEW: Updated Action Buttons with stock validation */}
          <div className="action-buttons">
            <button
              className={`wishlist-btn ${wishlist ? 'in-wishlist' : ''}`}
              onClick={toggleWishlist}
              title={wishlist ? "Remove from Wishlist" : "Add to Wishlist"}
            >
              {wishlist ? '♥' : '♡'} {wishlist ? (isExactWishlistMatch ? 'In Wishlist' : 'Different Selections') : 'Add to Wishlist'}
            </button>

            <button
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={!canPurchase}
              title={!canPurchase ? (inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : `Only ${inventoryStatus.stock} available`) : ''}
            >
              {inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : `Add to Cart (${quantity})`}
            </button>

            <button
              className="buy-now-btn"
              onClick={handleBuyNow}
              disabled={!canPurchase}
              title={!canPurchase ? (inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : `Only ${inventoryStatus.stock} available`) : ''}
            >
              {inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : `Buy Now (₹${totalPrice.toLocaleString()})`}
            </button>
          </div>

          {/* NEW: Out of stock message */}
          {inventoryStatus.status === 'out-of-stock' && (
            <div className="out-of-stock-message">
               This product is currently out of stock. You can still add it to your wishlist to be notified when it's back in stock.
            </div>
          )}

          {/* NEW: Low stock warning */}
          {inventoryStatus.status === 'low-stock' && inventoryStatus.stock < 5 && (
            <div className="low-stock-warning">
               Hurry! Only {inventoryStatus.stock} item{inventoryStatus.stock > 1 ? 's' : ''} left in stock!
            </div>
          )}

          {/* Wishlist Info Panel (optional) */}
          {wishlistItem && (
            <div className="wishlist-details-panel">
              {/* <div className="panel-title">Wishlist Details</div> */}
              {/* <div className="panel-content">
                <p><strong>Added from:</strong> {wishlistItem.addedFrom === "product" ? "Product Page" : "Home Page"}</p>
                {wishlistItem.selectedModel && (
                  <p><strong>Model:</strong> {wishlistItem.selectedModel.modelName}</p>
                )}
                {wishlistItem.selectedColor && (
                  <p><strong>Color:</strong> {wishlistItem.selectedColor.colorName}</p>
                )}
                {wishlistItem.selectedSize && (
                  <p><strong>Size:</strong> {wishlistItem.selectedSize}</p>
                )}
                <p><strong>Date added:</strong> {new Date(wishlistItem.createdAt).toLocaleDateString()}</p>
              </div> */}
            </div>
          )}
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="related-products">
          <div className="section-title">You Might Also Like</div>
          <div className="related-grid">
            {relatedProducts.map((relatedProduct) => {
              // Get thumbnail for related product
              let thumbnail = relatedProduct.thumbnailImage;
              if (relatedProduct.type === "simple" && relatedProduct.colors && relatedProduct.colors.length > 0) {
                thumbnail = relatedProduct.colors[0].images?.[0] || relatedProduct.thumbnailImage;
              } else if (relatedProduct.type === "variable" && relatedProduct.models && relatedProduct.models.length > 0) {
                const firstModel = relatedProduct.models[0];
                if (firstModel.colors && firstModel.colors.length > 0) {
                  thumbnail = firstModel.colors[0].images?.[0] || relatedProduct.thumbnailImage;
                }
              }

              return (
                <div
                  key={relatedProduct.productId}
                  className="related-product-card"
                  onClick={() => navigate(`/product/${relatedProduct.productId}`)}
                >
                  <div className="related-image">
                    <img
                      src={thumbnail || "https://via.placeholder.com/300x150?text=No+Image"}
                      alt={relatedProduct.productName}
                    />
                  </div>
                  <div className="related-info">
                    <div className="related-name">{relatedProduct.productName}</div>
                    <div className="related-price">
                      ₹{relatedProduct.currentPrice?.toLocaleString() || "0"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
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
    'silver': '#bdc3c7',
    'multicolor': 'linear-gradient(45deg, #ff4757, #3742fa, #2ed573)'
  };

  const lowerColor = colorName.toLowerCase();
  return colorMap[lowerColor] || '#718096';
}

export default ProductPage;