import React from "react";
import { motion } from "framer-motion";
import "./ImagesSection.scss";

const ImagesSection = () => {
  // Fixed Unsplash images - all should work now
  const candleImages = [
    "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb",
    "https://images.unsplash.com/photo-1533090161767-e6ffed986c88",
    "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb",
  ];
  
  const platforms = [
    {
      name: "Zomato",
      color: "#e23744",
      textColor: "white",
    },
    {
      name: "Blinkit",
      color: "#f9d74c",
      textColor: "black",
    },
    {
      name: "Flipkart",
      color: "#ffee3b",
      textColor: "#0047ff",
      letter: "F",
    },
    {
      name: "Zepto",
      color: "#4a0072",
      textColor: "#ff4d8d",
    },
  ];

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.8, rotateY: 20 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: [0.22, 1, 0.36, 1]
      }
    })
  };

  const logoVariants = {
    hidden: { opacity: 0, scale: 0.5, rotate: -10 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      rotate: 0,
      transition: {
        delay: 0.3 + (i * 0.05),
        duration: 0.6,
        ease: "backOut"
      }
    })
  };

  return (
    <motion.div 
      className="images-section"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
    >
      {/* CANDLE IMAGES SLIDER WITH SHADOWS */}
      <div className="images-section__candles">
        {/* Left Shadow Gradient */}
        <div className="images-section__shadow images-section__shadow--left"></div>
        
        {/* Candle Images */}
        <div className="images-section__candles-track">
          {candleImages.map((img, i) => (
            <motion.div 
              key={i} 
              className="images-section__candle-item"
              custom={i}
              variants={imageVariants}
            >
              <div className="images-section__candle-image-wrapper">
                <img src={img} alt={`Candle ${i + 1}`} />
              </div>
            </motion.div>
          ))}
        </div>
        
        {/* Right Shadow Gradient */}
        <div className="images-section__shadow images-section__shadow--right"></div>
      </div>

      {/* PLATFORMS SECTION */}
      <div className="images-section__platforms">
        <motion.h2
          variants={itemVariants}
          className="images-section__title"
        >
          We are also available here
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="images-section__description"
        >
          Order your favorite candles effortlessly from apps you already trust.
        </motion.p>

        {/* LOGOS MARQUEE */}
        <motion.div 
          className="images-section__logos-outer"
          variants={itemVariants}
        >
          <div className="images-section__logos-inner">
            {[...platforms, ...platforms].map((item, i) => (
              <motion.div 
                key={i} 
                className="images-section__logo-item"
                custom={i}
                variants={logoVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
              >
                <div 
                  className="images-section__logo-box"
                  style={{ 
                    backgroundColor: item.color,
                    color: item.textColor
                  }}
                >
                  {item.letter || item.name}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ImagesSection;