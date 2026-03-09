// ===== State =====
const state = {
  formFactor: 'box',
  showPrice: true,
  showTitlePublisher: true,
  secondaryInfo: 'recommendation',
  previewMode: 'slideshow',
  showBackplate: true,
  itemsPerRow: 5
};

const PLACEHOLDER_VIDEO = 'assets/placeholder-video.mp4';

// ===== Init =====
document.addEventListener('DOMContentLoaded', () => {
  initControls();
  renderAllChannels();
  initGlobalKeyboardNav();
});

// ===== Control Panel =====
function initControls() {
  const toggle = document.getElementById('controlToggle');
  const body = document.getElementById('controlBody');
  toggle.addEventListener('click', () => {
    body.classList.toggle('collapsed');
    toggle.textContent = body.classList.contains('collapsed') ? '▶' : '▼';
  });

  document.querySelectorAll('.control-options').forEach(group => {
    const controlKey = group.dataset.control;
    group.querySelectorAll('.control-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        group.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        let val = btn.dataset.value;
        if (val === 'true') val = true;
        else if (val === 'false') val = false;
        else if (!isNaN(Number(val))) val = Number(val);
        state[controlKey] = val;
        renderAllChannels();
      });
    });
  });
}

// ===== Global Keyboard Navigation =====
function initGlobalKeyboardNav() {
  document.addEventListener('keydown', (e) => {
    const focused = document.activeElement;
    if (!focused || !focused.classList.contains('game-item')) return;

    const row = focused.closest('.items-row');
    if (!row) return;

    const items = Array.from(row.querySelectorAll('.game-item'));
    const idx = items.indexOf(focused);
    if (idx === -1) return;

    let nextIdx = -1;
    if (e.key === 'ArrowRight') {
      nextIdx = Math.min(idx + 1, items.length - 1);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      nextIdx = Math.max(idx - 1, 0);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const channel = row.closest('.channel');
      const nextChannel = channel?.nextElementSibling;
      if (nextChannel) {
        const nextRow = nextChannel.querySelector('.items-row');
        const nextItems = nextRow?.querySelectorAll('.game-item');
        if (nextItems && nextItems.length > 0) {
          nextItems[Math.min(idx, nextItems.length - 1)].focus();
          e.preventDefault();
        }
      }
      return;
    } else if (e.key === 'ArrowUp') {
      const channel = row.closest('.channel');
      const prevChannel = channel?.previousElementSibling;
      if (prevChannel) {
        const prevRow = prevChannel.querySelector('.items-row');
        const prevItems = prevRow?.querySelectorAll('.game-item');
        if (prevItems && prevItems.length > 0) {
          prevItems[Math.min(idx, prevItems.length - 1)].focus();
          e.preventDefault();
        }
      }
      return;
    }

    if (nextIdx >= 0 && nextIdx !== idx) {
      items[nextIdx].focus();
      items[nextIdx].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  });
}

// ===== Rendering =====
function renderAllChannels() {
  const container = document.getElementById('channelsContainer');
  container.innerHTML = '';

  CHANNELS.forEach((channel, idx) => {
    container.appendChild(createChannel(channel, idx));
  });

  // Render the bundle row last
  container.appendChild(createBundleChannel());
  attachAllInteractions();
}

function getFormFactor(channel, idx) {
  if (state.formFactor === 'mixed') return idx % 2 === 0 ? 'box' : 'hero';
  return state.formFactor;
}

function getArtSrc(game, formFactor) {
  if (formFactor === 'box') {
    if (game.boxArt) return game.boxArt;
    if (game.heroTitledArt) return game.heroTitledArt;
    if (game.heroArt) return game.heroArt;
  } else {
    if (game.heroTitledArt) return game.heroTitledArt;
    if (game.heroArt) return game.heroArt;
    if (game.boxArt) return game.boxArt;
  }
  return null;
}

function createChannel(channel, idx) {
  const div = document.createElement('div');
  div.className = `channel interaction-${channel.interactionType}${state.showBackplate ? '' : ' no-backplate'}`;
  div.dataset.channelId = channel.id;
  div.dataset.interaction = channel.interactionType;

  const formFactor = getFormFactor(channel, idx);
  const content = { showPrice: state.showPrice, secondaryInfo: state.secondaryInfo };

  // In mixed mode, use doubled column count so hero (span 2) and box (span 1) have 2:1 width ratio
  const effectiveCols = state.formFactor === 'mixed' ? state.itemsPerRow * 2 : state.itemsPerRow;

  div.innerHTML = `
    <div class="channel-header">
      <div class="channel-title">${channel.name}</div>
      <div class="channel-subtitle">
        <span class="interaction-badge">${channel.interactionType.replace(/-/g, ' ')}</span>
        ${channel.subtitle.split('—')[1] || channel.subtitle}
      </div>
    </div>
    <div class="items-row" data-cols="${effectiveCols}">
      ${channel.gameIds.map((gid, i) => {
        const ff = state.formFactor === 'mixed' ? (i % 2 === 0 ? 'box' : 'hero') : state.formFactor;
        return createGameItem(gid, ff, content, channel.interactionType);
      }).join('')}
    </div>
  `;
  return div;
}

function createGameItem(gameId, formFactor, content, interactionType) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return '';

  const artClass = formFactor === 'hero' ? 'hero' : 'box';
  const artSrc = getArtSrc(game, formFactor);
  const artLabel = formFactor === 'box' ? '1:1' : '16:9';
  const artInner = artSrc
    ? `<img class="item-art-image" src="${artSrc}" alt="${game.title}" draggable="false">`
    : `<div class="item-art-placeholder" style="--placeholder-color:${game.color}">${game.title}<span class="art-label">${artLabel}</span></div>`;

  let priceHtml = '';
  if (content.showPrice) {
    priceHtml = `<div class="item-price"><span class="price-sale-badge">-${game.salePercent}%</span><span class="price-original">$${game.originalPrice.toFixed(2)}</span><span class="price-current">$${game.salePrice.toFixed(2)}</span></div>`;
  }

  let secondaryHtml = '';
  if (content.secondaryInfo === 'recommendation') {
    secondaryHtml = `<div class="item-recommendation">${game.recommendation}</div>`;
  } else if (content.secondaryInfo === 'genome') {
    secondaryHtml = `<div class="item-genome-tags">${game.genomeTags.slice(0, 4).map(t => `<span class="genome-tag">${t}</span>`).join('<span class="genome-separator">•</span>')}</div>`;
  }

  const firstSS = game.screenshots?.[0] || null;
  const ssBg = firstSS ? `background-image:url('${firstSS}');background-size:cover;background-position:center;` : '';

  let extraHtml = '';
  let wrapStart = '';
  let wrapEnd = '';

  switch (interactionType) {
    case 'hover-scale':
      extraHtml = `<div class="item-preview-overlay"><div class="preview-content"><div class="slideshow" data-game-id="${game.id}">${createSlideshowSlides(game)}<div class="slideshow-dots">${(game.screenshots?.length ? game.screenshots : [1,2,3,4]).map((_,i) => `<div class="slideshow-dot ${i===0?'active':''}"></div>`).join('')}</div></div></div></div>`;
      break;

    case 'hover-slide-up':
      extraHtml = `<div class="slideup-slideshow">${buildSlideshowHTML(game, 'slideup')}</div><div class="slide-up-panel"><div class="slide-up-title">${game.title}</div><div class="slide-up-desc">${game.publisher} • ${game.genomeTags.slice(0,3).join(', ')}</div></div>`;
      break;

    case 'click-expand':
      extraHtml = `<div class="expand-detail"><div class="expand-detail-content"><div class="detail-slideshow">${buildSlideshowHTML(game, 'expand')}</div><div class="detail-text"><h4>${game.title}</h4><p>${game.publisher} — ${game.genomeTags.join(', ')}</p></div></div></div>`;
      break;

    case 'hover-flip':
      wrapStart = `<div class="flip-container"><div class="flip-front">`;
      wrapEnd = `</div><div class="flip-back"><div class="flip-video ${!firstSS?'video-shimmer':''}" ${firstSS?`style="${ssBg}"`:''}>
        ${!firstSS?'▶ Video':''}</div><div class="flip-title">${game.title}</div><div class="flip-desc">${game.genomeTags.slice(0,3).join(' • ')}</div></div></div>`;
      break;

    case 'long-press':
      extraHtml = `<div class="press-ring"></div><div class="press-progress"></div>`;
      break;

    case 'hover-peek':
      extraHtml = `<div class="peek-strip"><div class="peek-content" ${firstSS?`style="${ssBg}"`:''}>${!firstSS?'<div style="border:1px solid rgba(255,255,255,0.3);width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;">▶</div><span>Preview</span>':''}</div></div>`;
      break;

    case 'drawer-slide':
      extraHtml = `<div class="drawer"><div class="drawer-content"><div class="drawer-video ${!firstSS?'video-shimmer':''}" ${firstSS?`style="${ssBg}"`:''}>
        ${!firstSS?'▶ Video':''}</div><div class="drawer-title">${game.title}</div><div class="drawer-desc">${game.genomeTags.slice(0,2).join(' • ')}</div><button class="drawer-btn">View Game</button></div></div>`;
      break;

    // --- Controller: Bumper = overlay slideshow on art ---
    case 'bumper-snap':
      extraHtml = `<div class="bumper-overlay"><div class="bumper-slideshow">${buildSlideshowHTML(game, 'bumper')}</div></div>`;
      break;

    // --- Controller: Trigger = scale + overlay slideshow on art ---
    case 'trigger-zoom':
      extraHtml = `<div class="trigger-overlay"><div class="trigger-slideshow">${buildSlideshowHTML(game, 'trigger')}</div><div class="trigger-overlay-info"><span>${game.title}</span><span class="trigger-overlay-tags">${game.genomeTags.slice(0,3).join(' • ')}</span></div></div>`;
      break;

    // --- Controller: Stick = overlay slideshow on art ---
    case 'stick-scroll':
      extraHtml = `<div class="stick-overlay"><div class="stick-slideshow">${buildSlideshowHTML(game, 'stick')}</div><div class="stick-overlay-info"><span>${game.title}</span><span class="stick-overlay-tags">${game.genomeTags.slice(0,3).join(' • ')}</span></div></div>`;
      break;

    // --- Long Hover = delayed expansion with overlay slideshow + info ---
    case 'long-hover':
      extraHtml = `<div class="longhover-overlay"><div class="longhover-slideshow">${buildSlideshowHTML(game, 'longhover')}</div><div class="longhover-info"><span class="longhover-title">${game.title}</span><span class="longhover-tags">${game.genomeTags.slice(0,3).join(' • ')}</span>${game.recommendation ? `<span class="longhover-rec">${game.recommendation}</span>` : ''}</div></div>`;
      break;
  }

  // Place overlays inside art, extras outside
  const isArtOverlay = ['bumper-snap','trigger-zoom','long-hover','stick-scroll','hover-slide-up'].includes(interactionType);
  const isHoverScale = interactionType === 'hover-scale';
  const isSlideUp = false; // slide-up now handled via isArtOverlay

  return `
    <div class="game-item form-${formFactor}" tabindex="0" data-game-id="${game.id}" data-interaction="${interactionType}">
      ${interactionType === 'long-press' ? extraHtml : ''}
      ${wrapStart}
      <div class="game-item-inner">
        <div class="item-art ${artClass}" style="--placeholder-color: ${game.color}">
          ${artInner}
          ${isHoverScale ? extraHtml : ''}
          ${isSlideUp ? extraHtml : ''}
          ${isArtOverlay ? extraHtml : ''}
        </div>
        ${(state.showTitlePublisher || priceHtml || secondaryHtml) ? `<div class="item-info">
          ${state.showTitlePublisher ? `<div class="item-title">${game.title}</div><div class="item-publisher">${game.publisher}</div>` : ''}
          ${priceHtml}${secondaryHtml}
        </div>` : ''}
      </div>
      ${interactionType === 'click-expand' ? extraHtml : ''}
      ${wrapEnd}
      ${interactionType === 'hover-peek' ? extraHtml : ''}
      ${interactionType === 'drawer-slide' ? extraHtml : ''}
    </div>`;
}

