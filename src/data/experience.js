export const experience = [
  {
    company: 'Extern',
    client: 'Wayfair',
    initial: 'E',
    color: '#4C1D95',
    role: 'AI Agent Engineering & BI Extern',
    period: '2026 - Now',
    tagline:
      "Externed with Wayfair's Rugs category, wiring in AI workflows so trend and competitor tracking stop living in five different tabs.",
    bullets: [
      'Automated 3 Gemini-powered workflows, cutting manual report verification from five steps to two.',
      'Rolled trend, competitor, and insight tracking into one live dashboard — a single source of truth instead of scattered spreadsheets.',
    ],
    tags: ['Google Gemini', 'Automation', 'Dashboards'],
  },
  {
    company: 'Extern',
    client: 'Amazon',
    initial: 'E',
    color: '#4C1D95',
    role: 'Operational Strategy & People Analytics Extern',
    period: '2026',
    tagline:
      'Externed with Amazon, digging through a thousand-plus feedback records to find where employee experience was actually breaking, not where everyone assumed it was.',
    bullets: [
      'Ran sentiment analysis across 14 workforce metrics (Python, Pandas, NLTK, VADER) across 3 operational teams.',
      'Automated the data-cleaning pipeline, cutting quality checks from 3 hours to under 45 minutes.',
      'Turned raw findings into 3 executive-ready reports that shaped near-term workforce planning.',
    ],
    tags: ['Python', 'NLTK', 'Sentiment Analysis'],
  },
  {
    company: 'Infosys',
    initial: 'I',
    color: '#007CC3',
    role: 'System Engineer Trainee',
    period: '2025 - 2026',
    tagline:
      'Cut my teeth on SQL and database design, then spent evenings making the trainee cohort feel less alone.',
    bullets: [
      'Wrote 100+ SQL queries (joins, subqueries, aggregations) and practiced schema design, normalization, and indexing.',
      'Started a daily peer storytelling session for 10-15 trainees — turned out onboarding stress needed a place to go, not just a manual.',
    ],
    tags: ['SQL', 'Database Design'],
  },
]

export const education = {
  school: 'Marian Engineering College',
  degree: 'B.Tech, Computer Science Engineering',
  location: 'Thiruvananthapuram, Kerala',
  period: '2021 – 2025',
}

export const certifications = [
  { name: 'Google Data Analytics Professional Certificate', status: 'In Progress' },
  { name: 'Deloitte Data Analytics Job Simulation', status: 'Completed' },
]

import {
  FiBarChart2,
  FiCloud,
  FiCpu,
  FiCrosshair,
  FiDatabase,
  FiGitBranch,
  FiGrid,
  FiHash,
  FiLayers,
  FiMonitor,
  FiPieChart,
  FiSearch,
  FiTarget,
  FiTrendingUp,
} from 'react-icons/fi'
import { SiGithubactions, SiN8N, SiPython, SiScikitlearn, SiSnowflake, SiStreamlit, SiTerraform } from 'react-icons/si'

export const skillGroups = [
  {
    label: 'Languages',
    items: [
      { name: 'SQL', icon: FiDatabase },
      { name: 'Python (Pandas, NumPy)', icon: SiPython },
    ],
  },
  {
    label: 'Data Analytics & ML',
    items: [
      { name: 'Exploratory Data Analysis', icon: FiSearch },
      { name: 'Statistical Analysis', icon: FiBarChart2 },
      { name: 'Scikit-learn', icon: SiScikitlearn },
      { name: 'Random Forest', icon: FiGitBranch },
      { name: 'K-Means', icon: FiTarget },
      { name: 'Root Cause Analysis', icon: FiCrosshair },
    ],
  },
  {
    label: 'Visualization',
    items: [
      { name: 'Tableau', icon: FiPieChart },
      { name: 'Power BI', icon: FiTrendingUp },
      { name: 'DAX', icon: FiHash },
      { name: 'Streamlit', icon: SiStreamlit },
      { name: 'Excel', icon: FiGrid },
      { name: 'PowerPoint', icon: FiMonitor },
    ],
  },
  {
    label: 'Data Engineering, Cloud & Warehousing',
    items: [
      { name: 'Snowflake', icon: SiSnowflake },
      { name: 'AWS (S3, Glue, Athena)', icon: FiCloud },
      { name: 'dbt', icon: FiLayers },
      { name: 'Terraform', icon: SiTerraform },
    ],
  },
  {
    label: 'AI & Automation',
    items: [
      { name: 'Claude Code (Agentic Workflows)', icon: FiCpu },
      { name: 'n8n', icon: SiN8N },
      { name: 'Git/GitHub Actions (CI/CD)', icon: SiGithubactions },
    ],
  },
]
