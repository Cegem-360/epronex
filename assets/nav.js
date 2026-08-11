/* Epronex — mobile navigation.
   Builds the hamburger button and slide-in panel at runtime from the existing
   <nav>, so no page markup changes. Styling lives in assets/responsive.css.

   Runs on every page; below the lg breakpoint (1024px) the stylesheet hides the
   desktop <nav> and reveals the button. Above it, panel and scrim are hidden by
   CSS, so this is inert on desktop.

   Note for the Laravel/TALL rebuild: this is Alpine's job later
   (x-data="{open:false}" on the header). Kept framework-free here so the
   prototype has no build step. */
(function () {
  function init() {
    var header = document.querySelector('header');
    if (!header || document.querySelector('body > .epx-burger')) return;

    var nav = header.querySelector('nav');
    if (!nav) return;

    var html = document.documentElement;

    /* --- button ------------------------------------------------------- */
    var burger = document.createElement('button');
    burger.className = 'epx-burger';
    burger.type = 'button';
    burger.setAttribute('aria-label', 'Menü megnyitása');
    burger.setAttribute('aria-expanded', 'false');
    burger.innerHTML = '<span></span><span></span><span></span>';
    document.body.appendChild(burger);   /* fixed-positioned by responsive.css */

    /* --- panel, cloned from the real nav so links never drift ---------- */
    var panel = document.createElement('nav');
    panel.className = 'epx-nav-panel';
    panel.setAttribute('aria-label', 'Mobil menü');
    Array.prototype.forEach.call(nav.querySelectorAll('a'), function (a) {
      var link = document.createElement('a');
      link.href = a.getAttribute('href');
      link.textContent = (a.textContent || '').trim();
      panel.appendChild(link);
    });

    var scrim = document.createElement('div');
    scrim.className = 'epx-nav-scrim';

    document.body.appendChild(scrim);
    document.body.appendChild(panel);

    /* --- open / close -------------------------------------------------- */
    var open = false;

    function set(next) {
      open = next;
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Menü bezárása' : 'Menü megnyitása');
      panel.classList.toggle('open', open);
      scrim.classList.toggle('open', open);
      html.classList.toggle('epx-nav-open', open);
      /* keep the panel out of the tab order while closed */
      panel.setAttribute('aria-hidden', String(!open));
    }
    set(false);

    burger.addEventListener('click', function () { set(!open); });
    scrim.addEventListener('click', function () { set(false); });

    /* an in-page anchor should close the panel and let the scroll happen */
    panel.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') set(false);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && open) { set(false); burger.focus(); }
    });

    /* resizing up to desktop must not leave the page scroll-locked */
    var mq = matchMedia('(min-width: 1024px)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(
      function (e) { if (e.matches && open) set(false); }
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  /* the .dc.html pages render their header through the DC runtime, so the
     <nav> may not exist yet at DOMContentLoaded — retry briefly. */
  var tries = 0;
  var poll = setInterval(function () {
    if (document.querySelector('body > .epx-burger') || ++tries > 60) return clearInterval(poll);
    init();
  }, 100);
})();
