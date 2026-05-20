const asyncHandler = require('express-async-handler');
const jwt = require('jsonwebtoken');
const { z } = require('zod');

const User = require('../models/User');

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );
}

function shapeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    role: user.role && { id: user.role._id, name: user.role.name, permissions: user.role.permissions || [] },
    site: user.site && { id: user.site._id, name: user.site.name, slug: user.site.slug },
    lastLoginAt: user.lastLoginAt,
  };
}

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);

  const user = await User.findOne({ email })
    .select('+passwordHash')
    .populate('role', 'name permissions isSystem')
    .populate('site', 'name slug');

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  if (!user.isActive) {
    res.status(403);
    throw new Error('Account is deactivated. Contact an administrator.');
  }

  const ok = await user.comparePassword(password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.json({ token, user: shapeUser(user) });
});

// GET /api/auth/me
const me = asyncHandler(async (req, res) => {
  res.json({ user: shapeUser(req.user) });
});

module.exports = { login, me };
