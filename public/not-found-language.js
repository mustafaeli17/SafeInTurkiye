// Vercel serves one static 404 document. Use the locale already present in the URL.
const locale = window.location.pathname.split('/')[1];
const variant = document.getElementById('not-found-' + locale);
if (variant instanceof HTMLTemplateElement) {
  const content = variant.content.cloneNode(true);
  const main = content.querySelector('main');
  document.documentElement.lang = main.lang;
  document.documentElement.dir = main.dir;
  document.title = main.querySelector('h1').textContent + ' | SafeInTürkiye';
  document.querySelector('main').replaceWith(content);
}
