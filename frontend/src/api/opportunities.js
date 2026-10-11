import apiClient from './client';

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// Used while the backend endpoints are not yet available.
// When the backend is ready, delete the MOCK_* constants and
// remove the `useMock` checks — the rest of the code stays the same.
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_OPPORTUNITIES = [
  {
    id: '1',
    title: 'Frontend Developer Intern',
    company: 'TechCorp Solutions',
    matchScore: 66.7,
    eligibility: 'Eligible',
    priority: 'HIGH',
    deadline: new Date(Date.now() + 4.5 * 60 * 60 * 1000).toISOString(), // 4h 30m from now
    skills: [
      { name: 'JavaScript', met: true },
      { name: 'React', met: true },
      { name: 'TypeScript', met: false },
      { name: 'Docker', met: false },
    ],
  },
  {
    id: '2',
    title: 'Backend Engineer Intern',
    company: 'Startup Labs',
    matchScore: 82.0,
    eligibility: 'Eligible',
    priority: 'HIGH',
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
    skills: [
      { name: 'Python', met: true },
      { name: 'FastAPI', met: true },
      { name: 'PostgreSQL', met: true },
      { name: 'Redis', met: false },
    ],
  },
  {
    id: '3',
    title: 'Data Analyst Intern',
    company: 'Analytics Co.',
    matchScore: 55.0,
    eligibility: 'Unclear',
    priority: 'NORMAL',
    deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
    skills: [
      { name: 'SQL', met: true },
      { name: 'Python', met: true },
      { name: 'Tableau', met: false },
      { name: 'R', met: false },
    ],
  },
  {
    id: '4',
    title: 'UI/UX Design Intern',
    company: 'Creative Studio',
    matchScore: 38.0,
    eligibility: 'Not Eligible',
    priority: 'LOW',
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    skills: [
      { name: 'Figma', met: false },
      { name: 'Sketch', met: false },
      { name: 'Prototyping', met: false },
    ],
  },
  {
    id: '5',
    title: 'DevOps Engineer Intern',
    company: 'CloudBase Inc.',
    matchScore: 71.5,
    eligibility: 'Eligible',
    priority: 'NORMAL',
    deadline: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
    skills: [
      { name: 'Docker', met: true },
      { name: 'Kubernetes', met: false },
      { name: 'CI/CD', met: true },
      { name: 'AWS', met: false },
    ],
  },
  {
    id: '6',
    title: 'Machine Learning Intern',
    company: 'AI Ventures',
    matchScore: 60.0,
    eligibility: 'Unclear',
    priority: 'HIGH',
    deadline: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    skills: [
      { name: 'Python', met: true },
      { name: 'TensorFlow', met: false },
      { name: 'NumPy', met: true },
      { name: 'PyTorch', met: false },
    ],
  },
];

const MOCK_DASHBOARD = {
  stats: {
    found: 42,
    evaluated: 17,
    eligible: 9,
    unclear: 5,
    notEligible: 3,
    highPriority: 3,
  },
  funnel: {
    found: 42,
    evaluated: 17,
    eligible: 9,
  },
  highPriority: MOCK_OPPORTUNITIES.filter((o) => o.priority === 'HIGH'),
};

// Set to false when backend endpoints are ready
const useMock = true;

// Simulate a realistic network delay so loading states are visible during dev
const mockDelay = (ms = 600) => new Promise((resolve) => setTimeout(resolve, ms));

// ─────────────────────────────────────────────────────────────────────────────
// API FUNCTIONS
// These are the only functions your UI components should ever call.
// Never call apiClient directly from a page or component.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all opportunities.
 * Backend endpoint: GET /api/opportunities
 */
export const getOpportunities = async () => {
  if (useMock) {
    await mockDelay();
    return MOCK_OPPORTUNITIES;
  }
  const { data } = await apiClient.get('/api/opportunities');
  return data;
};

/**
 * Fetch dashboard statistics, funnel data, and high-priority opportunities.
 * Backend endpoint: GET /api/dashboard
 */
export const getDashboardData = async () => {
  if (useMock) {
    await mockDelay();
    return MOCK_DASHBOARD;
  }
  const { data } = await apiClient.get('/api/dashboard');
  return data;
};

/**
 * Fetch a single opportunity by ID.
 * Backend endpoint: GET /api/opportunities/:id
 */
export const getOpportunityById = async (id) => {
  if (useMock) {
    await mockDelay(300);
    return MOCK_OPPORTUNITIES.find((o) => o.id === id) || null;
  }
  const { data } = await apiClient.get(`/api/opportunities/${id}`);
  return data;
};
