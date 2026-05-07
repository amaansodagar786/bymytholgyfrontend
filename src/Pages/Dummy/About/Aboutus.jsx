import React from "react";
import "./Aboutus.scss";

const Aboutus = () => {
    return (
        <section className="aboutus">
            <div className="aboutus__container">

                {/* LEFT: Stacked Images */}
                <div className="aboutus__images">

                    {/* Top-left: Venice canal — larger card, behind */}
                    <div className="aboutus__img-card aboutus__img-card--venice">
                        <img
                            src="https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?w=500&q=80"
                            alt="Venice canals"
                        />
                    </div>

                    {/* Top-right: Aerial teal beach — smaller card, overlaps venice on right */}
                    <div className="aboutus__img-card aboutus__img-card--beach">
                        <img
                            src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&q=80"
                            alt="Aerial teal beach"
                        />
                    </div>

                    {/* Bottom: Hot air balloons — widest card, comes forward, overlaps both above */}
                    <div className="aboutus__img-card aboutus__img-card--balloon">
                        <img
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80"
                            alt="Hot air balloons"
                        />
                    </div>

                </div>

                {/* RIGHT: Text Content */}
                <div className="aboutus__content">
                    <div className="aboutus__label">
                        <span>About</span>
                        <span className="aboutus__label-line"></span>
                    </div>

                    <h2 className="aboutus__heading">
                        We Recommend <br />
                        Beautiful Destinations <br />
                        Every Month
                    </h2>

                    <p className="aboutus__description">
                        Let's choose your dream destinations here we provide many
                        destinations and we offer the best destinations every week.
                    </p>

                    <div className="aboutus__stats">
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-number">2000+</span>
                            <span className="aboutus__stat-label">Our Explorers</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-number">100+</span>
                            <span className="aboutus__stat-label">Destinations</span>
                        </div>
                        <div className="aboutus__stat">
                            <span className="aboutus__stat-number">20+</span>
                            <span className="aboutus__stat-label">Years Experience</span>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default Aboutus;