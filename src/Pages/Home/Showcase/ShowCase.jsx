import React from "react";
import "./Showcase.scss";

import showcase1 from "../../../assets/images/home/showcase1.jpg"
import showcase2 from "../../../assets/images/home/showcase2.jpg"

const Showcase = () => {
  return (
    <div className="showcase">
      <div className="showcase__grid">
        {/* LEFT CANDLE */}
        <div className="showcase__item">
          <img
            src={showcase1}
            alt="Elegant white candle with gold accents"
            className="showcase__image"
          />
        </div>

        {/* RIGHT CANDLE */}
        <div className="showcase__item">
          <img
            src={showcase2}
            alt="Scented candle with herbs and spices"
            className="showcase__image"
          />
        </div>
      </div>
    </div>
  );
};

export default Showcase;