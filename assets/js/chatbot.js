/**
 * Lowtech – Site Chatbot
 * Injects a floating chat widget on every page.
 * Calls the Anthropic Messages API with full site context + strict system prompt.
 *
 * SETUP: Replace the API_KEY value below with your Anthropic API key.
 * For production, proxy this through your own backend so the key is not exposed.
 */

(function () {
  'use strict';

  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const API_KEY = 'YOUR_ANTHROPIC_API_KEY'; // PLACEHOLDER: replace with your key
  const MODEL   = 'claude-sonnet-4-20250514';

  // ── SITE CONTENT CORPUS ─────────────────────────────────────────────────────
  // Core site content used as context for every chat message.
  // Update this object if you add new pages or change content.
  const SITE_CONTENT = `
=== Lowtech Website Content ===

COMPANY OVERVIEW
Lowtech builds intelligent insurance application technology. Core product: Orchestrator (enrollment and underwriting workflow engine). Full tool suite: Engage.
Mission: Create the best insurance buying and engagement experiences for consumers and agents, via fast, intuitive technology solutions that help clients grow.
Vision: Become the trusted platform partner for modern insurance buying and underwriting — recognized for speed, flexibility, and results — while reshaping how carriers go to market in a digital-first world.
Built by career carrier operators. First client more than doubled year-over-year sales by removing friction at the point of sale.

PLATFORM ADVANTAGE / WHAT WE BRING TO MARKET
Business Strategy:
- Drive profitable growth: Unlock new revenue by expanding distribution, launching products faster, and optimizing agent workflows.
- Improve agent experience: Simplify how agents quote, sell, and service insurance products with intuitive tools and real-time decisions.
- Accelerate speed to market: Move from concept to launch faster with configurable capabilities that reduce development, testing, and approval cycles.
- Provide executive-level insights: Deliver timely, decision-ready insights that connect performance, risk, and growth across the enterprise.

Technology:
- Align and manage the business: Empower teams to act faster with configurable tools that reduce friction and dependency on IT.
- Enable rapid setup and integration: Plug into internal systems and external partners quickly using modular, API-first integrations.
- Apply AI-enabled capabilities and analytics: Automate decisions, elevate insights, and streamline workflows with responsibly-applied AI.
- Reduce total cost of ownership: Provide mid-sized and regional carriers with affordable access to modern technology without requiring scale.

Product:
- Accelerate product agility and speed: Rapidly iterate on product features, rules, and enhancements without long development cycles.
- Broaden and deepen distribution relationships: Expand reach and activate new channels with tools designed for diverse distribution models.
- Provide insurance industry expertise: Embed proven carrier knowledge and best practices directly into configurable platform capabilities.
- Align pricing to outcomes: Charge carriers based on outcomes delivered, not seats, licenses, or unused capacity.

Sales & Underwriting:
- Enable point-of-sale decisions: Provide instant decisions and issue policies in minutes, not days or weeks.
- Maximize straight-through processing: Increase touchless application flow by automating routine decisions and exceptions.
- Optimize underwriting and risk management: Calibrate risk selection to improve outcomes while maintaining disciplined risk management.
- Deliver real-time visibility: Give business leaders live reporting to monitor performance and make informed decisions faster.

Agent Experience:
- Modernize the purchasing experience: Deliver an industry-leading, point-of-sale experience that agents want to use.
- Boost agent productivity: Cut application time in half so agents can serve more customers with the same effort.
- Drive agent engagement: Drive activity and adoption with real-time messaging, gamification, and targeted engagement.
- Enable real-time agent visibility: Provide instant insight into agent activity to better support and accelerate performance.

PROVEN RESULTS (from live carrier deployments)
- 235% year-over-year sales growth, 2024 to 2025
- 75% STP / instant decisioning for UW and OE applications
- 27% reduction in acquisition costs over 12 months
- 58% increase in writing agents, 2024 to 2025
- 37% increase in applications written per agent
- 1+ product modifications per day on average in 2026

PRODUCTS
Medicare Supplement: Point-of-sale underwriting, guided enrollment, real-time decisioning for the most competitive market in insurance. Helps carriers drive sustainable growth, improve underwriting mix by moving decisions upstream, win agent preference through speed and simplicity, and move faster with product changes and market expansion.

Preneed: Modernized for consistency and quality. Transforms paper-driven market into digital. Moved carriers from ~20% to 100% electronic submissions. Straight-through processing from essentially 0% to over 60%. Improves quality through consistency. Supports innovation without disrupting distribution.

Final Expense: Simplified without compromise. Supports tiered underwriting (First Day Coverage, Graded, Guaranteed Issue) in one workflow. Rapidly shifts mix toward more First Day Coverage. True one-stop shop for agents. Growth from $3M to $30M+ annual run rate achieved in production.

Annuity: Reimagined for modern buying experience. Replaces legacy friction with modern point-of-sale workflow. Innovates without disrupting core systems (operates as system of engagement). Improves agent confidence and consistency.

Ancillary Health (HI, CI, STC): Built to handle variation, volume, and speed. Supports Hospital Indemnity, Critical Illness, and Short-Term Care in one configurable platform.

OUR TOOLS
Pulse: Real-time visual view of business activity across products and geographies.
MatchIQ: Automatically pairs customers with most appropriate product. Removes guesswork for agents.
Link: Integrated messaging within the enrollment workflow. Reduces follow-ups and off-platform coordination.
Spark: Real-time incentive visibility embedded in enrollment. Aligns agent behavior with carrier objectives immediately.
ScanIQ: Converts paper applications into structured digital submissions. Enables digital adoption without disrupting distribution.
LeadFlow: Supports digital lead capture and routing into guided enrollment workflows.

CASE STUDIES
Time to Market: Mid-sized regional carrier. Challenge: slow product change cycles. Solution: Lowtech as system of engagement. Impact: more frequent enhancements, shorter launch cycles (months to weeks), increased experimentation, year-over-year growth more than doubled.

Business Growth (a national carrier): Mutual insurance organization. Challenge: growing faster without operational strain. Solution: Lowtech for rapid iteration. Impact: more rapid product iteration, shortened launch timelines, year-over-year sales more than doubled, sustainable execution at scale.

Quality of Business: Multi-product carrier. Challenge: inconsistent application quality in certain channels. Solution: Lowtech to apply guardrails consistently, guide applicants toward higher-quality submissions. Impact: higher underwriting success rates, improved consistency across channels, access to previously avoided distribution segments.

Agent Satisfaction: Multi-product carrier. Challenge: complex applications, unclear underwriting outcomes creating friction. Agent quotes: "The platform is simple and easy to use. It looks good and is intuitive. It guides the user through the process like Amazon." / "This is the easiest system I use compared to other carriers. Auto-underwriting is amazing." / "If all carriers used a system like this, my life would be much simpler and better." Impact: increased agent preference, greater confidence at point of sale, higher quality submissions, stronger long-term engagement.

TEAM
Matt Johnson — CEO: Career insurance operator, former Chief Actuary and Growth Officer. Scaled Medicare Supplement sales from under $20M to over $180M in annual production in five years. Blends actuarial discipline with a builder's mindset.
Bill Butters — Lead Developer: Principal architect of the Orchestrator platform. Decades of carrier technology experience. Built the modern buying and underwriting platform at prior carrier that enabled rapid iteration and dramatically higher sales volume.
Dave Keith — Strategic Advisor: Co-founded SE2, built it into a leading annuity administration and outsourcing platform. Extensive experience launching and scaling technology-enabled insurance businesses.
Todd Nevenhoven — Operating Advisor: Deep experience leading operations at large carriers and TPAs. Brings operator's lens to platform implementation and client delivery.

FAQ
What is Lowtech? A configurable buying and underwriting platform that combines modern enrollment, real-time underwriting decisioning, and data visibility in a single, carrier-designed platform.
Who is it for? Carriers and distributors who want speed without sacrificing control. Ideal for organizations modernizing buying experience, improving agent satisfaction, increasing placement quality, and iterating faster without rebuilding core systems.
Will I control my underwriting decisions? Yes. Fully configurable to your underwriting philosophy, rules, and risk tolerances.
Key benefits: Faster time to market through configuration; improved agent experience; better quality of business through earlier decisioning; real-time visibility; platform built by carrier operators.

CONTACT
Visitors can contact the team through the Contact Us page on the website.
`;

  // ── SYSTEM PROMPT ────────────────────────────────────────────────────────────
  const SYSTEM_PROMPT = `You are a knowledgeable, credible product specialist for Lowtech, a carrier-facing intelligent insurance application platform. Key products: Orchestrator (core enrollment engine) and Engage (full tool suite). Your audience includes life & health carrier executives, product leaders, distribution leaders, and technology teams.

Critical constraints (never violate these):
1. You may ONLY answer questions using information explicitly provided in the Lowtech website content passed to you in each message.
2. If the answer is not clearly supported by the site content, say so plainly and offer to connect the visitor with the team.
3. Do NOT speculate, over-promise, or introduce features not described on the site.
4. Do NOT use marketing hype or buzzwords. Use plain, precise language suitable for insurance executives.
5. Do NOT answer questions about pricing, contracts, certifications, specific timelines, or client names unless explicitly stated on the site.
6. Do NOT compare Lowtech or its products to competitors unless the site explicitly does so.
7. Do NOT claim regulatory approval, security certifications, or performance metrics unless present on the site.

Tone: Clear. Professional. Operator-minded. Confident but not salesy. No startup hype language.

Behavior rules:
- Prefer concise answers, but expand when clarity requires it.
- When helpful, reference which part of the site your answer is based on (e.g., "Based on the Products section…").
- Translate technical concepts into business impact where appropriate.
- Assume the visitor is intelligent and time-constrained.
- If a question is broad, ask a single clarifying follow-up.
- If a user seems early in exploration, offer a short guided explanation.
- If a user seems ready for engagement, gently suggest contacting the team.

When information is missing, use wording like:
"I don't see that addressed on the site. If it helps, I can connect you with the team to go deeper — you can reach them via the Contact page."

Your goal: Help serious carrier stakeholders quickly understand whether Orchestrator and Engage are relevant to their operating model — with clarity, honesty, and credibility.`;

  // ── STATE ────────────────────────────────────────────────────────────────────
  let messages = [];
  let isTyping = false;
  // Remember minimize state across page navigations within this browser session.
  // First visit ever = open. Once user minimizes, stays minimized on all pages.
  var STORAGE_KEY = 'me_chat_minimized';
  var wasMinimized = sessionStorage.getItem(STORAGE_KEY) === 'true';
  var isOpen = !wasMinimized;

  // ── INJECT CSS ───────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #me-chat-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      font-family: 'DM Sans', system-ui, sans-serif;
      font-size: 14px;
      width: fit-content;
      height: fit-content;
    }
    /* display:none on hidden window means widget shrinks to toggle button only */

    /* Toggle button */
    #me-chat-toggle {
      width: 56px; height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0B1C2C, #12B5CC);
      border: none; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 20px rgba(11,31,74,0.35);
      transition: transform 0.2s, box-shadow 0.2s;
      margin-left: auto;
    }
    #me-chat-toggle:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(11,31,74,0.45); }
    #me-chat-toggle svg { width: 26px; height: 26px; fill: white; }

    /* Window */
    #me-chat-window {
      width: 360px;
      max-height: 560px;
      background: #ffffff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(11,31,74,0.22);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      margin-bottom: 12px;
      border: 1px solid #D9E2EE;
      transition: opacity 0.22s ease, transform 0.22s ease;
    }
    #me-chat-window.hidden {
      display: none !important;
    }

    /* Header */
    #me-chat-header {
      background: linear-gradient(135deg, #0B1C2C 0%, #0C3B4F 100%);
      padding: 14px 16px;
      display: flex; align-items: center; gap: 10px;
      flex-shrink: 0;
    }
    #me-chat-header .me-avatar {
      width: 36px; height: 36px; border-radius: 50%;
      background: linear-gradient(135deg, #12B5CC, #2DC8DE);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 13px; color: #0B1C2C;
      flex-shrink: 0;
    }
    #me-chat-header .me-info { flex: 1; }
    #me-chat-header .me-name { color: #ffffff; font-weight: 700; font-size: 14px; line-height: 1.2; }
    #me-chat-header .me-status { color: rgba(255,255,255,0.6); font-size: 12px; }
    #me-chat-minimize {
      background: none; border: none; cursor: pointer;
      color: rgba(255,255,255,0.6); font-size: 20px; line-height: 1;
      padding: 2px 4px; transition: color 0.15s;
    }
    #me-chat-minimize:hover { color: #ffffff; }

    /* Messages */
    #me-chat-messages {
      flex: 1; overflow-y: auto;
      padding: 16px 14px;
      display: flex; flex-direction: column; gap: 10px;
      background: #F8FAFC;
    }
    #me-chat-messages::-webkit-scrollbar { width: 4px; }
    #me-chat-messages::-webkit-scrollbar-track { background: transparent; }
    #me-chat-messages::-webkit-scrollbar-thumb { background: #D9E2EE; border-radius: 2px; }

    .me-msg {
      max-width: 88%;
      padding: 10px 13px;
      border-radius: 12px;
      line-height: 1.55;
      font-size: 13.5px;
      word-break: break-word;
    }
    .me-msg.bot {
      background: #ffffff;
      color: #1A202C;
      align-self: flex-start;
      border: 1px solid #EEF2F7;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 4px rgba(11,31,74,0.07);
    }
    .me-msg.user {
      background: linear-gradient(135deg, #0B1C2C, #0C3B4F);
      color: #ffffff;
      align-self: flex-end;
      border-bottom-right-radius: 4px;
    }
    .me-msg.typing {
      background: #ffffff;
      align-self: flex-start;
      border: 1px solid #EEF2F7;
      border-bottom-left-radius: 4px;
      display: flex; gap: 4px; align-items: center;
      padding: 12px 16px;
    }
    .me-dot {
      width: 7px; height: 7px; border-radius: 50%;
      background: #12B5CC;
      animation: meDot 1.2s infinite ease-in-out;
    }
    .me-dot:nth-child(2) { animation-delay: 0.2s; }
    .me-dot:nth-child(3) { animation-delay: 0.4s; }
    @keyframes meDot {
      0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Input area */
    #me-chat-input-area {
      padding: 12px 14px;
      border-top: 1px solid #EEF2F7;
      display: flex; gap: 8px; align-items: flex-end;
      background: #ffffff;
      flex-shrink: 0;
    }
    #me-chat-input {
      flex: 1;
      border: 1px solid #D9E2EE;
      border-radius: 10px;
      padding: 9px 12px;
      font-family: inherit;
      font-size: 13.5px;
      color: #1A202C;
      resize: none;
      outline: none;
      max-height: 100px;
      overflow-y: auto;
      transition: border-color 0.2s;
      background: #F8FAFC;
      line-height: 1.45;
    }
    #me-chat-input:focus { border-color: #12B5CC; background: #ffffff; }
    #me-chat-input::placeholder { color: #A0AEC0; }
    #me-chat-send {
      width: 36px; height: 36px; flex-shrink: 0;
      background: #12B5CC;
      border: none; border-radius: 50%; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.18s, transform 0.15s;
      margin-bottom: 1px;
    }
    #me-chat-send:hover { background: #2DC8DE; transform: scale(1.08); }
    #me-chat-send:disabled { background: #D9E2EE; cursor: not-allowed; transform: none; }
    #me-chat-send svg { width: 17px; height: 17px; fill: #0B1C2C; }

    /* Powered by */
    #me-chat-footer {
      text-align: center;
      font-size: 11px;
      color: #A0AEC0;
      padding: 5px 0 8px;
      background: #ffffff;
      flex-shrink: 0;
    }

    @media (max-width: 420px) {
      #me-chat-widget { bottom: 16px; right: 16px; }
      #me-chat-window { width: calc(100vw - 32px); }
    }
  `;
  document.head.appendChild(style);

  // ── INJECT HTML ──────────────────────────────────────────────────────────────
  const widget = document.createElement('div');
  widget.id = 'me-chat-widget';
  widget.innerHTML = `
    <div id="me-chat-window">
      <div id="me-chat-header">
        <div class="me-avatar">ME</div>
        <div class="me-info">
          <div class="me-name">Assistant</div>
          <div class="me-status">Ask me anything about the platform</div>
        </div>
        <button id="me-chat-minimize" title="Minimize">−</button>
      </div>
      <div id="me-chat-messages"></div>
      <div id="me-chat-input-area">
        <textarea id="me-chat-input" rows="1" placeholder="Ask a question…"></textarea>
        <button id="me-chat-send" disabled title="Send">
          <svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>
        </button>
      </div>
      <div id="me-chat-footer">Powered by Lowtech · AI responses may vary</div>
    </div>
    <button id="me-chat-toggle" title="Chat with us">
      <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
    </button>
  `;
  document.body.appendChild(widget);

  // ── ELEMENT REFS ─────────────────────────────────────────────────────────────
  const chatWindow   = document.getElementById('me-chat-window');
  const messagesEl   = document.getElementById('me-chat-messages');
  const inputEl      = document.getElementById('me-chat-input');
  const sendBtn      = document.getElementById('me-chat-send');
  const toggleBtn    = document.getElementById('me-chat-toggle');
  const minimizeBtn  = document.getElementById('me-chat-minimize');

  // ── HELPERS ──────────────────────────────────────────────────────────────────
  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = 'me-msg ' + role;
    // Simple markdown: bold
    div.innerHTML = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
      .replace(/\n/g,'<br>');
    messagesEl.appendChild(div);
    scrollToBottom();
    return div;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'me-msg typing';
    div.id = 'me-typing';
    div.innerHTML = '<div class="me-dot"></div><div class="me-dot"></div><div class="me-dot"></div>';
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function hideTyping() {
    const t = document.getElementById('me-typing');
    if (t) t.remove();
  }

  function setOpen(open) {
    isOpen = open;
    // Persist minimized state so it survives page navigation
    sessionStorage.setItem(STORAGE_KEY, open ? 'false' : 'true');
    if (open) {
      chatWindow.classList.remove('hidden');
      widget.classList.remove('minimized');
    } else {
      chatWindow.classList.add('hidden');
      // Add minimized class so the widget container stops blocking page clicks
      widget.classList.add('minimized');
    }
  }

  // Auto-resize textarea
  inputEl.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
    sendBtn.disabled = this.value.trim().length === 0;
  });

  // Send on Enter (Shift+Enter for newline)
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!sendBtn.disabled && !isTyping) sendMessage();
    }
  });

  sendBtn.addEventListener('click', function () {
    if (!isTyping) sendMessage();
  });

  toggleBtn.addEventListener('click', function () { setOpen(!isOpen); });
  minimizeBtn.addEventListener('click', function () { setOpen(false); });

  // ── SEND MESSAGE ─────────────────────────────────────────────────────────────
  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text || isTyping) return;

    // Add user message to display and history
    addMessage('user', text);
    messages.push({ role: 'user', content: text });

    // Reset input
    inputEl.value = '';
    inputEl.style.height = 'auto';
    sendBtn.disabled = true;
    isTyping = true;
    showTyping();

    // Build the user message with site context prepended
    const contextualMessages = messages.map(function (m, i) {
      if (i === messages.length - 1 && m.role === 'user') {
        return {
          role: 'user',
          content: `[Current page: ${window.location.href}]\n\n[Site content for reference:]\n${SITE_CONTENT}\n\n[Visitor question:]\n${m.content}`
        };
      }
      return m;
    });

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 600,
          system: SYSTEM_PROMPT,
          messages: contextualMessages
        })
      });

      const data = await response.json();
      hideTyping();

      if (data.content && data.content[0] && data.content[0].text) {
        const reply = data.content[0].text;
        addMessage('bot', reply);
        messages.push({ role: 'assistant', content: reply });
      } else {
        addMessage('bot', "I'm having trouble connecting right now. Please try again or reach out via the Contact page.");
      }
    } catch (err) {
      hideTyping();
      addMessage('bot', "I'm having trouble connecting right now. Please try again or reach out via the Contact page.");
      console.error('Lowtech chatbot error:', err);
    }

    isTyping = false;
    inputEl.focus();
  }

  // ── APPLY INITIAL STATE + GREETING ──────────────────────────────────────────
  // Apply saved minimize state immediately (no flash)
  if (!isOpen) {
    chatWindow.classList.add('hidden');
    widget.classList.add('minimized');
  }
  // Show greeting only on first visit (when not minimized from a previous page)
  setTimeout(function () {
    addMessage('bot', "Hi, I'm here to help. What can I help you with today?");
  }, 600);

  // ── IN-CHAT EXPERIENCE SURVEY (60 seconds after page load) ──────────────────
  // Fires once per session. If chatbot is minimized, opens it first.
  var SURVEY_SESSION_KEY = 'me_chat_survey_done';
  if (!sessionStorage.getItem(SURVEY_SESSION_KEY) && !localStorage.getItem(SURVEY_SESSION_KEY)) {
    setTimeout(function () {
      // Don't show if user is already mid-conversation
      if (messages.length > 1) { localStorage.setItem(SURVEY_SESSION_KEY, 'true'); return; }

      // Open chatbot if minimized
      if (!isOpen) setOpen(true);

      // Add survey message with face buttons
      var surveyDiv = document.createElement('div');
      surveyDiv.className = 'me-msg bot';
      surveyDiv.style.padding = '10px 13px';

      var question = document.createElement('div');
      question.style.marginBottom = '10px';
      question.style.fontWeight = '600';
      question.style.color = '#0B1C2C';
      question.textContent = 'How has your experience been today?';

      var facesRow = document.createElement('div');
      facesRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

      var FACES = [
        { e: '😞', v: 1, l: 'Very dissatisfied' },
        { e: '😕', v: 2, l: 'Dissatisfied'      },
        { e: '😐', v: 3, l: 'Neutral'            },
        { e: '🙂', v: 4, l: 'Satisfied'          },
        { e: '😄', v: 5, l: 'Very satisfied'     },
      ];

      FACES.forEach(function (opt) {
        var btn = document.createElement('button');
        btn.title = opt.l;
        btn.textContent = opt.e;
        btn.style.cssText = 'font-size:1.4rem;background:#F7FAFC;border:2px solid #E2E8F0;border-radius:50%;width:40px;height:40px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:border-color 0.15s;touch-action:manipulation;';
        btn.addEventListener('pointerdown', function (e) {
          e.stopPropagation();
          // Mark done so it never shows again this session
          sessionStorage.setItem(SURVEY_SESSION_KEY, 'true'); localStorage.setItem(SURVEY_SESSION_KEY, 'true');
          // Log rating
          console.log('ME chat survey rating:', opt.v);
          // Remove survey bubble and replace with thank-you
          surveyDiv.remove();
          addMessage('bot', 'Thank you for the feedback! ' + opt.e + '  If there\'s anything I can help you with, just ask.');
        });
        facesRow.appendChild(btn);
      });

      // Mark as shown immediately — prevents re-trigger on page nav
      sessionStorage.setItem(SURVEY_SESSION_KEY, 'true'); localStorage.setItem(SURVEY_SESSION_KEY, 'true');
      surveyDiv.appendChild(question);
      surveyDiv.appendChild(facesRow);
      messagesEl.appendChild(surveyDiv);
      scrollToBottom();

    }, 60000); // 60 seconds — fires once ever (localStorage persists)
  }

})();
