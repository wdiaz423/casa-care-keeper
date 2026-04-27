const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type ReqInit = Omit<RequestInit, 'body'> & { body?: any };

async function request(path: string, init: ReqInit = {}) {
  const url = API_BASE.replace(/\/$/, '') + '/' + path.replace(/^\//, '');
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(init.headers as Record<string,string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const body = init.body ? JSON.stringify(init.body) : undefined;
  const res = await fetch(url, { ...init, headers, body });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw { status: res.status, data };
  return data;
}



export const api = {
  get: (url: string) => request(url, { method: 'GET' }),
  post: (url: string, data: any) => request(url, { method: 'POST', body: data }),
  put: (url: string, data: any) => request(url, { method: 'PUT', body: data }),
  // AGREGA ESTA LÍNEA SI NO EXISTE:
  delete: (url: string) => request(url, { method: 'DELETE' }),
};

export default api;
