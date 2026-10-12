import { expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import TransitPlanner from '../components/TransitPlanner'

it.each(['en','tr','de','fr','ar','ru','zh','es'])('renders the complete transit page in %s without crashing', lang => {
  const html = renderToString(<TransitPlanner lang={lang} initialCity="Gaziantep" />)
  expect(html).toContain('<form')
  expect(html).toContain('GAZİULAŞ')
  expect(html).toContain('Gaziantep Kart')
  if (lang === 'es') {
    expect(html).toContain('Ahora')
    expect(html).toContain('Buscar rutas')
  }
})
it('falls back safely for an unsupported initial transit city',()=>{
 expect(renderToString(<TransitPlanner lang="es" initialCity="unknown" />)).toContain('İstanbulkart')
})
