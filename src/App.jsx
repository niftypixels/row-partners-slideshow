import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import useDebounce from './hooks/useDebounce';

gsap.registerPlugin(ScrollTrigger);

const FRAME_ASPECT = 16 / 9;
const FRAME_COUNT = 398;
const SCROLL_DISTANCE = 2000;

function App() {
  const canvasRef = useRef();
  const ctxRef = useRef();
  const imagesRef = useRef([]);
  const frameRef = useRef({ value: 0 });
  const scrollTriggerRef = useRef(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);

  const currentFrame = (index) => (`frames/row_webTest12_${index.toString().padStart(FRAME_COUNT.toString().length, '0')}.jpg`);
  const handleResize = useDebounce(resizeCanvas, 150);
  const isLoaded = (imagesLoaded === FRAME_COUNT);

  function renderFrame() {
    if (!canvasRef.current || !ctxRef.current || imagesRef.current.length === 0) return;

    const { width, height } = canvasRef.current;
    const frameIndex = Math.min(
      Math.floor(frameRef.current.value),
      FRAME_COUNT - 1
    );

    console.log('rendering frame', frameIndex);

    ctxRef.current.clearRect(
      0, 0, width, height
    );

    ctxRef.current.drawImage(imagesRef.current[frameIndex],
      0, 0, width, height
    );
  };

  function resizeCanvas() {
    if (!canvasRef.current) return;

    // double RAF ensures stable dimensions after viewport changes
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const { width, height } = canvasRef.current.getBoundingClientRect();

        // set canvas resolution to DOM element dimensions
        canvasRef.current.width = width;
        canvasRef.current.height = height;

        ctxRef.current = canvasRef.current.getContext('2d');

        if (imagesRef.current.length > 0) {
          renderFrame();
        }

        if (scrollTriggerRef.current) {
          ScrollTrigger.refresh();
        }
      });
    });
  };

  function setupScrollTrigger() {
    if (!canvasRef.current) return;

    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }

    scrollTriggerRef.current = gsap.to(frameRef.current, {
      value: FRAME_COUNT - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: canvasRef.current,
        start: 'top top',
        end: `+=${SCROLL_DISTANCE}`,
        pin: true,
        scrub: true,
        onUpdate: renderFrame,
        onRefresh: () => {
          console.log('ScrollTrigger refreshed');
        }
      },
    });

    ScrollTrigger.refresh();

    return scrollTriggerRef.current;
  };

  useEffect(() => {
    if (imagesLoaded < FRAME_COUNT) {
      const img = new Image();

      img.src = currentFrame(imagesLoaded);

      img.onload = () => {
        imagesRef.current[imagesLoaded] = img;
        setImagesLoaded(imagesLoaded + 1);
      };
    }
  }, [imagesLoaded]);

  useEffect(() => {
    if (!isLoaded) return;

    resizeCanvas();
    setupScrollTrigger();
    renderFrame();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [isLoaded]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (isLoaded) ? (
    <canvas ref={canvasRef}
      style={{
        aspectRatio: FRAME_ASPECT,
        width: '100%',
      }}
    />
  ) : (
    <div id='loading'
      style={{
        backgroundColor: 'red',
        height: '2px',
        width: `${Math.floor(imagesLoaded / FRAME_COUNT * 100)}%`,
      }}
    />
  );
}

export default App;
