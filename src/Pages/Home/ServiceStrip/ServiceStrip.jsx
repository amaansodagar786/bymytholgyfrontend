import React from "react";
import "./ServiceStrip.scss";

const services = [

    {
        title: "THE ART OF GIFTING",
        desc: "Refined gift wrapping & personalised cards",
    },

    {
        title: "FREE RETURNS*",
        desc: "within 14 business days.",
    },
    {
        title: "BIRTHDAY PROGRAMME",
        desc: "Subscribe and receive a special gift.",
    },
    {
        title: "FREE DELIVERY",
        desc: "from €150 purchase.",
    },

    
    {
        title: "CUSTOMER SERVICE",
        desc: "Visit the help centre, or contact us.",
    },
];

const ServiceStrip = () => {
    return (
        <section className="service-strip">

            <div className="service-strip-container">

                {services.map((item, index) => (
                    <div className="service-item" key={index}>

                        <h3>{item.title}</h3>

                        <p>{item.desc}</p>

                    </div>
                ))}

            </div>

        </section>
    );
};

export default ServiceStrip;