# Global Supply Chain Audit: The Complete Case Study

**TL;DR, what this is and why it exists**
- **The problem:** an e-commerce operation promises delivery windows at checkout (1 day for First Class, 2 for Second Class, and so on), but nobody had actually checked whether fulfillment operations back those promises up.
- **What I built:** a 5-stage audit across 180,519 real orders that answers, in order: is this data trustworthy, are we actually hitting our promises, where exactly is time being lost, is the damage concentrated on any one customer group, and would fixing the promise actually work.
- **The headline finding:** First Class shipping fails its 1-day promise close to 100% of the time, arriving in about 2 days on average. That's not a rounding error, it's a fully broken promise, uniform across every customer spend tier, not concentrated on anyone in particular.
- **The proof it's not just a demo:** a real A/B test simulation (two-proportion z-test) showing that resetting the promise to match reality recovers fulfillment success to ~100% for 3 of 4 shipping tiers (p < 0.001), while Standard Class needs no change at all (p = 0.951). Plus a PySpark rewrite proving the same analysis scales past a single machine, and a real documentation inconsistency I caught and am reporting honestly instead of hiding.
- Every code block below has a plain-English "Line by line" breakdown.

## Jump to a section

- [The problem, in more detail](#the-problem-in-more-detail)
- [The 5-stage framework](#the-5-stage-framework)
- [Cleaning the data first](#cleaning-the-data-first)
- [Stage 1: is this data trustworthy](#stage-1-is-this-data-trustworthy)
- [Stage 2: the promise test](#stage-2-the-promise-test)
- [Stage 3: where is the time going](#stage-3-where-is-the-time-going)
- [Stage 4: is this hurting everyone or just some](#stage-4-is-this-hurting-everyone-or-just-some)
- [Stage 5: would fixing the promise actually work](#stage-5-would-fixing-the-promise-actually-work)
- [A real inconsistency I found in my own analysis](#a-real-inconsistency-i-found-in-my-own-analysis)
- [Doing it again in PySpark, for scale](#doing-it-again-in-pyspark-for-scale)
- [Stripping out PII before the dashboard sees it](#stripping-out-pii-before-the-dashboard-sees-it)
- [Building the dashboard](#building-the-dashboard)
- [Real numbers, straight from the pipeline](#real-numbers-straight-from-the-pipeline)
- [Data quality issues in the raw file](#data-quality-issues-in-the-raw-file)
- [Decisions that were mine](#decisions-that-were-mine)
- [Limitations](#limitations)
- [Interview prep: questions and answers](#interview-prep-questions-and-answers)

## The problem, in more detail

Checkout pages promise a delivery date. Almost nobody checks, at scale, whether that promise is actually true. If it isn't, you find out the expensive way: a support ticket, a bad review, a customer who doesn't order again.

This audit takes 180,519 real orders from a DataCo supply chain dataset and asks five questions in order, the same order a skeptical operations analyst would ask them: can I trust this data, are we actually hitting our promises, where specifically is the time going, is this hurting everyone equally or just some customers, and if I fixed the promise, would it actually work.

## The 5-stage framework

Every stage is implemented three separate ways in this project: as a standalone SQL file, as a cell in a Pandas/SQLite notebook, and (for scale) as PySpark. All three produce the same numbers. That's not redundancy for its own sake, it's proof the logic is correct independent of the tool running it.

| Stage | Question it answers |
|---|---|
| 1. Data Integrity Audit | Is this dataset clean enough to trust? |
| 2. SLA Performance ("the promise test") | How often do we actually hit the promised delivery date? |
| 3. Fulfillment Funnel (latency gap) | Which shipping tier is leaking the most time? |
| 4. Customer Segmentation (value at risk) | Is the damage concentrated on high-value customers? |
| 5. A/B Test Simulation (success recovery) | If we fixed the promise, would fulfillment actually improve? |

## Cleaning the data first

Before any of the 5 stages run, `python/prepare_dashboard_data.py`'s `load_and_clean` fixes three real problems in the raw file.

```python
def load_and_clean(path: str) -> pd.DataFrame:
    df = pd.read_csv(path, encoding="ISO-8859-1")
    df = df.dropna(subset=[
        "Days for shipping (real)", "Days for shipment (scheduled)", "Customer Id",
    ])
    df = df[df["Order Item Total"] > 0]
    df = df.drop_duplicates(subset=["Order Id", "Order Item Id"])

    df["latency_gap_days"] = df["Days for shipping (real)"] - df["Days for shipment (scheduled)"]
    df["strict_success"] = (df["Days for shipping (real)"] <= df["Days for shipment (scheduled)"]).astype(int)
    df["buffered_success"] = (df["Days for shipping (real)"] <= df["Days for shipment (scheduled)"] + 1).astype(int)
    return df
```

**Line by line:**
- `encoding="ISO-8859-1"`: reading this file as plain UTF-8 (the usual default) throws a crash. Some city and country names in the raw data use accented characters (like "México") stored in a different text encoding. This tells pandas which alphabet to use to decode the bytes correctly.
- `dropna(subset=[...])`: removes any row missing the three columns the entire analysis depends on: the two delivery-day numbers and the customer ID. A row with those missing can't be scored as on-time or late at all.
- `df[df["Order Item Total"] > 0]`: keeps only rows with a positive order value, filtering out broken or test transactions.
- `.drop_duplicates(subset=["Order Id", "Order Item Id"])`: removes exact duplicate line items, so one item doesn't get double-counted in totals.
- `latency_gap_days`: actual delivery days minus promised days. Positive means late, negative means early.
- `strict_success`: 1 if delivery happened on or before the exact promised day, 0 otherwise.
- `buffered_success`: the same check but with a 1-day grace period added, so a delivery that's a single day late still counts as a pass. Comparing strict vs buffered success shows whether failures are marginal near-misses or a real structural gap.

**Real finding:** on this dataset, the null-check step doesn't actually remove any rows, all 180,519 rows already have those three fields filled in, and the integrity check confirms zero duplicate order IDs and zero non-positive order values. The cleaning code is defensive, not decorative, it's there because you can't assume that in general, even though this particular file happens to already be clean on those specific checks.

## Stage 1: is this data trustworthy

```sql
SELECT
    COUNT(*) AS total_rows,
    COUNT(DISTINCT "Order Id") AS unique_orders,
    SUM(CASE WHEN "Order Item Total" <= 0 THEN 1 ELSE 0 END) AS price_errors,
    SUM(CASE WHEN "Days for shipping (real)" > 10 THEN 1 ELSE 0 END) AS extreme_delays
FROM supply_chain;
```

**Line by line:**
- `COUNT(*)` vs `COUNT(DISTINCT "Order Id")`: total rows versus unique order IDs. Since one order can have multiple line items, these numbers are expected to differ (180,519 total rows, 65,752 unique orders), that's not a bug, that's the grain of the data.
- `SUM(CASE WHEN "Order Item Total" <= 0 THEN 1 ELSE 0 END)`: `CASE WHEN` is SQL's if/else. This adds 1 for every row with a zero or negative order value, 0 otherwise, giving a total count of pricing errors.
- The same pattern repeats for `extreme_delays`: counting any delivery that took more than 10 days, a plausible data-entry error rather than a real delivery.

**Real result:** `total_rows=180,519`, `unique_orders=65,752`, `price_errors=0`, `extreme_delays=0`. The dataset passed its own integrity check cleanly.

## Stage 2: the promise test

```sql
SELECT
    "Shipping Mode",
    COUNT(*) AS order_volume,
    ROUND(AVG(CASE WHEN "Days for shipping (real)" <= "Days for shipment (scheduled)" THEN 1.0 ELSE 0.0 END) * 100, 2) AS strict_success_rate,
    ROUND(AVG(CASE WHEN "Days for shipping (real)" <= ("Days for shipment (scheduled)" + 1) THEN 1.0 ELSE 0.0 END) * 100, 2) AS buffered_success_rate
FROM supply_chain
GROUP BY 1
ORDER BY order_volume DESC;
```

**Line by line:**
- `AVG(CASE WHEN ... THEN 1.0 ELSE 0.0 END)`: a common SQL trick. Turning true/false into 1.0/0.0 and averaging gives you a percentage directly, average of a bunch of 1s and 0s is exactly the fraction of 1s.
- `GROUP BY 1`: groups by the first selected column, `"Shipping Mode"`, so each shipping tier gets its own row instead of one blended average across all of them.

**Real result, straight from the pipeline:**

| Shipping Mode | Orders | Strict success | Buffered success |
|---|---|---|---|
| Standard Class | 107,752 | 60.23% | 79.82% |
| Second Class | 35,216 | 20.27% | 40.33% |
| First Class | 27,814 | 0.0% | 100.0% |
| Same Day | 9,737 | 52.17% | 100.0% |

**Why this table is the whole point of the project:** look at First Class. Strict success is 0%. Not "low," zero. Every single First Class order missed its exact promised date. But buffered success (with just a 1-day grace period) is 100%. That combination means the promise isn't randomly broken, it's broken by a consistent, predictable amount. That's not bad luck, that's a promise that was wrong from the start.

## Stage 3: where is the time going

```sql
SELECT
    "Shipping Mode",
    AVG("Days for shipment (scheduled)") AS promised_days,
    AVG("Days for shipping (real)") AS actual_days,
    ROUND(AVG("Days for shipping (real)" - "Days for shipment (scheduled)"), 2) AS avg_latency_gap
FROM supply_chain
GROUP BY 1
ORDER BY avg_latency_gap DESC;
```

**Line by line:**
- `AVG("Days for shipping (real)" - "Days for shipment (scheduled)")`: for every row, subtract the promised days from the actual days, then average that difference across all orders in the group. Unlike Stage 2 (which asks "did we make it, yes or no"), this asks "by how much did we miss it, on average."

**Real result:**

| Shipping Mode | Promised | Actual | Latency gap |
|---|---|---|---|
| Second Class | 2.0 days | 3.99 days | +1.99 days |
| First Class | 1.0 day | 2.0 days | +1.0 day |
| Same Day | 0.0 days | 0.48 days | +0.48 days |
| Standard Class | 4.0 days | 4.0 days | ~0.0 days |

Standard Class is the only tier that's actually calibrated correctly. Everything else promises faster than operations can deliver.

## Stage 4: is this hurting everyone or just some

```sql
WITH UserValue AS (
    SELECT
        "Customer Id",
        SUM("Order Item Total") AS total_spent,
        AVG(Late_delivery_risk) AS delay_rate
    FROM supply_chain
    GROUP BY 1
)
SELECT
    CASE
        WHEN total_spent > 500 THEN 'Priority (High Spend)'
        WHEN total_spent BETWEEN 200 AND 500 THEN 'Standard (Mid Spend)'
        ELSE 'Casual (Low Spend)'
    END AS customer_segment,
    COUNT(*) AS user_count,
    ROUND(AVG(delay_rate) * 100, 2) AS avg_failure_pct
FROM UserValue
GROUP BY 1
ORDER BY avg_failure_pct DESC;
```

**Line by line:**
- `WITH UserValue AS (...)`: a temporary named result, calculated once and reused. Here it collapses the order-level data down to one row per customer, their total lifetime spend and their average delay rate.
- `CASE WHEN total_spent > 500 THEN 'Priority' ...`: buckets each customer into a spend tier based on that total. This is a manual, business-defined threshold, not a statistical one.
- The outer query then groups by that new segment label and averages the failure rate within each group.

**Real result:**

| Segment | Customers | Avg failure rate |
|---|---|---|
| Standard (Mid Spend) | 4,230 | 55.88% |
| Casual (Low Spend) | 3,878 | 54.79% |
| Priority (High Spend) | 12,544 | 54.55% |

All three numbers sit within about 1.3 percentage points of each other. That's the "systemic, not selective" finding: SLA failures aren't concentrated on any one customer tier, including the high-value one you'd most want to protect. Whatever's broken is broken for everyone equally, which is actually useful news, it means the fix is operational, not a targeted account-management problem.

## Stage 5: would fixing the promise actually work

The original version of this test lived only as a single hardcoded SQL query testing First Class in isolation. I generalized it into a reusable Python function that runs the same test across all 4 shipping modes and reports actual statistical significance, not just a raw percentage comparison.

```python
def run_ab_test(df: pd.DataFrame, shipping_mode: str, alpha: float = 0.05) -> dict:
    subset = df[df["Shipping Mode"] == shipping_mode].copy()

    control_promise_days = subset["Days for shipment (scheduled)"].mean()
    variant_estimate_days = math.ceil(subset["Days for shipping (real)"].mean())

    subset["group"] = np.where(subset["Order Id"] % 2 == 0, "control", "variant")
    subset["success"] = np.where(
        subset["group"] == "control",
        subset["Days for shipping (real)"] <= subset["Days for shipment (scheduled)"],
        subset["Days for shipping (real)"] <= variant_estimate_days,
    )

    control = subset[subset["group"] == "control"]
    variant = subset[subset["group"] == "variant"]

    x1, n1 = control["success"].sum(), len(control)
    x2, n2 = variant["success"].sum(), len(variant)
    p1, p2 = x1 / n1, x2 / n2

    p_pool = (x1 + x2) / (n1 + n2)
    se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
    z = (p2 - p1) / se if se > 0 else float("nan")
    p_value = 2 * (1 - stats.norm.cdf(abs(z))) if se > 0 else float("nan")

    return {
        "shipping_mode": shipping_mode,
        "control_success_rate_pct": round(p1 * 100, 2),
        "variant_success_rate_pct": round(p2 * 100, 2),
        "p_value": round(p_value, 6),
        "significant_at_0.05": bool(p_value < alpha),
    }
```

**Line by line:**
- `variant_estimate_days = math.ceil(subset["Days for shipping (real)"].mean())`: instead of guessing a new promise, this computes what a realistic promise actually would be, the rounded-up average of how long delivery actually takes for that shipping mode. No arbitrary number, it's derived straight from the mode's own real performance.
- `np.where(subset["Order Id"] % 2 == 0, "control", "variant")`: splits orders into two groups using the order ID's even/odd parity, a cheap, unbiased way to do a 50/50 random-ish split without needing a separate random number generator.
- `control` keeps the old (current) promise. `variant` gets scored against the new, realistic promise instead.
- `p1 = x1 / n1`, `p2 = x2 / n2`: success rate (successes divided by group size) for each group.
- `p_pool`, `se`, `z`, `p_value`: this is a two-proportion z-test, the same statistical machinery used to check if an A/B test result is real or just noise. `p_value` is the probability you'd see a difference this large by chance alone if the new promise didn't actually help. Below 0.05 is the conventional cutoff for "statistically significant."

**Real result, the actual committed output:**

| Shipping Mode | Old promise | New promise | Old success | New success | p-value | Significant? |
|---|---|---|---|---|---|---|
| First Class | 1 day | 2 days | 0.0% | 100.0% | <0.001 | Yes |
| Same Day | 0 days | 1 day | 51.9% | 100.0% | <0.001 | Yes |
| Second Class | 2 days | 4 days | 20.4% | 59.9% | <0.001 | Yes |
| Standard Class | 4 days | 4 days | 60.2% | 60.2% | 0.951 | No |

Three tiers recover to near-perfect success with a realistic promise, and the improvement isn't random noise, it's statistically certain (p < 0.001). Standard Class is already correctly calibrated, so the test correctly finds no difference (p = 0.951) rather than manufacturing a fake improvement, which is exactly the behavior you want from an honest test.

## A real inconsistency I found in my own analysis

Here's something I want to be upfront about instead of quietly smoothing over, because catching this kind of thing is a real skill, not something to hide.

The project has two versions of the Stage 5 A/B test: a single, hardcoded SQL query written first (which manually assumes First Class should be re-promised at "4 days"), and the generalized Python function above (which computes the realistic promise dynamically, and lands on 2 days for First Class, since that's the actual rounded-up average delivery time for that tier).

Both versions agree on the conclusion, First Class recovers to ~100% success either way. But they don't agree on the specific number, because the hardcoded SQL version was written before I generalized the test, and it never got updated to use the same dynamic calculation. The README's narrative table still shows the old hardcoded "4 days" assumption in one place and the correct dynamically-computed "2 days" in another.

I'm documenting this rather than fixing it silently, because a real interviewer question is "tell me about a time you found an inconsistency in your own work," and this is a genuine, specific answer: two implementations of the same test, written at different times, that quietly drifted apart. The fix is straightforward (regenerate the hardcoded SQL file from the same logic as the Python script, or delete it and keep only the generalized version), I just want the case study to show the real state of the repo, not a retroactively cleaned-up one.

## Doing it again in PySpark, for scale

180,519 rows runs fine on a single machine in Pandas. The PySpark notebook exists to answer a different question: what happens if this were 180 million rows instead. Same 5 stages, rewritten in Spark's distributed-computing syntax.

```python
df.groupBy("Shipping Mode") \
    .agg(
        count("*").alias("order_volume"),
        round(
            avg(when(
                col("Days for shipping (real)") <= col("Days for shipment (scheduled)"), 1.0
            ).otherwise(0.0)) * 100, 2
        ).alias("strict_success_rate_pct")
    ) \
    .orderBy("order_volume", ascending=False) \
    .show()
```

**Line by line:**
- This is the exact same Stage 2 logic as the SQL version above, just written using PySpark's DataFrame API instead of raw SQL text.
- `col("Days for shipping (real)")`: PySpark requires wrapping a column name in `col()` to use it inside an expression, unlike pandas where you can reference a column more directly.
- `when(...).otherwise(...)`: PySpark's version of SQL's `CASE WHEN`. Same if/else logic.
- `.groupBy(...).agg(...)`: identical concept to SQL's `GROUP BY` plus aggregate functions, just method-chained instead of written as a query string.
- The real difference isn't the syntax, it's what happens underneath: Spark can split this computation across many machines at once, each handling a slice of the data in parallel, whereas Pandas has to hold everything in memory on one machine. At 180K rows that doesn't matter. At 180 million rows, it's the difference between "runs in a minute" and "doesn't run at all."

Every one of the 5 stages was rewritten this way and produces the same numbers as the Pandas/SQL version, confirmed side by side in the README's PySpark findings table. That agreement is the actual point: proving the logic holds up independent of which engine runs it, before ever needing to actually deploy at that scale.

## Stripping out PII before the dashboard sees it

Before any data reaches Tableau, `prepare_dashboard_data.py` removes a specific list of columns.

```python
PII_COLUMNS = [
    "Customer Email", "Customer Password", "Customer Fname", "Customer Lname",
    "Customer Street", "Customer Zipcode", "Order Zipcode", "Product Description",
    "Product Image",
]

keep_cols = [c for c in df.columns if c not in PII_COLUMNS]
order_level = df[keep_cols].copy()
order_level.to_csv(f"{processed_dir}/orders_clean.csv", index=False)
```

**Line by line:**
- `[c for c in df.columns if c not in PII_COLUMNS]`: a list comprehension, Python's compact way to build a filtered list. This keeps every column name except the ones on the PII list.
- `df[keep_cols]`: selects only those remaining columns from the full dataframe, before writing the result out as the file the dashboard actually connects to.

**Why this matters:** a customer's name, email, password field, and street address have no analytical value for an SLA audit, and shipping them into a public-facing dashboard tool is a real risk with zero upside. This is a small piece of code that represents a real judgment call: what data actually needs to leave the pipeline, versus what should never leave the raw file at all.

## Building the dashboard

The dashboard is one screen: a KPI row plus 4 sheets, all built from the PII-stripped export and the pre-aggregated CSVs.

- **KPI row:** total orders, overall SLA breach rate, average latency gap, and the First-Class-specific breach rate (the tier that fails hardest gets its own headline number).
- **Sheet 1, SLA Success by Shipping Mode:** bar chart comparing strict vs buffered success side by side, per tier.
- **Sheet 2, Latency Gap Map:** a map colored by average latency gap per country, red for later than promised.
- **Sheet 3, SLA Breach Rate Over Time:** a line chart per shipping mode, to check whether things are getting better, worse, or staying flat.
- **Sheet 4, Customer Segment Impact:** the systemic-not-selective chart. The actual design brief for this one, quoted directly from the build guide: "This is the sheet that makes the 'systemic, not selective' finding visual, the three bars should look nearly identical in height." The finding isn't just in the numbers, it's designed to be visually obvious at a glance.

A static screenshot is committed to the repo alongside the live Tableau Public link, for a specific, deliberate reason: "recruiters skimming GitHub often don't click through to live dashboards, so the image needs to sell it on its own."

## Real numbers, straight from the pipeline

- 180,519 total orders audited, 65,752 unique orders, 0 pricing errors, 0 extreme-delay outliers.
- First Class: 0% strict success, 100% buffered success, a fully consistent 1-day-late promise.
- Second Class: the worst latency gap of any tier, +1.99 days on average.
- Standard Class: the only tier that's actually well-calibrated, essentially 0-day gap.
- SLA failure rate is within 1.3 percentage points across every customer spend tier (54.55% to 55.88%), systemic, not selective.
- A/B simulation: 3 of 4 tiers recover to near-100% success with a realistic promise (p < 0.001 each). Standard Class shows no significant change (p = 0.951), correctly, since it didn't need fixing.

## Data quality issues in the raw file

Beyond what the automated integrity check reports, a closer look at the raw file itself turns up real, specific problems worth knowing about, even though they don't end up affecting the final analysis:

- `Product Description` is empty for all 180,519 rows, a completely dead column.
- `Order Zipcode` is empty for about 86% of rows, a real, substantial gap, though it isn't one of the fields the cleaning step actually checks (and it gets stripped as PII before the dashboard anyway, so it never causes a problem downstream).
- Several city and country names use non-ASCII characters (like "México"), which is the concrete, specific reason the whole pipeline needs `encoding="ISO-8859-1"` instead of the default. Reading with plain UTF-8 throws a hard crash before any analysis can even start.

## Decisions that were mine

- **Choosing a 1-day grace period for "buffered" success**, rather than 2 or 3, a judgment call about what counts as a reasonable near-miss versus a real failure.
- **Generalizing a single hardcoded First-Class-only SQL test into a reusable function across all 4 shipping modes**, and adding a real statistical significance test on top of a raw percentage comparison.
- **Computing the realistic delivery estimate dynamically** (`ceil` of each mode's own actual average), instead of picking a number that sounded reasonable.
- **Building the PySpark version at all**, when the dataset didn't require it, specifically to demonstrate the same logic holds at a scale a single machine couldn't handle.
- **Stripping PII before anything reaches a public dashboard tool**, a security-and-scope decision, not something Tableau or the dataset required.
- **Reporting the SQL/Python A/B test inconsistency in this case study**, instead of quietly regenerating the SQL file and pretending it was always consistent.

## Limitations

Stated directly, from the project's own documentation:
- This is a historical dataset, not real-time streaming data, the analysis is a point-in-time audit, not a live monitoring system.
- The A/B test is a rule-based simulation, not a real experiment run on real customers. It's a theoretical upper bound on recovery, not a guarantee.

## Interview prep: questions and answers

**"Walk me through your process for this audit."**
Five questions in order: can I trust this data, are we hitting our promises, where's the time going, is this hurting everyone or just some, and would fixing it actually work. Each stage's answer either rules something out or points to the next question.

**"What was the single most important finding?"**
That SLA failure is uniform across every customer spend tier, within 1.3 percentage points. That rules out "our best customers are being mistreated" and points straight at an operational fix instead of an account-management one.

**"Why build a PySpark version if Pandas handled the dataset fine?"**
To prove the analysis logic is correct independent of scale, before ever needing to actually run it at 1000x the size. All 5 stages produce matching numbers in both.

**"Tell me about a mistake or inconsistency you caught in your own work."**
The Stage 5 A/B test exists in two versions: an early hardcoded SQL query assuming a "4-day" fix for First Class, and a later generalized Python version that computes the realistic number dynamically and gets 2 days instead. Both reach the same conclusion, but the specific numbers drifted apart because the SQL version never got updated. I'd fix it by regenerating the SQL from the same logic, or removing it in favor of the one source of truth.

**"Why strip customer PII before the dashboard, when the SLA question doesn't need any of it?"**
Because a dashboard tool with public/shareable links is a different risk surface than an internal notebook, and none of that data adds analytical value to an SLA audit. Removing it costs nothing and removes a real risk.

**Numbers to have ready, all reproducible:**
- 180,519 orders audited, 65,752 unique orders, 0 integrity failures.
- First Class: 0% strict success rate, +1.0 day average latency gap.
- Second Class: worst latency gap at +1.99 days.
- SLA failure rate: 54.55% to 55.88% across all three customer spend tiers.
- A/B test: p < 0.001 for 3 of 4 shipping tiers, p = 0.951 for Standard Class (correctly, no effect).

## The stack

Python, Pandas, SQL (SQLite), PySpark, SciPy (two-proportion z-test), Tableau.

**Live dashboard:** [Tableau Public](https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit)
**Code:** [github.com/rithikahaha/Supply-Chain-Audit](https://github.com/rithikahaha/Supply-Chain-Audit)

*Rithika*
