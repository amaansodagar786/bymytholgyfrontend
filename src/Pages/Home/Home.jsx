import React, { useState } from "react";
import "./Home.scss";
import HeroSection from "./HeroSection/HeroSection";
import CandleShowcase from "./Showcase/ShowCase";
import ImagesSection from "./Images/ImagesSection";
import Products from "./Products/Products";
import About from "./About/About";
import CtaSection from "./Cta/CtaSection";
import RamayanNavbar from "../../Components/SeriesNavbar/RamayanNav/RamayanNavbar";
import Valmikijyot from "./../../Components/SeriesNavbar/RamayanNav/Models/ValmikiJyot/Valmikijyot";
import Showcase from "./Showcase/ShowCase";

function Home() {
  const [showValmiki, setShowValmiki] = useState(false);

  return (
    <>
      <RamayanNavbar onValmikiClick={() => setShowValmiki(true)} />
      {showValmiki && <Valmikijyot />}
      <HeroSection />
      <About />
      <Products />
      <CtaSection />
      <ImagesSection />  
      <Showcase />
    </>
  );
}

export default Home;