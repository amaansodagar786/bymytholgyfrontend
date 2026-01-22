import React, { useEffect, useState } from "react";
import "./AdminDashboard.scss";
import {
  FiDollarSign,
  FiShoppingBag,
  FiUsers,
  FiTrendingUp,
  FiClock,
  FiPackage,
  FiStar,
  FiAlertCircle,
  FiRefreshCw,
  FiChevronDown
} from "react-icons/fi";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from "recharts";

// Currency formatter
const fmt = (n) =>
  n == null ? "₹0" : new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(n);

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  // Status configuration matching Admin Orders
  const statusConfig = {
    'pending': {
      label: 'Pending',
      color: '#f39c12',
      bgColor: '#fef5e6'
    },
    'processing': {
      label: 'Processing',
      color: '#17a2b8',
      bgColor: '#e8f4f8'
    },
    'shipped': {
      label: 'Shipped',
      color: '#3498db',
      bgColor: '#e8f4fc'
    },
    'delivered': {
      label: 'Delivered',
      color: '#2ecc71',
      bgColor: '#e8f8ef'
    },
    'cancelled': {
      label: 'Cancelled',
      color: '#e74c3c',
      bgColor: '#fdedec'
    }
  };

  // Convert range key to start/end ISO strings
  function rangeToDates(rangeKey) {
    const end = new Date();
    let start = new Date();
    if (rangeKey === "7d") start.setDate(end.getDate() - 6);
    else if (rangeKey === "30d") start.setDate(end.getDate() - 29);
    else if (rangeKey === "90d") start.setDate(end.getDate() - 89);
    else start = new Date("1970-01-01");

    return {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    };
  }

  useEffect(() => {
    setLoading(true);

    const { startDate, endDate } = rangeToDates(range);
    const qs = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

    async function loadAll() {
      try {
        const base = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("adminToken");

        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const [
          kpiRes,
          statusRes,
          revRes,
          topRes,
          lowRes,
          reviewsRes,
        ] = await Promise.all([
          fetch(`${base}/admin/dashboard/kpis${qs}`, { method: "GET", headers }),
          fetch(`${base}/admin/dashboard/orders-by-status${qs}`, { method: "GET", headers }),
          fetch(`${base}/admin/dashboard/revenue-over-time${qs}`, { method: "GET", headers }),
          fetch(`${base}/admin/dashboard/top-products${qs}`, { method: "GET", headers }),
          fetch(`${base}/admin/dashboard/low-stock${qs}`, { method: "GET", headers }),
          fetch(`${base}/admin/dashboard/reviews${qs}`, { method: "GET", headers }),
        ]);

        const k = await kpiRes.json();
        const s = await statusRes.json();
        const r = await revRes.json();
        const t = await topRes.json();
        const l = await lowRes.json();
        const rv = await reviewsRes.json();

        // Process revenue data for chart
        const processedRevenue = Array.isArray(r)
          ? r.map((d) => ({
            ...d,
            label: `${d._id.day}/${d._id.month}`,
          }))
          : [];

        setKpis(k);
        setOrdersByStatus(Array.isArray(s) ? s : []);
        setRevenueOverTime(processedRevenue);
        setTopProducts(Array.isArray(t) ? t : []);
        setLowStock(Array.isArray(l) ? l : []);
        setReviews(Array.isArray(rv) ? rv : []);

      } catch (err) {
        console.error("❌ Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [range]);

  // Refresh dashboard
  const handleRefresh = () => {
    setLoading(true);
    const { startDate, endDate } = rangeToDates(range);
    const qs = `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;

    async function refreshData() {
      try {
        const base = import.meta.env.VITE_API_URL;
        const token = localStorage.getItem("adminToken");
        const headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        };

        const res = await fetch(`${base}/admin/dashboard/kpis${qs}`, { method: "GET", headers });
        const data = await res.json();
        setKpis(data);
      } catch (err) {
        console.error("❌ Failed to refresh dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    refreshData();
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="admin-dashboard-container">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <div className="header-icon-wrapper">
              <FiTrendingUp className="header-icon" />
            </div>
            <h1>Dashboard Overview</h1>
            <span className="dashboard-badge">Live</span>
          </div>

          <div className="header-actions">
            <div className="range-selector">
              <label>Time Range:</label>
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="range-select-input"
                disabled={loading}
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>

            <button
              className="refresh-dashboard-btn"
              onClick={handleRefresh}
              disabled={loading}
            >
              <FiRefreshCw className={loading ? "spinning" : ""} />
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="dashboard-stats-grid">
        {loading && !kpis ? (
          <div className="kpi-loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading dashboard data...</p>
          </div>
        ) : (
          <>
            <div className="dashboard-stat-card">
              <div className="stat-icon-card revenue-stat">
                <FiDollarSign />
              </div>
              <div className="stat-card-content">
                <h3>{kpis?.totalRevenue ? fmt(kpis.totalRevenue) : "₹0"}</h3>
                <p>Total Revenue</p>
                <span className="stat-meta">Period revenue</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-card orders-stat">
                <FiShoppingBag />
              </div>
              <div className="stat-card-content">
                <h3>{kpis?.totalOrders || 0}</h3>
                <p>Total Orders</p>
                <span className="stat-meta">Orders in range</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-card users-stat">
                <FiUsers />
              </div>
              <div className="stat-card-content">
                <h3>{kpis?.newUsers || 0}</h3>
                <p>New Users</p>
                <span className="stat-meta">Signups in range</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-card aov-stat">
                <FiTrendingUp />
              </div>
              <div className="stat-card-content">
                <h3>{kpis?.aov ? fmt(kpis.aov) : "₹0"}</h3>
                <p>Average Order Value</p>
                <span className="stat-meta">AOV</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-card pending-stat">
                <FiClock />
              </div>
              <div className="stat-card-content">
                <h3>{kpis?.pendingPayments || 0}</h3>
                <p>Pending Payments</p>
                <span className="stat-meta">Awaiting payment</span>
              </div>
            </div>

            <div className="dashboard-stat-card">
              <div className="stat-icon-card lowstock-stat">
                <FiAlertCircle />
              </div>
              <div className="stat-card-content">
                <h3>{kpis?.lowStock || 0}</h3>
                <p>Low Stock Items</p>
                <span className="stat-meta">Stock ≤ threshold</span>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Mid Row Charts */}
      <section className="dashboard-mid-row">
        {/* Orders by Status Card */}
        <div className="dashboard-card">
          <div className="card-header-section">
            <div className="card-title-section">
              <FiShoppingBag />
              <h3>Orders by Status</h3>
            </div>
            <span className="card-badge">{ordersByStatus.length} statuses</span>
          </div>

          <div className="card-body-section">
            {ordersByStatus.length === 0 ? (
              <div className="empty-data-state">
                <p>No order data available</p>
              </div>
            ) : (
              <div className="status-distribution-list">
                {ordersByStatus.map((s) => {
                  const config = statusConfig[s._id] || statusConfig.pending;
                  const pct = Math.min(100, (s.count / (kpis?.totalOrders || 1)) * 100);

                  return (
                    <div key={s._id} className="status-distribution-item">
                      <div className="status-info-row">
                        <div className="status-label-cell">
                          <span
                            className="status-color-indicator"
                            style={{ backgroundColor: config.color }}
                          />
                          <span className="status-label-text">{config.label}</span>
                        </div>
                        <div className="status-count-cell">{s.count}</div>
                      </div>

                      <div className="status-progress-container">
                        <div
                          className="status-progress-bar"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: config.bgColor,
                            borderColor: config.color
                          }}
                        >
                          <span className="progress-percentage">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Revenue Chart Card */}
        <div className="dashboard-card">
          <div className="card-header-section">
            <div className="card-title-section">
              <FiTrendingUp />
              <h3>Revenue Over Time</h3>
            </div>
            <span className="card-badge">
              {revenueOverTime.length} {range === "7d" ? "days" : range === "30d" ? "days" : "periods"}
            </span>
          </div>

          <div className="card-body-section">
            {revenueOverTime.length === 0 ? (
              <div className="empty-data-state">
                <p>No revenue data available</p>
              </div>
            ) : (
              <div className="revenue-chart-container">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart
                    data={revenueOverTime}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e5e5"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="#666"
                      fontSize={12}
                      tickLine={false}
                      tickFormatter={(value) => `₹${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                      }}
                      formatter={(value) => [fmt(value), 'Revenue']}
                      labelFormatter={(label, payload) => {
                        if (!payload || !payload[0] || !payload[0].payload)
                          return label;
                        const row = payload[0].payload;
                        return `${row._id.day}/${row._id.month}`;
                      }}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#000"
                      radius={[6, 6, 0, 0]}
                      name="Revenue"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom Row Tables */}
      <section className="dashboard-bottom-row">
        {/* Top Products Card */}
        <div className="dashboard-card">
          <div className="card-header-section">
            <div className="card-title-section">
              <FiStar />
              <h3>Top Selling Products</h3>
            </div>
            <span className="card-badge">{topProducts.length} products</span>
          </div>

          <div className="card-body-section">
            {topProducts.length === 0 ? (
              <div className="empty-data-state">
                <p>No sales data available</p>
              </div>
            ) : (
              <div className="products-table-container">
                <table className="data-table-section">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.slice(0, 5).map((p, index) => (
                      <tr key={p._id}>
                        <td className="product-cell-section">
                          <div className="product-info-mini">
                            <div className="product-rank">{index + 1}</div>
                            <div className="product-details-mini">
                              <div className="product-name-mini">{p.productName || p._id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="quantity-cell-section">
                          <span className="quantity-badge">{p.totalQuantity}</span>
                        </td>
                        <td className="revenue-cell-section">
                          <strong>{fmt(p.totalRevenue)}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Card */}
        <div className="dashboard-card">
          <div className="card-header-section">
            <div className="card-title-section">
              <FiAlertCircle />
              <h3>Low Stock Items</h3>
            </div>
            <span className="card-badge alert">{lowStock.length} items</span>
          </div>

          <div className="card-body-section">
            {lowStock.length === 0 ? (
              <div className="empty-data-state">
                <p>All stock levels are good</p>
              </div>
            ) : (
              <div className="lowstock-table-container">
                <table className="data-table-section">
                  <thead>
                    <tr>
                      <th>Product</th>
                      {/* <th>Model</th>  */}
                      {/* <th>Color</th>  */}
                      <th>Stock</th>
                      <th>Threshold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStock.slice(0, 5).map((it) => (
                      <tr key={it.inventoryId || it._id}>
                        <td className="product-cell-section">
                          <div className="product-info-mini">
                            <div className="product-name-mini">{it.productName}</div>
                          </div>
                        </td>
                        {/* <td className="model-cell-section">
                          {it.modelName || it.variableModelName || "Default"}
                        </td>
                        <td className="color-cell-section">
                          <span className="color-badge">{it.colorName}</span>
                        </td> */}
                        <td className="stock-cell-section">
                          <span className={`stock-badge ${it.stock === 0 ? 'out-stock' : 'low-stock'}`}>
                            {it.stock}
                          </span>
                        </td>
                        <td className="threshold-cell-section">
                          {it.threshold}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Card */}
        <div className="dashboard-card">
          <div className="card-header-section">
            <div className="card-title-section">
              <FiStar />
              <h3>Recent Reviews</h3>
            </div>
            <span className="card-badge">{reviews.length} reviews</span>
          </div>

          <div className="card-body-section">
            {reviews.length === 0 ? (
              <div className="empty-data-state">
                <p>No reviews yet</p>
              </div>
            ) : (
              <div className="reviews-list-container">
                <div className="reviews-scroll-container">
                  {reviews.slice(0, 5).map((r) => (
                    <div key={r.reviewId || r._id} className="review-item-card">
                      <div className="review-header-section">
                        <div className="reviewer-info">
                          <div className="reviewer-name">{r.userName}</div>
                          <div className="review-date">{formatDate(r.createdAt)}</div>
                        </div>
                        <div className="review-rating">
                          <span className="rating-stars">
                            {'★'.repeat(Math.floor(r.rating))}
                            {'☆'.repeat(5 - Math.floor(r.rating))}
                          </span>
                          <span className="rating-number">{r.rating}</span>
                        </div>
                      </div>

                      <div className="review-content-section">
                        <p className="review-text">
                          {r.reviewText || <em className="muted-text">No comment provided</em>}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}