import React, { useState } from 'react';
import './PhotoGalleryModal.css';

const PhotoGalleryModal = ({ property, images, onClose }) => {
  const [selectedImage, setSelectedImage] = useState(images[0]);

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
        
        <div className="gallery-modal-header">
          <h2>Photo tour</h2>
          <p>{property.name}</p>
        </div>

        <div className="gallery-modal-body">
          <div className="gallery-main-view">
            <img src={selectedImage.image_url} alt={selectedImage.category} />
          </div>

          <div className="gallery-categories">
            {Object.entries(groupedImages).map(([category, categoryImages]) => (
              <div key={category} className="gallery-category-section">
                <h3>{category}</h3>
                <div className="gallery-category-grid">
                  {categoryImages.map((img, index) => (
                    <div
                      key={index}
                      className={`gallery-thumbnail ${selectedImage === img ? 'active' : ''}`}
                      onClick={() => setSelectedImage(img)}
                    >
                      <img src={img.image_url} alt={img.category} />
                    </div>
                  ))}
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

