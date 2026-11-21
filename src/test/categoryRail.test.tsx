import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import CategoryRail from '../components/CategoryRail'

describe('category navigation', () => {
  it.each([
    ['tr', 'Sonraki kategorileri göster'], ['en', 'Show more categories'],
    ['de', 'Weitere Kategorien anzeigen'], ['fr', 'Afficher plus de catégories'],
    ['es', 'Ver más categorías'], ['ar', 'عرض المزيد من الفئات'],
    ['ru', 'Показать ещё категории'], ['zh', '显示更多类别'],
  ])('keeps browsing controls separate from category form submissions in %s', (lang, moreLabel) => {
    const markup = renderToStaticMarkup(<form>
      <CategoryRail className="vt-categories" label="Tours" lang={lang}>
        <button type="submit" name="category" value="1" aria-pressed={true}>City tours</button>
      </CategoryRail>
    </form>)
    expect(markup).toContain(`aria-label="${moreLabel}"`)
    expect(markup).toContain(lang === 'ar' ? 'dir="rtl"' : 'dir="ltr"')
    expect(markup.match(/type="button"/g)).toHaveLength(2)
    expect(markup.match(/type="submit"/g)).toHaveLength(1)
    const categoryButton = markup.match(/<button\b[^>]*type="submit"[^>]*>/)?.[0]
    for (const attribute of ['name="category"', 'value="1"', 'aria-pressed="true"']) {
      expect(categoryButton).toContain(attribute)
    }
    const trackId = markup.match(/<div id="([^"]+)" class="category-rail-track/)?.[1]
    expect(trackId).toBeTruthy()
    expect(markup.split(`aria-controls="${trackId}"`)).toHaveLength(3)
  })
})
