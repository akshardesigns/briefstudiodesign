'use strict';

// ── State ──────────────────────────────────────────────────────────────────
let cJSON = null;
let currentMode = 'feed';
// Per-mode aspect ratio state
const modeRatio = {
  feed: { label: '4:5', full: '4:5 (Portrait Feed)' },
  typography: { label: '1:1', full: '1:1 (Persegi)' }
};

// ── Mobile drawer ──────────────────────────────────────────────────────────
function openMobDrawer() {
  document.getElementById('mob_drawer').classList.add('open');
  document.getElementById('mob_ov').classList.add('open');
}
function closeMobDrawer() {
  document.getElementById('mob_drawer').classList.remove('open');
  document.getElementById('mob_ov').classList.remove('open');
}

// ── Mode switcher ──────────────────────────────────────────────────────────
function switchMode(mode, btn, label) {
  currentMode = mode;
  // Hide all panels
  document.querySelectorAll('.mode-panel').forEach(p => p.classList.remove('active'));
  // Deactivate sidebar buttons
  document.querySelectorAll('#sidebar .mode-btn').forEach(b => b.classList.remove('active'));
  // Deactivate mobile drawer buttons
  document.querySelectorAll('.mob-mode-btn').forEach(b => b.classList.remove('active'));
  // Show active panel
  const panel = document.getElementById('mp_' + mode);
  if (panel) panel.classList.add('active');
  // Activate clicked button
  if (btn) btn.classList.add('active');
  // Sync the sidebar button if mobile btn was clicked
  const sidebarBtn = document.querySelector(`#sidebar .mode-btn[data-mode="${mode}"]`);
  if (sidebarBtn) sidebarBtn.classList.add('active');
  // Update mobile label
  if (label) document.getElementById('mob_mode_label').textContent = label;
  // Close mobile drawer
  closeMobDrawer();
}

// ── Tab switcher — FIXED: scoped to specific panel by panelId ────────────
function switchTab(prefix, idx, btn, panelId) {
  // Find the correct panel — use panelId if provided, fallback to .mode-panel.active
  const panel = panelId
    ? document.getElementById(panelId)
    : document.querySelector('.mode-panel.active');
  if (!panel) return;
  // Deactivate all form sections in this panel
  panel.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
  // Deactivate all tab buttons in this panel's tab-nav
  panel.querySelectorAll('.tab-nav .tab-btn').forEach(b => b.classList.remove('active'));
  // Activate target section
  const target = document.getElementById(prefix + '-' + idx);
  if (target) target.classList.add('active');
  // Activate clicked tab button
  if (btn) btn.classList.add('active');
}

// ── Toggles ────────────────────────────────────────────────────────────────
function togSingle(btn, gid) {
  const group = document.getElementById(gid);
  if (!group) return;
  group.querySelectorAll('.tog').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}
function togMulti(btn) { btn.classList.toggle('on'); }

// ── Ratio buttons ──────────────────────────────────────────────────────────
function togRasio(btn, containerId) {
  const container = containerId
    ? document.getElementById(containerId)
    : btn.closest('.ratio-grid');
  if (!container) return;
  container.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const lbl = btn.querySelector('.ratio-lbl').textContent.replace(/\n.*/,'').trim();
  const map = {
    '1:1': '1:1 (Persegi)',
    '4:5': '4:5 (Portrait Feed)',
    '9:16': '9:16 (Story/Reels)',
    '16:9': '16:9 (Landscape Banner)'
  };
  // Store per-mode ratio
  if (containerId === 'aspect_ratio') {
    modeRatio.feed = { label: lbl, full: map[lbl] || lbl };
  } else if (containerId === 'typ_ratio') {
    modeRatio.typography = { label: lbl, full: map[lbl] || lbl };
  }
}

function getRatio(containerId) {
  const el = document.getElementById(containerId);
  if (!el) return { label: '1:1', full: '1:1 (Persegi)' };
  const btn = el.querySelector('.ratio-btn.on');
  if (!btn) return { label: '1:1', full: '1:1 (Persegi)' };
  const lbl = btn.querySelector('.ratio-lbl').textContent.replace(/\n.*/,'').trim();
  const map = { '1:1': '1:1 (Persegi)', '4:5': '4:5 (Portrait Feed)', '9:16': '9:16 (Story/Reels)', '16:9': '16:9 (Landscape Banner)' };
  return { label: lbl, full: map[lbl] || lbl };
}

