// 動態生成 manifest.json 內容的腳本
document.addEventListener('DOMContentLoaded', function() {
  const basePath = window.appBasePath || '/';
  
  // 創建 manifest 內容
  const manifest = {
    "name": "小雞掰 PWA",
    "short_name": "小雞掰",
    "description": "一個可愛的互動式虛擬寵物遊戲",
    "start_url": basePath + "index.html?source=pwa",
    "scope": basePath,
    "display": "standalone",
    "orientation": "portrait",
    "background_color": "#f9f9f9",
    "theme_color": "#4CAF50",
    "prefer_related_applications": false,
    "categories": ["games", "entertainment", "lifestyle"],
    "shortcuts": [
      {
        "name": "開始遊戲",
        "short_name": "開始",
        "description": "開始與小雞掰互動",
        "url": basePath + "#start"
      },
      {
        "name": "餵食小雞掰",
        "short_name": "餵食",
        "description": "給小雞掰餵食",
        "url": basePath + "#feed"
      },
      {
        "name": "查看狀態",
        "short_name": "狀態",
        "description": "查看小雞掰的狀態",
        "url": basePath + "#status"
      },
      {
        "name": "設定",
        "short_name": "設定",
        "description": "應用程式設定",
        "url": basePath + "#settings"
      }
    ],
    "icons": [
      {
        "src": basePath + "icons/icon-192x192.png",
        "sizes": "192x192",
        "type": "image/png",
        "purpose": "any maskable"
      },
      {
        "src": basePath + "icons/icon-512x512.png",
        "sizes": "512x512",
        "type": "image/png",
        "purpose": "any maskable"
      }
    ]
  };
  
  // 將 manifest 內容轉換為 JSON 字符串
  const manifestJson = JSON.stringify(manifest);
  
  // 創建 Blob 對象
  const blob = new Blob([manifestJson], {type: 'application/json'});
  
  // 創建 URL 對象
  const manifestUrl = URL.createObjectURL(blob);
  
  // 設置 manifest 連結
  document.getElementById('manifestLink').href = manifestUrl;
});
