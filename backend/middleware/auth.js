const jwt = require('jsonwebtoken');


// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

// Middleware to check if user is an owner
const requireOwner = (req, res, next) => {
  if (!req.session.userId || req.session.userType !== 'owner') {
    return res.status(403).json({ error: 'Owner access required' });
  }
  next();
};

// Middleware to check if user is a traveler
const requireTraveler = (req, res, next) => {
  if (!req.session.userId || req.session.userType !== 'traveler') {
    return res.status(403).json({ error: 'Traveler access required' });
  }
  next();
};

module.exports = {
  requireAuth,
  requireOwner,
  requireTraveler
};
