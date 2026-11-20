import { budgetReviewExpiresAt, budgetIsCurrent, taxiBudgets } from '../src/lib/taxiBudget.ts';

// Read-only release check for the local estimates available independently of the CMS.
const now = Date.now();
for (const [city, budget] of Object.entries(taxiBudgets)) {
  const expires = budgetReviewExpiresAt(budget.reviewedAt);
  const daysLeft = Math.ceil((expires-now)/86400000);
  const label = city+' (review '+budget.reviewedAt+', until '+new Date(expires).toISOString()+')';
  if (!budgetIsCurrent(budget.reviewedAt,now)) {
    console.warn('::warning::Taxi fare review required: '+label);
    if (process.argv.includes('--strict')) process.exitCode = 1;
  } else if (daysLeft <= 7) {
    console.warn('::warning::Taxi fare review due within seven days: '+label);
  } else {
    console.log('Current: '+label);
  }
}
