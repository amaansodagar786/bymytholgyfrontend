import React from "react";
import { motion } from "framer-motion";
import "./CtaSection.scss";

const CtaSection = () => {
  // Text animation variants
  const textVariants = {
    hidden: { 
      opacity: 0, 
      y: 40 
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 1,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.2
      }
    }
  };

  // Background overlay animation
  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  // Word animation for typing effect
  const wordVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.5 + (i * 0.02),
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };

  // Split text into words for word-by-word animation
  const text = "PARAFFIN - FREE | NATURAL | NON-TOXIC | HAND - POURED";
  const words = text.split(" ");

  // Background image URL (you can also import an image file)
  const backgroundImage = "https://images.unsplash.com/photo-1602173574767-37ac01994b2a";

  return (
    <section 
      className="cta-section"
      style={{
        backgroundImage: `url(${backgroundImage})`
      }}
    >
      <motion.div 
        className="cta-overlay"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={overlayVariants}
      >
        <motion.h2 
          className="cta-text"
          variants={textVariants}
        >
          {/* Word-by-word animation */}
          {words.map((word, index) => (
            <motion.span
              key={index}
              custom={index}
              variants={wordVariants}
              style={{ display: 'inline-block', marginRight: '4px' }}
            >
              {word}
            </motion.span>
          ))}
        </motion.h2>
      </motion.div>
    </section>
  );
};

export default CtaSection;