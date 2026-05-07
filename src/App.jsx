import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";

import "./App.css";
import Home from "./Pages/Home/Home";
import Navbar from "./Components/Navbar/Navbar";
import Login from "./Components/Login/Login";
import Register from "./Components/Register/Register";
import AdminDashboard from "./Pages/AdminPanel/AdminDashboard/AdminDashboard";
import AdminLayout from "./Pages/AdminPanel/AdminLayout/AdminLayout";
import AdminCategories from "./Pages/AdminPanel/Categories/AdminCategories";
import ListProducts from "./Pages/AdminPanel/ListProducts/ListProducts";
import Inventories from "./Pages/AdminPanel/Inventory/Inventories";
import ProductOffers from "./Pages/AdminPanel/ProductOffers/ProductOffers";
import ProductPage from "./Pages/ProductPage/ProductPage";
import NotFound from "./Pages/NoPage/NotFound";
import Wishlist from "./Pages/Wishlist/Wishlist";
import Profile from "./Pages/Profile/Profile/Profile";
import Checkout from "./Pages/CheckOut/Checkout";
import UserOrders from "./Pages/Profile/UserOrders/UserOrders";
import AdminOrders from "./Pages/AdminPanel/AdminOrders/AdminOrders";
import UserReviews from "./Pages/Profile/UserReviews/UserReviews";
import Footer from "./Components/Footer/Footer";
import ScrollToTop from "./Components/GoToTop/ScrollToTop";
import Cart from "./Pages/Cart/Cart";
import AdminAuth from "./Pages/AdminAuth/AdminAuth";
import RamayanNavbar from "./Components/SeriesNavbar/RamayanNav/RamayanNavbar";

function AppContent() {
  const location = useLocation();
  const [showValmiki, setShowValmiki] = useState(false);
  const [isModelOpen, setIsModelOpen] = useState(false);

  const showRamayanNav = location.pathname === "/";

  return (
    <>
      <ScrollToTop />
      <Navbar isModelOpen={isModelOpen} />
      {showRamayanNav && <RamayanNavbar
        onValmikiClick={setShowValmiki}
        onModelStateChange={setIsModelOpen}
      />}
      <Routes>
        <Route path="/" element={<Home  />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/adminlogin" element={<AdminAuth />} />
        <Route path="/product/:productName" element={<ProductPage />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/wishlist" element={<Wishlist />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/orders" element={<UserOrders />} />
        <Route path="/my-reviews" element={<UserReviews />} />

        <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/categories" element={<AdminLayout><AdminCategories /></AdminLayout>} />
        <Route path="/admin/products" element={<ListProducts />} />
        <Route path="/admin/inventories" element={<AdminLayout><Inventories /></AdminLayout>} />
        <Route path="/admin/productoffers" element={<AdminLayout><ProductOffers /></AdminLayout>} />
        <Route path="/admin/orders" element={<AdminLayout><AdminOrders /></AdminLayout>} />
      </Routes>
      <Footer />
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;