-- Run once on an existing D1 database to publish comments that were waiting for approval.
UPDATE comments SET status='approved' WHERE status='pending';
