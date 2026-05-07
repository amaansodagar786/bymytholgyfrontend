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
          Brymthology
        </p>

        <h2 className="about-title">
          RAMAYAN SERIES
        </h2>

        <p className="about-description">
          At Brymthology, we don't just create candles - we bring ancient stories to life through light.
          Rooted in Indian culture and inspired by timeless epics, our candles are designed
          to celebrate mythology, spirituality, and art.
          <br /><br />
          Introducing: The Ramayan Series - A sacred collection inspired by the eternal journey of Shri Ram,
          symbolizing Dharma, Bhakti, Courage, Sacrifice, and Victory of Truth.
        </p>

        <button className="about-bottom-btn">
          DISCOVER THE COLLECTION
        </button>

      </div>
    </section>
  );
};

export default About;