/* 오늘낚시 정보 페이지 동작: 휴대폰 메뉴만. 글은 자바스크립트 없이도 다 보인다. */
(() => {
  const menuBtn = document.querySelector('.menu-btn');
  const nav = document.getElementById('nav');
  if (!menuBtn || !nav) return;
  menuBtn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
    menuBtn.firstElementChild.className = open ? 'ph ph-x' : 'ph ph-list';
  });
})();
