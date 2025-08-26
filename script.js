const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("overlay");
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
    overlay.appendChild(audio);
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

        ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const barHeight = dataArray[i];
            ctx.fillStyle = `rgb(50,${barHeight + 100},130)`;
            ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 3;

        dataArray.forEach((value, i) => {
            if (value > 50) {
                const bassBoost = i < bufferLength / 4 ? 2 : 1;
                const angle = Math.random() * Math.PI * 2;
                const speed = (value / 45) * bassBoost;

                // alpha depends on volume and frequency
                const freqFactor = i / bufferLength;
                const initialAlpha = Math.min(1, (value / 200) * freqFactor + 0.2);

                // base hue
                const baseHue = 140;
                const hueOffset = (i / bufferLength) * 40 - 20;
                const color = `hsl(${baseHue + hueOffset}, 80%, 50%)`;

                const p = new Particle(
                    centerX,
                    centerY,
                    Math.random() * (bassBoost * 1.5) + 2,
                    color,
                    { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed }
                );

                p.alpha = initialAlpha;
                particles.push(p);
            }
        });


        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.update();
            p.draw(ctx);
            if (p.alpha <= 0) particles.splice(i, 1);
        }
    }


    draw();
});

window.addEventListener("resize", resizeCanvas);

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}
