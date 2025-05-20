// 小雞掰 PWA 主要 JavaScript 檔案

// 遊戲狀態
const gameState = {
  hunger: 80,
  happiness: 70,
  energy: 90,
  currentMood: 'normal', // normal, happy, sad, tired
  lastInteraction: Date.now(),
  characterState: 1, // 1, 2, 3 對應三張圖片
};

// DOM 元素
let chicken;
let chatBox;
let chatInput;
let statusMessage;
let hungerBar;
let happinessBar;
let energyBar;
let foodOptions;

// PWA 安裝提示相關變量
let deferredPrompt;
let installPrompt;
let installButton;
let dismissButton;

// 檢查是否以 PWA 模式運行
function isRunningAsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

// 顯示安裝提示
function showInstallPrompt() {
  // 檢查是否已經顯示過提示
  if (localStorage.getItem('installPromptDismissed') !== 'true') {
    installPrompt.classList.add('show');
  }
}

// 隱藏安裝提示
function hideInstallPrompt() {
  installPrompt.classList.remove('show');
  localStorage.setItem('installPromptDismissed', 'true');
}

// 檢查離線狀態並更新 UI
function updateOnlineStatus() {
  const offlineStatus = document.getElementById('offline-status');
  if (!navigator.onLine) {
    offlineStatus.classList.add('show');
  } else {
    offlineStatus.classList.remove('show');
  }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  // 獲取 DOM 元素
  chicken = document.getElementById('chicken');
  chatBox = document.getElementById('chat-box');
  chatInput = document.getElementById('chat-input');
  statusMessage = document.getElementById('status-message');
  hungerBar = document.querySelector('#hunger-bar .status-bar-inner');
  happinessBar = document.querySelector('#happiness-bar .status-bar-inner');
  energyBar = document.querySelector('#energy-bar .status-bar-inner');
  foodOptions = document.getElementById('food-options');
  
  // PWA 安裝提示元素
  installPrompt = document.getElementById('install-prompt');
  installButton = document.getElementById('install-button');
  dismissButton = document.getElementById('dismiss-button');
  
  // 分享按鈕
  const shareButton = document.getElementById('share-button');
  if (shareButton) {
    shareButton.addEventListener('click', shareApp);
    // 如果不支持分享 API，隱藏分享按鈕
    if (!navigator.share) {
      shareButton.style.display = 'none';
    }
  }

  // 設置初始角色圖片
  updateCharacterImage();
  
  // 更新狀態條
  updateStatusBars();
  
  // 設置事件監聽器
  setupEventListeners();
  
  // 註冊 Service Worker
  registerServiceWorker();
  
  // 監聽 beforeinstallprompt 事件
  window.addEventListener('beforeinstallprompt', (e) => {
    // 防止 Chrome 67 及更早版本自動顯示提示
    e.preventDefault();
    // 保存事件，以便稍後觸發
    deferredPrompt = e;
    
    // 如果沒有以 PWA 模式運行，顯示自定義安裝按鈕
    if (!isRunningAsPWA()) {
      showInstallPrompt();
    }
  });
  
  // 安裝按鈕點擊事件
  if (installButton) {
    installButton.addEventListener('click', async () => {
      if (deferredPrompt) {
        // 顯示安裝提示
        deferredPrompt.prompt();
        // 等待用戶響應
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`用戶回應: ${outcome}`);
        // 清除保存的提示
        deferredPrompt = null;
        // 隱藏安裝提示
        hideInstallPrompt();
      }
    });
  }
  
  // 稍後再說按鈕點擊事件
  if (dismissButton) {
    dismissButton.addEventListener('click', hideInstallPrompt);
  }
  
  // 監聽線上/離線狀態變化
  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  updateOnlineStatus();
  
  // 開始遊戲循環
  startGameLoop();
  
  // 顯示歡迎訊息
  setTimeout(() => {
    addChickenMessage('嗨！我是小雞掰！很高興認識你！');
  }, 1000);
});

// 註冊 Service Worker
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/Chick-Bitch/service-worker.js')
        .then(registration => {
          console.log('ServiceWorker 註冊成功:', registration.scope);
          
          // 檢查更新
          registration.update().then(() => {
            console.log('ServiceWorker 檢查更新完成');
          }).catch(error => {
            console.error('ServiceWorker 檢查更新失敗:', error);
          });
          
          // 監聽更新事件
          let refreshing = false;
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
              window.location.reload();
              refreshing = true;
            }
          });
          
        })
        .catch(error => {
          console.log('ServiceWorker 註冊失敗:', error);
        });
    });
  }
}

