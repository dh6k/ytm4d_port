// Tạo script để sửa giao diện
// Thay thế cho phần xử lý filterResponseData trong Firefox cho UI

// Xử lý các vấn đề UI cụ thể
const originalFetch = window.fetch;
window.fetch = async function(...args) {
  const response = await originalFetch.apply(this, args);
  
  // Chỉ xử lý các request cụ thể
  const url = args[0].toString();
  
  if (url.includes("aDST8c")) {
    const clone = response.clone();
    const text = await clone.text();
    
    // Thay thế pattern
    let modifiedText = text.replace(/=3\)/g, ")");
    
    // Tạo response mới với nội dung đã sửa đổi
    return new Response(modifiedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  
  if (url.includes("OgMq0d")) {
    const clone = response.clone();
    const text = await clone.text();
    
    // Thay thế pattern
    let modifiedText = text.replace(/\.scrollIntoView\(\{block:"end"\}\)/g, "");
    
    // Tạo response mới với nội dung đã sửa đổi
    return new Response(modifiedText, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  }
  
  return response;
};
