// hexgrid — based on https://www.redblobgames.com/grids/hexagons/

const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

const SQ = Math.sqrt(3);

// config
let s = 35;       // hex outer radius
const P = 30;     // axial repeat period
let vx = -25;     // px/sec
let vy = -10;     // px/sec

// camera in fractional axial coords
let camQ = 0.0;
let camR = 0.0;

// precomputed unit hex corner offsets (flat-top orientation, 60° steps starting at -30°)
// recomputed whenever s changes via precomputeHex()
let HEX_COS = [];
let HEX_SIN = [];

function precomputeHex() {
  HEX_COS = [];
  HEX_SIN = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - 30);
    HEX_COS.push(s * Math.cos(a));
    HEX_SIN.push(s * Math.sin(a));
  }
}
precomputeHex();

// cached viewport dimensions — updated on resize, read from cache in frame loop
let W = 0;
let H = 0;
// visible hex range — only changes on resize, not every frame
let visQ = 0;
let visR = 0;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = Math.floor(W * dpr);
  canvas.height = Math.floor(H * dpr);
  canvas.style.width = W + "px";
  canvas.style.height = H + "px";
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  visQ = Math.floor(W / (SQ * s)) + 3;
  visR = Math.floor(H / (1.5 * s)) + 3;
}
window.addEventListener("resize", resize);
resize();

// axial -> pixel
function a2p(q, r) {
  return {
    x: SQ * s * (q + r / 2),
    y: 1.5 * s * r,
  };
}

// draw a single hex outline using precomputed offsets
function drawHex(cx, cy) {
  ctx.beginPath();
  ctx.moveTo(cx + HEX_COS[0], cy + HEX_SIN[0]);
  for (let i = 1; i < 6; i++) {
    ctx.lineTo(cx + HEX_COS[i], cy + HEX_SIN[i]);
  }
  ctx.closePath();
  ctx.stroke();
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // pixel velocity -> axial delta (inverse of a2p transform)
  const dQ = ((SQ / 3) * vx - (1 / 3) * vy) / s * dt;
  const dR = ((2 / 3) * vy) / s * dt;

  camQ = (camQ + dQ) % P;
  camR = (camR + dR) % P;
  if (camQ < 0) camQ += P;
  if (camR < 0) camR += P;

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = "rgba(51, 51, 51, 0.9)";

  const cq = Math.floor(camQ);
  const cr = Math.floor(camR);
  const halfW = W / 2;
  const halfH = H / 2;
  const pad = 2 * s;

  for (let q = cq - visQ; q <= cq + visQ; q++) {
    for (let r = cr - visR; r <= cr + visR; r++) {
      const rel = a2p(q - camQ, r - camR);
      const x = rel.x + halfW;
      const y = rel.y + halfH;

      if (x < -pad || x > W + pad || y < -pad || y > H + pad) continue;

      drawHex(x, y);
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
