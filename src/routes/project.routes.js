const express = require('express');
const projectController = require('../controllers/project.controller');
const { restrictTo } = require('../middlewares/auth.middleware');

const router = express.Router();

router
  .route('/')
  .get(projectController.getUserProjects)
  .post(projectController.createProject);

router
  .route('/:projectId')
  .get(projectController.getProject)
  .patch(restrictTo('owner', 'admin'), projectController.updateProject)
  .delete(restrictTo('owner'), projectController.deleteProject);

router
  .route('/:projectId/members')
  .get(projectController.getProjectMembers)
  .post(restrictTo('owner', 'admin'), projectController.addProjectMember);

router
  .route('/:projectId/members/:memberId')
  .delete(restrictTo('owner', 'admin'), projectController.removeProjectMember)
  .patch(restrictTo('owner', 'admin'), projectController.updateProjectMember);

module.exports = router;
