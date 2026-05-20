const asyncHandler = require('express-async-handler');
const { z } = require('zod');

const Site = require('../models/Site');
const User = require('../models/User');

function slugify(input) {
  return String(input)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const createSchema = z.object({
  name: z.string().min(1).max(80),
  slug: z.string().min(1).max(80).optional(),
  location: z.string().max(120).optional(),
  description: z.string().max(250).optional(),
  isActive: z.boolean().optional(),
});

const updateSchema = createSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  { message: 'At least one field is required' }
);

// GET /api/sites
const listSites = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
  const search = (req.query.search || '').trim();

  const filter = {};
  if (search) {
    const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ name: rx }, { slug: rx }, { location: rx }];
  }

  const [items, total] = await Promise.all([
    Site.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Site.countDocuments(filter),
  ]);

  // Attach user counts so the UI can show "X users" per site without N requests.
  if (items.length > 0) {
    const counts = await User.aggregate([
      { $match: { site: { $in: items.map((i) => i._id) } } },
      { $group: { _id: '$site', total: { $sum: 1 }, active: { $sum: { $cond: ['$isActive', 1, 0] } } } },
    ]);
    const map = new Map(counts.map((c) => [c._id.toString(), c]));
    items.forEach((s) => {
      const c = map.get(s._id.toString());
      s.userCount = c?.total || 0;
      s.activeUserCount = c?.active || 0;
    });
  }

  res.json({
    items,
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
});

// GET /api/sites/all – lightweight list for dropdowns
const listAllSites = asyncHandler(async (_req, res) => {
  const items = await Site.find({}, 'name slug isActive').sort({ name: 1 }).lean();
  res.json({ items });
});

// GET /api/sites/:id
const getSite = asyncHandler(async (req, res) => {
  const site = await Site.findById(req.params.id).lean();
  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }
  res.json(site);
});

// POST /api/sites
const createSite = asyncHandler(async (req, res) => {
  const data = createSchema.parse(req.body);
  const slug = slugify(data.slug || data.name);
  const site = await Site.create({ ...data, slug });
  res.status(201).json(site.toObject());
});

// PATCH /api/sites/:id
const updateSite = asyncHandler(async (req, res) => {
  const data = updateSchema.parse(req.body);
  if (data.slug !== undefined) data.slug = slugify(data.slug);
  const site = await Site.findByIdAndUpdate(req.params.id, data, {
    new: true,
    runValidators: true,
  });
  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }
  res.json(site.toObject());
});

// DELETE /api/sites/:id
const deleteSite = asyncHandler(async (req, res) => {
  const inUse = await User.countDocuments({ site: req.params.id });
  if (inUse > 0) {
    res.status(409);
    throw new Error(
      `Cannot delete site: ${inUse} user(s) are still assigned to it. Move or deactivate them first.`
    );
  }
  const site = await Site.findByIdAndDelete(req.params.id);
  if (!site) {
    res.status(404);
    throw new Error('Site not found');
  }
  res.json({ ok: true });
});

module.exports = {
  listSites,
  listAllSites,
  getSite,
  createSite,
  updateSite,
  deleteSite,
};
