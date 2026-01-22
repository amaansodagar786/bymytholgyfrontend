import React from "react";
import "./Showcase.scss";

const Showcase = () => {
  return (
    <div className="showcase">
      <div className="showcase__grid">
        {/* LEFT CANDLE */}
        <div className="showcase__item">
          <img
src="https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?q=80&w=1600&auto=format&fit=crop"
            alt="Elegant white candle with gold accents"
            className="showcase__image"
          />
        </div>

        {/* RIGHT CANDLE */}
        <div className="showcase__item">
          <img
            src="https://images.unsplash.com/photo-1587049352851-8d4e89133924?q=80&w=1600&auto=format&fit=crop"
            alt="Scented candle with herbs and spices"
            className="showcase__image"
          />
        </div>
      </div>
    </div>
  );
};

export default Showcase;