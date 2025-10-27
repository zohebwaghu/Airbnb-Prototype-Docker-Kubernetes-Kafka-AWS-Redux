import React, { useState, useEffect } from 'react';
import './ImageLightbox.css';

const ImageLightbox = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrevious();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.5, 1));
    if (scale <= 1.5) {
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleMouseDown = (e) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getPhotoDescription = (image) => {
    const descriptions = {
      'Living Room': 'Spacious living area with comfortable seating',
      'Bedroom': 'Cozy bedroom with quality bedding',
      'Kitchen': 'Fully equipped modern kitchen',
      'Bathroom': 'Clean and modern bathroom facilities',
      'Dining Area': 'Dining table for guests',
      'Pool': 'Private pool area',
      'Garden': 'Beautiful outdoor garden space',
      'Balcony': 'Private balcony with views',
      'Workspace': 'Dedicated workspace area',
      'View': 'Stunning views from the property',
      'Exterior': 'Property exterior',
      'Terrace': 'Outdoor terrace area',
      'Beach Access': 'Direct access to the beach',
      'Eiffel Tower View': 'Stunning view of the Eiffel Tower',
      'Colosseum View': 'Panoramic view of the Colosseum',
      'City View': 'Vibrant city skyline view',
      'Traditional Room': 'Authentic traditional Japanese room',
      'Gothic Quarter': 'Historic Gothic Quarter street view',
      'Thames View': 'View of the River Thames and landmarks',
      'Outdoor Shower': 'Refreshing outdoor shower area',
      'Exposed Brick': 'Charming exposed brick interior'
    };
    return descriptions[image.category] || image.category;
  };

  const currentImage = images[currentIndex];

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="lightbox-header">
          <button className="lightbox-close-btn" onClick={onClose}>
            ✕
          </button>
          <div className="lightbox-counter">
            {currentIndex + 1} / {images.length}
          </div>
          <div className="lightbox-zoom-controls">
            <button className="zoom-btn" onClick={handleZoomOut} disabled={scale <= 1}>
              −
            </button>
            <span className="zoom-level">{Math.round(scale * 100)}%</span>
            <button className="zoom-btn" onClick={handleZoomIn} disabled={scale >= 3}>
              +
            </button>
          </div>
        </div>

        {/* Image Display */}
        <div 
          className="lightbox-image-container"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={currentImage.image_url}
            alt={currentImage.category}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
              cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
            }}
            draggable={false}
          />
        </div>

        {/* Navigation Buttons */}
        {images.length > 1 && (
          <>
            <button className="lightbox-nav-btn prev" onClick={handlePrevious}>
              ‹
            </button>
            <button className="lightbox-nav-btn next" onClick={handleNext}>
              ›
            </button>
          </>
        )}

        {/* Image Info */}
        <div className="lightbox-info">
          <h3>{currentImage.category}</h3>
          <p>{getPhotoDescription(currentImage)}</p>
        </div>

        {/* Thumbnail Strip */}
        <div className="lightbox-thumbnails">
          {images.map((image, index) => (
            <div
              key={index}
              className={`lightbox-thumbnail ${index === currentIndex ? 'active' : ''}`}
              onClick={() => {
                setCurrentIndex(index);
                setScale(1);
                setPosition({ x: 0, y: 0 });
              }}
            >
              <img src={image.image_url} alt={image.category} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;

