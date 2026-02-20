import React from "react";
import { useNavigate } from "react-router-dom";
import "./AshokVatika.scss";
import img from "../../../../../assets/images/home/models/ashokvatika.jpeg";

const AshokVatika = () => {
  const navigate = useNavigate();

  const handleFragranceClick = (fragrance, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🌸 Clicked fragrance:", fragrance);
    navigate(`/product/ashok-vatika`, {
      state: {
        selectedFragrance: fragrance,
        productName: "Ashok Vatika"
      }
    });
  };

  const handleTitleClick = () => {
    navigate(`/product/ashok-vatika`);
  };

  return (
    <section className="ashokvatika-model">
      <div className="ashokvatika-model__inner">

        {/* LEFT CONTENT */}
        <div className="ashokvatika-model__content">
          <h2 
            className="ashokvatika-title"
            onClick={handleTitleClick}
          >
            ASHOK VATIKA
          </h2>

          <ul className="ashokvatika-list">
            <li 
              onClick={(e) => handleFragranceClick("madurai malli", e)}
              className="ashokvatika-fragrance-item"
            >
              Madurai Malli
            </li>
            <li 
              onClick={(e) => handleFragranceClick("rose damascone", e)}
              className="ashokvatika-fragrance-item"
            >
              Rose Damascone
            </li>
            <li 
              onClick={(e) => handleFragranceClick("cedarwood", e)}
              className="ashokvatika-fragrance-item"
            >
              Cedarwood
            </li>
            <li 
              onClick={(e) => handleFragranceClick("citronella", e)}
              className="ashokvatika-fragrance-item"
            >
              Citronella
            </li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="ashokvatika-model__image">
          <img
            src={img}
            alt="Ashok Vatika Illustration"
            onClick={handleTitleClick}
          />
        </div>

      </div>
    </section>
  );
};

export default AshokVatika;