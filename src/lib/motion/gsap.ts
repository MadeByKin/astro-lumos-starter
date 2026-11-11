import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
// Lenis and animation use the same elapsed-time clock, per Lenis integration guidance.
gsap.ticker.lagSmoothing(0);
export { gsap, ScrollTrigger };
