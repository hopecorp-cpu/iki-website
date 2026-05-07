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

/* ===== Exit-intent popup ===== */
(function () {
  const popup = document.getElementById('exit-popup');
  if (!popup) return;
  const closeBtn = document.getElementById('exit-popup-close');
  const form = document.getElementById('exit-popup-form');
  const STORAGE = 'iki-exit-popup-seen';

  function show() {
    if (sessionStorage.getItem(STORAGE)) return;
    popup.classList.add('is-open');
    popup.setAttribute('aria-hidden', 'false');
    sessionStorage.setItem(STORAGE, '1');
  }
  function hide() {
    popup.classList.remove('is-open');
    popup.setAttribute('aria-hidden', 'true');
  }

  // Trigger on mouse leaving viewport top (desktop)
  document.addEventListener('mouseleave', function (e) {
    if (e.clientY < 0) show();
  });
  // Mobile fallback: trigger after 30 seconds of scroll
  let scrolled = false;
  window.addEventListener('scroll', function () {
    if (!scrolled && window.scrollY > 1500) {
      scrolled = true;
      setTimeout(show, 25000);
    }
  });
  closeBtn?.addEventListener('click', hide);
  popup.addEventListener('click', function (e) { if (e.target === popup) hide(); });

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = form.querySelector('input[type="email"]');
      if (!input || !input.value) return;
      const subject = encodeURIComponent('[Exit popup] Đăng ký lộ trình 3 Ngày Reset miễn phí');
      const body = encodeURIComponent('Email: ' + input.value + '\n\nVui lòng gửi cho tôi lộ trình 3 Ngày Reset + bài khảo sát thể tạng.');
      window.location.href = 'mailto:contact@ikihealing.com?subject=' + subject + '&body=' + body;
      hide();
      alert('Cảm ơn anh/chị đã đăng ký! Vui lòng kiểm tra email trong vài phút tới.');
    });
  }
})();

/* ===== Quiz: Bạn thuộc thể tạng nào? ===== */
(function () {
  const launcher = document.getElementById('quiz-launch-btn');
  const modal = document.getElementById('quiz-modal');
  if (!launcher || !modal) return;
  const closeBtn = document.getElementById('quiz-close');
  const steps = modal.querySelectorAll('.quiz-step');
  const dots = modal.querySelectorAll('.quiz-progress-dot');
  let answers = [];
  let currentStep = 0;

  const TYPES = {
    'Hàn': {
      title: 'Thể Hàn — Cơ thể thiên về lạnh',
      desc: 'Bạn có xu hướng cơ thể thiên về lạnh, dễ cảm khi trời chuyển mùa. Lộ trình tham khảo: ưu tiên thực phẩm ấm (gừng, quế, gạo lứt rang), tránh đồ lạnh và sống. Vận động nhẹ buổi sáng để dương khí lên.'
    },
    'Nhiệt': {
      title: 'Thể Nhiệt — Cơ thể thiên về nóng',
      desc: 'Bạn có xu hướng cơ thể thiên về nóng, dễ bốc hoả. Lộ trình tham khảo: ưu tiên thực phẩm thanh mát (bí xanh, đậu xanh, trà thảo mộc), hạn chế đồ chiên/rán. Thiền và hơi thở 4 thì giúp cân bằng.'
    },
    'Hư': {
      title: 'Thể Hư — Cơ thể thiếu khí huyết',
      desc: 'Bạn có xu hướng thiếu năng lượng, dễ mệt. Lộ trình tham khảo: ưu tiên thực phẩm bổ dưỡng (đậu đen, hạt sen, thịt nhẹ), ngủ đủ giấc, tránh stress kéo dài. Vận động nhẹ nhàng đều đặn.'
    },
    'Đàm thấp': {
      title: 'Thể Đàm thấp — Cơ thể tích nước/đờm',
      desc: 'Bạn có xu hướng tích nước, cảm giác cơ thể nặng. Lộ trình tham khảo: ưu tiên thực phẩm khô (yến mạch, hạt sen), hạn chế đồ ngọt và sữa lạnh. Tăng vận động hàng ngày để chuyển hoá tốt hơn.'
    },
    'Thực': {
      title: 'Thể Thực — Cơ thể thừa năng lượng',
      desc: 'Cơ thể bạn đang trong trạng thái cân bằng tương đối. Lộ trình tham khảo: duy trì thói quen lành mạnh hiện tại, có thể bắt đầu với 3 Ngày Reset để hiểu sâu hơn về cơ địa.'
    }
  };

  function showStep(n) {
    steps.forEach((s, i) => s.classList.toggle('is-active', i === n));
    dots.forEach((d, i) => d.classList.toggle('is-active', i <= Math.min(n, 4)));
  }

  function calcResult() {
    const counts = {};
    answers.forEach(a => counts[a] = (counts[a] || 0) + 1);
    let max = 0, type = 'Thực';
    for (const k in counts) {
      if (counts[k] > max) { max = counts[k]; type = k; }
    }
    return type;
  }

  function showResult() {
    const type = calcResult();
    const t = TYPES[type] || TYPES['Thực'];
    document.getElementById('quiz-result-badge').textContent = 'Thể ' + type;
    document.getElementById('quiz-result-title').textContent = t.title;
    document.getElementById('quiz-result-desc').textContent = t.desc;
    showStep(5);
  }

  launcher.addEventListener('click', function () {
    answers = [];
    currentStep = 0;
    showStep(0);
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  });

  closeBtn?.addEventListener('click', function () {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  });

  modal.addEventListener('click', function (e) {
    if (e.target === modal) {
      modal.classList.remove('is-open');
      modal.setAttribute('aria-hidden', 'true');
    }
  });

  modal.querySelectorAll('.quiz-option').forEach(btn => {
    btn.addEventListener('click', function () {
      answers.push(this.dataset.answer);
      currentStep++;
      if (currentStep < 5) showStep(currentStep);
      else showResult();
    });
  });

  const emailForm = document.getElementById('quiz-email-form');
  if (emailForm) {
    emailForm.addEventListener('submit', function (e) {
      e.preventDefault();
      const input = emailForm.querySelector('input[type="email"]');
      if (!input || !input.value) return;
      const type = calcResult();
      const subject = encodeURIComponent('[Quiz] Kết quả thể tạng: ' + type);
      const body = encodeURIComponent('Email: ' + input.value + '\nThể tạng: ' + type + '\n\nVui lòng gửi lộ trình tham khảo phù hợp với thể tạng của tôi.');
      window.location.href = 'mailto:contact@ikihealing.com?subject=' + subject + '&body=' + body;
      modal.classList.remove('is-open');
      alert('Cảm ơn anh/chị! Lộ trình tham khảo sẽ được gửi qua email.');
    });
  }
})();
