import React from "react";
import "./Dandakaranya.scss";
import img from "../../../../../assets/images/home/models/dandakaranya.jpeg";

const Dandakaranya = () => {
  return (
    <section className="dandakaranya-model">
      <div className="dandakaranya-model__inner">

        {/* LEFT CONTENT */}
        <div className="dandakaranya-model__content">
          <h2 className="dandakaranya-title">DANDAKARANYA</h2>

          <ul className="dandakaranya-list">
            <li>White Amber</li>
            <li>Clove</li>
            <li>Nutmeg</li>
            <li>Jasmine</li>
            <li>Pinewood</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="dandakaranya-model__image">
          <img
            src={img}
            alt="Dandakaranya Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Dandakaranya;