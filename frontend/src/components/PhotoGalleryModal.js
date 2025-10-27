import React, { useState } from 'react';
import './PhotoGalleryModal.css';

const PhotoGalleryModal = ({ property, images, onClose }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const selectedImage = images[selectedImageIndex];

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
      'Beach Access': 'Direct access to the beach'
    };
    return descriptions[image.category] || image.category;
  };

  const handlePrevious = () => {
    setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const groupedImages = images.reduce((acc, img) => {
    const category = img.category || 'Other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(img);
    return acc;
  }, {});

  return (
    <div className="photo-gallery-modal" onClick={onClose}>
      <div className="gallery-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>
        
        <div className="gallery-photo-counter">
          {selectedImageIndex + 1} / {images.length}
        </div>

        <div className="gallery-modal-body">
          <div className="gallery-main-view">
            <button className="gallery-nav-btn prev" onClick={handlePrevious}>‹</button>
            <div className="main-image-container">
              <img src={selectedImage.image_url} alt={selectedImage.category} />
              <div className="image-description">
                {getPhotoDescription(selectedImage)}
              </div>
            </div>
            <button className="gallery-nav-btn next" onClick={handleNext}>›</button>
          </div>

          <div className="gallery-categories">
            {Object.entries(groupedImages).map(([category, categoryImages]) => (
              <div key={category} className="gallery-category-section">
                <h3>{category}</h3>
                <div className="gallery-category-grid">
                  {categoryImages.map((img, imgIndex) => {
                    const imageIndex = images.findIndex(i => i === img);
                    return (
                      <div
                        key={imgIndex}
                        className={`gallery-thumbnail ${selectedImageIndex === imageIndex ? 'active' : ''}`}
                        onClick={() => setSelectedImageIndex(imageIndex)}
                      >
                        <img src={img.image_url} alt={img.category} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoGalleryModal;

