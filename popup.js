document.addEventListener("DOMContentLoaded", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.type === "IMAGES") {
            renderImages(msg.images);
        }
    });

    function renderImages(images) {
        const container = document.getElementById("image-list");
        container.innerHTML = "";

        images.forEach((src) => {
            const div = document.createElement("div");
            div.className = "img-item";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.dataset.src = src;

            const img = document.createElement("img");
            img.src = src;

            div.appendChild(checkbox);
            div.appendChild(img);
            container.appendChild(div);
        });

        const downloadBtn = document.getElementById("downloadBtn");
        const downloadZipBtn = document.getElementById("downloadZipBtn");
        const selectAllBtn = document.getElementById("selectAllBtn");
        const clearAllBtn = document.getElementById("clearAllBtn");
        info.textContent = `📸 Tổng số ảnh: ${images.length} | Đã chọn: 0`;
        function updateButtonState() {
            const checked = container.querySelectorAll("input[type=checkbox]:checked");
            const hasSelection = checked.length > 0;
            downloadBtn.disabled = !hasSelection;
            downloadZipBtn.disabled = !hasSelection;
            info.textContent = `📸 Tổng số ảnh: ${images.length} | Đã chọn: ${checked.length}`;
        }

        container.addEventListener("change", updateButtonState);

        selectAllBtn.addEventListener("click", () => {
            container.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = true));
            updateButtonState();
        });

        clearAllBtn.addEventListener("click", () => {
            container.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = false));
            updateButtonState();
        });

        // Tải từng ảnh
        downloadBtn.addEventListener("click", () => {
            const checked = Array.from(container.querySelectorAll("input[type=checkbox]:checked"));
            checked.forEach((cb, index) => {
                const src = cb.dataset.src;
                const extMatch = src.match(/\.(png|jpg|jpeg|gif|webp)(?=$|\?)/i);
                const ext = extMatch ? extMatch[1] : "png";
                const filename = `image_${String(index + 1).padStart(2, "0")}.${ext}`;

                chrome.downloads.download({
                    url: src,
                    filename: filename,
                    saveAs: false,
                });
            });
        });

        // Tải ZIP
        downloadZipBtn.addEventListener("click", async () => {
            const checked = Array.from(container.querySelectorAll("input[type=checkbox]:checked"));
            if (checked.length === 0) return;

            const zip = new JSZip();
            let count = 0;

            for (let i = 0; i < checked.length; i++) {
                const src = checked[i].dataset.src;
                const extMatch = src.match(/\.(png|jpg|jpeg|gif|webp)(?=$|\?)/i);
                const ext = extMatch ? extMatch[1] : "png";
                const filename = `image_${String(i + 1).padStart(2, "0")}.${ext}`;

                try {
                    const response = await fetch(src);
                    const blob = await response.blob();
                    zip.file(filename, blob);
                    count++;
                } catch (e) {
                    console.error("Không tải được ảnh:", src, e);
                }
            }

            if (count > 0) {
                const content = await zip.generateAsync({ type: "blob" });
                const url = URL.createObjectURL(content);

                chrome.downloads.download({
                    url: url,
                    filename: "images.zip",
                    saveAs: true,
                });
            }
        });
    }
});
