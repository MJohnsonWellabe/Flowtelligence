/* components-root.js — used by index.html at root level */
const NAV_HTML = `
<nav id="site-nav">
  <div id="hamburger" aria-label="Toggle menu" role="button" tabindex="0">
    <span></span><span></span><span></span>
  </div>
  <a class="nav-brand" href="index.html">Low<span class="brand-a">tech</span></a>
  <a class="btn btn-primary nav-cta" href="pages/contact.html">Contact Us</a>
</nav>
<div id="sidebar">
  <ul class="sidebar-menu">
    <li><a href="pages/about.html">About Us</a></li>
    <li class="has-submenu">
      <span>Our Products <span class="arrow">›</span></span>
      <ul class="sidebar-submenu">
        <li><a href="pages/products.html">All Products</a></li>
        <li><a href="pages/medicare-supplement.html">Medicare Supplement</a></li>
        <li><a href="pages/preneed.html">Preneed</a></li>
        <li><a href="pages/final-expense.html">Final Expense</a></li>
        <li><a href="pages/annuity.html">Annuity</a></li>
        <li><a href="pages/ancillary-health.html">Ancillary Health</a></li>
      </ul>
    </li>
    <li class="has-submenu">
      <span>Our Tools <span class="arrow">›</span></span>
      <ul class="sidebar-submenu">
        <li><a href="pages/tools.html">All Tools</a></li>
        <li><a href="pages/products.html">Orchestrator</a></li>
        <li><a href="pages/tools.html#enroller">Enroller</a></li>
        <li><a href="pages/activity-map.html">Pulse</a></li>
        <li><a href="pages/tools.html#engage">Engage</a></li>
        <li><a href="pages/my-easy-match.html">MatchIQ</a></li>
        <li><a href="pages/see-matchiq-in-action.html">See MatchIQ in Action</a></li>
        <li><a href="pages/tools.html#launchpad">Launchpad</a></li>
      </ul>
    </li>
    <li><a href="pages/contact.html">Contact Us</a></li>
    <li><a href="pages/case-study-growth.html">Case Studies</a></li>
        <li><a href="pages/see-it-in-action.html">See Enroller in Action</a></li>
        <li><a href="pages/see-orchestrator-in-action.html">See Orchestrator in Action</a></li>
        <li><a href="pages/see-matchiq-in-action.html">See MatchIQ in Action</a></li>
    <li><a href="pages/join-the-team.html">Join the Team</a></li>
  </ul>
</div>
<div id="sidebar-overlay"></div>
`;

const FOOTER_HTML = `
<footer id="site-footer">
  <div class="footer-grid">
    <div>
      <div class="footer-brand">Low<span class="brand-a">tech</span></div>
      <p style="color:rgba(255,255,255,0.6);font-size:0.9rem;margin-top:0.5rem;max-width:280px;">
        Intelligence in motion.
      </p>
    </div>
    <div>
      <h4>Products</h4>
      <ul>
        <li><a href="pages/medicare-supplement.html">Medicare Supplement</a></li>
        <li><a href="pages/preneed.html">Preneed</a></li>
        <li><a href="pages/final-expense.html">Final Expense</a></li>
        <li><a href="pages/annuity.html">Annuity</a></li>
        <li><a href="pages/ancillary-health.html">Ancillary Health</a></li>
      </ul>
    </div>
    <div>
      <h4>Tools</h4>
      <ul>
        <li><a href="pages/products.html">Orchestrator</a></li>
        <li><a href="pages/tools.html#enroller">Enroller</a></li>
        <li><a href="pages/activity-map.html">Pulse</a></li>
        <li><a href="pages/tools.html#engage">Engage</a></li>
        <li><a href="pages/tools.html#launchpad">Launchpad</a></li>
      </ul>
    </div>
    <div>
      <h4>Company</h4>
      <ul>
        <li><a href="pages/about.html">About Us</a></li>
        <li><a href="pages/contact.html">Contact Us</a></li>
        <li><a href="pages/case-study-growth.html">Case Studies</a></li>
        <li><a href="pages/see-it-in-action.html">See Enroller in Action</a></li>
        <li><a href="pages/see-orchestrator-in-action.html">See Orchestrator in Action</a></li>
        <li><a href="pages/see-matchiq-in-action.html">See MatchIQ in Action</a></li>
    <li><a href="pages/join-the-team.html">Join the Team</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    &copy; <span id="footer-year"></span> Lowtech. All rights reserved.
  </div>
</footer>
`;

document.getElementById('nav-placeholder').innerHTML = NAV_HTML;
document.getElementById('footer-placeholder').innerHTML = FOOTER_HTML;
document.getElementById('footer-year').textContent = new Date().getFullYear();

const s = document.createElement('script');
s.src = 'assets/js/nav.js';
document.body.appendChild(s);

const cb = document.createElement("script");
cb.src = "assets/js/chatbot.js";
document.body.appendChild(cb);

const ft = document.createElement("script");
ft.src = "assets/js/features.js";
document.body.appendChild(ft);
