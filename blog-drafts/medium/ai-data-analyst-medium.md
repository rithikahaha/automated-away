# I Gave a Team of AI Agents My Job for a Week. Here's Where I Caught Them Lying.

I do data analysis for a living, and I got tired of spending 40 minutes writing SQL (the language for asking questions of a database) and building charts to answer a question someone typed in five seconds. So I built a team of AI agents on Claude Code, Anthropic's AI coding tool, that answers business questions in plain English, with real numbers, a chart, and honest caveats. This is the full walkthrough, architecture, every agent, the actual code, real answers it's given, and two real mistakes I caught along the way. No coding background needed, every technical term gets a quick plain-English gloss the first time it shows up.

## What it actually does

- Takes a plain-English business question and routes it to whichever specialist agent owns that kind of work
- Answers with a number, a chart, the database query that produced it, and any caveats, never a bare stat
- Runs against a realistic sample B2B SaaS dataset: accounts, users, subscriptions, product usage events
- Backed by 40 automated data-quality checks and a 24-test suite on every code change
- Refuses to fabricate a number it didn't get from a query

## Why 7 agents instead of 1 prompt

One AI trying to be equally good at database queries, statistics, and infrastructure ends up mediocre at all three, the same way one person can't be the best at every job on a team. It was originally 11 agents, one per narrow skill. I rejected that, no real company staffs a team that granularly, and rebuilt it around 7 roles that map to actual job titles. I also cut a dedicated MLOps agent entirely (MLOps is the ongoing work of monitoring and retraining models in production), not because it didn't work, but because that's a stretch past what a Data Analyst role actually needs.

Each agent is a plain markdown file: a short description, a permissions list, and instructions written in English, not a line of traditional code.

**analyst-lead**, the only one you talk to. Its permissions list includes the ability to call the other 6 agents, which none of the specialists below can do.
- Reads the question, decides who handles it, and writes the final answer
- Routes every question through 6 phases: Ask, Prepare, Process, Analyze, Share, Act (detailed below)
- Hard rule in its own instructions: never fabricate a number you didn't get from a query

**sql-engineer**, descriptive questions.
- Confirms table and column names before writing anything, never guesses
- Every query must be read-only, if a question genuinely needs to change data, it stops and says so
- Cannot call other agents, a query-writer that could spawn other agents is scope creep waiting to happen

**data-scientist**, statistics, A/B tests, predictive modeling.
- Uses the shared statistics code instead of writing a one-off test inline
- Told explicitly: a "not significant" result on a small sample isn't proof of no effect, say so
- Reports effect size and confidence, not just a pass/fail on a p-value

**data-platform-engineer**, pipelines, data quality, cloud and infrastructure questions.
- Owns the rule "land raw data first, don't clean it on the way in," so a cleaning bug never destroys the only copy of the original data
- Can propose cloud infrastructure as code, never actually provision or change a real cloud account

**data-visualizer**, charts and the standing dashboard.
- Has a decision table mapping question shape to chart type: a trend gets a line chart, a comparison gets a bar chart, a sequential drop-off gets a funnel
- Rule: if fewer than about 3 data points would result, present the numbers directly instead of forcing a chart

**ai-engineer**, resolves ambiguous terms, owns agent and skill quality.
- Owns the rule for when a new agent is warranted (a genuinely different role) versus when it's just a new skill (same role, different playbook)
- Periodically re-runs a set of golden test questions to catch regressions in the whole system

**qa-reviewer**, the last check before anything reaches you.
- A per-answer checklist: row counts, null rates, duplicate joins, date range coverage, ambiguous definitions
- Also owns the automated test suite and the CI pipeline (checks that run automatically on every code change)

## The 6 phases every question moves through

`analyst-lead` routes every question through: Ask, Prepare, Process, Analyze, Share, Act.