function buildVideoHTML() {
  return `<video class="preview-video" src="${PLACEHOLDER_VIDEO}" muted loop playsinline preload="metadata" disablepictureinpicture controlslist="nodownload nofullscreen noremoteplayback noplaybackrate"></video>`;
}

function buildSlideshowHTML(game, prefix) {
  if (state.previewMode === 'video') {
    return buildVideoHTML();
  }
  const hasScreenshots = game.screenshots?.length > 0;
  let slides, dots;
  if (hasScreenshots) {
    slides = game.screenshots.map((ss, i) =>
      `<div class="${prefix}-slide ${i===0?'active':''}" style="background-image:url('${ss}');background-size:cover;background-position:center;"></div>`
    ).join('');
    dots = game.screenshots.map((_, i) =>
      `<div class="${prefix}-dot ${i===0?'active':''}"></div>`
    ).join('');
  } else {
    const bgs = [`linear-gradient(135deg,${game.color},#000)`,`linear-gradient(45deg,#000,${game.color})`,`linear-gradient(180deg,${game.color},#111)`,`linear-gradient(90deg,#111,${game.color})`];
    slides = bgs.map((bg,i) => `<div class="${prefix}-slide ${i===0?'active':''}" style="background:${bg};display:flex;align-items:center;justify-content:center;"><span style="font-size:10px;opacity:0.4;">Screenshot ${i+1}</span></div>`).join('');
    dots = bgs.map((_,i) => `<div class="${prefix}-dot ${i===0?'active':''}"></div>`).join('');
  }
  return `${slides}<div class="${prefix}-dots">${dots}</div>`;
}

