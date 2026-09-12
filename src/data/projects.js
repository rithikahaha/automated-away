export const projects = [
  {
    title: 'AI Data Analyst with Claude Code',
    blurb:
      'Ask a business question in plain English. A team of AI agents figures out whether it needs SQL, a stats test, or an ML model — then answers with real numbers, a chart, and honest caveats.',
    detail:
      'Built a routed multi-agent system (analyst-lead → sql-engineer / data-scientist / data-platform-engineer / ai-engineer / qa-reviewer / data-visualizer) on top of Claude Code. Caught and documented its own mistakes along the way, including a chart sort-order bug and a churn "finding" that didn\'t survive a significance test.',
    image: '/images/ai-data-analyst.png',
    tags: ['Claude Code', 'Python', 'SQL', 'Statistics', 'Streamlit'],
    github: 'https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code',
    demo: 'https://ai-data-analyst-claude-code.streamlit.app/',
    demoLabel: 'Live dashboard',
  },
  {
    title: 'Global Supply Chain Audit',
    blurb:
      'Audited 180K+ shipped orders and found a ~95% SLA breach rate hiding in the premium shipping tier — then proved a fix that recovers it (p < 0.001), without extra spend.',
    detail:
      'End-to-end pipeline: Pandas/SQLite for the core audit, a PySpark extension for scale, and cross-validation against Snowflake. Findings shipped as an interactive Tableau dashboard with a two-proportion z-test backing the recovery claim.',
    image: '/images/supply-chain.png',
    tags: ['Python', 'SQL', 'PySpark', 'Snowflake', 'Tableau'],
    github: 'https://github.com/rithikahaha/Supply-Chain-Audit',
    demo: 'https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit',
    demoLabel: 'Tableau Public',
  },
  {
    title: 'E-Commerce Customer Analytics',
    blurb:
      'Ran RFM segmentation and cohort retention on ~100K orders from a Brazilian e-commerce platform to find out who actually comes back — and whether happy customers are the ones doing it.',
    detail:
      'Segmented customers by recency/frequency/monetary value, built month-over-month cohort retention curves, and tested whether review scores correlate with repeat purchases — plus a regional breakdown of revenue and payment preferences across Brazil.',
    image: '/images/ecommerce.png',
    tags: ['Python', 'Pandas', 'RFM', 'Cohort Analysis', 'Power BI'],
    github: 'https://github.com/rithikahaha/E-commerce-analytics-with-cohort-analysis',
  },
]
