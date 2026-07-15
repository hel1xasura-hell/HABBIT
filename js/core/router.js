/**
 * router.js — Screen router
 * ------------------------------------------------------------------------
 * Hash-based navigation (#dashboard, #checkin, ...). Kept deliberately
 * simple and framework-free: a route is just a name mapped to a render
 * function that returns an HTML string. This isolates "which screen is
 * showing" logic from the UI modules themselves, similar to how a
 * native app's navigation stack would work.
 * ------------------------------------------------------------------------
 */

const routes = {}; // name -> async (params) => htmlString
const onEnter = {}; // name -> async (params) => void, called after render (attach listeners etc.)

function registerRoute(name, renderFn, enterFn) {
  routes[name] = renderFn;
  if (enterFn) onEnter[name] = enterFn;
}

function currentRoute() {
  const hash = location.hash.replace('#', '') || 'dashboard';
  const [name, query] = hash.split('?');
  const params = Object.fromEntries(new URLSearchParams(query || ''));
  return { name, params };
}

async function renderRoute() {
  const { name, params } = currentRoute();
  const mount = document.getElementById('screen-mount');
  const renderFn = routes[name] || routes.dashboard;

  if (!renderFn) return;
  mount.innerHTML = await renderFn(params);
  if (onEnter[name]) await onEnter[name](params);

  updateNavActive(name);
  updateFabVisibility(name);
  mount.scrollTop = 0;
}

function updateNavActive(name) {
  document.querySelectorAll('.nav-item').forEach((el) => {
    el.classList.toggle('active', el.dataset.route === name);
  });
}

function updateFabVisibility(name) {
  const fab = document.getElementById('urgeFab');
  if (!fab) return;
  const hideOn = ['urge', 'login'];
  fab.classList.toggle('hidden', hideOn.includes(name));
}

function navigate(name, params) {
  const qs = params ? '?' + new URLSearchParams(params).toString() : '';
  location.hash = `${name}${qs}`;
}

window.addEventListener('hashchange', renderRoute);

window.Router = { registerRoute, renderRoute, navigate, currentRoute };
    
