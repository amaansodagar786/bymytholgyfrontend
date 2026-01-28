import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./Scroll.scss";

gsap.registerPlugin(ScrollTrigger);

const Scroll = () => {
  const sectionRef = useRef(null);
  const rightRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const right = rightRef.current;

    const trigger = ScrollTrigger.create({
      trigger: right,              // 🔥 pin based on RIGHT content
      start: "bottom bottom",      // 🔥 when right content ENDS
      endTrigger: section,         // 🔥 release at section end
      end: "bottom bottom",

      pin: right,
      pinSpacing: true,
    });

    return () => {
      trigger.kill();
    };
  }, []);

  return (
    <>
      {/* SCROLL SECTION */}
      <section className="scroll-section" ref={sectionRef}>
        <div className="columns">
          {/* LEFT – LONG */}
          <div className="left">
            {[...Array(100)].map((_, i) => (
              <p key={i}>
                Left content line {i + 1}. This keeps scrolling after right stops.
              </p>
            ))}
          </div>

          {/* RIGHT – SHORT */}
          <div className="right" ref={rightRef}>
            {[...Array(40)].map((_, i) => (
              <p key={i}>
                Right content line {i + 1}. This stops here.
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* NEXT SECTION */}
      <section className="next-section">
        <h2>Next Section</h2>
        <p>This starts only after the scroll section fully ends.</p>
      </section>
    </>
  );
};

export default Scroll;