// ── Color sync — UNIFIED system (prefix-based) ─────────────────────────────
// sw_{key} = swatch div, c_{key} = color input, h_{key} = hex text input
function syncColorPair(key) {
  const cEl = document.getElementById('c_' + key);
  const hEl = document.getElementById('h_' + key);
  const swEl = document.getElementById('sw_' + key);
  if (!cEl) return;
  const val = cEl.value;
  if (hEl) hEl.value = val.toUpperCase();
  if (swEl) swEl.style.background = val;
}
function syncHexPair(key) {
  const hEl = document.getElementById('h_' + key);
  if (!hEl) return;
  const val = hEl.value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(val)) return;
  const cEl = document.getElementById('c_' + key);
  const swEl = document.getElementById('sw_' + key);
  if (cEl) cEl.value = val;
  if (swEl) swEl.style.background = val;
}

// ── Legacy Feed color sync (cp/cs/ca / hp/hs/ha / sw_p/sw_s/sw_a) ─────────
function syncLegacyC(w) {
  const v = document.getElementById('c' + w).value;
  const hEl = document.getElementById('h' + w);
  const swEl = document.getElementById('sw_' + w);
  if (hEl) hEl.value = v.toUpperCase();
  if (swEl) swEl.style.background = v;
}
function syncLegacyH(w) {
  const v = document.getElementById('h' + w).value.trim();
  if (!/^#[0-9a-fA-F]{6}$/.test(v)) return;
  const cEl = document.getElementById('c' + w);
  const swEl = document.getElementById('sw_' + w);
  if (cEl) cEl.value = v;
  if (swEl) swEl.style.background = v;
}

// ── Tags ───────────────────────────────────────────────────────────────────
function addTag(e, wid) {
  if (e.key !== 'Enter' && e.key !== ',') return;
  e.preventDefault();
  const inp = e.target;
  const val = inp.value.trim().replace(/,$/, '');
  if (!val) return;
  const wrap = document.getElementById(wid);
  const t = document.createElement('span');
  t.className = 'tag';
  t.innerHTML = val + ' <span class="tag-x" onclick="removeTag(this)">×</span>';
  wrap.insertBefore(t, inp);
  inp.value = '';
}
function removeTag(el) { el.closest('.tag').remove(); }
function getTags(wid) {
  const el = document.getElementById(wid);
  if (!el) return [];
  return Array.from(el.querySelectorAll('.tag')).map(t =>
    t.textContent.trim().replace(/×\s*$/, '').trim()
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────
const pLabels = [
  'draft quality',
  'standard quality',
  'high quality, HD',
  'ultra-realistic, 8k resolution',
  'photorealistic, 16k hyperdetailed'
];
function updatePhoto(v) {
  document.getElementById('photo_v').textContent = pLabels[v - 1] || 'ultra-realistic, 8k';
}
// Get active toggle value from a toggle-group element
function getA(id) {
  const el = document.getElementById(id);
  if (!el) return '';
  const a = el.querySelector('.tog.on');
  return a ? a.textContent.trim() : '';
}
// Get all active toggle values
function getAs(id) {
  const el = document.getElementById(id);
  if (!el) return [];
  return Array.from(el.querySelectorAll('.tog.on')).map(b => b.textContent.trim());
}
// Get input/textarea/select value safely
function getVal(id, fallback = '') {
  const el = document.getElementById(id);
  if (!el) return fallback;
  return el.value.trim() || fallback;
}
function hexRgb(h) {
  if (!h || h.length < 7) return '200,241,53';
  return [
    parseInt(h.slice(1,3),16),
    parseInt(h.slice(3,5),16),
    parseInt(h.slice(5,7),16)
  ].join(',');
}

// ── Loading wrapper ────────────────────────────────────────────────────────
function withLoading(genFn) {
  // Find gen button in active panel
  const activePanel = document.querySelector('.mode-panel.active');
  const btn = activePanel ? activePanel.querySelector('.btn-gen') : null;
  const spans = btn ? btn.querySelectorAll('span') : [];
  if (btn) btn.classList.add('loading');
  if (spans[0]) spans[0].innerHTML = '<div class="spinner"></div>';
  if (spans[1]) spans[1].textContent = 'Memproses...';
  document.getElementById('sdot').className = 'sdot gen';
  document.getElementById('stxt').textContent = 'Memproses...';
  setTimeout(() => {
    try { genFn(); } catch(err) { console.error(err); toast('Error saat generate!', 'err'); }
    if (btn) btn.classList.remove('loading');
    if (spans[0]) spans[0].textContent = '✦';
    if (spans[1]) spans[1].textContent = 'Buat Ulang';
  }, 650);
}

function emitBrief(data, labelStr) {
  cJSON = data;
  renderOutput(data, labelStr);
  document.getElementById('sdot').className = 'sdot ready';
  document.getElementById('stxt').textContent = 'Brief siap';
  toast('✦ Brief berhasil dibuat!', 'ok');
}

// ── FEED ──────────────────────────────────────────────────────────────────
function generateFeedJSON() {
  withLoading(() => {
    const hp = document.getElementById('hp').value || '#0c3d4f';
    const hs = document.getElementById('hs').value || '#8ce0ff';
    const ha = document.getElementById('ha').value || '#e8b84b';
    const pv = parseInt(document.getElementById('photorealism').value);
    const pStr = pLabels[pv - 1] || 'ultra-realistic, 8k resolution';
    const abOn = getA('ab_on').includes('Ya');
    const imgCount = getA('img_count');
    const imgNum = imgCount.includes('0') ? 0 : imgCount.includes('1') ? 1 : imgCount.includes('2') ? 2 : 3;
    const uiStyle = getA('ui_style');
    const ctaTxt = getVal('cta_text');
    const ratio = getRatio('aspect_ratio');

    const uiElem = uiStyle === 'Tidak Ada'
      ? `IMPORTANT: Add a premium modern CTA button displaying: '${ctaTxt}'. Make it prominent.`
      : `Incorporate minimalist floating ${uiStyle === 'Kartu Glassmorphism' ? 'glassmorphism UI cards' : uiStyle === 'Dashboard Data' ? 'data dashboard elements' : 'feature badges'}, feature icons around the product.\nIMPORTANT: Add a premium modern CTA button displaying: '${ctaTxt}'.`;

    const data = {
      task_type: "commercial_banner_generation",
      system_directive: "You are an elite Commercial Art Director. Create a premium promotional banner based on the exact specifications below.",
      model_parameters: {
        aspect_ratio: ratio.full,
        style_preset: getA('style_preset'),
        quality: getA('quality').toLowerCase(),
        photorealism: pStr
      },
      prompt_structure: {
        subject: getVal('subject', `Promotional banner for ${getVal('brand_name','[Brand]')}`),
        branding_elements: {
          brand_name: getVal('brand_name'),
          headline: getVal('headline'),
          subheadline: getVal('subheadline'),
          description: getVal('description'),
          call_to_action: ctaTxt
        },
        product_visual_layout: {
          expected_images_count: imgNum,
          composition_style: getA('composition'),
          placement_rule: getA('placement'),
          integration_and_blending: getVal('blending'),
          strict_rules: imgNum > 1
            ? ["Use uploaded product images as hero subjects.", "Follow requested visual positioning strictly."]
            : ["Use uploaded product image as single hero subject.", "Follow requested visual positioning strictly."]
        },
        information_layout: {
          features_to_highlight: getTags('feat_wrap'),
          ui_elements: uiElem
        },
        visual_style_details: {
          color_palette: {
            primary_accent: hp,
            secondary_background: hs,
            cta_accent: ha,
            harmony: getVal('color_harmony')
          },
          lighting_setup: getA('lighting'),
          aesthetic_keywords: getVal('aesthetic_kw')
        },
        typography_instructions: getVal('typo_note'),
        composition_rules: getAs('comp_rules')
      },
      brand_identity: {
        brand_voice: getA('brand_voice'),
        typography_system: {
          headline_font: getVal('font_display'),
          body_font: getVal('font_body')
        },
        brand_consistency: {
          logo_safe_zone: getVal('logo_sz', '16') + "px minimum margin",
          cta_design: {
            shape: getA('cta_shape').toLowerCase(),
            fill: hp,
            text_color: "#ffffff",
            icon: getA('cta_icon'),
            shadow: `0 8px 32px rgba(${hexRgb(hp)},0.35)`
          },
          forbidden_elements: getTags('forb_wrap')
        }
      },
      target_audience: {
        demographic: getVal('demographic'),
        age_range: `${getVal('age_min','22')}–${getVal('age_max','35')}`,
        psychographic: getVal('psychographic'),
        platform_context: getA('platform'),
        scroll_stop_priority: getA('scroll_stop')
      },
      output_format: {
        file_type: getA('file_type'),
        background: getA('bg_type'),
        resolution: getA('resolution'),
        depth_of_field: getA('dof')
      },
      negative_prompt: getVal('neg_prompt')
    };

    if (abOn) {
      data.variant_generation = {
        enabled: true,
        variants: [
          { id: "A", layout: "centered", cta_color: hp },
          { id: "B", layout: "left-aligned", cta_color: ha }
        ],
        auto_winner_metric: getA('ab_metric')
      };
    }

    emitBrief(data, 'feed_brief');
  });
}

// ── TYPOGRAPHY ────────────────────────────────────────────────────────────
function generateTypJSON() {
  withLoading(() => {
    const colPri = getVal('h_typ', '#0ea5e9');
    const colSec = getVal('h_typs', '#020617');
    const ratio = getRatio('typ_ratio');
    const data = {
      task_type: "typography_ads_generation",
      system_directive: "You are an elite Typography Art Director. Create a premium ad image where typography IS the design hero, seamlessly integrated with the scene.",
      brand: {
        name: getVal('typ_brand'),
        voice: getA('typ_voice'),
        colors: { primary: colPri, secondary: colSec }
      },
      typography: {
        headline: getVal('typ_headline'),
        subheadline: getVal('typ_sub'),
        cta: getVal('typ_cta'),
        focus_words: getTags('typ_focus_wrap'),
        secondary_words: getTags('typ_sec_wrap'),
        size_contrast: getA('typ_scale'),
        text_cropping: getA('typ_crop'),
        text_overlap: getA('typ_overlap'),
        composition: getVal('typ_comp')
      },
      camera: {
        lens: getA('typ_lens'),
        perspective: getA('typ_persp'),
        depth: getA('typ_depth'),
        character: getA('typ_char'),
        expression: getA('typ_expr'),
        pose: getA('typ_pose')
      },
      visual_style: {
        style: getA('typ_style'),
        energy: getA('typ_energy'),
        lighting: getA('typ_light'),
        aspect_ratio: ratio.full,
        effects: getAs('typ_fx'),
        avoid: getTags('typ_avoid_wrap')
      },
      audience: {
        platform: getA('typ_platform'),
        campaign_feel: getAs('typ_feel'),
        target_ctr: getA('typ_ctr')
      }
    };
    emitBrief(data, 'typography_brief');
  });
}

// ── STORY ─────────────────────────────────────────────────────────────────
function generateStoryJSON() {
  withLoading(() => {
    const col = getVal('h_st', '#0c3d4f');
    emitBrief({
      task_type: "story_reels_generation",
      brand: getVal('st_brand'),
      hook_0_3s: getVal('st_hook'),
      main_message: getVal('st_msg'),
      cta: getVal('st_cta'),
      visual_style: getA('st_style'),
      primary_color: col,
      format: getA('st_fmt'),
      directive: "Design a high-impact vertical ad visual optimized for Story/Reels. The hook text must dominate the first visual frame."
    }, 'story_brief');
  });
}

// ── THUMBNAIL ─────────────────────────────────────────────────────────────
function generateThumbJSON() {
  withLoading(() => {
    const col = getVal('h_th', '#ef4444');
    emitBrief({
      task_type: "youtube_thumbnail_generation",
      video_title: getVal('th_title'),
      thumbnail_text: getVal('th_text'),
      face_expression: getA('th_expr'),
      background: getA('th_bg'),
      dominant_color: col,
      extra_elements: getAs('th_el'),
      channel_name: getVal('th_channel'),
      directive: "Create a high-CTR YouTube thumbnail. Text must be max 5 words, bold, high-contrast. Face expression should be emotionally intense. Design for mobile viewing at 300px width."
    }, 'thumbnail_brief');
  });
}

// ── CAROUSEL ──────────────────────────────────────────────────────────────
let slideData = [];

function initSlides() {
  const countStr = getA('car_count') || '5 Slide';
  const n = parseInt(countStr) || 5;
  const roles = ['Cover / Hook', 'Problem Statement', 'Solution Intro', 'Detail / Tips', 'CTA & Closing'];
  slideData = [];
  for (let i = 0; i < n; i++) {
    slideData.push({ number: i + 1, role: roles[i] || `Slide ${i + 1}`, headline: '', body: '', visual_note: '' });
  }
  renderSlideList();
}

function syncSlides() {
  const countStr = getA('car_count') || '5 Slide';
  const n = parseInt(countStr) || 5;
  const roles = ['Cover / Hook', 'Problem Statement', 'Solution Intro', 'Detail / Tips', 'CTA & Closing'];
  while (slideData.length < n) {
    const i = slideData.length;
    slideData.push({ number: i + 1, role: roles[i] || `Slide ${i + 1}`, headline: '', body: '', visual_note: '' });
  }
  if (slideData.length > n) slideData = slideData.slice(0, n);
  renderSlideList();
}

function addSlide() {
  const n = slideData.length + 1;
  slideData.push({ number: n, role: `Slide ${n}`, headline: '', body: '', visual_note: '' });
  renderSlideList();
}

function deleteSlide(idx) {
  slideData.splice(idx, 1);
  slideData.forEach((s, i) => { s.number = i + 1; });
  renderSlideList();
}

function renderSlideList() {
  const list = document.getElementById('slide_list');
  if (!list) return;
  list.innerHTML = '';
  slideData.forEach((slide, idx) => {
    const item = document.createElement('div');
    item.className = 'slide-item';
    item.innerHTML = `
      <div class="slide-header" onclick="toggleSlide(this)">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="slide-num">S${String(slide.number).padStart(2,'0')}</span>
          <span class="slide-role">${escHtml(slide.role)}</span>
        </div>
        <button class="slide-del" onclick="event.stopPropagation();deleteSlide(${idx})">Hapus</button>
      </div>
      <div class="slide-body">
        <div class="field">
          <div class="field-label"><span>Peran Slide</span></div>
          <input class="fi" data-idx="${idx}" data-field="role" value="${escHtml(slide.role)}" placeholder="cth. Cover Hook" oninput="updateSlide(this)">
        </div>
        <div class="field">
          <div class="field-label"><span>Judul / Teks Utama</span></div>
          <input class="fi" data-idx="${idx}" data-field="headline" value="${escHtml(slide.headline)}" placeholder="Teks headline slide ini" oninput="updateSlide(this)">
        </div>
        <div class="field">
          <div class="field-label"><span>Body / Sub-teks</span></div>
          <textarea class="fi" data-idx="${idx}" data-field="body" rows="2" placeholder="Konten pendukung..." oninput="updateSlide(this)">${escHtml(slide.body)}</textarea>
        </div>
        <div class="field">
          <div class="field-label"><span>Catatan Visual</span></div>
          <input class="fi" data-idx="${idx}" data-field="visual_note" value="${escHtml(slide.visual_note)}" placeholder="cth. Foto orang kebingungan di depan form" oninput="updateSlide(this)">
        </div>
      </div>`;
    list.appendChild(item);
  });
}

function updateSlide(el) {
  const idx = parseInt(el.dataset.idx);
  const field = el.dataset.field;
  if (idx >= 0 && field && slideData[idx]) {
    slideData[idx][field] = el.value;
    // Update visible role label if editing role
    if (field === 'role') {
      const header = el.closest('.slide-item').querySelector('.slide-role');
      if (header) header.textContent = el.value;
    }
  }
}

function toggleSlide(header) {
  const body = header.nextElementSibling;
  const isOpen = body.classList.contains('open');
  document.querySelectorAll('.slide-header').forEach(h => h.classList.remove('open'));
  document.querySelectorAll('.slide-body').forEach(b => b.classList.remove('open'));
  if (!isOpen) { header.classList.add('open'); body.classList.add('open'); }
}

function generateCarouselJSON() {
  withLoading(() => {
    const col = getVal('h_car', '#0c3d4f');
    emitBrief({
      task_type: "carousel_ad_generation",
      brand: getVal('car_brand'),
      carousel_type: getA('car_type'),
      slide_count: slideData.length,
      topic: getVal('car_topic'),
      final_cta: getVal('car_cta'),
      visual_consistency: {
        thread: getA('car_thread'),
        transition: getA('car_trans'),
        primary_color: col
      },
      slides: slideData.map(s => ({
        number: s.number,
        role: s.role,
        headline: s.headline,
        body: s.body,
        visual_note: s.visual_note
      })),
      style: {
        aesthetic: getA('car_aes'),
        typography: getA('car_typo'),
        ratio: getA('car_ratio')
      },
      directive: "Design each slide as a cohesive series. Every slide must feel connected visually while being strong as a standalone image."
    }, 'carousel_brief');
  });
}

// ── 9-GRID ────────────────────────────────────────────────────────────────
const gridConceptMaps = {
  'Puzzle Besar':    [1,1,1,1,1,1,1,1,1],
  'Stripe Vertikal': [1,2,3,1,2,3,1,2,3],
  'Diagonal':        [1,2,3,2,3,1,3,1,2],
  'Row Alternating': [1,1,1,2,2,2,1,1,1],
  'Checker':         [1,2,1,2,1,2,1,2,1]
};
const gridRoleLabels = {
  'Puzzle Besar':    ['Bagian BG','Bagian BG','Bagian BG','Bagian BG','Pusat','Bagian BG','Bagian BG','Bagian BG','Bagian BG'],
  'Stripe Vertikal': ['Kolom 1','Kolom 2','Kolom 3','Kolom 1','Kolom 2','Kolom 3','Kolom 1','Kolom 2','Kolom 3'],
  'Diagonal':        ['Zona A','Zona B','Zona C','Zona B','Zona C','Zona A','Zona C','Zona A','Zona B'],
  'Row Alternating': ['Row A','Row A','Row A','Row B','Row B','Row B','Row A','Row A','Row A'],
  'Checker':         ['Terang','Gelap','Terang','Gelap','Terang','Gelap','Terang','Gelap','Terang']
};

let selectedCell = null;
let tileData = Array.from({length:9}, (_,i) => ({ tile: i + 1, role: '', content: '', visual: '' }));

function selectCell(n) {
  selectedCell = n;
  document.querySelectorAll('.grid-cell').forEach(c => c.classList.remove('selected'));
  const cell = document.getElementById('gc' + n);
  if (cell) cell.classList.add('selected');
  // Switch to per-tile tab
  const g9Panel = document.getElementById('mp_grid9');
  const tabs = g9Panel.querySelectorAll('.tab-nav .tab-btn');
  switchTab('g9', 2, tabs[2], 'mp_grid9');
  // Scroll to tile
  const tileEl = document.getElementById('g9tile_' + n);
  if (tileEl) setTimeout(() => tileEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
}

function updateGridPreview() {
  const concept = getA('g9_concept') || 'Puzzle Besar';
  const map = gridConceptMaps[concept] || gridConceptMaps['Puzzle Besar'];
  const roleMap = gridRoleLabels[concept] || gridRoleLabels['Puzzle Besar'];
  const opacities = { 1: '0.85', 2: '0.35', 3: '0.2', 4: '0.1' };
  for (let i = 1; i <= 9; i++) {
    const cell = document.getElementById('gc' + i);
    const roleEl = document.getElementById('cr' + i);
    if (cell && roleEl) {
      const zone = map[i - 1];
      cell.style.background = `rgba(200,241,53,${opacities[zone] || '0.35'})`;
      roleEl.textContent = roleMap[i - 1] || '';
    }
  }
}

function initG9Tiles() {
  const container = document.getElementById('g9_tiles');
  if (!container) return;
  container.innerHTML = '';
  for (let i = 1; i <= 9; i++) {
    const d = tileData[i - 1];
    const item = document.createElement('div');
    item.className = 'tile-item';
    item.id = 'g9tile_' + i;
    item.innerHTML = `
      <div class="tile-header">TILE ${i}</div>
      <div class="field">
        <div class="field-label"><span>Peran</span></div>
        <input class="fi" id="g9r_${i}" value="${escHtml(d.role)}" placeholder="cth. Pusat Logo, BG kiri..." oninput="tileData[${i-1}].role=this.value">
      </div>
      <div class="field">
        <div class="field-label"><span>Konten</span></div>
        <input class="fi" id="g9c_${i}" value="${escHtml(d.content)}" placeholder="cth. Logo brand, besar centered" oninput="tileData[${i-1}].content=this.value">
      </div>
      <div class="field">
        <div class="field-label"><span>Catatan Visual</span></div>
        <input class="fi" id="g9v_${i}" value="${escHtml(d.visual)}" placeholder="cth. Warna latar gelap, sudut kiri bawah" oninput="tileData[${i-1}].visual=this.value">
      </div>`;
    container.appendChild(item);
  }
}

function generateGrid9JSON() {
  withLoading(() => {
    const colMain = getVal('h_g9', '#C8F135');
    const colBg = getVal('h_g9b', '#0A0A0F');
    // Sync tile data from inputs before building
    for (let i = 1; i <= 9; i++) {
      tileData[i-1].role = getVal('g9r_' + i);
      tileData[i-1].content = getVal('g9c_' + i);
      tileData[i-1].visual = getVal('g9v_' + i);
    }
    emitBrief({
      task_type: "instagram_9grid_generation",
      account: getVal('g9_brand'),
      grid_concept: getA('g9_concept'),
      dominant_element: getA('g9_dominant'),
      content_theme: getVal('g9_theme'),
      visual_style: {
        primary_color: colMain,
        background_color: colBg,
        aesthetic: getA('g9_aes'),
        font: getA('g9_font'),
        consistency_rules: getAs('g9_rules')
      },
      tiles: tileData.map(t => ({
        tile: t.tile,
        role: t.role,
        content: t.content,
        visual_note: t.visual
      })),
      directive: "Design 9 individual 1:1 square images that form a cohesive puzzle/grid when arranged in a 3×3 Instagram profile layout. Each tile must look good standalone AND contribute to the larger grid composition. Maintain strict visual consistency across all 9 tiles."
    }, 'grid9_brief');
  });
}

// ── PRODUCT ───────────────────────────────────────────────────────────────
function generateProductJSON() {
  withLoading(() => {
    const col = getVal('h_pr', '#f97316');
    emitBrief({
      task_type: "product_showcase_generation",
      product_name: getVal('pr_name'),
      category: getA('pr_cat'),
      usp: getVal('pr_usp'),
      price_promo: getVal('pr_price'),
      cta: getVal('pr_cta'),
      visual_style: {
        mood: getA('pr_mood'),
        platform: getA('pr_plat'),
        dominant_color: col
      },
      directive: "Create a high-converting product showcase image. Product must be the hero element. Include price/promo text prominently. Optimize for the target platform's native feel."
    }, 'product_brief');
  });
}

// ── Render output ──────────────────────────────────────────────────────────
function renderOutput(data, label) {
  const body = document.getElementById('out_body');
  const js = JSON.stringify(data, null, 2);

  // Extract colors safely for summary
  const ps = data.prompt_structure;
  const hp = (ps && ps.visual_style_details)
    ? ps.visual_style_details.color_palette.primary_accent
    : (data.brand && data.brand.colors ? data.brand.colors.primary : '#C8F135');
  const hs = (ps && ps.visual_style_details)
    ? ps.visual_style_details.color_palette.secondary_background
    : '#1C1C28';
  const ha = (ps && ps.visual_style_details)
    ? ps.visual_style_details.color_palette.cta_accent
    : '#e8b84b';

  body.innerHTML = `
    <div class="json-block">
      <div class="json-header">
        <span class="json-title">${escHtml(label || 'ads_brief')}.json</span>
        <button class="copy-btn" id="cinl" onclick="copyJSON()">Copy</button>
      </div>
      <div class="json-code">${synHL(js)}</div>
    </div>
    <div class="sum-card">
      <div class="sum-title">Ringkasan Cepat</div>
      <div class="sum-grid">
        ${si('Task Type', data.task_type || '—')}
        ${si('Brand', (ps && ps.branding_elements ? ps.branding_elements.brand_name : data.brand) || '—')}
        ${si('Platform', (data.target_audience ? data.target_audience.platform_context : data.audience ? data.audience.platform : '') || '—')}
        ${sc('Warna Utama', hp)}
        ${sc('Sekunder', hs)}
        ${sc('Aksen CTA', ha)}
        ${si('Rasio', (data.model_parameters ? data.model_parameters.aspect_ratio : data.format) || '—')}
        ${si('Audiens', data.target_audience ? `${data.target_audience.age_range} · ${data.target_audience.demographic}` : '—')}
        ${si('Hook', data.target_audience ? data.target_audience.scroll_stop_priority : '—')}
      </div>
    </div>
    <div class="gpt-banner">
      <div style="display:flex;align-items:center;gap:10px;min-width:0">
        <div class="gpt-logo" style="flex-shrink:0">🤖</div>
        <div class="gpt-text"><strong>Ekspor ke AdsBrief AI</strong><br>Prompt tersalin otomatis. Buka GPT lalu Ctrl+V untuk generate.</div>
      </div>
      <button class="btn-gpt" onclick="exportGPT()">Buka AdsBrief AI ↗</button>
    </div>`;
}

function si(l, v) {
  return `<div class="sum-item"><div class="sum-lbl">${escHtml(l)}</div><div class="sum-val">${escHtml(String(v || '—'))}</div></div>`;
}
function sc(l, h) {
  const safe = h && /^#[0-9a-fA-F]{3,8}$/.test(h) ? h : '#888';
  return `<div class="sum-item"><div class="sum-lbl">${escHtml(l)}</div><div class="sum-val"><span class="cdot" style="background:${safe}"></span>${escHtml(safe)}</div></div>`;
}

function escHtml(str) {
  return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function synHL(json) {
  // Escape HTML first, then apply syntax coloring
  const escaped = json
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;');
  return escaped.replace(
    /("(?:\\u[\da-fA-F]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
    m => {
      let c = 'jn'; // number
      if (/^"/.test(m)) { c = /:$/.test(m) ? 'jk' : 'js'; } // key or string
      else if (/true|false/.test(m)) c = 'jb';
      else if (/null/.test(m)) c = 'jp';
      return `<span class="${c}">${m}</span>`;
    }
  ).replace(/([{}[\],])/g, '<span class="jp">$1</span>');
}

// ── Copy / Export ──────────────────────────────────────────────────────────
function copyJSON() {
  if (!cJSON) { toast('Buat brief dulu!', 'err'); return; }
  const txt = JSON.stringify(cJSON, null, 2);
  const doFlash = () => {
    ['copy_btn', 'cinl'].forEach(id => {
      const b = document.getElementById(id);
      if (!b) return;
      const orig = id === 'copy_btn' ? '⎘ Salin' : 'Copy';
      b.textContent = '✓ Copied!';
      b.classList.add('done');
      setTimeout(() => { b.textContent = orig; b.classList.remove('done'); }, 1500);
    });
    toast('JSON disalin!', 'ok');
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(txt).then(doFlash).catch(() => { fbCopy(txt); doFlash(); });
  } else { fbCopy(txt); doFlash(); }
}

function fbCopy(t) {
  const ta = document.createElement('textarea');
  ta.value = t;
  ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
  document.body.appendChild(ta);
  ta.focus(); ta.select();
  try { document.execCommand('copy'); } catch(e) {}
  document.body.removeChild(ta);
}

function buildPrompt() {
  return `Kamu adalah AI Art Director dan Commercial Designer profesional.\n\nGenerate banner iklan berdasarkan JSON brief berikut. Ikuti SEMUA spesifikasi.\n\n${JSON.stringify(cJSON, null, 2)}\n\nOutput:\n1. Generate gambar banner langsung menggunakan DALL-E\n2. Brand compliance checklist singkat\n3. Saran revisi jika diperlukan`;
}

function exportGPT() {
  if (!cJSON) { toast('Buat brief dulu!', 'err'); return; }
  togExp();
  // Restore saved URL
  try {
    const saved = localStorage.getItem('adsbrief_gpt_url');
    if (saved) document.getElementById('gpt_url').value = saved;
  } catch(e) {}
  const p = buildPrompt();
  const open = () => document.getElementById('modal_ov').classList.add('open');
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(p).then(open).catch(() => { fbCopy(p); open(); });
  } else { fbCopy(p); open(); }
}

function exportMJ() {
  if (!cJSON) { toast('Buat brief dulu!', 'err'); return; }
  togExp();
  const d = cJSON;
  const ps = d.prompt_structure;
  const hl = (ps ? ps.branding_elements.headline : (d.typography ? d.typography.headline : '')) || '';
  const br = (ps ? ps.branding_elements.brand_name : d.brand) || '';
  const aes = (ps ? ps.visual_style_details.aesthetic_keywords : '') || '';
  const ratio = d.model_parameters ? d.model_parameters.aspect_ratio.split(' ')[0].replace(':','/') : '4/5';
  const mj = `/imagine prompt: ${hl}, ${br}, professional advertising banner, ${aes}, ultra-detailed, ${d.model_parameters ? d.model_parameters.photorealism : 'photorealistic'} --ar ${ratio} --v 6 --style raw --q 2`;
  if (navigator.clipboard) navigator.clipboard.writeText(mj).then(() => toast('Prompt Midjourney disalin!', 'ok'));
  else { fbCopy(mj); toast('Prompt Midjourney disalin!', 'ok'); }
}

function dlJSON() {
  if (!cJSON) { toast('Buat brief dulu!', 'err'); return; }
  togExp();
  const ps = cJSON.prompt_structure;
  const name = ((ps && ps.branding_elements ? ps.branding_elements.brand_name : cJSON.brand) || 'output')
    .replace(/\s+/g,'_').replace(/[^a-zA-Z0-9_]/g,'').toLowerCase();
  const b = new Blob([JSON.stringify(cJSON, null, 2)], { type: 'application/json' });
  const u = URL.createObjectURL(b);
  const a = document.createElement('a');
  a.href = u; a.download = `adsbrief_${name}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
  toast('Berhasil diunduh!', 'ok');
}

function togExp() {
  document.getElementById('exp_drop').classList.toggle('open');
}
document.addEventListener('click', e => {
  if (!e.target.closest('.exp-menu')) {
    document.getElementById('exp_drop').classList.remove('open');
  }
});

// ── Modal ──────────────────────────────────────────────────────────────────
function closeModal() { document.getElementById('modal_ov').classList.remove('open'); }
function handleOvClick(e) { if (e.target === document.getElementById('modal_ov')) closeModal(); }
function openPlain() { closeModal(); setTimeout(() => window.open('https://chatgpt.com/', '_blank'), 100); }
function openCustomGPT() {
  const u = document.getElementById('gpt_url').value.trim();
  if (!u) { toast('Masukkan URL GPT dulu!', 'err'); return; }
  closeModal();
  setTimeout(() => window.open(u.startsWith('http') ? u : 'https://' + u, '_blank'), 100);
}
function saveGptUrl() {
  const v = document.getElementById('gpt_url').value.trim();
  if (!v) { toast('URL tidak boleh kosong!', 'err'); return; }
  try { localStorage.setItem('adsbrief_gpt_url', v); } catch(e) {}
  toast('✓ URL GPT tersimpan!', 'ok');
}
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── Reset ──────────────────────────────────────────────────────────────────
function resetForm() {
  if (!confirm('Reset semua field?')) return;
  document.querySelectorAll('.fi').forEach(el => {
    if (el.tagName === 'SELECT') el.selectedIndex = 0;
    else if (el.type !== 'range' && el.type !== 'color') el.value = '';
  });
  cJSON = null;
  document.getElementById('out_body').innerHTML = `
    <div class="empty">
      <div class="empty-icon">⬡</div>
      <div class="empty-title">Brief belum dibuat</div>
      <div class="empty-desc">Isi form di kiri lalu klik Buat Brief.</div>
    </div>`;
  document.getElementById('sdot').className = 'sdot';
  document.getElementById('stxt').textContent = 'Menunggu brief...';
  toast('Form berhasil direset.', 'ok');
}

// ── Toast ──────────────────────────────────────────────────────────────────
function toast(msg, type = 'ok') {
  const c = document.getElementById('tw');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span>${type === 'ok' ? '✓' : '✕'}</span> ${msg}`;
  c.appendChild(t);
  setTimeout(() => {
    t.style.cssText = 'opacity:0;transform:translateX(16px);transition:all 0.2s';
    setTimeout(() => t.remove(), 200);
  }, 2500);
}

// ── Init ───────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateGridPreview();
  initG9Tiles();
  initSlides();
});
