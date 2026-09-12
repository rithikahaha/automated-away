# Scalable E-Commerce Analytics Pipeline: The Complete Case Study

**TL;DR, what this is and why it exists**
- **The problem:** a Brazilian e-commerce marketplace (Olist) has 99,440 real orders and no clear answer to the questions that actually drive strategy: where does the revenue concentrate, do customers come back, and can you predict which orders will show up late or get a bad review before they happen.
- **What I built:** an end-to-end pipeline, from a serverless AWS data lake down to 7 statistical analyses and 3 machine learning models, answering all three questions with real numbers instead of guesses.
- **The headline finding, and the one that reframes everything:** only 3.12% of customers ever place a second order. Not "retention declines gradually," a near-vertical cliff. That single number changes what "improve retention" should even mean for this business.
- **The honest part:** two different segmentation methods (quintile RFM vs K-Means clustering) disagree on how much a "Champion" customer is worth, 2.1x the average versus 7x. Both are reported, with the method that produced each, instead of quietly picking the more impressive-sounding number.
- Every code block below has a plain-English "Line by line" breakdown.

## Jump to a section

- [The problem, in more detail](#the-problem-in-more-detail)
- [The architecture: local pipeline, cloud-ready](#the-architecture-local-pipeline-cloud-ready)
- [Loading and joining the data](#loading-and-joining-the-data)
- [Revenue, payments, and geography](#revenue-payments-and-geography)
- [Two ways to segment customers, and why they disagree](#two-ways-to-segment-customers-and-why-they-disagree)
- [The retention cliff](#the-retention-cliff)
- [Does satisfaction predict loyalty](#does-satisfaction-predict-loyalty)
- [Predicting which orders will be late](#predicting-which-orders-will-be-late)
- [Predicting the review score before it happens](#predicting-the-review-score-before-it-happens)
- [A third way to segment: K-Means on RFM](#a-third-way-to-segment-k-means-on-rfm)
- [The interactive dashboard](#the-interactive-dashboard)
- [CI: what actually gets checked on every push](#ci-what-actually-gets-checked-on-every-push)
- [Decisions that were mine](#decisions-that-were-mine)
- [Limitations](#limitations)
- [Interview prep: questions and answers](#interview-prep-questions-and-answers)

## The problem, in more detail

A marketplace like Olist connects many independent sellers to customers across Brazil. Unlike a single-brand retailer, there's no obvious reason to assume customers come back, no loyalty program, no single brand relationship, just whichever seller had what they needed that one time.

That distinction matters more than it sounds like it should. Most retention analysis assumes a slow decline: customers drift away gradually, month over month. If that assumption is wrong for this kind of business, every strategy built on top of it is aimed at the wrong problem. This project exists to check that assumption against real data instead of assuming it.

## The architecture: local pipeline, cloud-ready

The project runs two ways: fully local (for development and the actual analysis in this case study), and cloud-native on AWS (for the scale a real production version would need).

**Local:** raw CSVs to `ecommerce_analysis.py` (7 statistical analyses) to `ml_models.py` (3 ML models) to `dashboard.py` (interactive Plotly dashboard) to `power_bi_exports.py` (Power BI CSVs).

**Cloud:** the same 8 raw tables land in Amazon S3 (a "Data Lake," cheap, durable object storage), an AWS Glue Crawler automatically scans them and builds a schema catalog (so nobody hand-writes table definitions), and Amazon Athena runs SQL directly against the S3 files without needing a running database server at all.

**Why this split matters:** you don't pay for a database server sitting idle. S3 storage is nearly free, Athena only charges for the data actually scanned per query, and Glue's crawler means adding a new table doesn't require a manual schema migration. That's the actual meaning of "serverless" here, not a marketing word, a specific cost and operations tradeoff.

## Loading and joining the data

```python
def build_analytical_dataset(datasets):
    df = (datasets['orders']
          .merge(datasets['payments'], on='order_id', how='inner')
          .merge(datasets['customers'], on='customer_id', how='inner')
          .merge(datasets['reviews'][['order_id', 'review_score']],
                 on='order_id', how='left'))

    df['order_purchase_timestamp'] = pd.to_datetime(df['order_purchase_timestamp'])
    df['order_month'] = df['order_purchase_timestamp'].dt.to_period('M')
    return df
```

**Line by line:**
- `.merge(..., on='order_id', how='inner')`: joins two tables on a shared column. `inner` means only keep rows where a match exists on both sides, an order with no matching payment record gets dropped entirely, since you can't compute revenue without a payment.
- `.merge(datasets['reviews'][...], how='left')`: a `left` join instead, meaning every order is kept even if it has no review at all. Reviews are optional; revenue isn't.
- `pd.to_datetime(...)`: converts a plain text date string into an actual date object Python can do math with (subtracting dates, extracting the month, and so on).
- `.dt.to_period('M')`: rolls a specific date like "2018-03-17" up to just its month, "2018-03", which is what later groups revenue and cohorts by calendar month instead of by exact day.

**Why `inner` for payments and customers, but `left` for reviews:** a mismatch on the join type is a subtle, common way to quietly lose or double-count real data. This project only requires a review when the question is specifically about reviews, everywhere else, an order missing a review should still count fully.

## Revenue, payments, and geography

Three of the seven analyses are straightforward aggregations, and the real numbers are worth knowing:

```python
revenue_by_month = df.groupby('order_month')['payment_value'].sum().sort_index()
```
Total revenue: **R$16,081,420.74** across **99,440 orders**, averaging **R$161.72** per order.

```python
state_metrics = (df.groupby('customer_state')
                 .agg({'payment_value': 'sum', 'customer_unique_id': 'nunique'})
                 .sort_values('total_revenue', ascending=False))
```
São Paulo alone drives **37.5%** of total revenue (R$6.03M), more than the next several states combined.

```python
payment_dist = df['payment_type'].value_counts()
```
**73.9%** of transactions use credit card, making that single payment gateway the highest-leverage piece of payment infrastructure to keep reliable.

**Line by line, for the pattern all three share:**
- `.groupby(column)`: splits the full dataset into buckets, one per unique value in that column (one bucket per month, one per state, one per payment type).
- `.agg({...})` or `.sum()`/`.value_counts()`: computes one summary number per bucket, total revenue per month, or a simple count of how often each payment type appears.
- `.sort_values(...)` / `.sort_index()`: orders the result, either by the computed value (biggest state first) or by the natural order of the bucket itself (months in chronological order).

## Two ways to segment customers, and why they disagree

The simplest segmentation is a straight quartile split on total spend:

```python
clv['value_segment'] = pd.qcut(clv['total_spent'], q=4, labels=['Low', 'Medium', 'High', 'VIP'])
```

**Line by line:**
- `pd.qcut(column, q=4, labels=[...])`: sorts every customer by total spend, then cuts that sorted list into 4 equal-sized groups (quartiles), so exactly a quarter of customers land in each bucket, regardless of the actual dollar gaps between them. The lowest-spending quarter gets labeled "Low," the highest "VIP."

A separate, more detailed method is RFM (Recency, Frequency, Monetary) scoring:

```python
rfm['r_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1])
rfm['f_score'] = pd.qcut(rfm['frequency'].rank(method='first'), q=5, labels=[1, 2, 3, 4, 5])
rfm['m_score'] = pd.qcut(rfm['monetary'], q=5, labels=[1, 2, 3, 4, 5])
rfm['rfm_score'] = rfm['r_score'].astype(int) + rfm['f_score'].astype(int) + rfm['m_score'].astype(int)
```

**Line by line:**
- Each customer gets scored 1 to 5 on three separate dimensions: how recently they bought (`recency`), how often (`frequency`), and how much (`monetary`), using the same quintile-cutting idea as above, just five buckets instead of four.
- `rfm['r_score'] = pd.qcut(rfm['recency'], q=5, labels=[5, 4, 3, 2, 1])`: notice the labels are reversed here, fewer days since last purchase should score higher (5), not lower, so the label list is written backwards on purpose.
- `.rank(method='first')` on frequency, specifically: most customers here only ordered once, so plain `qcut` on frequency would try to put thousands of identical "1 order" customers into the same bin and fail with a "duplicate bin edges" error. Ranking first breaks the ties (arbitrarily, but consistently) so quintiles can actually be formed.
- The three 1-5 scores get summed into one combined score (max 15), which then maps to a label: 13+ is "Champion," 10-12 "Loyal," 7-9 "At Risk," below 7 "Lost."

**Real result, quintile RFM:** the Champion segment (8,215 customers) averages **R$344.76** in lifetime spend, versus an overall average of R$167.35, about **2.1x**.

A completely separate method, K-Means clustering (covered in full further down), finds a smaller, stricter "Champions" cluster of just 2,416 customers averaging **R$1,161**, nearly **7x** the overall average.

**Why report both instead of picking one:** "Champions spend 4x the average" was an earlier, informal estimate that circulated before either number was actually verified. Neither 2.1x nor 7x is wrong, they're answering slightly different questions ("top 20% by a blended score" versus "an algorithmically-discovered tight cluster of genuinely extreme spenders"). Reporting both, with the method attached to each, is the honest version of this finding. Picking whichever sounds better in a pitch is how a real number quietly turns into marketing copy.

## The retention cliff

```python
df_cohort['period'] = (df_cohort['order_month'].astype(int) - df_cohort['cohort'].astype(int))

cohort_pivot = cohort_data.pivot(index='cohort', columns='period', values='customer_unique_id')
cohort_sizes = cohort_pivot.iloc[:, 0]
retention_rates = cohort_pivot.div(cohort_sizes, axis=0) * 100
```

**Line by line:**
- Cohort = the calendar month of a customer's very first purchase. Every customer belongs to exactly one cohort.
- `order_month.astype(int) - cohort.astype(int)`: pandas represents a year-month "Period" internally as a sequential integer under the hood, so subtracting two of them gives you a literal count of months elapsed, this is what turns "March 2018" and "cohort: January 2018" into "period 2."
- `.pivot(index='cohort', columns='period', ...)`: reshapes the data into a grid, one row per cohort, one column per month-offset, so you can read "how many of January's customers were still active 3 months later" directly off the table.
- `cohort_sizes = cohort_pivot.iloc[:, 0]`: the first column of that grid, period 0, is by definition the full size of each cohort (everyone was active in their own first month).
- `.div(cohort_sizes, axis=0) * 100`: divides every column by that first-column size, row by row, converting raw customer counts into retention percentages.

**Real result:** nearly every cohort reads close to 0% by month 1. Not a slow decline, a cliff. This matches the site-wide number directly: only 3.12% of all customers ever place a second order at all. The retention curve doesn't decay, because there's barely anything to decay from.

**Why this finding reframes the whole strategy:** a subscription business fights gradual churn, keeping people who are already paying. This is a different problem entirely: almost nobody becomes a second-time buyer in the first place. The highest-leverage move here isn't "reduce month-over-month drop-off," it's "convert more first-time buyers into second-time buyers at all," a completely different kind of intervention (post-purchase engagement, second-order incentives) than a retention curve would suggest.

## Does satisfaction predict loyalty

```python
correlation = repeat_customers['review_score'].corr(repeat_customers['num_orders'])
```

**Line by line:**
- `.corr(...)`: computes the Pearson correlation coefficient between two columns, a single number from -1 to 1 measuring how strongly two things move together. Close to 0 means basically no relationship.
- Restricted to customers with more than 1 order, since "does satisfaction predict repeat purchasing" only makes sense to ask about people who had the option to repeat-purchase at all.

**Real result:** r ≈ 0.038. Essentially zero. A happy customer is not meaningfully more likely to come back than an unhappy one, at least not in a way this correlation can detect. Combined with the retention cliff above, this suggests the barrier to a second purchase isn't dissatisfaction, it's something more structural about a multi-seller marketplace not building the kind of relationship a single brand would.

## Predicting which orders will be late

```python
features = ['price', 'freight_value', 'n_items', 'product_weight_g',
            'product_length_cm', 'product_height_cm', 'product_width_cm',
            'payment_installments', 'estimated_delivery_days',
            'purchase_month', 'purchase_dayofweek']

clf = RandomForestClassifier(n_estimators=200, max_depth=10,
                              random_state=42, n_jobs=-1,
                              class_weight='balanced')
clf.fit(X_train, y_train)

y_proba = clf.predict_proba(X_test)[:, 1]
roc_auc = roc_auc_score(y_test, y_proba)
```

**Line by line:**
- `RandomForestClassifier(n_estimators=200, max_depth=10, ...)`: builds 200 separate decision trees, each one a fairly shallow (max depth 10) set of yes/no questions about the order's features, and combines their votes into one final prediction. Using many shallow trees together tends to generalize better than one single deep tree.
- `class_weight='balanced'`: this is the single most important parameter in this model, and it's explained below.
- `clf.fit(X_train, y_train)`: the training step, shows the model the features and the correct answers (was this order actually late) so it can learn the pattern.
- `predict_proba(X_test)[:, 1]`: asks the trained model for a probability of lateness on data it's never seen, taking just the "yes, late" probability column.
- `roc_auc_score`: measures how well the model ranks orders by risk. If you picked one order that was actually late and one that wasn't, how often does the model correctly guess which is riskier. 0.5 is a coin flip, 1.0 is perfect.

**Why `class_weight='balanced'` is the whole story here:** only about 8% of orders in this dataset are actually late. A model that just predicts "on time" for every single order would be right 92% of the time, a great-looking accuracy number that is completely useless, since it never once flags an actual risk. `class_weight='balanced'` forces the model to pay real attention to the rare late-order examples during training instead of ignoring them as noise.

**Real result:** accuracy 78.2%, ROC-AUC **0.737**, recall 53.7% on the late class. The accuracy number is actually lower than the naive always-predict-on-time approach, and that's the point, this model is trading some raw accuracy for the ability to actually catch over half of the late orders before they happen, which is the entire operational value of building it.

## Predicting the review score before it happens

```python
features = ['price', 'freight_value', 'n_items', 'payment_installments',
            'payment_value', 'actual_delivery_days', 'estimated_delivery_days',
            'is_late']

reg = RandomForestRegressor(n_estimators=200, max_depth=10, random_state=42, n_jobs=-1)
reg.fit(X_train_scaled, y_train)

r2 = r2_score(y_test, y_pred)
```

**Line by line:**
- Same Random Forest idea as before, but a `Regressor` instead of a `Classifier`, because the target here is a number from 1 to 5 stars, not a yes/no category.
- `r2_score`: R², a number typically between 0 and 1 (it can go negative for a genuinely bad model) measuring what fraction of the variation in review scores the model actually explains. 1.0 would mean the model predicts every score perfectly. 0 would mean it's no better than always guessing the average.

**Real result:** R² = **0.216**, RMSE 1.14 stars. That's a modest score, the model explains about a fifth of what drives a review, and its typical prediction is off by a bit over a star. That's reported honestly, not inflated, because the more useful output here isn't the prediction itself, it's which feature matters most: `is_late` is the single strongest predictor of review score, by a wide margin, stronger than price or shipping cost. Fixing delivery reliability likely moves customer satisfaction more than anything else measured in this dataset.

## A third way to segment: K-Means on RFM

```python
scaler = StandardScaler()
rfm_scaled = scaler.fit_transform(rfm[['recency', 'frequency', 'monetary']])

kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
rfm['cluster'] = kmeans.fit_predict(rfm_scaled)

sil_score = silhouette_score(rfm_scaled, rfm['cluster'], sample_size=10000, random_state=42)
```

**Line by line:**
- `StandardScaler().fit_transform(...)`: rescales recency, frequency, and monetary value so they're all on a comparable numeric scale (roughly centered at 0). Without this, "monetary value" (which can range into the thousands) would completely dominate the clustering just because its raw numbers are bigger, not because it's actually more important.
- `KMeans(n_clusters=4, ...)`: an algorithm that finds 4 natural groupings in the data by minimizing the distance between each point and the center of its assigned group, run 10 times from different random starting points (`n_init=10`) and keeping the best result, since K-Means can land on a worse solution depending on where it starts.
- `.fit_predict(...)`: runs the clustering and directly returns which of the 4 clusters each customer landed in.
- `silhouette_score`: a single number (roughly -1 to 1) measuring how well-separated the clusters actually are, higher means each customer is clearly closer to their own cluster's center than to any other cluster's.

**Real result:** silhouette score **0.497**, a genuinely reasonable separation for real-world customer data (perfect separation is rare and usually a sign of an oversimplified dataset). The clusters get relabeled Champions/Loyal/At Risk/Lost by ranking them on average monetary value, so the labels stay meaningful instead of being arbitrary cluster numbers.

## The interactive dashboard

`dashboard.py` builds one self-contained HTML file, no server required, deployed live via GitHub Pages.

```python
fig.write_html(html_path, include_plotlyjs=True, full_html=True)
```

**Line by line:**
- `include_plotlyjs=True`: embeds the entire charting library directly inside the HTML file, instead of loading it from an external website. That single flag is a deliberate choice, explained directly in the code's own comment: a version pointing at a CDN would render as a blank page for anyone opening the file with no internet connection, since the chart containers stay empty until that external script loads. Embedding it makes the file work completely offline, double-click and go.

## CI: what actually gets checked on every push

```yaml
- name: Validate data quality checks
  run: |
    python - <<EOF
    import ast, os
    tree = ast.parse(open("ecommerce_analysis.py").read())
    functions = [node.name for node in ast.walk(tree) if isinstance(node, ast.FunctionDef)]
    required = ["load_data", "build_analytical_dataset", "rfm_analysis", "cohort_retention_analysis"]
    missing = [f for f in required if f not in functions]
    if missing:
        sys.exit(1)
    EOF
```

**Line by line:**
- `ast.parse(...)`: reads the actual Python source code as text and parses it into a structural tree, without running it. This is how the check inspects the script's contents without needing the real 50MB dataset to be present in CI at all.
- `ast.walk(tree)`: walks through every node in that structural tree, and the list comprehension pulls out the name of every function definition it finds.
- The check then confirms specific key functions (`rfm_analysis`, `cohort_retention_analysis`, and others) still exist by name. If someone renames or accidentally deletes one of them, this fails the build immediately instead of silently breaking a downstream script that expects to import it.

**Why this is a real, useful CI check even without the real dataset:** most of the value here isn't "run the full pipeline," it's "prove the code hasn't silently lost a function it depends on," plus a set of schema and null-value checks run against a small synthetic dataset built right inside the workflow file, so CI never needs credentials or a 50MB download just to catch an obvious regression.

## Decisions that were mine

- **Reporting two different "Champion" multipliers (2.1x and 7x) instead of one**, and explicitly naming which method produced each, rather than quietly using whichever number was more impressive.
- **Using `class_weight='balanced'` for the delivery-delay model**, a direct response to recognizing that the naive 92%-accuracy model would be technically correct and operationally useless.
- **Choosing R² and RMSE over just eyeballing a scatter plot** for the review-score model, and reporting a modest R² honestly instead of only showing the flattering feature-importance chart.
- **Rescaling RFM features before K-Means**, catching that raw monetary value would otherwise silently dominate the clustering.
- **Embedding Plotly's JS directly in the dashboard file**, after recognizing the CDN version would render blank offline.
- **Writing a CI check that parses the code's structure instead of requiring the real dataset**, so a regression gets caught without needing 50MB of data or cloud credentials in the pipeline.

## Limitations

Stated directly:
- Segmentation thresholds (CLV quartiles, RFM quintiles) are statistical bins recomputed fresh on every run, not fixed business rules, they will shift if the underlying data changes.
- The satisfaction/loyalty correlation is only computed for the small minority of customers with 2+ orders, so it says relatively little about the broader, mostly-one-time customer base.
- The delivery-delay model's precision is low (~19%), it over-flags orders as "late" in exchange for catching more real late deliveries. Whether that tradeoff is worth it depends on the real operational cost of a false alarm versus a missed late delivery.
- Both ML models are trained only on delivered orders, so they say nothing about predicting cancellations or non-delivery outcomes.

## Interview prep: questions and answers

**"What's the single most important finding in this project?"**
Only 3.12% of customers ever place a second order, and the cohort matrix shows a cliff, not a gradual decline. That reframes retention strategy entirely: the highest-leverage move is converting first-time buyers into second-time buyers at all, not slowing decay.

**"Why does the Random Forest for delivery delay have lower accuracy than a naive always-predict-on-time model, and why is that fine?"**
Because only ~8% of orders are late, so "always predict on time" gets 92% accuracy while catching zero real risk. `class_weight='balanced'` trades some accuracy for 53.7% recall on the class that actually matters operationally.

**"Two of your segmentation numbers disagree, 2.1x vs 7x. Which one is correct?"**
Both, they answer different questions. Quintile RFM splits the top 20% by a blended score (2.1x). K-Means finds a smaller, tighter, algorithmically-discovered cluster of genuinely extreme spenders (7x). Reporting both with their methods attached is more honest than collapsing it into one headline number.

**"Why rescale features before K-Means?"**
Because monetary value's raw numbers are much larger than recency or frequency's, and K-Means clusters based on numeric distance. Without scaling, spend would silently dominate the clustering regardless of how important it actually is relative to the other two dimensions.

**"What would you build next?"**
A model predicting which first-time buyers are likeliest to place a second order. Given how rare repeat purchases are here, that's more directly actionable than a traditional churn model would be.

**Numbers to have ready, all reproducible:**
- 99,440 orders, R$16,081,420.74 total revenue, R$161.72 average order value.
- Only 3.12% of customers ever place a second order.
- São Paulo: 37.5% of total revenue.
- Credit card: 73.9% of transactions.
- Satisfaction vs. repeat purchase correlation: r ≈ 0.038.
- Delivery delay model: ROC-AUC 0.737, recall 53.7%.
- Review score model: R² = 0.216, RMSE 1.14 stars.
- K-Means segmentation: silhouette score 0.497.
- RFM Champion premium: 2.1x (quintile method) or 7x (K-Means method).

## The stack

Python, Pandas, NumPy, Scikit-learn (Random Forest, K-Means), Plotly, Power BI, AWS (S3, Glue, Athena), GitHub Actions.

**Live dashboard:** [rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline](https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/)
**Code:** [github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline](https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline)

*Rithika*