- **Ask**: understand the real business problem, ground ambiguous terms against a glossary instead of guessing
- **Prepare**: confirm the right data exists and is trustworthy before touching it
- **Process**: clean and validate, nulls, duplicate joins, row counts that don't add up
- **Analyze**: route to whichever specialist owns the method
- **Share**: a chart, only if it makes the answer clearer
- **Act**: close with the plain-English "so what," not just a restated stat

Prepare and Process are the ones people skip when they're excited about the AI part. They're also the ones that stop a wrong number from ever reaching you.

## Reusable playbooks, not just agents

Agents are roles. "Skills" are recipes a role follows for a specific, repeatable kind of analysis, so the same question shape gets answered the same correct way every time:

- **schema-explorer**: always run first, list tables and columns before writing any query
- **growth-metrics-analysis**: WAU/MAU trend and revenue retention, keeps the two from being conflated
- **funnel-analysis**: sequential conversion, drop-off identification
- **cohort-retention**: group by signup month, track retention by month offset
- **anomaly-detection**: baseline plus threshold, then rule out obvious causes before calling something a real anomaly
- **executive-summary**: the output format every answer follows, headline, so-what, evidence, method, caveats

## The warehouse guardrail

Every agent that touches data goes through one checkpoint. It's physically not allowed to change anything, only look.

```python
_ALLOWED_STATEMENT = re.compile(r"^\s*(WITH|SELECT|EXPLAIN)\b", re.IGNORECASE)

def run_query(sql):
    if not _ALLOWED_STATEMENT.match(sql):
        raise ValueError("Only read-only queries are allowed.")
    return pd.read_sql(sql, connection)
```

- That first line is a regex, a pattern-matching rule for text, that only lets a question through if it starts with a word meaning "look something up," never "change" or "delete"
- Anything that tries to modify or remove data gets rejected in code before it ever reaches the actual database
- This is the entire defense against an AI agent with database access and a bad prompt, proven with an automated test that tries to break it on purpose

## Getting from raw data to a warehouse

```python
def transform(raw):
    organizations = raw["organizations"].drop_duplicates(subset=["id"])
    subscriptions = raw["subscriptions"].copy()
    subscriptions["mrr"] = subscriptions["current_seat_count"] * subscriptions["price_per_seat"]
    subscriptions.loc[subscriptions["status"] == "churned", "mrr"] = 0.0
    return {"organizations": organizations, "subscriptions": subscriptions}

def main():
    raw = extract()
    validate_raw(raw)
    tables = transform(raw)
    if not validate_transformed(tables):
        raise SystemExit("Transformed data failed validation.")
    load(tables)
    if not validate_loaded():
        raise SystemExit("Post-load validation failed.")
```

- Raw organization data has duplicate rows on purpose, simulating a messy source system, `drop_duplicates` cleans it
- Revenue isn't stored raw, it's computed: seats times price, zeroed out for churned accounts
- The pipeline validates three separate times, before transforming, after transforming, after loading, any failure halts the run instead of quietly loading bad data

## Data quality, two layers

**Layer 1, a Python check, runs while data is being loaded in:**

```python
def check_referential_integrity(child_df, child_key, parent_df, parent_key, name):
    orphans = set(child_df[child_key]) - set(parent_df[parent_key])
    return CheckResult(check=name, passed=not orphans)
```

**Layer 2, dbt (a tool that runs a checklist of automatic tests against a database), runs against the finished data:**

```yaml
- name: event_type
  tests:
    - accepted_values:
        values: ["signup", "completed_onboarding", "created_project",
                  "invited_teammate", "used_integration", "login"]
```

- 8 dbt models, 40 total checks, all passing, this one specifically confirms every event is one of the 6 expected types, catching a typo before it corrupts an analysis
- The Python check runs once during load and can halt the pipeline. dbt tests run against the final tables and are what an agent implicitly trusts on every query. Belt and suspenders

## Grounding ambiguous terms instead of guessing

```python
def retrieve(query, top_k=1, min_score=0.05):
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(corpus + [query])
    scores = cosine_similarity(matrix[-1], matrix[:-1])[0]
    return [chunk for chunk, score in ranked[:top_k] if score >= min_score]
```

