import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiShoppingBag,
  FiTag,
  FiStar,
  FiEdit2,
  FiTrash2,
  FiEye,
  FiMapPin,
  FiCreditCard,
  FiCalendar,
  FiUser,
  FiRefreshCw,
  FiFilter,
  FiChevronLeft,
  FiChevronRight,
  FiShoppingCart,
  FiAlertCircle,
  FiArrowLeft
} from 'react-icons/fi';
import { MdLocalShipping, MdOutlineRateReview } from 'react-icons/md';
import { RiCouponLine } from 'react-icons/ri';
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

    // Status configurations
    const statusConfig = {
        'pending': {
            color: '#FF9800',
            icon: <FiClock />,
            bgColor: '#FFF3E0'
        },
        'processing': {
            color: '#2196F3',
            icon: <FiRefreshCw />,
            bgColor: '#E3F2FD'
        },
        'shipped': {
            color: '#673AB7',
            icon: <FiTruck />,
            bgColor: '#EDE7F6'
        },
        'delivered': {
            color: '#4CAF50',
            icon: <FiCheckCircle />,
            bgColor: '#E8F5E9'
        },
        'cancelled': {
            color: '#F44336',
            icon: <FiXCircle />,
            bgColor: '#FFEBEE'
        },
        'returned': {
            color: '#795548',
            icon: <FiArrowLeft />,
            bgColor: '#EFEBE9'
        }
    };

    // Fetch user orders
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

                // Check reviews for delivered orders
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
            toast.error('Failed to load orders');
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
                const statsData = response.data.stats || {};
                setStats(prev => ({
                    ...prev,
                    totalSpent: statsData.totalSpent || 0,
                    averageOrderValue: statsData.averageOrderValue || 0
                }));
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    // Check review status for delivered orders
    const checkReviewsForOrders = async (ordersData = orders) => {
        try {
            const deliveredOrders = ordersData.filter(order => order.orderStatus === 'delivered');

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
                const response = await axios.post(
                    `${import.meta.env.VITE_API_URL}/reviews/check-multiple`,
                    {
                        checks: checkRequests,
                        userId: userId
                    },
                    {
                        headers: { Authorization: `Bearer ${token}` }
                    }
                );

                if (response.data.success) {
                    setOrders(prevOrders =>
                        prevOrders.map(order => {
                            const updatedItems = order.items.map(item => {
                                const checkResult = response.data.results.find(
                                    r => r.orderId === order.orderId &&
                                        r.productId === item.productId &&
                                        r.colorId === item.colorId
                                );

                                if (checkResult && checkResult.hasReviewed) {
                                    return {
                                        ...item,
                                        hasReviewed: true,
                                        reviewId: checkResult.reviewId || checkResult._id,
                                        userRating: checkResult.rating || 0,
                                        userReviewText: checkResult.reviewText || ""
                                    };
                                } else {
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
            }
        } catch (error) {
            console.error('Error checking review status:', error);
        }
    };

    useEffect(() => {
        fetchUserOrders();
        fetchOrderStats();
    }, [filters.page, filters.status]);

    // Handle status filter
    const handleStatusFilter = (status) => {
        setFilters(prev => ({
            ...prev,
            status,
            page: 1
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
                toast.success('Order cancelled successfully!');
                fetchUserOrders();
                fetchOrderStats();
            }
        } catch (error) {
            console.error('❌ Error cancelling order:', error);
            toast.error(error.response?.data?.message || 'Failed to cancel order');
        }
    };

    // Track order
    const handleTrackOrder = (order) => {
        toast.info(`Tracking order ${order.orderId}. Status: ${order.orderStatus}`);
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

    // Calculate delivery date
    const getDeliveryDate = (orderDate) => {
        const date = new Date(orderDate);
        date.setDate(date.getDate() + 5);
        return date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
        });
    };

    // Open review modal for new review
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

    // Open review modal for updating review
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

    // Handle star hover
    const handleStarHover = (rating) => {
        setReviewData(prev => ({ ...prev, hoverRating: rating }));
    };

    // Handle star click
    const handleStarClick = (rating) => {
        setReviewData(prev => ({ ...prev, rating }));
    };

    // Submit review
    const handleSubmitReview = async () => {
        if (!reviewData.rating) {
            toast.warning('Please select a star rating');
            return;
        }

        if (!selectedOrder || !selectedProduct) {
            toast.error('Invalid review data');
            return;
        }

        try {
            setSubmittingReview(true);

            if (isUpdatingReview && selectedReview) {
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
                    toast.success('Review updated successfully!');
                    setShowReviewModal(false);

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
                const reviewPayload = {
                    userId,
                    userName,
                    orderId: selectedOrder.orderId,
                    productId: selectedProduct.productId,
                    productName: selectedProduct.productName,
                    colorId: selectedProduct.colorId,
                    colorName: selectedProduct.colorName,
                    fragrance: selectedProduct.fragrance || "",
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
                    toast.success('Review submitted successfully!');
                    setShowReviewModal(false);

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
            console.error('❌ Error submitting review:', error);
            toast.error(error.response?.data?.message || `Failed to ${isUpdatingReview ? 'update' : 'submit'} review`);
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
                toast.success('Review deleted successfully!');

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
            toast.error(error.response?.data?.message || 'Failed to delete review');
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
                    <FiStar className="star-icon" />
                </button>
            );
        }
        return stars;
    };

    // Get current status step
    const getCurrentStatusStep = (orderStatus) => {
        const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
        return statusOrder.indexOf(orderStatus) + 1;
    };

    // Render order card
    const renderOrderCard = (order) => {
        const status = statusConfig[order.orderStatus] || statusConfig.pending;

        return (
            <div key={order._id} className="order-card">
                <div className="order-header">
                    <div className="order-meta">
                        <div className="order-id-section">
                            <h3 className="order-id">
                                <FiPackage className="order-icon" /> Order #{order.orderId}
                            </h3>
                            <div className="order-date">
                                <FiCalendar className="date-icon" />
                                {formatDate(order.createdAt)} at {formatTime(order.createdAt)}
                            </div>
                        </div>
                        <div className="order-status-tag" style={{ 
                            backgroundColor: status.bgColor,
                            color: status.color,
                            borderColor: status.color
                        }}>
                            {status.icon}
                            <span className="status-text">{order.orderStatus.toUpperCase()}</span>
                        </div>
                    </div>

                    <div className="order-summary">
                        <div className="order-total">
                            <span className="total-label">Total Amount</span>
                            <span className="total-amount">₹{order.pricing.total.toLocaleString()}</span>
                        </div>
                        {order.checkoutMode === 'buy-now' && (
                            <div className="order-mode">
                                <RiCouponLine className="mode-icon" />
                                <span>Buy Now</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="order-items-grid">
                    {order.items.slice(0, 4).map((item, index) => (
                        <div key={index} className="order-item-grid">
                            <div className="item-image-grid">
                                {item.productImage ? (
                                    <img 
                                        src={item.productImage} 
                                        alt={item.productName}
                                        className="product-image"
                                    />
                                ) : (
                                    <div className="image-placeholder">
                                        {item.productName.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="item-info-grid">
                                <h4 className="item-name-grid">{item.productName}</h4>
                                <div className="item-variants-grid">
                                    {item.fragrance && item.fragrance !== "Default" && (
                                        <span className="variant-tag">
                                            <FiTag className="variant-icon" />
                                            {item.fragrance}
                                        </span>
                                    )}
                                    {item.modelName !== "Default" && (
                                        <span className="variant-tag">
                                            <FiShoppingBag className="variant-icon" />
                                            {item.modelName}
                                        </span>
                                    )}
                                </div>
                                <div className="item-footer-grid">
                                    <div className="item-quantity-price">
                                        <span className="quantity">Qty: {item.quantity}</span>
                                        <span className="price">₹{item.totalPrice.toLocaleString()}</span>
                                    </div>

                                    {order.orderStatus === 'delivered' && (
                                        <div className="item-review-grid">
                                            {item.hasReviewed ? (
                                                <div className="reviewed-grid">
                                                    <span className="rating-badge">
                                                        <FiStar className="star-icon" />
                                                        {item.userRating}/5
                                                    </span>
                                                    <div className="review-actions-grid">
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={() => handleOpenUpdateReviewModal(order, item)}
                                                        >
                                                            <FiEdit2 />
                                                        </button>
                                                        <button
                                                            className="action-btn delete-btn"
                                                            onClick={() => handleDeleteReview(item.reviewId, order, item)}
                                                        >
                                                            <FiTrash2 />
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    className="write-review-btn"
                                                    onClick={() => handleOpenReviewModal(order, item)}
                                                >
                                                    <MdOutlineRateReview className="review-icon" />
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {order.items.length > 4 && (
                        <div className="more-items">
                            + {order.items.length - 4} more item{order.items.length - 4 > 1 ? 's' : ''}
                        </div>
                    )}
                </div>

                <div className="order-footer">
                    <div className="delivery-info">
                        <div className="info-item">
                            <FiMapPin className="info-icon" />
                            <span>Delivery to: {order.deliveryAddress.city}</span>
                        </div>
                        <div className="info-item">
                            <FiTruck className="info-icon" />
                            <span>Est. delivery: {getDeliveryDate(order.createdAt)}</span>
                        </div>
                    </div>

                    <div className="order-actions">
                        <button
                            className="btn primary-btn view-details"
                            onClick={() => handleViewOrderDetails(order)}
                        >
                            <FiEye />
                            View Details
                        </button>

                        {order.orderStatus === 'pending' || order.orderStatus === 'processing' ? (
                            <button
                                className="btn danger-btn cancel-order"
                                onClick={() => handleCancelOrder(order.orderId)}
                            >
                                <FiXCircle />
                                Cancel Order
                            </button>
                        ) : order.orderStatus === 'shipped' ? (
                            <button
                                className="btn secondary-btn track-order"
                                onClick={() => handleTrackOrder(order)}
                            >
                                <FiTruck />
                                Track Order
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>
        );
    };

    // Render order details modal
    const renderOrderDetails = () => (
        <div className="order-details-modal">
            <div className="modal-overlay" onClick={() => setShowOrderDetails(false)}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiPackage className="header-icon" />
                        Order Details - #{selectedOrder.orderId}
                    </h2>
                    <button
                        className="close-btn"
                        onClick={() => setShowOrderDetails(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="details-section">
                        <h3 className="section-title">
                            <FiClock className="section-icon" />
                            Order Status
                        </h3>
                        <div className="status-timeline">
                            {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => {
                                const config = statusConfig[status];
                                const isActive = getCurrentStatusStep(selectedOrder.orderStatus) >= (index + 1);
                                const isCurrent = selectedOrder.orderStatus === status;
                                
                                return (
                                    <div key={status} className={`timeline-step ${isActive ? 'active' : ''} ${isCurrent ? 'current' : ''}`}>
                                        <div className="step-icon" style={{ 
                                            backgroundColor: isCurrent ? config.color : (isActive ? config.color : '#eee'),
                                            color: isActive ? '#fff' : '#999'
                                        }}>
                                            {config.icon}
                                        </div>
                                        <div className="step-info">
                                            <span className="step-title">{status.toUpperCase()}</span>
                                            {isCurrent && (
                                                <span className="current-indicator">Current Status</span>
                                            )}
                                            {selectedOrder.timeline[`${status}At`] && (
                                                <span className="step-date">
                                                    {formatDate(selectedOrder.timeline[`${status}At`])}
                                                </span>
                                            )}
                                        </div>
                                        {index < 3 && (
                                            <div className="step-connector" style={{ 
                                                backgroundColor: isActive ? config.color : '#eee'
                                            }}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="details-section">
                        <h3 className="section-title">
                            <FiShoppingBag className="section-icon" />
                            Order Items
                        </h3>
                        <div className="order-items-list">
                            {selectedOrder.items.map((item, index) => (
                                <div key={index} className="order-item-detail">
                                    <div className="item-header-detail">
                                        <div className="item-image-detail">
                                            {item.productImage ? (
                                                <img 
                                                    src={item.productImage} 
                                                    alt={item.productName}
                                                    className="product-image-detail"
                                                />
                                            ) : (
                                                <div className="image-placeholder-detail">
                                                    {item.productName.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="item-content-detail">
                                            <div className="item-header">
                                                <h4>{item.productName}</h4>
                                                <span className="item-price">₹{item.totalPrice.toLocaleString()}</span>
                                            </div>
                                            <div className="item-details">
                                                <div className="variants">
                                                    {item.fragrance && item.fragrance !== "Default" && (
                                                        <span className="variant">{item.fragrance}</span>
                                                    )}
                                                    {item.modelName !== "Default" && (
                                                        <span className="variant">{item.modelName}</span>
                                                    )}
                                                    {item.size && <span className="variant">Size: {item.size}</span>}
                                                </div>
                                                <div className="item-meta">
                                                    <span>Quantity: {item.quantity}</span>
                                                    <span>Price: ₹{item.offerPrice.toLocaleString()}</span>
                                                    {item.offerPercentage > 0 && (
                                                        <span className="discount">Saved: ₹{item.savedAmount.toLocaleString()}</span>
                                                    )}
                                                </div>
                                                {selectedOrder.orderStatus === 'delivered' && (
                                                    <div className="review-section">
                                                        {item.hasReviewed ? (
                                                            <div className="reviewed-item">
                                                                <div className="review-rating">
                                                                    <FiStar className="star-filled" />
                                                                    <span>{item.userRating}/5</span>
                                                                </div>
                                                                <div className="review-actions">
                                                                    <button
                                                                        className="btn small-btn"
                                                                        onClick={() => handleOpenUpdateReviewModal(selectedOrder, item)}
                                                                    >
                                                                        <FiEdit2 /> Edit
                                                                    </button>
                                                                    <button
                                                                        className="btn small-btn danger"
                                                                        onClick={() => handleDeleteReview(item.reviewId, selectedOrder, item)}
                                                                    >
                                                                        <FiTrash2 /> Delete
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                className="btn primary-btn small-btn"
                                                                onClick={() => {
                                                                    setShowOrderDetails(false);
                                                                    setTimeout(() => handleOpenReviewModal(selectedOrder, item), 300);
                                                                }}
                                                            >
                                                                <MdOutlineRateReview /> Write Review
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="details-grid">
                        <div className="details-section">
                            <h3 className="section-title">
                                <FiMapPin className="section-icon" />
                                Delivery Address
                            </h3>
                            <div className="address-card">
                                <div className="address-header">
                                    <h4>{selectedOrder.deliveryAddress.fullName}</h4>
                                    {selectedOrder.deliveryAddress.isDefault && (
                                        <span className="default-badge">Default</span>
                                    )}
                                </div>
                                <p className="address-contact">
                                    <FiUser /> {selectedOrder.deliveryAddress.mobile}
                                </p>
                                <div className="address-lines">
                                    <p>{selectedOrder.deliveryAddress.addressLine1}</p>
                                    {selectedOrder.deliveryAddress.addressLine2 && <p>{selectedOrder.deliveryAddress.addressLine2}</p>}
                                    <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} - {selectedOrder.deliveryAddress.pincode}</p>
                                </div>
                            </div>
                        </div>

                        <div className="details-section">
                            <h3 className="section-title">
                                <FiCreditCard className="section-icon" />
                                Payment Details
                            </h3>
                            <div className="payment-card">
                                <div className="payment-method">
                                    <div className="method-icon">
                                        {selectedOrder.payment.method === 'cod' ? '💵' : '💳'}
                                    </div>
                                    <div className="method-info">
                                        <span className="method-name">
                                            {selectedOrder.payment.method === 'cod' ? 'Cash on Delivery' : 'Card Payment'}
                                        </span>
                                        <span className="method-status">
                                            Status: <span className={`status-${selectedOrder.payment.status}`}>
                                                {selectedOrder.payment.status}
                                            </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="details-section">
                        <h3 className="section-title">Order Summary</h3>
                        <div className="order-summary-details">
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
                                <span>Tax (GST)</span>
                                <span>₹{selectedOrder.pricing.tax.toLocaleString()}</span>
                            </div>
                            <div className="summary-row total">
                                <span>Total Amount</span>
                                <span className="total-amount">₹{selectedOrder.pricing.total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render review modal
    const renderReviewModal = () => (
        <div className="review-modal">
            <div className="modal-overlay" onClick={() => !submittingReview && setShowReviewModal(false)}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <MdOutlineRateReview className="header-icon" />
                        {isUpdatingReview ? 'Update Review' : 'Write a Review'}
                    </h2>
                    <button
                        className="close-btn"
                        onClick={() => !submittingReview && setShowReviewModal(false)}
                        disabled={submittingReview}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="product-info">
                        <h3>{selectedProduct?.productName}</h3>
                        <div className="product-meta">
                            <span>Order #{selectedOrder?.orderId}</span>
                            {selectedProduct?.fragrance && selectedProduct.fragrance !== "Default" && (
                                <span>Fragrance: {selectedProduct.fragrance}</span>
                            )}
                            <span>Delivered on {formatDate(selectedOrder?.createdAt)}</span>
                        </div>
                    </div>

                    <div className="review-form">
                        <div className="rating-section">
                            <label>Your Rating *</label>
                            <div className="star-rating">
                                <div className="stars-container">
                                    {renderStars()}
                                </div>
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
                                rows={4}
                                maxLength={500}
                                disabled={submittingReview}
                            />
                            <div className="char-count">
                                {reviewData.reviewText.length}/500 characters
                            </div>
                        </div>

                        <div className="review-note">
                            <p><FiCheckCircle className="note-icon" /> This is a verified purchase</p>
                            <p><FiStar className="note-icon" /> Your review helps other shoppers</p>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn secondary-btn"
                            onClick={() => !submittingReview && setShowReviewModal(false)}
                            disabled={submittingReview}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn primary-btn"
                            onClick={handleSubmitReview}
                            disabled={submittingReview || reviewData.rating === 0}
                        >
                            {submittingReview ? (
                                <>
                                    <FiRefreshCw className="spinner" />
                                    {isUpdatingReview ? 'Updating...' : 'Submitting...'}
                                </>
                            ) : (
                                isUpdatingReview ? 'Update Review' : 'Submit Review'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render empty state
    const renderEmptyState = () => (
        <div className="empty-state">
            <div className="empty-icon">
                <FiShoppingCart />
            </div>
            <h2>No Orders Yet</h2>
            <p>You haven't placed any orders. Start exploring our collection!</p>
            <button
                className="btn primary-btn shop-now"
                onClick={() => navigate('/products')}
            >
                <FiShoppingBag />
                Start Shopping
            </button>
        </div>
    );

    // Render loading state
    const renderLoading = () => (
        <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your orders...</p>
        </div>
    );

    // Render error state
    const renderError = () => (
        <div className="error-state">
            <div className="error-icon">
                <FiAlertCircle />
            </div>
            <h2>Unable to Load Orders</h2>
            <p>{error}</p>
            <button
                className="btn primary-btn retry-btn"
                onClick={fetchUserOrders}
            >
                <FiRefreshCw />
                Try Again
            </button>
        </div>
    );

    if (!token || !userId) {
        return (
            <div className="auth-required">
                <h2>Login Required</h2>
                <p>Please login to view your orders</p>
                <button onClick={() => navigate('/login')} className="btn primary-btn">
                    Go to Login
                </button>
            </div>
        );
    }

    return (
        <div className="user-orders">
            <ToastContainer position="top-right" />
            
            {/* Header */}
            <div className="orders-header">
                <h1>
                    <FiPackage className="header-icon" />
                    My Orders
                </h1>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalOrders || 0}</div>
                        <div className="stat-label">Total Orders</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.pendingOrders || 0}</div>
                        <div className="stat-label">Pending</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.deliveredOrders || 0}</div>
                        <div className="stat-label">Delivered</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">₹{stats.totalSpent?.toLocaleString() || '0'}</div>
                        <div className="stat-label">Total Spent</div>
                    </div>
                </div>
            </div>

            {/* Status Filters */}
            <div className="filters-section">
                <div className="section-title">
                    <FiFilter className="section-icon" />
                    Filter Orders
                </div>
                <div className="filter-buttons">
                    <button
                        className={`filter-btn ${filters.status === 'all' ? 'active' : ''}`}
                        onClick={() => handleStatusFilter('all')}
                    >
                        All
                    </button>
                    <button
                        className={`filter-btn ${filters.status === 'pending' ? 'active' : ''}`}
                        onClick={() => handleStatusFilter('pending')}
                    >
                        <FiClock /> Pending
                    </button>
                    <button
                        className={`filter-btn ${filters.status === 'processing' ? 'active' : ''}`}
                        onClick={() => handleStatusFilter('processing')}
                    >
                        <FiRefreshCw /> Processing
                    </button>
                    <button
                        className={`filter-btn ${filters.status === 'shipped' ? 'active' : ''}`}
                        onClick={() => handleStatusFilter('shipped')}
                    >
                        <FiTruck /> Shipped
                    </button>
                    <button
                        className={`filter-btn ${filters.status === 'delivered' ? 'active' : ''}`}
                        onClick={() => handleStatusFilter('delivered')}
                    >
                        <FiCheckCircle /> Delivered
                    </button>
                    <button
                        className={`filter-btn ${filters.status === 'cancelled' ? 'active' : ''}`}
                        onClick={() => handleStatusFilter('cancelled')}
                    >
                        <FiXCircle /> Cancelled
                    </button>
                </div>
            </div>

            {/* Orders List */}
            <div className="orders-container">
                {loading ? renderLoading() : 
                 error ? renderError() : 
                 orders.length === 0 ? renderEmptyState() : (
                    <>
                        <div className="orders-grid">
                            {orders.map(renderOrderCard)}
                        </div>

                        {stats.totalOrders > filters.limit && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    disabled={filters.page === 1}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                >
                                    <FiChevronLeft />
                                    Previous
                                </button>
                                <span className="page-info">
                                    Page {filters.page} of {Math.ceil(stats.totalOrders / filters.limit)}
                                </span>
                                <button
                                    className="pagination-btn"
                                    disabled={filters.page >= Math.ceil(stats.totalOrders / filters.limit)}
                                    onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                >
                                    Next
                                    <FiChevronRight />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {showOrderDetails && selectedOrder && renderOrderDetails()}
            {showReviewModal && selectedProduct && renderReviewModal()}
        </div>
    );
};

export default UserOrders;