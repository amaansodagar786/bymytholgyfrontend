import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay, Thumbs } from "swiper/modules";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/thumbs";
import "./ProductPage.scss";

// Import Sidebars
import WishlistSidebar from "../../Pages/Wishlist/Sidebar/WishlistSidebar";
import CartSidebar from "../../Pages/Cart/Sidebar/CartSidebar";
import RelatedProducts from "./RelatedProducts/RelatedProducts";

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

function ProductPage() {
  const { productName } = useParams();
  const location = useLocation();
  const productId = location.state?.productId;
  const fragranceFromWishlist = location.state?.fragranceFromWishlist; // Get fragrance from Wishlist

  console.log("Product ID received from Products.js:", productId);
  console.log("Product Name from URL:", productName);
  console.log("Full location state:", location.state);
  console.log("Fragrance from Wishlist:", fragranceFromWishlist);
  
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // GSAP ScrollTrigger refs
  const sectionRef = useRef(null); // For the entire product section
  const rightRef = useRef(null);   // For the right column (product details)

  // Sidebar states
  const [showWishlistSidebar, setShowWishlistSidebar] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // OFFER DATA
  const [offers, setOffers] = useState([]);
  const [currentOffer, setCurrentOffer] = useState(null);

  // For simple products (fragrance-based)
  const [selectedFragrance, setSelectedFragrance] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);

  // For variable products
  const [selectedModel, setSelectedModel] = useState(null);
  const [selectedModelFragrance, setSelectedModelFragrance] = useState(null);
  const [selectedModelSize, setSelectedModelSize] = useState(null);

  // Quantity selector
  const [quantity, setQuantity] = useState(1);

  const [mainImage, setMainImage] = useState("");
  const [images, setImages] = useState([]);
  const [wishlist, setWishlist] = useState(false);
  const [wishlistItem, setWishlistItem] = useState(null);

  const [inventoryStatus, setInventoryStatus] = useState({
    stock: 0,
    threshold: 0,
    status: 'checking'
  });

  // Max quantity based on stock
  const [maxQuantity, setMaxQuantity] = useState(99);

  // Reviews states
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsStats, setReviewsStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsLimit] = useState(5);

  // Swiper states for mobile
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  // Initialize GSAP ScrollTrigger
  useEffect(() => {
    // Only run on desktop (screen width >= 1024px)
    if (window.innerWidth >= 1024 && !loading && product) {
      const section = sectionRef.current;
      const right = rightRef.current;

      if (section && right) {
        const trigger = ScrollTrigger.create({
          trigger: right,
          start: "bottom bottom",
          endTrigger: section,
          end: "bottom bottom",
          pin: right,
          pinSpacing: true,
          markers: false,
        });

        // Cleanup function
        return () => {
          trigger.kill();
        };
      }
    }
  }, [loading, product]);


  // Add this near your other useEffect hooks
  useEffect(() => {
    // Debug swiper on mobile
    if (window.innerWidth < 768 && images.length > 0) {
      console.log('Mobile Swiper Debug:');
      console.log('Images count:', images.length);
      console.log('Main Swiper should be visible');

      // Force update after mount
      setTimeout(() => {
        if (thumbsSwiper && !thumbsSwiper.destroyed) {
          console.log('Thumbs swiper initialized');
        }
      }, 1000);
    }
  }, [images, thumbsSwiper]);




  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Kill existing ScrollTrigger instances on mobile
      if (window.innerWidth < 1024) {
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch reviews for the product
  const fetchProductReviews = async (page = 1) => {
    try {
      setReviewsLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/reviews/product/${productId}`,
        {
          params: {
            page,
            limit: reviewsLimit
          }
        }
      );

      if (response.data.success) {
        if (page === 1) {
          setReviews(response.data.reviews);
          setReviewsStats(response.data.stats);
        } else {
          setReviews(prev => [...prev, ...response.data.reviews]);
        }
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Call this in useEffect when product loads
  useEffect(() => {
    if (productId) {
      fetchProductReviews();
    }
  }, [productId]);

  // Render star rating - FIXED to handle number properly
  const renderRatingStars = (rating, size = 'medium') => {
    // Ensure rating is a number
    const numericRating = typeof rating === 'number' ? rating : parseFloat(rating) || 0;

    const stars = [];
    const starSize = size === 'small' ? '1.2rem' : size === 'large' ? '1.8rem' : '1.5rem';

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= Math.round(numericRating) ? 'filled' : 'empty'}`}
          style={{ fontSize: starSize }}
        >
          {i <= numericRating ? '★' : i <= Math.floor(numericRating) ? '★' : i - numericRating <= 0.5 && i - numericRating > 0 ? '★' : '☆'}
        </span>
      );
    }
    return stars;
  };

  // Format date for reviews
  const formatReviewDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Open reviews modal
  const handleOpenReviewsModal = () => {
    setShowReviewsModal(true);
    fetchProductReviews(1);
  };

  // Fetch product data AND offers - UPDATED TO HANDLE WISHLIST FRAGRANCE
  useEffect(() => {
    fetchProduct();
  }, [productId]);

  useEffect(() => {
    if (product && (selectedFragrance || selectedModelFragrance)) {
      fetchInventoryStatus();
    }
  }, [product, selectedFragrance, selectedModel, selectedModelFragrance]);

  // Update max quantity when inventory status changes
  useEffect(() => {
    if (inventoryStatus.status === 'in-stock' || inventoryStatus.status === 'low-stock') {
      setMaxQuantity(inventoryStatus.stock);
      if (quantity > inventoryStatus.stock) {
        setQuantity(inventoryStatus.stock);
      }
    } else if (inventoryStatus.status === 'out-of-stock') {
      setMaxQuantity(0);
      setQuantity(0);
    }
  }, [inventoryStatus]);

  // Function to get pre-selected fragrance with priority
  const getPreSelectedFragrance = () => {
    // Priority: 1. Wishlist state, 2. URL param, 3. None
    if (fragranceFromWishlist) {
      console.log("Using fragrance from wishlist state:", fragranceFromWishlist);
      return fragranceFromWishlist;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const urlFragrance = urlParams.get('fragrance');
    if (urlFragrance) {
      console.log("Using fragrance from URL param:", urlFragrance);
      return urlFragrance;
    }
    
    return null;
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get pre-selected fragrance BEFORE fetching
      const preSelectedFragrance = getPreSelectedFragrance();

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

      // Initialize selections based on product type with pre-selected fragrance
      if (productData.type === "simple") {
        // Simple product
        if (productData.colors && productData.colors.length > 0) {
          const defaultColor = productData.colors[0];

          // Get fragrances from default color
          const fragrances = defaultColor.fragrances || [];
          
          // Check if pre-selected fragrance exists in available fragrances
          if (preSelectedFragrance && fragrances.includes(preSelectedFragrance)) {
            console.log("Setting pre-selected fragrance for simple product:", preSelectedFragrance);
            setSelectedFragrance(preSelectedFragrance);
            
            // Check if pre-selected fragrance has offer
            checkAndSetOfferWithData(productData, defaultColor, null, preSelectedFragrance, offersData);
          } else if (fragrances.length > 0) {
            // Fallback to first fragrance if pre-selected not available
            const firstFragrance = fragrances[0];
            console.log("Setting default fragrance (first):", firstFragrance);
            setSelectedFragrance(firstFragrance);
            checkAndSetOfferWithData(productData, defaultColor, null, firstFragrance, offersData);
          }

          // Set images from default color
          if (defaultColor.images && defaultColor.images.length > 0) {
            setMainImage(defaultColor.images[0]);
            setImages(defaultColor.images);
          } else if (productData.thumbnailImage) {
            setMainImage(productData.thumbnailImage);
            setImages([productData.thumbnailImage]);
          }
        } else {
          // No colors - use product thumbnail
          if (productData.thumbnailImage) {
            setMainImage(productData.thumbnailImage);
            setImages([productData.thumbnailImage]);
          }
        }
      } else if (productData.type === "variable") {
        // Variable product
        if (productData.models && productData.models.length > 0) {
          const firstModel = productData.models[0];
          setSelectedModel(firstModel);

          if (firstModel.colors && firstModel.colors.length > 0) {
            const defaultModelColor = firstModel.colors[0];
            const modelFragrances = defaultModelColor.fragrances || [];
            
            // Check if pre-selected fragrance exists in model fragrances
            if (preSelectedFragrance && modelFragrances.includes(preSelectedFragrance)) {
              console.log("Setting pre-selected fragrance for variable product:", preSelectedFragrance);
              setSelectedModelFragrance(preSelectedFragrance);
              
              // Check if pre-selected model fragrance has offer
              checkAndSetOfferWithData(productData, defaultModelColor, firstModel, preSelectedFragrance, offersData);
            } else if (modelFragrances.length > 0) {
              // Fallback to first fragrance
              const firstModelFragrance = modelFragrances[0];
              console.log("Setting default model fragrance (first):", firstModelFragrance);
              setSelectedModelFragrance(firstModelFragrance);
              checkAndSetOfferWithData(productData, defaultModelColor, firstModel, firstModelFragrance, offersData);
            }

            // Set images from default model color
            if (defaultModelColor.images && defaultModelColor.images.length > 0) {
              setMainImage(defaultModelColor.images[0]);
              setImages(defaultModelColor.images);
            } else if (productData.thumbnailImage) {
              setMainImage(productData.thumbnailImage);
              setImages([productData.thumbnailImage]);
            }
          }
        }
      }

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

      // Get default color ID (always first color)
      const defaultColorId = product.type === "simple"
        ? (product.colors?.[0]?.colorId)
        : (selectedModel?.colors?.[0]?.colorId);

      if (defaultColorId) {
        params.append('colorId', defaultColorId);
      }

      // Add fragrance parameter
      const currentFragrance = product.type === "simple" ? selectedFragrance : selectedModelFragrance;
      if (currentFragrance) {
        params.append('fragrance', currentFragrance);
      }

      if (product.type === "variable" && selectedModel?._id) {
        params.append('modelId', selectedModel._id);
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/product/${product.productId}/status?${params.toString()}`
      );

      setInventoryStatus({
        stock: response.data.stock,
        threshold: response.data.threshold,
        status: response.data.status
      });

    } catch (error) {
      console.error('Error fetching inventory:', error);
      setInventoryStatus({
        stock: 0,
        threshold: 10,
        status: 'error'
      });
    }
  };

  // Function to check and set offer with data
  const checkAndSetOfferWithData = (productData, color, model, fragrance, offersArray) => {
    if (!color || !color.colorId) {
      setCurrentOffer(null);
      return;
    }

    const variableModelId = model ? (model._id || model.modelId) : "";

    // Find offer for this color (fragrance offers are based on color)
    const offer = offersArray.find(offer =>
      offer.productId === productData.productId &&
      offer.colorId === color.colorId &&
      (variableModelId ? offer.variableModelId === variableModelId : !offer.variableModelId) &&
      offer.isCurrentlyValid
    );

    setCurrentOffer(offer || null);
  };

  // Function to check and set offer
  const checkAndSetOffer = (productData, color, model, fragrance) => {
    checkAndSetOfferWithData(productData, color, model, fragrance, offers);
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

          // Add fragrance details if available
          const currentFragrance = product.type === "simple" ? selectedFragrance : selectedModelFragrance;
          if (currentFragrance) {
            params.append('fragrance', currentFragrance);
          }

          // Add default color ID
          const defaultColorId = product.type === "simple"
            ? (product.colors?.[0]?.colorId)
            : (selectedModel?.colors?.[0]?.colorId);

          if (defaultColorId) {
            params.append('colorId', defaultColorId);
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
  }, [product, token, selectedFragrance, selectedModel, selectedModelFragrance, selectedSize, selectedModelSize]);

  // Handle pre-selection from URL parameters - UPDATED to not interfere with wishlist state
  useEffect(() => {
    // Skip if we already have fragrance from wishlist
    if (fragranceFromWishlist) {
      console.log("Skipping URL param check - using wishlist fragrance");
      return;
    }
    
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

          // Check for fragrance within this model
          const fragrance = urlParams.get('fragrance');
          if (fragrance && model.colors && model.colors.length > 0) {
            const modelColor = model.colors[0];
            if (modelColor.fragrances && modelColor.fragrances.includes(fragrance)) {
              setSelectedModelFragrance(fragrance);
              // Check offer for this selection
              checkAndSetOffer(product, modelColor, model, fragrance);
              // Set images
              if (modelColor.images && modelColor.images.length > 0) {
                setMainImage(modelColor.images[0]);
                setImages(modelColor.images);
              }
            }
          }
        }
      }

      // Check for fragrance selection (for simple products or if model not specified)
      const fragrance = urlParams.get('fragrance');
      if (fragrance && !urlParams.get('model')) {
        if (product.type === "simple" && product.colors && product.colors.length > 0) {
          const defaultColor = product.colors[0];
          if (defaultColor.fragrances && defaultColor.fragrances.includes(fragrance)) {
            setSelectedFragrance(fragrance);
            // Check offer for this selection
            checkAndSetOffer(product, defaultColor, null, fragrance);
            // Set images
            if (defaultColor.images && defaultColor.images.length > 0) {
              setMainImage(defaultColor.images[0]);
              setImages(defaultColor.images);
            }
          }
        }
      }

      // Check for size selection
      const size = urlParams.get('size');
      if (size) {
        if (product.type === "simple") {
          setSelectedSize(size);
        } else if (product.type === "variable") {
          setSelectedModelSize(size);
        }
      }
    }
  }, [product, window.location.search, fragranceFromWishlist]);

  // Clear location state after using it
  useEffect(() => {
    if (fragranceFromWishlist && location.state) {
      // Clear the state to prevent re-use on refresh
      navigate(location.pathname + location.search, { replace: true, state: {} });
    }
  }, [fragranceFromWishlist, location, navigate]);

  // Handle fragrance selection for simple products
  const handleFragranceSelect = (fragrance) => {
    setSelectedFragrance(fragrance);

    // Get default color
    const defaultColor = product.colors?.[0];
    if (defaultColor) {
      // Check offer for selected fragrance (based on default color)
      checkAndSetOffer(product, defaultColor, null, fragrance);
    }

    // Reset size selection
    if (defaultColor?.sizes && defaultColor.sizes.length > 0) {
      setSelectedSize(defaultColor.sizes[0]);
    } else {
      setSelectedSize(null);
    }
  };

  // Handle model selection for variable products
  const handleModelSelect = (model) => {
    setSelectedModel(model);

    // Reset fragrance and size selections
    setSelectedModelFragrance(null);
    setSelectedModelSize(null);

    // Get first fragrance from model's default color
    if (model.colors && model.colors.length > 0) {
      const modelColor = model.colors[0];
      const fragrances = modelColor.fragrances || [];
      if (fragrances.length > 0) {
        const firstFragrance = fragrances[0];
        setSelectedModelFragrance(firstFragrance);

        // Check offer for this model's first fragrance
        checkAndSetOffer(product, modelColor, model, firstFragrance);

        if (modelColor.images && modelColor.images.length > 0) {
          setMainImage(modelColor.images[0]);
          setImages(modelColor.images);
        }

        if (modelColor.sizes && modelColor.sizes.length > 0) {
          setSelectedModelSize(modelColor.sizes[0]);
        }
      }
    }
  };

  // Handle model fragrance selection for variable products
  const handleModelFragranceSelect = (fragrance) => {
    setSelectedModelFragrance(fragrance);

    // Get default color from selected model
    const modelColor = selectedModel?.colors?.[0];
    if (modelColor) {
      // Check offer for selected fragrance
      checkAndSetOffer(product, modelColor, selectedModel, fragrance);
    }

    // Reset size selection
    if (modelColor?.sizes && modelColor.sizes.length > 0) {
      setSelectedModelSize(modelColor.sizes[0]);
    } else {
      setSelectedModelSize(null);
    }
  };

  // Handle quantity change with stock validation
  const handleQuantityChange = (change) => {
    const newQuantity = quantity + change;

    // Check if product is out of stock
    if (inventoryStatus.status === 'out-of-stock') {
      return;
    }

    // Check if new quantity exceeds available stock
    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      if (newQuantity > inventoryStatus.stock) {
        return;
      }
    }

    if (newQuantity >= 1 && newQuantity <= maxQuantity) {
      setQuantity(newQuantity);
    }
  };

  // Check if product can be purchased
  const canPurchaseProduct = () => {
    // Check if fragrance is selected
    if (!selectedFragrance && !selectedModelFragrance) {
      return false;
    }

    // Check stock status
    if (inventoryStatus.status === 'checking' || inventoryStatus.status === 'error') {
      return true;
    }

    if (inventoryStatus.status === 'out-of-stock') {
      return false;
    }

    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
      return quantity <= inventoryStatus.stock && quantity > 0;
    }

    return true;
  };

  // Get base price
  const getBasePrice = () => {
    if (product.type === "simple" && product.colors?.[0]) {
      return product.colors[0].currentPrice || product.currentPrice || 0;
    } else if (product.type === "variable" && selectedModel?.colors?.[0]) {
      return selectedModel.colors[0].currentPrice || product.currentPrice || 0;
    }
    return product.currentPrice || 0;
  };

  // Get original price
  const getOriginalPrice = () => {
    if (product.type === "simple" && product.colors?.[0]) {
      return product.colors[0].originalPrice || product.originalPrice || 0;
    } else if (product.type === "variable" && selectedModel?.colors?.[0]) {
      return selectedModel.colors[0].originalPrice || product.originalPrice || 0;
    }
    return product.originalPrice || 0;
  };

  // Get FINAL discount percentage (after offer)
  const getDiscountPercent = () => {
    const originalPrice = getOriginalPrice();
    const finalPrice = hasOffer ? getOfferPrice() : getBasePrice();

    if (originalPrice > 0 && originalPrice > finalPrice) {
      return Math.round(((originalPrice - finalPrice) / originalPrice) * 100);
    }
    return 0;
  };

  // Get offer price
  const getOfferPrice = () => {
    const basePrice = getBasePrice();
    if (currentOffer && currentOffer.offerPercentage > 0) {
      const discountAmount = (basePrice * currentOffer.offerPercentage) / 100;
      return Math.max(0, basePrice - discountAmount);
    }
    return basePrice;
  };

  // Get total price
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

  // Get specifications
  const getSpecifications = () => {
    const specs = [];

    if (product.type === "simple") {
      if (product.specifications && product.specifications.length > 0) {
        product.specifications.forEach(spec => {
          specs.push({ key: spec.key, value: spec.value });
        });
      }
    } else if (product.type === "variable") {
      if (selectedModel && selectedModel.modelSpecifications && selectedModel.modelSpecifications.length > 0) {
        selectedModel.modelSpecifications.forEach(spec => {
          specs.push({ key: spec.key, value: spec.value });
        });
      } else if (product.specifications && product.specifications.length > 0) {
        product.specifications.forEach(spec => {
          specs.push({ key: spec.key, value: spec.value });
        });
      }
    }

    return specs;
  };

  // Get available sizes
  const getAvailableSizes = () => {
    if (product.type === "simple" && product.colors?.[0]) {
      return product.colors[0].sizes || [];
    } else if (product.type === "variable" && selectedModel?.colors?.[0]) {
      return selectedModel.colors[0].sizes || [];
    }
    return [];
  };

  // Get available fragrances
  const getAvailableFragrances = () => {
    if (product.type === "simple" && product.colors?.[0]) {
      return product.colors[0].fragrances || [];
    } else if (product.type === "variable" && selectedModel?.colors?.[0]) {
      return selectedModel.colors[0].fragrances || [];
    }
    return [];
  };

  // Check if out of stock
  const isOutOfStock = () => {
    return inventoryStatus.status === 'out-of-stock';
  };

  // Check if current selections match wishlist item
  const isCurrentSelectionInWishlist = () => {
    if (!wishlistItem) return false;

    // Check if fragrance matches
    const currentFragrance = product.type === "simple" ? selectedFragrance : selectedModelFragrance;
    if (currentFragrance && wishlistItem.selectedFragrance && wishlistItem.selectedFragrance !== currentFragrance) {
      return false;
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

  // Toggle wishlist
  // Toggle wishlist - FIXED VERSION
  const toggleWishlist = async () => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    const isCurrentlyWishlisted = wishlist;

    // ✅ Get current fragrance based on product type
    const currentFragrance = product.type === "simple"
      ? selectedFragrance
      : selectedModelFragrance;

    try {
      if (isCurrentlyWishlisted) {
        // ✅ FIXED: Use currentFragrance instead of undefined selectedFragranceData
        await axios.delete(
          `${import.meta.env.VITE_API_URL}/wishlist/remove/${product.productId}?userId=${userId}&fragrance=${currentFragrance}`,
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
        // Add to wishlist
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

        // Add selected fragrance - ✅ Use currentFragrance
        if (currentFragrance) {
          wishlistData.selectedFragrance = currentFragrance;
        }

        const defaultColor = product.type === "simple"
          ? product.colors?.[0]
          : selectedModel?.colors?.[0];

        if (defaultColor) {
          wishlistData.selectedColor = {
            colorId: defaultColor.colorId,
            colorName: defaultColor.colorName,
            currentPrice: getOfferPrice(),
            originalPrice: defaultColor.originalPrice || product.originalPrice || 0
          };
        }

        // Add selected size
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

      window.dispatchEvent(new Event('wishlistUpdated'));

      // OPEN WISHLIST SIDEBAR (Desktop only)
      if (window.innerWidth > 768) {
        setShowWishlistSidebar(true);
      }

    } catch (error) {
      console.error("Error toggling wishlist:", error);
    }
  };

  // Handle add to cart with stock validation
  const handleAddToCart = async () => {
    // Check fragrance selection
    if (!selectedFragrance && !selectedModelFragrance) {
      return;
    }

    // Check stock
    if (!canPurchaseProduct()) {
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      // If not logged in, redirect to login
      navigate("/login");
      return;
    }

    const basePrice = getBasePrice();
    const offerPrice = getOfferPrice();
    const hasOffer = currentOffer && currentOffer.offerPercentage > 0;

    // Get default color
    const defaultColor = product.type === "simple"
      ? product.colors?.[0]
      : selectedModel?.colors?.[0];

    // Prepare cart data
    const cartData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: getOriginalPrice(),
      finalPrice: offerPrice,
      totalPrice: getTotalPrice(),
      selectedColor: defaultColor,
      selectedFragrance: product.type === "simple" ? selectedFragrance : selectedModelFragrance,
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

      window.dispatchEvent(new Event('cartUpdated'));

      // OPEN CART SIDEBAR (Desktop only)
      if (window.innerWidth > 768) {
        setShowCartSidebar(true);
      }

    } catch (error) {
      console.error("Error adding to cart:", error);
    }
  };

  // Handle buy now
  const handleBuyNow = () => {
    // Check fragrance selection
    if (!selectedFragrance && !selectedModelFragrance) {
      return;
    }

    // Check stock
    if (!canPurchaseProduct()) {
      return;
    }

    // Check if user is logged in
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    const basePrice = getBasePrice();
    const offerPrice = getOfferPrice();
    const hasOffer = currentOffer && currentOffer.offerPercentage > 0;

    // Get default color
    const defaultColor = product.type === "simple"
      ? product.colors?.[0]
      : selectedModel?.colors?.[0];

    const selectedFragranceData = product.type === "simple" ? selectedFragrance : selectedModelFragrance;
    const selectedSizeData = product.type === "simple" ? selectedSize : selectedModelSize;
    const thumbnailImage = defaultColor?.images?.[0] || product.thumbnailImage;

    // Prepare Buy Now data
    const buyNowData = {
      userId,
      productId: product.productId,
      productName: product.productName,
      quantity: quantity,
      unitPrice: getOriginalPrice(),
      finalPrice: offerPrice,
      totalPrice: getTotalPrice(),
      selectedColor: defaultColor,
      selectedFragrance: selectedFragranceData,
      selectedSize: selectedSizeData,
      selectedModel: product.type === "variable" ? {
        modelId: selectedModel._id || selectedModel.modelId,
        modelName: selectedModel.modelName,
        SKU: selectedModel.SKU
      } : null,
      hasOffer: hasOffer,
      offerDetails: hasOffer ? {
        offerId: currentOffer._id,
        offerPercentage: currentOffer.offerPercentage,
        offerLabel: currentOffer.offerLabel,
        originalPrice: basePrice,
        offerPrice: offerPrice,
        savedAmount: (basePrice - offerPrice) * quantity
      } : null,
      thumbnailImage: thumbnailImage
    };

    // Navigate to checkout with Buy Now data
    navigate('/checkout', {
      state: {
        buyNowMode: true,
        productData: buyNowData
      }
    });
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
  const hasOffer = currentOffer && currentOffer.offerPercentage > 0;
  const discountPercent = getDiscountPercent();
  const description = getDescription();
  const specifications = getSpecifications();
  const availableSizes = getAvailableSizes();
  const availableFragrances = getAvailableFragrances();

  const finalPrice = hasOffer ? offerPrice : basePrice;

  // Get purchase eligibility
  const canPurchase = canPurchaseProduct();

  // Fix for reviewsStats.averageRating - ensure it's a number
  const averageRating = typeof reviewsStats.averageRating === 'number'
    ? reviewsStats.averageRating
    : parseFloat(reviewsStats.averageRating) || 0;

  return (
    <div className="product-page">
      {/* SIDEBARS */}
      <WishlistSidebar
        isOpen={showWishlistSidebar}
        onClose={() => setShowWishlistSidebar(false)}
      />
      <CartSidebar
        isOpen={showCartSidebar}
        onClose={() => setShowCartSidebar(false)}
      />

      {/* Back Button - Styled */}
      <div className="product-page-back-button">
        <button
          className="styled-back-button"
          onClick={() => navigate(-1)}
          aria-label="Go back to previous page"
        >
          <span className="back-arrow">←</span>
          <span className="back-text">Back</span>
        </button>
      </div>

      {/* PRODUCT SECTION WITH SCROLL TRIGGER */}
      <section className="product-scroll-section" ref={sectionRef}>
        <div className="columns-wrapper">
          {/* LEFT COLUMN - Images Section (LONG) */}
          <div className="product-images-column">
            {/* Desktop View - Vertical Stack */}
            <div className="desktop-images-view">
              {/* Thumbnail Strip (Vertical) */}
              {images.length > 0 && (
                <div className="thumbnail-strip">
                  {images.map((img, index) => (
                    <div
                      key={index}
                      className={`thumbnail-item ${img === mainImage ? 'active' : ''}`}
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

              {/* Main Images Container (Stacked Vertically) */}
              <div className="main-images-container">
                {images.length > 0 ? (
                  images.map((img, index) => (
                    <div key={index} className="main-image-item">
                      <img
                        src={img}
                        alt={`${product.productName} - ${index + 1}`}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://via.placeholder.com/600x600?text=No+Image";
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div className="no-image-placeholder">
                    <div className="no-image-icon">🖼️</div>
                    <p>No images available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile View - Swiper Slider */}
            <div className="mobile-images-view">
              {images && images.length > 0 ? (
                <>
                  <Swiper
                    key={`main-${images.length}`}
                    spaceBetween={10}
                    slidesPerView={1}
                    navigation={true}
                    autoplay={{
                      delay: 4000,
                      disableOnInteraction: false,
                    }}
                    thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                    modules={[Navigation, Autoplay, Thumbs]}
                    className="main-swiper"
                    style={{
                      width: '100%',
                      height: '350px',
                      '--swiper-navigation-color': '#000',
                      '--swiper-pagination-color': '#000',
                    }}
                  >
                    {images.map((img, index) => (
                      <SwiperSlide key={`slide-${index}`}>
                        <div className="swiper-image-container">
                          <img
                            src={img}
                            alt={`${product.productName} - ${index + 1}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/600x600/ffffff/000000?text=No+Image";
                            }}
                            loading="eager"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              display: 'block'
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>

                  {/* Thumbnail Swiper */}
                  <Swiper
                    key={`thumbs-${images.length}`}
                    onSwiper={setThumbsSwiper}
                    spaceBetween={10}
                    slidesPerView={Math.min(4, images.length)}
                    freeMode={true}
                    watchSlidesProgress={true}
                    modules={[Thumbs]}
                    className="thumbnail-swiper"
                    style={{
                      width: '100%',
                      height: '70px',
                      marginTop: '10px'
                    }}
                  >
                    {images.map((img, index) => (
                      <SwiperSlide key={`thumb-${index}`}>
                        <div className="swiper-thumbnail">
                          <img
                            src={img}
                            alt={`${product.productName} - Thumb ${index + 1}`}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/80x80/ffffff/000000?text=No+Image";
                            }}
                            loading="lazy"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block'
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                </>
              ) : (
                <div className="no-image-placeholder">
                  <div className="no-image-icon">🖼️</div>
                  <p>No images available</p>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Product Details (SHORT) */}
          <div className="product-details-column" ref={rightRef}>
            {/* BEST SELLER BADGE */}
            <div className="best-seller-badge">
              BEST SELLER
            </div>

            {/* PRODUCT HEADER with Wishlist Icon */}
            <div className="product-header-section">
              <h1 className="product-title">
                {product.productName}
                <button
                  className={`wishlist-icon-btn ${wishlist ? 'active' : ''}`}
                  onClick={toggleWishlist}
                  title={wishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                >
                  {wishlist ? <FaHeart /> : <FaRegHeart />}
                </button>
              </h1>
            </div>

            {/* SHORT DESCRIPTION */}
            <div className="short-description">
              {product.description || "Premium quality product with luxurious fragrance."}
            </div>

            {/* SPECIAL OFFER BADGE AFTER DESCRIPTION */}
            {hasOffer && currentOffer?.offerLabel && (
              <div className="offer-badge-after-description">
                {currentOffer.offerLabel}
              </div>
            )}

            {/* PRICE SECTION - Simple Row */}
            <div className="simple-price-section">
              <div className="price-row">
                <span className="current-price">₹{finalPrice.toLocaleString()}</span>

                {/* SHOW ORIGINAL PRICE WITH STRIKETHROUGH */}
                {originalPrice > finalPrice && (
                  <>
                    <span className="original-price">₹{originalPrice.toLocaleString()}</span>

                    {/* SHOW FINAL DISCOUNT % (60%) */}
                    <span className="discount-percent">{getDiscountPercent()}% OFF</span>
                  </>
                )}




              </div>



              {/* Stock Status */}
              <div className={`stock-status-badge ${inventoryStatus.status}`}>
                {inventoryStatus.status === 'checking' ? (
                  <>Checking stock...</>
                ) : inventoryStatus.status === 'error' ? (
                  <>Stock check failed</>
                ) : inventoryStatus.status === 'out-of-stock' ? (
                  <>Out of Stock</>
                ) : inventoryStatus.status === 'low-stock' ? (
                  <>Low Stock </>
                ) : (
                  <>In Stock </>
                )}
              </div>
            </div>

            {/* REVIEWS ROW */}
            <div className="reviews-row" onClick={handleOpenReviewsModal}>
              <div className="stars-container">
                {renderRatingStars(averageRating, 'medium')}
              </div>
              <div className="reviews-count">
                {reviewsStats.totalReviews} Review{reviewsStats.totalReviews !== 1 ? 's' : ''}
              </div>
              {/* <div className="reviews-arrow">→</div>  */}
            </div>

            {/* FRAGRANCE SELECTION */}
            <div className="fragrance-selection-section">
              <div className="section-header">
                <h3>Select Fragrance :</h3>
                {(selectedFragrance || selectedModelFragrance) && (
                  <span className="selected-indicator">
                    {/* Selected: <strong>{selectedFragrance || selectedModelFragrance}</strong> */}
                  </span>
                )}
              </div>

              {availableFragrances.length > 0 ? (
                <div className="fragrance-grid">
                  {availableFragrances.map((fragrance, index) => {
                    const isSelected = product.type === "simple"
                      ? selectedFragrance === fragrance
                      : selectedModelFragrance === fragrance;

                    return (
                      <div
                        key={index}
                        className={`fragrance-box ${isSelected ? 'selected' : ''} ${inventoryStatus.status === 'out-of-stock' ? 'out-of-stock' : ''
                          }`}
                        onClick={() => {
                          if (inventoryStatus.status === 'out-of-stock') return;
                          if (product.type === "simple") {
                            handleFragranceSelect(fragrance);
                          } else {
                            handleModelFragranceSelect(fragrance);
                          }
                        }}
                      >
                        <div className="fragrance-name">{fragrance}</div>
                        {inventoryStatus.status === 'out-of-stock' && (
                          <div className="out-of-stock-overlay">Out of Stock</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="no-fragrances-message">
                  <p>No fragrances available for this product.</p>
                </div>
              )}

              {/* Fragrance selection required message */}
              {!selectedFragrance && !selectedModelFragrance && (
                <div className="selection-required-message">
                  ⚠️ Please select a fragrance to proceed
                </div>
              )}
            </div>

            {/* QUANTITY SELECTOR */}
            <div className="quantity-selector-section">
              <div className="section-header">
                <h3>Quantity</h3>
              </div>
              <div className="quantity-controls">
                <button
                  className="quantity-btn minus"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || inventoryStatus.status === 'out-of-stock' || !selectedFragrance}
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
                    if (inventoryStatus.status === 'low-stock' || inventoryStatus.status === 'in-stock') {
                      if (value > inventoryStatus.stock) {
                        return;
                      }
                    }
                    if (value >= 1 && value <= maxQuantity) {
                      setQuantity(value);
                    }
                  }}
                  className="quantity-input"
                  disabled={inventoryStatus.status === 'out-of-stock' || !selectedFragrance}
                />
                <button
                  className="quantity-btn plus"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= maxQuantity || inventoryStatus.status === 'out-of-stock' || !selectedFragrance}
                >
                  +
                </button>
                <div className="quantity-summary">
                  <span className="total-label">Total: </span>
                  <span className="total-price">₹{totalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* MODEL SELECTION (for variable products) */}
            {product.type === "variable" && product.models && product.models.length > 0 && (
              <div className="model-selection-section">
                <div className="section-header">
                  <h3>Select Model</h3>
                  {selectedModel && (
                    <span className="selected-indicator">
                      Selected: <strong>{selectedModel.modelName}</strong>
                    </span>
                  )}
                </div>
                <div className="model-options-grid">
                  {product.models.map((model, index) => (
                    <div
                      key={index}
                      className={`model-option-card ${selectedModel?.modelName === model.modelName ? 'selected' : ''}`}
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

            {/* SIZE SELECTION */}
            {availableSizes.length > 0 && (
              <div className="size-selection-section">
                <div className="section-header">
                  <h3>Select Size</h3>
                  {(selectedSize || selectedModelSize) && (
                    <span className="selected-indicator">
                      Selected: <strong>{selectedSize || selectedModelSize}</strong>
                    </span>
                  )}
                </div>
                <div className="size-options-grid">
                  {availableSizes.map((size, index) => {
                    const isSelected = product.type === "simple"
                      ? selectedSize === size
                      : selectedModelSize === size;

                    return (
                      <div
                        key={index}
                        className={`size-option-box ${isSelected ? 'selected' : ''}`}
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

            {/* ACTION BUTTONS - Add to Cart & Buy Now in same row */}
            <div className="action-buttons-section">
              <button
                className={`add-to-cart-btn ${!canPurchase || !selectedFragrance ? 'disabled' : ''}`}
                onClick={handleAddToCart}
                disabled={!canPurchase || !selectedFragrance}
                title={!selectedFragrance ? 'Please select a fragrance' : (!canPurchase ? (inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : `Only ${inventoryStatus.stock} available`) : '')}
              >
                {!selectedFragrance && !selectedModelFragrance
                  ? 'Select Fragrance First'
                  : inventoryStatus.status === 'out-of-stock'
                    ? 'Out of Stock'
                    : `Add to Cart`}
              </button>

              <button
                className={`buy-now-btn ${!canPurchase || !selectedFragrance ? 'disabled' : ''}`}
                onClick={handleBuyNow}
                disabled={!canPurchase || !selectedFragrance}
                title={!selectedFragrance ? 'Please select a fragrance' : (!canPurchase ? (inventoryStatus.status === 'out-of-stock' ? 'Out of Stock' : `Only ${inventoryStatus.stock} available`) : '')}
              >
                {!selectedFragrance && !selectedModelFragrance
                  ? 'Select Fragrance First'
                  : inventoryStatus.status === 'out-of-stock'
                    ? 'Out of Stock'
                    : `Buy Now`}
              </button>
            </div>

            {/* DELIVERY INFORMATION - Static Lines */}
            <div className="delivery-info-section">
              <div className="delivery-header">
                <h3>Delivery Information</h3>
              </div>
              <div className="delivery-options">
                <div className="delivery-option">
                  <div className="option-line">Standard delivery in 2-4 business days</div>
                </div>
                <div className="delivery-option">
                  <div className="option-line">Express delivery in 1-2 business days</div>
                </div>
              </div>
            </div>

            {/* FULL DESCRIPTION */}
            <div className="full-description-section">
              <div className="section-header">
                <h3>Description</h3>
              </div>
              <div className="description-content">
                {description.split('\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>

            {/* SPECIFICATIONS */}
            {specifications.length > 0 && (
              <div className="specifications-section">
                <div className="section-header">
                  <h3>Specifications</h3>
                </div>
                <div className="specifications-grid">
                  {specifications.map((spec, index) => (
                    <div key={index} className="spec-row">
                      <div className="spec-key">{spec.key}</div>
                      <div className="spec-value">{spec.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* NEXT SECTION */}
      {/* RELATED PRODUCTS SECTION */}
      <section className="related-products-section">
        <RelatedProducts
          productId={productId}
          currentFragrances={getAvailableFragrances()} // Pass current product's fragrances
          categoryId={product.categoryId}
          currentProductType={product.type}
          currentModelId={selectedModel?._id}
        />
      </section>

      {/* REVIEWS MODAL */}
      {showReviewsModal && (
        <div className="premium-reviews-modal">
          <div className="modal-overlay" onClick={() => setShowReviewsModal(false)}></div>
          <div className="modal-container">
            <div className="modal-header">
              <div className="modal-title-section">
                <h2>Customer Reviews</h2>
                <div className="reviews-summary-badge">
                  <span className="average-rating">{averageRating.toFixed(1)}</span>
                  <span className="total-reviews-count">/5 • {reviewsStats.totalReviews} reviews</span>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setShowReviewsModal(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Stats Sidebar */}
              <div className="reviews-stats-sidebar">
                <div className="overall-rating-box">
                  <div className="overall-rating-score">{averageRating.toFixed(1)}</div>
                  <div className="overall-rating-stars">
                    {renderRatingStars(averageRating, 'large')}
                  </div>
                  <div className="overall-rating-text">
                    Based on {reviewsStats.totalReviews} review{reviewsStats.totalReviews !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="rating-distribution-chart">
                  <h4>Rating Distribution</h4>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewsStats.ratingDistribution[star] || 0;
                    const percentage = reviewsStats.totalReviews > 0
                      ? Math.round((count / reviewsStats.totalReviews) * 100)
                      : 0;

                    return (
                      <div key={star} className="distribution-row">
                        <span className="star-label">{star} ★</span>
                        <div className="distribution-bar-container">
                          <div
                            className="distribution-bar-fill"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="distribution-count">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div className="reviews-list-container">
                <div className="reviews-filter-bar">
                  <div className="filter-options">
                    <button className="filter-option active">All Reviews</button>
                    <button className="filter-option">5 Star ({reviewsStats.ratingDistribution[5]})</button>
                    <button className="filter-option">4 Star ({reviewsStats.ratingDistribution[4]})</button>
                    <button className="filter-option">3 Star ({reviewsStats.ratingDistribution[3]})</button>
                    <button className="filter-option">2 Star ({reviewsStats.ratingDistribution[2]})</button>
                    <button className="filter-option">1 Star ({reviewsStats.ratingDistribution[1]})</button>
                  </div>
                </div>

                <div className="reviews-list">
                  {reviewsLoading && reviews.length === 0 ? (
                    <div className="loading-reviews">
                      <div className="loading-spinner"></div>
                      <p>Loading reviews...</p>
                    </div>
                  ) : reviews.length > 0 ? (
                    <>
                      {reviews.map((review, index) => {
                        // Ensure review.rating is a number
                        const reviewRating = typeof review.rating === 'number'
                          ? review.rating
                          : parseFloat(review.rating) || 0;

                        return (
                          <div key={index} className="review-card">
                            <div className="review-header">
                              <div className="reviewer-details">
                                <div className="reviewer-name">{review.userName}</div>
                                <div className="review-meta">
                                  <div className="review-stars">
                                    {renderRatingStars(reviewRating, 'small')}
                                    <span className="review-rating">{reviewRating}/5</span>
                                  </div>
                                  <span className="review-date">{formatReviewDate(review.createdAt)}</span>
                                  {review.isVerifiedPurchase && (
                                    <span className="verified-badge">✅ Verified Purchase</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="review-content">
                              <p className="review-text">"{review.reviewText || 'No review text provided'}"</p>
                            </div>
                          </div>
                        );
                      })}

                      {/* Load More Button */}
                      {reviews.length < reviewsStats.totalReviews && (
                        <button
                          className="load-more-reviews-btn"
                          onClick={() => {
                            const nextPage = reviewsPage + 1;
                            setReviewsPage(nextPage);
                            fetchProductReviews(nextPage);
                          }}
                          disabled={reviewsLoading}
                        >
                          {reviewsLoading ? 'Loading...' : 'Load More Reviews'}
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="no-reviews-message">
                      <div className="no-reviews-icon">⭐</div>
                      <h3>No reviews yet</h3>
                      <p>Be the first to review this product!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductPage;