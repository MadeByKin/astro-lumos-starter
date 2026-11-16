import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
// Keep the starter's existing timing for GSAP animations.
gsap.ticker.lagSmoothing(0);
export { gsap, ScrollTrigger };
