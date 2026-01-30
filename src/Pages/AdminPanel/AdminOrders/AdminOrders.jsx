import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiPackage,
  FiSearch,
  FiRefreshCw,
  FiEye,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight,
  FiX,
  FiCheck,
  FiClock,
  FiTruck,
  FiDollarSign,
  FiShoppingBag,
  FiUser,
  FiCalendar,
  FiCreditCard,
  FiInfo,
  FiAlertCircle,
  FiTag
} from "react-icons/fi";
import {
  MdOutlinePendingActions,
  MdOutlineCancel
} from "react-icons/md";
import {
  HiOutlineCurrencyRupee
} from "react-icons/hi";
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
    deliveredOrders: 0,
    cancelledOrders: 0
  });
  const [statusUpdate, setStatusUpdate] = useState({
    orderId: "",
    status: "",
    notes: ""
  });

  const searchTimeoutRef = useRef(null);

  // Status configuration
  const statusConfig = {
    'pending': {
      label: 'Pending',
      color: '#f39c12',
      icon: <FiClock className="status-icon" />,
      bgColor: '#fef5e6'
    },
    'processing': {
      label: 'Processing',
      color: '#17a2b8',
      icon: <FiRefreshCw className="status-icon" />,
      bgColor: '#e8f4f8'
    },
    'shipped': {
      label: 'Shipped',
      color: '#3498db',
      icon: <FiTruck className="status-icon" />,
      bgColor: '#e8f4fc'
    },
    'delivered': {
      label: 'Delivered',
      color: '#2ecc71',
      icon: <FiCheck className="status-icon" />,
      bgColor: '#e8f8ef'
    },
    'cancelled': {
      label: 'Cancelled',
      color: '#e74c3c',
      icon: <MdOutlineCancel className="status-icon" />,
      bgColor: '#fdedec'
    }
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

  // 📋 FETCH ALL ORDERS WITH SEARCH - MODIFIED VERSION
  const fetchOrders = async () => {
    try {
      if (!validateToken()) return;

      setIsLoading(true);
      setError("");

      const queryParams = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        status: filters.status !== "all" ? filters.status : "",
        search: filters.search.trim()
      }).toString();

      console.log("📤 Fetching orders with params:", {
        page: filters.page,
        limit: filters.limit,
        status: filters.status,
        search: filters.search.trim(),
        queryString: queryParams
      });

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/all/orders?${queryParams}`,
        { headers: getAuthHeaders() }
      );

      console.log("✅ Orders API Response:", response.data);
      console.log("📦 Orders count:", response.data.orders?.length || 0);

      if (response.data.success) {
        setOrders(response.data.orders || []);
        toast.success(`Loaded ${response.data.orders?.length || 0} orders`);

      } else {
        console.log("❌ API success false:", response.data);
        toast.warning("Failed to load orders data");
      }
    } catch (err) {
      console.error("❌ Error fetching orders:", err);
      console.error("Error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });

      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.removeItem("adminToken");
        localStorage.removeItem("role");
        localStorage.removeItem("adminId");
        setTimeout(() => navigate("/admin/login"), 2000);
      } else {
        setError(err.response?.data?.message || "Failed to fetch orders");
        toast.error(err.response?.data?.message || "Failed to fetch orders");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 📊 FETCH ORDER STATS SEPARATELY - DEBUGGED
  const fetchOrderStats = async () => {
    try {
      console.log("📊 Fetching stats from:", `${import.meta.env.VITE_API_URL}/orders/admin/stats`);

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/orders/admin/stats`,
        { headers: getAuthHeaders() }
      );

      console.log("✅ Stats API Response:", response.data);
      console.log("📈 Stats success:", response.data.success);
      console.log("📊 Stats data:", response.data.stats);

      if (response.data.success && response.data.stats) {
        // Extract stats directly from the response.data.stats object
        const statsData = response.data.stats;

        console.log("📊 Raw stats data:", statsData);
        console.log("🔍 Checking keys:", Object.keys(statsData));
        console.log("🔍 totalOrders value:", statsData.totalOrders);
        console.log("🔍 Type of totalOrders:", typeof statsData.totalOrders);

        // Map the stats correctly - they come directly from stats object
        const newStats = {
          totalOrders: statsData.totalOrders || 0,
          totalRevenue: statsData.totalRevenue || 0,
          pendingOrders: statsData.pendingOrders || 0,
          processingOrders: statsData.processingOrders || 0,
          shippedOrders: statsData.shippedOrders || 0,
          deliveredOrders: statsData.deliveredOrders || 0,
          cancelledOrders: statsData.cancelledOrders || 0
        };

        console.log("🔄 Setting new stats:", newStats);
        setStats(newStats);

        // Also update the orders count if needed
        if (statsData.totalOrders > 0) {
          console.log(`✅ Successfully loaded ${statsData.totalOrders} orders`);
          toast.info(`Stats updated: ${statsData.totalOrders} total orders`);
        }
      } else {
        console.log("⚠️ Stats API didn't return expected data");
        console.log("Response structure:", {
          success: response.data.success,
          hasStats: !!response.data.stats,
          statsKeys: response.data.stats ? Object.keys(response.data.stats) : 'no stats'
        });
        toast.warning("Could not load statistics data");
      }
    } catch (err) {
      console.error("❌ Error fetching stats:", err);
      console.error("Stats error details:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url
      });

      // Log the actual URL being called
      console.log("🔗 API URL being called:", `${import.meta.env.VITE_API_URL}/orders/admin/stats`);

      if (err.response?.status === 404) {
        console.error("❌ Route not found - check backend routes");
        toast.error("Statistics API endpoint not found");
      } else {
        toast.error("Failed to load statistics");
      }
    }
  };

  useEffect(() => {
    console.log("🚀 Component mounted, fetching orders and stats");
    fetchOrders();
    fetchOrderStats();
  }, [filters.page, filters.status]);

  // 🔍 VIEW ORDER DETAILS
  const handleViewOrderDetails = (order) => {
    console.log("👁️ Viewing order details:", order.orderId);
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
        toast.warning("Please select a status");
        return;
      }

      setIsLoading(true);

      console.log("🔄 Updating order status:", statusUpdate);

      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/orders/${statusUpdate.orderId}/status`,
        {
          status: statusUpdate.status,
          notes: statusUpdate.notes
        },
        { headers: getAuthHeaders() }
      );

      if (response.data.success) {
        toast.success("✅ Order status updated successfully!");

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
        fetchOrders();
      } else {
        toast.warning("Failed to update order status");
      }
    } catch (err) {
      console.error("Error updating order status:", err);

      if (err.response?.status === 401 || err.response?.status === 403) {
        toast.error("Session expired. Please login again.");
        localStorage.clear();
        navigate("/admin/login");
      } else {
        toast.error(err.response?.data?.message || "Failed to update order status");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 🔎 SEARCH ORDERS WITH DEBOUNCE - DEBUGGED
  const handleSearch = (e) => {
    const value = e.target.value;

    console.log("🔍 Search input changed:", {
      value: value,
      previousValue: filters.search,
      length: value.length
    });

    setFilters(prev => ({ ...prev, search: value, page: 1 }));

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      console.log("⏰ Cleared previous search timeout");
    }

    // Set new timeout for debounce
    searchTimeoutRef.current = setTimeout(() => {
      console.log("🚀 Executing search with value:", value);
      console.log("📋 Current filters:", filters);
      fetchOrders();
      if (value.trim()) {
        toast.info(`Searching for: ${value}`);
      }
    }, 500);
  };

  // 📅 FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
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
    toast.info("Logged out successfully");
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

  // DEBUG: Log current stats values
  useEffect(() => {
    console.log("📊 Current stats values:", stats);
    console.log("🔄 Stats debug check:", {
      totalOrders: stats.totalOrders,
      totalRevenue: stats.totalRevenue,
      pendingOrders: stats.pendingOrders,
      processingOrders: stats.processingOrders,
      shippedOrders: stats.shippedOrders,
      deliveredOrders: stats.deliveredOrders,
      typeOfTotalOrders: typeof stats.totalOrders,
      isZero: stats.totalOrders === 0
    });
  }, [stats]);

  // If not admin, show access denied
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("adminToken");

  if (!token || role !== "admin") {
    return (
      <div className="admin-orders access-denied">
        <ToastContainer
          position="top-center"
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
        <div className="access-denied-content">
          <FiPackage className="denied-icon" />
          <h2>Access Restricted</h2>
          <p>Administrator privileges required to view this page.</p>
          <button
            className="auth-btn"
            onClick={() => navigate("/admin/login")}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-orders-container">
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
      <header className="admin-orders-header">
        <div className="header-content">
          <div className="header-title">
            <FiPackage className="header-icon" />
            <h1>Order Management</h1>
            <span className="orders-badge">{stats.totalOrders || 0}</span>
          </div>

          <div className="header-actions">
            <button
              className="refresh-orders-btn"
              onClick={() => {
                console.log("🔄 Manual refresh clicked");
                toast.info("Refreshing orders...");
                fetchOrders();
                fetchOrderStats();
              }}
              disabled={isLoading}
            >
              <FiRefreshCw className={isLoading ? "spinning" : ""} />
              Refresh
            </button>
            <button className="logout-orders-btn" onClick={handleLogout}>
              <FiLogOut />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Cards - DEBUG INFO */}
      <div className="orders-stats-grid">
        <div className="orders-stat-card">
          <div className="stat-icon-card total-orders">
            <FiShoppingBag />
          </div>
          <div className="stat-card-content">
            <h3>{stats.totalOrders || 0}</h3>
            <p>Total Orders</p>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="stat-icon-card revenue-orders">
            <HiOutlineCurrencyRupee />
          </div>
          <div className="stat-card-content">
            <h3>₹{stats.totalRevenue ? stats.totalRevenue.toLocaleString('en-IN') : 0}</h3>
            <p>Total Revenue</p>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="stat-icon-card pending-orders">
            <MdOutlinePendingActions />
          </div>
          <div className="stat-card-content">
            <h3>{stats.pendingOrders || 0}</h3>
            <p>Pending Orders</p>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="stat-icon-card processing-orders">
            <FiRefreshCw />
          </div>
          <div className="stat-card-content">
            <h3>{stats.processingOrders || 0}</h3>
            <p>Processing</p>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="stat-icon-card shipped-orders">
            <FiTruck />
          </div>
          <div className="stat-card-content">
            <h3>{stats.shippedOrders || 0}</h3>
            <p>Shipped</p>
          </div>
        </div>

        <div className="orders-stat-card">
          <div className="stat-icon-card delivered-orders">
            <FiCheck />
          </div>
          <div className="stat-card-content">
            <h3>{stats.deliveredOrders || 0}</h3>
            <p>Delivered</p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="orders-filters-section">
        <div className="orders-search-container">
          <div className="orders-search-box">
            <FiSearch className="orders-search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Product..."
              value={filters.search}
              onChange={handleSearch}
              disabled={isLoading}
              className="orders-search-input"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  console.log("🔍 Enter pressed for search:", filters.search);
                  fetchOrders();
                  toast.info(`Searching: ${filters.search}`);
                }
              }}
            />
          </div>
        </div>

        <div className="orders-status-filters">
          <button
            className={`orders-filter-btn ${filters.status === "all" ? "active" : ""}`}
            onClick={() => {
              console.log("📊 Filter: All Orders");
              setFilters(prev => ({ ...prev, status: "all", page: 1 }));
              toast.info("Showing all orders");
            }}
          >
            All Orders
          </button>
          {Object.entries(statusConfig).map(([key, config]) => (
            <button
              key={key}
              className={`orders-filter-btn ${filters.status === key ? "active" : ""}`}
              onClick={() => {
                console.log(`📊 Filter: ${config.label}`);
                setFilters(prev => ({ ...prev, status: key, page: 1 }));
                toast.info(`Showing ${config.label} orders`);
              }}
              style={{ color: filters.status === key ? 'white' : config.color }}
            >
              {config.icon}
              {config.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="orders-error-alert">
          <FiAlertCircle className="orders-error-icon" />
          <span>{error}</span>
          <button onClick={() => setError("")} className="orders-close-error">
            <FiX />
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="orders-loading-overlay">
          <div className="orders-loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      )}

      {/* Orders Table */}
      <div className="orders-table-wrapper">
        <div className="orders-table-responsive">
          <table className="admin-orders-table">
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
                  <td colSpan="8" className="orders-no-data">
                    <div className="orders-empty-state">
                      <FiPackage />
                      <p>No orders found</p>
                      <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                        Showing 0 of {stats.totalOrders} total orders
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const status = statusConfig[order.orderStatus] || statusConfig.pending;

                  return (
                    <tr key={order._id}>
                      <td className="order-id-cell-data">
                        <div className="order-id-display">
                          <strong>#{order.orderId}</strong>
                          {order.checkoutMode === "buy-now" && (
                            <span className="order-mode-badge">Buy Now</span>
                          )}
                        </div>
                      </td>

                      <td>
                        <div className="customer-info-cell">
                          <div className="customer-avatar-cell">
                            <FiUser />
                          </div>
                          <div className="customer-details-cell">
                            <div className="customer-name-cell">
                              {order.deliveryAddress?.fullName || "N/A"}
                            </div>
                            <div className="customer-contact-cell">
                              {formatPhone(order.deliveryAddress?.mobile)}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="items-info-cell">
                          <div className="items-count-display">
                            {order.items.length} item{order.items.length > 1 ? 's' : ''}
                          </div>
                          <div className="items-preview-display">
                            {order.items.slice(0, 2).map((item, idx) => (
                              <div key={idx} className="item-preview-display">
                                <span className="item-name-display">{item.productName}</span>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="more-items-display">+{order.items.length - 2} more</div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="amount-display-cell">
                        <div className="amount-display">
                          <HiOutlineCurrencyRupee className="currency-icon-display" />
                          <span className="amount-value-display">
                            {order.pricing?.total?.toLocaleString('en-IN') || 0}
                          </span>
                        </div>
                        {order.pricing?.totalSavings > 0 && (
                          <div className="savings-badge-display">
                            Saved ₹{order.pricing.totalSavings.toLocaleString('en-IN')}
                          </div>
                        )}
                      </td>

                      <td>
                        <div className="date-info-cell">
                          <FiCalendar className="date-icon-display" />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                      </td>

                      <td>
                        <div
                          className="order-status-badge"
                          style={{
                            backgroundColor: status.bgColor,
                            color: status.color,
                            borderColor: status.color
                          }}
                        >
                          {status.icon}
                          <span>{status.label}</span>
                        </div>
                      </td>

                      <td>
                        <div className="payment-info-cell">
                          <div className="payment-method-cell">
                            <FiCreditCard />
                            <span>{order.payment?.method === "cod" ? "COD" : "Prepaid"}</span>
                          </div>
                          <div className={`payment-status-cell ${order.payment?.status}`}>
                            {order.payment?.status || "pending"}
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="order-action-buttons">
                          <button
                            className="view-edit-order-btn"
                            onClick={() => handleViewOrderDetails(order)}
                            title="View & Edit Order"
                          >
                            <FiEye className="action-icon-display" />
                            <span className="action-text-display">Manage</span>
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
        {stats.totalOrders > filters.limit && (
          <div className="orders-pagination">
            <button
              className="orders-page-btn prev"
              onClick={() => {
                setFilters(prev => ({ ...prev, page: prev.page - 1 }));
                toast.info(`Loading page ${filters.page - 1}`);
              }}
              disabled={filters.page === 1 || isLoading}
            >
              <FiChevronLeft />
              Previous
            </button>

            <div className="orders-page-info">
              Page <strong>{filters.page}</strong> of{" "}
              <strong>{Math.ceil(stats.totalOrders / filters.limit)}</strong>
              <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                Total orders: {stats.totalOrders}
              </div>
            </div>

            <button
              className="orders-page-btn next"
              onClick={() => {
                setFilters(prev => ({ ...prev, page: prev.page + 1 }));
                toast.info(`Loading page ${filters.page + 1}`);
              }}
              disabled={filters.page >= Math.ceil(stats.totalOrders / filters.limit) || isLoading}
            >
              Next
              <FiChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderDetails && selectedOrder && (
        <div className="order-details-modal-overlay">
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
          <div className="modal-backdrop" onClick={() => {
            setShowOrderDetails(false);
            toast.info("Closed order details");
          }}></div>
          <div className="order-details-modal-content">
            <div className="modal-header-section">
              <div className="modal-title-section">
                <FiPackage />
                <h2>Order #{selectedOrder.orderId}</h2>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setShowOrderDetails(false);
                  toast.info("Closed order details");
                }}
              >
                <FiX />
              </button>
            </div>

            <div className="modal-body-section">
              {/* Order Overview */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiInfo />
                  Order Overview
                </h3>
                <div className="overview-grid-section">
                  <div className="overview-item-section">
                    <span className="overview-label-section">Order Date</span>
                    <span className="overview-value-section">{formatDate(selectedOrder.createdAt)}</span>
                  </div>
                  <div className="overview-item-section">
                    <span className="overview-label-section">Checkout Mode</span>
                    <span className="overview-value-section mode-section">
                      {selectedOrder.checkoutMode === "buy-now" ? "Buy Now" : "Cart"}
                    </span>
                  </div>
                  <div className="overview-item-section">
                    <span className="overview-label-section">Total Items</span>
                    <span className="overview-value-section">
                      {selectedOrder.items?.length || 0} items
                    </span>
                  </div>
                  <div className="overview-item-section">
                    <span className="overview-label-section">Order Status</span>
                    <span
                      className="overview-value-section status-section"
                      style={{ color: statusConfig[selectedOrder.orderStatus]?.color || '#666' }}
                    >
                      {statusConfig[selectedOrder.orderStatus]?.label || selectedOrder.orderStatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Update Section */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiRefreshCw />
                  Update Order Status
                </h3>
                <div className="status-update-form-section">
                  <div className="form-group-section">
                    <label>New Status</label>
                    <select
                      value={statusUpdate.status}
                      onChange={(e) => setStatusUpdate(prev => ({ ...prev, status: e.target.value }))}
                      disabled={isLoading}
                      className="status-select-section"
                    >
                      <option value="">Select Status</option>
                      {Object.entries(statusConfig).map(([key, config]) => (
                        <option key={key} value={key} style={{ color: config.color }}>
                          {config.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-actions-section">
                    <button
                      className="btn-primary-section"
                      onClick={handleUpdateStatus}
                      disabled={isLoading || !statusUpdate.status}
                    >
                      {isLoading ? "Updating..." : "Update Status"}
                    </button>
                    <button
                      className="btn-secondary-section"
                      onClick={() => {
                        setShowOrderDetails(false);
                        toast.info("Cancelled status update");
                      }}
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiUser />
                  Customer Information
                </h3>
                <div className="customer-info-grid-section">
                  <div className="info-item-section">
                    <span className="info-label-section">Name</span>
                    <span className="info-value-section">{selectedOrder.deliveryAddress?.fullName || "N/A"}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Mobile</span>
                    <span className="info-value-section">{selectedOrder.deliveryAddress?.mobile || "N/A"}</span>
                  </div>
                  <div className="info-item-section">
                    <span className="info-label-section">Email</span>
                    <span className="info-value-section">{selectedOrder.deliveryAddress?.email || "N/A"}</span>
                  </div>
                  <div className="info-item-section full-width-section">
                    <span className="info-label-section">Delivery Address</span>
                    <div className="address-details-section">
                      <p>{selectedOrder.deliveryAddress?.addressLine1}</p>
                      {selectedOrder.deliveryAddress?.addressLine2 && (
                        <p>{selectedOrder.deliveryAddress.addressLine2}</p>
                      )}
                      <p>{selectedOrder.deliveryAddress?.city}, {selectedOrder.deliveryAddress?.state} - {selectedOrder.deliveryAddress?.pincode}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiShoppingBag />
                  Order Items ({selectedOrder.items?.length || 0})
                </h3>
                <div className="order-items-list-section">
                  {selectedOrder.items?.map((item, index) => (
                    <div key={index} className="order-item-card-section">
                      <div className="item-header-section">
                        <div className="item-name-section">{item.productName}</div>
                        <div className="item-quantity-section">Qty: {item.quantity}</div>
                      </div>

                      <div className="item-details-section">
                        {item.fragrance && item.fragrance !== "Default" && (
                          <div className="item-attribute-section">
                            <span className="attribute-label-section">Fragrance:</span>
                            <span className="attribute-value-section">{item.fragrance}</span>
                          </div>
                        )}
                        {item.colorName && item.colorName !== "Default" && (
                          <div className="item-attribute-section">
                            <span className="attribute-label-section">Color:</span>
                            <span className="attribute-value-section">{item.colorName}</span>
                          </div>
                        )}
                        {item.size && (
                          <div className="item-attribute-section">
                            <span className="attribute-label-section">Size:</span>
                            <span className="attribute-value-section">{item.size}</span>
                          </div>
                        )}
                      </div>

                      <div className="item-pricing-section">
                        <div className="price-row-section">
                          <span>Unit Price:</span>
                          <span>₹{item.unitPrice?.toLocaleString('en-IN')}</span>
                        </div>
                        {item.offerPercentage > 0 && (
                          <div className="price-row-section discount-section">
                            <span>Discount:</span>
                            <span>-₹{item.savedAmount?.toLocaleString('en-IN')}</span>
                          </div>
                        )}
                        <div className="price-row-section total-section">
                          <span>Total:</span>
                          <span className="total-amount-section">
                            ₹{item.totalPrice?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary - FIXED VERSION */}
              <div className="modal-section-item">
                <h3 className="section-title-item">
                  <FiDollarSign />
                  Order Summary
                </h3>
                <div className="order-summary-card-section">
                  {/* Original Price (if there are savings) */}
                  {selectedOrder.pricing?.totalSavings > 0 && (
                    <div className="summary-row-section original-price-section">
                      <span>Original Price</span>
                      <span className="strikethrough-section">
                        ₹{selectedOrder.pricing?.subtotal?.toLocaleString('en-IN') || 0}
                      </span>
                    </div>
                  )}

                  {/* Total Savings */}
                  {selectedOrder.pricing?.totalSavings > 0 && (
                    <div className="summary-row-section discount-section">
                      <span>Total Savings</span>
                      <span className="savings-text">-₹{selectedOrder.pricing.totalSavings.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {/* Discounted Subtotal (Items Total after savings) */}
                  <div className="summary-row-section">
                    <span>Items Total</span>
                    <span className="discounted-subtotal">
                      ₹{(selectedOrder.pricing?.subtotal - (selectedOrder.pricing?.totalSavings || 0)).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Shipping */}
                  <div className="summary-row-section">
                    <span>Shipping</span>
                    <span className={selectedOrder.pricing?.shipping === 0 ? 'free-section' : ''}>
                      {selectedOrder.pricing?.shipping === 0
                        ? "FREE"
                        : `₹${selectedOrder.pricing?.shipping || 0}`}
                    </span>
                  </div>

                  {/* Tax */}
                  <div className="summary-row-section">
                    <span>Tax (GST)</span>
                    <span>₹{selectedOrder.pricing?.tax?.toLocaleString('en-IN') || 0}</span>
                  </div>

                  {/* Grand Total */}
                  <div className="summary-row-section total-section">
                    <span>Total Amount</span>
                    <span className="grand-total-section">
                      ₹{selectedOrder.pricing?.total?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer-section">
              <button
                className="btn-secondary-section"
                onClick={() => {
                  setShowOrderDetails(false);
                  toast.info("Closed order details");
                }}
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