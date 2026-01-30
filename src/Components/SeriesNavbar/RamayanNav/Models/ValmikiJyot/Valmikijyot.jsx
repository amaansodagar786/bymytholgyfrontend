import React from "react";
import "./Valmikijyot.scss";
// import img from "../../../../../assets/images/home/models/valmiki.png"
import img from "../../../../../assets/images/home/models/newvalmiki.jpeg"

const Valmikijyot = () => {
  return (
    <section className="valmiki-model">
      <div className="valmiki-model__inner">

        {/* LEFT CONTENT */}
        <div className="valmiki-model__content">
          <h2 className="valmiki-title">VALMIKI JYOT</h2>

          <ul className="valmiki-list">
            <li>Crossandra</li>
            <li>Lavender</li>
            <li>Champagne</li>
            <li>Musk</li>
            <li>Cedarwood</li>
          </ul>
        </div>

        {/* RIGHT IMAGE */}
        <div className="valmiki-model__image">
          <img
            src= {img}
            alt="Valmiki Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Valmikijyot;
