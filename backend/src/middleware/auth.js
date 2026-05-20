const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/User');

const requireAuth = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    res.status(401);
    throw new Error('Authentication required');
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error('Invalid or expired token');
  }

  const user = await User.findById(payload.sub)
    .populate('role', 'name permissions isSystem')
    .populate('site', 'name slug');

  if (!user || !user.isActive) {
    res.status(401);
    throw new Error('Account is inactive or no longer exists');
  }

  req.user = user;
  req.token = token;
  next();
});

const requireRole = (...allowed) =>
  asyncHandler(async (req, _res, next) => {
    if (!req.user) {
      const err = new Error('Authentication required');
      err.status = 401;
      throw err;
    }
    const roleName = req.user.role?.name;
    if (!roleName || !allowed.includes(roleName)) {
      const err = new Error('You do not have permission to perform this action');
      err.status = 403;
      throw err;
    }
    next();
  });

module.exports = { requireAuth, requireRole };