function createSlideshowSlides(game) {
  if (state.previewMode === 'video') {
    return buildVideoHTML();
  }
  if (game.screenshots?.length > 0) {
    return game.screenshots.map((ss,i) => `<div class="slideshow-slide ${i===0?'active':''}" style="background-image:url('${ss}');background-size:cover;background-position:center;"></div>`).join('');
  }
  return [`linear-gradient(135deg,${game.color},#000)`,`linear-gradient(45deg,#000,${game.color})`,`linear-gradient(180deg,${game.color},#111)`,`linear-gradient(90deg,#111,${game.color})`].map((bg,i) =>
    `<div class="slideshow-slide ${i===0?'active':''}" style="background:${bg};display:flex;align-items:center;justify-content:center;"><span style="font-size:10px;opacity:0.4;">Screenshot ${i+1}</span></div>`
  ).join('');
}

// ===== Video helpers =====
function playVideo(container) {
  const vid = container.querySelector('.preview-video');
  if (vid) { vid.currentTime = 0; vid.play().catch(()=>{}); }
}
function stopVideo(container) {
  const vid = container.querySelector('.preview-video');
  if (vid) { vid.pause(); vid.currentTime = 0; }
}

function isVideoMode() { return state.previewMode === 'video'; }

// ===== Interactions =====
function attachAllInteractions() {
  attachHoverScale();
  attachHoverSlideUp();
  attachClickExpand();
  attachFocusGlow();
  attachLongPress();
  attachSpotlight();
  attachOverlayFocus('.interaction-bumper-snap', 'bumper-active', 'bumper');
  attachOverlayFocus('.interaction-trigger-zoom', 'trigger-active', 'trigger');
  attachStickScroll();
  attachLongHover();
}

