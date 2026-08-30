import express from 'express';
import { getProjectTasks, createTask, updateTaskStatus, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/project/:projectId', getProjectTasks);
router.post('/', createTask);
router.put('/:id', updateTaskStatus);
router.delete('/:id', deleteTask);

export default router;
