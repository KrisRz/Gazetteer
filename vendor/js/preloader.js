// Matrix Preloader Effect
const canvas = document.getElementById("matrixCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const columns = Math.floor(canvas.width / 20);
const drops = Array(columns).fill(0);

const drawMatrix = () => {
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#00ff00";
    ctx.font = "20px monospace";

    drops.forEach((y, index) => {
        const text = String.fromCharCode(33 + Math.random() * 94);
        ctx.fillText(text, index * 20, y);
        drops[index] = y > canvas.height || Math.random() > 0.975 ? 0 : y + 20;
    });
};

setInterval(drawMatrix, 50);

// 🌟 Keep preloader visible for at least 5 seconds
window.addEventListener("load", () => {
    setTimeout(() => {
        document.getElementById("preloader").style.opacity = "0"; // Fade out
        setTimeout(() => {
            document.getElementById("preloader").style.display = "none"; // Remove after fade
        }, 1000); // 1s fade-out effect
    }, 5000); // Wait 5s before hiding
});
