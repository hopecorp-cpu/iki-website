/* Brand assets and language navigation; prices and payment logic stay in the existing shop. */
(() => {
  for (const id of ['ikiLogo', 'ikiLogoF', 'splitLogo']) {
    const logo = document.getElementById(id);
    if (logo) logo.src = '/assets/logo/iki-mark.png';
  }
  // Translated product names generate different slugs; vn is the existing canonical name.
  const requested = new URLSearchParams(location.search).get('sp');
  if (requested && typeof PRODUCTS !== 'undefined' && typeof slugHoa === 'function' && !currentProduct) {
    const canonical = slugHoa(requested);
    const product = PRODUCTS.find(p => slugHoa(p.vn || p.n) === canonical)
      || PRODUCTS.find(p => slugHoa(p.vn || p.n).includes(canonical));
    if (product) openDetail(product);
  }
  const language = document.querySelector('.shop-language');
  const updateLanguageLinks = () => {
    if (!language) return;
    for (const link of language.querySelectorAll('a[href]')) {
      const destination = new URL(link.href);
      destination.search = location.search;
      if (typeof currentProduct !== 'undefined' && currentProduct && document.querySelector('#detail.on')) {
        destination.searchParams.set('sp', slugHoa(currentProduct.vn || currentProduct.n));
      }
      destination.hash = location.hash;
      link.href = destination.pathname + destination.search + destination.hash;
    }
  };
  updateLanguageLinks();
  language?.addEventListener('click', updateLanguageLinks);
  document.addEventListener('click', event => {
    if (language && !language.contains(event.target)) language.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && language) language.open = false;
  });
})();
