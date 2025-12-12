import React from "react";
import { useNavigate } from "react-router-dom";
import "./ProductCard.scss";

function ProductCard({ product, wishlist, toggleWishlist }) {
  const navigate = useNavigate();

  const handleProductClick = () => {
    navigate(`/product/${product.productId}`);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    toggleWishlist(product, e);
  };

  // Helper function to get color hex
  const getColorHex = (colorName) => {
    const colorMap = {
      'red': '#ff4757',
      'blue': '#3742fa',
      'green': '#2ed573',
      'yellow': '#ffa502',
      'black': '#2f3542',
      'white': '#ffffff',
      'gray': '#a4b0be',
      'pink': '#ff6b81',
      'purple': '#6c5ce7',
      'orange': '#ff7f00',
      'brown': '#795548',
      'navy': '#273c75',
      'maroon': '#c23616',
      'teal': '#0097a7',
      'cyan': '#00d2d3',
      'gold': '#ff9f1a',
      'silver': '#bdc3c7'
    };
    const lowerColor = colorName.toLowerCase();
    return colorMap[lowerColor] || '#718096';
  };

  return (
    <div className="product-card" onClick={handleProductClick}>
      {/* Wishlist Button */}
      <button
        className={`wishlist-btn ${wishlist[product.productId]?.isWishlisted ? 'in-wishlist' : ''}`}
        onClick={handleWishlistClick}
        title={wishlist[product.productId]?.isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
      >
        {wishlist[product.productId]?.isWishlisted ? '♥' : '♡'}
      </button>

      {/* Product Image */}
      <div className="product-image">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.productName}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "https://via.placeholder.com/300x200?text=No+Image";
            }}
          />
        ) : (
          <div className="no-image">No Image Available</div>
        )}
      </div>

      {/* Offer Badge */}
      {product.hasOffer && (
        <div className={`offer-badge ${product.offerCount > 1 ? 'multiple-offers' : ''}`}>
          {product.offerCount > 1 ? (
            <>
              <span className="offer-icon">🔥</span>
              {product.bestOffer.offerLabel}
              <span className="offer-count">+{product.offerCount - 1}</span>
            </>
          ) : (
            <>
              <span className="offer-icon">🎯</span>
              {product.bestOffer.offerLabel}
            </>
          )}
        </div>
      )}

      {/* Product Info */}
      <div className="product-info">
        <div className="product-category">
          {product.categoryName || "Uncategorized"}
        </div>

        <h3 className="product-name" title={product.productName}>
          {product.productName}
        </h3>

        {product.specs && product.specs.length > 0 && (
          <div className="product-specs">
            {product.specs.join(" • ")}
          </div>
        )}

        <div className="price-section">
          <span className="current-price">
            ₹{product.currentPrice?.toLocaleString() || "0"}
          </span>

          {product.hasDiscount && (
            <>
              <span className="original-price">
                ₹{product.originalPrice?.toLocaleString()}
              </span>
              <span className="discount">
                {product.discountPercent}% OFF
              </span>
            </>
          )}
        </div>

        {product.colors && product.colors.length > 0 && (
          <div className="variants-info">
            <div className="color-dots">
              {product.colors.slice(0, 4).map((color, index) => (
                <div
                  key={index}
                  className="color-dot"
                  style={{
                    backgroundColor: getColorHex(color),
                    borderColor: getColorHex(color)
                  }}
                  title={color}
                />
              ))}
              {product.colorCount > 4 && (
                <div 
                  className="color-dot" 
                  style={{
                    backgroundColor: '#718096',
                    color: 'white',
                    fontSize: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }} 
                  title={`+${product.colorCount - 4} more`}
                >
                  +{product.colorCount - 4}
                </div>
              )}
            </div>
            <span className="variant-count">
              {product.colorCount} {product.colorCount === 1 ? 'color' : 'colors'}
            </span>
          </div>
        )}

        <button className="view-details-btn">
          View Details
        </button>
      </div>
    </div>
  );
}

export default ProductCard;