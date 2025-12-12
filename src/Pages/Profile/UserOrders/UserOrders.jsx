import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './UserOrders.scss';

const UserOrders = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showOrderDetails, setShowOrderDetails] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [isUpdatingReview, setIsUpdatingReview] = useState(false);
    const [reviewData, setReviewData] = useState({
        rating: 0,
        reviewText: '',
        hoverRating: 0
    });
    const [submittingReview, setSubmittingReview] = useState(false);
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0,
        averageOrderValue: 0
    });
    const [filters, setFilters] = useState({
        status: 'all',
        page: 1,
        limit: 10
    });

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'User';

    // Status colors mapping
    const statusColors = {
        'pending': 'var(--warning)',
        'processing': 'var(--info)',
        'shipped': 'var(--primary)',
        'delivered': 'var(--success)',
        'cancelled': 'var(--danger)',
        'returned': 'var(--secondary)'
    };

    const statusIcons = {
        'pending': '⏳',
        'processing': '🔄',
        'shipped': '🚚',
        'delivered': '✅',
        'cancelled': '❌',
        'returned': '↩️'
    };

    const fetchUserOrders = async () => {
        if (!token || !userId) {
            navigate('/login');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                page: filters.page,
                limit: filters.limit,
                status: filters.status
            }).toString();

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/orders/user/${userId}?${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                const ordersData = response.data.orders || [];
                setOrders(ordersData);

                // Safe access to summary
                const summary = response.data.summary || {};
                setStats(prev => ({
                    ...prev,
                    totalOrders: summary.totalOrders || response.data.pagination?.total || 0,
                    pendingOrders: summary.pendingOrders || 0,
                    deliveredOrders: summary.deliveredOrders || 0,
                    cancelledOrders: summary.cancelledOrders || 0
                }));

                // Check reviews for delivered orders immediately
                if (ordersData.length > 0) {
                    await checkReviewsForOrders(ordersData);
                }
            } else {
                setOrders([]);
                setStats({
                    totalOrders: 0,
                    pendingOrders: 0,
                    deliveredOrders: 0,
                    cancelledOrders: 0,
                    totalSpent: 0,
                    averageOrderValue: 0
                });
            }
        } catch (error) {
            console.error('❌ Error fetching orders:', error);
            setError('Failed to load orders. Please try again.');
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    // Fetch order stats
    const fetchOrderStats = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/orders/stats/${userId}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                // Safe access to stats
                const statsData = response.data.stats || {};
                setStats(prev => ({
                    ...prev,
                    totalSpent: statsData.totalSpent || statsData.totalSpent || 0,
                    averageOrderValue: statsData.averageOrderValue || 0
                }));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            // Don't set error, just log it
        }
    };

    // Check review status for delivered orders
    const checkReviewsForOrders = async (ordersData = orders) => {
        try {
            const deliveredOrders = ordersData.filter(order => order.orderStatus === 'delivered');

            // Prepare all checks
            const checkRequests = [];
            deliveredOrders.forEach(order => {
                order.items.forEach(item => {
                    checkRequests.push({
                        orderId: order.orderId,
                        productId: item.productId,
                        colorId: item.colorId
                    });
                });
            });

            if (checkRequests.length > 0) {
                // ✅ FIX: Add userId to the request
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/reviews/check-multiple`,
                    {
                        checks: checkRequests,
                        userId: userId // ← ADD THIS
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    console.log('Review check results:', response.data.results); // Debug log

                    // Update orders based on results
                    setOrders(prevOrders =>
                        prevOrders.map(order => {
                            const updatedItems = order.items.map(item => {
                                // Find matching check result
                                const checkResult = response.data.results.find(
                                    r => r.orderId === order.orderId &&
                                        r.productId === item.productId &&
                                        r.colorId === item.colorId
                                );

                                if (checkResult && checkResult.hasReviewed) {
                                    // ✅ FIX: Make sure we're using the right field names
                                    return {
                                        ...item,
                                        hasReviewed: true, // Should be true
                                        reviewId: checkResult.reviewId || checkResult._id, // Handle both cases
                                        userRating: checkResult.rating || checkResult.rating,
                                        userReviewText: checkResult.reviewText || ""
                                    };
                                } else {
                                    // Ensure it's false if no review exists
                                    return {
                                        ...item,
                                        hasReviewed: false,
                                        reviewId: null,
                                        userRating: 0,
                                        userReviewText: ""
                                    };
                                }
                            });
                            return { ...order, items: updatedItems };
                        })
                    );
                }
            } else {
                // If no delivered orders, ensure all items have hasReviewed: false
                setOrders(prevOrders =>
                    prevOrders.map(order => ({
                        ...order,
                        items: order.items.map(item => ({
                            ...item,
                            hasReviewed: item.hasReviewed || false
                        }))
                    }))
                );
            }
        } catch (error) {
            console.error('Error checking review status:', error);
            // Even on error, set default state
            setOrders(prevOrders =>
                prevOrders.map(order => ({
                    ...order,
                    items: order.items.map(item => ({
                        ...item,
                        hasReviewed: item.hasReviewed || false
                    }))
                }))
            );
        }
    };

    useEffect(() => {
        fetchUserOrders();
        fetchOrderStats();
    }, [filters.page, filters.status]);

    // Handle order status filter change
    const handleStatusFilter = (status) => {
        setFilters(prev => ({
            ...prev,
            status,
            page: 1 // Reset to first page
        }));
    };

    // View order details
    const handleViewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderDetails(true);
    };

    // Cancel order
    const handleCancelOrder = async (orderId, reason = "Changed my mind") => {
        if (!window.confirm('Are you sure you want to cancel this order?')) {
            return;
        }

        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/orders/${orderId}/cancel`,
                { reason },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                alert('✅ Order cancelled successfully!');
                fetchUserOrders(); // Refresh orders
                fetchOrderStats(); // Refresh stats
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            alert(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    // Track order (simulated)
    const handleTrackOrder = (order) => {
        alert(`Tracking for order ${order.orderId}:\nStatus: ${order.orderStatus}\nEstimated Delivery: ${new Date(order.timeline.estimatedDelivery).toLocaleDateString()}`);
    };

    // Format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    // Format time
    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Calculate delivery date (estimated)
    const getDeliveryDate = (orderDate) => {
        const date = new Date(orderDate);
        date.setDate(date.getDate() + 5); // +5 days for delivery
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Open review modal for writing NEW review
    const handleOpenReviewModal = (order, product) => {
        setSelectedOrder(order);
        setSelectedProduct(product);
        setSelectedReview(null);
        setIsUpdatingReview(false);
        setReviewData({
            rating: 0,
            reviewText: '',
            hoverRating: 0
        });
        setShowReviewModal(true);
    };

    // Open review modal for UPDATING existing review
    const handleOpenUpdateReviewModal = (order, product) => {
        setSelectedOrder(order);
        setSelectedProduct(product);
        setSelectedReview({
            reviewId: product.reviewId,
            rating: product.userRating,
            reviewText: product.userReviewText || ''
        });
        setIsUpdatingReview(true);
        setReviewData({
            rating: product.userRating || 0,
            reviewText: product.userReviewText || '',
            hoverRating: product.userRating || 0
        });
        setShowReviewModal(true);
    };

    // Handle star rating hover
    const handleStarHover = (rating) => {
        setReviewData(prev => ({ ...prev, hoverRating: rating }));
    };

    // Handle star click
    const handleStarClick = (rating) => {
        setReviewData(prev => ({ ...prev, rating }));
    };

    // Submit review (NEW or UPDATE)
    const handleSubmitReview = async () => {
        if (!reviewData.rating) {
            alert('Please select a star rating');
            return;
        }

        if (!selectedOrder || !selectedProduct) {
            alert('Invalid review data');
            return;
        }

        try {
            setSubmittingReview(true);

            if (isUpdatingReview && selectedReview) {
                // UPDATE existing review
                const updatePayload = {
                    userId,
                    rating: reviewData.rating,
                    reviewText: reviewData.reviewText.trim()
                };

                const response = await axios.put(
                    `${import.meta.env.VITE_API_URL}/reviews/update/${selectedReview.reviewId}`,
                    updatePayload,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    alert('✅ Review updated successfully!');
                    setShowReviewModal(false);

                    // Update the order with new review data
                    setOrders(prevOrders =>
                        prevOrders.map(order =>
                            order.orderId === selectedOrder.orderId
                                ? {
                                    ...order,
                                    items: order.items.map(item =>
                                        item.productId === selectedProduct.productId &&
                                            item.colorId === selectedProduct.colorId
                                            ? {
                                                ...item,
                                                hasReviewed: true,
                                                reviewId: selectedReview.reviewId,
                                                userRating: reviewData.rating,
                                                userReviewText: reviewData.reviewText.trim()
                                            }
                                            : item
                                    )
                                }
                                : order
                        )
                    );
                }
            } else {
                // CREATE new review
                const reviewPayload = {
                    userId,
                    userName,
                    orderId: selectedOrder.orderId,
                    productId: selectedProduct.productId,
                    productName: selectedProduct.productName,
                    colorId: selectedProduct.colorId,
                    colorName: selectedProduct.colorName,
                    modelId: selectedProduct.modelId || "",
                    modelName: selectedProduct.modelName || "Default",
                    size: selectedProduct.size || "",
                    rating: reviewData.rating,
                    reviewText: reviewData.reviewText.trim()
                };

                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/reviews/submit`,
                    reviewPayload,
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    alert('✅ Review submitted successfully!');
                    setShowReviewModal(false);

                    // Update the order to mark product as reviewed
                    setOrders(prevOrders =>
                        prevOrders.map(order =>
                            order.orderId === selectedOrder.orderId
                                ? {
                                    ...order,
                                    items: order.items.map(item =>
                                        item.productId === selectedProduct.productId &&
                                            item.colorId === selectedProduct.colorId
                                            ? {
                                                ...item,
                                                hasReviewed: true,
                                                reviewId: response.data.review?.reviewId,
                                                userRating: reviewData.rating,
                                                userReviewText: reviewData.reviewText.trim()
                                            }
                                            : item
                                    )
                                }
                                : order
                        )
                    );
                }
            }
        } catch (error) {
            console.error('❌ Error submitting/updating review:', error);
            alert(error.response?.data?.message || `Failed to ${isUpdatingReview ? 'update' : 'submit'} review`);
        } finally {
            setSubmittingReview(false);
        }
    };

    // Delete review
    const handleDeleteReview = async (reviewId, order, product) => {
        if (!window.confirm('Are you sure you want to delete this review?')) {
            return;
        }

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/reviews/${reviewId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { userId }
                }
            );

            if (response.data.success) {
                alert('✅ Review deleted successfully!');

                // Update the order to mark product as not reviewed
                setOrders(prevOrders =>
                    prevOrders.map(o =>
                        o.orderId === order.orderId
                            ? {
                                ...o,
                                items: o.items.map(item =>
                                    item.productId === product.productId &&
                                        item.colorId === product.colorId
                                        ? {
                                            ...item,
                                            hasReviewed: false,
                                            reviewId: null,
                                            userRating: 0,
                                            userReviewText: ""
                                        }
                                        : item
                                )
                            }
                            : o
                    )
                );
            }
        } catch (error) {
            console.error('❌ Error deleting review:', error);
            alert(error.response?.data?.message || 'Failed to delete review');
        }
    };

    // Render star rating component
    const renderStars = () => {
        const stars = [];
        const displayRating = reviewData.hoverRating || reviewData.rating;

        for (let i = 1; i <= 5; i++) {
            stars.push(
                <button
                    key={i}
                    type="button"
                    className={`star-btn ${i <= displayRating ? 'active' : ''}`}
                    onClick={() => handleStarClick(i)}
                    onMouseEnter={() => handleStarHover(i)}
                    onMouseLeave={() => handleStarHover(0)}
                    disabled={submittingReview}
                >
                    {i <= displayRating ? '★' : '☆'}
                </button>
            );
        }
        return stars;
    };

    // Render order card
    const renderOrderCard = (order) => (
        <div key={order._id} className="order-card">
            <div className="order-header">
                <div className="order-info">
                    <div className="order-id-status">
                        <h3 className="order-id">Order #{order.orderId}</h3>
                        <div
                            className="order-status-badge"
                            style={{ backgroundColor: statusColors[order.orderStatus] || '#666' }}
                        >
                            {statusIcons[order.orderStatus]} {order.orderStatus.toUpperCase()}
                        </div>
                    </div>
                    <div className="order-meta">
                        <span className="order-date">
                            📅 Placed on {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                        </span>
                        {order.checkoutMode === 'buy-now' && (
                            <span className="order-mode-badge">Buy Now</span>
                        )}
                    </div>
                </div>
                <div className="order-total">
                    <span className="total-label">Total</span>
                    <span className="total-amount">₹{order.pricing.total.toLocaleString()}</span>
                </div>
            </div>

            <div className="order-items-preview">
                {order.items.slice(0, 2).map((item, index) => (
                    <div key={index} className="order-item-preview">
                        <div className="item-image">
                            <div className="image-placeholder">
                                {item.productName.charAt(0)}
                            </div>
                        </div>
                        <div className="item-details">
                            <h4 className="item-name">{item.productName}</h4>
                            <div className="item-variants">
                                {item.modelName !== "Default" && (
                                    <span className="variant-chip">{item.modelName}</span>
                                )}
                                <span className="variant-chip">{item.colorName}</span>
                                {item.size && (
                                    <span className="variant-chip">Size: {item.size}</span>
                                )}
                            </div>
                            <div className="item-quantity-price">
                                <span className="quantity">Qty: {item.quantity}</span>
                                <span className="price">₹{item.totalPrice.toLocaleString()}</span>
                            </div>

                            {/* Review button for delivered items */}
                            {order.orderStatus === 'delivered' && (
                                <div className="item-review-section">
                                    {item.hasReviewed ? (
                                        <div className="reviewed-actions">
                                            <span className="reviewed-badge">
                                                ⭐ Rated: {item.userRating}/5
                                            </span>
                                            <div className="review-buttons">
                                                <button
                                                    className="update-review-btn small"
                                                    onClick={() => handleOpenUpdateReviewModal(order, item)}
                                                >
                                                    ✏️ Edit
                                                </button>
                                                <button
                                                    className="delete-review-btn small"
                                                    onClick={() => handleDeleteReview(item.reviewId, order, item)}
                                                >
                                                    🗑️ Delete
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            className="review-btn"
                                            onClick={() => handleOpenReviewModal(order, item)}
                                        >
                                            ⭐ Write Review
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {order.items.length > 2 && (
                    <div className="more-items">
                        + {order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            <div className="order-summary-preview">
                <div className="summary-row">
                    <span>Items:</span>
                    <span>{order.items.length} item{order.items.length > 1 ? 's' : ''}</span>
                </div>
                <div className="summary-row">
                    <span>Delivery to:</span>
                    <span className="delivery-address">
                        {order.deliveryAddress.city}, {order.deliveryAddress.state}
                    </span>
                </div>
                <div className="summary-row">
                    <span>Expected delivery:</span>
                    <span className="delivery-date">
                        {getDeliveryDate(order.createdAt)}
                    </span>
                </div>
            </div>

            <div className="order-actions">
                <button
                    className="action-btn view-details-btn"
                    onClick={() => handleViewOrderDetails(order)}
                >
                    📋 View Details
                </button>

                {order.orderStatus === 'pending' || order.orderStatus === 'processing' ? (
                    <button
                        className="action-btn cancel-btn"
                        onClick={() => handleCancelOrder(order.orderId)}
                    >
                        ❌ Cancel Order
                    </button>
                ) : order.orderStatus === 'shipped' ? (
                    <button
                        className="action-btn track-btn"
                        onClick={() => handleTrackOrder(order)}
                    >
                        🚚 Track Order
                    </button>
                ) : null}
            </div>
        </div>
    );

    // Render order details modal
    const renderOrderDetails = () => (
        <div className="order-details-modal">
            <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>Order Details - #{selectedOrder.orderId}</h2>
                    <button
                        className="close-btn"
                        onClick={() => setShowOrderDetails(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="order-details-content">
                    {/* Order Status Timeline */}
                    <div className="order-timeline">
                        <h3>Order Status</h3>
                        <div className="timeline">
                            <div className={`timeline-step ${selectedOrder.orderStatus === 'pending' ? 'active' : ''}`}>
                                <div className="step-icon">⏳</div>
                                <div className="step-info">
                                    <span className="step-title">Order Placed</span>
                                    <span className="step-date">{formatDate(selectedOrder.createdAt)}</span>
                                </div>
                            </div>

                            <div className={`timeline-step ${selectedOrder.orderStatus === 'processing' ||
                                selectedOrder.orderStatus === 'shipped' ||
                                selectedOrder.orderStatus === 'delivered' ? 'active' : ''}`}>
                                <div className="step-icon">🔄</div>
                                <div className="step-info">
                                    <span className="step-title">Processing</span>
                                    {selectedOrder.timeline.processedAt && (
                                        <span className="step-date">{formatDate(selectedOrder.timeline.processedAt)}</span>
                                    )}
                                </div>
                            </div>

                            <div className={`timeline-step ${selectedOrder.orderStatus === 'shipped' ||
                                selectedOrder.orderStatus === 'delivered' ? 'active' : ''}`}>
                                <div className="step-icon">🚚</div>
                                <div className="step-info">
                                    <span className="step-title">Shipped</span>
                                    {selectedOrder.timeline.shippedAt && (
                                        <span className="step-date">{formatDate(selectedOrder.timeline.shippedAt)}</span>
                                    )}
                                </div>
                            </div>

                            <div className={`timeline-step ${selectedOrder.orderStatus === 'delivered' ? 'active' : ''}`}>
                                <div className="step-icon">✅</div>
                                <div className="step-info">
                                    <span className="step-title">Delivered</span>
                                    {selectedOrder.timeline.deliveredAt && (
                                        <span className="step-date">{formatDate(selectedOrder.timeline.deliveredAt)}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div className="order-items-full">
                        <h3>Order Items</h3>
                        {selectedOrder.items.map((item, index) => (
                            <div key={index} className="order-item-full">
                                <div className="item-image">
                                    <div className="image-placeholder">
                                        {item.productName.charAt(0)}
                                    </div>
                                </div>
                                <div className="item-details-full">
                                    <h4 className="item-name">{item.productName}</h4>
                                    <div className="item-variants">
                                        {item.modelName !== "Default" && (
                                            <span className="variant-chip">{item.modelName}</span>
                                        )}
                                        <span className="variant-chip">{item.colorName}</span>
                                        {item.size && (
                                            <span className="variant-chip">Size: {item.size}</span>
                                        )}
                                    </div>
                                    <div className="item-pricing">
                                        <div className="price-breakdown">
                                            <span className="price-label">Price:</span>
                                            <span className="price">₹{item.offerPrice.toLocaleString()}</span>
                                            {item.offerPercentage > 0 && (
                                                <span className="original-price struck">₹{item.unitPrice.toLocaleString()}</span>
                                            )}
                                        </div>
                                        {item.offerPercentage > 0 && (
                                            <div className="offer-details">
                                                <span className="offer-badge">{item.offerPercentage}% OFF</span>
                                                <span className="savings">Saved: ₹{item.savedAmount.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="quantity-total">
                                            <span>Quantity: {item.quantity}</span>
                                            <span className="item-total">₹{item.totalPrice.toLocaleString()}</span>
                                        </div>
                                    </div>

                                    {/* Review section in order details modal */}
                                    {selectedOrder.orderStatus === 'delivered' && (
                                        <div className="item-review-actions">
                                            {item.hasReviewed ? (
                                                <div className="review-status">
                                                    <div className="review-info">
                                                        <span className="reviewed-text">
                                                            ⭐ You rated: <strong>{item.userRating}/5</strong>
                                                        </span>
                                                        {item.userReviewText && (
                                                            <p className="review-preview">
                                                                "{item.userReviewText.length > 100 ?
                                                                    item.userReviewText.substring(0, 100) + '...' :
                                                                    item.userReviewText}"
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="review-buttons">
                                                        <button
                                                            className="btn primary small"
                                                            onClick={() => handleOpenUpdateReviewModal(selectedOrder, item)}
                                                        >
                                                            ✏️ Edit Review
                                                        </button>
                                                        <button
                                                            className="btn danger small"
                                                            onClick={() => handleDeleteReview(item.reviewId, selectedOrder, item)}
                                                        >
                                                            🗑️ Delete
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className="btn primary small write-review-btn"
                                                    onClick={() => {
                                                        setShowOrderDetails(false);
                                                        setTimeout(() => {
                                                            handleOpenReviewModal(selectedOrder, item);
                                                        }, 300);
                                                    }}
                                                >
                                                    ⭐ Write a Review
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Delivery Address */}
                    <div className="delivery-address-details">
                        <h3>Delivery Address</h3>
                        <div className="address-card">
                            <div className="address-header">
                                <h4>{selectedOrder.deliveryAddress.fullName}</h4>
                                {selectedOrder.deliveryAddress.isDefault && (
                                    <span className="default-badge">Default</span>
                                )}
                            </div>
                            <p className="address-contact">
                                📱 {selectedOrder.deliveryAddress.mobile}
                                {selectedOrder.deliveryAddress.email && ` | ✉️ ${selectedOrder.deliveryAddress.email}`}
                            </p>
                            <div className="address-lines">
                                <p>{selectedOrder.deliveryAddress.addressLine1}</p>
                                {selectedOrder.deliveryAddress.addressLine2 && (
                                    <p>{selectedOrder.deliveryAddress.addressLine2}</p>
                                )}
                                {selectedOrder.deliveryAddress.landmark && (
                                    <p><strong>Landmark:</strong> {selectedOrder.deliveryAddress.landmark}</p>
                                )}
                                <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}</p>
                                <p>{selectedOrder.deliveryAddress.country}</p>
                            </div>
                            {selectedOrder.deliveryAddress.instructions && (
                                <div className="delivery-instructions">
                                    <p><strong>Instructions:</strong> {selectedOrder.deliveryAddress.instructions}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="order-summary-full">
                        <h3>Order Summary</h3>
                        <div className="summary-details">
                            <div className="summary-row">
                                <span>Subtotal ({selectedOrder.items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
                                <span>₹{selectedOrder.pricing.subtotal.toLocaleString()}</span>
                            </div>

                            {selectedOrder.pricing.totalSavings > 0 && (
                                <div className="summary-row discount">
                                    <span>Total Savings</span>
                                    <span className="savings">-₹{selectedOrder.pricing.totalSavings.toLocaleString()}</span>
                                </div>
                            )}

                            <div className="summary-row">
                                <span>Shipping</span>
                                <span className={selectedOrder.pricing.shipping === 0 ? 'free' : ''}>
                                    {selectedOrder.pricing.shipping === 0 ? 'FREE' : `₹${selectedOrder.pricing.shipping}`}
                                </span>
                            </div>

                            <div className="summary-row">
                                <span>Tax (GST {selectedOrder.pricing.taxPercentage}%)</span>
                                <span>₹{selectedOrder.pricing.tax.toLocaleString()}</span>
                            </div>

                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span className="total-amount">₹{selectedOrder.pricing.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment Details */}
                    <div className="payment-details">
                        <h3>Payment Details</h3>
                        <div className="payment-card">
                            <div className="payment-method">
                                <span className="method-icon">
                                    {selectedOrder.payment.method === 'cod' ? '💵' :
                                        selectedOrder.payment.method === 'card' ? '💳' : '📱'}
                                </span>
                                <div className="method-info">
                                    <span className="method-name">
                                        {selectedOrder.payment.method === 'cod' ? 'Cash on Delivery' :
                                            selectedOrder.payment.method === 'card' ? 'Credit/Debit Card' : 'UPI'}
                                    </span>
                                    <span className="method-status">
                                        Status: <span className={`status-${selectedOrder.payment.status}`}>
                                            {selectedOrder.payment.status.toUpperCase()}
                                        </span>
                                    </span>
                                </div>
                            </div>
                            {selectedOrder.payment.paidAmount && (
                                <div className="payment-amount">
                                    <span>Paid Amount:</span>
                                    <span className="paid-amount">₹{selectedOrder.payment.paidAmount.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn primary"
                        onClick={() => {
                            handleTrackOrder(selectedOrder);
                        }}
                    >
                        🚚 Track Order
                    </button>
                    <button
                        className="btn secondary"
                        onClick={() => setShowOrderDetails(false)}
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );

    // Render Review Modal
    const renderReviewModal = () => (
        <div className="review-modal">
            <div className="modal-overlay" onClick={() => !submittingReview && setShowReviewModal(false)}></div>
            <div className="modal-content review-modal-content">
                <div className="modal-header">
                    <h2>{isUpdatingReview ? 'Update Review' : 'Write a Review'}</h2>
                    <button
                        className="close-btn"
                        onClick={() => !submittingReview && setShowReviewModal(false)}
                        disabled={submittingReview}
                    >
                        ✕
                    </button>
                </div>

                <div className="review-product-info">
                    <h3>{selectedProduct?.productName}</h3>
                    <div className="product-variants">
                        {selectedProduct?.modelName !== "Default" && (
                            <span className="variant-chip">{selectedProduct?.modelName}</span>
                        )}
                        <span className="variant-chip">{selectedProduct?.colorName}</span>
                        {selectedProduct?.size && (
                            <span className="variant-chip">Size: {selectedProduct?.size}</span>
                        )}
                    </div>
                    <p className="order-info">Order #{selectedOrder?.orderId}</p>
                </div>

                <div className="review-form">
                    <div className="rating-section">
                        <label>Your Rating *</label>
                        <div className="star-rating">
                            {renderStars()}
                            <span className="rating-text">
                                {reviewData.rating > 0 ? `${reviewData.rating} star${reviewData.rating > 1 ? 's' : ''}` : 'Select rating'}
                            </span>
                        </div>
                    </div>

                    <div className="review-text-section">
                        <label>Your Review {isUpdatingReview ? '(Update)' : '(Optional)'}</label>
                        <textarea
                            className="review-textarea"
                            placeholder="Share your experience with this product..."
                            value={reviewData.reviewText}
                            onChange={(e) => setReviewData(prev => ({ ...prev, reviewText: e.target.value }))}
                            rows={5}
                            maxLength={1000}
                            disabled={submittingReview}
                        />
                        <div className="char-count">
                            {reviewData.reviewText.length}/1000 characters
                        </div>
                    </div>

                    <div className="review-note">
                        <p>⭐ Your review will help other shoppers make better decisions</p>
                        <p>✅ This is a verified purchase from Order #{selectedOrder?.orderId}</p>
                        {isUpdatingReview && (
                            <p>✏️ You are updating your existing review</p>
                        )}
                    </div>
                </div>

                <div className="modal-actions">
                    <button
                        className="btn secondary"
                        onClick={() => !submittingReview && setShowReviewModal(false)}
                        disabled={submittingReview}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn primary submit-review-btn"
                        onClick={handleSubmitReview}
                        disabled={submittingReview || reviewData.rating === 0}
                    >
                        {submittingReview ? (
                            <>
                                <span className="spinner-small"></span> {isUpdatingReview ? 'Updating...' : 'Submitting...'}
                            </>
                        ) : (
                            isUpdatingReview ? 'Update Review' : 'Submit Review'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    // Render empty state
    const renderEmptyState = () => (
        <div className="empty-orders">
            <div className="empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>You haven't placed any orders yet. Start shopping!</p>
            <button
                className="shop-now-btn"
                onClick={() => navigate('/products')}
            >
                Start Shopping
            </button>
        </div>
    );

    // Render loading state
    const renderLoading = () => (
        <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
        </div>
    );

    // Render error state
    const renderError = () => (
        <div className="error-container">
            <div className="error-icon">❌</div>
            <h2>Unable to load orders</h2>
            <p>{error}</p>
            <button
                className="retry-btn"
                onClick={fetchUserOrders}
            >
                Retry
            </button>
        </div>
    );

    if (!token || !userId) {
        return (
            <div className="login-required">
                <h2>Login Required</h2>
                <p>Please login to view your orders.</p>
                <button onClick={() => navigate('/login')} className="auth-btn">
                    Go to Login
                </button>
            </div>
        );
    }

    if (loading) return renderLoading();
    if (error) return renderError();

    return (
        <div className="user-orders-container">
            {/* Header */}
            <div className="orders-header">
                <h1>My Orders</h1>
                <div className="stats-summary">
                    <div className="stat-card">
                        <span className="stat-value">{stats.totalOrders || 0}</span>
                        <span className="stat-label">Total Orders</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.pendingOrders || 0}</span>
                        <span className="stat-label">Pending</span>
                    </div>
                    <div className="stat-card">
                        <span className="stat-value">{stats.deliveredOrders || 0}</span>
                        <span className="stat-label">Delivered</span>
                    </div>
                </div>
            </div>

            {/* Status Filters */}
            <div className="status-filters">
                <button
                    className={`filter-btn ${filters.status === 'all' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('all')}
                >
                    All Orders
                </button>
                <button
                    className={`filter-btn ${filters.status === 'pending' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('pending')}
                >
                    ⏳ Pending
                </button>
                <button
                    className={`filter-btn ${filters.status === 'processing' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('processing')}
                >
                    🔄 Processing
                </button>
                <button
                    className={`filter-btn ${filters.status === 'shipped' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('shipped')}
                >
                    🚚 Shipped
                </button>
                <button
                    className={`filter-btn ${filters.status === 'delivered' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('delivered')}
                >
                    ✅ Delivered
                </button>
                <button
                    className={`filter-btn ${filters.status === 'cancelled' ? 'active' : ''}`}
                    onClick={() => handleStatusFilter('cancelled')}
                >
                    ❌ Cancelled
                </button>
            </div>

            {/* Orders List */}
            <div className="orders-list">
                {orders.length === 0 ? (
                    renderEmptyState()
                ) : (
                    <>
                        {orders.map(renderOrderCard)}

                        {/* Pagination */}
                        {stats.totalOrders > filters.limit && (
                            <div className="pagination">
                                <button
                                    className="page-btn"
                                    disabled={filters.page === 1}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    ← Previous
                                </button>
                                <span className="page-info">
                                    Page {filters.page} of {Math.ceil(stats.totalOrders / filters.limit)}
                                </span>
                                <button
                                    className="page-btn"
                                    disabled={filters.page >= Math.ceil(stats.totalOrders / filters.limit)}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Next →
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && renderOrderDetails()}

            {/* Review Modal */}
            {showReviewModal && selectedProduct && renderReviewModal()}
        </div>
    );
};

export default UserOrders;