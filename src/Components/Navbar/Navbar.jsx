import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Navbar.scss";
import axios from "axios";
import CartSidebar from "../../Pages/Cart/Cart"; // Import the CartSidebar component

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  // Check login status on mount
  useEffect(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("userName");
    
    if (token) {
      setIsLoggedIn(true);
      if (user) setUserName(user);
    }
  }, []);

  // Fetch wishlist count
  useEffect(() => {
    const updateWishlistCount = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (token && userId) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/wishlist/count?userId=${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          setWishlistCount(response.data.count || 0);
        } catch (error) {
          console.error("Error fetching wishlist count:", error);
          setWishlistCount(0);
        }
      } else {
        setWishlistCount(0);
      }
    };

    // Fetch cart count
    const updateCartCount = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");

      if (token && userId) {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/cart/${userId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          // Calculate total items in cart
          const totalItems = response.data.summary?.totalItems || 
                           response.data.cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
          setCartCount(totalItems);
        } catch (error) {
          console.error("Error fetching cart count:", error);
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    // Update counts on initial load
    updateWishlistCount();
    updateCartCount();

    // Listen for updates
    const handleWishlistUpdate = () => updateWishlistCount();
    const handleCartUpdate = () => updateCartCount();
    const handleAuthChange = () => {
      const token = localStorage.getItem("token");
      const user = localStorage.getItem("userName");
      setIsLoggedIn(!!token);
      if (user) setUserName(user);
      updateWishlistCount();
      updateCartCount();
    };

    window.addEventListener('wishlistUpdated', handleWishlistUpdate);
    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('authChange', handleAuthChange);

    return () => {
      window.removeEventListener('wishlistUpdated', handleWishlistUpdate);
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    setUserName("");
    setWishlistCount(0);
    setCartCount(0);
    window.dispatchEvent(new Event('authChange'));
    alert("Logged out successfully!");
  };

  // Close cart on escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isCartOpen) {
        setIsCartOpen(false);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isCartOpen]);

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          {/* Logo */}
          <Link to="/" className="logo" onClick={() => setMenuOpen(false)}>
            MyStore
          </Link>

          {/* Navigation Links */}
          <ul className={`nav-links ${menuOpen ? "open" : ""}`}>
            <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
            <li><Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link></li>
            <li><Link to="/categories" onClick={() => setMenuOpen(false)}>Categories</Link></li>
            <li><Link to="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
            <li><Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
          </ul>

          {/* Icons Section */}
          <div className="nav-icons">
            {/* Wishlist Icon */}
            <Link to="/wishlist" className="icon-link" onClick={() => setMenuOpen(false)}>
              <div className="icon-container">
                <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
                    fill={wishlistCount > 0 ? "#ff4757" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {wishlistCount > 0 && <span className="badge">{wishlistCount > 9 ? '9+' : wishlistCount}</span>}
                <span className="icon-text">Wishlist</span>
              </div>
            </Link>

            {/* Cart Icon - Now opens sidebar instead of page */}
            <div 
              className="icon-link cart-icon-wrapper" 
              onClick={() => setIsCartOpen(true)}
              style={{ cursor: 'pointer' }}
            >
              <div className="icon-container">
                <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 22C9.55228 22 10 21.5523 10 21C10 20.4477 9.55228 20 9 20C8.44772 20 8 20.4477 8 21C8 21.5523 8.44772 22 9 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M20 22C20.5523 22 21 21.5523 21 21C21 20.4477 20.5523 20 20 20C19.4477 20 19 20.4477 19 21C19 21.5523 19.4477 22 20 22Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path d="M1 1H5L7.68 14.39C7.77144 14.8504 8.02191 15.264 8.38755 15.5583C8.75318 15.8526 9.2107 16.009 9.68 16H19.4C19.8693 16.009 20.3268 15.8526 20.6925 15.5583C21.0581 15.264 21.3086 14.8504 21.4 14.39L23 6H6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {cartCount > 0 && <span className="badge cart-badge">{cartCount > 9 ? '9+' : cartCount}</span>}
                <span className="icon-text">Cart</span>
              </div>
            </div>

            {/* User/Login Icon */}
            {isLoggedIn ? (
              <div className="user-dropdown">
                <div className="user-info">
                  <svg className="icon user-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="user-name">Hi, {userName || "User"}</span>
                </div>
                <div className="dropdown-menu">
                  <Link to="/profile" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z" fill="currentColor"/>
                    </svg>
                    My Profile
                  </Link>
                  <Link to="/orders" className="dropdown-item" onClick={() => setMenuOpen(false)}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M19 3H5C3.89 3 3 3.9 3 5V19C3 20.1 3.89 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM12 17C13.66 17 15 15.66 15 14C15 12.34 13.66 11 12 11C10.34 11 9 12.34 9 14C9 15.66 10.34 17 12 17ZM6 6H18V10H6V6Z" fill="currentColor"/>
                    </svg>
                    My Orders
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout-btn" onClick={handleLogout}>
                    <svg className="dropdown-icon" viewBox="0 0 24 24" fill="none">
                      <path d="M17 7L15.59 8.41L18.17 11H8V13H18.17L15.59 15.59L17 17L22 12L17 7ZM4 19H12V21H4C2.9 21 2 20.1 2 19V5C2 3.9 2.9 3 4 3H12V5H4V19Z" fill="currentColor"/>
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="icon-link" onClick={() => setMenuOpen(false)}>
                <div className="icon-container">
                  <svg className="icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span className="icon-text">Login</span>
                </div>
              </Link>
            )}
          </div>

          {/* Hamburger Menu */}
          <div
            className={`hamburger ${menuOpen ? "active" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </nav>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
}

export default Navbar;