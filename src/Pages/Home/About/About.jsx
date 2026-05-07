import React from "react";
import "./About.scss";

const About = () => {
  return (
    <section className="about-section">
      <div className="about-container">

        {/* <button className="about-top-btn">
          DISCOVER THE COLLECTION
        </button> */}

        <p className="about-subtitle">
          The glass is brought to life
        </p>

        <h2 className="about-title">
          THROUGH THE ARTISAN’S BREATH.
        </h2>

        <p className="about-description">
          The subtle soul of man shines through in the creation of our
          hand-blown glasses. The incandescent material is wrapped around
          a rod, as the craftsman's breath brings the form to life.
          Colors appear thanks to the inclusion of confetti or strands
          of glass that appear randomly, as if by magic. Hand-blown
          glass is a precious technique that embodies the craftsman's
          know-how.
        </p>

        <button className="about-bottom-btn">
          DISCOVER MORE
        </button>

      </div>
    </section>
  );
};

export default About;