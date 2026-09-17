(function() {
  'use strict';

  var canvas = document.getElementById('stars');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var W, H;
  var stars = [];
  var shootingStars = [];
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    initStars();
  }

  function initStars() {
    var count = Math.floor((W * H) / 7500);
    count = Math.max(90, Math.min(220, count));
    stars = [];
    for (var i = 0; i < count; i++) {
      var depth = Math.random() * 0.7 + 0.3;
      var tint = Math.random();
      stars.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: depth * 1.6 + 0.4,
        baseAlpha: Math.random() * 0.55 + 0.3,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 0.015 + 0.006,
        depth: depth,
        tint: tint,
        driftX: (Math.random() - 0.5) * 0.08,
        driftY: (Math.random() - 0.5) * 0.05
      });
    }
  }

  function maybeSpawnShootingStar() {
    if (reduceMotion) return;
    if (Math.random() < 0.007 && shootingStars.length < 2) {
      var startX = Math.random() * W * 0.65 + W * 0.05;
      var startY = Math.random() * H * 0.3;
      shootingStars.push({
        x: startX,
        y: startY,
        vx: 6.5 + Math.random() * 4,
        vy: 3.2 + Math.random() * 2.2,
        life: 0,
        maxLife: 55 + Math.random() * 20
      });
    }
  }

  var t = 0;

  function draw() {
    t += 1;
    ctx.clearRect(0, 0, W, H);

    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];

      // Gentle continuous cosmic drift
      if (!reduceMotion) {
        s.x += s.driftX;
        s.y += s.driftY;
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H;
        if (s.y > H) s.y = 0;
      }

      var tw = reduceMotion ? s.baseAlpha : s.baseAlpha + Math.sin(t * s.speed + s.phase) * 0.28;
      var alpha = Math.max(0.1, Math.min(1, tw));

      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      var c = s.tint > 0.72 ? '210,228,255' : '255,255,255';
      ctx.fillStyle = 'rgba(' + c + ',' + alpha + ')';
      ctx.fill();
    }

    // Occasional shooting stars streaking across the sky
    maybeSpawnShootingStar();
    for (var j = shootingStars.length - 1; j >= 0; j--) {
      var sh = shootingStars[j];
      sh.x += sh.vx;
      sh.y += sh.vy;
      sh.life++;
      var a2 = 1 - sh.life / sh.maxLife;
      if (a2 <= 0) {
        shootingStars.splice(j, 1);
        continue;
      }
      var grad = ctx.createLinearGradient(sh.x, sh.y, sh.x - sh.vx * 8, sh.y - sh.vy * 8);
      grad.addColorStop(0, 'rgba(255,244,214,' + a2 + ')');
      grad.addColorStop(1, 'rgba(255,244,214,0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.lineTo(sh.x - sh.vx * 8, sh.y - sh.vy * 8);
      ctx.stroke();
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
})();
