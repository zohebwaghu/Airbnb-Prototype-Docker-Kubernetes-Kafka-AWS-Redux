DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS favorites;
DROP TABLE IF EXISTS property_images;
DROP TABLE IF EXISTS properties;
DROP TABLE IF EXISTS users;
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    user_type ENUM('traveler', 'owner') NOT NULL DEFAULT 'traveler',
    profile_picture VARCHAR(500),
    about_me TEXT,
    city VARCHAR(100),
    country VARCHAR(100),
    languages VARCHAR(255),
    gender ENUM('male', 'female', 'other'),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE TABLE properties (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    property_type ENUM('apartment', 'house', 'condo', 'townhouse', 'other') NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    country VARCHAR(100) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    bedrooms INT NOT NULL DEFAULT 1,
    bathrooms DECIMAL(3,1) NOT NULL DEFAULT 1,
    max_guests INT NOT NULL DEFAULT 1,
    base_price DECIMAL(10, 2) NOT NULL,
    cleaning_fee DECIMAL(10, 2) DEFAULT 0,
    service_fee DECIMAL(10, 2) DEFAULT 0,
    amenities JSON,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE property_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);
CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    traveler_id INT NOT NULL,
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    number_of_guests INT NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    status ENUM('pending', 'accepted', 'cancelled', 'completed') DEFAULT 'pending',
    special_requests TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    FOREIGN KEY (traveler_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    property_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, property_id)
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_properties_owner_id ON properties(owner_id);
CREATE INDEX idx_properties_location ON properties(location);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_country ON properties(country);
CREATE INDEX idx_properties_is_available ON properties(is_available);
CREATE INDEX idx_bookings_property_id ON bookings(property_id);
CREATE INDEX idx_bookings_traveler_id ON bookings(traveler_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_property_id ON favorites(property_id);

-- Insert sample data for testing
INSERT INTO users (name, email, password_hash, user_type, city, country, location) VALUES
('John Doe', 'john@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'owner', 'New York', 'USA', 'Manhattan, New York'),
('Jane Smith', 'jane@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'traveler', 'Los Angeles', 'USA', NULL);

INSERT INTO properties (owner_id, name, description, property_type, location, city, country, bedrooms, bathrooms, max_guests, base_price, amenities) VALUES
(1, 'Cozy Apartment in Manhattan', 'Beautiful apartment in the heart of Manhattan with great city views.', 'apartment', '123 Main St, Manhattan', 'New York', 'USA', 2, 1.0, 4, 150.00, '["WiFi", "Kitchen", "Air Conditioning", "Heating"]'),
(1, 'Modern Loft Downtown', 'Stylish loft apartment with modern amenities and downtown location.', 'apartment', '456 Downtown Ave', 'New York', 'USA', 1, 1.0, 2, 120.00, '["WiFi", "Gym", "Elevator", "Concierge"]');

INSERT INTO property_images (property_id, image_url, is_primary) VALUES
(1, '/uploads/property1_main.jpg', TRUE),
(1, '/uploads/property1_bedroom.jpg', FALSE),
(2, '/uploads/property2_main.jpg', TRUE);
