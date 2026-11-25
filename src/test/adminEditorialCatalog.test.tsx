import {renderToStaticMarkup} from 'react-dom/server';
import {expect, it} from 'vitest';
import EditorialAdmin from '../components/EditorialAdmin';

it('offers full-category search and labels the source and public destination', () => {
  const html = renderToStaticMarkup(<EditorialAdmin role="editor"/>);
  expect(html).toContain('İşletme adına göre ara');
  expect(html).toContain('Filtreleri temizle');
  expect(html).toContain('Kayıt kaynağı');
  expect(html).toContain('Ziyaretçi bölümü');
  expect(html).toContain('Yayın koşulları');
  expect(html).not.toContain('en fazla 500');
});
