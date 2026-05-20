const express = require('express');
const ctrl = require('../controllers/user.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', ctrl.listUsers);
router.get('/:id', ctrl.getUser);

// Mutations require an elevated role.
router.post('/', requireRole('admin', 'manager'), ctrl.createUser);
router.patch('/:id', requireRole('admin', 'manager'), ctrl.updateUser);
router.patch('/:id/deactivate', requireRole('admin', 'manager'), ctrl.deactivateUser);
router.patch('/:id/activate', requireRole('admin', 'manager'), ctrl.activateUser);

module.exports = router;
