let currentSelectedText = "";

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "open_popup") {
    currentSelectedText = request.text;
    buildElegantPopup();
  }
});

async function buildElegantPopup() {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;

  const range = sel.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  let popup = document.getElementById('tr-elegant-popup');
  if (popup) popup.remove();

  popup = document.createElement('div');
  popup.id = 'tr-elegant-popup';

  const settings = await chrome.storage.sync.get(['theme', 'targetLang']);
  const theme = settings.theme || 'dark';
  const lang = settings.targetLang || 'ru';

  popup.className = `tr-theme-${theme}`;
  if (currentSelectedText.length > 120) popup.classList.add('tr-wide');

  popup.innerHTML = `
        <div class="tr-container">
            <div class="tr-nav">
                <button id="tr-gear-btn" class="tr-icon-btn">⚙</button>
                <div class="tr-nav-right">
                    <button id="tr-close-x" class="tr-icon-btn">✕</button>
                </div>
            </div>

            <div id="tr-content-area" class="tr-main-text">
                <div class="tr-loading-dots"><span>.</span><span>.</span><span>.</span></div>
            </div>

            <div id="tr-panel" class="tr-settings-bar tr-collapsed">
                <div class="tr-row">
                    <span>Язык</span>
                    <select id="tr-lang-picker">
                        <option value="ru" ${lang==='ru'?'selected':''}>Русский</option>
                        <option value="en" ${lang==='en'?'selected':''}>English</option>
                        <option value="uk" ${lang==='uk'?'selected':''}>Українська</option>
                        <option value="de" ${lang==='de'?'selected':''}>Deutsch</option>
                    </select>
                </div>
                <div class="tr-row">
                    <span>Тема</span>
                    <button id="tr-theme-switcher" class="tr-action-btn">${theme==='dark'?'Светлая':'Темная'}</button>
                </div>
            </div>
        </div>
    `;

  document.body.appendChild(popup);

  popup.style.left = `${rect.left + window.scrollX}px`;
  popup.style.top = `${rect.bottom + window.scrollY + 12}px`;

  document.getElementById('tr-close-x').onclick = () => popup.remove();

  document.getElementById('tr-gear-btn').onclick = () => {
    document.getElementById('tr-panel').classList.toggle('tr-collapsed');
  };

  document.getElementById('tr-lang-picker').onchange = (e) => {
    chrome.storage.sync.set({targetLang: e.target.value});
    executeTranslation(e.target.value);
  };

  document.getElementById('tr-theme-switcher').onclick = async () => {
    const data = await chrome.storage.sync.get(['theme']);
    const newTheme = data.theme === 'dark' ? 'light' : 'dark';
    await chrome.storage.sync.set({theme: newTheme});
    popup.className = `tr-theme-${newTheme}`;
    if (currentSelectedText.length > 120) popup.classList.add('tr-wide');
    document.getElementById('tr-theme-switcher').innerText = newTheme==='dark'?'Светлая':'Темная';
  };

  executeTranslation(lang);
}

async function executeTranslation(target) {
  const area = document.getElementById('tr-content-area');
  try {
    const api = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${target}&dt=t&q=${encodeURIComponent(currentSelectedText)}`;
    const r = await fetch(api);
    const d = await r.json();
    let final = "";
    d[0].forEach(part => { if(part[0]) final += part[0]; });
    area.innerHTML = `<div class="tr-final-text">${final}</div>`;
  } catch(e) {
    area.innerText = "Ошибка сети";
  }
}