// Hover Slide-Up with delayed slideshow/video
function attachHoverSlideUp() {
  document.querySelectorAll('.interaction-hover-slide-up .game-item').forEach(item => {
    let dwellTimer = null;
    let ssInterval = null;
    let ssIdx = 0;

    const startPreview = () => {
      const container = item.querySelector('.slideup-slideshow');
      if (!container) return;
      container.classList.add('active');
      if (isVideoMode()) {
        playVideo(container);
      } else {
        const slides = item.querySelectorAll('.slideup-slide');
        const dots = item.querySelectorAll('.slideup-dot');
        if (!slides.length) return;
        ssIdx = 0;
        slides.forEach((s, i) => s.classList.toggle('active', i === 0));
        dots.forEach((d, i) => d.classList.toggle('active', i === 0));
        ssInterval = setInterval(() => {
          slides.forEach(s => s.classList.remove('active'));
          dots.forEach(d => d.classList.remove('active'));
          ssIdx = (ssIdx + 1) % slides.length;
          slides[ssIdx].classList.add('active');
          dots[ssIdx]?.classList.add('active');
        }, 1800);
      }
    };

    const stopPreview = () => {
      if (ssInterval) clearInterval(ssInterval);
      ssInterval = null;
      const container = item.querySelector('.slideup-slideshow');
      container?.classList.remove('active');
      if (isVideoMode()) stopVideo(container || item);
    };

    item.addEventListener('mouseenter', () => {
      dwellTimer = setTimeout(() => { startPreview(); }, 500);
    });
    item.addEventListener('mouseleave', () => {
      clearTimeout(dwellTimer); dwellTimer = null;
      stopPreview();
    });
  });
}

// Hover Scale
function attachHoverScale() {
  document.querySelectorAll('.interaction-hover-scale .game-item').forEach(item => {
    let interval = null, idx = 0;
    item.addEventListener('mouseenter', () => {
      const o = item.querySelector('.item-preview-overlay');
      if (!o) return;
      o.classList.add('active');
      if (isVideoMode()) {
        playVideo(o);
      } else {
        const slides = item.querySelectorAll('.slideshow-slide');
        const dots = item.querySelectorAll('.slideshow-dot');
        if (!slides.length) return;
        idx = 0;
        interval = setInterval(() => {
          slides.forEach(s => s.classList.remove('active'));
          dots.forEach(d => d.classList.remove('active'));
          idx = (idx + 1) % slides.length;
          slides[idx].classList.add('active');
          dots[idx]?.classList.add('active');
        }, 1500);
      }
    });
    item.addEventListener('mouseleave', () => {
      const o = item.querySelector('.item-preview-overlay');
      o?.classList.remove('active');
      if (isVideoMode()) { stopVideo(o || item); }
      clearInterval(interval); interval = null;
      item.querySelectorAll('.slideshow-slide').forEach((s,i) => s.classList.toggle('active', i===0));
      item.querySelectorAll('.slideshow-dot').forEach((d,i) => d.classList.toggle('active', i===0));
    });
  });
}

