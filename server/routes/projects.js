import express from 'express';
import { 
  getProjects, 
  getProject, 
  createProject, 
  updateProject, 
  getMyProjects, 
  getAssignedProjects,
  resetProject,
  deleteProject
} from '../controllers/projectController.js';
import { protect, roleCheck } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getProjects)
  .post(protect, roleCheck('client'), createProject);

router.get('/my/projects', protect, roleCheck('client'), getMyProjects);
router.get('/assigned/me', protect, roleCheck('freelancer'), getAssignedProjects);

router.post('/:id/reset', protect, roleCheck('client'), resetProject);

router.route('/:id')
  .get(getProject)
  .put(protect, roleCheck('client'), updateProject)
  .delete(protect, roleCheck('client'), deleteProject);

export default router;

