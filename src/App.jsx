import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useCallback, useEffect, useRef, useState } from 'react';
import useDebounce from './hooks/useDebounce';

gsap.registerPlugin(ScrollTrigger);

const ASPECT_WIDE = 16 / 9;
const ASPECT_TALL = 9 / 16;
const FRAME_COUNT = 507;
const SCROLL_DISTANCE = 2000;

function App() {
  const canvasRef = useRef();
  const ctxRef = useRef();
  const frameRef = useRef({ value: 0 });
  const imagesRef = useRef([]);
  const loadingStartedRef = useRef(false);
  const scrollTriggerRef = useRef(null);

  const [isAspectWide, setisAspectWide] = useState(() => window.innerWidth / window.innerHeight >= 1);
  const [imagesLoaded, setImagesLoaded] = useState(0);

  const isLoaded = !!(imagesLoaded === FRAME_COUNT);

  const currentFrame = useCallback((index) => (
    `/row-partners-slideshow/frames/${
      (isAspectWide) ? 'wide' : 'tall'
    }/row_webTest13_${index.toString().padStart(FRAME_COUNT.toString().length, '0')}.jpg`
  ), [isAspectWide]);

  const renderFrame = useCallback(() => {
    if (!canvasRef.current || !ctxRef.current || imagesRef.current.length === 0) return;

    const { width, height } = canvasRef.current;
    const frameIndex = Math.min(Math.floor(frameRef.current.value), FRAME_COUNT - 1);

    ctxRef.current.clearRect(0, 0, width, height);

    if (imagesRef.current[frameIndex]) {
      ctxRef.current.drawImage(imagesRef.current[frameIndex], 0, 0, width, height);
    }
  }, []);

  const setupScrollTrigger = useCallback(() => {
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
        invalidateOnRefresh: true,
        onUpdate: renderFrame,
      },
    });

    ScrollTrigger.refresh();

    return scrollTriggerRef.current;
  }, [renderFrame]);

  const resizeCanvas = useCallback(() => {
    if (!canvasRef.current) return;

    const isWide = !!(window.innerWidth / window.innerHeight >= 1);

    if (isWide !== isAspectWide) { // reload when switching aspect ratio
      if (scrollTriggerRef.current) { // kill scrollTrigger before state updates to avoid DOM conflicts
        scrollTriggerRef.current.scrollTrigger.kill(true); // kill with revert:true to restore the element to its original state
        scrollTriggerRef.current.kill();
        scrollTriggerRef.current = null;

        ScrollTrigger.refresh();
      }

      requestAnimationFrame(() => { // reset state, RAF enqueued to allow ScrollTrigger cleanup
        loadingStartedRef.current = false;
        imagesRef.current = [];
        frameRef.current.value = 0;
        setisAspectWide(isWide);
        setImagesLoaded(0);

        // window.scrollTo(0, 0);
      });

      return;
    }

    requestAnimationFrame(() => { // double RAF ensures stable dimensions after viewport changes
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
    });
  }, [isAspectWide, renderFrame, isLoaded, setupScrollTrigger]);

  const handleResize = useDebounce(resizeCanvas, 150);

  useEffect(() => {
    loadingStartedRef.current = true;

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

    loadImages();

    return () => {
      loadingStartedRef.current = false;
      imagesRef.current = [];
      setImagesLoaded(0);
    };
  }, [isAspectWide, currentFrame]);

  /*
  useEffect(() => {
    if (loadingStartedRef.current) return;

    loadingStartedRef.current = true;

    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();

      img.src = currentFrame(i);

      img.onload = () => {
        imagesRef.current[i] = img;
        setImagesLoaded(prev => prev + 1);
      };
    }
  }, [isAspectWide]);
  */

  useEffect(() => {
    if (!isLoaded) return;

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
  }, [isLoaded, resizeCanvas, setupScrollTrigger, renderFrame]);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (isLoaded) ? (
    <canvas ref={canvasRef}
      style={{
        aspectRatio: (isAspectWide) ? ASPECT_WIDE : ASPECT_TALL,
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
