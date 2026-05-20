const asyncHandler = require('express-async-handler');
const { z } = require('zod');

const Role = require('../models/Role');
const User = require('../models/User');

const AVAILABLE_PERMISSIONS = [
  'users:read',
  'users:write',
  'sites:read',
  'sites:write',
  'roles:read',
  'roles:write',
  'dashboard:read',
];

const createSchema = z.object({
  name: z.string().min(1).max(50),
  description: z.string().max(250).optional(),
  permissions: z.array(z.string()).optional(),
});

const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// GET /api/roles
const listRoles = asyncHandler(async (req, res) => {
  const search = (req.query.search || '').trim();
  const filter = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { description: rx }];
  }
  const items = await Role.find(filter).sort({ isSystem: -1, name: 1 }).lean();

  // Decorate with user counts so admins can see how many people use each role.
  if (items.length > 0) {
    const counts = await User.aggregate([
      { $match: { role: { $in: items.map((r) => r._id) } } },
      { $group: { _id: '$role', total: { $sum: 1 } } },
    ]);
    const map = new Map(counts.map((c) => [c._id.toString(), c.total]));
    items.forEach((r) => {
      r.userCount = map.get(r._id.toString()) || 0;
    });
  }

  res.json({ items, availablePermissions: AVAILABLE_PERMISSIONS });
});

// GET /api/roles/:id
const getRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id).lean();
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  res.json(role);
});

// POST /api/roles
const createRole = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const role = await Role.create(data);
  res.status(201).json(role.toObject());
});

// PATCH /api/roles/:id
const updateRole = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  const existing = await Role.findById(req.params.id);
  if (!existing) {
    res.status(404);
    throw new Error('Role not found');
  }
  if (existing.isSystem && data.name && data.name !== existing.name) {
    res.status(400);
    throw new Error('System roles cannot be renamed');
  }
  Object.assign(existing, data);
  await existing.save();
  res.json(existing.toObject());
});

// DELETE /api/roles/:id
const deleteRole = asyncHandler(async (req, res) => {
  const role = await Role.findById(req.params.id);
  if (!role) {
    res.status(404);
    throw new Error('Role not found');
  }
  if (role.isSystem) {
    res.status(400);
    throw new Error('System roles cannot be deleted');
  }
  const inUse = await User.countDocuments({ role: role._id });
  if (inUse > 0) {
    res.status(409);
    throw new Error(
      `Cannot delete role: ${inUse} user(s) currently use it. Reassign them first.`
    );
  }
  await role.deleteOne();
  res.json({ ok: true });
});

module.exports = {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  AVAILABLE_PERMISSIONS,
};
