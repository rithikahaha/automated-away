# I Gave a Team of AI Agents My Job for a Week. Here's Where I Caught Them Lying.

**The short version:** I built a team of AI agents that answers business questions in plain English instead of me writing SQL by hand. It works. But this post is really about the two times I caught it being confidently wrong, and why that's the actual reason a person still needs to be in the loop, even when AI writes almost all the code.

I do data analysis for a living. Someone asks "is engagement up or down" in Slack. I spend 40 minutes writing a database query, running a statistics test, building a chart, to answer something they typed in five seconds. I got tired of being that bottleneck.

So I built a small team of AI agents on Claude Code (Anthropic's coding tool) to close the gap. You type a question in plain English. One agent figures out whether it needs a database query, a statistics test, or a machine learning model, whichever the question actually needs, and answers back with real numbers, a chart, and honest caveats when the data doesn't fully support a clean story. It runs against a realistic sample of B2B SaaS data (think: a startup's accounts, users, and product usage logs), backed by 40 automated data checks and a full test suite.

## Why it's a team, not one AI doing everything

If you ask one AI to write a database query, run statistics, *and* build dashboards, it ends up mediocre at all three, the same way one person can't be equally great at every job on a team. So I split it into seven specialists instead: a lead (the only one you actually talk to), a database specialist, a statistics and machine-learning specialist, an infrastructure specialist, a chart-builder, a specialist that resolves ambiguous business terms, and a specialist whose entire job is checking everyone else's work before it reaches you.

It started as 11 agents, one per narrow task. I scrapped that. No real company staffs a data team that granularly, it's not how actual teams are organized, so I rebuilt it around seven roles that map to real job titles. I also cut a dedicated agent for "MLOps" (the ongoing work of monitoring and retraining machine learning models in production) entirely. Not because it didn't work, but because that's a stretch beyond what an actual data analyst role needs. Knowing what to leave out is as much the job as building what's in.

Every question moves through six steps: understand the real question first, confirm the right data actually exists, clean and validate it, do the actual analysis, add a chart if it helps, and close with the plain-English "so what." The middle two steps, confirming and cleaning, are the ones everyone skips when they're excited about the AI part. They're also the ones that prevent a wrong number from ever reaching you in the first place.

## Two real answers it gave me

**Question:** "Is product engagement growing or shrinking?"
**Answer:** Weekly active users grew from 234 to 411 over 26 weeks. Up 75.6%.

**Question:** "Are we healthy overall, and which accounts need attention?"
**Answer:** Net revenue retention (a measure of whether existing customers are spending more or less over time) is 108.5%, which is healthy. But customers on the cheapest plan tier churn at 28.8%, versus 6.7% for the top tier. A churn-prediction model then names the *specific* accounts most at risk, not just the overall trend.

That second answer is the actual point of building this. A dashboard can tell you there's a gap between plan tiers. It takes a model to tell you which accounts to actually call this week.

## Bug #1: the chart that lied without ever crashing

The dashboard has a funnel chart, meant to show people dropping off in order: signup, then onboarding, then activation. The first version rendered the bars alphabetically instead: activation, then funnel, then signup. It looked completely normal at a glance, real numbers, clean labels, and the story it told was scrambled and wrong.

The cause was almost silly in hindsight: the charting tool I was using automatically sorts its categories alphabetically, with no setting to turn that off. Nothing about the code was broken. It just quietly did the wrong thing by design.

```python
chart = (
    alt.Chart(chart_df)
    .mark_bar()
    .encode(x=alt.X("Stage", sort=chart_df["Stage"].tolist()), y="users")
)
```

That one line tells the chart tool "use this exact order I'm giving you, not your own default." I only found the bug because I opened the actual dashboard in a browser and looked at every chart before calling the feature finished, instead of reading the code and assuming the output matched what I intended. That gap, code that runs perfectly and still produces a wrong picture, is the failure mode that actually worries me about AI-written work. Not the crash. The confident wrong answer that looks completely fine.

## Bug #2: the finding that wasn't actually a finding

Separately, a comparison surfaced something that looked exciting: accounts using a certain product feature churned at 17.5%, versus 27.1% for accounts that didn't, a 35% relative difference. It reads like a strong pattern.

Instead of reporting that percentage gap as-is, I ran it through a proper significance test (a statistics check for whether a gap is a real pattern or could just be random noise):

```python
p_pool = (x1 + x2) / (n1 + n2)
se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
z = (p2 - p1) / se
p_value = 2 * (1 - stats.norm.cdf(abs(z)))
# result: p_value = 0.075
```

The result, a p-value of 0.075, means there's about a 7.5% chance this exact gap could show up purely by luck, just above the usual 5% bar for calling something statistically real. On top of that, the group with lower adoption was only 59 accounts, small enough that the test itself flagged the sample as too small to be confident either way.

So the honest answer was "promising, worth testing properly, not proven yet." Not "we found it." Reporting that 35% number as a confirmed insight would have sent someone chasing a pattern that might not even be real.

## What actually keeps this trustworthy

A few numbers, because "trust me" isn't good enough on its own: 40 automated data-quality checks across the underlying data models, a 24-test suite that runs on every single code change, and a churn model graded on a metric built for imbalanced data (most accounts don't churn, so plain accuracy would be misleadingly high) rather than one that flatters itself. Every database query also passes through one narrow checkpoint that flat-out refuses to run anything except a read-only lookup, so no AI agent can ever accidentally modify or delete real data.

## Why this still needed a person

AI wrote essentially all of the code here: the queries, the Python, the data models. What it didn't do is decide the team should be structured around real job titles instead of one agent per task, catch a chart that was quietly lying, or refuse to let a shaky number pass as a confirmed finding. That's still, very literally, the job. AI is fast at producing things that look right. Making sure they actually are was where I spent most of my time, and it's the part I'd point to first if someone asked what I actually contributed here.

**Live dashboard:** [ai-data-analyst-claude-code.streamlit.app](https://ai-data-analyst-claude-code.streamlit.app/)
**Code:** [github.com/rithikahaha/AI-Data-Analyst-Claude-Code](https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code)
