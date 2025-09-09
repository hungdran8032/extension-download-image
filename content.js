(() => {
    const imgs = Array.from(document.querySelectorAll("img"))
        .map((img) => img.currentSrc || img.src) // ưu tiên ảnh gốc
        .filter((src) => /\.(png|jpg|jpeg|gif|webp)$/i.test(src));

    chrome.runtime.sendMessage({ type: "IMAGES", images: imgs });
})();
