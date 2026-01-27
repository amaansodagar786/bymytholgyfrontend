import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FiStar,
    FiEdit2,
    FiTrash2,
    FiPackage,
    FiShoppingBag,
    FiCalendar,
    FiCheckCircle,
    FiMessageSquare,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiAlertCircle,
    FiRefreshCw,
    FiX,
    FiCheck,
    FiClock,
    FiUser,
    FiTag
} from 'react-icons/fi';
import { MdOutlineRateReview } from 'react-icons/md';
import './UserReviews.scss';

import LoginModal from "../../../Components/Login/LoginModel/LoginModal";


const UserReviews = () => {
    const navigate = useNavigate();
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editingReview, setEditingReview] = useState({
        rating: 0,
        reviewText: '',
        hoverRating: 0
    });
    const [updating, setUpdating] = useState(false);
    const [stats, setStats] = useState({
        totalReviews: 0,
        averageRating: 0,
        fiveStar: 0,
        fourStar: 0,
        threeStar: 0,
        twoStar: 0,
        oneStar: 0
    });
    const [filters, setFilters] = useState({
        rating: 'all',
        sortBy: 'newest',
        page: 1,
        limit: 10
    });

    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    const userName = localStorage.getItem('userName') || 'User';


    // Add these states with other states
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);



    // Add this useEffect after the states
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            setShowLoginModal(true);
            setIsAuthenticated(false);
            setLoading(false); // Stop loading if not authenticated
        } else {
            setIsAuthenticated(true);
            // Fetch reviews only if authenticated
            fetchUserReviews();
        }
    }, []);



    const fetchUserReviews = async () => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');

        if (!token || !userId) {
            setShowLoginModal(true);
            setIsAuthenticated(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams({
                page: filters.page,
                limit: filters.limit
            }).toString();

            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/reviews/user/${userId}?${queryParams}`,
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                const reviewsData = response.data.reviews || [];
                setReviews(reviewsData);

                // Calculate stats from reviews
                calculateStats(reviewsData);

                // Fetch order details for each review
                await fetchOrderDetails(reviewsData);
            } else {
                setReviews([]);
                setStats({
                    totalReviews: 0,
                    averageRating: 0,
                    fiveStar: 0,
                    fourStar: 0,
                    threeStar: 0,
                    twoStar: 0,
                    oneStar: 0
                });
            }
        } catch (error) {
            console.error('❌ Error fetching reviews:', error);
            setError('Failed to load reviews. Please try again.');
            setReviews([]);
            toast.error('Failed to load reviews');
        } finally {
            setLoading(false);
        }
    };

    // Calculate review statistics
    const calculateStats = (reviewsData) => {
        const total = reviewsData.length;
        const averageRating = total > 0
            ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / total
            : 0;

        const ratingCounts = {
            5: reviewsData.filter(r => r.rating === 5).length,
            4: reviewsData.filter(r => r.rating === 4).length,
            3: reviewsData.filter(r => r.rating === 3).length,
            2: reviewsData.filter(r => r.rating === 2).length,
            1: reviewsData.filter(r => r.rating === 1).length
        };

        setStats({
            totalReviews: total,
            averageRating: parseFloat(averageRating.toFixed(1)),
            fiveStar: ratingCounts[5],
            fourStar: ratingCounts[4],
            threeStar: ratingCounts[3],
            twoStar: ratingCounts[2],
            oneStar: ratingCounts[1]
        });
    };

    // Fetch order details for reviews
    const fetchOrderDetails = async (reviewsData) => {
        try {
            const enhancedReviews = await Promise.all(
                reviewsData.map(async (review) => {
                    try {
                        const orderResponse = await axios.get(
                            `${import.meta.env.VITE_API_URL}/orders/${review.orderId}`,
                            {
                                headers: { Authorization: `Bearer ${token}` }
                            }
                        );

                        if (orderResponse.data.success) {
                            const order = orderResponse.data.order;

                            // Find the specific item in the order
                            const orderItem = order.items.find(item =>
                                item.productId === review.productId &&
                                item.colorId === review.colorId
                            );

                            return {
                                ...review,
                                orderDetails: {
                                    orderId: order.orderId,
                                    orderDate: order.createdAt,
                                    orderStatus: order.orderStatus,
                                    item: orderItem || null,
                                    deliveryAddress: order.deliveryAddress
                                }
                            };
                        }
                        return review;
                    } catch (error) {
                        console.error('Error fetching order details:', error);
                        return review;
                    }
                })
            );

            setReviews(enhancedReviews);
        } catch (error) {
            console.error('Error fetching order details batch:', error);
        }
    };

    useEffect(() => {
        fetchUserReviews();
    }, [filters.page, filters.rating, filters.sortBy]);

    // Handle filter change
    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value,
            page: 1
        }));
    };

    // Handle star hover
    const handleStarHover = (rating) => {
        setEditingReview(prev => ({ ...prev, hoverRating: rating }));
    };

    // Handle star click
    const handleStarClick = (rating) => {
        setEditingReview(prev => ({ ...prev, rating }));
    };

    // Open edit modal
    const handleOpenEditModal = (review) => {
        setSelectedReview(review);
        setEditingReview({
            rating: review.rating,
            reviewText: review.reviewText || '',
            hoverRating: review.rating
        });
        setShowEditModal(true);
    };

    // Open delete modal
    const handleOpenDeleteModal = (review) => {
        setSelectedReview(review);
        setShowDeleteModal(true);
    };

    // Update review
    const handleUpdateReview = async () => {
        if (!editingReview.rating) {
            toast.warning('Please select a star rating');
            return;
        }

        if (!selectedReview) {
            toast.error('No review selected');
            return;
        }

        try {
            setUpdating(true);

            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/reviews/update/${selectedReview.reviewId}`,
                {
                    userId,
                    rating: editingReview.rating,
                    reviewText: editingReview.reviewText.trim()
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                toast.success('Review updated successfully!');
                setShowEditModal(false);

                // Update the review in state
                setReviews(prevReviews =>
                    prevReviews.map(review =>
                        review.reviewId === selectedReview.reviewId
                            ? {
                                ...review,
                                rating: editingReview.rating,
                                reviewText: editingReview.reviewText.trim(),
                                updatedAt: new Date().toISOString()
                            }
                            : review
                    )
                );

                // Recalculate stats
                fetchUserReviews();
            }
        } catch (error) {
            console.error('❌ Error updating review:', error);
            toast.error(error.response?.data?.message || 'Failed to update review');
        } finally {
            setUpdating(false);
        }
    };

    // Delete review
    const handleDeleteReview = async () => {
        if (!selectedReview) {
            toast.error('No review selected');
            return;
        }

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/reviews/${selectedReview.reviewId}`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                    data: { userId }
                }
            );

            if (response.data.success) {
                toast.success('Review deleted successfully!');
                setShowDeleteModal(false);

                // Remove the review from state
                setReviews(prevReviews =>
                    prevReviews.filter(review => review.reviewId !== selectedReview.reviewId)
                );

                // Recalculate stats
                fetchUserReviews();
            }
        } catch (error) {
            console.error('❌ Error deleting review:', error);
            toast.error(error.response?.data?.message || 'Failed to delete review');
        }
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

    // Render star rating
    const renderStars = (rating, interactive = false, size = 'medium') => {
        const stars = [];
        const displayRating = interactive ? (editingReview.hoverRating || editingReview.rating) : rating;
        const starSize = size === 'large' ? 28 : size === 'small' ? 14 : 20;

        for (let i = 1; i <= 5; i++) {
            stars.push(
                interactive ? (
                    <button
                        key={i}
                        type="button"
                        className={`star-btn ${i <= displayRating ? 'active' : ''} ${size}`}
                        onClick={() => handleStarClick(i)}
                        onMouseEnter={() => handleStarHover(i)}
                        onMouseLeave={() => handleStarHover(0)}
                        disabled={updating}
                        style={{ fontSize: `${starSize}px` }}
                    >
                        <FiStar className="star-icon" />
                    </button>
                ) : (
                    <span
                        key={i}
                        className={`star-display ${i <= displayRating ? 'filled' : 'empty'} ${size}`}
                        style={{ fontSize: `${starSize}px` }}
                    >
                        <FiStar className="star-icon" />
                    </span>
                )
            );
        }
        return (
            <div className={`star-container ${size}`}>
                {stars}
                {!interactive && (
                    <span className="rating-text">{rating.toFixed(1)}</span>
                )}
            </div>
        );
    };

    // Render rating distribution bar
    const renderRatingBar = (count, total, rating) => {
        const percentage = total > 0 ? (count / total) * 100 : 0;

        return (
            <div className="rating-bar-item">
                <div className="bar-label">
                    <span className="rating-number">{rating} star</span>
                    <span className="rating-count">{count}</span>
                </div>
                <div className="bar-container">
                    <div
                        className="bar-fill"
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <span className="bar-percentage">{percentage.toFixed(0)}%</span>
            </div>
        );
    };

    // Render review card
    const renderReviewCard = (review) => {
        return (
            <div key={review.reviewId} className="review-card">
                <div className="review-header">
                    <div className="product-info">
                        <h3 className="product-name">{review.productName}</h3>
                        <div className="product-meta">
                            {review.modelName !== "Default" && (
                                <span className="meta-tag">
                                    <FiShoppingBag className="meta-icon" />
                                    {review.modelName}
                                </span>
                            )}
                            {review.size && (
                                <span className="meta-tag">
                                    <FiTag className="meta-icon" />
                                    Size: {review.size}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="review-rating-display">
                        {renderStars(review.rating, false, 'small')}
                        <span className="review-date">
                            Reviewed on {formatDate(review.createdAt)}
                        </span>
                    </div>
                </div>

                <div className="review-body">
                    {review.reviewText ? (
                        <p className="review-text">{review.reviewText}</p>
                    ) : (
                        <p className="review-text empty">No review text provided</p>
                    )}

                    {/* Order Information */}
                    {review.orderDetails && (
                        <div className="order-info">
                            <h4 className="order-info-title">
                                <FiPackage className="title-icon" />
                                Order Information
                            </h4>
                            <div className="order-details-grid">
                                <div className="order-detail-item">
                                    <span className="detail-label">Order ID:</span>
                                    <span className="detail-value">{review.orderDetails.orderId}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="detail-label">Date:</span>
                                    <span className="detail-value">{formatDate(review.orderDetails.orderDate)}</span>
                                </div>
                                <div className="order-detail-item">
                                    <span className="detail-label">Status:</span>
                                    <span className={`status-badge ${review.orderDetails.orderStatus}`}>
                                        {review.orderDetails.orderStatus}
                                    </span>
                                </div>
                                {review.orderDetails.item && (
                                    <>
                                        <div className="order-detail-item">
                                            <span className="detail-label">Quantity:</span>
                                            <span className="detail-value">{review.orderDetails.item.quantity}</span>
                                        </div>
                                        <div className="order-detail-item">
                                            <span className="detail-label">Price:</span>
                                            <span className="detail-value">₹{review.orderDetails.item.totalPrice.toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="review-footer">
                    <div className="review-meta">
                        <span className="verification-badge">
                            <FiCheckCircle className="badge-icon" />
                            Verified Purchase
                        </span>
                        {review.updatedAt && review.updatedAt !== review.createdAt && (
                            <span className="updated-info">
                                Updated on {formatDate(review.updatedAt)}
                            </span>
                        )}
                    </div>

                    <div className="review-actions">
                        <button
                            className="btn edit-btn"
                            onClick={() => handleOpenEditModal(review)}
                        >
                            <FiEdit2 />
                            Edit
                        </button>
                        <button
                            className="btn delete-btn"
                            onClick={() => handleOpenDeleteModal(review)}
                        >
                            <FiTrash2 />
                            Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    // Render edit modal
    const renderEditModal = () => (
        <div className="edit-modal">
            <div className="modal-overlay" onClick={() => !updating && setShowEditModal(false)}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiEdit2 className="header-icon" />
                        Edit Review
                    </h2>
                    <button
                        className="close-btn"
                        onClick={() => !updating && setShowEditModal(false)}
                        disabled={updating}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="product-info-modal">
                        <h3>{selectedReview?.productName}</h3>
                        {selectedReview?.modelName !== "Default" && (
                            <p className="product-model">{selectedReview?.modelName}</p>
                        )}
                    </div>

                    <div className="edit-form">
                        <div className="rating-section">
                            <label>Your Rating *</label>
                            <div className="star-rating-edit">
                                <div className="stars-container">
                                    {renderStars(0, true, 'large')}
                                </div>
                                <span className="rating-text">
                                    {editingReview.rating > 0 ?
                                        `${editingReview.rating} star${editingReview.rating > 1 ? 's' : ''}` :
                                        'Select rating'
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="review-text-section">
                            <label>Your Review</label>
                            <textarea
                                className="review-textarea"
                                placeholder="Share your experience with this product..."
                                value={editingReview.reviewText}
                                onChange={(e) => setEditingReview(prev => ({
                                    ...prev,
                                    reviewText: e.target.value
                                }))}
                                rows={5}
                                maxLength={1000}
                                disabled={updating}
                            />
                            <div className="char-count">
                                {editingReview.reviewText.length}/1000 characters
                            </div>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn secondary-btn"
                            onClick={() => !updating && setShowEditModal(false)}
                            disabled={updating}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn primary-btn"
                            onClick={handleUpdateReview}
                            disabled={updating || editingReview.rating === 0}
                        >
                            {updating ? (
                                <>
                                    <FiRefreshCw className="spinner" />
                                    Updating...
                                </>
                            ) : (
                                'Update Review'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    // Render delete modal
    const renderDeleteModal = () => (
        <div className="delete-modal">
            <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}></div>
            <div className="modal-content">
                <div className="modal-header">
                    <h2>
                        <FiAlertCircle className="header-icon" />
                        Delete Review
                    </h2>
                    <button
                        className="close-btn"
                        onClick={() => setShowDeleteModal(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="modal-body">
                    <div className="warning-icon">
                        <FiAlertCircle />
                    </div>
                    <h3>Are you sure?</h3>
                    <p>
                        You're about to delete your review for <strong>{selectedReview?.productName}</strong>.
                        This action cannot be undone.
                    </p>

                    <div className="review-preview">
                        <div className="preview-rating">
                            {renderStars(selectedReview?.rating || 0, false, 'small')}
                        </div>
                        {selectedReview?.reviewText && (
                            <p className="preview-text">"{selectedReview.reviewText.substring(0, 100)}..."</p>
                        )}
                    </div>

                    <div className="modal-actions">
                        <button
                            className="btn secondary-btn"
                            onClick={() => setShowDeleteModal(false)}
                        >
                            Cancel
                        </button>
                        <button
                            className="btn danger-btn"
                            onClick={handleDeleteReview}
                        >
                            <FiTrash2 />
                            Delete Review
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
                <MdOutlineRateReview />
            </div>
            <h2>No Reviews Yet</h2>
            <p>You haven't reviewed any products yet. Reviews help other shoppers make better decisions.</p>
            <button
                className="btn primary-btn view-orders"
                onClick={() => navigate('/my-orders')}
            >
                <FiPackage />
                View My Orders
            </button>
        </div>
    );

    // Render loading state
    const renderLoading = () => (
        <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your reviews...</p>
        </div>
    );

    // Render error state
    const renderError = () => (
        <div className="error-state">
            <div className="error-icon">
                <FiAlertCircle />
            </div>
            <h2>Unable to Load Reviews</h2>
            <p>{error}</p>
            <button
                className="btn primary-btn retry-btn"
                onClick={fetchUserReviews}
            >
                <FiRefreshCw />
                Try Again
            </button>
        </div>
    );

    // WITH THIS:
    if (!isAuthenticated && showLoginModal) {
        return (
            <div className="my-reviews">
                <ToastContainer position="top-right" />
                <LoginModal
                    onClose={() => {
                        setShowLoginModal(false);
                        // Check if user logged in after modal closes
                        const token = localStorage.getItem('token');
                        const userId = localStorage.getItem('userId');
                        if (token && userId) {
                            setIsAuthenticated(true);
                            fetchUserReviews();
                        } else {
                            navigate('/');
                        }
                    }}
                    showRegisterLink={true}
                />
            </div>
        );
    }

    return (
        <div className="my-reviews">
            <ToastContainer position="top-right" />

            {/* Header */}
            <div className="reviews-header">
                <h1>
                    <MdOutlineRateReview className="header-icon" />
                    My Reviews
                </h1>
                <p className="subtitle">Manage and edit all your product reviews in one place</p>
            </div>

            {/* Stats Section */}
            <div className="stats-section">
                <div className="main-stat">
                    <div className="stat-value">{stats.averageRating}</div>
                    <div className="stat-label">Average Rating</div>
                    <div className="stat-stars">
                        {renderStars(stats.averageRating, false, 'small')}
                    </div>
                </div>
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-value">{stats.totalReviews}</div>
                        <div className="stat-label">Total Reviews</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.fiveStar}</div>
                        <div className="stat-label">5 Star Reviews</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-value">{stats.fourStar}</div>
                        <div className="stat-label">4 Star Reviews</div>
                    </div>
                </div>
            </div>

            {/* Rating Distribution */}
            <div className="rating-distribution">
                <h3 className="section-title">
                    <FiStar className="section-icon" />
                    Rating Breakdown
                </h3>
                <div className="distribution-bars">
                    {renderRatingBar(stats.fiveStar, stats.totalReviews, 5)}
                    {renderRatingBar(stats.fourStar, stats.totalReviews, 4)}
                    {renderRatingBar(stats.threeStar, stats.totalReviews, 3)}
                    {renderRatingBar(stats.twoStar, stats.totalReviews, 2)}
                    {renderRatingBar(stats.oneStar, stats.totalReviews, 1)}
                </div>
            </div>

            {/* Filters */}
            <div className="filters-section">
                <div className="section-title">
                    <FiFilter className="section-icon" />
                    Filter & Sort
                </div>
                <div className="filter-controls">
                    <div className="filter-group">
                        <label>Filter by Rating:</label>
                        <select
                            className="filter-select"
                            value={filters.rating}
                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                        >
                            <option value="all">All Ratings</option>
                            <option value="5">5 Stars</option>
                            <option value="4">4 Stars</option>
                            <option value="3">3 Stars</option>
                            <option value="2">2 Stars</option>
                            <option value="1">1 Star</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Sort by:</label>
                        <select
                            className="filter-select"
                            value={filters.sortBy}
                            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="highest">Highest Rating</option>
                            <option value="lowest">Lowest Rating</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Reviews List */}
            <div className="reviews-container">
                {loading ? renderLoading() :
                    error ? renderError() :
                        reviews.length === 0 ? renderEmptyState() : (
                            <>
                                <div className="reviews-list">
                                    {reviews.map(renderReviewCard)}
                                </div>

                                {stats.totalReviews > filters.limit && (
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
                                            Page {filters.page} of {Math.ceil(stats.totalReviews / filters.limit)}
                                        </span>
                                        <button
                                            className="pagination-btn"
                                            disabled={filters.page >= Math.ceil(stats.totalReviews / filters.limit)}
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
            {showEditModal && selectedReview && renderEditModal()}
            {showDeleteModal && selectedReview && renderDeleteModal()}




            {
                showLoginModal && (
                    <LoginModal
                        onClose={() => {
                            setShowLoginModal(false);
                            const token = localStorage.getItem('token');
                            const userId = localStorage.getItem('userId');
                            if (token && userId) {
                                setIsAuthenticated(true);
                                fetchUserReviews();
                            } else {
                                navigate('/');
                            }
                        }}
                        showRegisterLink={true}
                    />
                )
            }
        </div >
    );
};

export default UserReviews;