import React, { useState, useEffect, useRef } from "react";
import { Box, Container, Text, Group, Paper, Button } from "@mantine/core";
import { ChevronRight, ArrowDown, Layers } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ROUTES from "../../utils/routes/routes";

// Dynamically load all frame images eagerly using import.meta.glob
const frameModules = import.meta.glob("../../assets/landingpageimages/*.jpg", { eager: true });
const frameUrls = Object.keys(frameModules)
  .sort()
  .map((key) => frameModules[key].default);

const ImageSequenceScroll = () => {
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const imagesRef = useRef([]);
  const [frameIndex, setFrameIndex] = useState(0);
  const [loadedProgress, setLoadedProgress] = useState(0);

  const totalFrames = frameUrls.length;

  // Preload all images into memory for zero-lag high-performance canvas rendering
  useEffect(() => {
    if (totalFrames === 0) return;

    let loadedCount = 0;
    const imgArray = new Array(totalFrames);

    frameUrls.forEach((url, index) => {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        loadedCount++;
        setLoadedProgress(Math.floor((loadedCount / totalFrames) * 100));
      };
      imgArray[index] = img;
    });

    imagesRef.current = imgArray;
  }, []);

  // Helper function to draw image with object-cover behavior on canvas
  const drawImageCover = (ctx, img, canvasWidth, canvasHeight) => {
    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;
    let renderWidth, renderHeight, x, y;

    if (imgRatio > canvasRatio) {
      renderHeight = canvasHeight;
      renderWidth = img.width * (canvasHeight / img.height);
      x = (canvasWidth - renderWidth) / 2;
      y = 0;
    } else {
      renderWidth = canvasWidth;
      renderHeight = img.height * (canvasWidth / img.width);
      x = 0;
      y = (canvasHeight - renderHeight) / 2;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, x, y, renderWidth, renderHeight);
  };

  // Scroll tracking loop using requestAnimationFrame for maximum frame rate
  useEffect(() => {
    let animationFrameId;

    const handleScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const maxScroll = rect.height - window.innerHeight;
      
      if (maxScroll <= 0) return;

      // Calculate fraction of scroll progress through this container
      const scrolled = -rect.top;
      const fraction = Math.min(Math.max(scrolled / maxScroll, 0), 1);

      // Determine correct frame index based on scroll fraction
      const index = Math.min(Math.floor(fraction * totalFrames), totalFrames - 1);
      setFrameIndex(index);
    };

    const onScroll = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    handleScroll(); // Trigger initial computation

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [totalFrames]);

  // Redraw canvas whenever frameIndex changes or window resizes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || totalFrames === 0) return;
    const ctx = canvas.getContext("2d");

    // Keep internal canvas resolution synced with client display resolution
    if (canvas.width !== window.innerWidth || canvas.height !== window.innerHeight) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    const currentImg = imagesRef.current[frameIndex];

    if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
      drawImageCover(ctx, currentImg, canvas.width, canvas.height);
    } else {
      // Graceful fallback to nearest loaded image if current isn't cached yet
      let fallbackImg = null;
      for (let i = frameIndex; i >= 0; i--) {
        if (imagesRef.current[i] && imagesRef.current[i].complete && imagesRef.current[i].naturalWidth > 0) {
          fallbackImg = imagesRef.current[i];
          break;
        }
      }
      if (!fallbackImg) {
        for (let i = frameIndex + 1; i < imagesRef.current.length; i++) {
          if (imagesRef.current[i] && imagesRef.current[i].complete && imagesRef.current[i].naturalWidth > 0) {
            fallbackImg = imagesRef.current[i];
            break;
          }
        }
      }
      if (fallbackImg) {
        drawImageCover(ctx, fallbackImg, canvas.width, canvas.height);
      }
    }
  }, [frameIndex, loadedProgress, totalFrames]);

  // Handle explicit resize listener
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const currentImg = imagesRef.current[frameIndex];
      if (currentImg && currentImg.complete && currentImg.naturalWidth > 0) {
        const ctx = canvas.getContext("2d");
        drawImageCover(ctx, currentImg, canvas.width, canvas.height);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [frameIndex]);

  // Define ultra-premium centered cinematic phases modeled directly after Clothifywiz
  const phases = [
    {
      title: "REDEFINING DAIRY",
      subtitle: "NEXT-GEN ECOSYSTEM PHYSICS",
      description: "Amizhdhu harmonizes production, intelligent logistics, and 360° processing oversight into a singular, flawless interactive intelligence grid.",
      range: [0, Math.floor(totalFrames * 0.25)],
    },
    {
      title: "INLINE SCREENING",
      subtitle: "STAGE 02 / AUTOMATED VALIDATION",
      description: "Inline screening arrays validate batch integrity dynamically. Advanced computer vision layers inspect consistency parameters instantly with zero contamination risk.",
      range: [Math.floor(totalFrames * 0.25) + 1, Math.floor(totalFrames * 0.5)],
    },
    {
      title: "THERMAL FLEET",
      subtitle: "STAGE 03 / COLD-CHAIN CONTINUUM",
      description: "Active logistical tracking preserving targeted temperature vectors. Live route orchestration synchronizes vehicle sensors directly with central database endpoints.",
      range: [Math.floor(totalFrames * 0.5) + 1, Math.floor(totalFrames * 0.75)],
    },
    {
      title: "LEDGER TRUST",
      subtitle: "STAGE 04 / CONSUMER FULFILLMENT",
      description: "Complete fulfillment visibility mapped directly to stakeholder portals. Immutable historical playback solidifies transparent supply accountability end-to-end.",
      range: [Math.floor(totalFrames * 0.75) + 1, totalFrames - 1],
    },
  ];

  // Determine current active phase based on frameIndex
  const currentPhaseIndex = phases.findIndex(
    (p) => frameIndex >= p.range[0] && frameIndex <= p.range[1]
  );
  return (
    <Box className="relative bg-black w-full">
      {/* Outer Scroll Container setting total scrolling duration */}
      <Box ref={containerRef} style={{ height: "400vh" }} className="relative w-full">
        {/* Sticky Viewport Container */}
        <Box className="sticky top-0 h-screen w-full overflow-hidden flex items-center justify-center bg-black">
          {/* Main Rendering Canvas filling the background completely */}
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-300"
            style={{ opacity: loadedProgress > 10 ? 1 : 0.3 }}
          />

          {/* Subtle Ambient Vignette to guarantee pristine overlay text contrast without blocking background */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/40 z-10 pointer-events-none" />

          {/* Centered Minimalist Overlay Panels allowing full visibility of background animation */}
          <Box className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-20 pointer-events-none">
            {phases.map((phase, idx) => {
              const isActive = idx === currentPhaseIndex;
              return (
                <Box
                  key={idx}
                  className={`absolute inset-x-0 max-w-4xl mx-auto flex flex-col items-center justify-center transition-all duration-700 transform ${
                    isActive
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-105 -translate-y-8 pointer-events-none"
                  }`}
                >
                  {/* Phase Marker Badge */}
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-sm border border-white/10 text-[#A6C573] text-[11px] font-extrabold uppercase tracking-widest mb-4 shadow-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#769642] animate-pulse" />
                    {phase.subtitle}
                  </div>

                  {/* Elegant Sleek Premium Cinematic Title */}
                  <h3 className="text-3xl sm:text-5xl md:text-6xl font-black text-white tracking-widest drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] mb-4 uppercase">
                    {phase.title}
                  </h3>

                  {/* Delicate Non-blocking Descriptive Block */}
                  <p className="text-xs sm:text-sm md:text-base text-gray-100 max-w-xl mx-auto font-medium leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] px-4">
                    {phase.description}
                  </p>

                  {/* Micro Progress Track */}
                  <Box className="mt-6 w-32 bg-white/20 h-[3px] rounded-full overflow-hidden relative shadow-md">
                    <Box
                      className="bg-gradient-to-r from-[#A6C573] to-[#769642] h-full transition-all duration-100"
                      style={{
                        width: `${
                          Math.max(
                            0,
                            Math.min(
                              1,
                              (frameIndex - phase.range[0]) /
                                (phase.range[1] - phase.range[0])
                            )
                          ) * 100
                        }%`,
                      }}
                    />
                  </Box>
                </Box>
              );
            })}
          </Box>

          {/* Delicate Sleek Action Trigger positioned cleanly above the lower edge */}
          <Box className="absolute bottom-8 left-0 right-0 flex justify-center z-30 pointer-events-auto">
            <Button
              size="md"
              radius="xl"
              style={{ backgroundColor: "#769642" }}
              className="h-10 px-6 font-bold tracking-wider text-white hover:bg-[#5f7a35] shadow-xl border-none transition-transform hover:scale-105 text-xs uppercase"
              rightSection={<ChevronRight size={14} />}
              onClick={() => navigate(ROUTES.LOGIN)}
            >
              Access Terminal Console
            </Button>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ImageSequenceScroll;
