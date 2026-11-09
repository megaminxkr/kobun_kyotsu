// Apply theme before paint. Storage may be disabled by the browser.
try {var theme = JSON.parse(localStorage.getItem('kobun-kyotsu:v1'))?.theme;if(theme==='dark')document.documentElement.dataset.theme='dark';} catch {}
document.documentElement.classList.add('js');
