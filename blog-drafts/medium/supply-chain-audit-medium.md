# I Audited 180,519 Orders and Found a Promise That Was Broken 100% of the Time

Checkout pages promise a delivery date. Almost nobody checks, at scale, whether operations can actually keep it. I ran a 5-stage audit across 180,519 real orders and 4 shipping tiers to find out. Here's every stage, the actual code and numbers behind each, and one honest inconsistency I caught in my own analysis. Every technical term gets a quick plain-English gloss the first time it comes up, no coding background needed to follow along.

## The 5 stages

- **Stage 1, Data Integrity**: is this dataset even trustworthy
- **Stage 2, The Promise Test**: how often do we actually hit the promised date
- **Stage 3, Latency Gap**: which tier is leaking the most time
- **Stage 4, Customer Segmentation**: is the damage hitting everyone, or just some
- **Stage 5, A/B Test Simulation**: would fixing the promise actually work

Every stage is implemented 3 separate ways: standalone SQL (the language for asking questions of a database), a Python notebook, and a version rewritten for PySpark (a tool for splitting work across many computers at once, more on that below), and all 3 agree on the numbers, which is itself a sanity check.

## Cleaning the data first

```python
def load_and_clean(path):
    df = pd.read_csv(path, encoding="ISO-8859-1")
    df = df.dropna(subset=["Days for shipping (real)", "Days for shipment (scheduled)", "Customer Id"])
    df = df[df["Order Item Total"] > 0]
    df = df.drop_duplicates(subset=["Order Id", "Order Item Id"])
    return df
```

- Computers store text as numbers and translate them back using an agreed lookup table called an encoding. This file uses an older one (`ISO-8859-1`), several city and country names have accented characters, and reading it with the modern default crashes instead of guessing wrong
- Zero rows actually get dropped by the null-check here, all three critical columns were already clean, the check is defensive, not decorative

## Stage 1: Data Integrity

```sql
SELECT COUNT(*) AS total_rows,
       COUNT(DISTINCT "Order Id") AS unique_orders,
       SUM(CASE WHEN "Order Item Total" <= 0 THEN 1 ELSE 0 END) AS price_errors,
       SUM(CASE WHEN "Days for shipping (real)" > 10 THEN 1 ELSE 0 END) AS extreme_delays
FROM supply_chain
```

- 180,519 rows, 65,752 unique orders, 0 pricing errors, 0 extreme-delay outliers
- Clean enough to trust every downstream number

## Stage 2: The Promise Test

```sql
SELECT "Shipping Mode",
  ROUND(AVG(CASE WHEN "Days for shipping (real)" <= "Days for shipment (scheduled)"
    THEN 1.0 ELSE 0.0 END) * 100, 2) AS strict_success_rate,
  ROUND(AVG(CASE WHEN "Days for shipping (real)" <= "Days for shipment (scheduled)" + 1
    THEN 1.0 ELSE 0.0 END) * 100, 2) AS buffered_success_rate
FROM supply_chain
GROUP BY 1
```

| Shipping Mode | Orders | Strict success | Buffered success |
|---|---|---|---|
| Standard Class | 107,752 | 60.23% | 79.82% |
| Second Class | 35,216 | 20.27% | 40.33% |
| First Class | 27,814 | **0.0%** | 100.0% |
| Same Day | 9,737 | 52.17% | 100.0% |

- First Class: **0% strict success.** Not low, zero. Every single order missed its 1-day promise, arriving in about 2 days
- With a 1-day grace period, that same tier jumps to 100%, which means the promise wasn't randomly broken, it was wrong by a consistent amount from day one
- Standard Class was the only tier already correctly calibrated

## Stage 3: Where the Time Is Going

```sql
SELECT "Shipping Mode",
  AVG("Days for shipment (scheduled)") AS promised_days,
  AVG("Days for shipping (real)") AS actual_days,
  ROUND(AVG("Days for shipping (real)" - "Days for shipment (scheduled)"), 2) AS avg_latency_gap
FROM supply_chain
GROUP BY 1
```

| Shipping Mode | Promised | Actual | Gap |
|---|---|---|---|
| Second Class | 2.0 days | 3.99 days | +1.99 days |
| First Class | 1.0 day | 2.0 days | +1.0 day |
| Standard Class | 4.0 days | 4.0 days | ~0.0 days |

## Stage 4: Systemic, Not Selective

Before recommending a fix, I needed to know if the damage was concentrated on high-value customers (needing an urgent, targeted response) or spread evenly (an operations problem).

