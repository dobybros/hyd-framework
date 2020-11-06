import Cookies from 'js-cookie'
export function getCookie(name) {
  return Cookies.get(name)
}
export function setCookie(name, value) {
  console.log(name, value)
  document.cookie = name + "=" + escape(value) + ";path=/";
}
export function delCookie(name) {
  var exp = new Date();
  exp.setTime(exp.getTime() - 1);
  var cval = getCookie(name);
  if (cval != null)
    document.cookie = name + "=" + cval + ";expires=" + exp.toGMTString();
}