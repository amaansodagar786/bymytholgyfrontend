import React from "react";
import "./Kishkindha.scss";
import img from "../../../../../assets/images/home/models/kishkindha.jpeg";

const Kishkindha = () => {
  return (
    <section className="kishkindha-model">
      <div className="kishkindha-model__inner">

        {/* LEFT CONTENT */}
        <div className="kishkindha-model__content">
          <h2 className="kishkindha-title">KISHKINDHA</h2>

          <ul className="kishkindha-list">
            <li>Patchouli</li>
            <li>Black Agar</li>
            <li>Oud</li>
            <li>Rose</li>
            <li>Sandalwood</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="kishkindha-model__image">
          <img
            src={img}
            alt="Kishkindha Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Kishkindha;