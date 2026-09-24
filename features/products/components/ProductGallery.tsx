'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';

import {
  ChevronLeft,
  ChevronRight,
  Expand,
  ImageIcon,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';

import { Carousel, CarouselApi, CarouselContent, CarouselItem } from '@/components/ui/carousel';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ProductImage } from '../types';

interface ProductGalleryProps {
  images: ProductImage[];
  alt: string;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.5;

export function ProductGallery({ images, alt }: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();

  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [zoom, setZoom] = useState(MIN_ZOOM);

  const [position, setPosition] = useState({
    x: 0,
    y: 0,
  });

  const [isDragging, setIsDragging] = useState(false);

  const dragStart = useRef({
    x: 0,
    y: 0,
  });

  const primaryIndex = useMemo(() => {
    const index = images.findIndex((image) => image.isPrimary);

    return index >= 0 ? index : 0;
  }, [images]);

  /*
   * =========================================================
   * MAIN CAROUSEL
   * =========================================================
   */

  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap());
    };

    onSelect();

    api.on('select', onSelect);

    return () => {
      api.off('select', onSelect);
    };
  }, [api]);

  useEffect(() => {
    if (!api || images.length === 0) return;

    api.scrollTo(primaryIndex, true);
  }, [api, primaryIndex, images.length]);

