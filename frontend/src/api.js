import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '';
const API = BASE || '';

export async function analyzeImage(file, questionnaire = {}) {
  const form = new FormData();
  form.append('file', file);
  form.append('questionnaire', JSON.stringify(questionnaire));
  const { data } = await axios.post(`${BASE}/api/full`, form);
  return data;
}

export async function fetchGlowRoutine({ skinType, budget, condition, causes, sensitivity = 'low', climate = 'hot', experience = 'beginner', goals = [] }) {
  const { data } = await axios.post(`${BASE}/api/glow-routine`, {
    skin_type: skinType,
    budget,
    condition,
    causes,
    sensitivity,
    climate,
    experience,
    goals,
  });
  return data;
}

export async function submitSignup({ name, email, skin }) {
  const { data } = await axios.post(`${BASE}/api/signup`, { name, email, skin });
  return data;
}

export async function registerUser({ name, email, password, skin }) {
  const { data } = await axios.post(`${BASE}/api/auth/register`, { name, email, password, skin });
  return data;
}

export async function loginUser({ email, password }) {
  const { data } = await axios.post(`${BASE}/api/auth/login`, { email, password });
  return data;
}

export async function getMe(token) {
  const { data } = await axios.get(`${BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
