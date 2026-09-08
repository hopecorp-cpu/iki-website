/* Brand assets only; product and payment logic stays in the existing shop. */
(() => {
  for (const id of ['ikiLogo', 'ikiLogoF', 'splitLogo']) {
    const logo = document.getElementById(id);
    if (logo) logo.src = '/assets/logo/iki-mark.png';
  }
  const language = document.querySelector('.shop-language');
  document.addEventListener('click', event => {
    if (language && !language.contains(event.target)) language.open = false;
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && language) language.open = false;
  });
})();
