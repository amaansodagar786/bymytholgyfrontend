import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dandakaranya.scss";
import img from "../../../../../assets/images/home/models/dandakaranya.jpeg";

const Dandakaranya = () => {
  const navigate = useNavigate();

  const handleFragranceClick = (fragrance, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🌸 Clicked fragrance:", fragrance);
    navigate(`/product/dandakaranya`, {
      state: {
        selectedFragrance: fragrance,
        productName: "Dandakaranya"
      }
    });
  };

  const handleTitleClick = () => {
    navigate(`/product/dandakaranya`);
  };

  return (
    <section className="dandakaranya-model">
      <div className="dandakaranya-model__inner">

        {/* LEFT CONTENT */}
        <div className="dandakaranya-model__content">
          <h2 
            className="dandakaranya-title"
            onClick={handleTitleClick}
          >
            DANDAKARANYA
          </h2>

          <ul className="dandakaranya-list">
            <li 
              onClick={(e) => handleFragranceClick("white amber", e)}
              className="dandakaranya-fragrance-item"
            >
              White Amber
            </li>
            <li 
              onClick={(e) => handleFragranceClick("clove", e)}
              className="dandakaranya-fragrance-item"
            >
              Clove
            </li>
            <li 
              onClick={(e) => handleFragranceClick("nutmeg", e)}
              className="dandakaranya-fragrance-item"
            >
              Nutmeg
            </li>
            <li 
              onClick={(e) => handleFragranceClick("jasmine", e)}
              className="dandakaranya-fragrance-item"
            >
              Jasmine
            </li>
            <li 
              onClick={(e) => handleFragranceClick("pinewood", e)}
              className="dandakaranya-fragrance-item"
            >
              Pinewood
            </li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="dandakaranya-model__image">
          <img
            src={img}
            alt="Dandakaranya Illustration"
            onClick={handleTitleClick}
          />
        </div>

      </div>
    </section>
  );
};

export default Dandakaranya;