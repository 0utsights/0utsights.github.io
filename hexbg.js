const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

const SQ = Math.sqrt(3);

// ====== tweakables ======
let s = 30;                 // hex "size" (outer radius)
const P = 40;               // repeat period in hexes (bigger = less obvious loop)
let vx = 90;                // pixels/sec
let vy = 60;                // pixels/sec

// camera in fractional axial coords
let camQ = 0.0;
let camR = 0.0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(window.innerWidth * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  canvas.style.width = window.innerWidth + "px";
  canvas.style.height = window.innerHeight + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // draw in CSS pixels
}
window.addEventListener("resize", resize);
resize();

// axial -> pixel (pointy-top)
function a2p(q, r) {
  return {
    x: SQ * s * (q + r / 2),
    y: 1.5 * s * r,
  };
}

// draw a single hex outline at (cx, cy)
function drawHex(cx, cy) {
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30); // pointy-top
    const x = cx + s * Math.cos(a);
    const y = cy + s * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); // seconds, clamp
  last = now;

  const W = window.innerWidth;
  const H = window.innerHeight;

  // pixel velocity -> axial delta (inverse transform)
  const dQ = ((SQ / 3) * vx - (1 / 3) * vy) / s * dt;
  const dR = ((2 / 3) * vy) / s * dt;

  camQ = (camQ + dQ) % P;
  camR = (camR + dR) % P;
  if (camQ < 0) camQ += P;
  if (camR < 0) camR += P;

  // screen-sized window (+margin)
  const Q = Math.floor(W / (SQ * s)) + 3;
  const R = Math.floor(H / (1.5 * s)) + 3;

  // clear
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(120, 200, 255, 0.9)";

  const cq = Math.floor(camQ);
  const cr = Math.floor(camR);

  // draw around camera cell
  for (let q = cq - Q; q <= cq + Q; q++) {
    for (let r = cr - R; r <= cr + R; r++) {
      const rel = a2p(q - camQ, r - camR);
      const x = rel.x + W / 2;
      const y = rel.y + H / 2;

      // quick cull
      if (x < -2 * s || x > W + 2 * s || y < -2 * s || y > H + 2 * s) continue;

      drawHex(x, y);
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
