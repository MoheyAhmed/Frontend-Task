import { env, isStaticSource } from '../config/env';

const stripLeadingSlash = (path) => path.replace(/^\/+/, '');

const buildRestUrl = (path, params) => {
  const cleanedBase = env.API_BASE_URL.replace(/\/+$/, '');
  const cleanedPath = stripLeadingSlash(path);
  const url = new URL(`${cleanedBase}/${cleanedPath}`);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, value);
      }
    });
  }

  return url.toString();
};

const buildStaticUrl = (path) => {
  const cleaned = stripLeadingSlash(path);
  const resource = cleaned.endsWith('.json') ? cleaned : `${cleaned}.json`;
  return `${env.STATIC_BASE_URL}/${resource}`;
};

const jsonHeaders = {
  'Content-Type': 'application/json',
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

const handleResponse = async (response) => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    throw new ApiError(payload?.message || 'Request to server failed', response.status, payload);
  }

  return payload;
};

const ensureWritable = (method) => {
  if (isStaticSource && method !== 'GET') {
    throw new ApiError('Static data source does not allow write operations', 405);
  }
};

const request = async (method, path, { data, params, headers } = {}) => {
  ensureWritable(method);

  const url = isStaticSource ? buildStaticUrl(path) : buildRestUrl(path, params);

  const init = {
    method,
    headers: {
      ...jsonHeaders,
      ...headers,
    },
  };

  if (data !== undefined) {
    init.body = JSON.stringify(data);
  }

  const response = await fetch(url, init);
  return handleResponse(response);
};

export const apiClient = {
  get: (path, options) => request('GET', path, options),
  post: (path, options) => request('POST', path, options),
  patch: (path, options) => request('PATCH', path, options),
  delete: (path, options) => request('DELETE', path, options),
};



