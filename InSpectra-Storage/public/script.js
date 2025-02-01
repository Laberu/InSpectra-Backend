document.getElementById("uploadBtn").addEventListener("click", async () => {
    const fileInput = document.getElementById("fileInput");
    const message = document.getElementById("message");
    const preview = document.getElementById("preview");

    if (fileInput.files.length === 0) {
        message.textContent = "Please select files to upload.";
        return;
    }

    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
        formData.append("photos", fileInput.files[i]);
    }

    try {
        message.textContent = "Uploading...";
        const response = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: formData,
        });

        const result = await response.json();
        if (response.ok) {
            message.textContent = "Upload successful!";
            preview.innerHTML = "";
            result.files.forEach(file => {
                const img = document.createElement("img");
                img.src = `http://localhost:3001${file.path}`;
                preview.appendChild(img);
            });
        } else {
            message.textContent = "Upload failed. Try again.";
        }
    } catch (error) {
        message.textContent = "Error uploading files.";
        console.error("Upload error:", error);
    }
});
