# AI Data Analyst with Claude Code: The Complete Case Study

**TL;DR, what this is and why it exists**
- **The problem:** I do data analysis for a living. Someone asks a question in Slack. I spend 40 minutes writing SQL, running a test, building a chart, to answer something they typed in 5 seconds.
- **What I built:** a team of 7 AI agents on Claude Code that takes a plain-English business question and answers it the way a real analytics team would: with SQL, a significance test, or a model, whichever the question actually needs, plus honest caveats when the data doesn't support a clean story.
- **The honest part:** AI wrote most of the code here. SQL, Python, dbt models, all of it. What it didn't do is decide what was worth building, or catch it when it was wrong. This case study shows you both halves: the system, and my actual judgment calls on top of it.
- **Proof it's not just a demo:** real example Q&As with real output, an eval framework, a 24-test pytest suite, 40 passing dbt checks, and two real bugs I caught and fixed, shown with the actual diffs.
- Every code block below has a plain-English "Line by line" breakdown. No assumed syntax knowledge.

## Jump to a section

- [The problem, in more detail](#the-problem-in-more-detail)
- [Why 7 agents, not 1 prompt, not 11 agents](#why-7-agents-not-1-prompt-not-11-agents)
- [Meet the team: all 7 agents in full](#meet-the-team-all-7-agents-in-full)
- [Skills: reusable playbooks](#skills-reusable-playbooks)
- [The warehouse guardrail](#the-warehouse-guardrail)
- [ETL: raw data to warehouse](#etl-raw-data-to-warehouse)
- [Data quality, two layers](#data-quality-two-layers)
- [Grounding ambiguous terms with RAG](#grounding-ambiguous-terms-with-rag)
- [How the dashboard's numbers get computed](#how-the-dashboards-numbers-get-computed)
- [How it knows something is statistically real](#how-it-knows-something-is-statistically-real)
- [The churn model](#the-churn-model)
- [Real questions, real answers](#real-questions-real-answers)
- [How the agents get graded](#how-the-agents-get-graded)
- [Bug 1: the chart that lied](#bug-1-the-chart-that-lied)
- [Bug 2: the pattern that wasn't real](#bug-2-the-pattern-that-wasnt-real)
- [Test suite, CI, and deployment](#test-suite-ci-and-deployment)
- [Decisions that were mine, not Claude's](#decisions-that-were-mine-not-claudes)
- [Is this data real?](#is-this-data-real)
- [Interview prep: questions and answers](#interview-prep-questions-and-answers)

## The problem, in more detail

Every data analyst has lived this: a business question shows up in plain English, and the actual work of answering it (finding the right table, writing correct SQL, deciding if a difference is real or noise, building a chart, and stating the caveats) takes way longer than the question itself.

Worse, a single generalist AI prompt doesn't fix this. Some questions need SQL. Some need a significance test. Some need a predictive model. One prompt trying to be equally good at all three ends up mediocre at each, the same problem you'd get handing all three jobs to one overloaded junior analyst.

So I built a small team instead. Not a chatbot. A team, with the same division of labor a real analytics org has: someone who writes queries, someone who runs the stats, someone who owns the pipelines, someone who builds the dashboard, someone who checks everyone else's work.

## Why 7 agents, not 1 prompt, not 11 agents

The first version of this had 11 agents, one per narrow skill. I rejected that design and had it rebuilt around 7, and the reason is worth stating plainly: 11 agents isn't how a real team is structured. A real analytics team has a lead, a SQL person, a data scientist, a platform/infra person, a BI person, someone who owns AI/ML tooling, and QA. Seven roles. Mapping the agents to actual job titles instead of actual tasks makes the system easier to reason about and easier to route into, one agent per "who would own this in real life," not one agent per verb.

## Meet the team: all 7 agents in full

Every agent is a markdown file with two parts: frontmatter (name, description, and which tools it's allowed to use) and a body of plain-English instructions. There's no separate router script. Claude Code reads the frontmatter to know an agent exists, and the body tells it how to behave.

### analyst-lead, the orchestrator

```markdown
---
name: analyst-lead
description: Orchestrates a business question end-to-end, breaks it into
sub-tasks, delegates to the right specialist agent, and synthesizes a
plain-English answer with a recommendation.
tools: Read, Grep, Glob, Bash, Agent
---

## The team
- sql-engineer, schema lookup and query writing for descriptive questions.
- data-scientist, statistical significance, A/B tests, predictive modeling.
- data-platform-engineer, pipeline/data-quality/infra/scaling questions.
- data-visualizer, ad-hoc charts or the persistent dashboard.
- ai-engineer, grounding an ambiguous metric definition via RAG lookup.
- qa-reviewer, sanity-checks any result before it's presented as fact.

## Process
This follows the standard six-phase data-analysis workflow, so a fast answer
never skips the steps that make it a trustworthy one.
1. Ask. Understand the actual business problem, not just the literal
   question. Ground ambiguous terms against the glossary instead of guessing.
2. Prepare. Confirm the right data exists and is trustworthy before
   analyzing it, and flag known data-quality issues up front.
3. Process. Clean and validate before trusting any number: nulls, duplicate
   joins from fan-out, referential integrity, row counts that don't add up.
4. Analyze. Route to whichever specialist owns the actual method.
5. Share. A chart, if it makes the answer clearer than a table would.
6. Act. Close with "so what," a plain-English answer and its business
   implication, not just a restated stat.

## Output shape
Answer, why it matters, evidence, query, caveats. Never fabricate a number
you did not get from a query.
```

**Line by line:**
- `tools: Read, Grep, Glob, Bash, Agent`: this list in the frontmatter is a permission list. `Agent` is the one that matters most here, it's what lets this file call the other 6 agents. No specialist agent below has this permission.
- The six phases (Ask, Prepare, Process, Analyze, Share, Act) are the standard shape of a real analytics workflow, not something invented for this project. Naming them explicitly is what stops a fast AI answer from quietly skipping the "boring" middle steps, confirming the data is trustworthy and cleaning it, that people forget when they're excited about the analysis part.
- "Never fabricate a number you did not get from a query" is a literal instruction in the file, not something I'm paraphrasing. It's there because an LLM will confidently guess a plausible-sounding number if you don't explicitly forbid it.

### sql-engineer, the specialist

```markdown
---
name: sql-engineer
description: Explores warehouse schema and writes correct, efficient,
read-only SQL for a specific analytics question.
tools: Read, Grep, Glob, Bash
---

1. Confirm table and column names before writing a query. Never guess.
2. Write the minimal query that answers the question.
3. The query must be SELECT-only. If the question genuinely requires
   changing data, stop and say so.
4. Note any join fan-out risk.
5. Run the query through connectors/warehouse.py, not a raw driver call.
6. Return: the SQL, a one-line explanation, and the result set.
```

**Line by line:**
- `tools: Read, Grep, Glob, Bash`: no `Agent` in this list. This agent can read files and run shell commands, but it cannot call another agent. It's boxed in on purpose.
- "Join fan-out risk" means: joining two tables where one row on one side matches many rows on the other can silently multiply your counts. Step 4 exists so that mistake gets caught before it reaches an answer.

### data-scientist, stats and modeling

```markdown
---
name: data-scientist
description: Handles statistics, A/B test design and readout, and
predictive modeling. Use for significance testing, experiment analysis,
confidence intervals, or "predict/score X" requests.
tools: Read, Grep, Glob, Bash
---

## Statistics & A/B testing
Use stats/tests.py and experiments/ab_test.py, don't hand-roll a
significance test inline.
1. State the hypothesis and metric explicitly before testing anything.
2. Check sample size is adequate, a "no significant difference" result on
   a too-small sample is not evidence of no effect, say so.
3. Report effect size and confidence interval, not just a p-value.
4. Check guardrail metrics before declaring a result good.

## Predictive modeling
Use ml/train_churn_model.py as the reference pipeline. Prefer
behavioral/engagement features over purely transactional ones. Report
AUC/precision/recall, not just accuracy, since these datasets are usually
imbalanced. Always report a model's limitations alongside its performance.
```

**Line by line:**
- "Don't hand-roll a significance test inline" means: always call the tested, reviewed functions in `stats/tests.py`/`experiments/ab_test.py` instead of writing a new one-off statistics formula inside a single answer. One correct, tested implementation beats many slightly-different inline ones.
- "A too-small sample is not evidence of no effect" is the instruction that produces the `underpowered` flag you'll see later in the actual z-test code.

### data-platform-engineer, pipelines and infra

```markdown
---
name: data-platform-engineer
description: Owns how data gets into the warehouse, where the warehouse
runs, and how the system is architected to scale.
tools: Read, Grep, Glob, Bash
---

## Pipelines & data quality
Reference: scripts/export_raw_sources.py -> pipelines/etl.py ->
pipelines/data_quality.py.
1. Land raw data first, don't transform on the way in.
2. Write the transform as an explicit, re-runnable step.
3. Fail loudly, not silently, when a check fails in a way that would
   corrupt downstream analysis.

## Cloud & deployment
Only produce infrastructure-as-code and documentation, never attempt to
provision, modify, or tear down real cloud resources.
```

**Line by line:**
- "Land raw data first, don't transform on the way in" means: save the messy original data exactly as it arrived before cleaning anything. If your cleanup logic has a bug, you can fix the bug and re-run it against the untouched original, instead of having already destroyed the only copy of the real data.
- The cloud rule is a hard boundary: this agent can write Terraform files, it can never run `terraform apply` against a real account.

### ai-engineer, RAG and system governance

```markdown
---
name: ai-engineer
description: Owns the LLM/RAG-powered parts of the system and the quality
bar for the agent team itself.
tools: Read, Grep, Glob, Bash
---

## RAG: grounding metric definitions
When any agent's answer depends on an ambiguous term, retrieve the
relevant glossary entry via rag/retrieve.py and cite it, instead of
guessing inline. If the glossary doesn't cover the term, say so.

## Agent/skill system governance
1. When to add a new agent vs. a skill: a new agent needs a genuinely
   different role/toolset. A new skill is the same role, a different
   playbook.
2. Periodically run the golden questions in evals/eval_cases.md and
   compare actual output to expected.
3. Any new agent/skill file states: when to use it, its process, its
   output shape.
```

**Line by line:**
- "A new agent needs a genuinely different role... a new skill is the same role, a different playbook" is the actual rule that decided the agent count. It's why cohort-retention and funnel-analysis are skills (both are still `sql-engineer` work, just different recipes), not separate agents.

### qa-reviewer, the gate

```markdown
---
name: qa-reviewer
description: The team's data-quality and production-readiness gate.
Sanity-checks results before they reach a stakeholder, owns tests/ and CI.
tools: Read, Bash
---

## Per-query checklist
1. Row count sanity.
2. Null / missing data.
3. Join fan-out.
4. Date range coverage.
5. Definition ambiguity.

## Production-readiness
1. Run pytest.
2. Confirm CI would catch the same regressions on push.
3. A change without a corresponding test is a gap, flag it.
```

**Line by line:**
- `tools: Read, Bash`: this agent can read code and run commands (like `pytest`), but has no `Grep`/`Glob`/`Agent`. It's deliberately the narrowest agent, its whole job is checking, not building.

### data-visualizer, the BI developer

```markdown
---
name: data-visualizer
description: Turns a query result into the right chart, owns the
persistent dashboard.
tools: Read, Bash
---

## Chart selection
- Trend over time -> line chart.
- Comparison across categories -> bar chart.
- Distribution -> histogram.
- Sequential drop-off -> funnel chart.

## Rules
Label axes and units explicitly. Title the chart with the actual question
it answers. If fewer than ~3 data points would result, present the
numbers directly instead of forcing a chart.
```

**Line by line:**
- The chart-selection list is a decision table: the question's shape (trend? comparison? drop-off?) determines the chart type. This stops an agent from defaulting to whatever chart type is easiest to generate.

## Skills: reusable playbooks

Agents are roles. Skills are recipes a role follows for a specific, repeatable kind of analysis. There are 6:

| Skill | What it standardizes |
|---|---|
| `schema-explorer` | Always run first: list tables, inspect columns, check foreign keys, spot-check real rows, before writing any query. |
| `growth-metrics-analysis` | WAU/MAU trend and MRR/net revenue retention, and keeps the two axes from getting conflated. |
| `funnel-analysis` | Sequential conversion (signup to onboarding to activation), stage-to-stage drop-off, biggest leak identification. |
| `cohort-retention` | Group users by signup month, track retention by month offset, explicitly flags that young cohorts can't be fairly compared to old ones yet. |
| `anomaly-detection` | Trailing baseline plus a threshold, then ruling out obvious causes (one outlier account, a data gap) before calling something a real anomaly. |
| `executive-summary` | The output format every answer follows: headline, so-what, evidence, how it was calculated, caveats. |

Full text of the one every question runs through first:

```markdown
---
name: schema-explorer
description: Discover the warehouse's tables, columns, and relationships
before writing a query.
---

1. List tables via sqlite_master / information_schema.
2. Inspect columns and types via PRAGMA table_info.
3. Note primary/foreign key relationships.
4. Spot-check a few rows to see real data shapes, date formats, whether a
   revenue figure is precomputed or needs deriving.

Only after this should you hand off to writing the actual analysis query.
```

**Line by line:**
- `sqlite_master`/`information_schema`: these are built-in system tables every SQL database exposes, listing what tables exist. This is how an agent discovers the schema instead of a human describing it.
- `PRAGMA table_info(table_name)`: a SQLite-specific command that returns column names and types for one table, the equivalent of opening a spreadsheet and looking at the header row.

## The warehouse guardrail

Every agent that touches data goes through one file: `connectors/warehouse.py`. It physically cannot write.

```python
_ALLOWED_STATEMENT = re.compile(r"^\s*(WITH|SELECT|EXPLAIN)\b", re.IGNORECASE)

def run_query(sql: str) -> pd.DataFrame:
    if not _ALLOWED_STATEMENT.match(sql):
        raise ValueError(
            "Only read-only SELECT/WITH/EXPLAIN statements are allowed."
        )
    engine = get_engine()
    with engine.connect() as conn:
        return pd.read_sql(text(sql), conn)
```

**Line by line:**
- `re.compile(r"^\s*(WITH|SELECT|EXPLAIN)\b", re.IGNORECASE)`: builds a pattern that checks if text starts with WITH, SELECT, or EXPLAIN, ignoring capitalization. A bouncer checking only the first word.
- `if not _ALLOWED_STATEMENT.match(sql):`: tests the incoming SQL. If it doesn't start with one of those words, this is true.
- `raise ValueError(...)`: stops everything and throws an error with an explanation.
- `pd.read_sql(text(sql), conn)`: runs the query, returns the result as a pandas DataFrame, a table your Python code can work with.

**Why this matters:** an AI agent with database access and a bad prompt is a real failure mode. This regex is the entire defense. `DELETE`, `DROP`, `UPDATE` never reach the database. They get rejected in Python first.

## ETL: raw data to warehouse

Before any agent can query anything, raw data has to become clean tables. `scripts/export_raw_sources.py` generates realistic, deliberately messy raw data (500 organizations, users, seat-based subscriptions, product events, spanning 2024 to 2026), simulating four different real-world source systems. It injects 9 duplicate organization rows on purpose, exactly like a CRM export overlap would.

```python
DUPLICATE_ORG_ROWS = 9  # simulates a CRM re-export overlap
duplicates = random.sample(orgs, k=DUPLICATE_ORG_ROWS)
all_rows = orgs + duplicates

churn_prob = {"Starter": 0.42, "Team": 0.24, "Enterprise": 0.10}[plan_name]
expand_prob = {"Starter": 0.15, "Team": 0.35, "Enterprise": 0.5}[plan_name]
```

**Line by line:**
- `random.sample(orgs, k=9)`: picks 9 random organizations out of the full list, without picking the same one twice.
- `all_rows = orgs + duplicates`: sticks those 9 duplicates back into the full list, so the raw data now genuinely has repeats in it.
- `churn_prob = {...}[plan_name]`: a dictionary lookup. Starter-plan accounts get a 42% chance of churning baked into the simulation, Enterprise only 10%, because that mirrors how real self-serve accounts churn more than accounts with heavy onboarding investment.

`pipelines/etl.py` then cleans that mess up:

```python
def transform(raw: dict[str, pd.DataFrame]) -> dict[str, pd.DataFrame]:
    organizations = raw["organizations"].drop_duplicates(subset=["id"]).reset_index(drop=True)

    subscriptions = raw["subscriptions"].copy()
    subscriptions["mrr"] = (subscriptions["current_seat_count"] * subscriptions["price_per_seat"]).round(2)
    subscriptions.loc[subscriptions["status"] == "churned", "mrr"] = 0.0

    return {"organizations": organizations, "subscriptions": subscriptions}


def main() -> None:
    raw = extract()
    validate_raw(raw)
    tables = transform(raw)
    if not validate_transformed(tables):
        raise SystemExit("Transformed data failed validation, aborting load.")
    load(tables)
    if not validate_loaded():
        raise SystemExit("Post-load validation failed on the warehouse.")
```

**Line by line:**
- `.drop_duplicates(subset=["id"])`: removes rows sharing the same `id`, keeping one copy. This is the fix for the 9 duplicates injected above.
- `subscriptions["mrr"] = (seats * price).round(2)`: creates a monthly-recurring-revenue column by multiplying seat count by price per seat.
- `.loc[status == "churned", "mrr"] = 0.0`: forces revenue to zero for cancelled accounts.
- `main()` calls `validate_raw`, then transforms, then `validate_transformed` (stopping everything with `SystemExit` if it fails), then loads, then `validate_loaded`. Three separate checkpoints, any one of which can halt the whole run.

## Data quality, two layers

**Layer 1, Python, runs during ETL** (`pipelines/data_quality.py`):

```python
def check_referential_integrity(
    child_df, child_key, parent_df, parent_key, relationship_name,
) -> CheckResult:
    orphans = set(child_df[child_key]) - set(parent_df[parent_key])
    return CheckResult(
        check=f"referential integrity: {relationship_name}",
        passed=not orphans,
        detail="all references resolve" if not orphans else f"{len(orphans)} orphaned references",
    )
```

**Line by line:**
- `set(child_df[child_key])`: takes one column (say, every `org_id` a subscription points to) and turns it into a set, a list with duplicates removed.
- `- set(parent_df[parent_key])`: subtracts the parent table's ids. What's left is any child value with no matching parent, an "orphan."
- `passed=not orphans`: passes only if that leftover set is empty.

**Layer 2, dbt, runs against the built warehouse** (`dbt/models/staging/_staging.yml`):

```yaml
models:
  - name: stg_product_events
    columns:
      - name: event_type
        tests:
          - accepted_values:
              arguments:
                values: ["signup", "completed_onboarding", "created_project",
                          "invited_teammate", "used_integration", "login"]
```

**Line by line:**
- This is YAML, a configuration format, read by dbt, not executed like Python.
- `accepted_values: ... values: [...]`: tells dbt to check every row and confirm `event_type` is one of the 6 listed words. Anything else fails the test and gets flagged.

**The count:** 8 dbt models (4 staging, 4 marts), 28 column-level test assertions, all passing. Three additional mart models exist beyond the account-health one: `fct_weekly_active_users.sql` and `fct_onboarding_funnel.sql` mirror the Python pipeline's WAU and funnel logic exactly, and `fct_account_mrr.sql` computes the same 90-day "established account" rule used for net revenue retention. This is a parallel, tested semantic layer, a second, independently-checked version of the same metric logic, not something the agents query directly today.

**Why two layers:** Python checks run once, during load, and can halt the pipeline. dbt tests run against the final tables and are what an agent implicitly trusts every time it queries. Belt and suspenders.

## Grounding ambiguous terms with RAG

The word "active" is ambiguous. Active user? Active account? This project answers that with one file, `knowledge/metrics_glossary.md`, plus retrieval code that finds the right definition instead of an agent guessing.

```python
def _load_chunks(path: Path = GLOSSARY_PATH) -> list[tuple[str, str]]:
    content = path.read_text(encoding="utf-8")
    sections = re.split(r"^## ", content, flags=re.MULTILINE)[1:]
    chunks = []
    for section in sections:
        term, _, body = section.partition("\n")
        chunks.append((term.strip(), body.strip()))
    return chunks


def retrieve(query: str, top_k: int = 1, min_score: float = 0.05) -> list[RetrievedChunk]:
    chunks = _load_chunks()
    corpus = [f"{term} {body}" for term, body in chunks]

    vectorizer = TfidfVectorizer(stop_words="english")
    matrix = vectorizer.fit_transform(corpus + [query])
    query_vec = matrix[-1]
    doc_vecs = matrix[:-1]

    scores = cosine_similarity(query_vec, doc_vecs)[0]
    ranked = sorted(zip(chunks, scores), key=lambda x: x[1], reverse=True)

    return [
        RetrievedChunk(term=term, text=body, score=round(float(score), 4))
        for (term, body), score in ranked[:top_k]
        if score >= min_score
    ]
```

**Line by line:**
- `re.split(r"^## ", content, ...)`: chops the glossary markdown file apart every time it sees a `## ` heading, so each metric definition becomes its own separate chunk of text.
- `TfidfVectorizer`: a tool from scikit-learn that converts text into numbers based on which words are distinctive to each chunk (common words like "the" matter less, rare/specific words matter more). This is TF-IDF, not a full AI embedding model, it works with zero external API calls.
- `cosine_similarity(query_vec, doc_vecs)`: measures how similar the question's numeric representation is to each glossary chunk's numeric representation. Higher score means more related.
- `if score >= min_score`: if nothing scores above 0.05, the function returns an empty list on purpose. The docstring is explicit that callers must treat an empty result as "not covered by the glossary," never silently invent a definition instead.

**Why this matters:** without this, two different questions could silently use two different definitions of "active" and produce numbers that don't agree with each other. `ai-engineer` is the agent responsible for calling this before answering anything with an ambiguous term in it.

## How the dashboard's numbers get computed

Every chart is one function in `dashboard/queries.py`.

**Weekly active users:**

```python
def weekly_active_users() -> pd.DataFrame:
    df = run_query("""
        SELECT strftime('%Y-%W', event_date) AS week, COUNT(DISTINCT user_id) AS wau
        FROM product_events
        WHERE event_type = 'login'
        GROUP BY 1
        ORDER BY 1
    """)
    return df.iloc[:-1].reset_index(drop=True) if len(df) > 1 else df
```

**Line by line:**
- `strftime('%Y-%W', event_date)`: converts a date like "2026-09-13" into a year-week label like "2026-37".
- `COUNT(DISTINCT user_id)`: counts unique users, so someone logging in 5 times in a week still counts once.
- `df.iloc[:-1]`: drops the last row, which is always the current, still-in-progress week. Without this, every chart would end in a fake decline just because the week isn't over yet.

**Net revenue retention:**

```python
def net_revenue_retention() -> pd.DataFrame:
    return run_query("""
        WITH reference_date AS (SELECT MAX(event_date) AS d FROM product_events)
        SELECT ROUND(100.0 * SUM(mrr) / SUM(initial_mrr), 1) AS nrr_pct
        FROM subscriptions, reference_date
        WHERE julianday(reference_date.d) - julianday(start_date) >= 90
    """)
```

**Line by line:**
- `WITH reference_date AS (...)`: a temporary named result, calculated once and reused, finding the most recent date in the data.
- `SUM(mrr) / SUM(initial_mrr)`: current total revenue divided by starting total revenue across the group. Above 100% means the group is paying more now than when they joined.
- `julianday(...) - julianday(...) >= 90`: converts both dates to plain numbers and only keeps accounts at least 90 days old, so brand-new accounts (that haven't had time to expand or churn) don't water down the number.

**Account churn-risk list**, where the model actually gets used:

```python
def account_risk_list(top_n: int = 20) -> pd.DataFrame:
    model = joblib.load(MODEL_PATH)
    df = run_query(FEATURE_QUERY)
    df["churn_risk"] = model.predict_proba(df[FEATURE_COLUMNS])[:, 1]
    return df.sort_values("churn_risk", ascending=False).head(top_n).reset_index(drop=True)
```

**Line by line:**
- `joblib.load(MODEL_PATH)`: loads a previously trained model from a saved file. Training happens once, offline.
- `model.predict_proba(...)`: asks the model for a churn probability per account. It returns two numbers (probability of not churning, probability of churning).
- `[:, 1]`: grabs just the churn probability, the second of those two numbers.
- `.sort_values(..., ascending=False).head(20)`: ranks accounts highest-risk first, keeps the top 20.

**Why this matters:** the dashboard doesn't just show a churn rate. It scores every active account and ranks them, so "who should I call" is a list of names, not a percentage.

## How it knows something is statistically real

**"Are these two averages actually different?"** answered by a Welch's t-test, `stats/tests.py`:

```python
def two_sample_ttest(group_a: np.ndarray, group_b: np.ndarray) -> TestResult:
    stat, p_value = stats.ttest_ind(group_a, group_b, equal_var=False)
    mean_diff = float(group_a.mean() - group_b.mean())
    return TestResult(
        p_value=float(p_value),
        significant_at_05=p_value < 0.05,
        effect_size=round(cohens_d, 3),
    )
```

**Line by line:**
- `stats.ttest_ind(group_a, group_b, equal_var=False)`: a scipy function comparing the average of two groups. `equal_var=False` means it doesn't assume both groups vary internally by the same amount, this is Welch's t-test, the safer default.
- `p_value < 0.05`: the standard cutoff. A p-value is the probability you'd see a difference this big by random chance if there were actually no real difference. Below 5% is the conventional line for "statistically significant."
- `cohens_d`: measures how large the difference is, separately from whether it's statistically real. A significant difference can still be tiny in practice.

**"Did this A/B test move a yes/no metric?"** answered by a two-proportion z-test, `experiments/ab_test.py`, the real code behind the churn-vs-integration story:

```python
def two_proportion_z_test(
    control_successes, control_n, treatment_successes, treatment_n,
) -> ABTestResult:
    p1 = control_successes / control_n
    p2 = treatment_successes / treatment_n
    p_pool = (control_successes + treatment_successes) / (control_n + treatment_n)
    se = np.sqrt(p_pool * (1 - p_pool) * (1 / control_n + 1 / treatment_n))
    z = (p2 - p1) / se if se > 0 else 0.0
    p_value = 2 * (1 - stats.norm.cdf(abs(z)))

    return ABTestResult(
        relative_lift_pct=round((p2 - p1) / p1 * 100, 2),
        p_value=round(float(p_value), 4),
        significant_at_05=p_value < 0.05,
        underpowered=min(control_n, treatment_n) < required_sample_size_per_group(p1),
    )
```

**Line by line:**
- This test is for yes/no outcomes (churned or not), unlike the t-test above which compares averages of numbers.
- `p1`, `p2`: the churn rate (successes divided by total) for each group.
- `p_pool`: combines both groups into one baseline rate, used to estimate how much random variation to expect if the groups were actually identical.
- `se`: the "standard error," how much the difference would naturally wobble from random sampling alone, even with no real effect.
- `z = (p2 - p1) / se`: the observed difference expressed in units of "how many standard errors away from zero." Bigger means harder to explain by chance.
- `p_value`: converts that z-score into an actual probability.
- `underpowered=min(control_n, treatment_n) < required_sample_size_per_group(p1)`: separately checks whether either group even had enough data points to reliably detect a real effect, regardless of what the p-value says.

## The churn model

Feature list, `ml/features.py`:

```python
CATEGORICAL_FEATURES = ["plan_tier", "industry", "region"]
NUMERIC_FEATURES = ["current_seat_count", "distinct_feature_types_used",
                     "total_events_90d", "days_since_last_login"]
```

Computed live, in one query shared by both training and scoring:

```sql
WITH org_engagement AS (
    SELECT
        org_id,
        COUNT(DISTINCT CASE WHEN event_type IN ('created_project','invited_teammate','used_integration')
                             THEN event_type END) AS distinct_feature_types_used,
        SUM(CASE WHEN julianday('2026-09-01') - julianday(event_date) <= 90 THEN 1 ELSE 0 END) AS total_events_90d,
        MAX(CASE WHEN event_type = 'login' THEN event_date END) AS last_login_date
    FROM product_events
    GROUP BY org_id
)
SELECT ... CASE WHEN s.status = 'churned' THEN 1 ELSE 0 END AS churned
FROM subscriptions s
JOIN organizations o ON o.id = s.org_id
LEFT JOIN org_engagement oe ON oe.org_id = s.org_id
```

**Line by line:**
- `WITH org_engagement AS (...)`: a temporary named sub-query, calculated once and reused.
- `COUNT(DISTINCT CASE WHEN event_type IN (...) THEN event_type END)`: counts how many different feature types an organization has ever used. `CASE WHEN` is SQL's if/else.
- `SUM(CASE WHEN ... <= 90 THEN 1 ELSE 0 END)`: adds 1 for every event within the last 90 days, 0 otherwise, how "recent activity" gets counted row by row.
- `LEFT JOIN org_engagement oe ON oe.org_id = s.org_id`: attaches engagement numbers onto each subscription. "LEFT JOIN" keeps organizations with zero matching engagement rows too, filled in as blank.

Training and evaluation, `ml/train_churn_model.py`:

```python
pipeline = build_pipeline()  # GradientBoostingClassifier
pipeline.fit(X_train, y_train)
y_proba = pipeline.predict_proba(X_test)[:, 1]
auc = roc_auc_score(y_test, y_proba)
```

**Line by line:**
- `GradientBoostingClassifier`: builds a series of small decision trees, each one correcting the mistakes the previous trees made. A solid default for this kind of yes/no prediction problem.
- `pipeline.fit(X_train, y_train)`: the training step. `X_train` is the feature data, `y_train` is the right answers (did this account actually churn).
- `predict_proba(X_test)[:, 1]`: asks the trained model to guess on data it's never seen, returning a churn probability per account.
- `roc_auc_score`: a single score summarizing how well the model ranks accounts. If you picked one account that churned and one that didn't, how often does the model correctly guess which is riskier. 0.5 is random guessing, 1.0 is perfect.

**Why AUC, not accuracy:** churn is imbalanced. Most accounts don't churn. A model that always predicts "not churned" would score high on accuracy while being useless. AUC 0.6675 is the honest number, exactly reproducible thanks to fixed random seeds. Good enough to prioritize outreach. Not good enough to be a crystal ball.

## Real questions, real answers

Three real runs against the warehouse, produced by actually running the agents against real (synthetic) data, not staged examples.

**"Is product engagement growing or shrinking?"**
Agents: `analyst-lead` + `sql-engineer`, skill: `growth-metrics-analysis`.
> Weekly active users grew from 234 to 411 over 26 weeks, up 75.6%.
Caveat included in the actual output: the most recent week was excluded because it was partial and would have shown a false drop.

**"Where are we losing users before they actually try the product?"**
Agents: `analyst-lead` + `sql-engineer`, skill: `funnel-analysis`.
> Of 3,206 users who signed up, only 1,421 (44%) ever activated.

| Stage | Users | Drop from previous stage |
|---|---|---|
| Signed up | 3,206 | none |
| Completed onboarding | 2,295 | lost 911 (28%) |
| Activated | 1,421 | lost 874 (38%) |

The biggest leak is after onboarding, not during it. A secondary finding (accounts with lower activation run modestly hotter on churn, 46% vs 42%) was explicitly reported as suggestive, not proof.

**"Are we healthy overall, and which accounts need attention this quarter?"**
Agents: `analyst-lead` to `data-scientist`, skill: `executive-summary`.
> Net revenue retention is 108.5% among established accounts. But Starter-plan accounts churn at 28.8%, versus 6.7% for Enterprise.

The system also checked whether integration adoption predicts retention: adopters churned at 17.5% versus 27.1% for non-adopters, a 35% relative gap. Run through the two-proportion z-test above, that came back **p = 0.075**, not significant, partly because the non-adopter group was only 59 accounts. Reported as "promising, worth a real experiment, not yet confirmed," not as a finding. The churn model then scored every active account individually, naming specific at-risk accounts rather than just the segment average.

## How the agents get graded

`evals/eval_cases.md` is a fixed set of 7 golden business questions, each with an expected answer shape, that `ai-engineer` runs periodically to check the system hasn't regressed. Two examples:

- **"How many active users do we have?"** Expected: the ambiguous term "active user" gets grounded against the glossary's weekly-login definition instead of guessed, and the answer states which definition and time window were used.
- **"Why did weekly active users drop 90% this week?"** Expected: `qa-reviewer` catches that this is just the partial current week, the same fix shown in the WAU function above, before it's presented as a real drop.

This isn't an automated pass/fail test suite. It's a checklist for a human (or `ai-engineer`) to periodically re-run and compare against, the same way a real team might keep a shared doc of "questions we should always be able to answer correctly."

## Bug 1: the chart that lied

The dashboard has a funnel: signup, then onboarding, then activation. The first version rendered it as activation, funnel, signup. Alphabetical order. It looked fine, evenly spaced bars, real numbers, plausible labels. The sequence was scrambled, so the story it told was wrong.

**Root cause:** Streamlit's `st.bar_chart` always sorts its category axis alphabetically. No setting turns that off.

**The fix, part 1**, pin the row order in the query (`dashboard/queries.py`):

```python
def onboarding_funnel() -> pd.DataFrame:
    return run_query("""...""").set_index("event_type").reindex(
        ["signup", "completed_onboarding", "created_project"]
    ).reset_index()
```

**The fix, part 2**, drop `st.bar_chart` for Altair, which accepts an explicit sort order (`dashboard/app.py`):

```python
chart = (
    alt.Chart(chart_df)
    .mark_bar()
    .encode(x=alt.X("Stage", sort=chart_df["Stage"].tolist()), y="users")
)
st.altair_chart(chart, use_container_width=True)
```

**Line by line:**
- `.set_index("event_type")`: temporarily makes `event_type` the row label, required for the next step.
- `.reindex([...])`: forces the rows into exactly this order, regardless of what order SQL returned them in.
- `alt.X("Stage", sort=chart_df["Stage"].tolist())`: tells Altair "use this exact list, in this exact order, instead of your own default alphabetical sort."

I only caught this because I opened the real dashboard in a browser and looked at every chart before calling it done. The code ran with no errors. It just confidently told the wrong story. That's the failure mode that worries me most about AI-assisted work: not the crash, the wrong answer that looks fine.

## Bug 2: the pattern that wasn't real

Covered above in the third real answer: the 35% churn difference between integration adopters and non-adopters read like a finding. Run through `two_proportion_z_test`, it came back p = 0.075. Not significant.

The honest answer was "promising, not proven." Not "found it." Shipping that 35% number as confirmed would have sent someone chasing a pattern that might not be real. This is exactly what the `underpowered` field and `qa-reviewer`'s checklist exist to catch. "The model said so" is never the last step here.

## Test suite, CI, and deployment

24 pytest tests. A real one in full, `tests/test_warehouse.py`:

```python
def test_read_only_guard_blocks_writes():
    for statement in ["DELETE FROM subscriptions", "DROP TABLE organizations"]:
        with pytest.raises(ValueError):
            run_query(statement)

def test_subscriptions_mrr_matches_seats_times_price():
    mismatches = run_query("""
        SELECT id FROM subscriptions
        WHERE status != 'churned'
          AND ABS(mrr - current_seat_count * price_per_seat) > 0.01
    """)
    assert mismatches.empty
```

**Line by line:**
- `with pytest.raises(ValueError):`: this test only passes if the code inside throws a `ValueError`. It's checking that bad input correctly gets rejected.
- `assert mismatches.empty`: `assert` means "this must be true or the test fails." Here it checks a query meant to find pricing mismatches comes back with zero rows.

CI, `.github/workflows/ci.yml`, runs on every push:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install -r requirements.txt
      - name: Build the sample warehouse via the real pipeline
        run: |
          python -m scripts.export_raw_sources
          python -m pipelines.etl
      - run: pytest -v
```

**Line by line:**
- `on: push / pull_request` (in the full file): runs automatically on every push or PR, no human has to remember to trigger it.
- `uses: actions/checkout@v4` / `setup-python@v5`: reusable, pre-built steps that download the repo and install Python.
- CI rebuilds the entire warehouse through the real ETL pipeline before testing, so a change that breaks the pipeline itself gets caught, not just a change that breaks a query.

**Deployment**, sketched but never applied. `infra/` has Terraform for three clouds:

| Provider | Database | Dashboard | Scheduled ETL |
|---|---|---|---|
| AWS | RDS Postgres | ECS Fargate | EventBridge to ECS |
| GCP | Cloud SQL | Cloud Run | Cloud Scheduler |
| Azure | Azure DB Postgres | Container Apps | Container Apps Job |

The design is deliberately swap-friendly: every agent and skill talks to `connectors/warehouse.py`, which reads one `DATABASE_URL` environment variable. Moving to a real cloud warehouse means changing that one connection string, not touching a single agent.

## Decisions that were mine, not Claude's

AI wrote the SQL, the Python, the dbt models. Here's what it didn't decide:

- **The domain.** B2B SaaS with seat-based accounts, chosen specifically so it wouldn't overlap with my other portfolio projects.
- **7 agents, not 11.** The project originally had 11 narrow agents, one per skill. I rejected that as unrealistic, no real company staffs a team that way, and had it rebuilt around 7 roles that map to actual job titles.
- **Cutting an MLOps agent entirely.** An early draft had a dedicated agent for model registry and drift detection. I cut it, not because the code didn't work, but because it was a stretch past what a Data Analyst role actually needs. Scope is a decision, not just a feature list.
- **AUC over accuracy** for the churn model, because churn is imbalanced and accuracy would lie.
- **Catching the funnel chart bug**, by opening the actual dashboard and looking, instead of trusting that error-free code meant correct output.
- **Running the significance test instead of trusting the eyeball comparison** on the 35% churn number, and reporting p=0.075 honestly instead of a fake win.
- **The read-only guard as a hard requirement**, not a nice-to-have, because an agent with write access to a real warehouse is a genuinely different risk profile.
- **Keeping the cloud deployment as documentation, not action.** Every agent instruction file explicitly forbids provisioning real infrastructure. That boundary was a deliberate design choice, not a limitation Claude imposed on itself.

Stated as a direct split, the same way I'd answer it in an interview:

| AI (Claude Code) did | I decided |
|---|---|
| Wrote the SQL, Python, and dbt models | Which business questions were even worth answering |
| Drafted the agent instructions | Which agent roster actually maps to a real team (rejected the first draft) |
| Ran the stats test | Whether "not significant" should be reported honestly instead of buried |
| Built the dashboard | Whether the dashboard's chart order was actually correct (it wasn't, first try) |
| Suggested the churn model features | Whether MLOps belonged in scope at all (it didn't) |

**Connecting a real warehouse, if this ever needed to leave the sample data behind:** every agent talks to the warehouse only through `connectors/warehouse.py`. Swapping the local SQLite sample for a real Postgres, Snowflake, or BigQuery warehouse means changing one `DATABASE_URL` value, nothing about the agents, the SQL they write, or the read-only guard needs to change at all. That single point of contact is itself a decision, not an accident, it's what makes "connect this to a real warehouse" a config change instead of a rewrite.

## Is this data real?

No, and this is worth being explicit about, including in an interview. The organizations, users, subscriptions, and product events are synthetically generated (`scripts/export_raw_sources.py`, fixed random seeds for reproducibility). The 75.6% WAU growth, the 108.5% NRR, the 28.8% vs 6.7% churn gap, none of these are a real company's numbers.

What this demonstrates isn't "I found a $100k insight." It's "I can build the system that would find it, and I know how to verify it's telling the truth when it does." That's a more honest claim, and it's the one that actually holds up under a follow-up question.

## Interview prep: questions and answers

**"AI can write SQL and build dashboards. Why does this need you?"**
Because deciding what was worth building, structuring the agents around real team roles, and catching it when it was wrong (twice, with receipts) is not something the AI did on its own. That's the part I own.

**"Why split into 7 agents instead of one prompt?"**
A generalist prompt trying to be equally good at SQL, statistics, and infrastructure ends up mediocre at all three. Splitting by role also lets me scope permissions tightly, `sql-engineer` literally cannot call other agents or write to the database. It was actually 11 agents at first, one per skill, which isn't how a real team is structured. I also cut a dedicated MLOps agent entirely once I recognized model-registry and drift-detection tooling was a stretch past what a Data Analyst role needs, not because the code didn't work.

**"Walk me through a bug you caught."**
The funnel chart rendered stages alphabetically instead of in sequence. It ran with no errors and looked fine at a glance. I only caught it by opening the actual dashboard and checking every chart before calling the feature done, which is exactly the habit this project is built to reinforce.

**"Why is the churn model's AUC only 0.6675, and why don't you consider that a problem?"**
Because churn is imbalanced, and AUC measures ranking quality, not raw accuracy. 0.6675 is good enough to prioritize which accounts to call. It's reported honestly instead of rounded up, and nothing downstream treats it as more certain than it is.

**"What stops an agent from running destructive SQL?"**
A regex in `connectors/warehouse.py` that only allows statements starting with WITH, SELECT, or EXPLAIN. It's tested explicitly in `test_read_only_guard_blocks_writes`, which tries DELETE and DROP statements and confirms both get rejected before they ever reach the database.

**"What would you change with more time?"**
Point this at a real, messier, unowned warehouse instead of one I control. That's a genuinely different problem: tables nobody remembers the reasoning behind, inconsistent naming, no clean glossary already written for you.

**Numbers to have ready, all reproducible:**
- 24 pytest tests passing, CI on every push.
- 40 dbt checks passing (28 column tests plus model-build checks), matching the Python pipeline's output exactly.
- Churn model AUC: 0.6675, exactly reproducible via fixed random seeds.
- WAU: 234 to 411 over 26 weeks (+75.6%).
- Net revenue retention: 108.5%.
- Starter churn 28.8% vs Enterprise 6.7%.
- Integration-adoption churn: 17.5% vs 27.1%, p=0.075, not significant.

## The stack

Python, SQL, Claude Code (7 agents, 6 skills), dbt (40 checks across 8 models), pytest (24 tests), GitHub Actions, Streamlit + Altair, scikit-learn, TF-IDF retrieval, Terraform (unapplied).

**Live dashboard:** [ai-data-analyst-claude-code.streamlit.app](https://ai-data-analyst-claude-code.streamlit.app/)
**Code:** [github.com/rithikahaha/AI-Data-Analyst-Claude-Code](https://github.com/rithikahaha/AI-Data-Analyst-Claude-Code)

*Rithika*
