import React from "react";
import "./Home.scss";
import HeroSection from "./HeroSection/HeroSection";
import ImagesSection from "./Images/ImagesSection";
import Products from "./Products/Products";
import About from "./About/About";
import CtaSection from "./Cta/CtaSection";
import Showcase from "./Showcase/ShowCase";
import ImageSection from "./ImageSection/ImageSection";
import ScrollHero from "./StickyImageSection/Scrollhero";
import ProductsSection2 from "./ProductsSection2/ProductsSection2";
import ScrollHero2 from "./Scroll2/ScrollHero2";
import BestSellerSection from "./BestSellerSection/BestSellerSection";
import ServiceStrip from "./ServiceStrip/ServiceStrip";
import CraftsmanSection from "./Craftsmansection/Craftsmansection";
import ArtisanSection from "./ArtisanSection/ArtisanSection";
import CollectionBanner from "./CollectionBanner/CollectionBanner";

function Home() {
  return (
    <>
      <HeroSection />
     
      <Products />
       <About />
       <ImageSection/>
       
       <ScrollHero/>
       <ProductsSection2/>
       <ScrollHero2/>
       <BestSellerSection/>
       <ServiceStrip/>
       <CraftsmanSection/>
       <ArtisanSection/>
       <CollectionBanner/>
      {/* <CtaSection /> */}
      {/* <ImagesSection /> */}
      {/* <Showcase />  */}
    </>
  );
}

export default Home;