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
  FiType
} from "react-icons/fi";
import AdminLayout from "../AdminLayout/AdminLayout";

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

  // ✅ KEEPING ORIGINAL API - Fetch products with color offers
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/products-with-color-offers`, // ✅ ORIGINAL API
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
        `${import.meta.env.VITE_API_URL}/productoffers/add-color-offer`, // ✅ ORIGINAL API
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

  // ✅ KEEPING ORIGINAL API - Remove offer from a color
  const handleRemoveColorOffer = async (productId, colorId, offerId, variableModelId = "") => {
    if (!window.confirm("Are you sure you want to remove this color offer?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      // ✅ KEEPING ORIGINAL API CALL
      await axios.put(
        `${import.meta.env.VITE_API_URL}/productoffers/deactivate-color-offer/${offerId}`, // ✅ ORIGINAL API
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("✅ Color offer removed successfully!");
      fetchProducts();
    } catch (err) {
      console.error("❌ Error removing color offer:", err);
      toast.error(err.response?.data?.error || "Failed to remove offer");
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

  // Get all colors with offers count - KEEPING ORIGINAL
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
    <AdminLayout>
      <div className="product-offers-container">
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />

        {/* Header */}
        <header className="offers-header">
          <div className="header-content">
            <div className="header-title">
              <FiTag className="header-icon" />
              <h1>Offers Management</h1>
              <span className="offers-badge">{products.length}</span>
            </div>

            <div className="header-actions">
              <button
                className="refresh-offers-btn"
                onClick={fetchProducts}
                disabled={loading}
              >
                <FiRefreshCw className={loading ? "spinning" : ""} />
                Refresh
              </button>
            </div>
          </div>
        </header>

        {/* Stats Cards - Showing color stats */}
        <div className="offers-stats-grid">
          <div className="offers-stat-card">
            <div className="stat-icon-card total-products">
              <FiPackage />
            </div>
            <div className="stat-card-content">
              <h3>{products.length || 0}</h3>
              <p>Total Products</p>
            </div>
          </div>

          {/* <div className="offers-stat-card">
            <div className="stat-icon-card total-colors">
              <FiSquare />
            </div>
            <div className="stat-card-content">
              <h3>{colorStats.totalColors || 0}</h3>
              <p>Total Colors</p>
            </div>
          </div> */}

          <div className="offers-stat-card">
            <div className="stat-icon-card colors-with-offers">
              <FiTag />
            </div>
            <div className="stat-card-content">
              <h3>{colorStats.colorsWithOffers || 0}</h3>
              <p>Products with Offers</p>
            </div>
          </div>

          <div className="offers-stat-card">
            <div className="stat-icon-card active-offers">
              <FiPercent />
            </div>
            <div className="stat-card-content">
              <h3>{colorStats.activeOffers || 0}</h3>
              <p>Active Offers</p>
            </div>
          </div>
        </div>

        {/* Products List - KEEPING COLOR LEVEL STRUCTURE */}
        <div className="offers-table-wrapper">
          {loading && products.length === 0 ? (
            <div className="offers-loading-overlay">
              <div className="offers-loading-spinner"></div>
              <p>Loading products with color offers...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="offers-no-data">
              <div className="offers-empty-state">
                <FiTag />
                <p>No products found</p>
              </div>
            </div>
          ) : (
            <div className="offers-list-container">
              {products.map(product => {
                const isExpanded = expandedProduct === product.productId;
                
                // Count offers for this product - ORIGINAL LOGIC
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
                  <div key={product.productId} className="product-offer-card">
                    {/* PRODUCT HEADER */}
                    <div 
                      className="product-offer-header"
                      onClick={() => toggleProductExpansion(product.productId)}
                    >
                      <div className="product-offer-info">
                        <div className="product-image-container">
                          {product.thumbnailImage ? (
                            <img
                              src={product.thumbnailImage}
                              alt={product.productName}
                              className="product-thumbnail"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                              }}
                            />
                          ) : (
                            <div className="product-image-placeholder">
                              <FiPackage />
                            </div>
                          )}
                        </div>

                        <div className="product-details">
                          <div className="product-name-row">
                            <h3 className="product-name">{product.productName}</h3>
                            <span className="product-type-badge">
                              {product.type === "simple" ? "Simple Product" : "Variable Product"}
                            </span>
                            <span className="offers-count-badge">
                              {productOffersCount} Offer(s)
                            </span>
                          </div>

                          <div className="product-meta-row">
                            <span className="product-category">
                              {product.categoryName || "Uncategorized"}
                            </span>
                            {/* <span className="product-id">
                              ID: {product.productId}
                            </span> */}
                          </div>
                        </div>
                      </div>

                      <div className="product-offer-actions">
                        <div className="expand-icon">
                          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                        </div>
                      </div>
                    </div>

                    {/* EXPANDED CONTENT - COLOR LIST - KEEPING ORIGINAL STRUCTURE */}
                    {isExpanded && (
                      <div className="product-colors-section">
                        {/* SIMPLE PRODUCT COLORS */}
                        {product.type === "simple" && product.colors && (
                          <div className="simple-colors-container">
                            <h4 className="section-title">
                              <FiSquare />
                              Product ({product.colors.length})
                            </h4>
                            <div className="colors-grid">
                              {product.colors.map(color => {
                                const hasOffer = color.hasOffer;
                                const isActive = hasOffer && color.offer?.isCurrentlyValid;

                                return (
                                  <div key={color.colorId} className="color-card">
                                    <div className="color-card-header">
                                      <div className="color-info">
                                        <div className="color-name-row">
                                          {/* <span className="color-name">{color.colorName}</span> */}
                                          {hasOffer && (
                                            <span className={`color-offer-status ${isActive ? 'active' : 'inactive'}`}>
                                              {isActive ? (
                                                <>
                                                  <FiCheck className="status-icon" />
                                                  Active
                                                </>
                                              ) : (
                                                <>
                                                  <FiAlertCircle className="status-icon" />
                                                  Inactive
                                                </>
                                              )}
                                            </span>
                                          )}
                                        </div>
                                        <div className="color-pricing">
                                          {hasOffer && color.offerPrice ? (
                                            <div className="offer-pricing">
                                              <span className="original-price">
                                                ₹{color.originalPriceDisplay?.toFixed(2) || color.currentPrice?.toFixed(2)}
                                              </span>
                                              <span className="current-price">
                                                ₹{color.offerPrice.toFixed(2)}
                                              </span>
                                              <span className="discount-badge">
                                                {color.offer.offerPercentage}% OFF
                                              </span>
                                            </div>
                                          ) : (
                                            <span className="regular-price">
                                              ₹{color.currentPrice?.toFixed(2) || "0.00"}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                      <div className="color-actions">
                                        <button
                                          className={`offer-action-btn ${hasOffer ? 'edit' : 'add'}`}
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
                                            className="remove-offer-btn"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemoveColorOffer(
                                                product.productId,
                                                color.colorId,
                                                color.offer.offerId
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
                                      <div className="offer-details">
                                        <div className="offer-details-grid">
                                          <div className="offer-detail-item">
                                            <span className="offer-label">Label:</span>
                                            <span>{color.offer.offerLabel}</span>
                                          </div>
                                          {/* <div className="offer-detail-item">
                                            <span className="offer-label">Model:</span>
                                            <span>{color.offer.modelName}</span>
                                          </div> */}
                                          <div className="offer-detail-item">
                                            <span className="offer-label">Start Date:</span>
                                            <span>{formatDate(color.offer.startDate)}</span>
                                          </div>
                                          <div className="offer-detail-item">
                                            <span className="offer-label">End Date:</span>
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
                          <div className="variable-models-container">
                            {product.models.map((model, modelIndex) => (
                              <div key={modelIndex} className="model-section">
                                <h4 className="section-title">
                                  <FiType />
                                  {model.modelName} 
                                  <span className="model-sku"> ({model.SKU})</span>
                                </h4>
                                <div className="model-colors">
                                  {model.colors && model.colors.length > 0 ? (
                                    <div className="colors-grid">
                                      {model.colors.map(color => {
                                        const hasOffer = color.hasOffer;
                                        const isActive = hasOffer && color.offer?.isCurrentlyValid;

                                        return (
                                          <div key={color.colorId} className="color-card">
                                            <div className="color-card-header">
                                              <div className="color-info">
                                                <div className="color-name-row">
                                                  <span className="color-name">{color.colorName}</span>
                                                  {hasOffer && (
                                                    <span className={`color-offer-status ${isActive ? 'active' : 'inactive'}`}>
                                                      {isActive ? (
                                                        <>
                                                          <FiCheck className="status-icon" />
                                                          Active
                                                        </>
                                                      ) : (
                                                        <>
                                                          <FiAlertCircle className="status-icon" />
                                                          Inactive
                                                        </>
                                                      )}
                                                    </span>
                                                  )}
                                                </div>
                                                <div className="color-pricing">
                                                  {hasOffer && color.offerPrice ? (
                                                    <div className="offer-pricing">
                                                      <span className="original-price">
                                                        ₹{color.originalPriceDisplay?.toFixed(2) || color.currentPrice?.toFixed(2)}
                                                      </span>
                                                      <span className="current-price">
                                                        ₹{color.offerPrice.toFixed(2)}
                                                      </span>
                                                      <span className="discount-badge">
                                                        {color.offer.offerPercentage}% OFF
                                                      </span>
                                                    </div>
                                                  ) : (
                                                    <span className="regular-price">
                                                      ₹{color.currentPrice?.toFixed(2) || "0.00"}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="color-actions">
                                                <button
                                                  className={`offer-action-btn ${hasOffer ? 'edit' : 'add'}`}
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
                                                    className="remove-offer-btn"
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleRemoveColorOffer(
                                                        product.productId,
                                                        color.colorId,
                                                        color.offer.offerId,
                                                        model._id || model.modelId || ""
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
                                              <div className="offer-details">
                                                <div className="offer-details-grid">
                                                  <div className="offer-detail-item">
                                                    <span className="offer-label">Label:</span>
                                                    <span>{color.offer.offerLabel}</span>
                                                  </div>
                                                  <div className="offer-detail-item">
                                                    <span className="offer-label">Model:</span>
                                                    <span>{color.offer.modelName}</span>
                                                  </div>
                                                  <div className="offer-detail-item">
                                                    <span className="offer-label">Start Date:</span>
                                                    <span>{formatDate(color.offer.startDate)}</span>
                                                  </div>
                                                  <div className="offer-detail-item">
                                                    <span className="offer-label">End Date:</span>
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
                                    <p className="no-colors-text">No colors available for this model</p>
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
          <div className="offers-modal-overlay">
            <div className="modal-backdrop" onClick={() => setShowAddOffer(false)}></div>
            <div className="offers-modal-content">
              <div className="modal-header-section">
                <div className="modal-title-section">
                  <FiTag />
                  <h2>
                    {selectedColor.hasOffer ? 'Edit Offer' : 'Add Offer'}
                  </h2>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={() => setShowAddOffer(false)}
                  disabled={loading}
                >
                  <FiX />
                </button>
              </div>

              <div className="modal-body-section">
                {/* Product & Color Info */}
                <div className="modal-section-item">
                  <h3 className="section-title-item">
                    <FiPackage />
                    Product & Color Details
                  </h3>
                  <div className="product-info-grid-section">
                    <div className="info-item-section">
                      <span className="info-label-section">Product Name</span>
                      <span className="info-value-section">{selectedProduct.productName}</span>
                    </div>
                    {/* <div className="info-item-section">
                      <span className="info-label-section">Color Name</span>
                      <span className="info-value-section color-name-value">{selectedColor.colorName}</span>
                    </div> */}
                    {/* <div className="info-item-section">
                      <span className="info-label-section">Model</span>
                      <span className="info-value-section">{selectedColor.modelName || selectedProduct.modelName || "Default"}</span>
                    </div> */}
                    <div className="info-item-section">
                      <span className="info-label-section">Current Price</span>
                      <span className="info-value-section">
                        ₹{selectedColor.currentPrice?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Offer Form */}
                <div className="modal-section-item">
                  <h3 className="section-title-item">
                    <FiPercent />
                    Offer Details
                  </h3>
                  <div className="form-section">
                    <div className="form-group-section">
                      <label>Discount Percentage *</label>
                      <div className="percentage-input-section">
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
                          className="form-input-section"
                        />
                        <span className="percent-symbol-section">%</span>
                      </div>
                      <small className="input-hint">Enter discount percentage (0-100)</small>
                    </div>

                    <div className="form-group-section">
                      <label>Offer Label</label>
                      <input
                        type="text"
                        name="offerLabel"
                        value={offerForm.offerLabel}
                        onChange={handleFormChange}
                        placeholder="e.g., Summer Sale, Clearance, etc."
                        disabled={loading}
                        className="form-input-section"
                      />
                    </div>

                    <div className="form-group-section">
                      <label>Start Date</label>
                      <input
                        type="date"
                        name="startDate"
                        value={offerForm.startDate}
                        onChange={handleFormChange}
                        disabled={loading}
                        className="form-input-section"
                      />
                    </div>

                    <div className="form-group-section">
                      <label className="checkbox-label-section">
                        <input
                          type="checkbox"
                          name="hasEndDate"
                          checked={offerForm.hasEndDate}
                          onChange={handleFormChange}
                          disabled={loading}
                        />
                        Set End Date
                        <span className="checkbox-hint">(Leave unchecked for ongoing offer)</span>
                      </label>
                    </div>

                    {offerForm.hasEndDate && (
                      <div className="form-group-section">
                        <label>End Date</label>
                        <input
                          type="date"
                          name="endDate"
                          value={offerForm.endDate}
                          onChange={handleFormChange}
                          min={offerForm.startDate}
                          disabled={loading}
                          className="form-input-section"
                        />
                        <small className="input-hint">Leave blank if no end date</small>
                      </div>
                    )}

                    {/* Price Preview */}
                    {selectedColor.currentPrice && offerForm.offerPercentage && (
                      <div className="price-preview-section">
                        <div className="preview-row-section">
                          <span>Original Price:</span>
                          <span>₹{selectedColor.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="preview-row-section">
                          <span>Discount ({offerForm.offerPercentage}%):</span>
                          <span className="discount-preview">
                            -₹{(selectedColor.currentPrice * (parseFloat(offerForm.offerPercentage) / 100)).toFixed(2)}
                          </span>
                        </div>
                        <div className="preview-row-section total-section">
                          <span>Offer Price:</span>
                          <strong className="final-price">
                            ₹{(selectedColor.currentPrice - (selectedColor.currentPrice * (parseFloat(offerForm.offerPercentage) / 100))).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer-section">
                <button
                  className="btn-secondary-section"
                  onClick={() => setShowAddOffer(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary-section"
                  onClick={handleAddColorOffer}
                  disabled={loading || !offerForm.offerPercentage}
                >
                  {loading ? (
                    <>
                      <FiRefreshCw className="spinning" />
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
      </div>
    </AdminLayout>
  );
};

export default ProductOffers;