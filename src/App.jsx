import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';
import { useDebounce } from './hooks';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother);

const FRAME_ASPECT = 16 / 9;
const FRAME_COUNT = 396;
const SCROLL_DISTANCE = 2000;

function App() {
  const wrapperRef = useRef();
  const contentRef = useRef();
  const canvasRef = useRef();
  const imagesRef = useRef([]);
  const frameRef = useRef({ value: 0 });
  const scrollSmootherRef = useRef(null);
  const scrollTriggerRef = useRef(null);

  const [imagesLoaded, setImagesLoaded] = useState(0);
  const [worldKey, setWorldKey] = useState(0);

  const currentFrame = (index) => (`frames/row_webTest7_${index.toString().padStart(3, '0')}.jpg`);
  const handleResize = useDebounce(() => setWorldKey(key => key + 1), 150);

  function killScrollers() {
    if (scrollTriggerRef.current) {
      scrollTriggerRef.current.kill();
      scrollTriggerRef.current = null;
    }
    if (scrollSmootherRef.current) {
      scrollSmootherRef.current.kill();
      scrollSmootherRef.current = null;
    }
  }

  function renderFrame() {
    if (!canvasRef.current || imagesRef.current.length === 0) return;

    const { width, height } = canvasRef.current;
    const ctx = canvasRef.current.getContext('2d');
    const frameIndex = Math.min(
      Math.floor(frameRef.current.value),
      FRAME_COUNT - 1
    );

    console.log('rendering frame', frameIndex);

    ctx.clearRect(
      0, 0, width, height
    );

    ctx.drawImage(imagesRef.current[frameIndex],
      0, 0, width, height
    );
  };

  function resizeCanvas() {
    if (!canvasRef.current) return;

    const { width, height } = canvasRef.current.getBoundingClientRect();

    // set canvas resolution
    canvasRef.current.width = width;
    canvasRef.current.height = height;

    if (imagesRef.current.length > 0) {
      renderFrame();
    }
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
    console.log(`loading ${Math.floor(imagesLoaded / FRAME_COUNT * 100)}% complete`);

    if (imagesLoaded < FRAME_COUNT) {
      const img = new Image();
      img.src = currentFrame(imagesLoaded);
      img.onload = () => {
        imagesRef.current[imagesLoaded] = img;
        setImagesLoaded(imagesLoaded + 1);
      };
    } else {
      console.log('images loaded', imagesLoaded);
      setWorldKey(worldKey + 1);
    }
  }, [imagesLoaded]);

  useEffect(() => {
    console.warn('world iteration', worldKey);

    killScrollers();
    resizeCanvas();
    setupScrollSmoother();

    if (imagesLoaded === FRAME_COUNT) {
      setupScrollTrigger();
      renderFrame();
    }

    return () => {
      killScrollers();
    };
  }, [worldKey]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div id='smooth-wrapper' ref={wrapperRef}>
      <div id='smooth-content' ref={contentRef}>
        <canvas
          ref={canvasRef}
          style={{
            aspectRatio: FRAME_ASPECT,
            width: '100%',
          }}
        />
      </div>
    </div>
  );
}

export default App;
