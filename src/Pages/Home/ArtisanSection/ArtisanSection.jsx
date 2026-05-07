import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ArtisanSection.scss";

// 🔁 Replace with your actual image import
const artisanImg =
    "https://images.unsplash.com/photo-1602523961358-f9f03dd557db?auto=format&fit=crop&w=900&q=80";

const ArtisanSection = () => {
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
        <section className="as-section" ref={sectionRef}>
            <div className="as-inner">

                {/* ── Left: Text section (swapped position) ── */}
                <div className="as-text-outer">
                    <div className="as-text-inner" ref={textRef}>
                        <span className="as-eyebrow">[YOUR EYEBROW TEXT]</span>
                        <h2 className="as-heading">[YOUR<br />HEADING]</h2>
                        <p className="as-sub">
                            [Your subtext here]
                        </p>
                        <p className="as-body">
                            [Your body paragraph text here. Describe your craft, process, or philosophy.]
                        </p>
                        <button
                            className="as-cta"
                            onClick={() => navigate("/about")}
                        >
                            Discover More
                        </button>
                    </div>
                </div>

                {/* ── Right: Image (swapped position) ── */}
                <div className="as-image-wrap">
                    <img
                        src={artisanImg}
                        alt="Artisan at work"
                        className="as-image"
                        loading="lazy"
                    />
                </div>

            </div>
        </section>
    );
};

export default ArtisanSection;