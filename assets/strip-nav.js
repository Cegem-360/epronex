/* Epronex — horizontal navigation for the opened project strip (Ref. V2).
 *
 * The case-study strip scrolls horizontally. A trackpad can swipe it, but a
 * traditional wheel mouse has no horizontal axis, so those visitors could not
 * move it at all. big.dk solves this two ways and we do the same:
 *
 *   1. edge zones — the pointer becomes a left/right arrow near the screen
 *      edges, and a click pages the strip that way
 *   2. click-and-drag anywhere on the strip
 *
 * Deliberately NOT mapped: vertical wheel -> horizontal scroll. big.dk avoids
 * it too, and for good reason — it traps the page, because you can no longer
 * scroll past an open project without the strip swallowing the gesture.
 *
 * Desktop only: below lg the strip is stacked vertically by responsive.css,
 * so there is nothing to scroll sideways.
 *
 * For the TALL rebuild: this is a small Alpine component on the strip element.
 */
(function () {
  /* Each zone covers nearly half the viewport, leaving a narrow neutral band in
     the middle. The old 16%/220px cap made the arrows a thin sliver most people
     never found. */
  var EDGE_RATIO = 0.45;      /* share of the viewport treated as an edge zone */
  var EDGE_MIN = 90;
  var PAGE_RATIO = 0.8;       /* how far one click scrolls, as a share of width */
  var DRAG_THRESHOLD = 6;     /* px before a press becomes a drag, not a click  */

  function cursor(dir) {
    var d = dir < 0 ? 'M25 14l-8 8 8 8' : 'M19 14l8 8-8 8';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44">' +
              '<circle cx="22" cy="22" r="19" fill="rgba(27,29,26,.58)"/>' +
              '<path d="' + d + '" fill="none" stroke="#fff" stroke-width="2.2" ' +
              'stroke-linecap="round" stroke-linejoin="round"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 22 22, pointer';
  }
  var CUR_LEFT = cursor(-1), CUR_RIGHT = cursor(1);

  function active() { return matchMedia('(min-width: 1024px)').matches; }

  function stripAt(target) {
    var el = target && target.closest ? target.closest('.big-project-view') : null;
    if (!el) return null;
    /* only when it is actually a horizontal scroller (i.e. a project is open) */
    return el.scrollWidth > el.clientWidth + 4 ? el : null;
  }

  function edge(x) {
    var w = Math.max(EDGE_MIN, innerWidth * EDGE_RATIO);
    if (x < w) return -1;
    if (x > innerWidth - w) return 1;
    return 0;
  }

  var dragging = null;   /* {strip, startX, startScroll, moved} */
  var suppressClick = false;

  document.addEventListener('pointermove', function (e) {
    if (dragging) {
      var dx = e.clientX - dragging.startX;
      if (Math.abs(dx) > DRAG_THRESHOLD) dragging.moved = true;
      if (dragging.moved) {
        dragging.strip.scrollLeft = dragging.startScroll - dx;
        e.preventDefault();
      }
      return;
    }
    if (!active()) return;
    var strip = stripAt(e.target);
    if (!strip) return;
    var dir = edge(e.clientX);
    strip.style.cursor = dir === -1 ? CUR_LEFT : dir === 1 ? CUR_RIGHT : '';
  }, { passive: false });

  document.addEventListener('pointerdown', function (e) {
    if (!active() || e.button !== 0) return;
    var strip = stripAt(e.target);
    if (!strip) return;
    dragging = { strip: strip, startX: e.clientX, startScroll: strip.scrollLeft, moved: false };
  });

  document.addEventListener('pointerup', function (e) {
    if (!dragging) return;
    var strip = dragging.strip, moved = dragging.moved;
    dragging = null;
    if (moved) {
      /* a drag must not also open/re-centre the project underneath */
      suppressClick = true;
      setTimeout(function () { suppressClick = false; }, 0);
      return;
    }
    var dir = edge(e.clientX);
    if (!dir) return;                       /* plain click in the middle: leave it alone */
    suppressClick = true;
    setTimeout(function () { suppressClick = false; }, 0);
    strip.scrollBy({ left: dir * strip.clientWidth * PAGE_RATIO, behavior: 'smooth' });
  });

  /* capture phase so the project link never sees a click that was a drag or a page */
  document.addEventListener('click', function (e) {
    if (!suppressClick) return;
    e.preventDefault();
    e.stopPropagation();
  }, true);

  /* dragging over images would otherwise start a native image drag */
  document.addEventListener('dragstart', function (e) {
    if (stripAt(e.target)) e.preventDefault();
  });
})();