function attachClickExpand() {
  const intervals = new Map();
  document.querySelectorAll('.interaction-click-expand .game-item').forEach(item => {
    item.addEventListener('click', (e) => {
      if (e.target.closest('.mute-btn')) return;
      const was = item.classList.contains('expanded');
      // Collapse all and stop their slideshows/videos
      item.closest('.items-row').querySelectorAll('.game-item').forEach(gi => {
        gi.classList.remove('expanded');
        if (intervals.has(gi)) { clearInterval(intervals.get(gi)); intervals.delete(gi); }
        stopVideo(gi);
      });
      if (!was) {
        item.classList.add('expanded');
        if (isVideoMode()) {
          const detail = item.querySelector('.detail-slideshow');
          if (detail) playVideo(detail);
        } else {
          const slides = item.querySelectorAll('.expand-slide');
          const dots = item.querySelectorAll('.expand-dot');
          if (slides.length) {
            let idx = 0;
            const iv = setInterval(() => {
              slides.forEach(s => s.classList.remove('active'));
              dots.forEach(d => d.classList.remove('active'));
              idx = (idx + 1) % slides.length;
              slides[idx].classList.add('active');
              dots[idx]?.classList.add('active');
            }, 1800);
            intervals.set(item, iv);
          }
        }
      }
    });
  });
}

function attachFocusGlow() {
  document.querySelectorAll('.interaction-focus-glow .game-item').forEach(item => {
    item.addEventListener('mouseenter', () => item.classList.add('focused'));
    item.addEventListener('mouseleave', () => item.classList.remove('focused'));
    item.addEventListener('focus', () => item.classList.add('focused'));
    item.addEventListener('blur', () => item.classList.remove('focused'));
  });
}

function attachLongPress() {
  document.querySelectorAll('.interaction-long-press .game-item').forEach(item => {
    let timer = null;
    const start = () => {
      item.classList.add('pressing');
      const game = GAMES.find(g => g.id === +item.dataset.gameId);
      const ss = game?.screenshots?.[0];
      timer = setTimeout(() => {
        item.classList.remove('pressing');
        item.classList.add('long-pressed');
        const art = item.querySelector('.item-art');
        if (art && !art.querySelector('.item-preview-overlay')) {
          const o = document.createElement('div');
          o.className = 'item-preview-overlay active';
          o.innerHTML = ss ? `<div class="preview-content" style="background-image:url('${ss}');background-size:cover;background-position:center;"></div>` : `<div class="preview-content"><div class="video-placeholder video-shimmer"><div class="play-icon">▶</div></div></div>`;
          art.appendChild(o);
        } else art?.querySelector('.item-preview-overlay')?.classList.add('active');
      }, 600);
    };
    const end = () => {
      clearTimeout(timer); item.classList.remove('pressing');
      setTimeout(() => { item.classList.remove('long-pressed'); item.querySelector('.item-preview-overlay')?.classList.remove('active'); }, 200);
    };
    item.addEventListener('mousedown', start);
    item.addEventListener('mouseup', end);
    item.addEventListener('mouseleave', end);
  });
}

function attachSpotlight() {
  document.querySelectorAll('.interaction-spotlight').forEach(ch => {
    const items = ch.querySelectorAll('.game-item');
    items.forEach(item => {
      item.addEventListener('mouseenter', () => { ch.classList.add('spotlighting'); items.forEach(gi => gi.classList.remove('spotlit')); item.classList.add('spotlit'); });
    });
    ch.addEventListener('mouseleave', () => { ch.classList.remove('spotlighting'); items.forEach(gi => gi.classList.remove('spotlit')); });
  });
}

// ===== Overlay Focus (Bumper + Trigger) = slideshow/video overlay on art =====
function attachOverlayFocus(selector, activeClass, prefix) {
  document.querySelectorAll(`${selector} .game-item`).forEach(item => {
    let interval = null, idx = 0;
    const startPreview = () => {
      if (isVideoMode()) {
        playVideo(item);
      } else {
        const slides = item.querySelectorAll(`.${prefix}-slide`);
        const dots = item.querySelectorAll(`.${prefix}-dot`);
        if (!slides.length) return;
        idx = 0;
        interval = setInterval(() => {
          slides.forEach(s => s.classList.remove('active'));
          dots.forEach(d => d.classList.remove('active'));
          idx = (idx + 1) % slides.length;
          slides[idx].classList.add('active');
          dots[idx]?.classList.add('active');
        }, 1800);
      }
    };
    const stopPreview = () => {
      clearInterval(interval); interval = null;
      if (isVideoMode()) stopVideo(item);
    };
    const activate = () => {
      item.closest('.items-row').querySelectorAll('.game-item').forEach(gi => gi.classList.remove(activeClass));
      item.classList.add(activeClass);
      startPreview();
    };
    const deactivate = () => { item.classList.remove(activeClass); stopPreview(); };
    item.addEventListener('focus', activate);
    item.addEventListener('blur', deactivate);
    item.addEventListener('mouseenter', activate);
    item.addEventListener('mouseleave', deactivate);
  });
}

