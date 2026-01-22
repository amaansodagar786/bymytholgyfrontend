import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Inventories.scss";
import { FaSearch, FaFileExcel, FaRedoAlt, FaPlus, FaTimes, FaHistory } from "react-icons/fa";

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
      toast.success("Inventory refreshed successfully!");
    } catch (err) {
      console.error("Error fetching inventory:", err);
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
      console.error("Error fetching stock history:", err);
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
        toast.warning("Please enter a valid positive quantity");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/add-stock/${selectedItem._id}`,
        stockForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Added ${quantity} stock to ${selectedItem.fragrance} fragrance`);
      setShowAddStock(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      console.error("Error adding stock:", err);
      toast.error(err.response?.data?.error || "Failed to add stock");
    }
  };

  // Set stock to specific value
  const handleSetStock = async () => {
    try {
      if (!selectedItem) return;

      const stock = parseFloat(stockAdjustmentForm.stock);
      if (isNaN(stock) || stock < 0) {
        toast.warning("Please enter a valid stock value (0 or positive)");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/set-stock/${selectedItem._id}`,
        stockAdjustmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(`Stock set to ${stock} for ${selectedItem.fragrance} fragrance`);
      setShowSetStock(false);
      setSelectedItem(null);
      fetchInventory();
    } catch (err) {
      console.error("Error setting stock:", err);
      toast.error(err.response?.data?.error || "Failed to set stock");
    }
  };

  // Update threshold
  const handleUpdateThreshold = async (item, newThreshold) => {
    try {
      const threshold = parseFloat(newThreshold);
      if (isNaN(threshold) || threshold < 0) {
        toast.warning("Please enter a valid threshold value");
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

      toast.success("Threshold updated successfully!");
    } catch (err) {
      console.error("Error updating threshold:", err);
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

  // Get stock status
  const getStockStatus = (stock, threshold) => {
    if (stock === 0) return { class: "out-of-stock", text: "Out of Stock", icon: "❌" };
    if (stock < threshold) return { class: "low-stock", text: "Low Stock", icon: "⚠️" };
    return { class: "in-stock", text: "In Stock", icon: "✅" };
  };

  // Format date for history
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get type badge for history
  const getTypeBadge = (type) => {
    const types = {
      "added": { label: "Added", class: "added" },
      "deducted": { label: "Deducted", class: "deducted" },
      "adjusted": { label: "Adjusted", class: "adjusted" },
      "initial": { label: "Initial", class: "initial" },
      "sold": { label: "Sold", class: "sold" },
      "returned": { label: "Returned", class: "returned" }
    };
    return types[type] || { label: type, class: "default" };
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
      toast.warning("No inventory to export");
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
    toast.success("Inventory exported successfully!");
  };

  return (
    <div className="inventories">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* HEADER */}
      <div className="page-header">
        <h2>Inventory Management ({filteredInventory.length})</h2>
        <div className="right-section">
          <div className="search-container mobile-left">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by product or fragrance..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="action-buttons-group">
            <button className="export-all-btn" onClick={exportToCSV} disabled={loading}>
              <FaFileExcel /> Export
            </button>
            <button className="add-btn" onClick={fetchInventory} disabled={loading}>
              <FaRedoAlt /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* STATS CARDS - Hide on mobile */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalItems}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value in-stock-value">{stats.inStock}</div>
          <div className="stat-label">In Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value low-stock-value">{stats.lowStock}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value out-stock-value">{stats.outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value total-stock-value">{stats.totalStock}</div>
          <div className="stat-label">Total Stock</div>
        </div>
      </div>

      {/* FILTER BUTTONS - Updated filters */}
      <div className="filter-buttons-group">
        <button
          className={`filter-btn ${filterType === "all" ? "active" : ""}`}
          onClick={() => setFilterType("all")}
        >
          All Items
        </button>
        <button
          className={`filter-btn in-stock-btn ${filterType === "in" ? "active" : ""}`}
          onClick={() => setFilterType("in")}
        >
          ✅ In Stock
        </button>
        <button
          className={`filter-btn low-stock-btn ${filterType === "low" ? "active" : ""}`}
          onClick={() => setFilterType("low")}
        >
          ⚠️ Low Stock
        </button>
        <button
          className={`filter-btn out-stock-btn ${filterType === "out" ? "active" : ""}`}
          onClick={() => setFilterType("out")}
        >
          ❌ Out of Stock
        </button>
      </div>

      {/* INVENTORY TABLE */}
      <div className="data-table">
        {loading && filteredInventory.length === 0 ? (
          <div className="loading-container">
            <div className="loading-spinner large"></div>
            <p>Loading inventory...</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="no-products">
            <p>No inventory items found</p>
            {searchTerm && (
              <button className="clear-search-btn" onClick={() => setSearchTerm("")}>
                Clear search
              </button>
            )}
          </div>
        ) : (
          <table>
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
              {currentItems.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.threshold || 10);

                return (
                  <tr key={item._id}>
                    <td>
                      <div className="product-cell">
                        {item.productImage ? (
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="thumbnail"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "https://via.placeholder.com/50x50?text=No+Image";
                            }}
                          />
                        ) : (
                          <div className="no-image">No Image</div>
                        )}
                        <div className="product-info">
                          <div className="product-name">{item.productName}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="fragrance-info">
                        <div className="fragrance-name">{item.fragrance}</div>
                      </div>
                    </td>
                    <td>
                      <div className="stock-display">
                        <span className="stock-value">{item.stock}</span>
                        <div className="stock-actions">
                          <button
                            className="add-stock-btn"
                            onClick={() => openAddStock(item)}
                            title="Add Stock"
                          >
                            + Add
                          </button>
                          <button
                            className="set-stock-btn"
                            onClick={() => openSetStock(item)}
                            title="Set Stock"
                          >
                            Set
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={item.threshold || 10}
                        onChange={(e) => handleUpdateThreshold(item, e.target.value)}
                        className="threshold-input"
                      />
                    </td>
                    <td>
                      <span className={`status ${stockStatus.class}`}>
                        {stockStatus.icon} {stockStatus.text}
                      </span>
                    </td>
                    <td className="actions">
                      <button
                        className="history-btn"
                        onClick={() => openStockHistory(item)}
                        title="View Stock History"
                      >
                        <FaHistory />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
          >
            ← Previous
          </button>
          
          <div className="page-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (page === 1 || page === totalPages) return true;
                if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                return false;
              })
              .map((page, index, array) => {
                const prevPage = array[index - 1];
                if (prevPage && page - prevPage > 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="ellipsis">...</span>
                      <button
                        className={`page-btn ${page === currentPage ? 'active' : ''}`}
                        onClick={() => paginate(page)}
                      >
                        {page}
                      </button>
                    </React.Fragment>
                  );
                }
                return (
                  <button
                    key={page}
                    className={`page-btn ${page === currentPage ? 'active' : ''}`}
                    onClick={() => paginate(page)}
                  >
                    {page}
                  </button>
                );
              })}
          </div>

          <button
            className="pagination-btn"
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next →
          </button>
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {showAddStock && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowAddStock(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add Stock</h3>
              <button className="modal-close" onClick={() => setShowAddStock(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="product-info-summary">
                <div className="product-name">{selectedItem.productName}</div>
                <div className="product-details">
                  <span className="fragrance">{selectedItem.fragrance}</span>
                  <span className="stock">Current: {selectedItem.stock}</span>
                </div>
              </div>

              <div className="form-group">
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
                />
              </div>

              <div className="form-group">
                <label>Reason</label>
                <select
                  name="reason"
                  value={stockForm.reason}
                  onChange={handleStockFormChange}
                >
                  <option value="Stock added manually">Stock added manually</option>
                  <option value="New shipment received">New shipment received</option>
                  <option value="Stock adjustment">Stock adjustment</option>
                  <option value="Return from customer">Return from customer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="stock-preview">
                <div className="preview-row">
                  <span>Current Stock:</span>
                  <span>{selectedItem.stock}</span>
                </div>
                <div className="preview-row">
                  <span>Adding:</span>
                  <span className="positive">+{stockForm.quantity || 0}</span>
                </div>
                <div className="preview-row total">
                  <span>New Stock:</span>
                  <strong>{selectedItem.stock + (parseFloat(stockForm.quantity) || 0)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddStock(false)} disabled={loading}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddStock} disabled={loading}>
                {loading ? "Adding..." : "Add Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET STOCK MODAL */}
      {showSetStock && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowSetStock(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Set Stock</h3>
              <button className="modal-close" onClick={() => setShowSetStock(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="product-info-summary">
                <div className="product-name">{selectedItem.productName}</div>
                <div className="product-details">
                  <span className="fragrance">{selectedItem.fragrance}</span>
                  <span className="stock">Current: {selectedItem.stock}</span>
                </div>
              </div>

              <div className="form-group">
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
                />
              </div>

              <div className="form-group">
                <label>Reason</label>
                <select
                  name="reason"
                  value={stockAdjustmentForm.reason}
                  onChange={handleSetStockFormChange}
                >
                  <option value="Stock adjusted manually">Stock adjusted manually</option>
                  <option value="Physical count correction">Physical count correction</option>
                  <option value="Damage/loss adjustment">Damage/loss adjustment</option>
                  <option value="System correction">System correction</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="stock-preview">
                <div className="preview-row">
                  <span>Current Stock:</span>
                  <span>{selectedItem.stock}</span>
                </div>
                <div className="preview-row">
                  <span>Setting to:</span>
                  <span>{stockAdjustmentForm.stock || 0}</span>
                </div>
                <div className="preview-row total">
                  <span>Difference:</span>
                  <span className={parseFloat(stockAdjustmentForm.stock || 0) >= selectedItem.stock ? "positive" : "negative"}>
                    {parseFloat(stockAdjustmentForm.stock || 0) >= selectedItem.stock ? "+" : ""}
                    {(parseFloat(stockAdjustmentForm.stock || 0) - selectedItem.stock)}
                  </span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSetStock(false)} disabled={loading}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSetStock} disabled={loading}>
                {loading ? "Setting..." : "Set Stock"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK HISTORY MODAL */}
      {showHistory && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowHistory(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Stock History</h3>
              <button className="modal-close" onClick={() => setShowHistory(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="product-info-summary">
                <div className="product-name">{selectedItem.productName}</div>
                <div className="product-details">
                  <span className="fragrance">{selectedItem.fragrance}</span>
                  <span className="stock">Current Stock: {selectedItem.stock}</span>
                </div>
              </div>

              {stockHistory.length === 0 ? (
                <div className="no-history">
                  <p>No stock history available</p>
                </div>
              ) : (
                <div className="history-table-container">
                  <table className="history-table">
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
                            <td className="date-cell">
                              {formatDate(history.date)}
                            </td>
                            <td className="type-cell">
                              <span className={`type-badge ${typeBadge.class}`}>
                                {typeBadge.label}
                              </span>
                            </td>
                            <td className="quantity-cell">
                              {history.quantity}
                            </td>
                            <td className="previous-cell">
                              {history.previousStock}
                            </td>
                            <td className="new-cell">
                              <strong>{history.newStock}</strong>
                            </td>
                            <td className="difference-cell">
                              <span className={difference >= 0 ? "positive" : "negative"}>
                                {difference >= 0 ? "+" : ""}{difference}
                              </span>
                            </td>
                            <td className="reason-cell">
                              {history.reason}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-btn" onClick={() => setShowHistory(false)} disabled={loading}>
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