import { afterEach, describe, expect, it, vi } from 'vitest'
import handler from '../../api/place-photo'
import { photoSignature, validPhotoToken } from '../server/placePhotoToken'

const name = 'places/example/photos/example_photo'
const key = 'test-only'
const response = () => ({ status: vi.fn().mockReturnThis(), setHeader: vi.fn(), end: vi.fn() })
const request = () => {
  const expires = Date.now() + 60000
  return { method: 'GET', url: `/?${new URLSearchParams({ name, expires: String(expires), signature: photoSignature(name, expires, key) })}` }
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs() })
describe('Places photo security and failure handling', () => {
  it('accepts only fresh signed photo references', () => {
    const expires = Date.now() + 60000
    const signature = photoSignature(name, expires, key)
    expect(validPhotoToken(name, expires, signature, key)).toBe(true)
    expect(validPhotoToken(name + 'changed', expires, signature, key)).toBe(false)
    expect(validPhotoToken(name, expires, signature, 'other-key')).toBe(false)
    expect(validPhotoToken(name, Date.now() - 1, signature, key)).toBe(false)
    expect(validPhotoToken('../keys', expires, signature, key)).toBe(false)
  })
  it('redirects to a keyless Google photo without caching', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', key)
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ photoUri: 'https://lh3.googleusercontent.com/example' }) })
    vi.stubGlobal('fetch', fetcher)
    const res = response(); await handler(request(), res)
    expect(fetcher.mock.calls[0][0]).not.toContain(key)
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'private, no-store')
    expect(res.setHeader).toHaveBeenCalledWith('Location', 'https://lh3.googleusercontent.com/example')
    expect(res.status).toHaveBeenCalledWith(302)
  })
  it('rejects unsigned requests before calling a billable API', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', key); const fetcher = vi.fn(); vi.stubGlobal('fetch', fetcher)
    const res = response(); await handler({method: 'GET', url: '/?name=invalid'}, res)
    expect(res.status).toHaveBeenCalledWith(400); expect(fetcher).not.toHaveBeenCalled()
  })
  it.each(['https://evil.example/photo', 'http://lh3.googleusercontent.com/photo', 'https://lh3.googleusercontent.com.evil.example/photo'])('rejects an unexpected redirect %s', async photoUri => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', key)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok: true, json: async () => ({photoUri})}))
    const res = response(); await handler(request(), res)
    expect(res.status).toHaveBeenCalledWith(502)
    expect(res.setHeader).not.toHaveBeenCalledWith('Location', expect.anything())
  })
  it('handles upstream failure without leaking its message', async () => {
    vi.stubEnv('GOOGLE_PLACES_API_KEY', key)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('private upstream details')))
    const res = response(); await handler(request(), res)
    expect(res.status).toHaveBeenCalledWith(502); expect(res.end).toHaveBeenCalledWith()
  })
})
