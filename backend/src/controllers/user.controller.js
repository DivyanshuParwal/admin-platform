const asyncHandler = require('express-async-handler');
const { z } = require('zod');
const mongoose = require('mongoose');

const User = require('../models/User');
const Role = require('../models/Role');
const Site = require('../models/Site');

const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: 'Invalid id' });

const createSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().toLowerCase(),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  roleId: objectId,
  siteId: objectId,
  isActive: z.boolean().optional(),
});

const updateSchema = z
  .object({
    name: z.string().min(1).max(80).optional(),
    email: z.string().email().toLowerCase().optional(),
    password: z.string().min(6).optional(),
    roleId: objectId.optional(),
    siteId: objectId.optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required',
  });

// GET /api/users
const listUsers = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const search = (req.query.search || '').trim();
  const { siteId, roleId, status } = req.query;

  const filter = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { email: rx }];
  }
  if (siteId && mongoose.isValidObjectId(siteId)) filter.site = siteId;
  if (roleId && mongoose.isValidObjectId(roleId)) filter.role = roleId;
  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('role', 'name')
      .populate('site', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

// GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
    .populate('role', 'name permissions')
    .populate('site', 'name slug');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user.toSafeJSON());
});

// POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);

  const [role, site] = await Promise.all([
    Role.findById(data.roleId),
    Site.findById(data.siteId),
  ]);
  if (!role) {
    res.status(400);
    throw new Error('Role does not exist');
  }
  if (!site) {
    res.status(400);
    throw new Error('Site does not exist');
  }

  const user = new User({
    name: data.name,
    email: data.email,
    role: role._id,
    site: site._id,
    isActive: data.isActive ?? true,
  });
  await user.setPassword(data.password);
  await user.save();

  const populated = await user.populate([
    { path: 'role', select: 'name' },
    { path: 'site', select: 'name slug' },
  ]);

  res.status(201).json(populated.toSafeJSON());
});

// PATCH /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (data.roleId) {
    const role = await Role.findById(data.roleId);
    if (!role) {
      res.status(400);
      throw new Error('Role does not exist');
    }
    user.role = role._id;
  }
  if (data.siteId) {
    const site = await Site.findById(data.siteId);
    if (!site) {
      res.status(400);
      throw new Error('Site does not exist');
    }
    user.site = site._id;
  }
  if (data.name !== undefined) user.name = data.name;
  if (data.email !== undefined) user.email = data.email;
  if (data.isActive !== undefined) user.isActive = data.isActive;
  if (data.password) await user.setPassword(data.password);

  await user.save();
  const populated = await user.populate([
    { path: 'role', select: 'name' },
    { path: 'site', select: 'name slug' },
  ]);
  res.json(populated.toSafeJSON());
});

// PATCH /api/users/:id/deactivate
const deactivateUser = asyncHandler(async (req, res) => {
  if (req.user && req.user._id.toString() === req.params.id) {
    res.status(400);
    throw new Error('You cannot deactivate your own account');
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  )
    .populate('role', 'name')
    .populate('site', 'name slug');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user.toSafeJSON());
});

// PATCH /api/users/:id/activate
const activateUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { isActive: true },
    { new: true }
  )
    .populate('role', 'name')
    .populate('site', 'name slug');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user.toSafeJSON());
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  activateUser,
};