// 分享應用
function shareApp() {
  if (navigator.share) {
    navigator.share({
      title: '小雞掰 - 可愛的虛擬寵物',
      text: '來看看我可愛的小雞掰寵物吧！',
      url: window.location.href,
    })
    .then(() => console.log('分享成功'))
    .catch((error) => console.log('分享失敗', error));
  } else {
    // 如果不支持 Web Share API，複製鏈接到剪貼板
    navigator.clipboard.writeText(window.location.href)
      .then(() => {
        showStatusMessage('已複製鏈接到剪貼板！');
      })
      .catch(err => {
        console.error('複製失敗: ', err);
        showStatusMessage('複製失敗，請手動分享');
      });
  }
}

// 設置事件監聽器
function setupEventListeners() {
  // 聊天輸入框按 Enter 鍵發送訊息
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') chatWithChicken();
  });
  
  // 點擊角色
  chicken.addEventListener('click', () => {
    petChicken();
  });
  
  // 食物選項點擊事件
  document.querySelectorAll('.food-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const foodType = e.currentTarget.dataset.food;
      feedChickenWithFood(foodType);
    });
  });
}

// 遊戲主循環
function startGameLoop() {
  // 每 30 秒更新一次遊戲狀態
  setInterval(() => {
    updateGameState();
  }, 30000);
}

// 更新遊戲狀態
function updateGameState() {
  // 隨著時間減少飢餓、快樂和能量值
  gameState.hunger = Math.max(0, gameState.hunger - 5);
  gameState.happiness = Math.max(0, gameState.happiness - 3);
  gameState.energy = Math.max(0, gameState.energy - 2);
  
  // 根據狀態更新心情
  updateMood();
  
  // 更新 UI
  updateStatusBars();
  updateCharacterImage();
  
  // 如果太久沒互動，顯示提示訊息
  const now = Date.now();
  if (now - gameState.lastInteraction > 120000) { // 2 分鐘
    addChickenMessage('你還在嗎？我有點無聊了...');
    gameState.lastInteraction = now;
  }
}

// 更新角色心情
function updateMood() {
  if (gameState.hunger < 20) {
    gameState.currentMood = 'sad';
    gameState.characterState = 3; // 使用第三張圖片（悲傷）
  } else if (gameState.happiness > 80) {
    gameState.currentMood = 'happy';
    gameState.characterState = 2; // 使用第二張圖片（開心）
  } else if (gameState.energy < 30) {
    gameState.currentMood = 'tired';
    gameState.characterState = 3; // 使用第三張圖片（疲倦）
  } else {
    gameState.currentMood = 'normal';
    gameState.characterState = 1; // 使用第一張圖片（普通）
  }
}

// 更新角色圖片
function updateCharacterImage() {
  chicken.style.backgroundImage = `url('main_character_0${gameState.characterState}.png')`;
}

// 更新狀態條
function updateStatusBars() {
  hungerBar.style.width = `${gameState.hunger}%`;
  happinessBar.style.width = `${gameState.happiness}%`;
  energyBar.style.width = `${gameState.energy}%`;
}

// 顯示狀態訊息
function showStatusMessage(message, duration = 3000) {
  statusMessage.textContent = message;
  statusMessage.style.opacity = 1;
  
  setTimeout(() => {
    statusMessage.style.opacity = 0;
  }, duration);
}

// 添加小雞掰的訊息到聊天框
function addChickenMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message chicken-message';
  messageElement.textContent = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 添加用戶的訊息到聊天框
