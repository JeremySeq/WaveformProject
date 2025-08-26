const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
resizeCanvas();

let audioCtx, analyser, source;
const particles = [];

class Particle {
    constructor(x, y, size, color, velocity) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.velocity = velocity;
        this.alpha = 1;
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.015;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

const fileInput = document.getElementById("fileInput");

fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if (!file) return;

    const audio = new Audio(URL.createObjectURL(file));
    audio.controls = true;
    document.body.appendChild(audio);
    audio.play();

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    source = audioCtx.createMediaElementSource(audio);

    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    analyser.fftSize = 256;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        // dark translucent background for trails
        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // generate particles based on frequency
        dataArray.forEach((value, i) => {
            if (value > 160) {
                const bassBoost = i < bufferLength / 4 ? 2 : 1;
                const angle = Math.random() * Math.PI * 2;
                const speed = (value / 45) * bassBoost;

                particles.push(
                    new Particle(
                        centerX,
                        centerY,
                        Math.random() * (bassBoost * 2) + 2,
                        `hsl(${i * 3}, 100%, 50%)`,
                        { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
                    )
                );
            }
        });

        // update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw(ctx);
            if (p.alpha <= 0) particles.splice(i, 1);
        }
    }

    draw();
});

// keep canvas responsive
window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.6;
}
