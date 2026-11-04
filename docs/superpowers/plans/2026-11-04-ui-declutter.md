# UI decluttering implementation plan
Goal: remove repeated visit panel without losing relevant help; improve mobile readability and touch targets.
Scope approved in chat. Reuse checkout; preserve unrelated READINESS-SPRINT and untracked files. No production deployment.
1. SearchGuide: no interactive output on home/city/info/FAQ pages, whose existing components provide their content. Tool pages retain only their localized practical Q&A, no repeated intro or city/tool navigation. Standalone HTML continues providing the same public facts and links; no bot-specific rendering.
2. App mobile nav: localized open/close labels, expanded state, 44px targets and RTL alignment.
3. Home search: 16px mobile input, visible focus and 44px submit. Retain city links and existing navigation.
4. Nearby cards: consistent accessible contact/source controls, logical text alignment; no provider/data changes.
Verification: regression for removed widget and preserved 8-language answers, build/typecheck/lint/SEO, browser mobile home/menu and Arabic plus desktop tool/list layout. No live release in this task.
