/**
 * applypilot.js — API layer for the ApplyPilot dashboard.
 *
 * Architecture rule: UI components ONLY call functions from this file.
 * They never call apiClient directly, and never compute eligibility,
 * match score, or priority — those values come from the backend.
 *
 * To connect real backend: set `useMock = false`.
 * No UI code needs to change.
 */

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const MOCK_APPLICATIONS = [
  {
    id: '1',
    company: { name: 'Google', initials: 'G', color: '#4285F4' },
    title: 'Staff Product Designer',
    workMode: 'Remote',
    location: 'Mountain View, CA',
    compensation: { base: '$220K', equity: '+$80K RSU' },
    matchScore: 98,
    status: 'Eligible',
    priority: 'HIGH',
    submittedAt: null,
    atsTarget: null,
    interviewDetail: null,
    interviewTime: null,
    inputReason: null,
    exclusionReason: null,
  },
  {
    id: '2',
    company: { name: 'Stripe', initials: 'S', color: '#635BFF' },
    title: 'Lead UX Engineer',
    workMode: 'Hybrid',
    location: 'San Francisco, CA',
    compensation: { base: '$195K', equity: '+$60K RSU' },
    matchScore: 94,
    status: 'Interview Scheduled',
    priority: 'HIGH',
    interviewDetail: 'Round 2 · Design Review',
    interviewTime: 'Oct 8, 2:00 PM',
    submittedAt: null,
    atsTarget: null,
    inputReason: null,
    exclusionReason: null,
  },
  {
    id: '3',
    company: { name: 'Figma', initials: 'F', color: '#F24E1E' },
    title: 'Design Systems Lead',
    workMode: 'Hybrid',
    location: 'New York, NY',
    compensation: { base: '$210K', equity: '+$70K RSU' },
    matchScore: 91,
    status: 'Submitted',
    priority: 'HIGH',
    atsTarget: 'Greenhouse',
    submittedAt: 'Oct 3',
    interviewDetail: null,
    interviewTime: null,
    inputReason: null,
    exclusionReason: null,
  },
  {
    id: '4',
    company: { name: 'Linear', initials: 'L', color: '#5E6AD2' },
    title: 'Senior Product Designer',
    workMode: 'Remote',
    location: 'Remote, US',
    compensation: { base: '$175K', equity: '+$40K RSU' },
    matchScore: 88,
    status: 'Needs Input',
    priority: 'NORMAL',
    inputReason: 'Custom cover letter required',
    submittedAt: null,
    atsTarget: null,
    interviewDetail: null,
    interviewTime: null,
    exclusionReason: null,
  },
  {
    id: '5',
    company: { name: 'Notion', initials: 'N', color: '#1C1C1E' },
    title: 'Principal Designer',
    workMode: 'Hybrid',
    location: 'San Francisco, CA',
    compensation: { base: '$200K', equity: '+$65K RSU' },
    matchScore: 85,
    status: 'Eligible',
    priority: 'NORMAL',
    submittedAt: null,
    atsTarget: null,
    interviewDetail: null,
    interviewTime: null,
    inputReason: null,
    exclusionReason: null,
  },
  {
    id: '6',
    company: { name: 'Vercel', initials: 'V', color: '#000000' },
    title: 'Staff Frontend Engineer',
    workMode: 'Remote',
    location: 'Remote, Global',
    compensation: { base: '$185K', equity: '+$55K RSU' },
    matchScore: 82,
    status: 'Eligible',
    priority: 'NORMAL',
    submittedAt: null,
    atsTarget: null,
    interviewDetail: null,
    interviewTime: null,
    inputReason: null,
    exclusionReason: null,
  },
  {
    id: '7',
    company: { name: 'Atlassian', initials: 'A', color: '#0052CC' },
    title: 'Senior UX Designer',
    workMode: 'Remote',
    location: 'Austin, TX',
    compensation: { base: '$160K', equity: '+$30K RSU' },
    matchScore: 79,
    status: 'Needs Input',
    priority: 'NORMAL',
    inputReason: 'Missing portfolio URL',
    submittedAt: null,
    atsTarget: null,
    interviewDetail: null,
    interviewTime: null,
    exclusionReason: null,
  },
  {
    id: '8',
    company: { name: 'Airbnb', initials: 'A', color: '#FF5A5F' },
    title: 'Lead Product Designer',
    workMode: 'On-site',
    location: 'San Francisco, CA',
    compensation: { base: '$230K', equity: '+$90K RSU' },
    matchScore: 61,
    status: 'Not Eligible',
    priority: 'LOW',
    exclusionReason: 'Mandatory 5-day on-site',
    submittedAt: null,
    atsTarget: null,
    interviewDetail: null,
    interviewTime: null,
    inputReason: null,
  },
];

