const isDev = import.meta.env.DEV;

export const BASE_URL = isDev ? 'http://localhost:5054' : '';
export const API_URL = isDev ? 'http://localhost:5054/api' : '/api';
export const HUB_URL = isDev ? 'http://localhost:5054/hubs/chat' : '/hubs/chat';
