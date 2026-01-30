import React from "react";
import "./Vijayagamanam.scss";
import img from "../../../../../assets/images/home/models/vijayagamanam.jpeg";

const Vijayagamanam = () => {
  return (
    <section className="vijayagamanam-model">
      <div className="vijayagamanam-model__inner">

        {/* LEFT CONTENT */}
        <div className="vijayagamanam-model__content">
          <h2 className="vijayagamanam-title">VIJAYAGAMANAM</h2>

          <ul className="vijayagamanam-list">
            <li>Lilac</li>
            <li>Vanilla</li>
            <li>Grapefruit</li>
            <li>Sandalwood</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="vijayagamanam-model__image">
          <img
            src={img}
            alt="Vijayagamanam Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Vijayagamanam;