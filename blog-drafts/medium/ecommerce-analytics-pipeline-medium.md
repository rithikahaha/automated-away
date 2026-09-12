# Only 3.12% of Customers Ever Buy Again: What a Cohort Analysis Actually Found

I expected the usual retention story on this one, customers drifting away gradually. A cohort analysis on 99,440 real Olist orders, a Brazilian e-commerce marketplace, showed a cliff instead. Here's the full pipeline: the architecture, every analysis, both models, and 2 places where I had two honest, competing answers instead of one clean one.

## What this project does

- Serverless pipeline on AWS: S3 for storage, Glue to auto-catalog the schema, Athena to run SQL directly against the files, no server to maintain
- 7 statistical analyses: revenue trends, customer segmentation, payments, geography, satisfaction, cohort retention, RFM scoring
- 3 ML models: delivery-delay prediction, review-score prediction, K-Means customer clustering
- A live interactive dashboard on GitHub Pages, plus a 5-page Power BI report
- CI that validates the pipeline's structure on every push

## Joining the data

```python
df = (orders
      .merge(payments, on='order_id', how='inner')
      .merge(customers, on='customer_id', how='inner')
      .merge(reviews[['order_id', 'review_score']], on='order_id', how='left'))
```

- Inner join for payments and customers, an order with no matching payment can't have revenue computed anyway
- Left join for reviews, a missing review shouldn't drop an otherwise valid order

## Customer value, the simple way

```python
clv['value_segment'] = pd.qcut(clv['total_spent'], q=4, labels=['Low', 'Medium', 'High', 'VIP'])
```

- Sorts every customer by total spend, then splits that sorted line into 4 equal-sized groups
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

## RFM: quintile scoring vs. K-Means, and why they disagree

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

- Quintile RFM puts the top 20% of customers into "Champion," averaging **2.1x** the overall spend
- K-Means finds a much smaller, stricter cluster of genuine outliers, averaging nearly **7x**
- Both numbers are real, they're answering different questions, "top fifth" versus "genuine extremes"
- Reported both, with the method attached to each. An earlier informal "4x" estimate had circulated before either number was actually verified, and neither matched it

## Model 1: predicting late deliveries

```python
clf = RandomForestClassifier(n_estimators=200, max_depth=10, class_weight='balanced')
```

- Only about 8% of orders are actually late, so a naive model hits 92% accuracy by always predicting on-time, and catches zero real risk
- `class_weight='balanced'` forces the model to pay real attention to the rare late-order examples
- Result: accuracy drops to 78.2% on purpose, but ROC-AUC is 0.737 and recall on the late class is 53.7%, catching over half of real late deliveries before they happen

## Model 2: predicting review scores

```python
reg = RandomForestRegressor(n_estimators=200, max_depth=10)
# r2 = 0.216, rmse = 1.14 stars
```

- R² of 0.216 means the model explains about a fifth of what drives a review score, modest, reported as modest
- The more useful output was the feature ranking: `is_late` is the single strongest predictor of review score, ahead of price or freight cost by a wide margin
- Fixing delivery reliability likely moves satisfaction more than anything else measurable in this dataset

## CI, without needing the real dataset

```python
tree = ast.parse(open("ecommerce_analysis.py").read())
functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
required = ["load_data", "build_analytical_dataset", "rfm_analysis", "cohort_retention_analysis"]
```

- Reads the code's structure as text without running it, checking that key functions haven't been silently renamed or deleted
- Runs on a small synthetic dataset built directly in the CI file, so the pipeline gets validated with no credentials and no 50MB download

## Other real numbers

- São Paulo alone drives 37.5% of total revenue
- 73.9% of transactions use credit card
- Every segmentation threshold recomputes fresh on each run, they're statistical patterns, not fixed business rules

## Conclusion

None of this needed a fancier model. It needed the model graded on the metric that matches the real cost of being wrong, and two honest segmentation methods reported side by side instead of collapsed into one flattering headline. A retention strategy built on "customers decline slowly" instead of "customers barely ever return" would have aimed every fix at the wrong problem.

**Live dashboard:** [rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline](https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/)
**Code:** [github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline](https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline)