function addUserMessage(message) {
  const messageElement = document.createElement('div');
  messageElement.className = 'chat-message user-message';
  messageElement.textContent = message;
  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// 與小雞掰聊天
function chatWithChicken() {
  const message = chatInput.value.trim();
  if (!message) return;
  
  // 添加用戶訊息
  addUserMessage(message);
  chatInput.value = '';
  
  // 記錄互動時間
  gameState.lastInteraction = Date.now();
  
  // 增加快樂值
  gameState.happiness = Math.min(100, gameState.happiness + 5);
  updateStatusBars();
  
  // 根據用戶訊息生成回應
  setTimeout(() => {
    let response;
    
    // 簡單的關鍵詞回應系統
    if (message.includes('你好') || message.includes('嗨') || message.includes('哈囉')) {
      response = '嗨！很高興跟你聊天！';
    } else if (message.includes('餓') || message.includes('吃')) {
      response = '我也有點餓了，可以餵我一些食物嗎？';
    } else if (message.includes('累') || message.includes('睡')) {
      response = '我現在精力充沛，不想睡覺！';
    } else if (message.includes('跳舞') || message.includes('舞')) {
      response = '我超愛跳舞的！要看我跳舞嗎？';
      setTimeout(danceChicken, 1000);
    } else if (message.includes('名字')) {
      response = '我叫小雞掰！很可愛的名字對吧？';
    } else if (message.includes('喜歡') || message.includes('愛')) {
      response = '我最喜歡和你互動了！';
    } else {
      // 隨機回應
      const randomResponses = [
        `${message}？這個想法很有趣！`,
        '哈哈，我聽到了！繼續說...',
        '嗯...讓我想想...',
        '真的嗎？太棒了！',
        '我完全同意！',
        '這個嘛...我得好好想想！'
      ];
      response = randomResponses[Math.floor(Math.random() * randomResponses.length)];
    }
    
    addChickenMessage(response);
  }, 1000);
}

// 餵食小雞掰
function feedChicken() {
  // 顯示食物選項
  foodOptions.style.display = foodOptions.style.display === 'flex' ? 'none' : 'flex';
  
  if (foodOptions.style.display === 'flex') {
    showStatusMessage('請選擇要餵食的食物');
  }
}

// 用特定食物餵食小雞掰
function feedChickenWithFood(foodType) {
  // 隱藏食物選項
  foodOptions.style.display = 'none';
  
  // 記錄互動時間
  gameState.lastInteraction = Date.now();
  
  // 根據食物類型增加不同的飢餓值和快樂值
  let hungerIncrease = 0;
  let happinessIncrease = 0;
  let message = '';
  
  switch (foodType) {
    case 'rice':
      hungerIncrease = 20;
      happinessIncrease = 5;
      message = '謝謝你給我飯！好好吃！';
      break;
    case 'fruit':
      hungerIncrease = 10;
      happinessIncrease = 15;
      message = '水果真甜！我超愛的！';
      break;
    case 'candy':
      hungerIncrease = 5;
      happinessIncrease = 20;
      message = '糖果！太棒了！不過不能吃太多哦！';
      break;
    case 'meat':
      hungerIncrease = 30;
      happinessIncrease = 10;
      message = '肉肉！好飽足！謝謝你！';
      break;
  }
  
  // 更新遊戲狀態
  gameState.hunger = Math.min(100, gameState.hunger + hungerIncrease);
  gameState.happiness = Math.min(100, gameState.happiness + happinessIncrease);
  updateStatusBars();
  
  // 顯示動畫和訊息
  chicken.classList.add('eating');
  showStatusMessage(`小雞掰正在吃${getFoodName(foodType)}...`);
  
  setTimeout(() => {
    chicken.classList.remove('eating');
    addChickenMessage(message);
    
    // 更新心情和角色圖片
    updateMood();
    updateCharacterImage();
  }, 1000);
}

// 獲取食物名稱
function getFoodName(foodType) {
  switch (foodType) {
    case 'rice': return '飯';
    case 'fruit': return '水果';
    case 'candy': return '糖果';
    case 'meat': return '肉';
    default: return '食物';
  }
}

// 讓小雞掰跳舞
function danceChicken() {
  // 記錄互動時間
  gameState.lastInteraction = Date.now();
  
  // 增加快樂值，減少能量值
  gameState.happiness = Math.min(100, gameState.happiness + 15);
  gameState.energy = Math.max(0, gameState.energy - 10);
  updateStatusBars();
  
  // 顯示動畫和訊息
  chicken.classList.add('dancing');
  showStatusMessage('小雞掰正在開心跳舞！');
  
  // 暫時切換到開心的圖片
  const originalState = gameState.characterState;
  gameState.characterState = 2;
  updateCharacterImage();
  
  setTimeout(() => {
    chicken.classList.remove('dancing');
    gameState.characterState = originalState;
    updateCharacterImage();
    addChickenMessage('跳舞真開心！我好喜歡跳舞！');
    
    // 如果能量太低，顯示疲倦訊息
    if (gameState.energy < 20) {
      setTimeout(() => {
        addChickenMessage('不過我有點累了...');
        gameState.currentMood = 'tired';
        gameState.characterState = 3;
        updateCharacterImage();
      }, 2000);
    }
  }, 3000);
}

// 撫摸小雞掰
function petChicken() {
  // 記錄互動時間
  gameState.lastInteraction = Date.now();
  
  // 增加快樂值
  gameState.happiness = Math.min(100, gameState.happiness + 10);
  updateStatusBars();
  
  // 顯示動畫和訊息
  chicken.style.transform = 'scale(1.1)';
  showStatusMessage('你輕輕撫摸了小雞掰');
  
  setTimeout(() => {
    chicken.style.transform = 'scale(1)';
    
    // 根據心情顯示不同的回應
    let response;
    if (gameState.currentMood === 'happy') {
      response = '好舒服～我好喜歡你摸我！';
    } else if (gameState.currentMood === 'sad') {
      response = '謝謝你關心我...我有點餓了...';
    } else if (gameState.currentMood === 'tired') {
      response = '嗯...好舒服...我有點想睡覺了...';
    } else {
      response = '謝謝你的撫摸！好溫暖！';
    }
    
    addChickenMessage(response);
  }, 1000);
}
