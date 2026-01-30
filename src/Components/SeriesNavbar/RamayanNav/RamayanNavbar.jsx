import React, { useState, useEffect, useRef } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiMenu,
  FiX,
} from "react-icons/fi";
import Valmikijyot from "./Models/ValmikiJyot/Valmikijyot";
import Dhanurveda from "./Models/Dhanurveda/Dhanurveda";
import Dandakaranya from "./Models/Dandakaranya/Dandakaranya";
import Kishkindha from "./Models/Kishkindha/Kishkindha";
import AshokVatika from "./Models/AshokVatika/AshokVatika";
import Ramsetu from "./Models/Ramsetu/Ramsetu";
import Sanjeevani from "./Models/Sanjeevani/Sanjeevani";
import Vijayagamanam from "./Models/Vijayagamanam/Vijayagamanam";
import "./RamayanNavbar.scss";
import logo from "../../../assets/logo/newlogo.png"

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

// Updated: Separate submenus for each menu item
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

// Component mapping
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

const RamayanNavbar = ({ onMenuClick }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [activeModel, setActiveModel] = useState(null);
  const navbarRef = useRef(null);
  const modelOverlayRef = useRef(null);

  const toggleSubMenu = (index) => {
    setActiveMenu(activeMenu === index ? null : index);
  };

  const handleMenuClick = (item) => {
    // If clicked on currently active model, close it
    if (activeModel === item) {
      setActiveModel(null);
      onMenuClick && onMenuClick(null);
    } else {
      // Open the clicked model
      setActiveModel(item);
      onMenuClick && onMenuClick(item);
    }
    
    // Close mobile menu if open
    setMobileOpen(false);
  };

  // Close model when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (activeModel && modelOverlayRef.current && !modelOverlayRef.current.contains(e.target)) {
        // Check if click is outside navbar and model overlay
        const isClickInNavbar = navbarRef.current?.contains(e.target);
        if (!isClickInNavbar) {
          setActiveModel(null);
          onMenuClick && onMenuClick(null);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeModel, onMenuClick]);

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

  // Get the active component
  const ActiveComponent = activeModel ? MODEL_COMPONENTS[activeModel] : null;

  return (
    <>
      <nav className="ramayan-nav" ref={navbarRef}>
        {/* TOP BAR */}
        <div className="ramayan-nav__top">
          <div className="ramayan-nav__left">
            <div className="ramayan-nav__logo">
              <img
                src={logo}
                alt="Ramayan Logo"
              />
            </div>
            <h1 className="ramayan-nav__title newtitle">Ramayan Series</h1>
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
              className={`ramayan-nav__menu-item ${activeModel === item ? 'active' : ''}`}
              onClick={() => handleMenuClick(item)}
            >
              <span>{item}</span>
              <FiChevronDown />
            </li>
          ))}
        </ul>

        {/* MOBILE MENU - UPDATED with correct submenus */}
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
                    {SUB_MENUS[item].map((sub, j) => (
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

      {/* ACTIVE MODEL OVERLAY */}
      {ActiveComponent && (
        <div className="model-overlay" ref={modelOverlayRef}>
          <ActiveComponent />
        </div>
      )}
    </>
  );
};

export default RamayanNavbar;