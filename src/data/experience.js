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

const base = import.meta.env.BASE_URL

export const experience = [
  {
    company: 'Extern',
    client: 'Wayfair',
    logo: `${base}logos/wayfair.svg`,
    role: 'AI Agent Engineering & BI Extern',
    period: 'Apr 2026 - Sep 2026',
    tagline:
      "Externed with Wayfair's Rugs category, wiring in AI workflows so trend and competitor tracking stop living in five different tabs.",
    bullets: [
      'Automated 3 AI-powered workflows with Google Gemini, cutting manual report verification steps from five to two per report.',
      "Unified trend, competitor, and insight tracking into one live dashboard, translating Wayfair's Rugs-category requirements into a single automated source of truth.",
    ],
    tags: ['Google Gemini', 'Automation', 'Dashboards'],
  },
  {
    company: 'Extern',
    client: 'Amazon',
    logo: `${base}logos/amazon.svg`,
    role: 'Operational Strategy & People Analytics Extern',
    period: 'Jan 2026 - Apr 2026',
    tagline:
      'Externed with Amazon, digging through a thousand-plus feedback records to find where employee experience was actually breaking, not where everyone assumed it was.',
    bullets: [
      'Analyzed 1,000+ feedback records for sentiment trends across 14 workforce metrics (Python, Pandas, NLTK, VADER), uncovering where employee experience was breaking down across 3 operational teams.',
      'Automated data cleaning and validation workflows via Python scripting, cutting manual data-quality checks from 3 hours to under 45 minutes per cycle.',
      'Delivered 3 executive-ready reports translating raw findings into actionable recommendations, shaping near-term stakeholder priorities and workforce planning.',
    ],
    tags: ['Python', 'NLTK', 'Sentiment Analysis'],
  },
  {
    company: 'Infosys Limited',
    logo: `${base}logos/infosys.svg`,
    role: 'System Engineer Trainee',
    period: 'Sep 2025 - Jan 2026',
    tagline:
      'Cut my teeth on SQL and database design, then spent evenings making the trainee cohort feel less alone.',
    bullets: [
      'Executed 100+ SQL queries (joins, subqueries, aggregations) and practiced relational database design (normalization, indexing, schema design).',
      'Piloted a daily 1-hour peer storytelling session for 10-15 trainees — turned out onboarding stress needed a place to go, not just a manual.',
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
