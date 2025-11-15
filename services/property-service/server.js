const express = require('express');
const cors = require('cors');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { connectDB, getDB } = require('../shared/mongodb');
const { publishEvent } = require('../shared/kafka-producer');

const app = express();
const PORT = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Validation schemas
const createPropertySchema = Joi.object({
  name: Joi.string().min(3).max(255).required(),
  description: Joi.string().optional(),
  property_type: Joi.string().valid('apartment', 'house', 'condo', 'townhouse', 'other').required(),
  location: Joi.string().required(),
  city: Joi.string().required(),
  country: Joi.string().required(),
  latitude: Joi.number().optional(),
  longitude: Joi.number().optional(),
  bedrooms: Joi.number().integer().min(1).required(),
  bathrooms: Joi.number().min(0.5).required(),
  max_guests: Joi.number().integer().min(1).required(),
  base_price: Joi.number().min(0).required(),
  cleaning_fee: Joi.number().min(0).optional(),
  service_fee: Joi.number().min(0).optional(),
  amenities: Joi.array().optional()
});

// Search properties with filters
app.get('/api/properties', async (req, res) => {
  try {
    const db = getDB();
    const properties = db.collection('properties');
    
    const {
      location,
      city,
      country,
      checkIn,
      checkOut,
      guests,
      minPrice,
      maxPrice,
      propertyType
    } = req.query;

    // Build query
    const query = { is_available: true };

    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }
    if (propertyType) {
      query.property_type = propertyType;
    }
    if (minPrice || maxPrice) {
      query.base_price = {};
      if (minPrice) query.base_price.$gte = parseFloat(minPrice);
      if (maxPrice) query.base_price.$lte = parseFloat(maxPrice);
    }
    if (guests) {
      query.max_guests = { $gte: parseInt(guests) };
    }

    // TODO: Add date availability check with bookings collection
    // For now, just return available properties

    const propertiesList = await properties.find(query).toArray();

    // Format response
    const formattedProperties = propertiesList.map(property => ({
      id: property._id.toString(),
      owner_id: property.owner_id.toString(),
      name: property.name,
      description: property.description,
      property_type: property.property_type,
      location: property.location,
      city: property.city,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      max_guests: property.max_guests,
      base_price: property.base_price,
      cleaning_fee: property.cleaning_fee || 0,
      service_fee: property.service_fee || 0,
      amenities: property.amenities || [],
      is_available: property.is_available
    }));

    res.json(formattedProperties);
  } catch (error) {
    console.error('Search properties error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get property details
app.get('/api/properties/:id', async (req, res) => {
  try {
    const db = getDB();
    const properties = db.collection('properties');
    const propertyImages = db.collection('property_images');

    const { ObjectId } = require('mongodb');
    const property = await properties.findOne({
      _id: new ObjectId(req.params.id)
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Get property images
    const images = await propertyImages.find({
      property_id: new ObjectId(req.params.id)
    }).toArray();

    const propertyResponse = {
      id: property._id.toString(),
      owner_id: property.owner_id.toString(),
      name: property.name,
      description: property.description,
      property_type: property.property_type,
      location: property.location,
      city: property.city,
      country: property.country,
      latitude: property.latitude,
      longitude: property.longitude,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      max_guests: property.max_guests,
      base_price: property.base_price,
      cleaning_fee: property.cleaning_fee || 0,
      service_fee: property.service_fee || 0,
      amenities: property.amenities || [],
      is_available: property.is_available,
      images: images.map(img => ({
        id: img._id.toString(),
        image_url: img.image_url,
        is_primary: img.is_primary || false,
        category: img.category
      }))
    };

    res.json(propertyResponse);
  } catch (error) {
    console.error('Get property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create property (owners only)
app.post('/api/properties', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    const { error, value } = createPropertySchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const db = getDB();
    const properties = db.collection('properties');

    const { ObjectId } = require('mongodb');
    const property = {
      owner_id: new ObjectId(req.user.userId),
      ...value,
      is_available: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await properties.insertOne(property);
    property._id = result.insertedId;

    // Publish property created event
    await publishEvent('property-created', {
      property_id: result.insertedId.toString(),
      owner_id: req.user.userId,
      name: property.name,
      location: property.location
    });

    res.status(201).json({
      message: 'Property created successfully',
      property: {
        id: result.insertedId.toString(),
        ...property,
        owner_id: property.owner_id.toString()
      }
    });
  } catch (error) {
    console.error('Create property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update property (owners only)
app.put('/api/properties/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    const db = getDB();
    const properties = db.collection('properties');
    const { ObjectId } = require('mongodb');

    // Verify property belongs to owner
    const property = await properties.findOne({
      _id: new ObjectId(req.params.id),
      owner_id: new ObjectId(req.user.userId)
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    const updateData = {
      ...req.body,
      updated_at: new Date()
    };

    // Remove fields that shouldn't be updated
    delete updateData.owner_id;
    delete updateData._id;
    delete updateData.created_at;

    await properties.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );

    res.json({ message: 'Property updated successfully' });
  } catch (error) {
    console.error('Update property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete property (owners only)
app.delete('/api/properties/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.userType !== 'owner') {
      return res.status(403).json({ error: 'Access denied. Owner only.' });
    }

    const db = getDB();
    const properties = db.collection('properties');
    const { ObjectId } = require('mongodb');

    // Verify property belongs to owner
    const property = await properties.findOne({
      _id: new ObjectId(req.params.id),
      owner_id: new ObjectId(req.user.userId)
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found or access denied' });
    }

    const { ObjectId } = require('mongodb');
    await properties.deleteOne({
      _id: new ObjectId(req.params.id)
    });

    // Publish property deleted event
    await publishEvent('property-deleted', {
      property_id: req.params.id,
      owner_id: req.user.userId
    });

    res.json({ message: 'Property deleted successfully' });
  } catch (error) {
    console.error('Delete property error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'property-service' });
});

// Start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Property Service running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start property service:', error);
    process.exit(1);
  }
};

startServer();

