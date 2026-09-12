# I Gave a Team of AI Agents My Job for a Week. Here's Where I Caught Them Lying.

I do data analysis for a living. Someone asks "is engagement up or down" in Slack. I spend 40 minutes writing SQL, running a test, building a chart, to answer something they typed in five seconds. I got tired of being the bottleneck, so I built a team of AI agents on Claude Code to close that gap: a plain-English question in, a real answer with SQL, a chart, and honest caveats out.

## Why seven agents, not one prompt

One big prompt trying to be equally good at SQL, statistics, and infrastructure ends up mediocre at all three. So the system is split into seven specialists: `analyst-lead` (the only one you talk to), `sql-engineer`, `data-scientist`, `data-platform-engineer`, `data-visualizer`, `ai-engineer`, and `qa-reviewer`.

It was originally 11 agents, one per skill. I rejected that, no real company staffs a data team that granularly, and rebuilt it around seven roles that map to actual job titles. I also cut a dedicated MLOps agent entirely. Not because its code didn't work, because model-registry and drift-detection tooling is scope creep past what a Data Analyst role actually needs.

`analyst-lead` routes every question through six phases: Ask, Prepare, Process, Analyze, Share, Act. Ask means grounding ambiguous terms against a glossary instead of guessing. Prepare and Process are the unglamorous parts everyone skips when they're excited about the AI, confirming the data is trustworthy and clean before a single number gets trusted. That ordering is deliberate, and it's written directly into the agent's own instructions.

## Two real answers it gave

**"Is product engagement growing or shrinking?"**
Weekly active users grew from 234 to 411 over 26 weeks. Up 75.6%.

**"Are we healthy overall, and which accounts need attention?"**
Net revenue retention is 108.5%. But Starter-plan accounts churn at 28.8% versus 6.7% for Enterprise. A churn model then names the specific at-risk accounts, not just the segment average.

## Where I caught it being wrong

The dashboard's onboarding funnel (signup, onboarding, activation) rendered as activation, funnel, signup on the first pass. Alphabetical order. It looked fine, real numbers, plausible labels, and it was completely wrong. Root cause: Streamlit's `st.bar_chart` always sorts categories alphabetically. Fix was two-part, pin the row order in the query, then switch to Altair for an explicit sort:

```python
chart = (
    alt.Chart(chart_df)
    .mark_bar()
    .encode(x=alt.X("Stage", sort=chart_df["Stage"].tolist()), y="users")
)
```

I only caught it by opening the actual dashboard and looking. The code ran clean. It just told the wrong story.

Separately, a comparison showed integration-adopting accounts churning at 17.5% versus 27.1% for non-adopters, a 35% relative gap that reads like a finding. I ran it through a two-proportion z-test instead of trusting the eyeball comparison:

```python
p_pool = (x1 + x2) / (n1 + n2)
se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
z = (p2 - p1) / se
p_value = 2 * (1 - stats.norm.cdf(abs(z)))
# p_value = 0.075
```

Not significant at the standard threshold, and the non-adopter group was only 59 accounts, small enough to flag as underpowered too. The honest answer was "promising, not proven," not "found it."

## The safety net

40 dbt checks across 8 models, a 24-test pytest suite, CI on every push that rebuilds the warehouse from scratch before testing against it. The churn model runs a Gradient Boosting classifier evaluated on AUC (0.6675) instead of accuracy, because churn is imbalanced and accuracy would happily lie to you. Every query goes through one connector with a hard read-only guard, a regex that rejects anything that isn't `SELECT`, `WITH`, or `EXPLAIN` before it ever reaches the database.

AI wrote essentially all of the code here, the SQL, the Python, the dbt models. What it didn't do: decide the agent roster should map to real job titles instead of individual skills, catch a chart quietly lying, or refuse to let a borderline p-value pass as a confirmed finding. That's still the actual job.

**Live dashboard:** [ai-data-analyst-claude-code.streamlit.app](https://ai-data-analyst-claude-code.streamlit.app/)
**Code:** [github.com/rithikahaha/AI-Data-Analyst-Claude-Code](https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code)
