import React from "react";
import "./Valmikijyot.scss";

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
            src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=1600&auto=format&fit=crop"
            alt="Valmiki Illustration"
          />
        </div>

      </div>
    </section>
  );
};

export default Valmikijyot;
