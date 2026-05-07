import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiMenu, FiX } from "react-icons/fi";
import Valmikijyot from "./Models/ValmikiJyot/Valmikijyot";
import Dhanurveda from "./Models/Dhanurveda/Dhanurveda";
import Dandakaranya from "./Models/Dandakaranya/Dandakaranya";
import Kishkindha from "./Models/Kishkindha/Kishkindha";
import AshokVatika from "./Models/Ashokvatika/AshokVatika";
import Ramsetu from "./Models/Ramsetu/Ramsetu";
import Sanjeevani from "./Models/Sanjeevani/Sanjeevani";
import Vijayagamanam from "./Models/Vijayagamanam/Vijayagamanam";
import "./RamayanNavbar.scss";

const MENU = [
  "VALMIKI JYOT",
  "DHANURVEDA",
  "DANDAKARANYA",
  "KISHKINDHA",
  "ASHOK VATIKA",
  "RAMSETU",
  "SANJEEVANI",
  "VIJAYAGAMANAM",
];

const SUB_MENUS = {
  "VALMIKI JYOT": ["Crossandra", "Lavender", "Champagne", "Musk", "Cedarwood"],
  "DHANURVEDA": ["Lilly of The Valley", "Bitter Almond", "Cinnamon", "Strawberry", "Caramel"],
  "DANDAKARANYA": ["White Amber", "Clove", "Nutmeg", "Jasmine", "Pinewood"],
  "KISHKINDHA": ["Patchouli", "Black Agar", "Oud", "Rose", "Sandalwood"],
  "ASHOK VATIKA": ["Madurai Malli", "Rose Damascone", "Cedarwood", "Citronella"],
  "RAMSETU": ["Lemon", "Cardamom", "Musk Melon", "Cucumber", "Aqua"],
  "SANJEEVANI": ["Marijuana", "Camphor", "Violet Leaf", "Seaweed", "Moss"],
  "VIJAYAGAMANAM": ["Lilac", "Vanilla", "Grapefruit", "Sandalwood"]
};

const MODEL_COMPONENTS = {
  "VALMIKI JYOT": Valmikijyot,
  "DHANURVEDA": Dhanurveda,
  "DANDAKARANYA": Dandakaranya,
  "KISHKINDHA": Kishkindha,
  "ASHOK VATIKA": AshokVatika,
  "RAMSETU": Ramsetu,
  "SANJEEVANI": Sanjeevani,
  "VIJAYAGAMANAM": Vijayagamanam,
};

const RamayanNavbar = ({ onMenuClick, onValmikiClick, onModelStateChange }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const navbarRef = useRef(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [modelPosition, setModelPosition] = useState({ top: 0, left: 0, width: 0 });

  // Notify parent when model opens/closes
  useEffect(() => {
    if (onModelStateChange) {
      onModelStateChange(!!activeModel);
    }
  }, [activeModel, onModelStateChange]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // DISABLE SCROLLING WHEN MODEL IS OPEN
  useEffect(() => {
    if (activeModel) {
      // Disable scrolling when model is open
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Re-enable scrolling when model is closed
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    // Cleanup function - ensures scrolling is re-enabled if component unmounts
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [activeModel]);

  // Calculate position of navbar to place model directly below it
  useEffect(() => {
    if (activeModel && navbarRef.current) {
      const rect = navbarRef.current.getBoundingClientRect();
      setModelPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [activeModel]);

  const toggleSubMenu = (index) => setActiveMenu(activeMenu === index ? null : index);

  const handleMenuClick = (item) => {
    if (activeModel === item) {
      setActiveModel(null);
      onMenuClick?.(null);
      if (item === "VALMIKI JYOT") onValmikiClick?.(false);
    } else {
      setActiveModel(item);
      onMenuClick?.(item);
      if (item === "VALMIKI JYOT") onValmikiClick?.(true);
    }
    setMobileOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeModel && navbarRef.current && !navbarRef.current.contains(e.target)) {
        // Check if click is inside the model popup
        const modelPopup = document.querySelector('.model-portal-container');
        if (modelPopup && modelPopup.contains(e.target)) {
          return; // Don't close if clicking inside model
        }
        setActiveModel(null);
        onMenuClick?.(null);
        onValmikiClick?.(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeModel]);

  const ActiveComponent = activeModel ? MODEL_COMPONENTS[activeModel] : null;

  // Split menu into left (4 items) and right (4 items)
  const leftMenuItems = MENU.slice(0, 4);
  const rightMenuItems = MENU.slice(4, 8);

  return (
    <>
      <div ref={navbarRef} className="ramayan-nav-wrapper">
        <nav className={`ramayan-nav ${isScrolled ? "ramayan-nav-scrolled" : "ramayan-nav-transparent"} ${activeModel ? "ramayan-nav-model-open" : ""}`}>
          <div className="ramayan-nav__container">
            {/* LEFT MENU - 4 items */}
            <ul className="ramayan-nav__menu-left">
              {leftMenuItems.map((item, idx) => (
                <li
                  key={idx}
                  className={`ramayan-nav__menu-item ${activeModel === item ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item)}
                >
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* CENTER TITLE - 2 lines */}
            <div className="ramayan-nav__center">
              <div className="ramayan-nav__title-line1">Ramayan</div>
              <div className="ramayan-nav__title-line2">SERIES</div>
            </div>

            {/* RIGHT MENU - 4 items */}
            <ul className="ramayan-nav__menu-right">
              {rightMenuItems.map((item, idx) => (
                <li
                  key={idx}
                  className={`ramayan-nav__menu-item ${activeModel === item ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item)}
                >
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            {/* MOBILE TOGGLE BUTTON */}
            <button className="ramayan-nav__toggle" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>

          {/* MOBILE MENU (collapsed) */}
          {mobileOpen && (
            <div className="ramayan-nav__mobile">
              {MENU.map((item, i) => (
                <div key={i} className="ramayan-nav__mobile-item">
                  <button onClick={() => toggleSubMenu(i)}>
                    <span>{item}</span>
                  </button>
                  {activeMenu === i && (
                    <div className="ramayan-nav__submenu">
                      {SUB_MENUS[item].map((sub, j) => <div key={j} className="ramayan-nav__submenu-item">{sub}</div>)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </nav>
      </div>

      {/* MODEL POPUP - RENDERED AT ROOT LEVEL USING PORTAL */}
      {ActiveComponent && createPortal(
        <div
          className="model-portal-container"
          style={{
            position: 'absolute',
            top: modelPosition.top,
            left: modelPosition.left,
            width: modelPosition.width,
            zIndex: 2000,
          }}
        >
          <ActiveComponent onClose={() => setActiveModel(null)} />
        </div>,
        document.body
      )}
    </>
  );
};

export default RamayanNavbar;