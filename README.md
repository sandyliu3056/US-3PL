# 美國海外倉 · 一件代發

一頁式介紹網站：幫跨境賣家安排美國倉與一件代發，合作倉庫在 City of Industry, California，UPS / FedEx 派送。倉庫是合作夥伴的，網站主體是 Sandy Liu 的顧問服務。

- `index.html` 一支＋地圖底圖 `earth.png`＋兩面國旗 `flags/`，沒有 build、沒有相依套件、沒有後端。
- 字型從 Google Fonts 連結（芫荽 Iansui、Comic Neue、LXGW WenKai TC、Noto Sans TC），其餘全部內嵌。
- 右上可切 中文 / English、手寫風 / 正黑體、深藍 / 棕金 / 墨綠、美國倉時間 / 台北時間。
- 版式、CSS、字型、地圖底圖都和 RMA（After-Sales Parts Planner）同一套：五個分頁、深藍框線面板、金色按鈕。
- 首頁的「產生詢價信」把表單寫成一封信，複製後寄到信箱；這一頁不上傳任何東西。

## 部署

GitHub Pages：Settings → Pages → Branch `main` / root，網址會是 `https://sandyliu3056.github.io/US-3PL/`。
Vercel 或 Netlify：把資料夾拖進去即可。

## 改內容

文字都在 `index.html` 最後的 `I18N` 字典裡，一個鍵兩個值（中、英）。
畫面上的預設文字是中文，切語言時由 `applyLang()` 換掉。
