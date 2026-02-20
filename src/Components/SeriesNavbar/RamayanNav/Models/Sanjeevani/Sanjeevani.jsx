import React from "react";
import { useNavigate } from "react-router-dom";
import "./Sanjeevani.scss";
import img from "../../../../../assets/images/home/models/sanjeevani.jpeg";

const Sanjeevani = () => {
  const navigate = useNavigate();

  const handleFragranceClick = (fragrance, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log("🌸 Clicked fragrance:", fragrance);
    navigate(`/product/sanjeevani`, {
      state: {
        selectedFragrance: fragrance,
        productName: "Sanjeevani"
      }
    });
  };

  const handleTitleClick = () => {
    navigate(`/product/sanjeevani`);
  };

  return (
    <section className="sanjeevani-model">
      <div className="sanjeevani-model__inner">

        {/* LEFT CONTENT */}
        <div className="sanjeevani-model__content">
          <h2
            className="sanjeevani-title"
            onClick={handleTitleClick}
          >
            SANJEEVANI
          </h2>

          <ul className="sanjeevani-list">
            <li
              onClick={(e) => handleFragranceClick("marijuana", e)}
              className="sanjeevani-fragrance-item"
            >
              Marijuana
            </li>
            <li
              onClick={(e) => handleFragranceClick("camphor", e)}
              className="sanjeevani-fragrance-item"
            >
              Camphor
            </li>
            <li
              onClick={(e) => handleFragranceClick("violet leaf", e)}
              className="sanjeevani-fragrance-item"
            >
              Violet Leaf
            </li>
            <li
              onClick={(e) => handleFragranceClick("seaweed", e)}
              className="sanjeevani-fragrance-item"
            >
              Seaweed
            </li>
            <li
              onClick={(e) => handleFragranceClick("moss", e)}
              className="sanjeevani-fragrance-item"
            >
              Moss
            </li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="sanjeevani-model__image">
          <img
            src={img}
            alt="Sanjeevani Illustration"
            onClick={handleTitleClick}
          />
        </div>

      </div>
    </section>
  );
};

export default Sanjeevani;