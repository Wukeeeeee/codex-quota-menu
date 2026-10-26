;(() => {
  if (typeof window === 'undefined' || globalThis.__quotaMenuRendererV1) return;
  const state = globalThis.__quotaMenuRendererV1 = { value: null, received: 0, busy: false };
  const pad = value => String(value).padStart(2, '0');
  const windowValue = value => {
    if (!value || typeof value !== 'object') return null;
    const used = Number(value.used_percent ?? value.usedPercent);
    const reset = Number(value.reset_at ?? value.resetsAt);
    return Number.isFinite(used) && Number.isFinite(reset) && reset > 0
      ? { used: Math.max(0, Math.min(100, used)), reset } : null;
  };
  const resetClock = reset => {
    const date = new Date(reset * 1000);
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };
  const resetDate = reset => {
    const date = new Date(reset * 1000);
    return `${date.getMonth() + 1}月${date.getDate()}日`;
  };
  const remainingTime = (reset, weekly = false) => {
    const minutes = Math.max(0, Math.ceil((reset * 1000 - Date.now()) / 60000));
    if (!minutes) return '即将重置';
    const days = Math.floor(minutes / 1440), hours = Math.floor(minutes % 1440 / 60), rest = minutes % 60;
    if (weekly && days) return `${days}天${hours ? `${hours}时` : ''}后`;
    return `${days ? `${days}天` : ''}${hours ? `${hours}时` : ''}${rest || !hours ? `${rest}分` : ''}后`;
  };
  const info = (value, weekly = false) => value ? {
    percent: Math.round(100 - value.used),
    reset: weekly ? resetDate(value.reset) : resetClock(value.reset),
    left: remainingTime(value.reset, weekly)
  } : { percent: null, reset: '—', left: '读取中' };
  const ring = '<svg class="quota-ring" viewBox="0 0 20 20" aria-hidden="true"><circle class="quota-track" cx="10" cy="10" r="7.5"/><circle class="quota-progress" cx="10" cy="10" r="7.5" pathLength="100" transform="rotate(-90 10 10)"/></svg>';
  const clock = '<svg class="quota-clock" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.75"/><path d="M8 4.5v3.75l2.5 1.5"/></svg>';
  const group = (key, label) => `<span class="quota-group" data-quota="${key}">${ring}<span>${label}</span><span class="quota-percent">—</span><span class="quota-time">${clock}<span class="quota-reset">—</span><span class="quota-countdown">读取中</span></span></span>`;
  const addStyle = () => {
    if (document.getElementById('quota-menu-style')) return;
    const style = document.createElement('style');
    style.id = 'quota-menu-style';
    style.textContent = `
      #application-menu-trigger-quota-menu .quota-group{display:inline-flex;align-items:center;gap:5px}
      #application-menu-trigger-quota-menu .quota-percent{font-weight:550}
      #application-menu-trigger-quota-menu .quota-ring{width:17px;height:17px;flex:none;fill:none;stroke-width:2.15}
      #application-menu-trigger-quota-menu .quota-track{stroke:currentColor;opacity:.18}
      #application-menu-trigger-quota-menu .quota-progress{stroke:#7fbea9;stroke-linecap:round;transition:stroke-dasharray .35s ease,stroke .35s ease}
      #application-menu-trigger-quota-menu .quota-time{display:inline-flex;align-items:center;gap:4px;margin-left:2px;font-size:.92em;opacity:.68}
      #application-menu-trigger-quota-menu .quota-clock{width:12px;height:12px;fill:none;stroke:currentColor;stroke-width:1.3;stroke-linecap:round;stroke-linejoin:round;flex:none}
      #application-menu-trigger-quota-menu .quota-countdown{opacity:.76}
      #application-menu-trigger-quota-menu .quota-countdown::before{content:'·';margin-right:4px;opacity:.55}
      #application-menu-trigger-quota-menu .quota-divider{width:1px;height:13px;background:currentColor;opacity:.2;margin:0 11px;flex:none}
      #application-menu-trigger-quota-menu[data-compact=true] .quota-reset{display:none}
      #application-menu-trigger-quota-menu[data-compact=true] .quota-countdown::before{display:none}
      #application-menu-trigger-quota-menu:focus-visible{outline:1px solid currentColor;outline-offset:2px}
      @media(prefers-reduced-motion:reduce){#application-menu-trigger-quota-menu .quota-progress{transition:none}}
    `;
    (document.head || document.documentElement).append(style);
  };
  state.render = () => {
    const help = document.getElementById('application-menu-trigger-help-menu');
    if (!help?.parentElement) return;
    addStyle();
    let item = document.getElementById('application-menu-trigger-quota-menu');
    if (!item || item.parentElement !== help.parentElement) {
      item?.remove();
      item = document.createElement('button');
      item.id = 'application-menu-trigger-quota-menu';
      item.type = 'button';
      item.setAttribute('role', 'menuitem');
      item.setAttribute('tabindex', '0');
      item.innerHTML = group('primary', '5小时') + '<span class="quota-divider" aria-hidden="true"></span>' + group('secondary', '7天');
      item.addEventListener('click', () => state.refresh());
      help.insertAdjacentElement('afterend', item);
    }
    const helpStyle = getComputedStyle(help);
    Object.assign(item.style, {
      appearance:'none', border:'none', borderRadius:'0', boxShadow:'none',
      background:'transparent', color:helpStyle.color, fontFamily:helpStyle.fontFamily,
      fontSize:helpStyle.fontSize, fontWeight:helpStyle.fontWeight, fontStyle:helpStyle.fontStyle,
      lineHeight:helpStyle.lineHeight, letterSpacing:helpStyle.letterSpacing,
      padding:helpStyle.padding, margin:'0 0 0 7px', height:`${help.getBoundingClientRect().height}px`,
      boxSizing:'border-box', display:'inline-flex', alignItems:'center', alignSelf:'center',
      whiteSpace:'nowrap', flexShrink:'0', cursor:'pointer', webkitAppRegion:'no-drag',
      fontVariantNumeric:'tabular-nums'
    });
    const primary = info(state.value?.primary), secondary = info(state.value?.secondary, true);
    for (const [key, value] of [['primary', primary], ['secondary', secondary]]) {
      const block = item.querySelector(`[data-quota="${key}"]`);
      const setText = (selector, text) => { const node = block.querySelector(selector); if (node.textContent !== text) node.textContent = text; };
      setText('.quota-percent', value.percent == null ? '—' : `${value.percent}%`);
      setText('.quota-reset', value.reset);
      setText('.quota-countdown', value.left);
      const progress = block.querySelector('.quota-progress');
      progress.setAttribute('stroke-dasharray', `${value.percent ?? 0} 100`);
      progress.style.stroke = value.percent != null && value.percent <= 10 ? '#e38e88' : value.percent != null && value.percent <= 30 ? '#d6b575' : '#7fbea9';
    }
    item.removeAttribute('title');
    item.setAttribute('aria-label', `五小时剩余${primary.percent ?? '未知'}%，${primary.reset}重置，${primary.left}；七天剩余${secondary.percent ?? '未知'}%，${secondary.reset}重置，${secondary.left}。点击刷新额度。`);
    item.dataset.compact = 'false';
    if (item.getBoundingClientRect().right > window.innerWidth - 125) item.dataset.compact = 'true';
    if (state.value && [state.value.primary, state.value.secondary].some(value => value && value.reset * 1000 <= Date.now()) && Date.now() - (state.expiredRefresh || 0) > 30000) {
      state.expiredRefresh = Date.now();
      state.refresh();
    }
  };
  state.update = value => {
    const rates = value?.rate_limit ?? value?.rateLimits ?? value;
    const primary = windowValue(rates?.primary_window ?? rates?.primary);
    const secondary = windowValue(rates?.secondary_window ?? rates?.secondary);
    if (!primary && !secondary) return;
    state.value = { primary, secondary };
    state.received = Date.now();
    state.render();
  };
  state.refresh = async () => {
    if (state.busy) return;
    state.busy = true;
    try {
      __QUOTA_INIT__();
      const result = await __QUOTA_FETCH__({signal:AbortSignal.timeout(12000)});
      if (result) state.update(result);
    } catch {} finally { state.busy = false; }
  };
  let scheduled = false;
  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { scheduled = false; state.render(); });
  };
  const start = () => {
    new MutationObserver(schedule).observe(document.documentElement, {childList:true,subtree:true});
    window.addEventListener('resize', schedule);
    state.render();
    setTimeout(() => state.refresh(), 3000);
    setInterval(() => state.refresh(), 120000);
    setInterval(() => state.render(), 15000);
  };
  if (document.documentElement) start();
  else document.addEventListener('DOMContentLoaded', start, {once:true});
})();

