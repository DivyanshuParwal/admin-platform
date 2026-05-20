const asyncHandler = require('express-async-handler');

const User = require('../models/User');
const Site = require('../models/Site');
const Role = require('../models/Role');

/**
 * GET /api/dashboard/summary
 *
 * Returns a compact aggregate view of the system: high-level counters plus
 * per-site and per-role breakdowns suitable for visualisations.
 */
const getSummary = asyncHandler(async (_req, res) => {
  const [
    totalUsers,
    activeUsers,
    totalSites,
    activeSites,
    totalRoles,
    usersPerSite,
    usersPerRole,
    recentUsers,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ isActive: true }),
    Site.countDocuments({}),
    Site.countDocuments({ isActive: true }),
    Role.countDocuments({}),
    User.aggregate([
      {
        $group: {
          _id: '$site',
          total: { $sum: 1 },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
      { $lookup: { from: 'sites', localField: '_id', foreignField: '_id', as: 'site' } },
      { $unwind: { path: '$site', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          siteId: '$_id',
          siteName: '$site.name',
          total: 1,
          active: 1,
        },
      },
      { $sort: { total: -1 } },
      { $limit: 8 },
    ]),
    User.aggregate([
      { $group: { _id: '$role', total: { $sum: 1 } } },
      { $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'role' } },
      { $unwind: { path: '$role', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, roleId: '$_id', roleName: '$role.name', total: 1 } },
      { $sort: { total: -1 } },
    ]),
    User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('role', 'name')
      .populate('site', 'name')
      .lean(),
  ]);

  res.json({
    counters: {
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      totalSites,
      activeSites,
      totalRoles,
    },
    usersPerSite,
    usersPerRole,
    recentUsers: recentUsers.map((u) => ({
      id: u._id,
      name: u.name,
      email: u.email,
      isActive: u.isActive,
      role: u.role?.name,
      site: u.site?.name,
      createdAt: u.createdAt,
    })),
  });
});

module.exports = { getSummary };
