import React from "react";
import "./CollectionBanner.scss";

// IMPORT YOUR OWN LOGO HERE
import logo from "../../../assets/logo/logo_black.png";
const CollectionBanner = () => {
    return (
        <section className="collection-banner">

            <div className="collection-banner-container">

                <img
                    src={logo}
                    alt="Logo"
                    className="collection-banner-logo"
                />

                <p className="collection-banner-text">
                    Each object is unique and takes you into an olfactory
                    universe paying tribute to the imprint of the world's cultures.
                </p>

                <button className="collection-banner-btn">
                    EXPLORE OUR COLLECTIONS
                </button>

            </div>

        </section>
    );
};

export default CollectionBanner;