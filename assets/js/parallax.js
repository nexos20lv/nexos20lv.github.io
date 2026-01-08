document.addEventListener("mousemove", (e) => {
    const blobCtns = document.querySelectorAll(".blobCtn");
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;

    blobCtns.forEach((ctn, index) => {
        const speed = (index + 1) * 20;
        const xOffset = (x - 0.5) * speed;
        const yOffset = (y - 0.5) * speed;

        ctn.style.setProperty('--p-x', `${xOffset}px`);
        ctn.style.setProperty('--p-y', `${yOffset}px`);
    });
});
