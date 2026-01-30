import React from "react";
import "./Sanjeevani.scss";
import img from "../../../../../assets/images/home/models/sanjeevani.jpeg";

const Sanjeevani = () => {
  return (
    <section className="sanjeevani-model">
      <div className="sanjeevani-model__inner">

        {/* LEFT CONTENT */}
        <div className="sanjeevani-model__content">
          <h2 className="sanjeevani-title">SANJEEVANI</h2>

          <ul className="sanjeevani-list">
            <li>Marijuana</li>
            <li>Camphor</li>
            <li>Violet Leaf</li>
            <li>Seaweed</li>
            <li>Moss</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="sanjeevani-model__image">
          <img
            src={img}
            alt="Sanjeevani Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Sanjeevani;