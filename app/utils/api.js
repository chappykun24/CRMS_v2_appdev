import axios from 'axios';

export const API_BASE_URL = 'http://192.168.1.9:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // You can add headers or interceptors here if needed
}); 