// ===== Stick Scroll = overlay slideshow/video on focus =====
function attachStickScroll() {
  document.querySelectorAll('.interaction-stick-scroll .game-item').forEach(item => {
    let interval = null, idx = 0;
    const startPreview = () => {
      if (isVideoMode()) {
        playVideo(item);
      } else {
        const slides = item.querySelectorAll('.stick-slide');
        const dots = item.querySelectorAll('.stick-dot');
        if (!slides.length) return;
        idx = 0;
        interval = setInterval(() => {
          slides.forEach(s => s.classList.remove('active'));
          dots.forEach(d => d.classList.remove('active'));
          idx = (idx + 1) % slides.length;
          slides[idx].classList.add('active');
          dots[idx]?.classList.add('active');
        }, 1800);
      }
    };
    const stopPreview = () => { clearInterval(interval); interval = null; if (isVideoMode()) stopVideo(item); };
    const activate = () => {
      item.closest('.items-row').querySelectorAll('.game-item').forEach(gi => gi.classList.remove('stick-active'));
      item.classList.add('stick-active');
      startPreview();
    };
    const deactivate = () => { item.classList.remove('stick-active'); stopPreview(); };
    item.addEventListener('focus', activate);
    item.addEventListener('blur', deactivate);
    item.addEventListener('mouseenter', activate);
    item.addEventListener('mouseleave', deactivate);
  });
}

// ===== Long Hover = delayed expansion with overlay slideshow =====
function attachLongHover() {
  document.querySelectorAll('.interaction-long-hover .game-item').forEach(item => {
    let dwellTimer = null;
    let ssInterval = null;
    let ssIdx = 0;

    const startPreview = () => {
      if (isVideoMode()) {
        playVideo(item);
      } else {
        const slides = item.querySelectorAll('.longhover-slide');
        const dots = item.querySelectorAll('.longhover-dot');
        if (!slides.length) return;
        ssIdx = 0;
        slides.forEach((s, i) => s.classList.toggle('active', i === 0));
        dots.forEach((d, i) => d.classList.toggle('active', i === 0));
        ssInterval = setInterval(() => {
          slides.forEach(s => s.classList.remove('active'));
          dots.forEach(d => d.classList.remove('active'));
          ssIdx = (ssIdx + 1) % slides.length;
          slides[ssIdx].classList.add('active');
          dots[ssIdx]?.classList.add('active');
        }, 1800);
      }
    };

    const stopPreview = () => {
      if (ssInterval) clearInterval(ssInterval);
      ssInterval = null;
      if (isVideoMode()) stopVideo(item);
    };

    const activate = () => {
      // Start dwell timer — only expand after 600ms of continuous hover
      dwellTimer = setTimeout(() => {
        item.classList.add('longhover-active');
        startPreview();
      }, 600);
    };

    const deactivate = () => {
      // Cancel dwell if leaving early
      clearTimeout(dwellTimer);
      dwellTimer = null;
      item.classList.remove('longhover-active');
      stopPreview();
    };

    item.addEventListener('mouseenter', activate);
    item.addEventListener('mouseleave', deactivate);
    item.addEventListener('focus', activate);
    item.addEventListener('blur', deactivate);
  });
}

// ===== Bundle Channel =====
function createBundleChannel() {
  const div = document.createElement('div');
  div.className = `channel channel-bundles${state.showBackplate ? '' : ' no-backplate'}`;

  const bundleTypeDescriptions = {
    stacked: 'Stacked Cards — Fanned cards behind the main art suggest multiple items',
    mosaic: 'Grid Mosaic — Art area split into a grid showing multiple game covers',
    badge: 'Badge Overlay — Standard art with a bundle badge and item count',
    split: 'Horizontal Split — Art area divided to show multiple game covers side by side',
    carousel: 'Thumbnail Strip — Row of mini thumbnails at the bottom shows included content',
    count: 'Count Pill — Prominent item count with mini art stack'
  };

  div.innerHTML = `
    <div class="channel-header">
      <div class="channel-title">🎁 Bundles & Editions</div>
      <div class="channel-subtitle">
        <span class="interaction-badge" style="border-color: #f59e0b; color: #f59e0b;">bundles</span>
        Each card explores a different visual approach to representing bundles of games or games with DLCs
      </div>
    </div>
    <div class="items-row" data-cols="${Math.min(state.itemsPerRow, 6)}">
      ${BUNDLES.map(bundle => createBundleItem(bundle, bundleTypeDescriptions)).join('')}
    </div>
  `;
  return div;
}

