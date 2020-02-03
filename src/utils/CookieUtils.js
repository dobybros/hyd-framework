import Cookies from 'js-cookie'
export function getCookie(name) {
  return Cookies.get(name)
}
export function setCookie(name, value) {
  console.log(name, value)
  document.cookie = name + "=" + escape(value) + ";path=/";
}