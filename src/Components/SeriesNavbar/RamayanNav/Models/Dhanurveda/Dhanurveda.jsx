import React from "react";
import { useNavigate } from "react-router-dom";
import "./Dhanurveda.scss";
import img from "../../../../../assets/images/home/models/dhanurveda.jpeg";

const Dhanurveda = () => {
  const navigate = useNavigate();

  const handleFragranceClick = (fragrance, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🌸 Clicked fragrance:", fragrance);
    navigate(`/product/dhanurveda`, {
      state: {
        selectedFragrance: fragrance,
        productName: "Dhanurveda"
      }
    });
  };

  const handleTitleClick = () => {
    navigate(`/product/dhanurveda`);
  };

  return (
    <section className="dhanurveda-model">
      <div className="dhanurveda-model__inner">

        {/* LEFT CONTENT */}
        <div className="dhanurveda-model__content">
          <h2 
            className="dhanurveda-title"
            onClick={handleTitleClick}
          >
            DHANURVEDA
          </h2>

          <ul className="dhanurveda-list">
            <li 
              onClick={(e) => handleFragranceClick("lilly of the valley", e)}
              className="dhanurveda-fragrance-item"
            >
              Lilly of The Valley
            </li>
            <li 
              onClick={(e) => handleFragranceClick("bitter almond", e)}
              className="dhanurveda-fragrance-item"
            >
              Bitter Almond
            </li>
            <li 
              onClick={(e) => handleFragranceClick("cinnamon", e)}
              className="dhanurveda-fragrance-item"
            >
              Cinnamon
            </li>
            <li 
              onClick={(e) => handleFragranceClick("strawberry", e)}
              className="dhanurveda-fragrance-item"
            >
              Strawberry
            </li>
            <li 
              onClick={(e) => handleFragranceClick("caramel", e)}
              className="dhanurveda-fragrance-item"
            >
              Caramel
            </li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="dhanurveda-model__image">
          <img
            src={img}
            alt="Dhanurveda Illustration"
            onClick={handleTitleClick}
          />
        </div>

      </div>
    </section>
  );
};

export default Dhanurveda;