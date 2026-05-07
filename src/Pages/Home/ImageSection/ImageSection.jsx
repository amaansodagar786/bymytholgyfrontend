import React from "react";
import "./ImageSection.scss";

const ImageSection = () => {
    return (
        <section className="image-section">
            <div className="image-section-container">
                <img
                    src="https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=1974&auto=format&fit=crop"
                    alt="Glass Craft"
                />
            </div>
        </section>
    );
};

export default ImageSection;