/* eslint-disable no-console */
require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Role = require('../models/Role');
const Site = require('../models/Site');
const User = require('../models/User');
const { AVAILABLE_PERMISSIONS } = require('../controllers/role.controller');

const DEFAULT_ROLES = [
  {
    name: 'admin',
    description: 'Full access to manage users, roles and sites.',
    permissions: AVAILABLE_PERMISSIONS,
    isSystem: true,
  },
  {
    name: 'manager',
    description: 'Can manage users but not roles or sites.',
    permissions: ['users:read', 'users:write', 'sites:read', 'roles:read', 'dashboard:read'],
    isSystem: true,
  },
  {
    name: 'member',
    description: 'Read-only access.',
    permissions: ['users:read', 'sites:read', 'roles:read', 'dashboard:read'],
    isSystem: true,
  },
];

const DEFAULT_SITES = [
  { name: 'Headquarters', slug: 'headquarters', location: 'San Francisco, USA', description: 'Primary HQ' },
  { name: 'London Office', slug: 'london-office', location: 'London, UK', description: 'EMEA office' },
  { name: 'Bangalore Office', slug: 'bangalore-office', location: 'Bangalore, India', description: 'Engineering hub' },
];

const SAMPLE_USERS = [
  { name: 'Alex Manager', email: 'alex.manager@example.com', role: 'manager', site: 'headquarters' },
  { name: 'Riya Member', email: 'riya.member@example.com', role: 'member', site: 'bangalore-office' },
  { name: 'John Member', email: 'john.member@example.com', role: 'member', site: 'london-office' },
];

async function upsertRole(def) {
  return Role.findOneAndUpdate({ name: def.name }, { $setOnInsert: def }, { upsert: true, new: true });
}

async function upsertSite(def) {
  return Site.findOneAndUpdate(
    { slug: def.slug },
    { $setOnInsert: { ...def, isActive: true } },
    { upsert: true, new: true }
  );
}

async function ensureUser({ name, email, password, role, site, isActive = true }) {
  const existing = await User.findOne({ email });
  if (existing) return existing;
  const user = new User({ name, email, role: role._id, site: site._id, isActive });
  await user.setPassword(password);
  await user.save();
  return user;
}

async function run() {
  try {
    await connectDB();

    const roles = {};
    for (const def of DEFAULT_ROLES) {
      const r = await upsertRole(def);
      roles[r.name] = r;
    }
    console.log('Roles:', Object.keys(roles).join(', '));

    const sites = {};
    for (const def of DEFAULT_SITES) {
      const s = await upsertSite(def);
      sites[s.slug] = s;
    }
    console.log('Sites:', Object.keys(sites).join(', '));

    const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
    const adminPass = process.env.SEED_ADMIN_PASSWORD || 'Admin@12345';

    await ensureUser({
      name: process.env.SEED_ADMIN_NAME || 'Platform Admin',
      email: adminEmail,
      password: adminPass,
      role: roles.admin,
      site: sites.headquarters,
    });
    console.log('Admin:', adminEmail);

    for (const u of SAMPLE_USERS) {
      await ensureUser({
        name: u.name,
        email: u.email,
        password: 'Password@123',
        role: roles[u.role],
        site: sites[u.site],
      });
    }

    console.log('\nDone. Login with', adminEmail, '/', adminPass);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

run();
