import React from "react";
import "./Ramsetu.scss";
import img from "../../../../../assets/images/home/models/ramsetu.jpeg";

const Ramsetu = () => {
  return (
    <section className="ramsetu-model">
      <div className="ramsetu-model__inner">

        {/* LEFT CONTENT */}
        <div className="ramsetu-model__content">
          <h2 className="ramsetu-title">RAMSETU</h2>

          <ul className="ramsetu-list">
            <li>Lemon</li>
            <li>Cardamom</li>
            <li>Musk Melon</li>
            <li>Cucumber</li>
            <li>Aqua</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="ramsetu-model__image">
          <img
            src={img}
            alt="Ramsetu Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Ramsetu;