import { useCallback, useEffect, useRef, useState } from 'react';
import useDebounce from './hooks/useDebounce';

const ASPECT_WIDE = 16 / 9;
const ASPECT_TALL = 9 / 16;
const FRAME_COUNT = 434;
const SCROLL_DISTANCE = 2000;

function App() {
  const canvasRef = useRef();
  const ctxRef = useRef();
  const frameRef = useRef({ value: 0 });
  const imagesRef = useRef([]);
  const isWideRef = useRef(!!(window.innerWidth / window.innerHeight >= 1));
  const scrollTriggerRef = useRef(null);

  const [gsapReady, setGsapReady] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const isLoaded = !!(imagesLoaded === FRAME_COUNT);
  const isReady = !!(isLoaded && gsapReady);

  const currentFrame = (index) => (
    `/row-partners-slideshow/frames/${
      (isWideRef.current) ? 'wide' : 'tall'
    }/row_webTest17_${index.toString().padStart(FRAME_COUNT.toString().length, '0')}.webp`
  );

  const loadImages = async () => {
    let loadedCount = 0;

    const loadPromises = Array.from({ length: FRAME_COUNT }, (_, i) => {
      return new Promise((resolve, reject) => {
        const img = new Image();

        img.src = currentFrame(i);

        img.onload = () => {
          imagesRef.current[i] = img;
          loadedCount += 1;
          setImagesLoaded(Math.min(loadedCount, FRAME_COUNT));
          resolve();
        };

        img.onerror = () => {
          console.error(`Failed to load image: ${img.src}`);
          loadedCount += 1;
          setImagesLoaded(Math.min(loadedCount, FRAME_COUNT));
          resolve(); // avoid stalling, but log error
        };
      });
    });

    await Promise.all(loadPromises);
  };

  const renderFrame = () => {
    if (!canvasRef.current || !ctxRef.current || imagesRef.current.length === 0) return;

    const { width, height } = canvasRef.current;
    const frameIndex = Math.min(Math.floor(frameRef.current.value), FRAME_COUNT - 1);

    ctxRef.current.clearRect(0, 0, width, height);

    if (imagesRef.current[frameIndex]) {
      ctxRef.current.drawImage(imagesRef.current[frameIndex], 0, 0, width, height);
    }
  };

  const setupScrollTrigger = useCallback(() => {
    if (!canvasRef.current) return;

    const gsap = window.gsap;
    const ScrollTrigger = window.gsap?.ScrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn('GSAP or ScrollTrigger not available in setupScrollTrigger');
      return;
    }

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
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          renderFrame();

          if (self.progress >= 1) {
            document.body.classList.add('anthem_ready');
          } else {
            document.body.classList.remove('anthem_ready');
          }
        },
      },
    });

    ScrollTrigger.refresh();

    return scrollTriggerRef.current;
  }, [renderFrame]);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const ScrollTrigger = window.gsap?.ScrollTrigger;
    const isWide = !!(window.innerWidth / window.innerHeight >= 1);

    if (isWide !== isWideRef.current) { // reload when switching aspect ratio
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.scrollTrigger.kill(true); // kill with revert:true to restore the element to its original state
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;

        if (ScrollTrigger) {
          ScrollTrigger.refresh();
        }
      }

      isWideRef.current = isWide;
      imagesRef.current = [];
      frameRef.current.value = 0;
      setImagesLoaded(0);
      loadImages();

      return;
    }

    requestAnimationFrame(() => {
      if (!canvasRef.current) return;

      const { width, height } = canvasRef.current.getBoundingClientRect();

      // set canvas resolution to DOM element dimensions
      canvasRef.current.width = width;
      canvasRef.current.height = height;

      if (imagesRef.current.length > 0) {
        renderFrame();
      }

      if (isLoaded && !scrollTriggerRef.current) {
        setupScrollTrigger();
      } else if (scrollTriggerRef.current) {
        ScrollTrigger.refresh();
      }
    });
  }, [renderFrame, isLoaded, setupScrollTrigger]);

  const handleResize = useDebounce(resizeCanvas, 150);

  useEffect(() => {
    loadImages();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkGSAP = () => {
      if (window.gsap && window.ScrollTrigger) {
        window.gsap.ScrollTrigger = window.ScrollTrigger;
        setGsapReady(true);
      } else {
        setTimeout(checkGSAP, 50);
      }
    };

    checkGSAP();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    ctxRef.current = canvasRef.current.getContext('2d');

    resizeCanvas();
    setupScrollTrigger();
    renderFrame();

    return () => {
      if (scrollTriggerRef.current) {
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;
      }
    };
  }, [isReady, resizeCanvas, setupScrollTrigger, renderFrame]);

  return (isLoaded) ? (
    <canvas ref={canvasRef}
      style={{
        aspectRatio: (isWideRef.current) ? ASPECT_WIDE : ASPECT_TALL,
        width: '100%',
      }}
    />
  ) : (
    <div
      style={{
        backgroundColor: 'red',
        height: '2px',
        width: `${Math.floor(imagesLoaded / FRAME_COUNT * 100)}%`,
      }}
    />
  );
}

export default App;
