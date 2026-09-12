# Only 3.12% of Customers Ever Buy Again: What a Cohort Analysis Actually Found

I expected the usual retention story on this one, customers drifting away gradually. A cohort analysis (grouping customers by when they first bought something, then tracking who comes back) on 99,440 real Olist orders, a Brazilian e-commerce marketplace, showed a cliff instead. Here's the full pipeline: the architecture, every analysis, both models, and 2 places where I had two honest, competing answers instead of one clean one. No coding background needed, every technical term gets a plain-English explanation the moment it shows up.

## What this project does

- A serverless pipeline on Amazon's cloud (AWS): files sit in cheap cloud storage (S3), a tool automatically reads and catalogs their structure (Glue), and a query service (Athena) lets you ask database-style questions directly against those files, no server running 24/7 required
- 7 statistical analyses: revenue trends, customer segmentation, payments, geography, satisfaction, cohort retention, RFM scoring
- 3 machine learning models (software that learns patterns from past examples to make predictions on new ones): delivery-delay prediction, review-score prediction, and a model that groups similar customers together on its own
- A live interactive dashboard, plus a 5-page Power BI report
- Automated checks that run on every code change, catching a broken pipeline before it ships

## Joining the data

```python
df = (orders
      .merge(payments, on='order_id', how='inner')
      .merge(customers, on='customer_id', how='inner')
      .merge(reviews[['order_id', 'review_score']], on='order_id', how='left'))
```

- A "join" combines two tables using a shared ID column, like a very literal version of Excel's VLOOKUP. An "inner" join only keeps rows that match on both sides, used here for payments and customers, an order with no matching payment can't have revenue computed anyway
- A "left" join keeps every row from the first table even without a match, used for reviews, since a missing review shouldn't drop an otherwise valid order

## Customer value, the simple way

```python
clv['value_segment'] = pd.qcut(clv['total_spent'], q=4, labels=['Low', 'Medium', 'High', 'VIP'])
```

- `pd.qcut` sorts every customer by total spend, then slices that sorted line into 4 equal-sized groups
- Not a fixed dollar rule, "top 25% of spenders" no matter what dollar amount that happens to be

## The retention cliff

```python
df_cohort['period'] = df_cohort['order_month'].astype(int) - df_cohort['cohort'].astype(int)
retention_rates = cohort_pivot.div(cohort_sizes, axis=0) * 100
```

- Groups customers by the month of their first purchase, tracks what fraction of each cohort is still buying in later months
- Result: nearly every cohort drops to close to 0% by month 1. Not a decline, a cliff
- Only 3.12% of all customers ever place a second order, period
- Reframes the whole strategy: this isn't a business fighting gradual churn, it's a marketplace where almost nobody becomes a repeat buyer at all, likely because there's no single-brand relationship pulling anyone back
- The highest-leverage fix is converting first-time buyers into second-time buyers at all, not slowing a decay that barely exists to slow

## Does satisfaction predict loyalty

```python
correlation = repeat_customers['review_score'].corr(repeat_customers['num_orders'])
# r ≈ 0.038
```

- Essentially zero. A happy customer is not meaningfully more likely to come back
- Combined with the retention cliff, this points at something structural about a multi-seller marketplace, not dissatisfaction, driving the lack of repeat purchases

## RFM: two ways to rank your best customers, two different answers

RFM stands for Recency, Frequency, Monetary, how recently, how often, and how much someone bought. Below are two separate ways of using those three signals to rank customers, and they disagreed with each other.

```python
rfm['r_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1])
rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), q=5, labels=[1, 2, 3, 4, 5])
rfm['rfm_score'] = rfm['r_score'].astype(int) + rfm['f_score'].astype(int) + rfm['m_score'].astype(int)
```

```python
rfm_scaled = StandardScaler().fit_transform(rfm[['recency', 'frequency', 'monetary']])
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
rfm['cluster'] = kmeans.fit_predict(rfm_scaled)
# silhouette score: 0.497
```

- The first method (quintile RFM) sorts customers and splits them into 5 equal groups per signal, then puts the top 20% overall into "Champion," averaging **2.1x** the overall spend
- The second method uses K-Means, an algorithm that finds natural groupings in data entirely on its own, no categories given in advance. `StandardScaler` first puts recency, frequency, and spend on equal footing, so spend (measured in hundreds of dollars) doesn't unfairly dominate over frequency (measured in single digits). This finds a much smaller, stricter cluster of genuine outliers, averaging nearly **7x**
- Both numbers are real, they're answering different questions, "top fifth" versus "genuine extremes"
- Reported both, with the method attached to each. An earlier informal "4x" estimate had circulated before either number was actually verified, and neither matched it

## Model 1: predicting late deliveries

```python
clf = RandomForestClassifier(n_estimators=200, max_depth=10, class_weight='balanced')
```

- A Random Forest is a model made of many small decision trees voting together, a common, solid choice for this kind of yes/no prediction
- Only about 8% of orders are actually late, so a naive model hits 92% accuracy by always predicting on-time, and catches zero real risk
- `class_weight='balanced'` forces the model to pay real attention to the rare late-order examples during training instead of ignoring them as noise
- Result: accuracy drops to 78.2% on purpose, but a ranking score called ROC-AUC lands at 0.737 (0.5 is a coin flip, 1 is perfect), and it catches over half of real late deliveries before they happen

## Model 2: predicting review scores

```python
reg = RandomForestRegressor(n_estimators=200, max_depth=10)
# r2 = 0.216, rmse = 1.14 stars
```

- This one predicts a number (a 1-to-5 star score) instead of a yes/no answer, so it's graded differently: R², a score from 0 to 1 for how much of the variation in review scores the model actually explains. 0.216 means about a fifth, modest, reported as modest
- The more useful output was a side effect: whether an order arrived late is, by far, the strongest single signal for a bad review, stronger than price or shipping cost
- Fixing delivery reliability likely moves customer satisfaction more than anything else measurable in this dataset

## Automated checks, without needing the real dataset

```python
tree = ast.parse(open("ecommerce_analysis.py").read())
functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
required = ["load_data", "build_analytical_dataset", "rfm_analysis", "cohort_retention_analysis"]
```

- This reads the code's own structure as plain text, without actually running it, like proofreading a recipe instead of cooking it, checking that key functions haven't been silently renamed or deleted
- Runs against a small made-up dataset built directly into the check itself, so the pipeline gets validated automatically with no real credentials and no 50MB download needed

## Other real numbers

- São Paulo alone drives 37.5% of total revenue
- 73.9% of transactions use credit card
- Every segmentation threshold recomputes fresh on each run, they're statistical patterns, not fixed business rules

## Conclusion

None of this needed a fancier model. It needed the model graded on the metric that matches the real cost of being wrong, and two honest segmentation methods reported side by side instead of collapsed into one flattering headline. A retention strategy built on "customers decline slowly" instead of "customers barely ever return" would have aimed every fix at the wrong problem.

**Live dashboard:** [rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline](https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/)
**Code:** [github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline](https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline)
