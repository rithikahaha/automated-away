# Only 3.12% of Customers Ever Buy Again: What a Cohort Analysis Actually Found

I expected the usual retention story on this one, customers drifting away gradually. A cohort analysis on 99,440 real Olist orders (a Brazilian e-commerce marketplace) showed a cliff instead. This post covers that finding, 2 segmentation methods that disagreed with each other, and 2 model tradeoffs I made on purpose.

## 📋 What this project does

- Serverless pipeline on AWS: S3 for storage, Glue to auto-catalog the schema, Athena to run SQL directly against the files
- 7 statistical analyses: revenue trends, customer segmentation, payments, geography, satisfaction, cohort retention, RFM scoring
- 3 ML models: delivery-delay prediction, review-score prediction, K-Means customer clustering
- A live interactive dashboard, deployed on GitHub Pages
- CI that validates the pipeline's structure on every push

## The retention cliff

```python
df_cohort['period'] = (df_cohort['order_month'].astype(int)
                        - df_cohort['cohort'].astype(int))
retention_rates = cohort_pivot.div(cohort_sizes, axis=0) * 100
```

**Explanation:**
- Groups customers by the month of their first purchase, then tracks what fraction of each group is still buying in later months
- Result: nearly every cohort drops to close to 0% by month 1. Not a decline, a cliff
- Only 3.12% of all customers ever place a second order, period
- That reframes the entire strategy: this isn't a business fighting gradual churn, it's a marketplace where almost nobody becomes a repeat buyer at all, likely because there's no single-brand relationship pulling anyone back
- The highest-leverage fix is converting first-time buyers into second-time buyers at all, not slowing a decay that barely exists to slow

## Two segmentations, two honest answers

```python
rfm_scaled = StandardScaler().fit_transform(rfm[['recency','frequency','monetary']])
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
rfm['cluster'] = kmeans.fit_predict(rfm_scaled)
# silhouette score: 0.497
```

**Explanation:**
- Quintile RFM scoring (Recency, Frequency, Monetary, split into 5 equal groups each) puts the top 20% of customers into "Champion," averaging 2.1x the overall spend
- K-Means (an algorithm that finds natural groupings on its own, no labels given) finds a much smaller, stricter cluster of genuine outliers, averaging nearly 7x
- Both numbers are real. They're answering different questions, "top fifth" versus "genuine extremes"
- Reported both, with the method attached to each, instead of quietly picking whichever sounds better. An earlier informal "4x" estimate had circulated before either number was actually verified, and neither matched it

## Model 1: predicting late deliveries

```python
clf = RandomForestClassifier(n_estimators=200, max_depth=10,
                              class_weight='balanced')
```

**Explanation:**
- Only about 8% of orders are actually late, so a naive model hits 92% accuracy by always predicting "on time," and catches zero real risk
- `class_weight='balanced'` forces the model to pay real attention to the rare late-order examples during training
- Result: accuracy drops to 78.2% (lower than the naive baseline, on purpose), but ROC-AUC is 0.737 and recall on the late class is 53.7%, meaning it now genuinely catches over half of real late deliveries before they happen

## Model 2: predicting review scores

```python
reg = RandomForestRegressor(n_estimators=200, max_depth=10)
# r2 = 0.216, rmse = 1.14 stars
```

**Explanation:**
- R² of 0.216 means the model explains about a fifth of what drives a review score, modest, reported as modest
- The more useful output wasn't the prediction itself, it was the feature ranking: `is_late` is the single strongest predictor of review score, ahead of price or freight cost by a wide margin
- Fixing delivery reliability likely moves satisfaction more than anything else in this dataset

## Other real numbers

- São Paulo alone drives 37.5% of total revenue
- Satisfaction and repeat purchasing barely correlate (r ≈ 0.038), a happy customer isn't reliably a returning one
- 73.9% of transactions use credit card
- Every segmentation threshold recomputes fresh on each run, they're statistical patterns, not fixed business rules

## ✨ Conclusion

None of this needed a fancier model. It needed the model graded on the metric that matches the real cost of being wrong, and 2 honest segmentation methods reported side by side instead of collapsed into one flattering headline. A retention strategy built on "customers decline slowly" instead of "customers barely ever return" would have aimed every fix at the wrong problem.

**Live dashboard:** [rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline](https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/)
**Code:** [github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline](https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline)
