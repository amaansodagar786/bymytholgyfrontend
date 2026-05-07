import React from "react";
import "./Home.scss";
import HeroSection from "./HeroSection/HeroSection";
import ImagesSection from "./Images/ImagesSection";
import Products from "./Products/Products";
import About from "./About/About";
import CtaSection from "./Cta/CtaSection";
import Showcase from "./Showcase/ShowCase";
import ImageSection from "./ImageSection/ImageSection";

function Home() {
  return (
    <>
      <HeroSection />
     
      <Products />
       <About />
       <ImageSection/>
      {/* <CtaSection /> */}
      {/* <ImagesSection /> */}
      {/* <Showcase />  */}
    </>
  );
}

export default Home;