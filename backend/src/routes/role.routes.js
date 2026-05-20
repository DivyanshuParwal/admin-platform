const express = require('express');
const ctrl = require('../controllers/role.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', ctrl.listRoles);
router.get('/:id', ctrl.getRole);

router.post('/', requireRole('admin'), ctrl.createRole);
router.patch('/:id', requireRole('admin'), ctrl.updateRole);
router.delete('/:id', requireRole('admin'), ctrl.deleteRole);

module.exports = router;
