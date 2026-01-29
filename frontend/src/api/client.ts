import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 请求频率限制提示
const showToast = (message: string) => {
  // 触发自定义事件
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type: 'error' } }));
};

// Response interceptor to handle 401s and 429s globally
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?msg=' + encodeURIComponent(error.response.data.message || '登录已过期');
      }
    } else if (error.response && error.response.status === 429) {
      // 请求过于频繁
      showToast('操作过于频繁，请稍后再试');
    }
    return Promise.reject(error);
  }
);

export default client;
