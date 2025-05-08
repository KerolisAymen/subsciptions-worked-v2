const express = require('express');
const adminController = require('../controllers/admin.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

// All admin routes should be protected with authentication middleware
// and should only be accessible to system admins
router.use(restrictTo('system-admin'));

router.get('/stats', adminController.getSystemStats);
router.get('/users', adminController.getAllUsers);
router.get('/projects', adminController.getAllProjects);

router.patch('/users/:userId/make-admin', adminController.makeUserAdmin);
router.patch('/users/:userId/remove-admin', adminController.removeUserAdmin);

module.exports = router;