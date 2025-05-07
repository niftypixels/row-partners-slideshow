import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef } from 'react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 60;

function App() {
  const canvasRef = useRef();
  const imagesRef = useRef([]);
  const scrollTriggerRef = useRef(null);
  const frameRef = useRef({ value: 0 });

  const currentFrame = (index) => (`frames/row_webTest_${index.toString().padStart(2, '0')}.jpg`);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let imagesLoaded = 0;

    // Setup canvas size
    const resizeCanvas = () => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      // Re-render current frame on resize
      if (imagesRef.current.length > 0) {
        renderFrame();
      }
    };

    // Render the current frame based on frameRef value
    const renderFrame = () => {
      if (imagesRef.current.length === 0) return;

      const frameIndex = Math.min(
        Math.floor(frameRef.current.value),
        FRAME_COUNT - 1
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        imagesRef.current[frameIndex],
        0, 0,
        canvas.width,
        canvas.height
      );
    };

    // Load all images first
    const loadImages = () => {
      for (let i = 0; i < FRAME_COUNT; i++) {
        const img = new Image();
        img.src = currentFrame(i);

        img.onload = () => {
          imagesLoaded++;

          // Once all images loaded, set up animation
          if (imagesLoaded === FRAME_COUNT) {
            setupScrollAnimation();
            renderFrame(); // Render first frame
          }
        };

        imagesRef.current.push(img);
      }
    };

    // Set up the GSAP ScrollTrigger animation
    const setupScrollAnimation = () => {
      // Kill previous ScrollTrigger if it exists
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }

      scrollTriggerRef.current = gsap.to(frameRef.current, {
        value: FRAME_COUNT - 1,
        ease: 'none',
        scrollTrigger: {
          trigger: canvas,
          start: 'top top',
          scrub: 0.5,
          pin: true,
          end: '+=2000',
          onUpdate: renderFrame
        },
        onUpdate: renderFrame,
      });
    };

    // Initialize
    resizeCanvas();
    loadImages();

    // Event listeners
    window.addEventListener('resize', resizeCanvas);

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
      }

      // Clear image references
      imagesRef.current = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
      }}
    />
  );
}

export default App;
