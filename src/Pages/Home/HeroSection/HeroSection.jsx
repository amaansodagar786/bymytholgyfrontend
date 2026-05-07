import React from "react";
import "./HeroSection.scss";
import herovideo from "../../../assets/images/home/hero.mp4";

const HeroSection = () => {
  return (
    <section className="hero-section">
      <video
        className="hero-video"
        autoPlay
        loop
        muted
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
      >
        <source src={herovideo} type="video/mp4" />
      </video>

      <div className="hero-content">
        <p className="hero-subheading">Collection</p>
        <h1 className="hero-heading">Bymythology</h1>
        <p className="hero-subtitle">Discover our premium collection</p>
        <button className="hero-btn">SHOP NOW</button>
      </div>
    </section>
  );
};

export default HeroSection;