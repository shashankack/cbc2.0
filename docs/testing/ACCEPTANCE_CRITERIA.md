# Acceptance criteria (hackathon demo)

The core demo is complete when a presenter can:

1. Platform operator approves a college and verified domain.
2. Admin configures campus settings (max walk / cluster params as applicable).
3. Admin imports students from Excel (name, SRN, email, coords).
4. System proposes clusters → centroid stops → routes; map shows the plan.
5. Outlier (1–2 far students) snaps to nearest stop **or** lands in admin review; admin can add/assign a stop.
6. System proposes bus assignment from headcount vs capacity (rule-based).
7. Admin confirms the batch atomically; student pick/drop is locked.
8. Mark a bus unavailable → reassignment proposal awaiting approval (non-emergency path).
8b. Driver presses **Distress** on an active trip → coords captured; system computes boarded vs remaining pickups and proposes available bus reallocation; admin quick-confirms.
9. After route finalize, driver can see the **ordered stop list** for that route.
10. Driver manually starts a trip session; UI shows stops **in visit order** (list + map) and displays QR; eligible student scans once → attendance marked.
11. While the session is active, a student can see the **driver phone / bus live position** on a map.
12. Driver manually ends the session; further QR scans are rejected and live location sharing stops.
13. Show simple attendance/boarding count analytics (rule-based, not ML).
14. Demonstrate one college cannot access another college's data.

Out of scope: heavy ML models, live traffic, student GPS tracking, student self-editing pick/drop after lock.
