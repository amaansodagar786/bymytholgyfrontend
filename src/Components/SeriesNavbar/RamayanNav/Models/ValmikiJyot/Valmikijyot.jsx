import React from "react";
import { useNavigate } from "react-router-dom";
import "./Valmikijyot.scss";
import img from "../../../../../assets/images/home/models/newvalmiki.jpeg"

const Valmikijyot = () => {
  const navigate = useNavigate();

  const handleFragranceClick = (fragrance, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🌸 Clicked fragrance:", fragrance); // For debugging
    navigate(`/product/valmiki-jyot`, {
      state: {
        selectedFragrance: fragrance,
        productName: "Valmiki Jyot"
      }
    });
  };

  const handleTitleClick = () => {
    navigate(`/product/valmiki-jyot`);
  };

  return (
    <section className="valmiki-model">
      <div className="valmiki-model__inner">
        <div className="valmiki-model__content">
          <h2
            className="valmiki-title"
            onClick={handleTitleClick}
          >
            VALMIKI JYOT
          </h2>

          <ul className="valmiki-list">
            <li
              onClick={(e) => handleFragranceClick("crossandra", e)}
              className="valmiki-fragrance-item"
            >
              Crossandra
            </li>
            <li
              onClick={(e) => handleFragranceClick("lavender", e)}
              className="valmiki-fragrance-item"
            >
              Lavender
            </li>
            <li
              onClick={(e) => handleFragranceClick("champagne", e)}
              className="valmiki-fragrance-item"
            >
              Champagne
            </li>
            <li
              onClick={(e) => handleFragranceClick("musk", e)}
              className="valmiki-fragrance-item"
            >
              Musk
            </li>
            <li
              onClick={(e) => handleFragranceClick("cedarwood", e)}
              className="valmiki-fragrance-item"
            >
              Cedarwood
            </li>
          </ul>
        </div>

        <div className="valmiki-model__image">
          <img
            src={img}
            alt="Valmiki Illustration"
            onClick={handleTitleClick}
            style={{ cursor: 'pointer' }}
          />
        </div>
      </div>
    </section>
  );
};

export default Valmikijyot;