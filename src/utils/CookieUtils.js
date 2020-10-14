import Cookies from 'js-cookie'
export function getCookie(name) {
  return Cookies.get(name)
}
export function setCookie(name, value, expiredays, domain) {
  var exdate = new Date();
  exdate.setDate(exdate.getDate() + expiredays);
  let cookie = name + "=" + escape(value) + ";expires=" + exdate.toGMTString() + ";path=/"
  if(domain){
    cookie += ";domain=" + domain
  }
  document.cookie = cookie;
}
export function delCookie(name) {
  setCookie(name, "", -1);
}