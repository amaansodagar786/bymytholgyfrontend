import React, { useEffect, useState } from "react";
import axios from "axios";
import "./Inventories.scss";

const Inventories = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddStock, setShowAddStock] = useState(false);
  const [showSetStock, setShowSetStock] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fixed: Renamed setStockForm to stockAdjustmentForm
  const [stockForm, setStockForm] = useState({
    quantity: "",
    reason: "Stock added manually",
    notes: ""
  });

  const [stockAdjustmentForm, setStockAdjustmentForm] = useState({
    stock: "",
    reason: "Stock adjusted manually",
    notes: ""
  });

  const [stockHistory, setStockHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");

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
    } catch (err) {
      console.error("Error fetching inventory:", err);
      alert("Failed to load inventory");
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
      reason: "Stock added manually",
      notes: ""
    });
    setShowAddStock(true);
  };

  // Open set stock modal
  const openSetStock = (item) => {
    setSelectedItem(item);
    setStockAdjustmentForm({
      stock: item.stock.toString(),
      reason: "Stock adjusted manually",
      notes: ""
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
      alert("Failed to load stock history");
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

  // Handle set stock form changes - UPDATED
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
        alert("Please enter a valid positive quantity");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/add-stock/${selectedItem._id}`,
        stockForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Successfully added ${quantity} stock to ${selectedItem.colorName}`);
      setShowAddStock(false);
      setSelectedItem(null);
      fetchInventory(); // Refresh list
    } catch (err) {
      console.error("Error adding stock:", err);
      alert(err.response?.data?.error || "Failed to add stock");
    }
  };

  // Set stock to specific value - UPDATED
  const handleSetStock = async () => {
    try {
      if (!selectedItem) return;

      const stock = parseFloat(stockAdjustmentForm.stock); // Updated
      if (isNaN(stock) || stock < 0) {
        alert("Please enter a valid stock value (0 or positive)");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/set-stock/${selectedItem._id}`,
        stockAdjustmentForm, // Updated
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert(`Stock set to ${stock} for ${selectedItem.colorName}`);
      setShowSetStock(false);
      setSelectedItem(null);
      fetchInventory(); // Refresh list
    } catch (err) {
      console.error("Error setting stock:", err);
      alert(err.response?.data?.error || "Failed to set stock");
    }
  };

  // Update threshold
  const handleUpdateThreshold = async (item, newThreshold) => {
    try {
      const threshold = parseFloat(newThreshold);
      if (isNaN(threshold) || threshold < 0) {
        alert("Please enter a valid threshold value");
        return;
      }

      const token = localStorage.getItem("adminToken");
      await axios.put(
        `${import.meta.env.VITE_API_URL}/inventory/update-threshold/${item._id}`,
        { threshold },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update local state
      setInventory(prev => prev.map(i =>
        i._id === item._id ? { ...i, threshold } : i
      ));

      alert("Threshold updated successfully!");
    } catch (err) {
      console.error("Error updating threshold:", err);
      alert(err.response?.data?.error || "Failed to update threshold");
    }
  };

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = searchTerm === "" ||
      item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.colorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.modelName && item.modelName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.variableModelName && item.variableModelName.toLowerCase().includes(searchTerm.toLowerCase()));

    const productType = item.productDetails?.type;
    const matchesType = filterType === "all" ||
      (filterType === "simple" && productType === "simple") ||
      (filterType === "variable" && productType === "variable");

    const isLowStock = item.stock < (item.threshold || 10);
    const matchesLowStock = filterType !== "low" || isLowStock;

    return matchesSearch && matchesType && matchesLowStock;
  });

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

    filteredInventory.forEach(item => {
      totalStock += item.stock;
      const status = getStockStatus(item.stock, item.threshold || 10);
      if (status.class === "out-of-stock") outOfStock++;
      else if (status.class === "low-stock") lowStock++;
      else inStock++;
    });

    return { totalStock, outOfStock, lowStock, inStock };
  };

  const stats = getStats();

  return (
    <div className="inventories">
      {/* HEADER */}
      <div className="header">
        <div className="title-section">
          <h2>Inventory Management</h2>
          <span className="count">({filteredInventory.length} items)</span>
        </div>
        <div className="actions">
          <button
            className="refresh-btn"
            onClick={fetchInventory}
            disabled={loading}
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="stats">
        <div className="stat-card">
          <div className="stat-value">{filteredInventory.length}</div>
          <div className="stat-label">Total Items</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.outOfStock}</div>
          <div className="stat-label">Out of Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.lowStock}</div>
          <div className="stat-label">Low Stock</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.totalStock}</div>
          <div className="stat-label">Total Stock</div>
        </div>
      </div>

      {/* FILTERS & SEARCH */}
      <div className="filters">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by product, color, or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm("")}>
              ×
            </button>
          )}
        </div>

        <div className="filter-buttons">
          <button
            className={filterType === "all" ? "active" : ""}
            onClick={() => setFilterType("all")}
          >
            All Items
          </button>
          <button
            className={filterType === "simple" ? "active" : ""}
            onClick={() => setFilterType("simple")}
          >
            Simple Products
          </button>
          <button
            className={filterType === "variable" ? "active" : ""}
            onClick={() => setFilterType("variable")}
          >
            Variable Products
          </button>
          <button
            className={filterType === "low" ? "active low" : ""}
            onClick={() => setFilterType("low")}
          >
            ⚠️ Low Stock
          </button>
        </div>
      </div>

      {/* INVENTORY TABLE */}
      {loading ? (
        <div className="loading">Loading inventory...</div>
      ) : filteredInventory.length === 0 ? (
        <div className="no-items">
          <p>No inventory items found</p>
        </div>
      ) : (
        <div className="inventory-table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Details</th>
                <th>Color</th>
                <th>Stock</th>
                <th>Threshold</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item.stock, item.threshold || 10);

                return (
                  <tr key={item._id} className={stockStatus.class}>
                    <td className="image-cell">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={`${item.productName} - ${item.colorName}`}
                          className="product-image"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://via.placeholder.com/60x60?text=No+Image";
                          }}
                        />
                      ) : (
                        <div className="no-image">No Image</div>
                      )}
                    </td>

                    <td className="product-details">
                      <div className="product-name">{item.productName}</div>
                      <div className="model-info">
                        {item.variableModelName ? (
                          <>
                            <span className="model-type">Variable:</span>
                            <span className="model-name">{item.variableModelName}</span>
                          </>
                        ) : (
                          <>
                            <span className="model-type">Simple:</span>
                            <span className="model-name">{item.modelName || "Default"}</span>
                          </>
                        )}
                      </div>
                      <div className="product-id">ID: {item.productId}</div>
                    </td>

                    <td className="color-cell">
                      <div className="color-name">{item.colorName}</div>
                      <div className="color-id">Color ID: {item.colorId}</div>
                    </td>

                    <td className="stock-cell">
                      <div className="stock-display">
                        <span className="stock-value">{item.stock}</span>
                        <div className="stock-buttons">
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
                            📝 Set
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="threshold-cell">
                      <div className="threshold-display">
                        <input
                          type="number"
                          min="0"
                          value={item.threshold || 10}
                          onChange={(e) => handleUpdateThreshold(item, e.target.value)}
                          className="threshold-input"
                        />
                        <span className="threshold-label">Alert when below</span>
                      </div>
                    </td>

                    <td className="status-cell">
                      <span className={`status-badge ${stockStatus.class}`}>
                        {stockStatus.icon} {stockStatus.text}
                      </span>
                    </td>

                    <td className="actions-cell">
                      <div className="action-buttons">
                        <button
                          className="history-btn"
                          onClick={() => openStockHistory(item)}
                          title="View Stock History"
                        >
                          📊 History
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD STOCK MODAL */}
      {showAddStock && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Add Stock - {selectedItem.colorName}</h3>
              <p className="modal-subtitle">
                {selectedItem.productName} • Current Stock: {selectedItem.stock}
              </p>
              <button className="close-btn" onClick={() => setShowAddStock(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
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
                <small>Enter the quantity you want to add to current stock</small>
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

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={stockForm.notes}
                  onChange={handleStockFormChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div className="stock-preview">
                <div className="preview-row">
                  <span>Current Stock:</span>
                  <strong>{selectedItem.stock}</strong>
                </div>
                <div className="preview-row">
                  <span>Adding:</span>
                  <strong>+{stockForm.quantity || 0}</strong>
                </div>
                <div className="preview-row total">
                  <span>New Stock:</span>
                  <strong>{selectedItem.stock + (parseFloat(stockForm.quantity) || 0)}</strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowAddStock(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleAddStock}>
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SET STOCK MODAL - UPDATED */}
      {showSetStock && selectedItem && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Set Stock - {selectedItem.colorName}</h3>
              <p className="modal-subtitle">
                {selectedItem.productName} • Current Stock: {selectedItem.stock}
              </p>
              <button className="close-btn" onClick={() => setShowSetStock(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
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
                <small>Set the exact stock quantity (for corrections)</small>
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

              <div className="form-group">
                <label>Notes (Optional)</label>
                <textarea
                  name="notes"
                  value={stockAdjustmentForm.notes}
                  onChange={handleSetStockFormChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                />
              </div>

              <div className="stock-preview">
                <div className="preview-row">
                  <span>Current Stock:</span>
                  <strong>{selectedItem.stock}</strong>
                </div>
                <div className="preview-row">
                  <span>Setting to:</span>
                  <strong>{stockAdjustmentForm.stock || 0}</strong> {/* Updated */}
                </div>
                <div className="preview-row total">
                  <span>Difference:</span>
                  <strong className={parseFloat(stockAdjustmentForm.stock || 0) >= selectedItem.stock ? "positive" : "negative"}>
                    {parseFloat(stockAdjustmentForm.stock || 0) >= selectedItem.stock ? "+" : ""}
                    {(parseFloat(stockAdjustmentForm.stock || 0) - selectedItem.stock)}
                  </strong>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowSetStock(false)}>
                Cancel
              </button>
              <button className="save-btn" onClick={handleSetStock}>
                Set Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STOCK HISTORY MODAL */}
      {showHistory && selectedItem && (
        <div className="modal-overlay">
          <div className="modal large">
            <div className="modal-header">
              <h3>Stock History - {selectedItem.colorName}</h3>
              <p className="modal-subtitle">
                {selectedItem.productName} • Current Stock: {selectedItem.stock}
              </p>
              <button className="close-btn" onClick={() => setShowHistory(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
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
                        <th>Added By</th>
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
                            <td className="addedby-cell">
                              {history.addedBy}
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
              <button className="close-btn" onClick={() => setShowHistory(false)}>
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