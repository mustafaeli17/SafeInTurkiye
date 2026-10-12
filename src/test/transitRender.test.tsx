import { expect, it } from 'vitest'
import { renderToString } from 'react-dom/server'
import TransitPlanner from '../components/TransitPlanner'

it.each(['en','tr','de','fr','ar','ru','zh','es'])('renders the complete transit page in %s without crashing', lang => {
  const html = renderToString(<TransitPlanner lang={lang} />)
  expect(html).toContain('<form')
  if (lang === 'es') {
    expect(html).toContain('Ahora')
    expect(html).toContain('Buscar rutas')
  }
})