function getBundleGameArt(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return null;
  return getArtSrc(game, 'hero');
}

function getBundleGamePosterArt(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  if (!game) return null;
  // Prefer box art (poster/portrait) for split panels
  if (game.boxArt) return game.boxArt;
  return getArtSrc(game);
}

function getBundleGameColor(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  return game?.color || '#333';
}

function getBundleGameTitle(gameId) {
  const game = GAMES.find(g => g.id === gameId);
  return game?.title || 'Game';
}

function createBundleItem(bundle, descriptions) {
  const mainGame = GAMES.find(g => g.id === bundle.mainGame);
  const mainArt = mainGame ? getArtSrc(mainGame) : null;
  const mainColor = mainGame?.color || bundle.color;

  // Build art area based on bundle type
  let artHtml = '';
  const desc = descriptions[bundle.bundleType] || '';
  const typeLabel = bundle.bundleType;

  switch (bundle.bundleType) {

    // 1. STACKED — Fanned cards behind main art
    case 'stacked': {
      const dlcCount = bundle.dlcNames.length;
      let stackCards = '';
      // Create 2 background "cards" that peek out behind
      for (let i = 0; i < Math.min(dlcCount, 2); i++) {
        const offset = (i + 1) * 6;
        const rotate = (i + 1) * 2.5;
        const color = i === 0 
          ? `color-mix(in srgb, ${mainColor} 70%, #000)` 
          : `color-mix(in srgb, ${mainColor} 50%, #000)`;
        stackCards += `<div class="bundle-stack-card" style="transform: translate(${offset}px, -${offset}px) rotate(${rotate}deg); background: ${color};"></div>`;
      }
      const mainArtInner = mainArt
        ? `<img class="item-art-image" src="${mainArt}" alt="${bundle.title}" draggable="false">`
        : `<div class="item-art-placeholder" style="--placeholder-color:${mainColor}">${mainGame?.title || bundle.title}<span class="art-label">16:9</span></div>`;

      artHtml = `
        <div class="bundle-art-stacked">
          ${stackCards}
          <div class="bundle-stack-main">
            ${mainArtInner}
          </div>
          <div class="bundle-type-badge">${bundle.bundleLabel}</div>
          <div class="bundle-stack-count">+${dlcCount} DLC${dlcCount > 1 ? 's' : ''}</div>
        </div>`;
      break;
    }

    // 2. MOSAIC — Grid of game covers
    case 'mosaic': {
      const mosaicGames = bundle.includedIds.slice(0, 5);
      let cells = '';
      mosaicGames.forEach((gid, i) => {
        const art = getBundleGameArt(gid);
        const color = getBundleGameColor(gid);
        const title = getBundleGameTitle(gid);
        if (art) {
          cells += `<div class="mosaic-cell mosaic-cell-${i}" style="background-image:url('${art}');background-size:cover;background-position:center;"></div>`;
        } else {
          cells += `<div class="mosaic-cell mosaic-cell-${i}" style="background:linear-gradient(135deg,${color},#111);"><span class="mosaic-cell-title">${title}</span></div>`;
        }
      });
      artHtml = `
        <div class="bundle-art-mosaic" data-count="${mosaicGames.length}">
          ${cells}
          <div class="bundle-type-badge">${bundle.bundleLabel}</div>
        </div>`;
      break;
    }

    // 3. BADGE — Standard art with badge overlay
    case 'badge': {
      const mainArtInner = mainArt
        ? `<img class="item-art-image" src="${mainArt}" alt="${bundle.title}" draggable="false">`
        : `<div class="item-art-placeholder" style="--placeholder-color:${mainColor}">${mainGame?.title || bundle.title}<span class="art-label">16:9</span></div>`;
      
      const dlcList = bundle.dlcNames.map(n => `<span class="badge-dlc-item">✦ ${n}</span>`).join('');
      
      artHtml = `
        <div class="bundle-art-badge">
          ${mainArtInner}
          <div class="bundle-badge-overlay">
            <div class="bundle-badge-ribbon">
              <span class="bundle-badge-icon">📦</span>
              <span>${bundle.bundleLabel}</span>
            </div>
          </div>
          <div class="bundle-badge-includes">
            ${dlcList}
          </div>
        </div>`;
      break;
    }

    // 4. SPLIT — Horizontal split showing multiple covers (uses poster/box art)
    case 'split': {
      const splitGames = bundle.includedIds.slice(0, 3);
      let splits = '';
      splitGames.forEach((gid, i) => {
        const art = getBundleGamePosterArt(gid);
        const color = getBundleGameColor(gid);
        const title = getBundleGameTitle(gid);
        if (art) {
          splits += `<div class="split-panel" style="background-image:url('${art}');background-size:cover;background-position:center top;"><div class="split-panel-label">${title}</div></div>`;
        } else {
          splits += `<div class="split-panel" style="background:linear-gradient(135deg,${color},#111);"><div class="split-panel-label">${title}</div></div>`;
        }
      });
      artHtml = `
        <div class="bundle-art-split" data-panels="${splitGames.length}">
          ${splits}
          <div class="bundle-type-badge">${bundle.bundleLabel}</div>
        </div>`;
      break;
    }

    // 5. CAROUSEL — Main art with thumbnail strip below
    case 'carousel': {
      const mainArtInner = mainArt
        ? `<img class="item-art-image" src="${mainArt}" alt="${bundle.title}" draggable="false">`
        : `<div class="item-art-placeholder" style="--placeholder-color:${mainColor}">${mainGame?.title || bundle.title}<span class="art-label">16:9</span></div>`;

      const allItems = [mainGame?.title || 'Base Game', ...bundle.dlcNames];
      let thumbs = '';
      allItems.forEach((name, i) => {
        const isBase = i === 0;
        const thumbColor = isBase ? mainColor : `color-mix(in srgb, ${mainColor} ${70 - i * 12}%, #333)`;
        thumbs += `<div class="carousel-thumb ${isBase ? 'carousel-thumb-active' : ''}" style="background:${thumbColor};" title="${name}"><span class="carousel-thumb-label">${isBase ? '🎮' : '＋'}</span></div>`;
      });

      artHtml = `
        <div class="bundle-art-carousel">
          <div class="carousel-main">
            ${mainArtInner}
            <div class="bundle-type-badge">${bundle.bundleLabel}</div>
          </div>
          <div class="carousel-strip">
            ${thumbs}
          </div>
        </div>`;
      break;
    }

    // 6. COUNT — Prominent count pill with mini art stack
    case 'count': {
      const countGames = bundle.includedIds.slice(0, 4);
      let miniStack = '';
      countGames.forEach((gid, i) => {
        const art = getBundleGameArt(gid);
        const color = getBundleGameColor(gid);
        const title = getBundleGameTitle(gid);
        const offset = i * 20;
        if (art) {
          miniStack += `<div class="count-mini-art" style="left:${offset}px;background-image:url('${art}');background-size:cover;background-position:center;z-index:${4-i};"></div>`;
        } else {
          miniStack += `<div class="count-mini-art" style="left:${offset}px;background:linear-gradient(135deg,${color},#111);z-index:${4-i};"><span>${title.charAt(0)}</span></div>`;
        }
      });

      artHtml = `
        <div class="bundle-art-count" style="--placeholder-color:${mainColor}">
          <div class="count-bg" style="background:linear-gradient(135deg, ${mainColor} 0%, color-mix(in srgb, ${mainColor} 50%, black) 100%);"></div>
          <div class="count-pill">${bundle.itemCount}</div>
          <div class="count-label">Games</div>
          <div class="count-mini-stack" style="width:${(countGames.length - 1) * 20 + 36}px;">
            ${miniStack}
          </div>
        </div>`;
      break;
    }
  }

  // Price
  let priceHtml = '';
  if (state.showPrice) {
    priceHtml = `<div class="item-price">
      <span class="price-sale-badge">-${bundle.salePercent}%</span>
      <span class="price-original">$${bundle.originalPrice.toFixed(2)}</span>
      <span class="price-current">$${bundle.salePrice.toFixed(2)}</span>
    </div>`;
  }

  // Secondary info
  let secondaryHtml = '';
  if (state.secondaryInfo === 'recommendation') {
    secondaryHtml = `<div class="item-recommendation">${bundle.recommendation}</div>`;
  } else if (state.secondaryInfo === 'genome') {
    secondaryHtml = `<div class="item-genome-tags">${bundle.genomeTags.slice(0, 4).map(t => `<span class="genome-tag">${t}</span>`).join('<span class="genome-separator">•</span>')}</div>`;
  }

  return `
    <div class="game-item bundle-item bundle-type-${bundle.bundleType}" tabindex="0" data-bundle-id="${bundle.id}">
      <div class="game-item-inner">
        <div class="item-art box" style="--placeholder-color: ${bundle.color}">
          ${artHtml}
        </div>
        ${(state.showTitlePublisher || priceHtml || secondaryHtml) ? `<div class="item-info">
          ${state.showTitlePublisher ? `
            <div class="item-title">${bundle.title}</div>
            <div class="item-publisher">${bundle.publisher}</div>
          ` : ''}
          ${priceHtml}${secondaryHtml}
        </div>` : ''}
      </div>
    </div>`;
}