- This is a lightweight text-search technique (TF-IDF, a way of matching a question to the most relevant paragraph in a glossary document) that needs no external AI service to run
- If nothing matches well enough, it returns nothing on purpose, the rule is "not covered" is a valid answer, never invent a definition
- Stops two different questions from silently using two different meanings of "active" and producing numbers that don't agree with each other

## The dashboard's numbers, straight from the queries

```python
def weekly_active_users():
    df = run_query("""SELECT strftime('%Y-%W', event_date) AS week,
        COUNT(DISTINCT user_id) AS wau FROM product_events
        WHERE event_type = 'login' GROUP BY 1 ORDER BY 1""")
    return df.iloc[:-1]  # drop the current partial week
```

```python
def net_revenue_retention():
    return run_query("""WITH reference_date AS (SELECT MAX(event_date) AS d FROM product_events)
        SELECT ROUND(100.0 * SUM(mrr) / SUM(initial_mrr), 1) AS nrr_pct
        FROM subscriptions, reference_date
        WHERE julianday(reference_date.d) - julianday(start_date) >= 90""")
```

```python
def account_risk_list(top_n=20):
    model = joblib.load(MODEL_PATH)
    df = run_query(FEATURE_QUERY)
    df["churn_risk"] = model.predict_proba(df[FEATURE_COLUMNS])[:, 1]
    return df.sort_values("churn_risk", ascending=False).head(top_n)
```

