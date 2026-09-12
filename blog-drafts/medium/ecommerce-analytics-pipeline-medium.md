# Only 3.12% of Customers Ever Buy Again: What a Cohort Analysis Actually Found

**The short version:** I built an analytics pipeline on top of 99,440 real e-commerce orders expecting to find the usual story, customers slowly drifting away over time. Instead I found a cliff: almost nobody ever buys a second time at all. That one number changes what "fix retention" should even mean for this kind of business. This post also covers two places where I had two honest, competing answers instead of one clean one, and reported both instead of picking whichever sounded better.

The data is from Olist, a Brazilian e-commerce marketplace where many independent sellers share one platform, not a single-brand retailer. About 96,000 customers, roughly R$16 million (about $3.2 million USD) in total revenue. I built the pipeline to run on Amazon's cloud infrastructure (serverless, meaning no server sits around running 24/7 waiting for a question, you only pay for what you actually use), then ran seven statistical analyses and three machine learning models on top of it.

## Why the retention finding matters more than it sounds

Going in, I expected a gradual decline: customers buy less often over time, the same pattern you'd see with a subscription service slowly losing people. To check that, I built a cohort analysis, tracking every customer by the month of their very first purchase, then following how many of them were still buying in each month after that.

```python
df_cohort['period'] = (df_cohort['order_month'].astype(int)
                        - df_cohort['cohort'].astype(int))
retention_rates = cohort_pivot.div(cohort_sizes, axis=0) * 100
```

The result wasn't a gradual decline. It was a cliff. Nearly every group of customers dropped to close to 0% by the very next month. Only 3.12% of all customers, ever, place a second order. That single number completely reframes the strategy. This isn't a business slowly losing loyal customers, it's a business where almost nobody becomes a repeat customer in the first place, probably because buying from a marketplace of many different sellers doesn't build the same kind of loyalty as buying from one brand you know. The highest-leverage fix isn't "reduce the decline." It's "get anyone at all to buy a second time."

## Two ways to rank your best customers, two different answers

I used two separate methods to find the most valuable customers, and they disagreed with each other in an interesting way.

The first method, a common scoring technique (RFM, meaning how Recently, how Frequently, and how Much someone bought), ranks the top 20% of customers as "Champions." That group spends about **2.1 times** the average customer.

The second method, a clustering algorithm (K-Means, software that finds natural groupings in data on its own, without being told the categories in advance) found a much smaller, much more extreme group of standout spenders, and that group spends nearly **7 times** the average.

```python
rfm_scaled = StandardScaler().fit_transform(rfm[['recency','frequency','monetary']])
kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
rfm['cluster'] = kmeans.fit_predict(rfm_scaled)
```

Both numbers are completely real. They're just answering slightly different questions, "top fifth of customers" versus "genuine statistical outliers." I reported both, with the method attached to each, instead of picking whichever one sounded more impressive for a headline. An earlier, informal estimate had circulated claiming a flat "4x," and neither properly verified number actually matched that, which is exactly the kind of thing that happens when a number gets repeated before anyone checks it.

## Two models, two deliberate tradeoffs

Only about 8% of orders in this dataset actually arrive late. That matters a lot for building a model to predict which ones will be late: a lazy model could just guess "on time" every single time and be right 92% of the time, while being completely useless, since it would never once catch a real problem. I trained the model to specifically pay more attention to those rare late orders instead:

```python
clf = RandomForestClassifier(n_estimators=200, max_depth=10,
                              class_weight='balanced')
```

That one setting, `class_weight='balanced'`, trades away some of that flattering 92% number (the real accuracy drops to 78.2%) in exchange for actually catching over half of the genuinely late orders before they happen. A worse-looking number that's actually useful beats a better-looking number that isn't.

A second model tried to predict a customer's review score (1 to 5 stars) directly from order details. It explained about 22% of what drives a review score, a modest result, reported honestly as modest. But building it surfaced something more useful than the prediction itself: whether an order arrived late is, by a wide margin, the single strongest signal for a bad review, stronger than price or shipping cost. Fixing delivery reliability likely does more for customer satisfaction than anything else measurable in this data.

## The other numbers worth knowing

- One city, São Paulo, drives 37.5% of all revenue on its own.
- Whether a customer left a good review and whether they ever came back are almost completely unrelated (a correlation of about 0.04, essentially none). A happy customer is not reliably a returning one.
- Every customer segment and cluster boundary gets recalculated fresh each time the analysis runs. They're statistical patterns in the current data, not fixed business rules carved in stone, and they'll shift if the underlying data does.

## Why none of this needed a fancier model

The lesson underneath all of this wasn't "build a bigger model." It was: grade the model on the number that actually reflects the real-world cost of being wrong, and when two honest methods disagree, report both instead of quietly picking the one that sounds better. A retention strategy built on the wrong assumption, "customers decline slowly" instead of "customers barely ever return at all," would have aimed every fix at the wrong problem entirely.

**Live dashboard:** [rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline](https://rithikahaha.github.io/Scalable-E-commerce-Analytics-Pipeline/dashboard/)
**Code:** [github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline](https://github.com/rithikahaha/Scalable-E-commerce-Analytics-Pipeline)
