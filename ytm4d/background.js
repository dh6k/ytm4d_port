// Chuyển đổi từ Firefox sang Chromium
// Sử dụng declarativeNetRequest thay cho webRequest với blocking

// Thiết lập các rule cho declarativeNetRequest đã được định nghĩa trong rules.json

// Xử lý nội dung trang
// Sử dụng chrome.scripting API để thực hiện chức năng tương tự filterResponseData
chrome.scripting.registerContentScripts([
  {
    id: "adblock-script",
    matches: ["https://m.youtube.com/*/base.js", "https://m.youtube.com/*/ad.js"],
    js: ["content-script-adblock.js"],
    runAt: "document_start",
    world: "MAIN"
  },
  {
    id: "ui-fix-script",
    matches: ["https://m.youtube.com/*/m=aDST8c*", "https://m.youtube.com/*/m=*OgMq0d*"],
    js: ["content-script-ui-fix.js"],
    runAt: "document_start",
    world: "MAIN"
  }
]);

// Xử lý message từ content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Trả về false để thông báo rằng không hỗ trợ filterResponseData
  sendResponse(false);
  return true;
});

// Thông báo khi extension được cài đặt hoặc cập nhật
chrome.runtime.onInstalled.addListener(() => {
  console.log("YouTube Mobile for desktop extension installed/updated");
  
  // Thiết lập User-Agent thông qua declarativeNetRequest
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [100],
    addRules: [{
      id: 100,
      priority: 1,
      action: {
        type: "modifyHeaders",
        requestHeaders: [{
          header: "User-Agent",
          operation: "set",
          value: "Android 12"
        }]
      },
      condition: {
        urlFilter: "youtube.com",
        resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "font", "object", "xmlhttprequest", "ping", "csp_report", "media", "websocket", "other"]
      }
    }]
  });
});
