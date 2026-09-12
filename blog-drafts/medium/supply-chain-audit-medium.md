# I Audited 180,519 Orders and Found a Promise That Was Broken 100% of the Time

Checkout pages promise a delivery date. Almost nobody checks, at scale, whether fulfillment operations actually back that promise up. I ran a five-stage audit across 180,519 real supply chain orders to find out: is this data trustworthy, are we hitting our promises, where's the time going, is the damage concentrated on anyone in particular, and would fixing the promise actually work.

## The promise test

```sql
SELECT "Shipping Mode",
  ROUND(AVG(CASE WHEN "Days for shipping (real)" <= "Days for shipment (scheduled)"
    THEN 1.0 ELSE 0.0 END) * 100, 2) AS strict_success_rate
FROM supply_chain
GROUP BY 1
```

First Class: **0% strict success**. Not low, zero. Every single First Class order missed its exact promised date, arriving in about 2 days against a 1-day promise. But with a 1-day grace period, success jumps to 100%. That combination means the promise wasn't randomly broken, it was wrong by a consistent, predictable amount from day one. Standard Class, meanwhile, was the only tier already correctly calibrated, essentially a zero-day gap between promised and actual.

## Systemic, not selective

Before recommending a fix, I needed to know whether this was hurting everyone equally or concentrated on high-value customers, which would call for a completely different response.

```sql
SELECT
  CASE WHEN total_spent > 500 THEN 'Priority'
       WHEN total_spent BETWEEN 200 AND 500 THEN 'Standard'
       ELSE 'Casual' END AS segment,
  ROUND(AVG(delay_rate) * 100, 2) AS avg_failure_pct
FROM UserValue
GROUP BY 1
```

All three spend tiers failed within 1.3 percentage points of each other, 54.55% to 55.88%. That ruled out "our best customers are being mistreated" and pointed the fix at operations, recalibrating the promise, not a targeted account-management response.

## Proving the fix would work

A two-proportion z-test across all four shipping modes, comparing the current promise against a realistic one computed dynamically from each tier's own actual average delivery time:

| Shipping Mode | Old promise | New promise | Old success | New success | p-value |
|---|---|---|---|---|---|
| First Class | 1 day | 2 days | 0.0% | 100.0% | <0.001 |
| Second Class | 2 days | 4 days | 20.4% | 59.9% | <0.001 |
| Standard Class | 4 days | 4 days | 60.2% | 60.2% | 0.951 |

Three tiers recover to near-certain success. Standard Class correctly shows no significant change, because it didn't need one. A test that only ever confirms what you expected isn't a test.

## Same analysis, twice

Every stage also exists as a PySpark rewrite. Not because 180K rows needed it, Pandas handled that fine, but to prove the logic holds at 180 million rows before ever needing to run it there. Same groupby-and-average pattern, just written to run across a cluster instead of one machine, and it produces identical numbers to the SQL version stage for stage.

## The inconsistency I found in my own work

Worth admitting rather than quietly fixing: the project has two versions of the A/B test, an early hardcoded SQL query assuming First Class should be re-promised at "4 days," and the generalized Python function above, which computes the number dynamically and gets 2 days instead. Both agree on the conclusion. They disagree on the specific number, because the SQL version predates the generalization and never got updated. Two implementations of the same test drifting apart is exactly the kind of thing a single source of truth is supposed to prevent, and I hadn't enforced one here.

**Live dashboard:** [Tableau Public](https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit)
**Code:** [github.com/rithikahaha/Supply-Chain-Audit](https://github.com/rithikahaha/Supply-Chain-Audit)
