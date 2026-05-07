import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./CraftsmanSection.scss";

// 🔁 Replace with your actual image import
const craftImg =
    "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=900&q=80";

const CraftsmanSection = () => {
    const sectionRef = useRef(null);
    const textRef = useRef(null);
    const triggerScrollY = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const textEl = textRef.current;

        const isMobile = () => window.innerWidth <= 1024;

        const handleScroll = () => {
            if (!textEl || !sectionRef.current) return;

            // ── No effect on tablet / mobile ──
            if (isMobile()) {
                textEl.style.transform = "translateY(0px)";
                triggerScrollY.current = null;
                return;
            }

            const section = sectionRef.current;
            const currentScrollY = window.scrollY;
            const sectionRect = section.getBoundingClientRect();
            const sectionHeight = section.offsetHeight;
            const textHeight = textEl.offsetHeight;

            // Trigger: section top touches viewport top (sectionRect.top <= 0)
            const sectionTouchedTop = sectionRect.top <= 0;

            if (!sectionTouchedTop) {
                // Section hasn't reached top yet — reset
                textEl.style.transform = "translateY(0px)";
                triggerScrollY.current = null;
                return;
            }

            // Lock trigger point once when section hits top
            if (triggerScrollY.current === null) {
                triggerScrollY.current = currentScrollY;
            }

            const scrolledSinceTrigger = currentScrollY - triggerScrollY.current;

            // Max travel = section height - text height - top padding - bottom gap
            const maxTravel = sectionHeight - textHeight - 48 - 48;

            const travel = Math.min(Math.max(0, scrolledSinceTrigger), maxTravel);
            textEl.style.transform = `translateY(${travel}px)`;

            // Reset only when fully scrolled back above trigger
            if (travel === 0 && currentScrollY < triggerScrollY.current) {
                triggerScrollY.current = null;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        window.addEventListener("resize", handleScroll, { passive: true });
        handleScroll();

        return () => {
            window.removeEventListener("scroll", handleScroll);
            window.removeEventListener("resize", handleScroll);
        };
    }, []);

    return (
        <section className="cs-section" ref={sectionRef}>
            <div className="cs-inner">

                {/* ── Left: Image ── */}
                <div className="cs-image-wrap">
                    <img
                        src={craftImg}
                        alt="Craftsman at work"
                        className="cs-image"
                        loading="lazy"
                    />
                </div>

                {/* ── Right: Scroll-pinned text ── */}
                <div className="cs-text-outer">
                    <div className="cs-text-inner" ref={textRef}>
                        <span className="cs-eyebrow">At the heart of each piece lies</span>
                        <h2 className="cs-heading">The Hand of the<br />Craftsman</h2>
                        <p className="cs-sub">
                            who blows the glass and leaves in each piece a complement of soul.
                        </p>
                        <p className="cs-body">
                            Step into our world of scented bliss where permanent and limited
                            collections await. Crafted with meticulous care and expertise,
                            each collection embodies a unique savoir-faire.
                        </p>
                        <button
                            className="cs-cta"
                            onClick={() => navigate("/about")}
                        >
                            Discover Our Know-How
                        </button>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default CraftsmanSection;