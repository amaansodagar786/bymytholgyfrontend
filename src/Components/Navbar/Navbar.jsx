import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX
} from "react-icons/fi";
import axios from "axios";
import LoginModal from "../Login/LoginModel/LoginModal";
import "./Navbar.scss";

import WishlistSidebar from "../../Pages/Wishlist/Sidebar/WishlistSidebar";
import CartSidebar from "../../Pages/Cart/Sidebar/CartSidebar";

function Navbar({ isModelOpen = false }) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWishlistSidebar, setShowWishlistSidebar] = useState(false);
  const [showCartSidebar, setShowCartSidebar] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, [showLoginModal]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleUserClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      setShowLoginModal(true);
    } else {
      navigate("/profile");
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (window.innerWidth <= 768) {
      navigate("/wishlist");
      if (menuOpen) setMenuOpen(false);
    } else {
      setShowWishlistSidebar(true);
    }
  };

  const handleCartClick = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    if (window.innerWidth <= 768) {
      navigate("/cart");
      if (menuOpen) setMenuOpen(false);
    } else {
      setShowCartSidebar(true);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      const token = localStorage.getItem("token");
      const userId = localStorage.getItem("userId");
      if (!token || !userId) return;
      try {
        const [wish, cart] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/wishlist/count?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${import.meta.env.VITE_API_URL}/cart/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        setWishlistCount(wish.data.count || 0);
        setCartCount(cart.data.cartItems?.reduce((s, i) => s + i.quantity, 0) || 0);
      } catch (e) {
        console.error(e);
      }
    };
    if (isLoggedIn) {
      fetchCounts();
    } else {
      setWishlistCount(0);
      setCartCount(0);
    }
    window.addEventListener("wishlistUpdated", fetchCounts);
    window.addEventListener("cartUpdated", fetchCounts);
    return () => {
      window.removeEventListener("wishlistUpdated", fetchCounts);
      window.removeEventListener("cartUpdated", fetchCounts);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (showLoginModal) setMenuOpen(false);
  }, [showLoginModal]);

  // Determine navbar classes based on model state AND scroll state
  const getNavbarClass = () => {
    if (isModelOpen) return "navbar-model-open";
    if (isScrolled) return "navbar-scrolled";
    return "navbar-transparent";
  };

  return (
    <>
      <WishlistSidebar isOpen={showWishlistSidebar} onClose={() => setShowWishlistSidebar(false)} />
      <CartSidebar isOpen={showCartSidebar} onClose={() => setShowCartSidebar(false)} />

      <nav className={`navbar-new ${getNavbarClass()}`}>
        <div className="nav-inner">
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
          <ul className="nav-links desktop-only">
            <li><Link to="/">HOME</Link></li>
            <li><Link to="/series">SERIES</Link></li>
            <li><Link to="/about">ABOUT</Link></li>
            <li><Link to="/contact">CONTACT</Link></li>
            <li><Link to="/coming-soon">COMING SOON</Link></li>
          </ul>
          <div className="nav-icons">
            {searchOpen && <input className="nav-search-input" type="text" placeholder="Search products..." autoFocus />}
            <button onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <FiX /> : <FiSearch />}
            </button>
            <button className="nav-wishlist-btn icon-wrap" onClick={handleWishlistClick} title="Wishlist">
              <FiHeart />
              {isLoggedIn && wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </button>
            <button className="nav-cart-btn icon-wrap" onClick={handleCartClick} title="Cart">
              <FiShoppingBag />
              {isLoggedIn && cartCount > 0 && <span className="badge">{cartCount}</span>}
            </button>
            <button className="nav-user-btn" onClick={handleUserClick}>
              <FiUser />
            </button>
          </div>
        </div>
      </nav>

      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>HOME</Link>
          <Link to="/series" onClick={() => setMenuOpen(false)}>SERIES</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>ABOUT</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>CONTACT</Link>
          <Link to="/coming-soon" onClick={() => setMenuOpen(false)}>COMING SOON</Link>
          <div className="mobile-icons">
            <FiSearch />
            <Link to={isLoggedIn ? "/wishlist" : "#"} onClick={(e) => {
              if (!isLoggedIn) { e.preventDefault(); setMenuOpen(false); setShowLoginModal(true); }
              else setMenuOpen(false);
            }}><FiHeart /></Link>
            <Link to={isLoggedIn ? "/cart" : "#"} onClick={(e) => {
              if (!isLoggedIn) { e.preventDefault(); setMenuOpen(false); setShowLoginModal(true); }
              else setMenuOpen(false);
            }}><FiShoppingBag /></Link>
            <button className="mobile-user-btn" onClick={(e) => {
              e.preventDefault(); setMenuOpen(false);
              if (!isLoggedIn) setShowLoginModal(true);
              else navigate("/profile");
            }}><FiUser /></button>
          </div>
        </div>
      )}

      {showLoginModal && (
        <LoginModal onClose={() => {
          setShowLoginModal(false);
          const token = localStorage.getItem("token");
          setIsLoggedIn(!!token);
        }} showRegisterLink={true} />
      )}
    </>
  );
}

export default Navbar;