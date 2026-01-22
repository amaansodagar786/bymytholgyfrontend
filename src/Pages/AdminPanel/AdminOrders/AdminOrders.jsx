import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./AdminOrders.scss";

const AdminOrders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    page: 1,
    limit: 20
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    processingOrders: 0,
    shippedOrders: 0,
    deliveredOrders: 0
  });
  const [statusUpdate, setStatusUpdate] = useState({
    orderId: "",
    status: "",
    notes: ""
  });

  // Status colors for UI
  const statusColors = {
    'pending': '#f39c12',
    'processing': '#17a2b8',
    'shipped': '#3498db',
    'delivered': '#2ecc71',
    'cancelled': '#e74c3c',
    'returned': '#95a5a6'
  };

  const statusLabels = {
    'pending': '⏳ Pending',
    'processing': '🔄 Processing',
    'shipped': '🚚 Shipped',
    'delivered': '✅ Delivered',
    'cancelled': '❌ Cancelled',
    'returned': '↩️ Returned'
  };

  // ✅ TOKEN VALIDATION FUNCTION
  const validateToken = () => {
    const token = localStorage.getItem("adminToken");
    const role = localStorage.getItem("role");
    
    if (!token || !role || role !== "admin") {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("role");
      localStorage.removeItem("adminId");
      navigate("/admin/login");
      return false;
    }
    
    const tokenParts = token.split('.');
    if (tokenParts.length !== 3) {
      localStorage.removeItem("adminToken");
      localStorage.removeItem("role");
      localStorage.removeItem("adminId");
      navigate("/admin/login");
      return false;
    }
    
    return true;
  };

  // ✅ GET AUTH HEADERS
  const getAuthHeaders = () => {
    const token = localStorage.getItem("adminToken");
    if (!token) {
      throw new Error("No authentication token found");
    }
    return {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    };
  };

  // 📋 FETCH ALL ORDERS
  const fetchOrders = async () => {
    try {
      if (!validateToken()) return;
      
      setIsLoading(true);
      setError("");
      
      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        status: filters.status !== "all" ? filters.status : "",
        search: filters.search
      }).toString();

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/all/orders?${queryParams}`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setOrders(response.data.orders || []);
        setStats(response.data.stats || {
          totalOrders: 0,
          totalRevenue: 0,
          pendingOrders: 0,
          processingOrders: 0,
          shippedOrders: 0,
          deliveredOrders: 0
        });
      }
    } catch (err) {
      console.error("Error fetching orders:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("role");
        localStorage.removeItem("adminId");
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to fetch orders");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 📊 FETCH ORDER STATS
  const fetchOrderStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/admin/stats`,
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchOrders();
    fetchOrderStats();
  }, [filters.page, filters.status]);

  // 🔍 VIEW ORDER DETAILS
  const handleViewOrderDetails = (order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
    setStatusUpdate({
      orderId: order.orderId,
      status: order.orderStatus,
      notes: order.notes || ""
    });
  };

  // ✏️ UPDATE ORDER STATUS
  const handleUpdateStatus = async () => {
    try {
      if (!validateToken()) return;
      
      if (!statusUpdate.status) {
        alert("Please select a status");
        return;
      }

      setIsLoading(true);
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/orders/${statusUpdate.orderId}/status`,
        {
          status: statusUpdate.status,
          notes: statusUpdate.notes
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        alert("✅ Order status updated successfully!");
        
        // Update local state
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.orderId === statusUpdate.orderId 
              ? { ...order, ...response.data.order }
              : order
          )
        );
        
        if (selectedOrder) {
          setSelectedOrder(response.data.order);
        }
        
        // Refresh stats
        fetchOrderStats();
      }
    } catch (err) {
      console.error("Error updating order status:", err);
      
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else {
        alert(err.response?.data?.message || "Failed to update order status");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔎 SEARCH ORDERS
  const handleSearch = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value, page: 1 }));
    
    // Debounce search
    clearTimeout(searchTimeout);
    const searchTimeout = setTimeout(() => {
      fetchOrders();
    }, 500);
  };

  // 📅 FORMAT DATE
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // 📞 FORMAT PHONE
  const formatPhone = (phone) => {
    if (!phone) return "N/A";
    return `${phone.slice(0, 5)}****${phone.slice(-2)}`;
  };

  // 🚪 LOGOUT FUNCTION
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    localStorage.removeItem("role");
    localStorage.removeItem("adminId");
    navigate("/admin/login");
  };

  // Check if user is admin on component mount
  useEffect(() => {
    const role = localStorage.getItem("role");
    const token = localStorage.getItem("adminToken");
    
    if (!token || role !== "admin") {
      navigate("/admin/login");
    }
  }, [navigate]);

  // If not admin, show access denied
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("adminToken");
  
  if (!token || role !== "admin") {
    return (
      <div className="access-denied">
        <h2>❌ Access Denied: Admin Only</h2>
        <p>Please login as admin to access this page.</p>
        <button onClick={() => navigate("/admin/login")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="admin-orders">
      {/* Header with logout */}
      <div className="admin-header">
        <h1>📦 Manage Orders</h1>
        <div className="header-actions">
          <button onClick={() => fetchOrders()} className="refresh-btn">
            🔄 Refresh
          </button>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-value">{stats.totalOrders}</div>
          <div className="stat-label">Total Orders</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">₹{stats.totalRevenue?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Revenue</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.processingOrders}</div>
          <div className="stat-label">Processing</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.shippedOrders}</div>
          <div className="stat-label">Shipped</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.deliveredOrders}</div>
          <div className="stat-label">Delivered</div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by Order ID, Customer Name, Product..."
            value={filters.search}
            onChange={handleSearch}
            disabled={isLoading}
          />
          <span className="search-icon">🔍</span>
        </div>

        <div className="status-filters">
          <button 
            className={`filter-btn ${filters.status === "all" ? "active" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, status: "all", page: 1 }))}
          >
            All Orders
          </button>
          <button 
            className={`filter-btn ${filters.status === "pending" ? "active" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, status: "pending", page: 1 }))}
          >
            ⏳ Pending
          </button>
          <button 
            className={`filter-btn ${filters.status === "processing" ? "active" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, status: "processing", page: 1 }))}
          >
            🔄 Processing
          </button>
          <button 
            className={`filter-btn ${filters.status === "shipped" ? "active" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, status: "shipped", page: 1 }))}
          >
            🚚 Shipped
          </button>
          <button 
            className={`filter-btn ${filters.status === "delivered" ? "active" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, status: "delivered", page: 1 }))}
          >
            ✅ Delivered
          </button>
          <button 
            className={`filter-btn ${filters.status === "cancelled" ? "active" : ""}`}
            onClick={() => setFilters(prev => ({ ...prev, status: "cancelled", page: 1 }))}
          >
            ❌ Cancelled
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <span>{error}</span>
          <button onClick={() => setError("")}>×</button>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-orders">
                  📭 No orders found
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order._id}>
                  <td className="order-id">
                    <strong>#{order.orderId}</strong>
                    {order.checkoutMode === "buy-now" && (
                      <span className="buy-now-badge">Buy Now</span>
                    )}
                  </td>
                  <td>
                    <div className="customer-info">
                      <div className="customer-name">{order.deliveryAddress?.fullName || "N/A"}</div>
                      <div className="customer-contact">
                        {formatPhone(order.deliveryAddress?.mobile)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="items-info">
                      {order.items.length} item{order.items.length > 1 ? "s" : ""}
                      <div className="items-preview">
                        {order.items.slice(0, 2).map((item, idx) => (
                          <span key={idx} className="item-tag">
                            {item.productName}
                            {item.fragrance && item.fragrance !== "Default" && (
                              <span className="fragrance-badge">🍃 {item.fragrance}</span>
                            )}
                          </span>
                        ))}
                        {order.items.length > 2 && (
                          <span className="more-items">+{order.items.length - 2} more</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="amount">
                    <div className="amount-value">₹{order.pricing?.total?.toLocaleString() || 0}</div>
                    {order.pricing?.totalSavings > 0 && (
                      <div className="savings">Saved: ₹{order.pricing.totalSavings.toLocaleString()}</div>
                    )}
                  </td>
                  <td>
                    <div className="date-info">
                      {formatDate(order.createdAt)}
                    </div>
                  </td>
                  <td>
                    <div 
                      className="status-badge"
                      style={{ backgroundColor: statusColors[order.orderStatus] || '#666' }}
                    >
                      {statusLabels[order.orderStatus] || order.orderStatus}
                    </div>
                  </td>
                  <td>
                    <div className="payment-info">
                      <span className="payment-method">
                        {order.payment?.method === "cod" ? "💵 COD" : 
                         order.payment?.method === "card" ? "💳 Card" : "📱 UPI"}
                      </span>
                      <span className={`payment-status ${order.payment?.status}`}>
                        {order.payment?.status || "pending"}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="view-btn"
                        onClick={() => handleViewOrderDetails(order)}
                        disabled={isLoading}
                      >
                        📋 View
                      </button>
                      <button
                        className="status-btn"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                          setStatusUpdate({
                            orderId: order.orderId,
                            status: order.orderStatus,
                            notes: order.notes || ""
                          });
                        }}
                        disabled={isLoading}
                      >
                        ✏️ Status
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {stats.totalOrders > filters.limit && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={filters.page === 1 || isLoading}
            >
              ← Previous
            </button>
            <span className="page-info">
              Page {filters.page} of {Math.ceil(stats.totalOrders / filters.limit)}
              ({stats.totalOrders} total orders)
            </span>
            <button
              className="page-btn"
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={filters.page >= Math.ceil(stats.totalOrders / filters.limit) || isLoading}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="order-details-modal">
          <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}></div>
          <div className="modal-content">
            <div className="modal-header">
              <h2>Order Details - #{selectedOrder.orderId}</h2>
              <button className="close-btn" onClick={() => setShowOrderDetails(false)}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Order Information */}
              <div className="section">
                <h3>Order Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Order ID:</label>
                    <span>#{selectedOrder.orderId}</span>
                  </div>
                  <div className="info-item">
                    <label>Order Date:</label>
                    <span>{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="info-item">
                    <label>Checkout Mode:</label>
                    <span>{selectedOrder.checkoutMode === "buy-now" ? "Buy Now" : "Cart"}</span>
                  </div>
                  <div className="info-item">
                    <label>Current Status:</label>
                    <span className="current-status" style={{ color: statusColors[selectedOrder.orderStatus] }}>
                      {selectedOrder.orderStatus.toUpperCase()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Total Items:</label>
                    <span>{selectedOrder.items?.length || 0} items</span>
                  </div>
                  <div className="info-item">
                    <label>User ID:</label>
                    <span>{selectedOrder.userId}</span>
                  </div>
                </div>
              </div>

              {/* Update Status Section */}
              <div className="section">
                <h3>Update Order Status</h3>
                <div className="status-update-form">
                  <div className="form-group">
                    <label>New Status:</label>
                    <select
                      value={statusUpdate.status}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                      disabled={isLoading}
                    >
                      <option value="">Select Status</option>
                      <option value="pending">⏳ Pending</option>
                      <option value="processing">🔄 Processing</option>
                      <option value="shipped">🚚 Shipped</option>
                      <option value="delivered">✅ Delivered</option>
                      <option value="cancelled">❌ Cancelled</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Notes (Optional):</label>
                    <textarea
                      placeholder="Add any notes or instructions..."
                      value={statusUpdate.notes}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, notes: e.target.value }))}
                      disabled={isLoading}
                      rows="3"
                    />
                  </div>

                  <div className="form-actions">
                    <button
                      className="update-status-btn"
                      onClick={handleUpdateStatus}
                      disabled={isLoading || !statusUpdate.status}
                    >
                      {isLoading ? "Updating..." : "Update Status"}
                    </button>
                    <button
                      className="cancel-btn"
                      onClick={() => setShowOrderDetails(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="section">
                <h3>Customer Information</h3>
                <div className="customer-details">
                  <div className="detail-row">
                    <strong>Name:</strong> {selectedOrder.deliveryAddress?.fullName || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Mobile:</strong> {selectedOrder.deliveryAddress?.mobile || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Email:</strong> {selectedOrder.deliveryAddress?.email || "N/A"}
                  </div>
                  <div className="detail-row">
                    <strong>Address:</strong> 
                    <div className="address-details">
                      <p>{selectedOrder.deliveryAddress?.addressLine1}</p>
                      {selectedOrder.deliveryAddress?.addressLine2 && (
                        <p>{selectedOrder.deliveryAddress.addressLine2}</p>
                      )}
                      <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}</p>
                      <p>{selectedOrder.deliveryAddress?.country || "India"}</p>
                      {selectedOrder.deliveryAddress?.landmark && (
                        <p><strong>Landmark:</strong> {selectedOrder.deliveryAddress.landmark}</p>
                      )}
                      {selectedOrder.deliveryAddress?.instructions && (
                        <p><strong>Instructions:</strong> {selectedOrder.deliveryAddress.instructions}</p>
                      )}
                    </div>
                  </div>
                  <div className="detail-row">
                    <strong>Address Type:</strong> {selectedOrder.deliveryAddress?.addressType || "home"}
                    {selectedOrder.deliveryAddress?.isDefault && (
                      <span className="default-badge">Default</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="section">
                <h3>Order Items ({selectedOrder.items?.length || 0})</h3>
                <div className="order-items-list">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="order-item">
                      <div className="item-info">
                        <div className="item-name">{item.productName}</div>
                        <div className="item-variants">
                          {item.modelName !== "Default" && <span className="variant-badge">Model: {item.modelName}</span>}
                          <span className="variant-badge">Color: {item.colorName}</span>
                          {/* ADDED FRAGRANCE DISPLAY */}
                          {item.fragrance && item.fragrance !== "Default" && (
                            <span className="variant-badge fragrance-badge">🍃 Fragrance: {item.fragrance}</span>
                          )}
                          {item.size && <span className="variant-badge">Size: {item.size}</span>}
                          {item.offerPercentage > 0 && (
                            <span className="offer-badge">{item.offerPercentage}% OFF</span>
                          )}
                        </div>
                        <div className="item-sku">
                          SKU: {item.modelId || item.productId}
                        </div>
                        <div className="item-inventory">
                          <span className="inventory-info">
                            Purchased from stock: {item.purchasedFromStock}
                          </span>
                          {item.inventoryId && (
                            <span className="inventory-id">Inventory ID: {item.inventoryId}</span>
                          )}
                        </div>
                      </div>
                      <div className="item-pricing">
                        <div className="price-row">
                          <span>Quantity:</span>
                          <span className="quantity-value">{item.quantity}</span>
                        </div>
                        <div className="price-row">
                          <span>Unit Price:</span>
                          <span>₹{item.unitPrice?.toLocaleString()}</span>
                        </div>
                        {item.offerPercentage > 0 && (
                          <>
                            <div className="price-row">
                              <span>Offer Price:</span>
                              <span className="offer-price">₹{item.offerPrice?.toLocaleString()}</span>
                            </div>
                            <div className="price-row discount">
                              <span>Discount ({item.offerPercentage}%):</span>
                              <span>-₹{item.savedAmount?.toLocaleString()}</span>
                            </div>
                          </>
                        )}
                        <div className="price-row total">
                          <span>Total:</span>
                          <span className="total-price">₹{item.totalPrice?.toLocaleString()}</span>
                        </div>
                        {item.offerLabel && (
                          <div className="offer-label">
                            🎁 Offer: {item.offerLabel}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="section">
                <h3>Order Summary</h3>
                <div className="order-summary">
                  <div className="summary-row">
                    <span>Subtotal ({selectedOrder.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} items):</span>
                    <span>₹{selectedOrder.pricing?.subtotal?.toLocaleString() || 0}</span>
                  </div>
                  {selectedOrder.pricing?.totalSavings > 0 && (
                    <div className="summary-row discount">
                      <span>Total Savings:</span>
                      <span>-₹{selectedOrder.pricing.totalSavings.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="summary-row">
                    <span>Shipping:</span>
                    <span className={selectedOrder.pricing?.shipping === 0 ? 'free-shipping' : ''}>
                      {selectedOrder.pricing?.shipping === 0 
                        ? "FREE" 
                        : `₹${selectedOrder.pricing?.shipping || 0}`}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>Tax (GST {selectedOrder.pricing?.taxPercentage || 18}%):</span>
                    <span>₹{selectedOrder.pricing?.tax?.toLocaleString() || 0}</span>
                  </div>
                  <div className="summary-row grand-total">
                    <span>Total Amount:</span>
                    <span className="grand-total-amount">₹{selectedOrder.pricing?.total?.toLocaleString() || 0}</span>
                  </div>
                </div>
              </div>

              {/* Payment Information */}
              <div className="section">
                <h3>Payment Information</h3>
                <div className="payment-details">
                  <div className="detail-row">
                    <strong>Method:</strong> 
                    {selectedOrder.payment?.method === "cod" ? "💵 Cash on Delivery" :
                     selectedOrder.payment?.method === "card" ? "💳 Credit/Debit Card" : "📱 UPI"}
                  </div>
                  <div className="detail-row">
                    <strong>Status:</strong> 
                    <span className={`payment-status ${selectedOrder.payment?.status}`}>
                      {selectedOrder.payment?.status?.toUpperCase() || "PENDING"}
                    </span>
                  </div>
                  {selectedOrder.payment?.paidAmount && (
                    <div className="detail-row">
                      <strong>Paid Amount:</strong> ₹{selectedOrder.payment.paidAmount.toLocaleString()}
                    </div>
                  )}
                  {selectedOrder.payment?.paymentDate && (
                    <div className="detail-row">
                      <strong>Payment Date:</strong> {formatDate(selectedOrder.payment.paymentDate)}
                    </div>
                  )}
                  {selectedOrder.payment?.transactionId && (
                    <div className="detail-row">
                      <strong>Transaction ID:</strong> {selectedOrder.payment.transactionId}
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Information */}
              <div className="section">
                <h3>Order Timeline</h3>
                <div className="timeline-details">
                  <div className="detail-row">
                    <strong>Order Placed:</strong> {formatDate(selectedOrder.timeline?.placedAt)}
                  </div>
                  {selectedOrder.timeline?.processedAt && (
                    <div className="detail-row">
                      <strong>Processed:</strong> {formatDate(selectedOrder.timeline.processedAt)}
                    </div>
                  )}
                  {selectedOrder.timeline?.shippedAt && (
                    <div className="detail-row">
                      <strong>Shipped:</strong> {formatDate(selectedOrder.timeline.shippedAt)}
                    </div>
                  )}
                  {selectedOrder.timeline?.deliveredAt && (
                    <div className="detail-row">
                      <strong>Delivered:</strong> {formatDate(selectedOrder.timeline.deliveredAt)}
                    </div>
                  )}
                  {selectedOrder.timeline?.cancelledAt && (
                    <div className="detail-row">
                      <strong>Cancelled:</strong> {formatDate(selectedOrder.timeline.cancelledAt)}
                    </div>
                  )}
                  {selectedOrder.timeline?.estimatedDelivery && (
                    <div className="detail-row estimated">
                      <strong>Estimated Delivery:</strong> {formatDate(selectedOrder.timeline.estimatedDelivery)}
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="section">
                  <h3>Order Notes</h3>
                  <div className="order-notes">
                    <p>{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="close-modal-btn"
                onClick={() => setShowOrderDetails(false)}
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

export default AdminOrders;