function goToImage(index: number) {
  if (images.length === 0) return;

  const nextIndex = (index + images.length) % images.length;

  setLightboxIndex(nextIndex);
  resetZoom();
}

  function nextImage() {
    goToImage(lightboxIndex + 1);
  }

  function previousImage() {
    goToImage(lightboxIndex - 1);
  }

  /*
   * =========================================================
   * KEYBOARD
   * =========================================================
   */

  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeLightbox();
        return;
      }

      if (event.key === 'ArrowRight') {
        nextImage();
        return;
      }

      if (event.key === 'ArrowLeft') {
        previousImage();
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        zoomIn();
        return;
      }

      if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        zoomOut();
        return;
      }

      if (event.key === '0') {
        event.preventDefault();
        resetZoom();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  /*
   * =========================================================
   * ZOOM
   * =========================================================
   */

  function resetZoom() {
    setZoom(MIN_ZOOM);

    setPosition({
      x: 0,
      y: 0,
    });

    setIsDragging(false);
  }

  function zoomIn() {
    setZoom((current) => Math.min(Number((current + ZOOM_STEP).toFixed(2)), MAX_ZOOM));
  }

  function zoomOut() {
    setZoom((current) => {
      const next = Math.max(Number((current - ZOOM_STEP).toFixed(2)), MIN_ZOOM);

      if (next === MIN_ZOOM) {
        setPosition({
          x: 0,
          y: 0,
        });
      }

      return next;
    });
  }

  function setZoomLevel(value: number) {
    const next = Math.min(Math.max(value, MIN_ZOOM), MAX_ZOOM);

    setZoom(next);

    if (next === MIN_ZOOM) {
      setPosition({
        x: 0,
        y: 0,
      });
    }
  }

  /*
   * =========================================================
   * MOUSE WHEEL ZOOM
   * =========================================================
   */

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    /*
     * IMPORTANT:
     * Prevent Embla / browser scroll from taking
     * over the wheel event.
     */
    event.preventDefault();
    event.stopPropagation();

    const direction = event.deltaY < 0 ? 1 : -1;

    setZoom((current) => {
      const next = Number(
        Math.min(Math.max(current + direction * 0.25, MIN_ZOOM), MAX_ZOOM).toFixed(2),
      );

      if (next === MIN_ZOOM) {
        setPosition({
          x: 0,
          y: 0,
        });
      }

      return next;
    });
  }

  /*
   * =========================================================
   * DOUBLE CLICK
   * =========================================================
   */

  function handleDoubleClick() {
    if (zoom > MIN_ZOOM) {
      resetZoom();
    } else {
      setZoomLevel(2);
    }
  }

  /*
   * =========================================================
   * DRAG / PAN
   * =========================================================
   */

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (zoom <= MIN_ZOOM) return;

    event.preventDefault();

    setIsDragging(true);

    dragStart.current = {
      x: event.clientX - position.x,
      y: event.clientY - position.y,
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDragging || zoom <= MIN_ZOOM) return;

    event.preventDefault();

    setPosition({
      x: event.clientX - dragStart.current.x,
      y: event.clientY - dragStart.current.y,
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    setIsDragging(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  /*
   * =========================================================
   * LIGHTBOX
   * =========================================================
   */

  function openLightbox(index: number = activeIndex, initialZoom = MIN_ZOOM) {
  setLightboxIndex(index);
  setZoom(initialZoom);

  setPosition({
    x: 0,
    y: 0,
  });

  setIsDragging(false);
  setIsLightboxOpen(true);
}

  function closeLightbox() {
    setIsLightboxOpen(false);
    resetZoom();
  }

  /*
   * =========================================================
   * EMPTY STATE
   * =========================================================
   */
const currentLightboxImage = images[lightboxIndex] ?? images[0]!;
  if (images.length === 0) {
    return (
      <div className="bg-muted/40 flex aspect-square w-full items-center justify-center rounded-3xl border">
        <div className="text-muted-foreground flex flex-col items-center gap-3">
          <div className="bg-background flex size-14 items-center justify-center rounded-2xl border shadow-sm">
            <ImageIcon className="size-6" />
          </div>

          <span className="text-sm">No image available</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =====================================================
          MAIN GALLERY
      ====================================================== */}

      <div className="space-y-4">
        {/* MAIN IMAGE */}

        <div className="group bg-muted/20 relative overflow-hidden rounded-3xl border">
          <Carousel
            setApi={setApi}
            opts={{
              loop: images.length > 1,
              align: 'start',
            }}
            className="w-full"
          >
            <CarouselContent className="ml-0">
              {images.map((image, index) => (
                <CarouselItem key={image.id} className="basis-full pl-0">
                  <button
                    type="button"
                    onClick={() => openLightbox(index)}
                    className="relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden p-5 sm:p-8 md:p-10"
                    aria-label={`Open product image ${index + 1}`}
                  >
                    <Image
                      src={image.detailUrl}
                      alt={alt}
                      fill
                      priority={index === primaryIndex}
                      sizes="(max-width: 768px) 100vw, 55vw"
                      quality={90}
                      draggable={false}
                      className="object-contain transition-transform duration-500 ease-out select-none group-hover:scale-[1.025]"
                    />
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* =================================================
              TOP RIGHT CONTROLS
          ================================================== */}

          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            {/* REAL ZOOM BUTTON */}

            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => openLightbox(activeIndex, 2)}
              className={cn(
                'size-11 rounded-full',
                'border border-white/10',
                'bg-black/45 text-white',
                'shadow-xl backdrop-blur-xl',
                'transition-all duration-300',
                'hover:scale-105 hover:bg-black/65',
              )}
              aria-label="Zoom product image"
            >
              <Plus className="size-4" />
            </Button>

            {/* FULLSCREEN */}

            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => openLightbox()}
              className={cn(
                'size-11 rounded-full',
                'border border-white/10',
                'bg-black/45 text-white',
                'shadow-xl backdrop-blur-xl',
                'transition-all duration-300',
                'hover:scale-105 hover:bg-black/65',
              )}
              aria-label="Open image gallery"
            >
              <Expand className="size-4" />
            </Button>
          </div>

          {/* IMAGE COUNTER */}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-4 z-20">
              <div className="rounded-full border border-white/10 bg-black/45 px-3 py-1.5 text-xs font-medium text-white shadow-xl backdrop-blur-xl">
                {activeIndex + 1} / {images.length}
              </div>
            </div>
          )}

          {/* DESKTOP ARROWS */}

          {images.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => api?.scrollPrev()}
                className={cn(
                  'absolute top-1/2 left-4 z-20 hidden size-10',
                  '-translate-y-1/2 rounded-full',
                  'border border-white/10',
                  'bg-black/45 text-white',
                  'shadow-xl backdrop-blur-xl',
                  'hover:bg-black/65',
                  'md:flex',
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={() => api?.scrollNext()}
                className={cn(
                  'absolute top-1/2 right-4 z-20 hidden size-10',
                  '-translate-y-1/2 rounded-full',
                  'border border-white/10',
                  'bg-black/45 text-white',
                  'shadow-xl backdrop-blur-xl',
                  'hover:bg-black/65',
                  'md:flex',
                )}
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </Button>
            </>
          )}

          {/* MOBILE DOTS */}

          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 gap-1.5 md:hidden">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => api?.scrollTo(index)}
                  aria-label={`Go to image ${index + 1}`}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    index === activeIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/40',
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* ===================================================
            THUMBNAILS
        ==================================================== */}

        {images.length > 1 && (
          <div className="flex scrollbar-none gap-2.5 overflow-x-auto pb-1">
            {images.map((image, index) => (
              <button
                key={image.id}
                type="button"
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  'group bg-muted/20 relative size-18 shrink-0 overflow-hidden rounded-2xl border',
                  'transition-all duration-200 sm:size-20',
                  index === activeIndex
                    ? 'border-primary ring-primary/20 ring-2'
                    : 'border-border hover:border-foreground/30',
                )}
                aria-label={`Select image ${index + 1}`}
              >
                <Image
                  src={image.cardUrl}
                  alt=""
                  fill
                  sizes="80px"
                  quality={80}
                  draggable={false}
                  className={cn(
                    'object-cover transition duration-300 select-none',
                    index === activeIndex ? 'scale-[1.03]' : 'group-hover:scale-105',
                  )}
                />

                {index === activeIndex && (
                  <span className="bg-primary absolute inset-x-3 bottom-1.5 h-0.5 rounded-full" />
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =====================================================
          FULLSCREEN LIGHTBOX
      ====================================================== */}

      <Dialog
        open={isLightboxOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeLightbox();
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className={cn(
            '!fixed !inset-0',
            '!top-0 !left-0',
            '!translate-x-0 !translate-y-0',
            '!h-[100dvh]',
            '!w-screen',
            '!max-w-none',
            '!rounded-none',
            'border-0',
            'bg-black/95',
            'p-0',
            'shadow-none',
            'backdrop-blur-xl',
          )}
        >
          <DialogTitle className="sr-only">Product image gallery</DialogTitle>

          <div className="relative h-full w-full overflow-hidden">
            {/* =====================================================
          TOP BAR
      ====================================================== */}

            <div className="absolute inset-x-0 top-0 z-50 flex items-center justify-between p-4 sm:p-6">
              {/* COUNTER */}

              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-medium text-white shadow-lg backdrop-blur-xl">
                {lightboxIndex + 1} / {images.length}
              </div>

              {/* CONTROLS */}

              <div className="flex items-center gap-2">
                {/* MINUS */}

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={zoomOut}
                  disabled={zoom <= MIN_ZOOM}
                  className={cn(
                    'size-10 rounded-full',
                    'border border-white/10',
                    'bg-white/10 text-white',
                    'backdrop-blur-xl',
                    'hover:bg-white/20',
                    'disabled:pointer-events-none',
                    'disabled:opacity-30',
                  )}
                  aria-label="Zoom out"
                >
                  <Minus className="size-4" />
                </Button>

                {/* ZOOM LEVEL */}

                <button
                  type="button"
                  onClick={resetZoom}
                  className={cn(
                    'flex h-10 min-w-[72px]',
                    'items-center justify-center',
                    'rounded-full',
                    'border border-white/10',
                    'bg-white/10',
                    'px-3',
                    'text-xs font-semibold',
                    'text-white',
                    'backdrop-blur-xl',
                    'transition',
                    'hover:bg-white/20',
                  )}
                >
                  {Math.round(zoom * 100)}%
                </button>

                {/* PLUS */}

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={zoomIn}
                  disabled={zoom >= MAX_ZOOM}
                  className={cn(
                    'size-10 rounded-full',
                    'border border-white/10',
                    'bg-white/10 text-white',
                    'backdrop-blur-xl',
                    'hover:bg-white/20',
                    'disabled:pointer-events-none',
                    'disabled:opacity-30',
                  )}
                  aria-label="Zoom in"
                >
                  <Plus className="size-4" />
                </Button>

                {/* RESET */}

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={resetZoom}
                  className={cn(
                    'hidden size-10 rounded-full',
                    'border border-white/10',
                    'bg-white/10 text-white',
                    'backdrop-blur-xl',
                    'hover:bg-white/20',
                    'sm:flex',
                  )}
                  aria-label="Reset zoom"
                >
                  <RotateCcw className="size-4" />
                </Button>

                {/* CLOSE */}

                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={closeLightbox}
                  className={cn(
                    'ml-1 size-10 rounded-full',
                    'border border-white/10',
                    'bg-white/10 text-white',
                    'backdrop-blur-xl',
                    'hover:bg-white/20',
                  )}
                  aria-label="Close gallery"
                >
                  <X className="size-5" />
                </Button>
              </div>
            </div>

            {/* =====================================================
          IMAGE
      ====================================================== */}

            <div
              className={cn(
                'absolute inset-0',
                'flex items-center justify-center',
                'px-4 pt-24 pb-28',
                'sm:px-20 sm:pt-24 sm:pb-32',
                'touch-none select-none',
                zoom > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
              )}
              onWheel={handleWheel}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            >
              <div className="relative h-full w-full">
              <Image
  key={currentLightboxImage.id}
  src={currentLightboxImage.detailUrl}
  alt={alt}
  fill
  sizes="100vw"
  quality={95}
  priority
  draggable={false}
  className="pointer-events-none object-contain select-none"
  style={{
    transform: `
      translate3d(
        ${position.x}px,
        ${position.y}px,
        0
      )
      scale(${zoom})
    `,
    transition: isDragging
      ? 'none'
      : 'transform 250ms cubic-bezier(0.22, 1, 0.36, 1)',
  }}
/>
              </div>
            </div>

            {/* =====================================================
          PREVIOUS
      ====================================================== */}

            {images.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={previousImage}
                className={cn(
                  'absolute top-1/2 left-3 z-40',
                  '-translate-y-1/2',
                  'size-12 rounded-full',
                  'border border-white/10',
                  'bg-white/10 text-white',
                  'shadow-xl backdrop-blur-xl',
                  'transition-all duration-200',
                  'hover:scale-105',
                  'hover:bg-white/20',
                  'sm:left-6',
                )}
                aria-label="Previous image"
              >
                <ChevronLeft className="size-5" />
              </Button>
            )}

            {/* =====================================================
          NEXT
      ====================================================== */}

            {images.length > 1 && (
              <Button
                type="button"
                variant="secondary"
                size="icon"
                onClick={nextImage}
                className={cn(
                  'absolute top-1/2 right-3 z-40',
                  '-translate-y-1/2',
                  'size-12 rounded-full',
                  'border border-white/10',
                  'bg-white/10 text-white',
                  'shadow-xl backdrop-blur-xl',
                  'transition-all duration-200',
                  'hover:scale-105',
                  'hover:bg-white/20',
                  'sm:right-6',
                )}
                aria-label="Next image"
              >
                <ChevronRight className="size-5" />
              </Button>
            )}

            {/* =====================================================
          ZOOM HINT
      ====================================================== */}

            <div className="pointer-events-none absolute bottom-[104px] left-1/2 z-30 hidden -translate-x-1/2 rounded-full border border-white/10 bg-black/50 px-4 py-2 text-xs text-white/60 backdrop-blur-xl md:block">
              Scroll to zoom · Double click to zoom · Drag to move
            </div>

            {/* =====================================================
          THUMBNAILS
      ====================================================== */}

            {images.length > 1 && (
              <div className="absolute inset-x-0 bottom-0 z-40 overflow-x-auto p-4 sm:p-6">
                <div className="mx-auto flex w-max gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => goToImage(index)}
                      className={cn(
                        'relative size-14 shrink-0',
                        'overflow-hidden rounded-xl',
                        'border-2',
                        'bg-white/5',
                        'transition-all duration-200',
                        'sm:size-16',
                        index === lightboxIndex
                          ? 'scale-105 border-white shadow-xl'
                          : 'border-transparent opacity-50 hover:opacity-100',
                      )}
                      aria-label={`View image ${index + 1}`}
                    >
                      <Image
                        src={image.cardUrl}
                        alt=""
                        fill
                        sizes="64px"
                        quality={75}
                        draggable={false}
                        className="object-cover select-none"
                      />

                      {index === lightboxIndex && <div className="absolute inset-0 bg-white/10" />}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
