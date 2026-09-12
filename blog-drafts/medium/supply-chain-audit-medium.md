# I Audited 180,519 Orders and Found a Promise That Was Broken 100% of the Time

Checkout pages promise a delivery date. Almost nobody checks, at scale, whether operations can actually keep it. I ran a 5-stage audit across 180,519 real orders across 4 shipping tiers to find out. Here's what each stage found, and one honest inconsistency I caught in my own analysis.

## 📋 The 5 stages

- **Stage 1, Data Integrity**: is this dataset even trustworthy
- **Stage 2, The Promise Test**: how often do we actually hit the promised date
- **Stage 3, Latency Gap**: which tier is leaking the most time
- **Stage 4, Customer Segmentation**: is the damage hitting everyone, or just some
- **Stage 5, A/B Test Simulation**: would fixing the promise actually work

Every stage is implemented 3 ways, standalone SQL, a Pandas notebook, and a PySpark rewrite, and all 3 agree on the numbers.

## Stage 1: Data Integrity

```sql
SELECT COUNT(*) AS total_rows,
       COUNT(DISTINCT "Order Id") AS unique_orders,
       SUM(CASE WHEN "Order Item Total" <= 0 THEN 1 ELSE 0 END) AS price_errors
FROM supply_chain
```

**Explanation:**
- 180,519 rows, 65,752 unique orders, 0 pricing errors, 0 extreme-delay outliers
- Clean enough to trust every downstream number

## Stage 2: The Promise Test

```sql
SELECT "Shipping Mode",
  ROUND(AVG(CASE WHEN "Days for shipping (real)" <= "Days for shipment (scheduled)"
    THEN 1.0 ELSE 0.0 END) * 100, 2) AS strict_success_rate
FROM supply_chain
GROUP BY 1
```

**Explanation:**
- First Class: **0% strict success**. Not low, zero. Every single order missed its 1-day promise, arriving in about 2 days
- With a 1-day grace period, that same tier jumps to 100% success
- That combination means the promise wasn't randomly broken, it was wrong by a consistent amount from day one
- Standard Class was the only tier already correctly calibrated

## Stage 4: Systemic, Not Selective

```sql
SELECT
  CASE WHEN total_spent > 500 THEN 'Priority'
       WHEN total_spent BETWEEN 200 AND 500 THEN 'Standard'
       ELSE 'Casual' END AS segment,
  ROUND(AVG(delay_rate) * 100, 2) AS avg_failure_pct
FROM UserValue
GROUP BY 1
```

**Explanation:**
- All 3 customer spend tiers failed within 1.3 percentage points of each other (54.55% to 55.88%)
- That rules out "our best customers are being mistreated" and points the fix at operations, not account management

## Stage 5: Proving the Fix Works

A two-proportion z-test across all 4 shipping tiers, comparing the current promise against a realistic one computed from each tier's own actual delivery time:

| Shipping Mode | Old promise | New promise | Old success | New success | p-value |
|---|---|---|---|---|---|
| First Class | 1 day | 2 days | 0.0% | 100.0% | <0.001 |
| Second Class | 2 days | 4 days | 20.4% | 59.9% | <0.001 |
| Standard Class | 4 days | 4 days | 60.2% | 60.2% | 0.951 |

**Explanation:**
- 3 tiers recover to near-certain success, statistically significant at p < 0.001
- Standard Class correctly shows no change needed, since it was already calibrated
- A test that only ever confirms what you expected isn't a test, the clean null result here is what makes the other 3 trustworthy

## The scale check: PySpark

Every stage also runs as a PySpark rewrite, code built to split work across many machines at once.

```python
df.groupBy("Shipping Mode").agg(
    round(avg(when(col("Days for shipping (real)") <=
        col("Days for shipment (scheduled)"), 1.0).otherwise(0.0)) * 100, 2)
    .alias("strict_success_rate_pct")
).show()
```

**Explanation:**
- Same exact logic as the SQL version, just written to run across a cluster instead of one machine
- Not needed at 180K rows, Pandas handles that fine, this exists to prove the logic holds at 180 million rows before scale is ever a real constraint
- Every stage produces identical numbers in both versions

## The inconsistency I found in my own work

**Explanation:**
- The project has 2 versions of the Stage 5 test: an early hardcoded SQL query assuming First Class needed a "4-day" fix, and the generalized Python version above, which computes 2 days dynamically instead
- Both agree on the conclusion. They disagree on the specific number, because the SQL version predates the generalization and was never updated
- I'm documenting this rather than quietly patching it, catching your own drift is worth more than pretending it never happened
- Fix: regenerate the SQL from the same logic, or delete it in favor of one source of truth

## ✨ Conclusion

An interactive dashboard shipped from this, KPI row, a regional delay map, and a chart specifically built so the 3 customer-segment bars look nearly identical in height, because that visual sameness is the finding. Two honest limits: this is historical data, not a live feed, and the A/B test is a simulation, a strong signal, not a guaranteed result from a real experiment.

**Live dashboard:** [Tableau Public](https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit)
**Code:** [github.com/rithikahaha/Supply-Chain-Audit](https://github.com/rithikahaha/Supply-Chain-Audit)
