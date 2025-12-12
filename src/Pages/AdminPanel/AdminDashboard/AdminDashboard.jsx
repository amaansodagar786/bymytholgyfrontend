// AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import "./AdminDashboard.scss";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

// small currency formatter
const fmt = (n) =>
  n == null ? "-" : new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(n);

export default function AdminDashboard() {
  const [kpis, setKpis] = useState(null);
  const [ordersByStatus, setOrdersByStatus] = useState([]);
  const [revenueOverTime, setRevenueOverTime] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("7d");

  // convert range key to start/end ISO strings
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

        // 🔥 FIX: Add label for chart before setting state
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
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, [range]);

  return (
    <div className="admin-dashboard">
      <header className="ad-header">
        <h1 className="ad-title">Admin Dashboard</h1>

        <div className="ad-controls">
          <label className="range-select">
            Range
            <select value={range} onChange={(e) => setRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="all">All time</option>
            </select>
          </label>
        </div>
      </header>

      <main className="ad-main">
        
        {/* KPI row */}
        <section className="kpi-row">
          {loading && <div className="kpi-loading">Loading KPIs...</div>}

          {!loading && kpis && (
            <>
              <div className="kpi-card">
                <div className="kpi-title">Total Revenue</div>
                <div className="kpi-value">{fmt(kpis.totalRevenue)}</div>
                <div className="kpi-meta">Period revenue</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Total Orders</div>
                <div className="kpi-value">{kpis.totalOrders}</div>
                <div className="kpi-meta">Orders in range</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">New Users</div>
                <div className="kpi-value">{kpis.newUsers}</div>
                <div className="kpi-meta">Signups in range</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">AOV</div>
                <div className="kpi-value">{fmt(kpis.aov)}</div>
                <div className="kpi-meta">Average Order Value</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Pending Payments</div>
                <div className="kpi-value">{kpis.pendingPayments}</div>
                <div className="kpi-meta">Awaiting payment</div>
              </div>

              <div className="kpi-card">
                <div className="kpi-title">Low Stock SKUs</div>
                <div className="kpi-value">{kpis.lowStock}</div>
                <div className="kpi-meta">Stock ≤ threshold</div>
              </div>
            </>
          )}
        </section>

        {/* mid row */}
        <section className="mid-row">
          
          {/* Orders by Status */}
          <div className="card status-card">
            <h3>Orders by Status</h3>
            <div className="status-list">
              {ordersByStatus.length === 0 && <div className="muted">No data</div>}

              {ordersByStatus.map((s) => {
                const pct = Math.min(100, (s.count / (kpis?.totalOrders || 1)) * 100);
                return (
                  <div key={s._id} className="status-item">
                    <div className="status-left">
                      <div className="status-label">{s._id}</div>
                      <div className="status-value">{s.count}</div>
                    </div>
                    <div className="status-bar-wrap">
                      <div className="status-bar" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue Over Time */}
          <div className="card revenue-card">
            <h3>Revenue Over Time</h3>

            <div className="revenue-chart">
              {revenueOverTime.length === 0 && (
                <div className="muted">No revenue data</div>
              )}

              {revenueOverTime.length > 0 && (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />

                    {/* 🔥 FIX: use precomputed label */}
                    <XAxis dataKey="label" />

                    <YAxis />

                    <Tooltip
                      formatter={(value) => fmt(value)}
                      labelFormatter={(label, payload) => {
                        if (!payload || !payload[0] || !payload[0].payload)
                          return label;
                        const row = payload[0].payload;
                        return `${row._id.day}/${row._id.month} - ${row.orderCount} orders`;
                      }}
                    />

                    <Bar dataKey="revenue" fill="#6c5ce7" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </section>

        {/* bottom row */}
        <section className="bottom-row">

          {/* Top Products */}
          <div className="card top-products">
            <h3>Top Selling Products</h3>
            {topProducts.length === 0 && <div className="muted">No sales yet</div>}
            <ol className="product-list">
              {topProducts.map((p) => (
                <li key={p._id} className="product-item">
                  <div className="p-left">
                    <div className="p-name">{p.productName || p._id}</div>
                    <div className="p-qty">Qty: {p.totalQuantity}</div>
                  </div>
                  <div className="p-right">{fmt(p.totalRevenue)}</div>
                </li>
              ))}
            </ol>
          </div>

          {/* Low Stock */}
          <div className="card low-stock-card">
            <h3>Low Stock Items</h3>
            {lowStock.length === 0 && <div className="muted">All good</div>}
            <div className="table-wrap">
              <table className="low-stock-table">
                <thead>
                  <tr>
                    <th>Inventory ID</th>
                    <th>Product</th>
                    <th>Model</th>
                    <th>Color</th>
                    <th>Stock</th>
                    <th>Threshold</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.map((it) => (
                    <tr key={it.inventoryId || it._id}>
                      <td>{it.inventoryId || it._id}</td>
                      <td>{it.productName}</td>
                      <td>{it.modelName || it.variableModelName || "Default"}</td>
                      <td>{it.colorName}</td>
                      <td>{it.stock}</td>
                      <td>{it.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Reviews */}
          <div className="card reviews-card">
            <h3>Recent Reviews</h3>
            {reviews.length === 0 && <div className="muted">No reviews yet</div>}
            <ul className="reviews-list">
              {reviews.map((r) => (
                <li key={r.reviewId || r._id} className="review-item">
                  <div className="rev-left">
                    <div className="rev-meta">
                      {r.userName} • {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                    <div className="rev-text">
                      {r.reviewText || <em>No comment</em>}
                    </div>
                  </div>
                  <div className="rev-right">{r.rating} ★</div>
                </li>
              ))}
            </ul>
          </div>
        </section>

      </main>
    </div>
  );
}
