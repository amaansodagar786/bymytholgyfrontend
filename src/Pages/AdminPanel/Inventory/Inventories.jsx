import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Inventories.scss";
import {
  FiPackage,
  FiSearch,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiEye,
  FiFileText,
  FiTrendingUp,
  FiTrendingDown,
  FiCheck,
  FiAlertCircle,
  FiClock,
  FiEdit,
  FiSave,
  FiDownload
} from "react-icons/fi";
import {
  MdOutlineInventory2,
  MdOutlineWarning,
  MdOutlineCancel
} from "react-icons/md";

const Inventories = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showSetStock, setShowSetStock] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [stockForm, setStockForm] = useState({
    quantity: "",
    reason: "Stock added manually"
  });

  const [stockAdjustmentForm, setStockAdjustmentForm] = useState({
    stock: "",
    reason: "Stock adjusted manually"
  });

  const [stockHistory, setStockHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Fetch inventory
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/all`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInventory(res.data);
      setCurrentPage(1);
      toast.success("✅ Inventory refreshed successfully!");
    } catch (err) {
      console.error("❌ Error fetching inventory:", err);
      toast.error(err.response?.data?.error || "Failed to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  // Open add stock modal
  const openAddStock = (item) => {
    setSelectedItem(item);
    setStockForm({
      quantity: "",
      reason: "Stock added manually"
    });
    setShowAddStock(true);
  };

  // Open set stock modal
  const openSetStock = (item) => {
    setSelectedItem(item);
    setStockAdjustmentForm({
      stock: item.stock.toString(),
      reason: "Stock adjusted manually"
    });
    setShowSetStock(true);
  };

  // Open stock history modal
  const openStockHistory = async (item) => {
    try {
      setSelectedItem(item);
      const token = localStorage.getItem("adminToken");
      const res = await axios.get(
        `${import.meta.env.VITE_API_URL}/inventory/stock-history/${item._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStockHistory(res.data.history);
      setShowHistory(true);
    } catch (err) {
      console.error("❌ Error fetching stock history:", err);
      toast.error("Failed to load stock history");
    }
  };

  // Handle add stock form changes
  const handleStockFormChange = (e) => {
    const { name, value } = e.target;
    setStockForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle set stock form changes
  const handleSetStockFormChange = (e) => {
    const { name, value } = e.target;
    setStockAdjustmentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add stock to item
  const handleAddStock = async () => {
    try {
      if (!selectedItem) return;

      const quantity = parseFloat(stockForm.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.warning("⚠️ Please enter a valid positive quantity");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/add-stock/${selectedItem._id}`,
        stockForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`✅ Added ${quantity} stock to ${selectedItem.fragrance} fragrance`);
      setShowAddStock(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      console.error("❌ Error adding stock:", err);
      toast.error(err.response?.data?.error || "Failed to add stock");
    }
  };

  // Set stock to specific value
  const handleSetStock = async () => {
    try {
      if (!selectedItem) return;

      const stock = parseFloat(stockAdjustmentForm.stock);
      if (isNaN(stock) || stock < 0) {
        toast.warning("⚠️ Please enter a valid stock value (0 or positive)");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/set-stock/${selectedItem._id}`,
        stockAdjustmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`✅ Stock set to ${stock} for ${selectedItem.fragrance} fragrance`);
      setShowSetStock(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      console.error("❌ Error setting stock:", err);
      toast.error(err.response?.data?.error || "Failed to set stock");
    }
  };

  // Update threshold
  const handleUpdateThreshold = async (item, newThreshold) => {
    try {
      const threshold = parseFloat(newThreshold);
      if (isNaN(threshold) || threshold < 0) {
        toast.warning("⚠️ Please enter a valid threshold value");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/update-threshold/${item._id}`,
        { threshold },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setInventory(prev => prev.map(i =>
        i._id === item._id ? { ...i, threshold } : i
      ));

      toast.success("✅ Threshold updated successfully!");
    } catch (err) {
      console.error("❌ Error updating threshold:", err);
      toast.error(err.response?.data?.error || "Failed to update threshold");
    }
  };

  // Filter inventory with debounced search
  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      // Apply search filter
      if (debouncedSearch) {
        const matchesSearch = 
          item.productName?.toLowerCase().includes(debouncedSearch) ||
          item.fragrance?.toLowerCase().includes(debouncedSearch);
        
        if (!matchesSearch) return false;
      }

      // Apply stock status filter
      const threshold = item.threshold || 10;
      
      switch (filterType) {
        case "low":
          return item.stock > 0 && item.stock < threshold;
        case "out":
          return item.stock === 0;
        case "in":
          return item.stock >= threshold;
        case "all":
        default:
          return true;
      }
    });
  }, [debouncedSearch, inventory, filterType]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInventory.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredInventory.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Get stock status configuration
  const getStockStatus = (stock, threshold) => {
    if (stock === 0) return {
      class: "out-of-stock",
      text: "Out of Stock",
      icon: <MdOutlineCancel className="status-icon" />,
      color: "#e74c3c",
      bgColor: "#fdedec"
    };
    if (stock < threshold) return {
      class: "low-stock",
      text: "Low Stock",
      icon: <MdOutlineWarning className="status-icon" />,
      color: "#f39c12",
      bgColor: "#fef5e6"
    };
    return {
      class: "in-stock",
      text: "In Stock",
      icon: <FiCheck className="status-icon" />,
      color: "#2ecc71",
      bgColor: "#e8f8ef"
    };
  };

  // Format date for history
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get type badge for history
  const getTypeBadge = (type) => {
    const types = {
      "added": { label: "Added", color: "#2ecc71", bgColor: "#e8f8ef" },
      "deducted": { label: "Deducted", color: "#e74c3c", bgColor: "#fdedec" },
      "adjusted": { label: "Adjusted", color: "#3498db", bgColor: "#e8f4fc" },
      "initial": { label: "Initial", color: "#9b59b6", bgColor: "#f4ecf7" },
      "sold": { label: "Sold", color: "#e67e22", bgColor: "#fef5e6" },
      "returned": { label: "Returned", color: "#1abc9c", bgColor: "#e8f8f6" }
    };
    return types[type] || { label: type, color: "#666", bgColor: "#f8f9fa" };
  };

  // Get stock statistics
  const getStats = () => {
    let totalStock = 0;
    let outOfStock = 0;
    let lowStock = 0;
    let inStock = 0;
    let totalItems = filteredInventory.length;

    filteredInventory.forEach(item => {
      const threshold = item.threshold || 10;
      totalStock += item.stock;
      
      if (item.stock === 0) outOfStock++;
      else if (item.stock < threshold) lowStock++;
      else inStock++;
    });

    return { totalStock, outOfStock, lowStock, inStock, totalItems };
  };

  const stats = getStats();

  // Export to CSV
  const exportToCSV = () => {
    if (filteredInventory.length === 0) {
      toast.warning("⚠️ No inventory to export");
      return;
    }

    const headers = ["Product Name", "Fragrance", "Stock", "Threshold", "Status"];
    const csvData = filteredInventory.map(item => {
      const status = getStockStatus(item.stock, item.threshold || 10);
      return [
        `"${item.productName}"`,
        `"${item.fragrance}"`,
        item.stock,
        item.threshold || 10,
        status.text
      ];
    });

    const csvContent = [
      headers.join(","),
      ...csvData.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("✅ Inventory exported successfully!");
  };

  return (
    <div className="inventories-container">
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
      <header className="inventories-header">
        <div className="header-content">
          <div className="header-title">
            <MdOutlineInventory2 className="header-icon" />
            <h1>Inventory Management</h1>
            <span className="inventory-badge">{stats.totalItems || 0}</span>
          </div>

          <div className="header-actions">
            <button
              className="refresh-inventory-btn"
              onClick={fetchInventory}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "spinning" : ""} />
              Refresh
            </button>
            <button
              className="export-inventory-btn"
              onClick={exportToCSV}
              disabled={loading || filteredInventory.length === 0}
            >
              <FiDownload />
              Export
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="inventory-stats-grid">
        <div className="inventory-stat-card">
          <div className="stat-icon-card total-items">
            <FiPackage />
          </div>
          <div className="stat-card-content">
            <h3>{stats.totalItems || 0}</h3>
            <p>Total Items</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon-card in-stock">
            <FiCheck />
          </div>
          <div className="stat-card-content">
            <h3>{stats.inStock || 0}</h3>
            <p>In Stock</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon-card low-stock">
            <MdOutlineWarning />
          </div>
          <div className="stat-card-content">
            <h3>{stats.lowStock || 0}</h3>
            <p>Low Stock</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon-card out-stock">
            <MdOutlineCancel />
          </div>
          <div className="stat-card-content">
            <h3>{stats.outOfStock || 0}</h3>
            <p>Out of Stock</p>
          </div>
        </div>

        <div className="inventory-stat-card">
          <div className="stat-icon-card total-stock">
            <MdOutlineInventory2 />
          </div>
          <div className="stat-card-content">
            <h3>{stats.totalStock || 0}</h3>
            <p>Total Stock</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="inventory-filters-section">
        <div className="inventory-search-container">
          <div className="inventory-search-box">
            <FiSearch className="inventory-search-icon" />
            <input
              type="text"
              placeholder="Search by Product Name or Fragrance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
              className="inventory-search-input"
            />
          </div>
        </div>

        <div className="inventory-status-filters">
          <button
            className={`inventory-filter-btn ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            All Items
          </button>
          <button
            className={`inventory-filter-btn ${filterType === "in" ? "active" : ""}`}
            onClick={() => setFilterType("in")}
            style={{ color: filterType === "in" ? 'white' : '#2ecc71' }}
          >
            <FiCheck className="filter-icon" />
            In Stock
          </button>
          <button
            className={`inventory-filter-btn ${filterType === "low" ? "active" : ""}`}
            onClick={() => setFilterType("low")}
            style={{ color: filterType === "low" ? 'white' : '#f39c12' }}
          >
            <MdOutlineWarning className="filter-icon" />
            Low Stock
          </button>
          <button
            className={`inventory-filter-btn ${filterType === "out" ? "active" : ""}`}
            onClick={() => setFilterType("out")}
            style={{ color: filterType === "out" ? 'white' : '#e74c3c' }}
          >
            <MdOutlineCancel className="filter-icon" />
            Out of Stock
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && filteredInventory.length === 0 && (
        <div className="inventory-loading-overlay">
          <div className="inventory-loading-spinner"></div>
          <p>Loading inventory...</p>
        </div>
      )}

      {/* Inventory Table */}
      <div className="inventory-table-wrapper">
        <div className="inventory-table-responsive">
          <table className="admin-inventory-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Fragrance</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan="6" className="inventory-no-data">
                    <div className="inventory-empty-state">
                      <MdOutlineInventory2 />
                      <p>No inventory items found</p>
                      {searchTerm && (
                        <button 
                          className="clear-search-btn"
                          onClick={() => setSearchTerm("")}
                        >
                          Clear search
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => {
                  const stockStatus = getStockStatus(item.stock, item.threshold || 10);

                  return (
                    <tr key={item._id}>
                      <td>
                        <div className="product-info-cell">
                          {item.productImage ? (
                            <img
                              src={item.productImage}
                              alt={item.productName}
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
                          <div className="product-details-cell">
                            <div className="product-name-cell">
                              {item.productName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="fragrance-info-cell">
                          <div className="fragrance-name-cell">
                            {item.fragrance}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="stock-info-cell">
                          <div className="stock-value-cell">
                            <span className="stock-number">{item.stock}</span>
                            <div className="stock-actions-cell">
                              <button
                                className="add-stock-action-btn"
                                onClick={() => openAddStock(item)}
                                title="Add Stock"
                              >
                                <FiPlus />
                                Add
                              </button>
                              <button
                                className="set-stock-action-btn"
                                onClick={() => openSetStock(item)}
                                title="Set Stock"
                              >
                                <FiEdit />
                                Set
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="threshold-cell">
                          <input
                            type="number"
                            min="0"
                            value={item.threshold || 10}
                            onChange={(e) => handleUpdateThreshold(item, e.target.value)}
                            className="threshold-input-field"
                            disabled={loading}
                          />
                        </div>
                      </td>

                      <td>
                        <div
                          className="inventory-status-badge"
                          style={{
                            backgroundColor: stockStatus.bgColor,
                            color: stockStatus.color,
                            borderColor: stockStatus.color
                          }}
                        >
                          {stockStatus.icon}
                          <span>{stockStatus.text}</span>
                        </div>
                      </td>

                      <td>
                        <div className="inventory-action-buttons">
                          <button
                            className="view-history-btn"
                            onClick={() => openStockHistory(item)}
                            title="View Stock History"
                          >
                            <FiClock className="action-icon-display" />
                            <span className="action-text-display">History</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="inventory-pagination">
            <button
              className="inventory-page-btn prev"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1 || loading}
            >
              ← Previous
            </button>

            <div className="inventory-page-info">
              Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Showing {Math.min(currentItems.length, itemsPerPage)} of {filteredInventory.length} items
              </div>
            </div>

            <button
              className="inventory-page-btn next"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Add Stock Modal */}
      {showAddStock && selectedItem && (
        <div className="inventory-modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowAddStock(false)}></div>
          <div className="inventory-modal-content">
            <div className="modal-header-section">
              <div className="modal-title-section">
                <FiPlus />
                <h2>Add Stock</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowAddStock(false)}
                disabled={loading}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-section">
              {/* Product Info */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiPackage />
                  Product Details
                </h3>
                <div className="product-info-grid-section">
                  <div className="info-item-section">
                    <span className="info-label-section">Product Name</span>
                    <span className="info-value-section">{selectedItem.productName}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Fragrance</span>
                    <span className="info-value-section">{selectedItem.fragrance}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Current Stock</span>
                    <span className="info-value-section">{selectedItem.stock}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Threshold</span>
                    <span className="info-value-section">{selectedItem.threshold || 10}</span>
                  </div>
                </div>
              </div>

              {/* Add Stock Form */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiTrendingUp />
                  Add Stock
                </h3>
                <div className="form-section">
                  <div className="form-group-section">
                    <label>Quantity to Add *</label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      step="1"
                      value={stockForm.quantity}
                      onChange={handleStockFormChange}
                      placeholder="Enter quantity"
                      autoFocus
                      disabled={loading}
                      className="form-input-section"
                    />
                  </div>

                  <div className="form-group-section">
                    <label>Reason</label>
                    <select
                      name="reason"
                      value={stockForm.reason}
                      onChange={handleStockFormChange}
                      disabled={loading}
                      className="form-select-section"
                    >
                      <option value="Stock added manually">Stock added manually</option>
                      <option value="New shipment received">New shipment received</option>
                      <option value="Stock adjustment">Stock adjustment</option>
                      <option value="Return from customer">Return from customer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Stock Preview */}
                  <div className="stock-preview-section">
                    <div className="preview-row-section">
                      <span>Current Stock:</span>
                      <span>{selectedItem.stock}</span>
                    </div>
                    <div className="preview-row-section">
                      <span>Adding:</span>
                      <span className="positive-change">
                        +{stockForm.quantity || 0}
                      </span>
                    </div>
                    <div className="preview-row-section total-section">
                      <span>New Stock:</span>
                      <strong className="new-stock-value">
                        {selectedItem.stock + (parseFloat(stockForm.quantity) || 0)}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-section">
              <button
                className="btn-secondary-section"
                onClick={() => setShowAddStock(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary-section"
                onClick={handleAddStock}
                disabled={loading || !stockForm.quantity}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="spinning" />
                    Adding...
                  </>
                ) : (
                  "Add Stock"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Stock Modal */}
      {showSetStock && selectedItem && (
        <div className="inventory-modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowSetStock(false)}></div>
          <div className="inventory-modal-content">
            <div className="modal-header-section">
              <div className="modal-title-section">
                <FiEdit />
                <h2>Set Stock</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowSetStock(false)}
                disabled={loading}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-section">
              {/* Product Info */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiPackage />
                  Product Details
                </h3>
                <div className="product-info-grid-section">
                  <div className="info-item-section">
                    <span className="info-label-section">Product Name</span>
                    <span className="info-value-section">{selectedItem.productName}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Fragrance</span>
                    <span className="info-value-section">{selectedItem.fragrance}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Current Stock</span>
                    <span className="info-value-section">{selectedItem.stock}</span>
                  </div>
                </div>
              </div>

              {/* Set Stock Form */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiSave />
                  Set Stock Value
                </h3>
                <div className="form-section">
                  <div className="form-group-section">
                    <label>Set Stock To *</label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      step="1"
                      value={stockAdjustmentForm.stock}
                      onChange={handleSetStockFormChange}
                      placeholder="Enter stock value"
                      autoFocus
                      disabled={loading}
                      className="form-input-section"
                    />
                  </div>

                  <div className="form-group-section">
                    <label>Reason</label>
                    <select
                      name="reason"
                      value={stockAdjustmentForm.reason}
                      onChange={handleSetStockFormChange}
                      disabled={loading}
                      className="form-select-section"
                    >
                      <option value="Stock adjusted manually">Stock adjusted manually</option>
                      <option value="Physical count correction">Physical count correction</option>
                      <option value="Damage/loss adjustment">Damage/loss adjustment</option>
                      <option value="System correction">System correction</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Stock Preview */}
                  <div className="stock-preview-section">
                    <div className="preview-row-section">
                      <span>Current Stock:</span>
                      <span>{selectedItem.stock}</span>
                    </div>
                    <div className="preview-row-section">
                      <span>Setting to:</span>
                      <span>{stockAdjustmentForm.stock || 0}</span>
                    </div>
                    <div className="preview-row-section total-section">
                      <span>Difference:</span>
                      <span className={
                        parseFloat(stockAdjustmentForm.stock || 0) >= selectedItem.stock 
                          ? "positive-change" 
                          : "negative-change"
                      }>
                        {(parseFloat(stockAdjustmentForm.stock || 0) - selectedItem.stock) >= 0 ? "+" : ""}
                        {(parseFloat(stockAdjustmentForm.stock || 0) - selectedItem.stock)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-section">
              <button
                className="btn-secondary-section"
                onClick={() => setShowSetStock(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn-primary-section"
                onClick={handleSetStock}
                disabled={loading || !stockAdjustmentForm.stock}
              >
                {loading ? (
                  <>
                    <FiRefreshCw className="spinning" />
                    Setting...
                  </>
                ) : (
                  "Set Stock"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock History Modal */}
      {showHistory && selectedItem && (
        <div className="inventory-modal-overlay">
          <div className="modal-backdrop" onClick={() => setShowHistory(false)}></div>
          <div className="inventory-modal-content large">
            <div className="modal-header-section">
              <div className="modal-title-section">
                <FiClock />
                <h2>Stock History</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setShowHistory(false)}
                disabled={loading}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-section">
              {/* Product Info */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiPackage />
                  Product Details
                </h3>
                <div className="product-info-grid-section">
                  <div className="info-item-section">
                    <span className="info-label-section">Product Name</span>
                    <span className="info-value-section">{selectedItem.productName}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Fragrance</span>
                    <span className="info-value-section">{selectedItem.fragrance}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Current Stock</span>
                    <span className="info-value-section">{selectedItem.stock}</span>
                  </div>
                </div>
              </div>

              {/* History Table */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiFileText />
                  Stock Changes History
                </h3>
                <div className="history-table-container-section">
                  {stockHistory.length === 0 ? (
                    <div className="empty-history-section">
                      <p>No stock history available</p>
                    </div>
                  ) : (
                    <table className="history-table-section">
                      <thead>
                        <tr>
                          <th>Date & Time</th>
                          <th>Type</th>
                          <th>Quantity</th>
                          <th>Previous</th>
                          <th>New</th>
                          <th>Difference</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stockHistory.map((history, index) => {
                          const typeBadge = getTypeBadge(history.type);
                          const difference = history.newStock - history.previousStock;

                          return (
                            <tr key={history.historyId || index}>
                              <td className="date-cell-section">
                                {formatDate(history.date)}
                              </td>
                              <td className="type-cell-section">
                                <span
                                  className="type-badge-section"
                                  style={{
                                    backgroundColor: typeBadge.bgColor,
                                    color: typeBadge.color,
                                    borderColor: typeBadge.color
                                  }}
                                >
                                  {typeBadge.label}
                                </span>
                              </td>
                              <td className="quantity-cell-section">
                                {history.quantity}
                              </td>
                              <td className="previous-cell-section">
                                {history.previousStock}
                              </td>
                              <td className="new-cell-section">
                                <strong>{history.newStock}</strong>
                              </td>
                              <td className="difference-cell-section">
                                <span className={difference >= 0 ? "positive-change" : "negative-change"}>
                                  {difference >= 0 ? "+" : ""}{difference}
                                </span>
                              </td>
                              <td className="reason-cell-section">
                                {history.reason}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer-section">
              <button
                className="btn-secondary-section"
                onClick={() => setShowHistory(false)}
                disabled={loading}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventories;