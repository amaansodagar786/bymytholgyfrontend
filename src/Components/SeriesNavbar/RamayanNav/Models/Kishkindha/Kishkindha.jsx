import React from "react";
import { useNavigate } from "react-router-dom";
import "./Kishkindha.scss";
import img from "../../../../../assets/images/home/models/kishkindha.jpeg";

const Kishkindha = () => {
  const navigate = useNavigate();

  const handleFragranceClick = (fragrance, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🌸 Clicked fragrance:", fragrance);
    navigate(`/product/kishkindha`, {
      state: {
        selectedFragrance: fragrance,
        productName: "Kishkindha"
      }
    });
  };

  const handleTitleClick = () => {
    navigate(`/product/kishkindha`);
  };

  return (
    <section className="kishkindha-model">
      <div className="kishkindha-model__inner">

        {/* LEFT CONTENT */}
        <div className="kishkindha-model__content">
          <h2 
            className="kishkindha-title"
            onClick={handleTitleClick}
          >
            KISHKINDHA
          </h2>

          <ul className="kishkindha-list">
            <li 
              onClick={(e) => handleFragranceClick("patchouli", e)}
              className="kishkindha-fragrance-item"
            >
              Patchouli
            </li>
            <li 
              onClick={(e) => handleFragranceClick("black agar", e)}
              className="kishkindha-fragrance-item"
            >
              Black Agar
            </li>
            <li 
              onClick={(e) => handleFragranceClick("oud", e)}
              className="kishkindha-fragrance-item"
            >
              Oud
            </li>
            <li 
              onClick={(e) => handleFragranceClick("rose", e)}
              className="kishkindha-fragrance-item"
            >
              Rose
            </li>
            <li 
              onClick={(e) => handleFragranceClick("sandalwood", e)}
              className="kishkindha-fragrance-item"
            >
              Sandalwood
            </li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="kishkindha-model__image">
          <img
            src={img}
            alt="Kishkindha Illustration"
            onClick={handleTitleClick}
          />
        </div>

      </div>
    </section>
  );
};

export default Kishkindha;