import React from "react";
import "./Dhanurveda.scss";
import img from "../../../../../assets/images/home/models/dhanurveda.jpeg";

const Dhanurveda = () => {
  return (
    <section className="dhanurveda-model">
      <div className="dhanurveda-model__inner">

        {/* LEFT CONTENT */}
        <div className="dhanurveda-model__content">
          <h2 className="dhanurveda-title">DHANURVEDA</h2>

          <ul className="dhanurveda-list">
            <li>Lilly of The Valley</li>
            <li>Bitter Almond</li>
            <li>Cinnamon</li>
            <li>Strawberry</li>
            <li>Caramel</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="dhanurveda-model__image">
          <img
            src={img}
            alt="Dhanurveda Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Dhanurveda;