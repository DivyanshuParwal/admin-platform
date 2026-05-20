const express = require('express');
const ctrl = require('../controllers/site.controller');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', ctrl.listSites);
router.get('/all', ctrl.listAllSites);
router.get('/:id', ctrl.getSite);

router.post('/', requireRole('admin'), ctrl.createSite);
router.patch('/:id', requireRole('admin'), ctrl.updateSite);
router.delete('/:id', requireRole('admin'), ctrl.deleteSite);

module.exports = router;
