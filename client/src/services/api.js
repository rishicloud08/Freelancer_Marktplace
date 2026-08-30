import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const api = {
  auth: {
    login: (data) => apiClient.post('/auth/login', data),
    register: (data) => apiClient.post('/auth/register', data),
    getMe: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.put('/auth/profile', data),
  },
  projects: {
    getProjects: (params) => apiClient.get('/projects', { params }),
    getProject: (id) => apiClient.get(`/projects/${id}`),
    createProject: (data) => apiClient.post('/projects', data),
    updateProject: (id, data) => apiClient.put(`/projects/${id}`, data),
    getMyProjects: () => apiClient.get('/projects/my/projects'),
    getAssignedProjects: () => apiClient.get('/projects/assigned/me'),
    resetProject: (id) => apiClient.post(`/projects/${id}/reset`),
    deleteProject: (id) => apiClient.delete(`/projects/${id}`),
  },
  proposals: {
    submitProposal: (data) => apiClient.post('/proposals', data),
    getProjectProposals: (projectId) => apiClient.get(`/proposals/project/${projectId}`),
    getMyProposals: () => apiClient.get('/proposals/my/proposals'),
    acceptProposal: (id) => apiClient.put(`/proposals/${id}/accept`),
    rejectProposal: (id) => apiClient.put(`/proposals/${id}/reject`),
    deleteProposal: (id) => apiClient.delete(`/proposals/${id}`),
  },
  messages: {
    getConversations: () => apiClient.get('/messages/conversations'),
    getConversation: (userId) => apiClient.get(`/messages/${userId}`),
    sendMessage: (data) => apiClient.post('/messages', data),
    markAsRead: (userId) => apiClient.put(`/messages/read/${userId}`),
    getUnreadCount: () => apiClient.get('/messages/unread/total'),
  },
  milestones: {
    getMilestones: (projectId) => apiClient.get(`/milestones/project/${projectId}`),
    createMilestone: (data) => apiClient.post('/milestones', data),
    updateMilestoneStatus: (id, data) => apiClient.put(`/milestones/${id}/status`, data),
    resetSubmission: (id, data) => apiClient.post(`/milestones/${id}/reset`, data),
  },
  payments: {
    fundMilestone: (data) => apiClient.post('/payments/fund', data),
    createGatewayOrder: (data) => apiClient.post('/payments/create-order', data),
    verifyGatewayPayment: (data) => apiClient.post('/payments/verify-payment', data),
    releasePayment: (id) => apiClient.put(`/payments/release/${id}`),
    getProjectPayments: (projectId) => apiClient.get(`/payments/project/${projectId}`),
  },
  reviews: {
    createReview: (data) => apiClient.post('/reviews', data),
    getUserReviews: (userId) => apiClient.get(`/reviews/user/${userId}`),
  },
  wallet: {
    getSummary: () => apiClient.get('/wallet/summary'),
    withdraw: (data) => apiClient.post('/wallet/withdraw', data),
    deposit: (data) => apiClient.post('/wallet/deposit', data),
    resetBalance: () => apiClient.post('/wallet/reset-balance'),
    adjustBalance: (data) => apiClient.post('/wallet/adjust-balance', data),
    deleteTransaction: (id) => apiClient.delete(`/wallet/transactions/${id}`),
    clearAllTransactions: () => apiClient.delete('/wallet/transactions/clear/all'),
  },
  contracts: {
    getProjectContract: (projectId) => apiClient.get(`/contracts/project/${projectId}`),
    generateContract: (data) => apiClient.post('/contracts/generate', data),
    signContract: (data) => apiClient.post('/contracts/sign', data),
  },
  disputes: {
    getProjectDisputes: (projectId) => apiClient.get(`/disputes/project/${projectId}`),
    fileDispute: (data) => apiClient.post('/disputes', data),
    resolveDispute: (id) => apiClient.put(`/disputes/${id}/resolve`),
  },
  tasks: {
    getProjectTasks: (projectId) => apiClient.get(`/tasks/project/${projectId}`),
    createTask: (data) => apiClient.post('/tasks', data),
    updateTaskStatus: (id, data) => apiClient.put(`/tasks/${id}`, data),
    deleteTask: (id) => apiClient.delete(`/tasks/${id}`),
  },
  ai: {
    matchFreelancers: (projectId) => apiClient.get(`/ai/match/${projectId}`),
    recommendProjects: () => apiClient.get('/ai/recommend-projects'),
    recommendFreelancers: (projectId) => apiClient.get(`/ai/recommend-freelancers/${projectId}`),
    enhanceProposal: (data) => apiClient.post('/ai/enhance-proposal', data),
    generateMilestones: (data) => apiClient.post('/ai/generate-milestones', data),
    inspectDeliverable: (data) => apiClient.post('/ai/inspect-deliverable', data),
    getSkillQuiz: (skill) => apiClient.get(`/ai/skill-quiz/${encodeURIComponent(skill)}`),
    verifySkill: (data) => apiClient.post('/ai/verify-skill', data),
    parseProfile: (data) => apiClient.post('/ai/parse-profile', data),
    parseResumeFile: (data) => apiClient.post('/ai/parse-resume-file', data),
    extractGitHub: (data) => apiClient.post('/ai/extract-github', data),
  }
};

export default api;