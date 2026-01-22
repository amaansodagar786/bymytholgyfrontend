import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiHeart,
  FiShoppingBag,
  FiUser,
  FiMenu,
  FiX
} from "react-icons/fi";
import axios from "axios";
import "./Navbar.scss";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem("token"));
  }, []);

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

    fetchCounts();
    window.addEventListener("wishlistUpdated", fetchCounts);
    window.addEventListener("cartUpdated", fetchCounts);

    return () => {
      window.removeEventListener("wishlistUpdated", fetchCounts);
      window.removeEventListener("cartUpdated", fetchCounts);
    };
  }, []);

  return (
    <>
      <nav className="navbar-new">
        <div className="nav-inner">

          {/* HAMBURGER – LEFT (MOBILE ONLY) */}
          <button className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>

          {/* LINKS – DESKTOP ONLY */}
          <ul className="nav-links desktop-only">
            <li><Link to="/">HOME</Link></li>
            <li><Link to="/series">SERIES</Link></li>
            <li><Link to="/about">ABOUT</Link></li>
            <li><Link to="/contact">CONTACT</Link></li>
            <li><Link to="/coming-soon">COMING SOON</Link></li>
          </ul>

          {/* ICONS – BOTH DESKTOP & MOBILE */}
          <div className="nav-icons">

            {searchOpen && (
              <input
                className="nav-search-input"
                type="text"
                placeholder="Search products..."
                autoFocus
              />
            )}

            <button onClick={() => setSearchOpen(!searchOpen)}>
              {searchOpen ? <FiX /> : <FiSearch />}
            </button>

            <Link to="/wishlist" className="icon-wrap">
              <FiHeart />
              {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
            </Link>

            <Link to="/cart" className="icon-wrap">
              <FiShoppingBag />
              {cartCount > 0 && <span className="badge">{cartCount}</span>}
            </Link>

            <Link to={isLoggedIn ? "/profile" : "/login"}>
              <FiUser />
            </Link>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU */}
      {menuOpen && (
        <div className="mobile-menu">
          <Link to="/" onClick={() => setMenuOpen(false)}>HOME</Link>
          <Link to="/series" onClick={() => setMenuOpen(false)}>SERIES</Link>
          <Link to="/about" onClick={() => setMenuOpen(false)}>ABOUT</Link>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>CONTACT</Link>
          <Link to="/coming-soon" onClick={() => setMenuOpen(false)}>COMING SOON</Link>

          <div className="mobile-icons">
            <FiSearch />
            <Link to="/wishlist" onClick={() => setMenuOpen(false)}>
              <FiHeart />
            </Link>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              <FiShoppingBag />
            </Link>
            <Link to={isLoggedIn ? "/profile" : "/login"} onClick={() => setMenuOpen(false)}>
              <FiUser />
            </Link>
          </div>
        </div>
      )}
    </>
  );
}

export default Navbar;