const MOCK_DASHBOARD = {
  stats: {
    totalPipeline: { count: 48, weeklyDelta: '+6 this week', velocity: 79.2 },
    eligibleApproved: { count: 32, sent: 24, queued: 8 },
    actionRequired: { count: 9 },
    excluded: { count: 7 },
  },
  pilot: {
    active: true,
    profile: 'Senior Product Designer / Lead UX Engineer',
    dailyQuota: { used: 15, total: 20 },
  },
  tabCounts: {
    all: 48,
    eligible: 32,
    needsInput: 9,
    interviews: 4,
    highPriority: 6,
  },
  milestones: [
    {
      id: 'm1',
      date: 'Oct 8',
      company: 'Stripe',
      companyColor: '#635BFF',
      companyInitials: 'S',
      title: 'Round 2 · Design Review',
      host: 'Sarah Chen, Design Director',
      time: '2:00 PM PST',
    },
    {
      id: 'm2',
      date: 'Oct 10',
      company: 'Google',
      companyColor: '#4285F4',
      companyInitials: 'G',
      title: 'System Design Interview',
      host: 'Marcus Reid, Staff Engineer',
      time: '11:00 AM PST',
    },
    {
      id: 'm3',
      date: 'Oct 12',
      company: 'Figma',
      companyColor: '#F24E1E',
      companyInitials: 'F',
      title: 'Final Panel · Culture Fit',
      host: 'Design Leadership Team',
      time: '3:30 PM PST',
    },
  ],
  auditFeed: [
    { id: 'a1', time: '2m ago',  type: 'submitted', text: 'CV tailored & submitted to Notion via Greenhouse' },
    { id: 'a2', time: '14m ago', type: 'scraped',   text: '12 fresh targets scraped from LinkedIn & Wellfound' },
    { id: 'a3', time: '31m ago', type: 'flagged',   text: 'Missing portfolio URL flagged — Atlassian paused' },
    { id: 'a4', time: '1h ago',  type: 'submitted', text: 'CV tailored & submitted to Vercel via Lever' },
    { id: 'a5', time: '2h ago',  type: 'filtered',  text: 'Location filter applied — 3 NYC roles excluded' },
    { id: 'a6', time: '3h ago',  type: 'submitted', text: 'CV tailored & submitted to Linear via Ashby' },
  ],
  weeklyVelocity: { dispatched: 48, cap: 60 },
};

// ─── Feature flag ─────────────────────────────────────────────────────────────
// Flip to false when backend endpoints are ready. No UI code changes needed.
const useMock = true;

const mockDelay = (ms = 550) => new Promise((r) => setTimeout(r, ms));

// ─── API functions ────────────────────────────────────────────────────────────

/**
 * Fetch dashboard stats, pilot config, milestones, and audit feed.
 * Backend endpoint: GET /api/applypilot/dashboard
 */
export const getDashboard = async () => {
  if (useMock) {
    await mockDelay();
    return MOCK_DASHBOARD;
  }
  const { default: apiClient } = await import('./client');
  const { data } = await apiClient.get('/api/applypilot/dashboard');
  return data;
};

/**
 * Fetch all applications in the pipeline.
 * Backend endpoint: GET /api/applypilot/applications
 */
export const getApplications = async () => {
  if (useMock) {
    await mockDelay(400);
    return MOCK_APPLICATIONS;
  }
  const { default: apiClient } = await import('./client');
  const { data } = await apiClient.get('/api/applypilot/applications');
  return data;
};

/**
 * Toggle the autonomous pilot engine on/off.
 * Backend endpoint: POST /api/applypilot/pilot/toggle
 */
export const togglePilot = async (active) => {
  if (useMock) {
    await mockDelay(200);
    return { active };
  }
  const { default: apiClient } = await import('./client');
  const { data } = await apiClient.post('/api/applypilot/pilot/toggle', { active });
  return data;
};
