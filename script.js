/* IKI website — minimal interactions
   - Mobile hamburger toggle
   - Email capture form (mailto fallback, no backend)
*/
(function () {
  'use strict';

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      const open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Close menu when clicking a link inside it
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    // Close on Esc
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        document.body.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
    // Close when tapping the dim overlay outside the menu panel
    document.addEventListener('click', function (e) {
      if (!document.body.classList.contains('nav-open')) return;
      // Click is on overlay only if it's outside the .nav-links panel and outside the toggle button
      if (links.contains(e.target) || toggle.contains(e.target)) return;
      document.body.classList.remove('nav-open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }

  // Email capture (uses mailto: until a real backend is wired up)
  const form = document.querySelector('.email-capture-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      const consent = document.querySelector('#consent-pdpa');
      const success = document.querySelector('.email-capture-success');
      if (!input || !input.value) return;
      if (consent && !consent.checked) {
        consent.focus();
        alert('Vui lòng tích đồng ý xử lý dữ liệu cá nhân theo Nghị định 13/2023 trước khi gửi.');
        return;
      }
      const subject = encodeURIComponent('Đăng ký nhận lộ trình IKI miễn phí');
      const body = encodeURIComponent('Email đăng ký: ' + input.value + '\n\nĐã đồng ý xử lý dữ liệu cá nhân theo Chính sách bảo mật của HOPE CORP (NĐ 13/2023).\n\nVui lòng gửi cho tôi lộ trình 3 Ngày Reset miễn phí và bài khảo sát lối sống tham khảo.');
      window.location.href = 'mailto:contact@ikihealing.com?subject=' + subject + '&body=' + body;
      if (success) {
        success.classList.add('is-visible');
        form.style.display = 'none';
      }
    });
  }
})();
