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
('John Smith', 'john@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'owner', 'New York', 'USA', 'Manhattan, New York'),
('Sarah Johnson', 'sarah@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'owner', 'Los Angeles', 'USA', 'Santa Monica, CA'),
('Michael Chen', 'michael@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'owner', 'San Francisco', 'USA', 'Mission District, SF'),
('Emily Davis', 'emily@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'owner', 'Miami', 'USA', 'South Beach, Miami'),
('Jane Smith', 'jane@example.com', '$2a$10$example.hash.for.demo.purposes.only', 'traveler', 'Seattle', 'USA', NULL);

INSERT INTO properties (owner_id, name, description, property_type, location, city, country, bedrooms, bathrooms, max_guests, base_price, cleaning_fee, service_fee, amenities) VALUES
(1, 'Luxury Manhattan Penthouse', 'Stunning penthouse with panoramic city views, modern amenities, and rooftop access. Perfect for business travelers and tourists.', 'apartment', '123 Fifth Avenue, Manhattan', 'New York', 'USA', 3, 2.5, 6, 450.00, 75.00, 45.00, '["WiFi", "Kitchen", "Air Conditioning", "Heating", "City View", "Rooftop Access", "Washer", "Dryer", "Smart TV", "Workspace"]'),
(1, 'Cozy Brooklyn Brownstone', 'Charming historic brownstone in trendy Brooklyn neighborhood. Walk to amazing restaurants and shops.', 'house', '456 Park Slope, Brooklyn', 'New York', 'USA', 2, 1.5, 4, 280.00, 50.00, 28.00, '["WiFi", "Kitchen", "Heating", "Backyard", "Fireplace", "Free Parking", "Pet Friendly"]'),
(2, 'Beachfront Santa Monica Retreat', 'Wake up to ocean views! Modern beachfront condo with direct beach access and stunning sunset views.', 'condo', '789 Ocean Avenue, Santa Monica', 'Los Angeles', 'USA', 2, 2.0, 5, 380.00, 65.00, 38.00, '["WiFi", "Kitchen", "Air Conditioning", "Ocean View", "Beach Access", "Pool", "Gym", "Parking", "Balcony"]'),
(2, 'Hollywood Hills Villa', 'Luxurious villa in the Hollywood Hills with infinity pool, home theater, and breathtaking LA views.', 'house', '321 Sunset Boulevard, Hollywood Hills', 'Los Angeles', 'USA', 4, 3.5, 8, 650.00, 100.00, 65.00, '["WiFi", "Kitchen", "Air Conditioning", "Pool", "Hot Tub", "Home Theater", "City View", "Parking", "BBQ Grill"]'),
(3, 'Modern Downtown SF Loft', 'Industrial-chic loft in the heart of downtown San Francisco. Walking distance to tech companies and attractions.', 'apartment', '567 Market Street, Downtown', 'San Francisco', 'USA', 1, 1.0, 2, 220.00, 40.00, 22.00, '["WiFi", "Kitchen", "Heating", "Workspace", "Smart TV", "High-speed Internet", "Coffee Maker"]'),
(3, 'Victorian Home in Haight', 'Beautiful restored Victorian home in iconic Haight-Ashbury. Experience San Francisco history and culture.', 'house', '890 Haight Street, Haight-Ashbury', 'San Francisco', 'USA', 3, 2.0, 6, 320.00, 60.00, 32.00, '["WiFi", "Kitchen", "Heating", "Fireplace", "Garden", "Free Parking", "Vintage Decor"]'),
(4, 'South Beach Oceanfront Condo', 'Luxurious oceanfront condo in the heart of South Beach. Steps from the beach, clubs, and restaurants.', 'condo', '234 Ocean Drive, South Beach', 'Miami', 'USA', 2, 2.0, 4, 350.00, 70.00, 35.00, '["WiFi", "Kitchen", "Air Conditioning", "Ocean View", "Beach Access", "Pool", "Gym", "Parking"]'),
(4, 'Art Deco Miami Beach Studio', 'Stylish Art Deco studio in historic Miami Beach building. Perfect for solo travelers or couples.', 'apartment', '456 Collins Avenue, Miami Beach', 'Miami', 'USA', 1, 1.0, 2, 180.00, 35.00, 18.00, '["WiFi", "Kitchen", "Air Conditioning", "Beach Access", "Art Deco Design", "Rooftop Terrace"]'),
(1, 'Central Park West Apartment', 'Elegant apartment overlooking Central Park. Classic New York luxury with modern conveniences.', 'apartment', '789 Central Park West, Upper West Side', 'New York', 'USA', 2, 2.0, 4, 420.00, 70.00, 42.00, '["WiFi", "Kitchen", "Air Conditioning", "Heating", "Park View", "Doorman", "Elevator", "Washer/Dryer"]'),
(2, 'Venice Beach Bungalow', 'Bohemian beach bungalow steps from the Venice Boardwalk. Perfect for the ultimate LA beach experience.', 'house', '123 Venice Boulevard, Venice Beach', 'Los Angeles', 'USA', 2, 1.0, 4, 250.00, 45.00, 25.00, '["WiFi", "Kitchen", "Air Conditioning", "Beach Access", "Outdoor Shower", "BBQ", "Bikes Included"]');

INSERT INTO property_images (property_id, image_url, is_primary) VALUES
(1, 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800', TRUE),
(1, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', FALSE),
(2, 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800', TRUE),
(2, 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800', FALSE),
(3, 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800', TRUE),
(3, 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800', FALSE),
(4, 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800', TRUE),
(4, 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800', FALSE),
(5, 'https://images.unsplash.com/photo-1502672023488-70e25813eb80?w=800', TRUE),
(5, 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800', FALSE),
(6, 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800', TRUE),
(6, 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800', FALSE),
(7, 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=800', TRUE),
(7, 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800', FALSE),
(8, 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800', TRUE),
(8, 'https://images.unsplash.com/photo-1499916078039-922301b0eb9b?w=800', FALSE),
(9, 'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=800', TRUE),
(9, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', FALSE),
(10, 'https://images.unsplash.com/photo-1601918774946-25832a4be0d6?w=800', TRUE),
(10, 'https://images.unsplash.com/photo-1602941525421-8f8b81d3edbb?w=800', FALSE);
