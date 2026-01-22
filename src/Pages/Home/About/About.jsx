import React from "react";
import { motion } from "framer-motion";
import "./About.scss";
import ramayanImg from "../../../assets/images/home/about.png";

const About = () => {
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

  const textVariants = {
    hidden: { opacity: 0, y: 30 },
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
    hidden: { opacity: 0, scale: 0.9, rotateY: -15 },
    visible: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 1,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <section className="about-ramayan">
      <motion.div 
        className="about-container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={containerVariants}
      >
        {/* LEFT CONTENT */}
        <motion.div 
          className="about-content"
          variants={containerVariants}
        >
          <motion.h5 className="about-small" variants={textVariants}>
            About
          </motion.h5>
          <motion.h2 className="about-title" variants={textVariants}>
            Ramayan Series
          </motion.h2>

          <motion.p variants={textVariants}>
            At Brymthology, we don't just create candles we bring
            ancient stories to life through light.
          </motion.p>

          <motion.p variants={textVariants}>
            Rooted in Indian culture and inspired by timeless epics,
            our candles are designed to celebrate mythology,
            spirituality, and art.
          </motion.p>

          <motion.p className="about-intro" variants={textVariants}>
            <strong>Introducing: The Ramayan Series</strong>
            <br />
            A sacred collection inspired by the eternal journey of
            Shri Ram, symbolizing Dharma, Bhakti, Courage,
            Sacrifice, and Victory of Truth.
          </motion.p>
        </motion.div>

        {/* RIGHT IMAGE */}
        <motion.div 
          className="about-image"
          variants={imageVariants}
        >
          <img src={ramayanImg} alt="Ramayan Series Statue" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default About;