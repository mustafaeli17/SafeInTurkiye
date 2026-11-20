import {afterEach,expect,it,vi} from 'vitest';
import {renderToStaticMarkup} from 'react-dom/server';
import TaxiBudgetReview from '../components/TaxiBudgetReview';
import {budgetReviewExpiresAt,taxiBudgets} from '../lib/taxiBudget';

afterEach(()=>vi.useRealTimers());
const [city,budget]=Object.entries(taxiBudgets)[0];
const deadline=budgetReviewExpiresAt(budget.reviewedAt);
it.each([[7*86400000+1,'Güncel'],[7*86400000,'7 gün içinde'],[0,'Süresi doldu']] as const)('shows the calculator review status at offset %s', (beforeDeadline,label)=>{
  vi.useFakeTimers();vi.setSystemTime(deadline-beforeDeadline);
  const html=renderToStaticMarkup(<TaxiBudgetReview/>);
  const row=html.split('<tr ').find(value=>value.includes('>'+city+'</th>'));
  expect(row).toContain(label);
  expect(row).toContain(budget.reviewedAt);
  for(const url of budget.sources)expect(row).toContain('href="'+url+'"');
  for(const province of Object.keys(taxiBudgets))expect(html).toContain('>'+province+'</th>');
});
