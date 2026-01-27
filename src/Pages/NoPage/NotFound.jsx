import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHome, FiArrowLeft } from 'react-icons/fi';
import { MdOutlineMoodBad } from 'react-icons/md';
import './NotFound.scss';

function NotFound() {
  const navigate = useNavigate();
  const [animationDone, setAnimationDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="not-found-page">
      {/* Background Elements */}
      <div className="bg-circles">
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
        <div className="circle circle-4"></div>
      </div>

      <div className="not-found-container">
        {/* Decorative Elements - Removed ॐ, kept only 2 and 3 elements */}
        <div className="floating-element element-1">✨</div>
        <div className="floating-element element-2">🕯️</div>

        {/* Main Content */}
        <div className="not-found-content">
          <div className="error-graphic">
            <div className="candle-container">
              <div className="candle">
                <div className="candle-body">
                  <div className="wax"></div>
                  <div className="wick"></div>
                  <div className="flame"></div>
                  <div className="glow"></div>
                </div>
                <div className="candle-base"></div>
              </div>
              <div className="smoke">
                <div className="smoke-particle p1"></div>
                <div className="smoke-particle p2"></div>
                <div className="smoke-particle p3"></div>
              </div>
            </div>
            
            <div className="numbers-container">
              <div className="number number-4">4</div>
              <div className="number number-0">0</div>
              <div className="number number-4-2">4</div>
            </div>
          </div>

          <div className="error-message">
            <div className="error-header">
              <MdOutlineMoodBad className="error-icon" />
              <h1 className="error-title">Light Not Found</h1>
            </div>
            
            <p className="error-subtitle">
              This page seems to have melted away like candle wax
            </p>
            
            <p className="error-description">
              The divine light you're seeking has flickered out or moved to a different place. 
              Don't worry - even the brightest flames sometimes need relighting.
            </p>

            {/* Removed suggested pages section */}
            
            <div className="action-buttons">
              <button 
                className="action-btn back-btn"
                onClick={() => navigate(-1)}
              >
                <FiArrowLeft />
                Go Back
              </button>
              
              <button 
                className="action-btn home-btn"
                onClick={() => navigate('/')}
              >
                <FiHome />
                Return to Home
              </button>
            </div>

            {/* Removed quote section */}
          </div>
        </div>

        {/* Footer - Updated company name */}
        <div className="not-found-footer">
          <div className="footer-text">
            <span>Mythology • Divine Candle Collection</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NotFound;