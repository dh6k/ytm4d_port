// Chuyển đổi từ Firefox sang Chromium
// Thay thế browser.runtime bằng chrome.runtime

// Biến toàn cục để theo dõi trạng thái
let isProgressBarFixApplied = false;

window.addEventListener("visibilitychange", event => {
  event.stopPropagation();
}, true);

window.addEventListener("player-state-change", event => {
  let overlay = document.getElementById("player-control-container");
  if (overlay != null)
    overlay.classList.toggle("ended-mode", event.detail.state == 0)
}, true);

window.addEventListener("click", event => {
  let a = event.target.closest("a");
  if (a != null && a.href.includes("/shorts/")) {
    // Chromium không có wrappedJSObject và cloneInto
    // Sử dụng cách tiếp cận khác để xử lý shorts
    try {
      let video_id = a.href.substring(a.href.lastIndexOf("/") + 1);
      // Thay đổi href trực tiếp
      a.href = "/watch?v=" + video_id;
      
      // Ngăn chặn sự kiện mặc định và điều hướng thủ công
      event.preventDefault();
      window.location.href = a.href;
    } catch (e) {
      console.error("Error handling shorts link:", e);
    }
  }
}, true);

chrome.runtime.sendMessage(null).then(old => {
  if (old === false) {
    window.addEventListener("DOMContentLoaded", () => {
      let config = { subtree: true, attributes: true, attributeFilter: ["controlslist", "controls"] };
      new MutationObserver((mutations, observer) => {
        observer.disconnect();
        mutations[0].target.controls = true;
        observer.observe(document.body, config);
      }).observe(document.body, config);
    });
  }
});

// Hàm chính để thiết lập xử lý video player
function setupVideoControls() {
  // Nếu đã áp dụng fix và không phải trang watch, không làm gì cả
  if (isProgressBarFixApplied && !location.pathname.includes('/watch')) {
    return;
  }
  
  console.log("YouTube Mobile for Desktop: Setting up video controls...");
  
  // Cách tiếp cận 1: Bắt tất cả các sự kiện click trên video player
  function handleVideoPlayerInteraction() {
    const videoElement = document.querySelector('video');
    if (!videoElement) {
      setTimeout(handleVideoPlayerInteraction, 500);
      return;
    }
    
    // Bắt sự kiện click trên toàn bộ khu vực player
    const playerContainer = document.getElementById('player-container-id') || 
                           document.getElementById('movie_player') ||
                           videoElement.parentElement;
    
    if (playerContainer) {
      console.log("YouTube Mobile for Desktop: Found player container, setting up event listeners");
      
      // Bắt sự kiện click trên toàn bộ player
      playerContainer.addEventListener('click', (event) => {
        // Kiểm tra nếu click vào thanh tiến trình hoặc các điều khiển
        const isProgressBarClick = event.target.classList.contains('ytp-progress-bar') || 
                                  event.target.classList.contains('ytp-progress-list') ||
                                  event.target.classList.contains('ytp-progress-control') ||
                                  event.target.closest('.ytp-progress-bar-container') ||
                                  event.target.closest('.ytp-chrome-bottom');
        
        if (isProgressBarClick) {
          console.log("YouTube Mobile for Desktop: Progress bar click detected");
          // Đặt timeout để đảm bảo video được phát sau khi xử lý click mặc định
          setTimeout(() => {
            if (videoElement && videoElement.paused) {
              console.log("YouTube Mobile for Desktop: Auto-resuming video");
              videoElement.play().catch(e => {});
            }
          }, 100);
        }
      }, true);
      
      // Bắt sự kiện timeupdate để kiểm tra nếu video bị tạm dừng sau khi tua
      let lastTime = 0;
      videoElement.addEventListener('timeupdate', () => {
        // Nếu thời gian thay đổi đáng kể (tua video) và video bị tạm dừng
        if (Math.abs(videoElement.currentTime - lastTime) > 1 && videoElement.paused) {
          console.log("YouTube Mobile for Desktop: Detected seek operation, auto-resuming");
          videoElement.play().catch(e => {});
        }
        lastTime = videoElement.currentTime;
      });
      
      // Đánh dấu đã áp dụng fix
      isProgressBarFixApplied = true;
    }
  }
  
  // Cách tiếp cận 2: Ghi đè phương thức pause của video
  function overrideVideoPause() {
    const videoElement = document.querySelector('video');
    if (!videoElement) {
      setTimeout(overrideVideoPause, 500);
      return;
    }
    
    console.log("YouTube Mobile for Desktop: Overriding video pause method");
    
    // Kiểm tra nếu đã ghi đè phương thức pause
    if (videoElement._originalPause) {
      console.log("YouTube Mobile for Desktop: Pause method already overridden");
      return;
    }
    
    // Lưu phương thức pause gốc
    videoElement._originalPause = videoElement.pause;
    
    // Ghi đè phương thức pause
    videoElement.pause = function() {
      // Kiểm tra nếu pause được gọi từ sự kiện click trên thanh tiến trình
      const stack = new Error().stack || '';
      const isProgressBarPause = stack.includes('progress') || 
                                document.activeElement?.classList.contains('ytp-progress-bar') ||
                                document.activeElement?.closest('.ytp-progress-bar-container') ||
                                document.activeElement?.closest('.ytp-chrome-bottom');
      
      if (isProgressBarPause) {
        console.log("YouTube Mobile for Desktop: Prevented pause from progress bar interaction");
        // Không gọi phương thức pause gốc
        return;
      }
      
      // Gọi phương thức pause gốc cho các trường hợp khác
      return videoElement._originalPause.apply(this, arguments);
    };
    
    // Đánh dấu đã áp dụng fix
    isProgressBarFixApplied = true;
  }
  
  // Thực hiện cả hai cách tiếp cận
  handleVideoPlayerInteraction();
  overrideVideoPause();
  
  // Thiết lập lại khi chuyển video
  function setupWatchPageObserver() {
    // Theo dõi các thay đổi URL
    let lastUrl = location.href;
    new MutationObserver(() => {
      if (location.href !== lastUrl) {
        console.log("YouTube Mobile for Desktop: URL changed from", lastUrl, "to", location.href);
        lastUrl = location.href;
        
        // Reset trạng thái khi URL thay đổi
        isProgressBarFixApplied = false;
        
        if (location.pathname.includes('/watch')) {
          console.log("YouTube Mobile for Desktop: URL changed to watch page");
          // Áp dụng ngay lập tức và sau một độ trễ để bắt các phần tử tải muộn
          setTimeout(() => {
            handleVideoPlayerInteraction();
            overrideVideoPause();
          }, 1000);
        }
      }
    }).observe(document, {subtree: true, childList: true});
  }
  
  setupWatchPageObserver();
}

