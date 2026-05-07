import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./ScrollHero.scss";

const heroBg =
    "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80";

const ScrollHero = () => {
    const sectionRef = useRef(null);
    const textRef = useRef(null);
    const btnRef = useRef(null);

    // The scrollY at which the button FIRST entered the viewport (trigger point)
    // Once set, this never resets until text is fully back to 0 AND user scrolled above trigger
    const triggerScrollY = useRef(null);

    const navigate = useNavigate();

    useEffect(() => {
        const textEl = textRef.current;

        const handleScroll = () => {
            const section = sectionRef.current;
            const btnEl = btnRef.current;
            if (!section || !textEl || !btnEl) return;

            const viewportHeight = window.innerHeight;
            const currentScrollY = window.scrollY;
            const sectionHeight = section.offsetHeight;
            const textHeight = textEl.offsetHeight;

            // Bottom gap so button doesn't touch bottom edge
            const bottomGap = 48;
            const maxTravel = sectionHeight - textHeight - 32 - bottomGap;

            // ── Set trigger point once — when button enters viewport ──
            if (triggerScrollY.current === null) {
                const btnRect = btnEl.getBoundingClientRect();
                const distanceFromViewportBottom = viewportHeight - btnRect.bottom;

                if (distanceFromViewportBottom < 0) {
                    // Button not in view yet — nothing to do
                    textEl.style.transform = "translateY(0px)";
                    return;
                }

                // Button just entered viewport — lock in this scroll position as trigger
                triggerScrollY.current = currentScrollY;
            }

            // ── 1:1 travel from trigger point — works both scroll down AND up ──
            const scrolledSinceTrigger = currentScrollY - triggerScrollY.current;

            const travel = Math.min(Math.max(0, scrolledSinceTrigger), maxTravel);
            textEl.style.transform = `translateY(${travel}px)`;

            // ── Reset trigger only when text is fully back at top AND
            //    user has scrolled back above the trigger point ──
            if (travel === 0 && currentScrollY < triggerScrollY.current) {
                triggerScrollY.current = null;
            }
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <section className="sh-section" ref={sectionRef}>
            <div className="sh-bg" style={{ backgroundImage: `url(${heroBg})` }} />

            <div className="sh-content" ref={textRef}>
                <span className="sh-collection-label">Collection</span>
                <h1 className="sh-brand">Bymythology</h1>
                <p className="sh-tagline">Our Premium Collection</p>
                <button
                    className="sh-cta"
                    ref={btnRef}
                    onClick={() => navigate("/products")}
                >
                    Shop Now
                </button>
            </div>
        </section>
    );
};

export default ScrollHero;