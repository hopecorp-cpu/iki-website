(() => {
  const ja = document.documentElement.lang === 'ja';
  const menu = document.querySelector('.menubtn');
  if (menu) {
    const label = () => menu.setAttribute('aria-label', menu.getAttribute('aria-expanded') === 'true' ? (ja ? 'メニューを閉じる' : 'Close menu') : (ja ? 'メニューを開く' : 'Open menu'));
    label();
    new MutationObserver(label).observe(menu, {attributes:true,attributeFilter:['aria-expanded']});
  }
})();
