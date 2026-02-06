import React, { useEffect, useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./ProductOffers.scss";
import {
  FiPackage,
  FiPercent,
  FiCalendar,
  FiTag,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiRefreshCw,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiCheck,
  FiAlertCircle,
  FiDollarSign,
  FiSquare,
  FiType,
  FiAlertTriangle
} from "react-icons/fi";

const ProductOffers = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [showAddOffer, setShowAddOffer] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [offerForm, setOfferForm] = useState({
    offerPercentage: "",
    offerLabel: "Special Offer",
    startDate: new Date().toISOString().split('T')[0],
    endDate: "",
    hasEndDate: false
  });

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState({
    type: "",
    productId: "",
    colorId: "",
    offerId: "",
    variableModelId: "",
    colorName: ""
  });

  // ✅ KEEPING ORIGINAL API - Fetch products with color offers
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/products-with-color-offers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(res.data);
      setExpandedProduct(null);
      toast.success("✅ Products with color offers loaded!");
    } catch (err) {
      console.error("❌ Error fetching products:", err);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Toggle product expansion
  const toggleProductExpansion = (productId) => {
    setExpandedProduct(expandedProduct === productId ? null : productId);
  };

  // ✅ KEEPING ORIGINAL - Open add offer form for a color
  const openAddOffer = (product, color, modelName = "", variableModelId = "") => {
    setSelectedProduct(product);
    setSelectedColor({
      ...color,
      modelName,
      variableModelId
    });
    
    // If color already has offer, pre-fill form
    if (color.offer) {
      setOfferForm({
        offerPercentage: color.offer.offerPercentage.toString(),
        offerLabel: color.offer.offerLabel,
        startDate: color.offer.startDate ? new Date(color.offer.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        endDate: color.offer.endDate ? new Date(color.offer.endDate).toISOString().split('T')[0] : "",
        hasEndDate: !!color.offer.endDate
      });
    } else {
      setOfferForm({
        offerPercentage: "",
        offerLabel: "Special Offer",
        startDate: new Date().toISOString().split('T')[0],
        endDate: "",
        hasEndDate: false
      });
    }
    
    setShowAddOffer(true);
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOfferForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // ✅ KEEPING ORIGINAL API - Add/Update offer for a color
  const handleAddColorOffer = async () => {
    try {
      if (!selectedProduct || !selectedColor) return;

      // Validate offer percentage
      const percentage = parseFloat(offerForm.offerPercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        toast.warning("⚠️ Please enter a valid offer percentage between 0 and 100");
        return;
      }

      // Prepare offer data
      const offerData = {
        productId: selectedProduct.productId,
        colorId: selectedColor.colorId,
        colorName: selectedColor.colorName,
        offerPercentage: percentage,
        offerLabel: offerForm.offerLabel || "Special Offer",
        startDate: offerForm.startDate || new Date().toISOString().split('T')[0],
        modelName: selectedColor.modelName || selectedProduct.modelName || "Default",
        variableModelId: selectedColor.variableModelId || ""
      };

      // Add end date only if provided
      if (offerForm.hasEndDate && offerForm.endDate) {
        offerData.endDate = offerForm.endDate;
      }

      const token = localStorage.getItem("adminToken");
      
      // ✅ KEEPING ORIGINAL API CALL
      await axios.post(
        `${import.meta.env.VITE_API_URL}/productoffers/add-color-offer`,
        offerData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`✅ Color offer saved for ${selectedColor.colorName}!`);
      setShowAddOffer(false);
      setSelectedColor(null);
      setSelectedProduct(null);
      fetchProducts();
    } catch (err) {
      console.error("❌ Error saving color offer:", err);
      toast.error(err.response?.data?.error || "Failed to save offer");
    }
  };

  // Open confirmation modal for removing offer
  const openRemoveConfirmModal = (productId, colorId, offerId, variableModelId = "", colorName = "") => {
    setConfirmAction({
      type: "remove_offer",
      productId,
      colorId,
      offerId,
      variableModelId,
      colorName
    });
    setShowConfirmModal(true);
  };

  // ✅ KEEPING ORIGINAL API - Remove offer from a color
  const handleRemoveColorOffer = async () => {
    try {
      const { productId, offerId, variableModelId } = confirmAction;
      const token = localStorage.getItem("adminToken");
      
      await axios.put(
        `${import.meta.env.VITE_API_URL}/productoffers/deactivate-color-offer/${offerId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Color offer removed successfully!");
      setShowConfirmModal(false);
      fetchProducts();
    } catch (err) {
      console.error("❌ Error removing color offer:", err);
      toast.error(err.response?.data?.error || "Failed to remove offer");
      setShowConfirmModal(false);
    }
  };

  // Handle confirm action
  const handleConfirmAction = () => {
    if (confirmAction.type === "remove_offer") {
      handleRemoveColorOffer();
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No end date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    });
  };

  // Get all colors with offers count
  const getColorStats = () => {
    let totalColors = 0;
    let colorsWithOffers = 0;
    let activeOffers = 0;

    products.forEach(product => {
      if (product.type === "simple" && product.colors) {
        totalColors += product.colors.length;
        product.colors.forEach(color => {
          if (color.hasOffer) {
            colorsWithOffers++;
            if (color.offer?.isCurrentlyValid) {
              activeOffers++;
            }
          }
        });
      } else if (product.type === "variable" && product.models) {
        product.models.forEach(model => {
          if (model.colors) {
            totalColors += model.colors.length;
            model.colors.forEach(color => {
              if (color.hasOffer) {
                colorsWithOffers++;
                if (color.offer?.isCurrentlyValid) {
                  activeOffers++;
                }
              }
            });
          }
        });
      }
    });

    return { totalColors, colorsWithOffers, activeOffers };
  };

  const colorStats = getColorStats();

  return (
    <div className="color-offer-container">
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

      {/* Header */}
      <header className="color-offer-header">
        <div className="color-offer-header-content">
          <div className="color-offer-header-title">
            <FiTag className="color-offer-header-icon" />
            <h1>Offers Management</h1>
            <span className="color-offer-badge">{products.length}</span>
          </div>

          <div className="color-offer-header-actions">
            <button
              className="color-offer-refresh-btn"
              onClick={fetchProducts}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "color-offer-spinning" : ""} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards - Showing color stats */}
      <div className="color-offer-stats-grid">
        <div className="color-offer-stat-card">
          <div className="color-offer-stat-icon-card color-offer-total-products">
            <FiPackage />
          </div>
          <div className="color-offer-stat-card-content">
            <h3>{products.length || 0}</h3>
            <p>Total Products</p>
          </div>
        </div>

        <div className="color-offer-stat-card">
          <div className="color-offer-stat-icon-card color-offer-colors-with-offers">
            <FiTag />
          </div>
          <div className="color-offer-stat-card-content">
            <h3>{colorStats.colorsWithOffers || 0}</h3>
            <p>Products with Offers</p>
          </div>
        </div>

        <div className="color-offer-stat-card">
          <div className="color-offer-stat-icon-card color-offer-active-offers">
            <FiPercent />
          </div>
          <div className="color-offer-stat-card-content">
            <h3>{colorStats.activeOffers || 0}</h3>
            <p>Active Offers</p>
          </div>
        </div>
      </div>

      {/* Products List */}
      <div className="color-offer-table-wrapper">
        {loading && products.length === 0 ? (
          <div className="color-offer-loading-overlay">
            <div className="color-offer-loading-spinner"></div>
            <p>Loading products with color offers...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="color-offer-no-data">
            <div className="color-offer-empty-state">
              <FiTag />
              <p>No products found</p>
            </div>
          </div>
        ) : (
          <div className="color-offer-list-container">
            {products.map(product => {
              const isExpanded = expandedProduct === product.productId;
              
              // Count offers for this product
              let productOffersCount = 0;
              if (product.type === "simple" && product.colors) {
                productOffersCount = product.colors.filter(c => c.hasOffer).length;
              } else if (product.type === "variable" && product.models) {
                product.models.forEach(model => {
                  if (model.colors) {
                    productOffersCount += model.colors.filter(c => c.hasOffer).length;
                  }
                });
              }

              return (
                <div key={product.productId} className="color-offer-product-card">
                  {/* PRODUCT HEADER */}
                  <div 
                    className="color-offer-product-header"
                    onClick={() => toggleProductExpansion(product.productId)}
                  >
                    <div className="color-offer-product-info">
                      <div className="color-offer-product-image-container">
                        {product.thumbnailImage ? (
                          <img
                            src={product.thumbnailImage}
                            alt={product.productName}
                            className="color-offer-product-thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="color-offer-product-image-placeholder">
                            <FiPackage />
                          </div>
                        )}
                      </div>

                      <div className="color-offer-product-details">
                        <div className="color-offer-product-name-row">
                          <h3 className="color-offer-product-name">{product.productName}</h3>
                          <span className="color-offer-product-type-badge">
                            {product.type === "simple" ? "Simple Product" : "Variable Product"}
                          </span>
                          <span className="color-offer-offers-count-badge">
                            {productOffersCount} Offer(s)
                          </span>
                        </div>

                        <div className="color-offer-product-meta-row">
                          <span className="color-offer-product-category">
                            {product.categoryName || "Uncategorized"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="color-offer-product-actions">
                      <div className="color-offer-expand-icon">
                        {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                      </div>
                    </div>
                  </div>

                  {/* EXPANDED CONTENT - COLOR LIST */}
                  {isExpanded && (
                    <div className="color-offer-colors-section">
                      {/* SIMPLE PRODUCT COLORS */}
                      {product.type === "simple" && product.colors && (
                        <div className="color-offer-simple-colors-container">
                          <h4 className="color-offer-section-title">
                            <FiSquare />
                            Product ({product.colors.length})
                          </h4>
                          <div className="color-offer-colors-grid">
                            {product.colors.map(color => {
                              const hasOffer = color.hasOffer;
                              const isActive = hasOffer && color.offer?.isCurrentlyValid;

                              return (
                                <div key={color.colorId} className="color-offer-color-card">
                                  <div className="color-offer-color-card-header">
                                    <div className="color-offer-color-info">
                                      <div className="color-offer-color-name-row">
                                        {hasOffer && (
                                          <span className={`color-offer-color-offer-status ${isActive ? 'color-offer-active' : 'color-offer-inactive'}`}>
                                            {isActive ? (
                                              <>
                                                <FiCheck className="color-offer-status-icon" />
                                                Active
                                              </>
                                            ) : (
                                              <>
                                                <FiAlertCircle className="color-offer-status-icon" />
                                                Inactive
                                              </>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                      <div className="color-offer-color-pricing">
                                        {hasOffer && color.offerPrice ? (
                                          <div className="color-offer-offer-pricing">
                                            <span className="color-offer-original-price">
                                              ₹{color.originalPriceDisplay?.toFixed(2) || color.currentPrice?.toFixed(2)}
                                            </span>
                                            <span className="color-offer-current-price">
                                              ₹{color.offerPrice.toFixed(2)}
                                            </span>
                                            <span className="color-offer-discount-badge">
                                              {color.offer.offerPercentage}% OFF
                                            </span>
                                          </div>
                                        ) : (
                                          <span className="color-offer-regular-price">
                                            ₹{color.currentPrice?.toFixed(2) || "0.00"}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="color-offer-color-actions">
                                      <button
                                        className={`color-offer-action-btn ${hasOffer ? 'color-offer-edit' : 'color-offer-add'}`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          openAddOffer(product, color, product.modelName || "Default");
                                        }}
                                      >
                                        {hasOffer ? (
                                          <>
                                            <FiEdit />
                                            Edit Offer
                                          </>
                                        ) : (
                                          <>
                                            <FiPlus />
                                            Add Offer
                                          </>
                                        )}
                                      </button>
                                      {hasOffer && color.offer && (
                                        <button
                                          className="color-offer-remove-btn"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openRemoveConfirmModal(
                                              product.productId,
                                              color.colorId,
                                              color.offer.offerId,
                                              "",
                                              color.colorName
                                            );
                                          }}
                                          title="Remove Offer"
                                        >
                                          <FiTrash2 />
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  {/* Offer Details */}
                                  {hasOffer && color.offer && (
                                    <div className="color-offer-details">
                                      <div className="color-offer-details-grid">
                                        <div className="color-offer-detail-item">
                                          <span className="color-offer-label">Label:</span>
                                          <span>{color.offer.offerLabel}</span>
                                        </div>
                                        <div className="color-offer-detail-item">
                                          <span className="color-offer-label">Start Date:</span>
                                          <span>{formatDate(color.offer.startDate)}</span>
                                        </div>
                                        <div className="color-offer-detail-item">
                                          <span className="color-offer-label">End Date:</span>
                                          <span>{formatDate(color.offer.endDate)}</span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* VARIABLE PRODUCT MODELS */}
                      {product.type === "variable" && product.models && (
                        <div className="color-offer-variable-models-container">
                          {product.models.map((model, modelIndex) => (
                            <div key={modelIndex} className="color-offer-model-section">
                              <h4 className="color-offer-section-title">
                                <FiType />
                                {model.modelName} 
                                <span className="color-offer-model-sku"> ({model.SKU})</span>
                              </h4>
                              <div className="color-offer-model-colors">
                                {model.colors && model.colors.length > 0 ? (
                                  <div className="color-offer-colors-grid">
                                    {model.colors.map(color => {
                                      const hasOffer = color.hasOffer;
                                      const isActive = hasOffer && color.offer?.isCurrentlyValid;

                                      return (
                                        <div key={color.colorId} className="color-offer-color-card">
                                          <div className="color-offer-color-card-header">
                                            <div className="color-offer-color-info">
                                              <div className="color-offer-color-name-row">
                                                <span className="color-offer-color-name">{color.colorName}</span>
                                                {hasOffer && (
                                                  <span className={`color-offer-color-offer-status ${isActive ? 'color-offer-active' : 'color-offer-inactive'}`}>
                                                    {isActive ? (
                                                      <>
                                                        <FiCheck className="color-offer-status-icon" />
                                                        Active
                                                      </>
                                                    ) : (
                                                      <>
                                                        <FiAlertCircle className="color-offer-status-icon" />
                                                        Inactive
                                                      </>
                                                    )}
                                                  </span>
                                                )}
                                              </div>
                                              <div className="color-offer-color-pricing">
                                                {hasOffer && color.offerPrice ? (
                                                  <div className="color-offer-offer-pricing">
                                                    <span className="color-offer-original-price">
                                                      ₹{color.originalPriceDisplay?.toFixed(2) || color.currentPrice?.toFixed(2)}
                                                    </span>
                                                    <span className="color-offer-current-price">
                                                      ₹{color.offerPrice.toFixed(2)}
                                                    </span>
                                                    <span className="color-offer-discount-badge">
                                                      {color.offer.offerPercentage}% OFF
                                                    </span>
                                                  </div>
                                                ) : (
                                                  <span className="color-offer-regular-price">
                                                    ₹{color.currentPrice?.toFixed(2) || "0.00"}
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <div className="color-offer-color-actions">
                                              <button
                                                className={`color-offer-action-btn ${hasOffer ? 'color-offer-edit' : 'color-offer-add'}`}
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  openAddOffer(
                                                    product, 
                                                    color, 
                                                    model.modelName,
                                                    model._id || model.modelId || ""
                                                  );
                                                }}
                                              >
                                                {hasOffer ? (
                                                  <>
                                                    <FiEdit />
                                                    Edit Offer
                                                  </>
                                                ) : (
                                                  <>
                                                    <FiPlus />
                                                    Add Offer
                                                  </>
                                                )}
                                              </button>
                                              {hasOffer && color.offer && (
                                                <button
                                                  className="color-offer-remove-btn"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    openRemoveConfirmModal(
                                                      product.productId,
                                                      color.colorId,
                                                      color.offer.offerId,
                                                      model._id || model.modelId || "",
                                                      color.colorName
                                                    );
                                                  }}
                                                  title="Remove Offer"
                                                >
                                                  <FiTrash2 />
                                                </button>
                                              )}
                                            </div>
                                          </div>
                                          
                                          {/* Offer Details */}
                                          {hasOffer && color.offer && (
                                            <div className="color-offer-details">
                                              <div className="color-offer-details-grid">
                                                <div className="color-offer-detail-item">
                                                  <span className="color-offer-label">Label:</span>
                                                  <span>{color.offer.offerLabel}</span>
                                                </div>
                                                <div className="color-offer-detail-item">
                                                  <span className="color-offer-label">Model:</span>
                                                  <span>{color.offer.modelName}</span>
                                                </div>
                                                <div className="color-offer-detail-item">
                                                  <span className="color-offer-label">Start Date:</span>
                                                  <span>{formatDate(color.offer.startDate)}</span>
                                                </div>
                                                <div className="color-offer-detail-item">
                                                  <span className="color-offer-label">End Date:</span>
                                                  <span>{formatDate(color.offer.endDate)}</span>
                                                </div>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="color-offer-no-colors-text">No colors available for this model</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD/EDIT OFFER MODAL - COLOR LEVEL */}
      {showAddOffer && selectedProduct && selectedColor && (
        <div className="color-offer-modal-overlay">
          <div className="color-offer-modal-backdrop" onClick={() => setShowAddOffer(false)}></div>
          <div className="color-offer-modal-content">
            <div className="color-offer-modal-header">
              <div className="color-offer-modal-title">
                <FiTag />
                <h2>
                  {selectedColor.hasOffer ? 'Edit Offer' : 'Add Offer'}
                </h2>
              </div>
              <button
                className="color-offer-modal-close-btn"
                onClick={() => setShowAddOffer(false)}
                disabled={loading}
              >
                <FiX />
              </button>
            </div>

            <div className="color-offer-modal-body">
              {/* Product & Color Info */}
              <div className="color-offer-modal-section">
                <h3 className="color-offer-modal-section-title">
                  <FiPackage />
                  Product & Color Details
                </h3>
                <div className="color-offer-product-info-grid">
                  <div className="color-offer-info-item">
                    <span className="color-offer-info-label">Product Name</span>
                    <span className="color-offer-info-value">{selectedProduct.productName}</span>
                  </div>
                  <div className="color-offer-info-item">
                    <span className="color-offer-info-label">Current Price</span>
                    <span className="color-offer-info-value">
                      ₹{selectedColor.currentPrice?.toFixed(2) || "0.00"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Offer Form */}
              <div className="color-offer-modal-section">
                <h3 className="color-offer-modal-section-title">
                  <FiPercent />
                  Offer Details
                </h3>
                <div className="color-offer-form-section">
                  <div className="color-offer-form-group">
                    <label>Discount Percentage *</label>
                    <div className="color-offer-percentage-input">
                      <input
                        type="number"
                        name="offerPercentage"
                        min="0"
                        max="100"
                        step="0.1"
                        value={offerForm.offerPercentage}
                        onChange={handleFormChange}
                        placeholder="e.g., 20"
                        disabled={loading}
                        className="color-offer-form-input"
                      />
                      <span className="color-offer-percent-symbol">%</span>
                    </div>
                    <small className="color-offer-input-hint">Enter discount percentage (0-100)</small>
                  </div>

                  <div className="color-offer-form-group">
                    <label>Offer Label</label>
                    <input
                      type="text"
                      name="offerLabel"
                      value={offerForm.offerLabel}
                      onChange={handleFormChange}
                      placeholder="e.g., Summer Sale, Clearance, etc."
                      disabled={loading}
                      className="color-offer-form-input"
                    />
                  </div>

                  <div className="color-offer-form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      value={offerForm.startDate}
                      onChange={handleFormChange}
                      disabled={loading}
                      className="color-offer-form-input"
                    />
                  </div>

                  <div className="color-offer-form-group">
                    <label className="color-offer-checkbox-label">
                      <input
                        type="checkbox"
                        name="hasEndDate"
                        checked={offerForm.hasEndDate}
                        onChange={handleFormChange}
                        disabled={loading}
                      />
                      Set End Date
                      <span className="color-offer-checkbox-hint">(Leave unchecked for ongoing offer)</span>
                    </label>
                  </div>

                  {offerForm.hasEndDate && (
                    <div className="color-offer-form-group">
                      <label>End Date</label>
                      <input
                        type="date"
                        name="endDate"
                        value={offerForm.endDate}
                        onChange={handleFormChange}
                        min={offerForm.startDate}
                        disabled={loading}
                        className="color-offer-form-input"
                      />
                      <small className="color-offer-input-hint">Leave blank if no end date</small>
                    </div>
                  )}

                  {/* Price Preview */}
                  {selectedColor.currentPrice && offerForm.offerPercentage && (
                    <div className="color-offer-price-preview">
                      <div className="color-offer-preview-row">
                        <span>Original Price:</span>
                        <span>₹{selectedColor.currentPrice.toFixed(2)}</span>
                      </div>
                      <div className="color-offer-preview-row">
                        <span>Discount ({offerForm.offerPercentage}%):</span>
                        <span className="color-offer-discount-preview">
                          -₹{(selectedColor.currentPrice * (parseFloat(offerForm.offerPercentage) / 100)).toFixed(2)}
                        </span>
                      </div>
                      <div className="color-offer-preview-row color-offer-total-row">
                        <span>Offer Price:</span>
                        <strong className="color-offer-final-price">
                          ₹{(selectedColor.currentPrice - (selectedColor.currentPrice * (parseFloat(offerForm.offerPercentage) / 100))).toFixed(2)}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="color-offer-modal-footer">
              <button
                className="color-offer-btn-secondary"
                onClick={() => setShowAddOffer(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="color-offer-btn-primary"
                onClick={handleAddColorOffer}
                disabled={loading || !offerForm.offerPercentage}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="color-offer-spinning" />
                    {selectedColor.hasOffer ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  selectedColor.hasOffer ? 'Update Color Offer' : 'Add Color Offer'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="color-offer-confirmation-modal-overlay">
          <div className="color-offer-confirmation-modal-backdrop" onClick={() => setShowConfirmModal(false)}></div>
          <div className="color-offer-confirmation-modal-content">
            <div className="color-offer-confirmation-modal-header">
              <div className="color-offer-confirmation-modal-title">
                <FiAlertTriangle className="color-offer-warning-icon" />
                <h2>Confirm Action</h2>
              </div>
              <button
                className="color-offer-confirmation-modal-close"
                onClick={() => setShowConfirmModal(false)}
              >
                <FiX />
              </button>
            </div>

            <div className="color-offer-confirmation-modal-body">
              {confirmAction.type === "remove_offer" && (
                <>
                  <p className="color-offer-confirmation-message">
                    Are you sure you want to remove this offer?
                  </p>
                  <div className="color-offer-confirmation-details">
                    <p>This action cannot be undone.</p>
                  </div>
                </>
              )}
            </div>

            <div className="color-offer-confirmation-modal-footer">
              <button
                className="color-offer-confirmation-btn-secondary"
                onClick={() => setShowConfirmModal(false)}
              >
                Cancel
              </button>
              <button
                className="color-offer-confirmation-btn-primary"
                onClick={handleConfirmAction}
              >
                {confirmAction.type === "remove_offer" ? 'Remove Offer' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOffers;