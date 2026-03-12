
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

// Authentication API calls
export const authAPI = {
  register: async (
    email: string,
    password: string,
    fullName: string,
    companyName?: string
  ) => {
    const response = await api.post('/auth/register', {
      email,
      password,
      full_name: fullName,
      company_name: companyName,
    });
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

// 🆕 User API calls
export const userAPI = {
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

export const issuesAPI = {
  getAllIssues: async () => {
    const response = await api.get('/issues/');
    return response.data;
  },

  // 🆕 Add this:
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
};

export const commentsAPI = {

  getComments: async (issueId: string) => {
    const response = await api.get(`/issues/${issueId}/comments`);
    return response.data;
  },

  createComment: async (issueId: string, content: string) => {
    const token = localStorage.getItem('token');
    const response = await api.post(
      `/issues/${issueId}/comments`,
      { content },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  },

};

