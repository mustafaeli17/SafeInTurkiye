import {renderToStaticMarkup} from 'react-dom/server';
import {expect, it} from 'vitest';
import CityReferenceAdmin from '../components/CityReferenceAdmin';

it('keeps city creation unavailable until the complete reference list is read', () => {
  const html = renderToStaticMarkup(<CityReferenceAdmin role="admin"/>);
  expect(html).not.toContain('Şehir referansını oluştur');
  expect(html).not.toContain('referansı eksik');
  expect(html).toContain('Şehir kayıtları yükleniyor');
});
