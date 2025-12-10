import React, { useEffect, useState } from "react";
import axios from "axios";
import "./ProductOffers.scss";

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

  // Fetch products with color offers
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/productoffers/products-with-color-offers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setProducts(res.data);
      setExpandedProduct(null); // Reset expanded state
    } catch (err) {
      console.error("Error fetching products:", err);
      alert("Failed to load products");
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

  // Open add offer form for a color
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

  // Add/Update offer for a color
  const handleAddColorOffer = async () => {
    try {
      if (!selectedProduct || !selectedColor) return;

      // Validate offer percentage
      const percentage = parseFloat(offerForm.offerPercentage);
      if (isNaN(percentage) || percentage < 0 || percentage > 100) {
        alert("Please enter a valid offer percentage between 0 and 100");
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
      await axios.post(
        `${import.meta.env.VITE_API_URL}/productoffers/add-color-offer`,
        offerData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Color offer saved successfully!");
      setShowAddOffer(false);
      setSelectedColor(null);
      setSelectedProduct(null);
      fetchProducts(); // Refresh list
    } catch (err) {
      console.error("Error saving color offer:", err);
      alert(err.response?.data?.error || "Failed to save offer");
    }
  };

  // Remove offer from a color
  const handleRemoveColorOffer = async (productId, colorId, offerId, variableModelId = "") => {
    if (!confirm("Are you sure you want to remove this color offer?")) return;

    try {
      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/productoffers/deactivate-color-offer/${offerId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Color offer removed successfully!");
      fetchProducts(); // Refresh list
    } catch (err) {
      console.error("Error removing color offer:", err);
      alert(err.response?.data?.error || "Failed to remove offer");
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "No end date";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
    <div className="product-offers">
      {/* HEADER */}
      <div className="header">
        <h2>Color-Level Offers Management</h2>
        <p className="subtitle">Manage discounts and special offers for specific colors</p>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{products.length}</div>
          <div className="stat-label">Total Products</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{colorStats.totalColors}</div>
          <div className="stat-label">Total Colors</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{colorStats.colorsWithOffers}</div>
          <div className="stat-label">Colors with Offers</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{colorStats.activeOffers}</div>
          <div className="stat-label">Active Offers</div>
        </div>
      </div>

      {/* PRODUCTS LIST */}
      <div className="products-list">
        {loading ? (
          <div className="loading">Loading products with color offers...</div>
        ) : products.length === 0 ? (
          <div className="no-products">
            <p>No products found</p>
          </div>
        ) : (
          <div className="products-container">
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
                <div key={product.productId} className="product-card">
                  {/* PRODUCT HEADER */}
                  <div 
                    className="product-header"
                    onClick={() => toggleProductExpansion(product.productId)}
                  >
                    <div className="product-header-left">
                      <div className="product-image">
                        {product.thumbnailImage ? (
                          <img
                            src={product.thumbnailImage}
                            alt={product.productName}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/60x60?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                      </div>
                      <div className="product-info">
                        <h3 className="product-name">{product.productName}</h3>
                        <div className="product-meta">
                          <span className={`product-type ${product.type}`}>
                            {product.type.toUpperCase()} PRODUCT
                          </span>
                          <span className="product-category">
                            {product.categoryName || "Uncategorized"}
                          </span>
                          <span className="product-offers-count">
                            {productOffersCount} color offer(s)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="product-header-right">
                      <button className="expand-btn">
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>

                  {/* EXPANDED CONTENT - COLOR LIST */}
                  {isExpanded && (
                    <div className="product-colors">
                      {product.type === "simple" && product.colors ? (
                        <div className="simple-product-colors">
                          <h4>Color Variants ({product.colors.length})</h4>
                          <div className="colors-grid">
                            {product.colors.map(color => (
                              <div key={color.colorId} className="color-card">
                                <div className="color-header">
                                  <div className="color-info">
                                    <span className="color-name">{color.colorName}</span>
                                    <span className="color-price">
                                      {color.hasOffer && color.offerPrice ? (
                                        <>
                                          <span className="original-price">
                                            ₹{color.originalPriceDisplay?.toFixed(2) || color.currentPrice?.toFixed(2)}
                                          </span>
                                          <span className="offer-price">
                                            ₹{color.offerPrice.toFixed(2)}
                                          </span>
                                          <span className="discount-badge">
                                            {color.offer.offerPercentage}% OFF
                                          </span>
                                        </>
                                      ) : (
                                        <span className="regular-price">
                                          ₹{color.currentPrice?.toFixed(2) || "0.00"}
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                  <div className="color-actions">
                                    <button
                                      className={color.hasOffer ? "edit-offer-btn" : "add-offer-btn"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        openAddOffer(product, color, product.modelName || "Default");
                                      }}
                                    >
                                      {color.hasOffer ? "✏️ Edit" : "+ Add Offer"}
                                    </button>
                                    {color.hasOffer && color.offer && (
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
                                      >
                                        🗑️
                                      </button>
                                    )}
                                  </div>
                                </div>
                                
                                {color.hasOffer && color.offer && (
                                  <div className="offer-details">
                                    <div className="offer-row">
                                      <span className="offer-label">Label:</span>
                                      <span>{color.offer.offerLabel}</span>
                                    </div>
                                    <div className="offer-row">
                                      <span className="offer-label">Model:</span>
                                      <span>{color.offer.modelName}</span>
                                    </div>
                                    <div className="offer-row">
                                      <span className="offer-label">Start:</span>
                                      <span>{formatDate(color.offer.startDate)}</span>
                                    </div>
                                    <div className="offer-row">
                                      <span className="offer-label">End:</span>
                                      <span>{formatDate(color.offer.endDate)}</span>
                                    </div>
                                    <div className="offer-row">
                                      <span className="offer-label">Status:</span>
                                      <span className={`offer-status ${color.offer.isCurrentlyValid ? 'active' : 'inactive'}`}>
                                        {color.offer.isCurrentlyValid ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : product.type === "variable" && product.models ? (
                        <div className="variable-product-models">
                          {product.models.map((model, modelIndex) => (
                            <div key={modelIndex} className="model-section">
                              <h4>
                                {model.modelName} 
                                <span className="model-sku"> ({model.SKU})</span>
                              </h4>
                              <div className="model-colors">
                                {model.colors && model.colors.length > 0 ? (
                                  <div className="colors-grid">
                                    {model.colors.map(color => (
                                      <div key={color.colorId} className="color-card">
                                        <div className="color-header">
                                          <div className="color-info">
                                            <span className="color-name">{color.colorName}</span>
                                            <span className="color-price">
                                              {color.hasOffer && color.offerPrice ? (
                                                <>
                                                  <span className="original-price">
                                                    ₹{color.originalPriceDisplay?.toFixed(2) || color.currentPrice?.toFixed(2)}
                                                  </span>
                                                  <span className="offer-price">
                                                    ₹{color.offerPrice.toFixed(2)}
                                                  </span>
                                                  <span className="discount-badge">
                                                    {color.offer.offerPercentage}% OFF
                                                  </span>
                                                </>
                                              ) : (
                                                <span className="regular-price">
                                                  ₹{color.currentPrice?.toFixed(2) || "0.00"}
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="color-actions">
                                            <button
                                              className={color.hasOffer ? "edit-offer-btn" : "add-offer-btn"}
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
                                              {color.hasOffer ? "✏️ Edit" : "+ Add Offer"}
                                            </button>
                                            {color.hasOffer && color.offer && (
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
                                              >
                                                🗑️
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {color.hasOffer && color.offer && (
                                          <div className="offer-details">
                                            <div className="offer-row">
                                              <span className="offer-label">Label:</span>
                                              <span>{color.offer.offerLabel}</span>
                                            </div>
                                            <div className="offer-row">
                                              <span className="offer-label">Model:</span>
                                              <span>{color.offer.modelName}</span>
                                            </div>
                                            <div className="offer-row">
                                              <span className="offer-label">Start:</span>
                                              <span>{formatDate(color.offer.startDate)}</span>
                                            </div>
                                            <div className="offer-row">
                                              <span className="offer-label">End:</span>
                                              <span>{formatDate(color.offer.endDate)}</span>
                                            </div>
                                            <div className="offer-row">
                                              <span className="offer-label">Status:</span>
                                              <span className={`offer-status ${color.offer.isCurrentlyValid ? 'active' : 'inactive'}`}>
                                                {color.offer.isCurrentlyValid ? 'Active' : 'Inactive'}
                                              </span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="no-colors">No colors available for this model</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-colors">No colors available for this product</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD/EDIT OFFER MODAL */}
      {showAddOffer && selectedProduct && selectedColor && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>
                {selectedColor.hasOffer ? 'Edit Offer' : 'Add Offer'} - {selectedColor.colorName}
              </h3>
              <p className="modal-subtitle">
                {selectedProduct.productName} • {selectedColor.modelName}
              </p>
              <button className="close-btn" onClick={() => setShowAddOffer(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Offer Percentage *</label>
                <div className="percentage-input">
                  <input
                    type="number"
                    name="offerPercentage"
                    min="0"
                    max="100"
                    step="0.1"
                    value={offerForm.offerPercentage}
                    onChange={handleFormChange}
                    placeholder="e.g., 20"
                  />
                  <span className="percent-symbol">%</span>
                </div>
                <small>Enter discount percentage (0-100)</small>
              </div>

              <div className="form-group">
                <label>Offer Label</label>
                <input
                  type="text"
                  name="offerLabel"
                  value={offerForm.offerLabel}
                  onChange={handleFormChange}
                  placeholder="e.g., Summer Sale, Clearance, etc."
                />
              </div>

              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={offerForm.startDate}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="hasEndDate"
                    checked={offerForm.hasEndDate}
                    onChange={handleFormChange}
                  />
                  Set End Date (Leave unchecked for ongoing offer)
                </label>
              </div>

              {offerForm.hasEndDate && (
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={offerForm.endDate}
                    onChange={handleFormChange}
                    min={offerForm.startDate}
                  />
                  <small>Leave blank if no end date</small>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddOffer(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddColorOffer}>
                {selectedColor.hasOffer ? 'Update Offer' : 'Add Offer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductOffers;