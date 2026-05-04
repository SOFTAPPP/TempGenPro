import axios from 'axios';

const AI_API_BASE_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:5005';

const aiApi = axios.create({
  baseURL: AI_API_BASE_URL,
});

export default aiApi;
