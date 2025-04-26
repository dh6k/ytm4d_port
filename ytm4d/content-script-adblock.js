// Tạo script để xử lý quảng cáo
// Thay thế cho phần xử lý filterResponseData trong Firefox

// Tìm và thay thế các pattern liên quan đến quảng cáo
const regex = /\.controls=|adPlacements|playerAds|adSlots/g;

// Thay thế các pattern
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  
  // Chỉ xử lý các request JavaScript
  const url = args[0].toString();
  if (url.endsWith('.js')) {
    const clone = response.clone();
    const text = await clone.text();
    
    // Thay thế các pattern
    let modifiedText = text.replace(regex, x => x === ".controls=" ? x + "!" : "nothing");
    
    // Tạo response mới với nội dung đã sửa đổi
    return new Response(modifiedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  
  return response;
};
