import React, { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  MdDashboard,
  MdInventory,
  MdCategory,
  MdProductionQuantityLimits,
  MdMenu,
  MdClose,
  MdLocalOffer,
  MdShoppingCart
} from "react-icons/md";
import "./AdminSidebar.scss";

function AdminSidebar() {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const menuItems = [
    {
      icon: <MdDashboard />,
      title: "Dashboard",
      path: "/admin/dashboard"
    },
    {
      icon: <MdProductionQuantityLimits />,
      title: "List Products",
      path: "/admin/products"
    },
    {
      icon: <MdShoppingCart />,
      title: "Manage Orders",
      path: "/admin/orders"
    },
    {
      icon: <MdCategory />,
      title: "Categories",
      path: "/admin/categories"
    },
    {
      icon: <MdInventory />,
      title: "Inventories",
      path: "/admin/inventories"
    },
    {
      icon: <MdLocalOffer />,
      title: "Product Offers",
      path: "/admin/productoffers"
    }
  ];

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileOpen(!mobileOpen);
    } else {
      setOpen(!open);
    }
  };

  const closeMobileSidebar = () => {
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Hamburger Button - Only show on mobile when sidebar is closed */}
      {isMobile && !mobileOpen && (
        <button 
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <MdMenu size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div className={`admin-sidebar ${open ? "" : "collapsed"} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Logo/Toggle Area */}
        <div className="sidebar-header">
          {open || mobileOpen ? (
            <div className="logo-area">
              <h2 className="logo-text">Admin Panel</h2>
              <button 
                className="toggle-btn" 
                onClick={toggleSidebar}
                title={isMobile ? "Close menu" : "Collapse sidebar"}
              >
                <MdClose />
              </button>
            </div>
          ) : (
            <button 
              className="toggle-btn collapsed" 
              onClick={() => setOpen(true)}
              title="Expand sidebar"
            >
              <MdMenu />
            </button>
          )}
        </div>

        {/* Menu Items */}
        <ul className="sidebar-menu">
          {menuItems.map((item, index) => (
            <li key={index} onClick={closeMobileSidebar}>
              <NavLink
                to={item.path}
                className={({ isActive }) => 
                  isActive ? "menu-link active" : "menu-link"
                }
              >
                <span className="menu-icon">{item.icon}</span>
                {(open || mobileOpen) && <span className="menu-title">{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      {/* Mobile Overlay - Only show on mobile when sidebar is open */}
      {isMobile && mobileOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </>
  );
}

export default AdminSidebar;