// 구글 애즈 전환 측정 (beta.html 만 씀). <meta name="gads-id"> 와 <meta name="gads-signup"> 에 값이 있을 때만 켜진다.
// 「신청하기」(구글 폼으로 가는 링크)를 누르면 전환 한 번. 폼 안의 제출 완료는 다른 도메인이라 잴 수 없다.
// 이름·연락처 같은 신청 내용은 보내지 않는다. 켜기 전에 개인정보처리방침 「이 홈페이지」 절이 이 내용을 적고 있어야 한다.
(() => {
  const meta = (n) => (document.querySelector(`meta[name="${n}"]`)?.content || '').trim();
  const id = meta('gads-id'); // 예: AW-123456789
  const label = meta('gads-signup'); // 전환 액션 라벨
  if (!/^AW-\d+$/.test(id) || !label) return;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  gtag('js', new Date());
  gtag('config', id);
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);

  // 같은 방문에서 여러 번 눌러도 전환은 한 번만 (구글 쪽 「전환 1회」 설정과 같이 씀)
  let sent = false;
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href*="forms.gle"], a[href*="docs.google.com/forms"]');
    if (!a || sent) return;
    sent = true;
    gtag('event', 'conversion', { send_to: `${id}/${label}`, transport_type: 'beacon' });
  });
})();
