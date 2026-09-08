/* Navigation for retained translated Blog pages; their content scripts remain intact. */
(() => {
 const menu = document.querySelector('.menubtn'), nav = document.querySelector('#nav');
 const language = document.querySelector('.language-switch');
 menu?.addEventListener('click', () => {
   const open = menu.getAttribute('aria-expanded') !== 'true';
   menu.setAttribute('aria-expanded', String(open));
   nav?.classList.toggle('open', open);
 });
 document.addEventListener('click', e => {if (language && !language.contains(e.target)) language.open=false;});
 document.addEventListener('keydown', e => {
   if (e.key !== 'Escape') return;
   if (language?.open) {language.open=false;language.querySelector('summary').focus();}
   if (nav?.classList.contains('open')) {nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.focus();}
 });
})();
