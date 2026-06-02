/* ============================================================
   MoonRenderer — wraps a real moon PHOTO on a lit sphere.
   - The photo is sampled as surface albedo (orthographic full-disc map).
   - Each frame applies Lambert lighting from a moving sun direction so the
     terminator shadow sweeps across the real photo (the "dark side" reveal),
     with limb darkening, an ambient floor, and an anti-aliased circular rim.
   Vanilla JS so the per-pixel loop stays fast.
   ============================================================ */
(function () {
  "use strict";

  function smoothstep(a, b, x) {
    var t = (x - a) / (b - a);
    if (t < 0) t = 0; else if (t > 1) t = 1;
    return t * t * (3 - 2 * t);
  }
  function hexToRgb(hex) {
    hex = (hex || "#5ab9e0").replace("#", "");
    if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
    return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
  }

  function MoonRenderer(canvas, imageUrl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.off = document.createElement("canvas");
    this.offctx = this.off.getContext("2d");
    this.params = { motion: "breathe", speed: 50, glow: "#5ab9e0", phase: 20, soft: 35 };
    this.t0 = performance.now();
    this.phi = 0;
    this.running = true;
    this.ready = false;
    this.texReady = false;
    this._loop = this._loop.bind(this);

    this.img = new Image();
    var self = this;
    this.img.onload = function () {
      self._buildTexture();
      self.resize();
      self.ready = true;
    };
    this.img.src = imageUrl;

    this.raf = requestAnimationFrame(this._loop);
    window.__moon = this;
  }

  MoonRenderer.prototype.setParams = function (p) {
    var prevSoft = this.params.soft;
    Object.assign(this.params, p);
    if (this.texReady && p.soft !== undefined && p.soft !== prevSoft) {
      this._buildTexture();
      if (this.W) this._precompute();
    }
  };

  // Downscale the photo into a sample buffer and find the lunar disc bounds.
  MoonRenderer.prototype._buildTexture = function () {
    var T = 560;
    var tc = document.createElement("canvas");
    tc.width = T; tc.height = T;
    var tx = tc.getContext("2d");
    var soft = (this.params.soft != null ? this.params.soft : 35) / 100;
    // soften: blur surface detail, ease contrast, calm the green cast
    var blurPx = (soft * 5).toFixed(2);
    tx.filter = "blur(" + blurPx + "px) saturate(" + (1 - soft * 0.5).toFixed(2) +
                ") contrast(" + (1 - soft * 0.20).toFixed(2) +
                ") brightness(" + (1 + soft * 0.07).toFixed(2) + ")";
    tx.drawImage(this.img, 0, 0, T, T);
    tx.filter = "none";
    this.texData = tx.getImageData(0, 0, T, T).data;
    this.texSize = T;

    var d = this.texData, thr = 24;
    function lum(x, y) { var i = (y * T + x) << 2; return (d[i] + d[i+1] + d[i+2]) / 3; }
    var cyc = T >> 1, cxc = T >> 1;
    var x0 = 0; while (x0 < T - 1 && lum(x0, cyc) < thr) x0++;
    var x1 = T - 1; while (x1 > 0 && lum(x1, cyc) < thr) x1--;
    var y0 = 0; while (y0 < T - 1 && lum(cxc, y0) < thr) y0++;
    var y1 = T - 1; while (y1 > 0 && lum(cxc, y1) < thr) y1--;
    this.discCx = (x0 + x1) / 2;
    this.discCy = (y0 + y1) / 2;
    this.discR = ((x1 - x0) + (y1 - y0)) / 4;
    if (!(this.discR > 10)) { this.discCx = T/2; this.discCy = T/2; this.discR = T/2 - 2; }
    this.texReady = true;
  };

  MoonRenderer.prototype.resize = function () {
    if (!this.texReady) return;
    var rect = this.canvas.getBoundingClientRect();
    var cssW = Math.max(120, rect.width || this.canvas.clientWidth || 420);
    var cssH = Math.max(120, rect.height || this.canvas.clientHeight || 420);
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    this.W = Math.round(cssW * dpr);
    this.H = Math.round(cssH * dpr);
    this.canvas.width = this.W; this.canvas.height = this.H;
    this.off.width = this.W; this.off.height = this.H;
    this.cx = this.W / 2; this.cy = this.H / 2;
    this.R = Math.min(this.W, this.H) * 0.345;
    this._precompute();
  };

  // Per screen pixel: sphere normal + sampled photo color + AA edge alpha.
  MoonRenderer.prototype._precompute = function () {
    var W = this.W, H = this.H, R = this.R, cx = this.cx, cy = this.cy;
    var N = W * H;
    var nx = new Float32Array(N), ny = new Float32Array(N), nz = new Float32Array(N);
    var tr = new Uint8ClampedArray(N), tg = new Uint8ClampedArray(N), tb = new Uint8ClampedArray(N);
    var al = new Uint8ClampedArray(N);
    var td = this.texData, T = this.texSize, dcx = this.discCx, dcy = this.discCy, dR = this.discR;
    var Rout = R + 0.75;
    for (var y = 0; y < H; y++) {
      for (var x = 0; x < W; x++) {
        var i = y * W + x;
        var dx = (x - cx), dy = (y - cy);
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > Rout) continue;
        var ix = dx / R, iy = dy / R;
        var rr = ix * ix + iy * iy;
        if (rr > 1) rr = 1;
        var iz = Math.sqrt(1 - rr);
        nx[i] = ix; ny[i] = iy; nz[i] = iz;
        // sample the photo (orthographic: screen offset maps straight to disc)
        var sx = (dcx + ix * dR) | 0, sy = (dcy + iy * dR) | 0;
        if (sx < 0) sx = 0; else if (sx >= T) sx = T - 1;
        if (sy < 0) sy = 0; else if (sy >= T) sy = T - 1;
        var ti = (sy * T + sx) << 2;
        tr[i] = td[ti]; tg[i] = td[ti+1]; tb[i] = td[ti+2];
        // anti-aliased rim alpha
        var edge = R - dist;
        if (dist <= R) al[i] = 255;
        else al[i] = Math.max(0, (Rout - dist) / 0.75) * 255;
      }
    }
    this.nx = nx; this.ny = ny; this.nz = nz;
    this.tr = tr; this.tg = tg; this.tb = tb; this.al = al;
    this.img2 = this.offctx.createImageData(W, H);
  };

  MoonRenderer.prototype._loop = function (now) {
    if (!this.running) return;
    if (this.ready) this.render(now);
    this.raf = requestAnimationFrame(this._loop);
  };

  MoonRenderer.prototype.render = function (now) {
    var p = this.params, dt = (now - this.t0) / 1000;
    var spd = (p.speed / 50);
    if (p.motion === "still") {
      this.phi = (p.phase / 100) * Math.PI * 2;
    } else if (p.motion === "breathe") {
      var center = (p.phase / 100) * Math.PI * 2;
      this.phi = center + Math.sin(dt * 0.42 * spd) * 0.7;
    } else { // reveal: full phase cycle
      this.phi = dt * 0.30 * spd;
    }
    var ele = -0.14, cosE = Math.cos(ele);
    var Lx = Math.cos(this.phi) * cosE, Ly = Math.sin(ele), Lz = Math.sin(this.phi) * cosE;

    var glow = hexToRgb(p.glow);
    var W = this.W, H = this.H, nx = this.nx, ny = this.ny, nz = this.nz,
        tr = this.tr, tg = this.tg, tb = this.tb, al = this.al, data = this.img2.data;
    var er = glow[0] * 0.045, eg = glow[1] * 0.05, eb = glow[2] * 0.06;
    var ambient = 0.12, gain = 1.12;
    var N = W * H;
    for (var i = 0; i < N; i++) {
      var a = al[i];
      var o = i << 2;
      if (a === 0) { data[o+3] = 0; continue; }
      var d = nx[i]*Lx + ny[i]*Ly + nz[i]*Lz;
      var lit = smoothstep(-0.18, 0.34, d);
      var shade = ambient + (1 - ambient) * lit;
      var limb = 0.68 + 0.32 * nz[i];     // limb darkening
      var br = shade * limb * gain;
      var dk = 1 - lit;
      var r = tr[i] * br + er * dk;
      var g = tg[i] * br + eg * dk;
      var b = tb[i] * br + eb * dk;
      data[o]   = r > 255 ? 255 : r;
      data[o+1] = g > 255 ? 255 : g;
      data[o+2] = b > 255 ? 255 : b;
      data[o+3] = a;
    }
    this.offctx.putImageData(this.img2, 0, 0);

    var ctx = this.ctx;
    ctx.clearRect(0, 0, W, H);
    ctx.drawImage(this.off, 0, 0);

    var litFrac = smoothstep(-0.5, 0.95, Math.sin(this.phi));
    var host = this.canvas.parentNode;
    if (host) host.style.setProperty("--glow-strength", (0.30 + 0.70 * litFrac).toFixed(3));
  };

  MoonRenderer.prototype.destroy = function () {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
  };

  window.MoonRenderer = MoonRenderer;
})();
