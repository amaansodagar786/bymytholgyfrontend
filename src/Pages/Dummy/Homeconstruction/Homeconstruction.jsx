import React from "react";
import "./HomeConstruction.scss";

const HomeConstruction = () => {
  return (
    <section className="hc">

      {/* ── TOP: Full-width image, no text ── */}
      <div className="hc__banner hc__banner--top">
        <img
          src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&q=80"
          alt="Modern building construction"
        />
      </div>

      {/* ── MIDDLE: Left image | Center text | Right image ── */}
      <div className="hc__middle">

        {/* Left image — peeks in from left edge */}
        <div className="hc__mid-img hc__mid-img--left">
          <img
            src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=500&q=80"
            alt="Modern home exterior left"
          />
        </div>

        {/* Center text block */}
        <div className="hc__mid-text">
          <div className="hc__diamond">◆</div>
          <h2 className="hc__mid-heading">
            If you can <em>dream it</em>, we<br />
            can <em>build it.</em>
          </h2>
          <p className="hc__mid-desc">
            We adapt a uniquely personalised perspective to each project to
            deliver stunning spaces of optimal function. Renowned for our
            architectural understanding and masterful craftsmanship, our
            portfolio of residential projects speaks for itself.
          </p>
          <button className="hc__mid-btn">Get in touch</button>
        </div>

        {/* Right image — peeks in from right edge */}
        <div className="hc__mid-img hc__mid-img--right">
          <img
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=500&q=80"
            alt="Modern home exterior right"
          />
        </div>

      </div>

      {/* ── BOTTOM: Full-width image, no text ── */}
      <div className="hc__banner hc__banner--bottom">
        <img
          src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1400&q=80"
          alt="Luxury kitchen interior"
        />
      </div>

    </section>
  );
};

export default HomeConstruction;