import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it} from 'vitest'
import ReservationFeedback from '../components/ReservationFeedback'
import DirectoryHeader from '../components/DirectoryHeader'
import DirectoryMotion from '../components/DirectoryMotion'

describe('discovery illustrations', () => {
  it.each(['hotels','restaurants','activities'] as const)('only retains the activity ticket on %s listings', kind => {
    const view = renderToStaticMarkup(<DirectoryHeader kind={kind} lang="en" citySelect={null} cityLabel="" areaLabel="" areaInput={null} area="" privacy="" scope="" searchLabel="" locateLabel="" initialQuery="" busy={false} canSearch={true} onLocate={()=>{}} onSearch={()=>{}}/>)
    expect(view.includes('class="directory-motion ')).toBe(kind === 'activities')
    expect(view.includes('outing-ticket')).toBe(kind === 'activities')
  })

  it('shows a decorative touring coach on the route', () => {
    const view = renderToStaticMarkup(<DirectoryMotion kind="tours"/>)
    expect(view).toContain('class="tour-coach"')
    expect(view).toContain('class="tour-route"')
    expect(view).toContain('aria-hidden="true"')
  })

  it.each([
    [null,false,'',false], ['PENDING',false,'',true], ['CONFIRMED',false,'',true],
    ['PENDING',true,'',false], ['CONFIRMED',false,'REQUEST_UNAVAILABLE',false],
    ['REJECTED',false,'',false], ['CANCELLED',false,'',false], ['UNKNOWN',false,'',false],
  ] as const)('reflects verified receipt state %s, busy %s, error %s', (status,busy,error,expected) => {
    const view = renderToStaticMarkup(<ReservationFeedback status={status} busy={busy} error={error} message="Test status"/>)
    expect(view).toContain('Test status')
    expect(view.includes('cloche-lid')).toBe(expected)
  })
})
