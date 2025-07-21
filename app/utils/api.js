import axios from 'axios';

export const API_BASE_URL = 'http://192.168.1.207:3001/api'; // Update this IP if your backend is on a different address

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  // You can add headers or interceptors here if needed
}); 