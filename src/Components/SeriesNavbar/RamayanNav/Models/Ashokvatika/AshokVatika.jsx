import React from "react";
import "./AshokVatika.scss";
import img from "../../../../../assets/images/home/models/ashokvatika.jpeg";

const AshokVatika = () => {
  return (
    <section className="ashokvatika-model">
      <div className="ashokvatika-model__inner">

        {/* LEFT CONTENT */}
        <div className="ashokvatika-model__content">
          <h2 className="ashokvatika-title">ASHOK VATIKA</h2>

          <ul className="ashokvatika-list">
            <li>Madurai Malli</li>
            <li>Rose Damascone</li>
            <li>Cedarwood</li>
            <li>Citronella</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="ashokvatika-model__image">
          <img
            src={img}
            alt="Ashok Vatika Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default AshokVatika;