# Sandy Liu · 美國海外倉

一頁式介紹網站：跨境賣家的美國倉（City of Industry, California）、一件代發、UPS / FedEx 派送。

- 單一 `index.html`，沒有 build、沒有相依套件、沒有後端。
- 字型從 Google Fonts 連結（Patrick Hand、Noto Sans TC），其餘全部內嵌。
- 右上可切 繁體中文 / English；深色模式跟著系統。
- 版式照 After-Sales Parts Planner：海軍藍標題列、金色手寫體大標、分頁條、深藍框線面板。

## 部署

GitHub Pages：Settings → Pages → Branch `main` / root，網址會是 `https://sandyliu3056.github.io/US-3PL/`。
Vercel 或 Netlify：把資料夾拖進去即可。

## 改內容

文字都在 `index.html` 最後的 `I18N` 字典裡，一個鍵兩個值（中、英）。
畫面上的預設文字是中文，切語言時由 `applyLang()` 換掉。