- Dropping the current partial week matters, without it every weekly-active-user chart ends in a fake decline just because the week isn't over yet
- Net revenue retention only counts accounts at least 90 days old, so brand-new accounts (that haven't had time to expand or churn) don't water down the number
- The risk list is where the model actually gets used live, scoring every active account and ranking them, so "who should I call" is a list of names, not a percentage

## How it knows something is statistically real

Two different tools, for two different questions.

```python
stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=False)
```

- A significance test for comparing the averages of two groups, "are these two numbers actually different, or could that gap be random noise"

```python
p_pool = (x1 + x2) / (n1 + n2)
se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
z = (p2 - p1) / se
p_value = 2 * (1 - stats.norm.cdf(abs(z)))
```

- A different test for comparing two percentages instead of two averages, "is this rate actually higher, or could that gap be luck"
- Also computes whether the sample was even large enough to detect a real effect, separate from whether the result looked significant
- This exact calculation is what caught the churn "finding" below

## The churn model

```python
CATEGORICAL_FEATURES = ["plan_tier", "industry", "region"]
NUMERIC_FEATURES = ["current_seat_count", "distinct_feature_types_used",
                     "total_events_90d", "days_since_last_login"]

pipeline = build_pipeline()  # a model built from 200 small decision trees, voting together
pipeline.fit(X_train, y_train)
auc = roc_auc_score(y_test, pipeline.predict_proba(X_test)[:, 1])
# auc = 0.6675
```

- Same feature list trains the model and scores live accounts, one shared definition instead of two that could quietly drift apart
- Graded on AUC (a score from 0.5 to 1 measuring how well the model ranks risky accounts above safe ones, 0.5 is a coin flip, 1 is perfect), not plain accuracy, because most accounts don't churn, and accuracy would happily reward a model that just guesses "safe" every time
- 0.6675 is good enough to prioritize which accounts to check on first, not good enough to be treated as certain, and nothing in the output claims otherwise

## Three real questions and answers

**"Is product engagement growing or shrinking?"**
Weekly active users grew from 234 to 411 over 26 weeks. Up 75.6%. The most recent week was excluded to avoid a false drop-off.

**"Where are we losing users before they actually try the product?"**
Of 3,206 signups, only 1,421 (44%) ever activated. The biggest single leak is between onboarding and activation, not during onboarding itself, a specific, actionable finding instead of a vague "our funnel leaks somewhere."

**"Are we healthy overall, and which accounts need attention?"**
Net revenue retention is 108.5%, healthy. Starter-plan accounts churn at 28.8% versus 6.7% for Enterprise. The churn model then names the specific at-risk accounts, not just the segment average, and separately, a comparison that looked like a 35% churn improvement from a certain integration came back not statistically significant (more on that below), reported honestly as "promising, not proven."

## How the agents get checked for regressions

A fixed set of 7 "golden" business questions, each with an expected answer shape, that `ai-engineer` periodically re-runs by hand and compares against.

- Example: "How many active users do we have?" is expected to trigger the glossary lookup rather than guess a definition, and state which definition and time window were used
- Example: "Why did weekly active users drop 90% this week?" is expected to be caught as the partial current week, not presented as a real drop
- This isn't an automated pass/fail suite, it's a checklist for catching the system quietly regressing as it grows

## Bug #1: the chart that lied

The funnel chart (signup, onboarding, activation) rendered alphabetically instead: activation, funnel, signup.

```python
chart = alt.Chart(chart_df).mark_bar().encode(
    x=alt.X("Stage", sort=chart_df["Stage"].tolist()), y="users"
)
```

- The charting library auto-sorts categories alphabetically with no setting to disable it
- `sort=...tolist()` forces it to use the exact order I give it instead
- I caught this by opening the actual dashboard and looking at every chart, not by reading the code and assuming the output matched. Zero errors, completely wrong story

## Bug #2: the finding that wasn't one

Integration-adopting accounts churned at 17.5% versus 27.1% for non-adopters, a 35% relative gap. Run through the z-test above, `p_value = 0.075`.

- A p-value is the odds a gap this size could just be luck. 0.075 means a 7.5% chance, just above the usual 5% bar for calling something real, and the non-adopter group was only 59 accounts, small enough that the test flagged the sample as too small to be sure either way
- Reported as "promising, not proven," not "found it." The exciting number would have sent someone chasing a pattern that might not be real

## Automated tests, CI, and a deployment plan that stayed a plan

```yaml
- name: Build the sample warehouse via the real pipeline
  run: |
    python -m scripts.export_raw_sources
    python -m pipelines.etl
- run: pytest -v
```

- 24 automated tests, run automatically every time the code changes (this practice is called CI, continuous integration)
- It rebuilds the entire sample database through the real pipeline before testing against it, so a broken pipeline gets caught, not just a broken individual query
- Deployment plans exist for AWS, GCP, and Azure (Terraform, a way of writing infrastructure as code), explicitly illustrative and never applied to a real cloud account
- Every agent talks to the warehouse through one connection string, so pointing this at a real Postgres or Snowflake warehouse instead of the local sample is a config change, not a rewrite

## Is any of this data real?

No, and I say that upfront. Every organization, user, and event in this dataset is synthetically generated with fixed random seeds, for reproducibility. The 75.6% WAU growth, the 108.5% net revenue retention, none of these are a real company's numbers. What this demonstrates isn't "I found a real insight," it's "I can build the system that would find one," the agents, the pipeline, the tests, the model, all real and running end to end, which is the more relevant claim for the roles I'm applying to.

## What was mine, not the AI's

| AI did | I decided |
|---|---|
| Wrote the SQL, Python, and dbt models | Which business questions were worth answering |
| Drafted the agent instructions | Which agent roster maps to a real team, rejected the first draft |
| Ran the stats test | Whether "not significant" gets reported honestly instead of buried |
| Built the dashboard | Whether the chart order was actually correct, it wasn't, first try |
| Suggested the churn model features | Whether MLOps belonged in scope at all, it didn't |

## Conclusion

AI wrote essentially all of the code here. It didn't decide the team should map to real job titles, catch a chart quietly lying, or refuse to let a shaky p-value pass as confirmed. That's still the job. AI is fast at producing things that look right. Verifying they actually are is where the time went.

**Live dashboard:** [ai-data-analyst-claude-code.streamlit.app](https://ai-data-analyst-claude-code.streamlit.app/)
**Code:** [github.com/rithikahaha/AI-Data-Analyst-Claude-Code](https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code)
