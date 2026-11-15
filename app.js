(() => {
  'use strict';

  const works = document.getElementById('works');
  const menu = document.getElementById('work-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  const dialog = document.querySelector('.lightbox');
  const lightboxImage = dialog.querySelector('.lightbox-image');
  const lightboxCaption = dialog.querySelector('.lightbox-caption');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const descriptors = {
    '001': 'Dijital moda illüstrasyonu',
    '002': 'Moodboard ve tasarımlar',
    '003': 'Moodboard ve tasarımlar',
    '004': 'Kostüm çizimleri',
    '005': 'Moda illüstrasyonları',
    '006': 'Dikim çalışması',
    '007': 'Çizim etütleri',
    '008': 'Temel tasarım ve ek çalışmalar'
  };
  const deskColors = {
    '001': '#d8c8c4', '002': '#cbd9d8', '003': '#d7cec0',
    '004': '#d8c8ca', '005': '#d9c9bd', '006': '#d5c8c5', '007': '#d7d3cd', '008': '#cdd3d8'
  };
  const data = Array.isArray(window.PORTFOLIO_DATA) ? window.PORTFOLIO_DATA : [];
  const bookRange = document.querySelector('.hero-art-label.bottom');
  if (bookRange && data.length) bookRange.textContent = `01 — ${String(data.length).padStart(2, '0')} / TASARIM DEFTERLERİ`;
  let activeBook = null;
  let lastFocus = null;

  if (!data.length) {
    works.innerHTML = '<p class="load-error">Çalışmalar yüklenemedi.</p>';
    return;
  }

  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

  function arrange(images) {
    const ordered = [...images].sort((a, b) => Number(b.kind === 'board') - Number(a.kind === 'board'));
    const spreads = [];
    for (let i = 0; i < ordered.length;) {
      const item = ordered[i];
      if (item.orientation === 'landscape') {
        spreads.push([item]);
        i++;
      } else if (ordered[i + 1] && ordered[i + 1].orientation !== 'landscape') {
        spreads.push([item, ordered[i + 1]]);
        i += 2;
      } else {
        spreads.push([item]);
        i++;
      }
    }
    return spreads;
  }

  function imageTile(image, portrait) {
    const source = escapeHtml(image.src);
    const alt = escapeHtml(image.alt || 'Çalışma görseli');
    const label = image.kind === 'board' ? 'MOODBOARD' : image.kind === 'plate' ? 'PAFTA' : image.kind === 'photo' ? 'UYGULAMA' : image.kind === 'study' ? 'ETÜT' : image.kind === 'collage' ? 'KOLAJ' : 'ÇİZİM';
    const crop = image.crop ? ` crop-tile crop-${image.crop}` : '';
    const ratio = image.width && image.height ? image.width / image.height : portrait ? .75 : 1.3333;
    return `<button type="button" class="image-tile ${portrait ? 'portrait-tile' : 'landscape-tile'}${crop}" style="--image-ratio:${ratio}" data-image="${source}" data-alt="${alt}" aria-label="${alt} — büyüt"><img src="${source}" alt="${alt}" loading="lazy"><span class="photo-label">${label}</span></button>`;
  }

  function spreadHtml(book, index) {
    const images = book.spreads[index];
    const wide = images.length === 1 && images[0].orientation === 'landscape';
    const solo = images.length === 1 && !wide;
    const pdf = book.entry.pdf && index === 0 ? `<a class="pdf-link" href="${escapeHtml(book.entry.pdf)}" target="_blank" rel="noopener" aria-label="Paftayı PDF aç">Paftayı PDF aç ↗</a>` : '';
    let pages;
    if (wide || solo) {
      pages = `<div class="paper-page">${imageTile(images[0], solo)}<span class="page-mark">${String(index + 1).padStart(2, '0')}</span></div>`;
    } else {
      pages = [0, 1].map(side => `<div class="paper-page ${images[side] ? '' : 'empty-page'}">${images[side] ? imageTile(images[side], true) : ''}<span class="page-mark">${String(index * 2 + side + 1).padStart(2, '0')}</span></div>`).join('');
    }
    return `${pages}<div class="spread-center"></div>${pdf}<div class="turn-sheet" aria-hidden="true"></div>`;
  }

  const books = data.map((entry, order) => {
    const id = entry.id || String(order + 1).padStart(3, '0');
    const label = descriptors[id] || entry.label || 'Çalışmalar';
    const spreads = arrange(entry.images || []);
    if (id === '001' && entry.images?.[0]) {
      const original = entry.images[0];
      spreads[0] = [{...original, kind:'plate'}];
      spreads.push([
        {...original, alt:'Japonya temalı tasarım paftası, sol kıyafet detayı', kind:'drawing', crop:'left'},
        {...original, alt:'Japonya temalı tasarım paftası, sağ kıyafet detayı', kind:'drawing', crop:'right'}
      ]);
    }
    const section = document.createElement('section');
    section.className = 'book-section';
    section.id = `book-${id}`;
    section.style.setProperty('--desk', deskColors[id] || '#dad4ca');
    section.style.setProperty('--prev-desk', order === 0 ? '#e9e1d6' : (deskColors[data[order - 1].id] || '#dad4ca'));
    section.setAttribute('aria-label', `${id}, ${label}`);
    section.innerHTML = `
      <div class="section-meta"><span class="section-index">${escapeHtml(id)} <span aria-hidden="true">/</span></span><span class="section-title">${escapeHtml(label)}</span><span class="section-count">MERVE YILMAZ &nbsp; · &nbsp; ${String(order + 1).padStart(2, '0')} / ${String(data.length).padStart(2, '0')}</span></div>
      <div class="book-shell">
        <div class="spread" role="group" aria-label="${escapeHtml(label)} sayfaları"></div>
        <div class="book-controls">
          <button class="turn-btn prev" type="button" aria-label="Önceki sayfa">← &nbsp; ÖNCEKİ</button>
          <div class="book-position"><span class="page-counter" aria-live="polite"></span><button class="thumb-toggle" type="button" aria-expanded="false">SAYFALAR</button></div>
          <button class="turn-btn next" type="button" aria-label="Sonraki sayfa">SONRAKİ &nbsp; →</button>
        </div>
        <div class="thumb-drawer" hidden aria-label="Sayfa önizlemeleri"></div>
      </div>`;
    works.append(section);
    const book = {entry, id, label, section, spreads, index:0, turning:false};
    const drawer = section.querySelector('.thumb-drawer');
    drawer.innerHTML = spreads.map((spread, i) => `<button type="button" class="thumb" data-index="${i}" aria-label="${i + 1}. açılıma git"><img src="${escapeHtml(spread[0].src)}" alt="" loading="lazy"><span>${String(i + 1).padStart(2, '0')}</span></button>`).join('');
    section.querySelector('.prev').addEventListener('click', () => turn(book, -1));
    section.querySelector('.next').addEventListener('click', () => turn(book, 1));
    section.querySelector('.thumb-toggle').addEventListener('click', () => {
      drawer.hidden = !drawer.hidden;
      section.querySelector('.thumb-toggle').setAttribute('aria-expanded', String(!drawer.hidden));
    });
    drawer.addEventListener('click', event => {
      const thumb = event.target.closest('.thumb');
      if (!thumb) return;
      const destination = Number(thumb.dataset.index);
      if (destination !== book.index) turn(book, destination - book.index, destination);
      drawer.hidden = true;
      section.querySelector('.thumb-toggle').setAttribute('aria-expanded', 'false');
    });
    section.querySelector('.spread').addEventListener('click', event => {
      const tile = event.target.closest('.image-tile');
      if (tile) openImage(tile);
    });
    render(book);
    const link = document.createElement('a');
    link.href = `#book-${id}`;
    link.innerHTML = `<span class="menu-id">${escapeHtml(id)}</span><span>${escapeHtml(label)}</span>`;
    link.addEventListener('click', closeMenu);
    menu.append(link);
    return book;
  });

  function render(book) {
    const spread = book.section.querySelector('.spread');
    spread.classList.remove('turning-next', 'turning-prev');
    spread.classList.toggle('wide-spread', book.spreads[book.index].length === 1 && book.spreads[book.index][0].orientation === 'landscape');
    spread.classList.toggle('solo-spread', book.spreads[book.index].length === 1 && book.spreads[book.index][0].orientation !== 'landscape');
    spread.innerHTML = spreadHtml(book, book.index);
    book.section.querySelector('.prev').disabled = book.index === 0;
    book.section.querySelector('.next').disabled = book.index === book.spreads.length - 1;
    book.section.querySelector('.page-counter').textContent = `${String(book.index + 1).padStart(2, '0')} / ${String(book.spreads.length).padStart(2, '0')}`;
    book.section.querySelectorAll('.thumb').forEach((thumb, index) => {
      thumb.classList.toggle('active', index === book.index);
      thumb.setAttribute('aria-current', index === book.index ? 'page' : 'false');
    });
  }

  function turn(book, delta, directIndex) {
    const target = directIndex ?? book.index + delta;
    if (book.turning || target < 0 || target >= book.spreads.length || target === book.index) return;
    if (reducedMotion.matches) {book.index = target; render(book); return;}
    book.turning = true;
    const spread = book.section.querySelector('.spread');
    spread.classList.remove('turning-next', 'turning-prev');
    const sheet = spread.querySelector('.turn-sheet');
    const side = delta > 0 ? (spread.querySelectorAll('.paper-page')[1] || spread.querySelector('.paper-page')) : spread.querySelector('.paper-page');
    if (side) sheet.innerHTML = side.innerHTML.replaceAll('tabindex="0"', 'tabindex="-1"');
    spread.classList.add(delta > 0 ? 'turning-next' : 'turning-prev');
    setTimeout(() => {
      book.index = target;
      render(book);
      book.turning = false;
    }, 540);
  }

  function openImage(tile) {
    lastFocus = tile;
    lightboxImage.src = tile.dataset.image;
    lightboxImage.alt = tile.dataset.alt;
    lightboxCaption.textContent = tile.dataset.alt;
    dialog.classList.remove('zoomed');
    dialog.showModal();
    dialog.querySelector('.lightbox-close').focus();
  }
  function closeImage() {
    if (!dialog.open) return;
    dialog.close();
    lightboxImage.removeAttribute('src');
    if (lastFocus?.isConnected) lastFocus.focus();
  }
  dialog.querySelector('.lightbox-close').addEventListener('click', closeImage);
  dialog.addEventListener('click', event => {if (event.target === dialog) closeImage();});
  dialog.addEventListener('close', () => {dialog.classList.remove('zoomed'); if (lastFocus?.isConnected) lastFocus.focus();});
  lightboxImage.addEventListener('click', () => dialog.classList.toggle('zoomed'));

  function closeMenu() {menu.hidden = true; menuToggle.setAttribute('aria-expanded', 'false');}
  menuToggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    menuToggle.setAttribute('aria-expanded', String(!menu.hidden));
  });
  document.addEventListener('click', event => {
    if (!menu.hidden && !menu.contains(event.target) && !menuToggle.contains(event.target)) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {if (!menu.hidden) closeMenu(); if (dialog.open) closeImage(); return;}
    if (dialog.open || !menu.hidden || !activeBook || !['ArrowRight','ArrowLeft'].includes(event.key)) return;
    const focused = document.activeElement;
    if (focused && /INPUT|TEXTAREA|SELECT/.test(focused.tagName)) return;
    event.preventDefault();
    turn(activeBook, event.key === 'ArrowRight' ? 1 : -1);
  });

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) activeBook = books.find(book => book.section === entry.target);
  }, {rootMargin:'-35% 0px -35% 0px', threshold:0});
  books.forEach(book => observer.observe(book.section));
})();
