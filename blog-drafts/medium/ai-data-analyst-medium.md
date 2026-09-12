# I Gave a Team of AI Agents My Job for a Week. Here's Where I Caught Them Lying.

I do data analysis for a living, and I got tired of spending 40 minutes writing SQL and building charts to answer a question someone typed in five seconds. So I built a team of AI agents on Claude Code that answers business questions in plain English, with real numbers, a chart, and honest caveats. This is the full walkthrough: the architecture, the actual code behind it, and two real mistakes I caught along the way.

## What it actually does

- Takes a plain-English business question and routes it to whichever specialist agent owns that kind of work
- Answers with a number, a chart, the SQL that produced it, and any caveats, never a bare stat
- Runs against a realistic sample B2B SaaS dataset: accounts, users, subscriptions, product usage events
- Backed by 40 automated data-quality checks and a 24-test suite on every code change
- Refuses to fabricate a number it didn't get from a query

## Why 7 agents instead of 1 prompt

One AI trying to be equally good at SQL, statistics, and infrastructure ends up mediocre at all three.

- `analyst-lead`, the only one you talk to, routes everything else
- `sql-engineer`, schema lookup and query writing, cannot call other agents
- `data-scientist`, significance tests, A/B tests, predictive modeling
- `data-platform-engineer`, pipelines, data quality, cloud and infra questions
- `data-visualizer`, ad-hoc charts and the standing dashboard
- `ai-engineer`, resolves ambiguous terms, owns agent and skill quality
- `qa-reviewer`, sanity-checks every result, owns the test suite and CI

It was originally 11 agents, one per narrow skill. I rejected that, no real company staffs a team that granularly, and rebuilt it around these 7 roles. I also cut a dedicated MLOps agent entirely, not because it didn't work, but because model-registry and drift-detection tooling is scope creep past what a Data Analyst role needs.

## How a question actually moves through it

`analyst-lead` routes every question through 6 phases: Ask, Prepare, Process, Analyze, Share, Act.

- **Ask**: understand the real business problem, ground ambiguous terms against a glossary instead of guessing
- **Prepare**: confirm the right data exists and is trustworthy before touching it
- **Process**: clean and validate, nulls, duplicate joins, row counts that don't add up
- **Analyze**: route to whichever specialist owns the method
- **Share**: a chart, only if it makes the answer clearer
- **Act**: close with the plain-English "so what," not just a restated stat

Prepare and Process are the ones people skip when they're excited about the AI part. They're also the ones that stop a wrong number from ever reaching you.

## The warehouse guardrail

Every agent that touches data goes through one file. It cannot write.

```python
_ALLOWED_STATEMENT = re.compile(r"^\s*(WITH|SELECT|EXPLAIN)\b", re.IGNORECASE)

def run_query(sql):
    if not _ALLOWED_STATEMENT.match(sql):
        raise ValueError("Only read-only queries are allowed.")
    return pd.read_sql(sql, connection)
```

- The regex only matches text starting with `WITH`, `SELECT`, or `EXPLAIN`
- Anything else, `DELETE`, `DROP`, `UPDATE`, gets rejected in Python before it ever reaches the database
- This is the entire defense against an AI agent with database access and a bad prompt, and it's tested explicitly (`test_read_only_guard_blocks_writes`)

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

**Layer 1, Python, runs during load:**

```python
def check_referential_integrity(child_df, child_key, parent_df, parent_key, name):
    orphans = set(child_df[child_key]) - set(parent_df[parent_key])
    return CheckResult(check=name, passed=not orphans)
```

**Layer 2, dbt, runs against the built warehouse:**

```yaml
- name: event_type
  tests:
    - accepted_values:
        values: ["signup", "completed_onboarding", "created_project",
                  "invited_teammate", "used_integration", "login"]
```

- 8 dbt models, 40 total checks, all passing
- Python checks run once during load and can halt the pipeline. dbt tests run against the final tables and are what an agent implicitly trusts on every query. Belt and suspenders

## Grounding ambiguous terms instead of guessing

```python
def retrieve(query, top_k=1, min_score=0.05):
    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(corpus + [query])
    scores = cosine_similarity(matrix[-1], matrix[:-1])[0]
    return [chunk for chunk, score in ranked[:top_k] if score >= min_score]
```

- TF-IDF retrieval over a metrics glossary, no external API key required
- If nothing scores above the threshold, it returns nothing, callers must treat that as "not covered," never invent a definition
- Stops two different questions from silently using two different definitions of "active" and producing numbers that don't agree

## The dashboard's numbers, straight from the queries

```python
def weekly_active_users():
    df = run_query("""SELECT strftime('%Y-%W', event_date) AS week,
        COUNT(DISTINCT user_id) AS wau FROM product_events
        WHERE event_type = 'login' GROUP BY 1 ORDER BY 1""")
    return df.iloc[:-1]  # drop the current partial week
```

```python
def account_risk_list(top_n=20):
    model = joblib.load(MODEL_PATH)
    df = run_query(FEATURE_QUERY)
    df["churn_risk"] = model.predict_proba(df[FEATURE_COLUMNS])[:, 1]
    return df.sort_values("churn_risk", ascending=False).head(top_n)
```

- Dropping the current partial week matters, without it every WAU chart ends in a fake decline just because the week isn't over yet
- The risk list is where the model actually gets used live, scoring every active account and ranking them, so "who should I call" is a list of names, not a percentage

## How it knows something is statistically real

```python
p_pool = (x1 + x2) / (n1 + n2)
se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
z = (p2 - p1) / se
p_value = 2 * (1 - stats.norm.cdf(abs(z)))
```

- A two-proportion z-test, for comparing two yes/no rates against each other
- Also computes whether the sample was even large enough to detect a real effect (`underpowered`), separate from whether the result was significant
- This exact function is what caught the churn "finding" below

## The churn model

```python
CATEGORICAL_FEATURES = ["plan_tier", "industry", "region"]
NUMERIC_FEATURES = ["current_seat_count", "distinct_feature_types_used",
                     "total_events_90d", "days_since_last_login"]

pipeline = build_pipeline()  # GradientBoostingClassifier
pipeline.fit(X_train, y_train)
auc = roc_auc_score(y_test, pipeline.predict_proba(X_test)[:, 1])
# auc = 0.6675
```

- Same feature query trains the model and scores live accounts, one shared definition instead of two that could drift apart
- Graded on AUC, not accuracy, because churn is imbalanced and accuracy would happily lie
- 0.6675 is good enough to prioritize outreach, not good enough to be a crystal ball, and nothing in the output claims otherwise

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

Integration-adopting accounts churned at 17.5% versus 27.1% for non-adopters, a 35% relative gap. Run through the z-test above:

```
p_value = 0.075
```

- Above the standard 0.05 cutoff, and the non-adopter group was only 59 accounts, small enough that the test flagged it as underpowered too
- Reported as "promising, not proven," not "found it." The exciting number would have sent someone chasing a pattern that might not be real

## Tests and CI

```yaml
- name: Build the sample warehouse via the real pipeline
  run: |
    python -m scripts.export_raw_sources
    python -m pipelines.etl
- run: pytest -v
```

- 24 tests, run on every push
- CI rebuilds the entire warehouse through the real pipeline before testing, so a broken pipeline gets caught, not just a broken query

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
