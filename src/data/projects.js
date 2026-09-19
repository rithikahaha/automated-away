import AgentFlow from '../components/diagrams/AgentFlow'
import SupplyChainFlow from '../components/diagrams/SupplyChainFlow'
import RevenueFlow from '../components/diagrams/RevenueFlow'

const base = import.meta.env.BASE_URL

export const projects = [
  {
    title: 'AI Data Analyst with Claude Code',
    blurb:
      'Ask a business question in plain English. A team of AI agents figures out whether it needs SQL, a stats test, or an ML model, then answers with real numbers, a chart, and honest caveats.',
    detail:
      'Engineered a system of 7 specialized agents on Claude Code, backed by 40 automated dbt data checks and a 48-test suite plus a container build and health check that run on every update via GitHub Actions. Built a churn model (AUC 0.6675) on 50K+ usage events, and stress-tested a "35% churn difference" that turned out not to be statistically proven (p=0.075), catching a false pattern before it drove a retention decision. Live dashboard tracks 108.5% revenue growth from existing customers; a reliability layer measures availability and p95 latency against stated SLOs, with runbooks and a written postmortem. The Kubernetes and Terraform files are illustrative and have never been applied.',
    image: `${base}images/ai-data-analyst.png`,
    tags: ['Claude Code', 'Python', 'SQL', 'dbt', 'Streamlit', 'Docker', 'GitHub Actions'],
    github: 'https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code',
    demo: 'https://ai-data-analyst-claude-code.streamlit.app/',
    demoLabel: 'Live dashboard',
    recommendation:
      'In this sample company, customers on the cheapest plan cancel more than four times as often as those on the top plan (28.8% versus 6.7%). So the customer-success team should reach out first to the accounts the model rates most likely to cancel. One promising pattern, that customers who connect other tools stay longer, is not proven yet, so test it on a small group before changing anything.',
    diagram: AgentFlow,
    blog: 'https://medium.com/@rrithikaaa.h/i-gave-a-team-of-ai-agents-my-job-for-a-week-heres-where-i-caught-them-lying-7fe834a5f497',
  },
  {
    title: 'Global Supply Chain Audit',
    blurb:
      'Quantified a systemic 2-day fulfillment delay across 180K+ orders and pinpointed a 95% missed-deadline rate hiding in the premium shipping tier.',
    detail:
      'Built an A/B testing framework across all 4 shipping modes: confirmed a real, statistically-backed improvement in 3 tiers (p < 0.001) while correctly ruling out a change for Standard Class (p = 0.951, already well-calibrated). Found a uniform 54% failure rate across every customer spend tier, ruling out high-value customers as the cause. Shipped as an interactive Tableau dashboard with a live regional missed-deadline map, validated across Pandas/SQLite, PySpark, and Snowflake.',
    image: `${base}images/supply-chain.png`,
    tags: ['SQL', 'Python', 'PySpark', 'Snowflake', 'Tableau'],
    github: 'https://github.com/rithikahaha/Supply-Chain-Audit',
    demo: 'https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit',
    demoLabel: 'Tableau Public',
    embedUrl: 'https://public.tableau.com/views/SupplyChainSLAAudit/SupplyChainSLAAudit',
    embedType: 'tableau',
    recommendation:
      'Shipping promised delivery in 1 day (First Class) or 2 days (Second Class), but orders actually took about 2 and 4 days, so every First Class order arrived late. The fix is to promise 2 and 4 days instead: in a simulation that removed every First Class miss and halved the Second Class misses, and Standard shipping needs no change because it was already accurate. Late orders hit big and small spenders equally, so this is a shipping-operations problem, and a real pilot should confirm it first.',
    diagram: SupplyChainFlow,
    blog: 'https://medium.com/@rrithikaaa.h/i-audited-180-519-orders-and-found-a-promise-that-was-broken-100-of-the-time-6632b2cdd82b',
  },
  {
    title: 'Scalable E-Commerce Analytics Pipeline',
    blurb:
      'An end-to-end pipeline over 99,440 orders (R$16.08M revenue) on AWS, run through 7 statistical analyses and 3 ML models to find out where the money and the customers actually go.',
    detail:
      'Uncovered a R$6.03M revenue concentration in São Paulo (37.5% of total) across 8 linked tables. Trained a Random Forest predicting delivery delays (ROC-AUC 0.737) and another predicting review scores (R² = 0.216), and segmented customers via K-Means on RFM (silhouette 0.497) alongside a simpler quintile-based RFM score. The two methods disagree on how much a "Champion" customer is worth (2.1x vs 7x the average), and both are reported honestly instead of picking the flashier number. The sharpest finding: only 3.12% of customers ever place a second order, reframing retention strategy from slowing decay to converting first-time buyers. Shipped as a live interactive Plotly dashboard and a 5-page Power BI report, with CI validating the pipeline on every push.',
    image: `${base}images/ecommerce.png`,
    tags: ['AWS', 'SQL', 'Python', 'Scikit-learn', 'Plotly', 'Power BI'],
    github: 'https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline',
    demo: 'https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/',
    demoLabel: 'Live dashboard',
    embedUrl: 'https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/',
    embedType: 'iframe',
    recommendation:
      'Only 3.12% of customers ever order a second time, so this is not a story of shoppers slowly drifting away: almost nobody comes back at all. Focus on getting first-time buyers to buy again, and fix late deliveries first, because a late order is the strongest sign of a bad review.',
    diagram: RevenueFlow,
    blog: 'https://medium.com/@rrithikaaa.h/only-3-12-of-customers-ever-buy-again-what-a-cohort-analysis-actually-found-712558de8e48',
  },
]
