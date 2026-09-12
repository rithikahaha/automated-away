# Only 3.12% of Customers Ever Buy Again: What a Cohort Analysis Actually Found

I expected the standard retention story going in: customers drift away gradually, month over month, the way a subscription business typically churns. A cohort analysis on 99,440 real Olist orders showed something different, and the difference changes what "fix retention" should even mean.

## The architecture

Raw data lands in S3, a Glue crawler catalogs the schema automatically, Athena runs SQL directly against the files with no server to maintain. Locally, the same pipeline runs through `ecommerce_analysis.py` (7 statistical analyses), `ml_models.py` (3 ML models), and a self-contained Plotly dashboard deployed on GitHub Pages.

## The cliff, not the decline

```python
df_cohort['period'] = (df_cohort['order_month'].astype(int)
                        - df_cohort['cohort'].astype(int))
retention_rates = cohort_pivot.div(cohort_sizes, axis=0) * 100
```

Nearly every cohort reads close to 0% by month 1. Not a slow leak, a cliff. Only 3.12% of all customers ever place a second order, period. That single number reframes the entire strategy: this isn't a subscription business fighting gradual churn, it's a multi-seller marketplace where almost nobody becomes a repeat buyer in the first place. The highest-leverage move isn't slowing decay, it's converting first-time buyers into second-time buyers at all.

## Two segmentations, two honest answers

Quintile RFM scoring puts the top fifth of customers into "Champion," averaging 2.1x the overall spend. K-Means clustering, run separately on standardized recency/frequency/monetary features, finds a smaller, stricter, algorithmically-discovered cluster of genuinely extreme spenders averaging nearly 7x:

```python
rfm_scaled = StandardScaler().fit_transform(rfm[['recency','frequency','monetary']])
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
rfm['cluster'] = kmeans.fit_predict(rfm_scaled)
# silhouette score: 0.497
```

Both numbers are real. They're just answering different questions, top 20% versus genuine outliers, and reporting both with the method attached beats quietly picking whichever sounds better in a pitch.

## Two models, two honest tradeoffs

Only about 8% of orders are actually late, so a naive classifier hits 92% accuracy by always predicting on-time, and catches zero real risk. The delivery-delay Random Forest is trained with `class_weight='balanced'` instead, trading accuracy down to 78.2% for a ROC-AUC of 0.737 and 53.7% recall on the class that actually matters:

```python
clf = RandomForestClassifier(n_estimators=200, max_depth=10,
                              class_weight='balanced')
```

A second Random Forest predicts review score directly, R² of 0.216, modest, reported as modest. The more useful output wasn't the prediction itself, it was the feature ranking: `is_late` is the single strongest predictor of review score, ahead of price or freight cost by a wide margin. Fixing delivery reliability likely moves satisfaction more than anything else in this dataset.

## What actually mattered here

- São Paulo alone drives 37.5% of total revenue.
- Satisfaction and repeat purchasing barely correlate at all (r ≈ 0.038), a happy customer isn't reliably a returning one.
- Every segmentation threshold, every cluster boundary, gets recomputed fresh on each run. They're statistical bins, not fixed business rules, and they'll shift if the underlying data does.

None of this needed a bigger model. It needed the model graded on the metric that actually matches the real-world cost of being wrong, and two segmentation methods reported side by side instead of collapsed into one flattering headline.

**Live dashboard:** [rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline](https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/)
**Code:** [github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline](https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline)
