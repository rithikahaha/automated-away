# I Audited 180,519 Orders and Found a Promise That Was Broken 100% of the Time

**The short version:** every checkout page promises a delivery date. Almost nobody actually checks, at scale, whether operations can keep that promise. I audited 180,519 real orders and found one shipping tier that missed its promised date every single time, for every single customer, no exceptions. Here's how I found it, proved a fix would work, and one honest mistake I caught in my own analysis along the way.

The dataset is a public supply chain dataset with four shipping tiers, Same Day, First Class, Second Class, and Standard Class, each with its own promised delivery window. I ran the same five-question audit against all of it: is this data even trustworthy, are we hitting our promises, where exactly is the time being lost, is the damage hitting some customers harder than others, and if I fixed the promise, would that fix actually work. I did the analysis three separate ways (two Python-based methods and one built to run across multiple machines at once for scale) specifically so I could check they all agreed before trusting any of it.

## Step 1: is the data even trustworthy

Before trusting a single number, I checked the basics: how many orders, how many of those are actual duplicates, how many have obviously broken values (negative prices, absurd delivery times). Out of 180,519 rows, zero pricing errors and zero extreme outliers. Clean enough to build on.

## Step 2: are we actually hitting our promises

This is the core question, phrased as a simple database check: for each shipping tier, what percentage of orders arrived on or before the date we promised the customer?

```sql
SELECT "Shipping Mode",
  ROUND(AVG(CASE WHEN "Days for shipping (real)" <= "Days for shipment (scheduled)"
    THEN 1.0 ELSE 0.0 END) * 100, 2) AS strict_success_rate
FROM supply_chain
GROUP BY 1
```

First Class scored **0%.** Not low. Zero. Every single First Class order missed its exact promised date, typically arriving in about 2 days against a 1-day promise. But when I allowed just a single extra day of grace, success jumped straight to 100%. That combination is the real story: this isn't random bad luck spread around unevenly, it's a promise that was simply wrong by a consistent amount from day one. Standard Class, on the other end, was already almost perfectly calibrated.

## Step 3: is this hurting everyone, or just some customers

Before recommending any fix, I needed to know something important: is this failure concentrated on high-value customers (which would need urgent, targeted attention) or spread evenly across everyone (an operations problem, not a customer-relationship one)?

```sql
SELECT
  CASE WHEN total_spent > 500 THEN 'Priority'
       WHEN total_spent BETWEEN 200 AND 500 THEN 'Standard'
       ELSE 'Casual' END AS segment,
  ROUND(AVG(delay_rate) * 100, 2) AS avg_failure_pct
FROM UserValue
GROUP BY 1
```

All three customer spending tiers failed within 1.3 percentage points of each other, between 54.55% and 55.88%. That ruled out "our best customers are being singled out for bad service" and pointed the fix squarely at operations: fix the promise for everyone, not just the VIPs.

## Step 4: proving a fix would actually work

It's one thing to notice a promise is broken. It's another to prove that fixing it would actually help, instead of just assuming it would. I tested it properly (a two-proportion significance test, a formal check for whether an improvement is real or could be a coincidence) across all four shipping tiers, comparing the old promise against a realistic new one calculated from each tier's own actual delivery speed:

| Shipping Mode | Old promise | New promise | Old success | New success | Confidence it's real |
|---|---|---|---|---|---|
| First Class | 1 day | 2 days | 0.0% | 100.0% | over 99.9% |
| Second Class | 2 days | 4 days | 20.4% | 59.9% | over 99.9% |
| Standard Class | 4 days | 4 days | 60.2% | 60.2% | no change needed |

Three tiers recover to near-perfect success, and the test says that improvement is essentially certain to be real, not a coincidence. Standard Class correctly shows no change is needed, because it was already fine. A test that only ever tells you what you wanted to hear isn't actually a test, and getting an honest "no difference" on the one tier that didn't need fixing is exactly what made me trust the result on the other three.

## Doing it all again, at a much bigger scale

I also rebuilt the entire analysis using a tool built for splitting work across many computers at once (PySpark), not because 180,519 rows needed it, a single laptop handles that fine, but to prove the exact same logic would still hold if this were 180 million rows instead. Every number came out identical between the two versions. That agreement was the actual point: proving the analysis is correct on its own terms, before scale ever becomes a real problem to solve.

## The mistake I caught in my own analysis

Here's something worth being honest about instead of quietly fixing and never mentioning: I found two different versions of the fix-the-promise test buried in the project. An early one I wrote by hand assumed First Class should be re-promised at "4 days." A later, more careful version calculates that number automatically instead of assuming it, and it actually lands on 2 days, not 4. Both versions agree on the big picture (First Class needed fixing, and fixing it works), but they disagree on the specific number, because I never went back and updated the first version after building the better one.

Two versions of the same test quietly drifting apart is exactly the kind of thing that should never happen, and I'm choosing to point it out rather than clean it up and pretend it was always consistent. Catching your own drift, in my opinion, is a more useful skill to show than never having any.

## What this actually delivered

An interactive dashboard with a summary of key numbers up top, a map showing where delays are worst geographically, and a chart deliberately designed so the three customer-segment bars look nearly identical in height, because that visual sameness *is* the finding: this problem is systemic, not selective. Two honest limitations worth naming: this is a snapshot of historical data, not a live feed, and the fix I tested is a simulation based on real numbers, a strong signal, not a guarantee from an actual live experiment.

**Live dashboard:** [Tableau Public](https://public.tableau.com/app/profile/rithika.h8756/viz/SupplyChainSLAAudit/SupplyChainSLAAudit)
**Code:** [github.com/rithikahaha/Supply-Chain-Audit](https://github.com/rithikahaha/Supply-Chain-Audit)
