import React from "react";
import { motion } from "framer-motion";
import "./Footer.scss";
import {
  FaInstagram,
  FaFacebookF,
  FaLinkedinIn,
  FaYoutube,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt
} from "react-icons/fa";
import logo from "../../assets/logo/logo_white.png";

const Footer = () => {
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
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
  };

  const linkVariants = {
    hover: {
      x: 10,
      color: "#ffffff",
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    }
  };

  const socialLinks = {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    linkedin: "https://linkedin.com",
    youtube: "https://youtube.com"
  };

  const companyLinks = {
    home: "/",
    about: "/about",
    contact: "/contact",
    comingSoon: "/coming-soon"
  };

  const seriesLinks = {
    ramayan: "/series/ramayan",
    swaminarayan: "/series/swaminarayan",
    krishnaLila: "/series/krishna-lila"
  };

  return (
    <footer className="footer">
      <motion.div
        className="footer__container"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={containerVariants}
      >
        {/* FIRST COLUMN - Logo + Description */}
        <motion.div className="footer__col footer__col--logo" variants={itemVariants}>
          <div className="footer__logo-wrapper">
            <img src={logo} alt="By Mythology" className="footer__logo" />
          </div>
          <p className="footer__description">
            Bringing mythology to life through art and storytelling.
            We create timeless pieces that capture the essence of ancient.
          </p>
        </motion.div>

        {/* SECOND COLUMN - COMPANY */}
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
                <a href={link}>
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                </a>
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* THIRD COLUMN - SERIES (Hidden on tablet & mobile) */}
        <motion.div className="footer__col footer__col--series" variants={itemVariants}>
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

        {/* FOURTH COLUMN - CONTACT (Social icons removed from here) */}
        <motion.div className="footer__col footer__col--contact" variants={itemVariants}>
          <h4>CONTACT</h4>

          {/* Phone */}
          <div className="footer__contact-item">
            <FaPhoneAlt className="footer__contact-icon" />
            <motion.p whileHover={{ scale: 1.05 }}>
              <a href="tel:+911233456781">+91 1233456781</a>
            </motion.p>
          </div>

          {/* Email */}
          <div className="footer__contact-item">
            <FaEnvelope className="footer__contact-icon" />
            <motion.p whileHover={{ scale: 1.05 }}>
              <a href="mailto:bymythology@gmail.com">bymythology@gmail.com</a>
            </motion.p>
          </div>

          {/* Address with map icon only on first line */}
          <div className="footer__contact-item">
            <FaMapMarkerAlt className="footer__contact-icon" />
            <p className="footer__address">
              <a
                href="https://maps.google.com/?q=41,Luna+Road,Taluko:Padra,District:Vadodara-391440,Gujarat"
                target="_blank"
                rel="noopener noreferrer"
              >
                41, Luna Rd, Taluka: Padra,<br />
                District: Vadodara-391440,<br />
                Gujarat.
              </a>
            </p>
          </div>
        </motion.div>

        {/* COPYRIGHT + SOCIAL ICONS in same row */}
        <motion.div className="footer__bottom" variants={itemVariants}>
          <div className="footer__bottom-wrapper">
            <div className="footer__copyright">
              Copyright © 2026 ByMythology - All Rights Reserved.
              <span className="footer__credit">
                Design and Developed by{" "}
                <motion.b
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                >
                  <a href="https://techorses.com" target="_blank" rel="noopener noreferrer">
                    TECHORSES
                  </a>
                </motion.b>
              </span>
            </div>

            {/* Social Icons - Desktop: Right side, Mobile/Tablet: Below Contact */}
            <div className="footer__social-icons">
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
            </div>
          </div>
        </motion.div>
      </motion.div>
    </footer>
  );
};

export default Footer;