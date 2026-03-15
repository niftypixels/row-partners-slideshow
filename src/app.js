const { BASE_URL, MODE } = import.meta.env;
const CLOUDFLARE_BASE_URL = 'https://pub-065105b6aed8461b86737fa696638c89.r2.dev';
const FRAME_SRC = MODE === 'cloudflare' ? CLOUDFLARE_BASE_URL : BASE_URL;

const ASPECT_WIDE = 16 / 9;
const ASPECT_TALL = 9 / 16;
const FRAME_COUNT = 433;
const SCROLL_DISTANCE = 2000;

export function app(root) {
  root.style.position = 'relative';

  const canvas = document.createElement('canvas');
  const loadingBar = document.createElement('div');

  Object.assign(loadingBar.style, {
    backgroundColor: 'red',
    height: '2px',
    width: '100%',
    position: 'absolute',
    top: '0',
    left: '0',
    opacity: '1',
    transform: 'scaleX(0)',
    transformOrigin: 'left center',
    willChange: 'opacity, transform',
  });

  root.appendChild(canvas);
  root.appendChild(loadingBar);

  let gsapReady = false;
  let imagesLoaded = 0;
  let ready = false;
  let ctx = null;
  const frame = { value: 0 };
  const images = [];
  let isWide = !!(window.innerWidth / window.innerHeight >= 1);
  let scrollTriggerInstance = null;

  function updateCanvasAspect() {
    canvas.style.aspectRatio = isWide ? ASPECT_WIDE : ASPECT_TALL;
    canvas.style.width = '100%';
  }

  updateCanvasAspect();

  function updateLoadingBar() {
    loadingBar.style.transform = `scaleX(${imagesLoaded / FRAME_COUNT})`;
    loadingBar.style.opacity = imagesLoaded === FRAME_COUNT ? '0' : '1';
  }

  function currentFrame(index) {
    return `${FRAME_SRC}/frames/${isWide ? 'wide' : 'tall'}/row_webTest17_${index.toString().padStart(FRAME_COUNT.toString().length, '0')}.webp`;
  }

  function renderFrame() {
    if (!ctx || images.length === 0) return;
    const { width, height } = canvas;
    const frameIndex = Math.min(Math.floor(frame.value), FRAME_COUNT - 1);
    ctx.clearRect(0, 0, width, height);
    if (images[frameIndex]) {
      ctx.drawImage(images[frameIndex], 0, 0, width, height);
    }
  }

  async function loadImages() {
    let loadedCount = 0;

    const loadPromises = Array.from({ length: FRAME_COUNT }, (_, i) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = currentFrame(i);

        img.onload = () => {
          images[i] = img;
          loadedCount += 1;
          imagesLoaded = Math.min(loadedCount, FRAME_COUNT);
          updateLoadingBar();
          if (i === 0) renderFrame();
          if (imagesLoaded === FRAME_COUNT) maybeReady();
          resolve();
        };

        img.onerror = () => {
          console.error(`Failed to load image: ${img.src}`);
          loadedCount += 1;
          imagesLoaded = Math.min(loadedCount, FRAME_COUNT);
          updateLoadingBar();
          if (imagesLoaded === FRAME_COUNT) maybeReady();
          resolve();
        };
      });
    });

    await Promise.all(loadPromises);
  }

  function setupScrollTrigger() {
    const gsap = window.gsap;
    const ScrollTrigger = window.gsap?.ScrollTrigger;

    if (!gsap || !ScrollTrigger) {
      console.warn('GSAP or ScrollTrigger not available in setupScrollTrigger');
      return;
    }

    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
      scrollTriggerInstance = null;
    }

    scrollTriggerInstance = gsap.to(frame, {
      value: FRAME_COUNT - 1,
      ease: 'none',
      scrollTrigger: {
        trigger: canvas,
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
    return scrollTriggerInstance;
  }

  function resizeCanvas() {
    ctx = canvas.getContext('2d');

    const ScrollTrigger = window.gsap?.ScrollTrigger;
    const newIsWide = !!(window.innerWidth / window.innerHeight >= 1);

    if (newIsWide !== isWide) {
      if (scrollTriggerInstance) {
        scrollTriggerInstance.scrollTrigger.kill(true);
        scrollTriggerInstance.kill();
        scrollTriggerInstance = null;
        if (ScrollTrigger) ScrollTrigger.refresh();
      }

      isWide = newIsWide;
      images.length = 0;
      frame.value = 0;
      imagesLoaded = 0;
      ready = false;
      updateLoadingBar();
      updateCanvasAspect();
      loadImages();
      return;
    }

    requestAnimationFrame(() => {
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width;
      canvas.height = height;

      if (images.length > 0) renderFrame();

      if (imagesLoaded === FRAME_COUNT && !scrollTriggerInstance) {
        setupScrollTrigger();
      } else if (scrollTriggerInstance) {
        ScrollTrigger?.refresh();
      }
    });
  }

  function maybeReady() {
    if (ready) return;
    if (imagesLoaded === FRAME_COUNT && gsapReady) {
      ready = true;
      resizeCanvas();
      setupScrollTrigger();
      renderFrame();
    }
  }

  function debounce(fn, delay) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  }

  const handleResize = debounce(resizeCanvas, 150);

  resizeCanvas();
  loadImages();
  window.addEventListener('resize', handleResize);

  function checkGSAP() {
    if (window.gsap && window.ScrollTrigger) {
      window.gsap.ScrollTrigger = window.ScrollTrigger;
      gsapReady = true;
      maybeReady();
    } else {
      setTimeout(checkGSAP, 50);
    }
  }

  checkGSAP();
}
