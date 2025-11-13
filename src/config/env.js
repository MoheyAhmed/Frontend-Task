const DEFAULT_MOCK_API_URL = 'http://localhost:4000';
const DEFAULT_API_SOURCE = 'mock';

const normalize = (value) => (value ? value.trim().toLowerCase() : '');

const API_SOURCE = normalize(import.meta.env.VITE_API_SOURCE) || DEFAULT_API_SOURCE;

const API_BASE_URL =
  API_SOURCE === 'mock'
    ? import.meta.env.VITE_MOCK_API_URL?.trim() || DEFAULT_MOCK_API_URL
    : import.meta.env.VITE_API_BASE_URL?.trim() || '';

if (!API_BASE_URL && API_SOURCE !== 'static') {
  console.warn(
    '[env] Missing VITE_API_BASE_URL. Falling back to static JSON files in public/data.'
  );
}

const STATIC_BASE_URL = '/data';

export const env = {
  API_SOURCE,
  API_BASE_URL,
  STATIC_BASE_URL,
};

export const isMockSource = API_SOURCE === 'mock';
export const isStaticSource = API_SOURCE === 'static' || !API_BASE_URL;

