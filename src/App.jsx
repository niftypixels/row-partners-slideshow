import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './hooks';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const FRAME_ASPECT = 16 / 9;
const FRAME_COUNT = 398;
const SCROLL_DISTANCE = 2000;

function App() {
  const wrapperRef = useRef();
  const contentRef = useRef();
  const canvasRef = useRef();
  const ctxRef = useRef();
  const imagesRef = useRef([]);
  const frameRef = useRef({ value: 0 });
  const scrollSmootherRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);

  const currentFrame = (index) => (`frames/row_webTest11_${index.toString().padStart(FRAME_COUNT.toString().length, '0')}.jpg`);
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

  function setupScrollSmoother() {
    if (scrollSmootherRef.current) {
      scrollSmootherRef.current.kill();
      scrollSmootherRef.current = null;
    }

    scrollSmootherRef.current = ScrollSmoother.create({
      wrapper: wrapperRef.current,
      content: contentRef.current,
      smooth: 1.5,
      effects: true,
      normalizeScroll: true,
      ignoreMobileResize: true,
    });

    return scrollSmootherRef.current;
  };

  function setupScrollTrigger() {
    if (!canvasRef.current || !scrollSmootherRef.current) return;

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
        scrub: 1,
        pin: true,
        end: `+=${SCROLL_DISTANCE}`,
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
    setupScrollSmoother();
    setupScrollTrigger();
    renderFrame();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
      if (scrollSmootherRef.current) {
        scrollSmootherRef.current.kill();
        scrollSmootherRef.current = null;
      }
    };
  }, [isLoaded]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (isLoaded) ? (
    <div id='smooth-wrapper' ref={wrapperRef}>
      <div id='smooth-content' ref={contentRef}>
        <canvas ref={canvasRef}
          style={{
            aspectRatio: FRAME_ASPECT,
            width: '100%',
          }}
        />
      </div>
    </div>
  ) : (
    <div id='loading' style={{ width: `${Math.floor(imagesLoaded / FRAME_COUNT * 100)}%` }} />
  );
}

export default App;