// Thiết lập ban đầu khi trang được tải
window.addEventListener("DOMContentLoaded", () => {
  console.log("YouTube Mobile for Desktop: DOMContentLoaded event");
  // Áp dụng ngay lập tức và sau một độ trễ
  setupVideoControls();
  setTimeout(setupVideoControls, 1000);
});

// Thiết lập khi trang được tải hoàn toàn
window.addEventListener("load", () => {
  console.log("YouTube Mobile for Desktop: Load event");
  // Áp dụng ngay lập tức và sau một độ trễ
  setupVideoControls();
  setTimeout(setupVideoControls, 1000);
});

// Thiết lập khi sự kiện điều hướng tùy chỉnh của YouTube xảy ra
document.addEventListener('yt-navigate-finish', () => {
  console.log("YouTube Mobile for Desktop: yt-navigate-finish event");
  // Reset trạng thái khi điều hướng
  isProgressBarFixApplied = false;
  // Áp dụng ngay lập tức và sau một độ trễ
  setupVideoControls();
  setTimeout(setupVideoControls, 1000);
});

// Thiết lập khi trang trở nên hiển thị lại (người dùng quay lại tab)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    console.log("YouTube Mobile for Desktop: Page became visible");
    setupVideoControls();
  }
});

// Theo dõi các thay đổi DOM để phát hiện khi video player được thêm vào
const videoPlayerObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length > 0) {
      // Kiểm tra nếu có video hoặc player container được thêm vào
      const hasVideoElement = Array.from(mutation.addedNodes).some(node => {
        return node.nodeName === 'VIDEO' || 
               (node.querySelector && node.querySelector('video')) ||
               node.id === 'player-container-id' || 
               node.id === 'movie_player';
      });
      
      if (hasVideoElement) {
        console.log("YouTube Mobile for Desktop: Video player detected in DOM");
        setupVideoControls();
        break;
      }
    }
  }
});

// Bắt đầu theo dõi các thay đổi DOM
videoPlayerObserver.observe(document.body, {
  childList: true,
  subtree: true
});

// Thiết lập lại sau khi trang đã tải một thời gian
// Giúp bắt các trường hợp điều hướng ban đầu
setTimeout(() => {
  console.log("YouTube Mobile for Desktop: Initial timeout setup");
  setupVideoControls();
}, 2000);

// Thiết lập lại mỗi 5 giây trong 30 giây đầu tiên
for (let i = 5; i <= 30; i += 5) {
  setTimeout(() => {
    console.log(`YouTube Mobile for Desktop: Retry setup after ${i} seconds`);
    setupVideoControls();
  }, i * 1000);
}

// Thực hiện ngay lập tức để bắt trường hợp script được tải sau khi trang đã tải xong
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  console.log("YouTube Mobile for Desktop: Document already loaded, setting up immediately");
  setupVideoControls();
}
