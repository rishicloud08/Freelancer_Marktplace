import Task from '../models/Task.js';
import Project from '../models/Project.js';

export const getProjectTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('milestone', 'title')
      .sort({ createdAt: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const { projectId, milestoneId, title, description, priority, storyPoints, assignedTo } = req.body;
    
    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = new Task({
      project: projectId,
      milestone: milestoneId || null,
      title,
      description: description || '',
      priority: priority || 'medium',
      storyPoints: storyPoints || 3,
      assignedTo: assignedTo || project.assignedFreelancer || null,
      createdBy: req.user._id
    });

    const savedTask = await task.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { status, priority, title, description } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (status !== undefined) task.status = status;
    if (priority !== undefined) task.priority = priority;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;

    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
