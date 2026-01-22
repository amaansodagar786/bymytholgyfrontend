import React from "react";
import { motion } from "framer-motion";
import "./Footer.scss";
import { FaInstagram, FaFacebookF, FaLinkedinIn, FaYoutube } from "react-icons/fa";
import logo from "../../assets/logo/logo.png";

const Footer = () => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  const iconVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i) => ({
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.5 + (i * 0.1),
        duration: 0.5,
        ease: "backOut"
      }
    }),
    hover: {
      scale: 1.2,
      rotate: 360,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const linkVariants = {
    hover: {
      x: 10,
      color: "#f5d47f",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  // Social media links
  const socialLinks = {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    youtube: "https://youtube.com"
  };

  // Company links
  const companyLinks = {
    home: "/",
    about: "/about",
    contact: "/contact",
    comingSoon: "/coming-soon"
  };

  // Series links
  const seriesLinks = {
    ramayan: "/series/ramayan",
    swaminarayan: "/series/swaminarayan",
    krishnaLila: "/series/krishna-lila"
  };

  return (
    <footer className="footer">
      <motion.div 
        className="footer__top"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        {/* LEFT LOGO */}
        <motion.div className="footer__logo" variants={itemVariants}>
          <img src={logo} alt="By Mythology" />
          <div className="footer__icons">
            {[
              { icon: <FaInstagram />, link: socialLinks.instagram, index: 0 },
              { icon: <FaFacebookF />, link: socialLinks.facebook, index: 1 },
              { icon: <FaLinkedinIn />, link: socialLinks.linkedin, index: 2 },
              { icon: <FaYoutube />, link: socialLinks.youtube, index: 3 }
            ].map(({ icon, link, index }) => (
              <motion.a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                custom={index}
                variants={iconVariants}
                initial="hidden"
                animate="visible"
                whileHover="hover"
                className="footer__icon-link"
              >
                {icon}
              </motion.a>
            ))}
          </div>
        </motion.div>

        {/* COMPANY */}
        <motion.div className="footer__col" variants={itemVariants}>
          <h4>COMPANY</h4>
          <ul>
            {Object.entries(companyLinks).map(([key, link]) => (
              <motion.li
                key={key}
                variants={linkVariants}
                whileHover="hover"
                className="footer__link-item"
              >
                <a href={link}>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}</a>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* SERIES */}
        <motion.div className="footer__col" variants={itemVariants}>
          <h4>SERIES</h4>
          <ul>
            {Object.entries(seriesLinks).map(([key, link]) => (
              <motion.li
                key={key}
                variants={linkVariants}
                whileHover="hover"
                className="footer__link-item"
              >
                <a href={link}>
                  {key === 'krishnaLila' ? 'Krishna Lila' : key.charAt(0).toUpperCase() + key.slice(1)}
                </a>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* CONTACT */}
        <motion.div className="footer__col" variants={itemVariants}>
          <h4>CONTACT</h4>
          <motion.p whileHover={{ scale: 1.05 }}>
            <a href="tel:+911233456781">+91 1233456781</a>
          </motion.p>
          <motion.p whileHover={{ scale: 1.05 }}>
            <a href="mailto:bymythology@gmail.com">bymythology@gmail.com</a>
          </motion.p>
          <motion.p whileHover={{ scale: 1.05 }}>
            <a 
              href="https://maps.google.com/?q=41,Luna+Road,Taluko:Padra,District:Vadodara-391440,Gujarat" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              41, Luna Rd, Taluko: Padra,
              <br />
              District: Vadodara-391440,
              <br />
              Gujarat.
            </a>
          </motion.p>
        </motion.div>

        {/* COPYRIGHT */}
        <motion.div 
          className="footer__bottom"
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          Copyright © 2026 Candle - All Rights Reserved.
          <span>
            Design and Developed by{" "}
            <motion.b
              whileHover={{ scale: 1.1, color: "#f5d47f" }}
              transition={{ duration: 0.3 }}
            >
              <a href="https://techorses.com" target="_blank" rel="noopener noreferrer">
                TECHORSES
              </a>
            </motion.b>
          </span>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;