import React from "react";
import "./BestSellerSection.scss";

const BestSellerSection = () => {
    return (
        <section className="best-seller-section">

            <div className="best-seller-container">

                <div className="best-seller-content">

                    <span className="best-seller-small-title">
                        Our best seller
                    </span>

                    <h2 className="best-seller-title">
                        BLACK PEARLS
                    </h2>

                    <p className="best-seller-description">
                        La touche finale idéale pour votre intérieur, où le gingembre
                        et la rose noire révèlent la signature iconique de Black Pearls,
                        à la fois puissante et subtile.
                    </p>

                </div>

                <div className="best-seller-image-wrap">

                    <img
                        src="https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2070&auto=format&fit=crop"
                        alt="Black Pearls"
                    />

                </div>

            </div>

        </section>
    );
};

export default BestSellerSection;