```sql
WITH UserValue AS (
    SELECT "Customer Id", SUM("Order Item Total") AS total_spent,
           AVG(Late_delivery_risk) AS delay_rate
    FROM supply_chain GROUP BY 1
)
SELECT
  CASE WHEN total_spent > 500 THEN 'Priority'
       WHEN total_spent BETWEEN 200 AND 500 THEN 'Standard'
       ELSE 'Casual' END AS segment,
  ROUND(AVG(delay_rate) * 100, 2) AS avg_failure_pct
FROM UserValue
GROUP BY 1
```

- All 3 customer spend tiers failed within 1.3 percentage points of each other, 54.55% to 55.88%
- Rules out "our best customers are being mistreated" and points the fix at operations, not account management

## Stage 5: Proving the Fix Works

It's one thing to notice a promise is broken. It's another to prove fixing it would actually help. This runs a significance test (a formal check for whether an improvement is real or could be a coincidence) across all 4 tiers:

```python
variant_estimate_days = math.ceil(subset["Days for shipping (real)"].mean())
p1, p2 = control["success"].mean(), variant["success"].mean()
p_pool = (x1 + x2) / (n1 + n2)
se = math.sqrt(p_pool * (1 - p_pool) * (1 / n1 + 1 / n2))
z = (p2 - p1) / se
p_value = 2 * (1 - stats.norm.cdf(abs(z)))
```

| Shipping Mode | Old promise | New promise | Old success | New success | p-value |
|---|---|---|---|---|---|
| First Class | 1 day | 2 days | 0.0% | 100.0% | <0.001 |
| Second Class | 2 days | 4 days | 20.4% | 59.9% | <0.001 |
| Standard Class | 4 days | 4 days | 60.2% | 60.2% | 0.951 |

- The new promise is computed dynamically per tier, the rounded-up average of that tier's own real delivery time, not a guessed number
- The "p-value" column is the odds this improvement could be a coincidence. Under 0.001 means less than a tenth of a percent chance, essentially certain it's real, for 3 of the 4 tiers
- Standard Class correctly shows no change needed (p-value 0.951, meaning "no detectable difference"), since it was already calibrated. A test that only ever confirms what you expected isn't a test, that honest null result is what makes the other 3 trustworthy

## Same Analysis, at Real Scale

```python
df.groupBy("Shipping Mode").agg(
    round(avg(when(col("Days for shipping (real)") <=
        col("Days for shipment (scheduled)"), 1.0).otherwise(0.0)) * 100, 2)
    .alias("strict_success_rate_pct")
).show()
```

- The exact same logic as the SQL version, rewritten to run across a cluster instead of one machine
- Not needed at 180K rows, Pandas handles that fine. This exists to prove the logic holds at 180 million rows before scale is ever a real constraint
- Every stage produces identical numbers in both versions

## Stripping Personal Data Before the Dashboard Sees It

```python
# PII = "personally identifiable information," anything that identifies a real person
PII_COLUMNS = ["Customer Email", "Customer Password", "Customer Fname",
               "Customer Lname", "Customer Street", "Customer Zipcode",
               "Order Zipcode", "Product Description", "Product Image"]
keep_cols = [c for c in df.columns if c not in PII_COLUMNS]
```

- None of this data has analytical value for an SLA audit, and shipping it into a public dashboard tool is pure downside
- A small line of code representing a real judgment call: what actually needs to leave the pipeline

## The Inconsistency I Found in My Own Work

- The project has 2 versions of the Stage 5 test: an early hardcoded SQL query assuming First Class needed a "4-day" fix, and the generalized Python version above, which computes 2 days dynamically instead
- Both agree on the conclusion. They disagree on the specific number, because the SQL version predates the generalization and was never updated
- Documenting this rather than quietly patching it, catching your own drift is worth more than pretending it never happened
- Fix: regenerate the SQL from the same logic, or delete it in favor of one source of truth

## Conclusion

An interactive dashboard shipped from this: a KPI row, a regional delay map, and a chart specifically built so the 3 customer-segment bars look nearly identical in height, because that visual sameness is the finding. Two honest limits, worth stating plainly: this is historical data, not a live feed, and the A/B test is a simulation, a strong signal, not a guaranteed result from a real experiment.

**Live dashboard:** [Tableau Public](https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit)
**Code:** [github.com/rithikahaha/Supply-Chain-Audit](https://github.com/rithikahaha/Supply-Chain-Audit)
