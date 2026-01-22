import React, { useState, useEffect, useRef } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiX,
} from "react-icons/fi";
import Valmikijyot from "./Models/ValmikiJyot/Valmikijyot"; // Import the Valmiki model component
import "./RamayanNavbar.scss";

const MENU = [
  "VALMIKI JYOT",
  "DHANURVEDA",
  "DANDAKARANYA",
  "KISHKINDHA",
  "ASHOK VATIKA",
  "RAM SETU",
  "SANJEEVANI",
  "VIJAYAGAMANAM",
];

const SUB_MENU = ["Crossandra", "Lavender", "Champagne", "Musk" , "Cedarwood"];

const RamayanNavbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showValmikiModel, setShowValmikiModel] = useState(false);
  const navbarRef = useRef(null);
  const valmikiModelRef = useRef(null);

  const toggleSubMenu = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const toggleValmikiModel = () => {
    setShowValmikiModel(prev => !prev);
  };

  // Close Valmiki model when clicking outside navbar or model
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showValmikiModel) {
        // Check if click is outside both navbar and valmiki model
        const isClickInNavbar = navbarRef.current?.contains(e.target);
        const isClickInValmikiModel = valmikiModelRef.current?.contains(e.target);
        
        if (!isClickInNavbar && !isClickInValmikiModel) {
          setShowValmikiModel(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showValmikiModel]);

  // Close Valmiki model when clicking on any other menu item
  const handleMenuClick = (item) => {
    if (item === "VALMIKI JYOT") {
      toggleValmikiModel();
    } else {
      // If any other menu item is clicked, close Valmiki model
      setShowValmikiModel(false);
    }
  };

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleMobileClickOutside = (e) => {
      if (mobileOpen && navbarRef.current && !navbarRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    };

    document.addEventListener('click', handleMobileClickOutside);
    return () => document.removeEventListener('click', handleMobileClickOutside);
  }, [mobileOpen]);

  return (
    <>
      <nav className="ramayan-nav" ref={navbarRef}>
        {/* TOP BAR */}
        <div className="ramayan-nav__top">
          <div className="ramayan-nav__left">
            <div className="ramayan-nav__logo">ॐ</div>
            <h1 className="ramayan-nav__title">Ramayan Series</h1>
          </div>

          <div className="ramayan-nav__right ramayan-desktop-only">
            COMBOS
          </div>

          <button
            className="ramayan-nav__toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>

        {/* DESKTOP MENU */}
        <ul className="ramayan-nav__menu ramayan-desktop-only">
          {MENU.map((item, index) => (
            <li
              key={index}
              className={`ramayan-nav__menu-item ${item === "VALMIKI JYOT" && showValmikiModel ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
            >
              <span>{item}</span>
              <FiChevronDown />
            </li>
          ))}
        </ul>

        {/* MOBILE MENU */}
        {mobileOpen && (
          <div className="ramayan-nav__mobile">
            {MENU.map((item, i) => (
              <div key={i} className="ramayan-nav__mobile-item">
                <button onClick={() => toggleSubMenu(i)}>
                  <span>{item}</span>
                  {activeMenu === i ? <FiChevronUp /> : <FiChevronDown />}
                </button>

                {activeMenu === i && (
                  <div className="ramayan-nav__submenu">
                    {SUB_MENU.map((sub, j) => (
                      <div key={j} className="ramayan-nav__submenu-item">
                        {sub}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* VALMIKI JYOT MODEL - Rendered directly from Navbar */}
      {showValmikiModel && (
        <div className="valmiki-model-overlay" ref={valmikiModelRef}>
          <Valmikijyot />
        </div>
      )}
    </>
  );
};

export default RamayanNavbar;