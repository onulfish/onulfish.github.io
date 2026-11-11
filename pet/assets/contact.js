// 문의처는 여기 한 곳에서만 바꿔요(개인정보처리방침·계정 삭제 안내가 같이 씀).
var OP_CONTACT={name:'오늘펫 운영팀',email:'pet@onulfish.com'};
document.querySelectorAll('[data-contact]').forEach(function(el){el.innerHTML='운영: '+OP_CONTACT.name+'<br>문의: <a href="mailto:'+OP_CONTACT.email+'">'+OP_CONTACT.email+'</a>';});
document.querySelectorAll('[data-contact-name]').forEach(function(el){el.textContent=OP_CONTACT.name;});
document.querySelectorAll('[data-contact-email]').forEach(function(el){el.innerHTML='<a href="mailto:'+OP_CONTACT.email+'">'+OP_CONTACT.email+'</a>';});
