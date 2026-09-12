# I Gave a Team of AI Agents My Job for a Week. Here's Where I Caught Them Lying.

I do data analysis for a living, and I got tired of spending 40 minutes writing SQL and building charts to answer a question someone typed in five seconds. So I built a team of AI agents on Claude Code that answers business questions in plain English, with real numbers, a chart, and honest caveats. This post covers the architecture, two real answers it's given, and two real mistakes I caught it making.

## 📋 What it actually does

- Takes a plain-English business question and routes it to whichever specialist agent actually owns that kind of work
- Answers with a number, a chart, the SQL that produced it, and any caveats, never a bare stat
- Runs against a realistic sample B2B SaaS dataset: accounts, users, subscriptions, product usage events
- Backed by 40 automated data-quality checks and a 24-test suite that runs on every code change
- Refuses to fabricate a number it didn't actually get from a query

## 🏗️ Why 7 agents instead of 1 prompt

One AI trying to be equally good at SQL, statistics, and infrastructure ends up mediocre at all three. So the system is 7 specialists instead:

```
analyst-lead            # the only one you talk to, routes everything else
sql-engineer            # schema lookup, query writing
data-scientist          # significance tests, A/B tests, ML models
data-platform-engineer  # pipelines, data quality, cloud/infra questions
data-visualizer         # charts and the standing dashboard
ai-engineer             # resolves ambiguous terms, owns agent/skill quality
qa-reviewer             # sanity-checks everything before it reaches you
```

It was originally 11 agents, one per narrow skill. I rejected that, no real company staffs a team that granularly, and rebuilt it around these 7 roles instead. I also cut a dedicated MLOps agent entirely, not because it didn't work, but because model-registry and drift-detection tooling is scope creep past what a Data Analyst role actually needs.

## 🚀 How a question actually moves through it

`analyst-lead` routes every question through 6 phases:

1. **Ask**: understand the real business problem, ground ambiguous terms against a glossary instead of guessing
2. **Prepare**: confirm the right data exists and is trustworthy before touching it
3. **Process**: clean and validate, nulls, duplicate joins, row counts that don't add up
4. **Analyze**: route to whichever specialist owns the method
5. **Share**: a chart, only if it makes the answer clearer
6. **Act**: close with the plain-English "so what," not just a restated stat

Phases 2 and 3 are the ones people skip when they're excited about the AI part. They're also the ones that stop a wrong number from ever reaching you.

## 🎯 Two real questions and answers

**"Is product engagement growing or shrinking?"**
Weekly active users grew from 234 to 411 over 26 weeks. Up 75.6%.

**"Are we healthy overall, and which accounts need attention?"**
Net revenue retention is 108.5%, healthy. But Starter-plan accounts churn at 28.8% versus 6.7% for Enterprise. A churn model then names the specific at-risk accounts, not just the segment average.

## Bug #1: the chart that lied

The dashboard's funnel chart (signup → onboarding → activation) rendered alphabetically instead: activation, funnel, signup. It looked completely fine, real numbers, clean labels, wrong sequence.

```python
chart = (
    alt.Chart(chart_df)
    .mark_bar()
    .encode(x=alt.X("Stage", sort=chart_df["Stage"].tolist()), y="users")
)
```

**Explanation:**
- The charting library was auto-sorting categories alphabetically, with no setting to disable it
- `sort=chart_df["Stage"].tolist()` forces it to use the exact order I give it instead
- I only caught this by opening the actual dashboard and looking at every chart before calling it done, not by reading the code and assuming the output matched
- The code had zero errors. It just quietly told the wrong story, which is the failure mode that actually worries me about AI-written work

## Bug #2: the finding that wasn't one

A comparison showed integration-adopting accounts churning at 17.5% versus 27.1% for non-adopters, a 35% relative gap that reads like a real pattern.

```python
p_pool = (x1 + x2) / (n1 + n2)
se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
z = (p2 - p1) / se
p_value = 2 * (1 - stats.norm.cdf(abs(z)))
# p_value = 0.075
```

**Explanation:**
- This is a two-proportion z-test, checking whether the gap is statistically real or could be random noise
- `p_value = 0.075` means there's a 7.5% chance of seeing a gap this big by luck alone, just above the standard 5% cutoff
- The non-adopter group was only 59 accounts, small enough that the test flagged it as underpowered too
- Reported result: "promising, not proven," not "found it." Shipping the 35% number as confirmed would have sent someone chasing a pattern that might not be real

## ✨ Conclusion

AI wrote essentially all of the code here, the SQL, the Python, the data models. What it didn't do: decide the team should map to real job titles instead of 11 narrow skills, catch a chart quietly lying, or refuse to let a shaky p-value pass as confirmed. That's still the job. AI is fast at producing things that look right. Verifying they actually are is where I spent most of my time.

**Live dashboard:** [ai-data-analyst-claude-code.streamlit.app](https://ai-data-analyst-claude-code.streamlit.app/)
**Code:** [github.com/rithikahaha/AI-Data-Analyst-Claude-Code](https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code)
