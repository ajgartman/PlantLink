import axios from 'axios';
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// 🎓 INTERCEPTOR PATTERN - Automatically add token to every request
// This is called "request middleware" - it runs BEFORE every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    // Automatically add Authorization header if token exists
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 🎓 RESPONSE INTERCEPTOR - Handle errors globally
api.interceptors.response.use(
  (response) => {
    // If request succeeds, just return the response
    return response;
  },
  (error) => {
    // If we get 401 Unauthorized, token is invalid/expired
    if (error.response?.status === 401) {
      // Clear invalid token
      localStorage.removeItem('token');
      // Redirect to login
      window.location.href = '/login';
    }
    // Throw error so individual API calls can still catch it
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    full_name: string;
    company_name: string;
    company_type?: string;
    company_email?: string;
    company_phone?: string;
    company_address?: string;
  }) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', {
      email,
      password,
    });
    return response.data;
  },
};

export const userAPI = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

export const usersAPI = {
  getAllUsers: async () => {
    const response = await api.get('/users/');
    return response.data;
  },
};

export const issuesAPI = {
  getAllIssues: async (params?: { status?: string; priority?: string; project_id?: string; q?: string; skip?: number; limit?: number }) => {
    const response = await api.get('/issues/', { params });
    return { data: response.data, total: parseInt(response.headers['x-total-count'] || '0', 10) };
  },

  createIssue: async (issueData: {
    title: string;
    description?: string;
    priority: string;
    location?: string;
    project_id: string;
  }) => {
    const response = await api.post('/issues/', issueData);
    return response.data;
  },

  updateIssue: async (issueId: string, data: Record<string, any>) => {
    const response = await api.put(`/issues/${issueId}`, data);
    return response.data;
  },

  getIssueHistory: async (issueId: string) => {
    const response = await api.get(`/issues/${issueId}/history`);
    return response.data;
  },

  getRecentHistory: async (limit: number = 10) => {
    const response = await api.get('/issues/history/recent', { params: { limit } });
    return response.data;
  },

};

export const attachmentsAPI = {
  getAttachments: async (issueId: string) => {
    const response = await api.get(`/issues/${issueId}/attachments`);
    return response.data;
  },

  uploadAttachment: async (issueId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(`/issues/${issueId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  deleteAttachment: async (attachmentId: string) => {
    await api.delete(`/attachments/${attachmentId}`);
  },
};

export const invitesAPI = {
  validateToken: async (token: string) => {
    const response = await api.get(`/invites/${token}`);
    return response.data;
  },

  acceptInvite: async (data: { token: string; password: string; full_name: string }) => {
    const response = await api.post('/invites/accept', data);
    return response.data;
  },

  createInvite: async (data: { email: string; role: string }) => {
    const response = await api.post('/invites/', data);
    return response.data;
  },

  listInvites: async () => {
    const response = await api.get('/invites/');
    return response.data;
  },
};

export const commentsAPI = {

  getComments: async (issueId: string) => {
    const response = await api.get(`/issues/${issueId}/comments`);
    return response.data;
  },

  createComment: async (issueId: string, content: string) => {
    const response = await api.post(`/issues/${issueId}/comments`, { content });
    return response.data;
  },

};

export const projectsAPI = {
  getAllProjects: async () => {
    const response = await api.get('/projects/');
    return response.data;
  },

  // 🆕 ADD THIS:
  createProject: async (projectData: {
    name: string;
    description?: string;
    plant_id: string;
    contractor_id: string;
    start_date?: string;
    end_date?: string;
  }) => {
    const response = await api.post('/projects/', projectData);
    return response.data;
  },
};

export const companiesAPI = {
  // GET /companies/ — returns all companies; we'll filter client-side for now
  getAllCompanies: async () => {
    const response = await api.get('/companies/');
    return response.data;
  },

  // POST /companies/ — create a new company
  createCompany: async (companyData: {
    name: string;
    company_type: 'plant' | 'contractor';
    email?: string;
    phone?: string;
    address?: string;
  }) => {
    const response = await api.post('/companies/', companyData);
    return response.data;
  },
};
