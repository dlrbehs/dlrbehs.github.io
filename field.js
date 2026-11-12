(() => {
  const canvas = document.getElementById('baseball');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const angle = document.getElementById('rotation');
  const rotationValue = document.getElementById('rotation-value');
  const points = [];
  const count = 28000;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * i + 1) / count;
    const radius = Math.sqrt(1 - y * y);
    const t = goldenAngle * i;
    points.push([radius * Math.cos(t), y, radius * Math.sin(t)]);
  }
  function draw() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    const scale = Math.min(width / 540, height / 425);
    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, width * dpr / 2, height * dpr / 2);
    const yaw = Number(angle.value) * Math.PI / 180;
    const cos = Math.cos(yaw), sin = Math.sin(yaw);
    const roll = -0.33, cr = Math.cos(roll), sr = Math.sin(roll);
    const radius = 146;
    function project(x, y, z) {
      const xx = x * cos - z * sin;
      const zz = x * sin + z * cos;
      const yy = y * 0.97 + zz * 0.243;
      return [(xx * cr - yy * sr) * radius, (xx * sr + yy * cr) * radius, zz * 0.97 - y * 0.243];
    }
    ctx.lineWidth = 0.7;
    ctx.setLineDash([2, 6]);
    ctx.strokeStyle = '#64616e';
    ctx.beginPath();ctx.arc(0, 0, radius + 18, 0, 2 * Math.PI);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-235, 0);ctx.lineTo(235, 0);ctx.moveTo(0, -190);ctx.lineTo(0, 190);ctx.stroke();
    ctx.setLineDash([]);
    for (let i = 0; i < 60; i++) {
      const t = (i / 60) * 2 * Math.PI;
      const r = radius + 28;
      const end = r + (i % 5 === 0 ? 7 : 2);
      ctx.strokeStyle = i % 5 === 0 ? '#817d8b' : '#46444d';
      ctx.beginPath();ctx.moveTo(Math.cos(t)*r, Math.sin(t)*r);
      ctx.lineTo(Math.cos(t)*end, Math.sin(t)*end);ctx.stroke();
    }
    ctx.fillStyle = '#17171f';
    ctx.beginPath();ctx.arc(0, 0, radius, 0, 2*Math.PI);ctx.fill();
    const tones = Array.from({length: 55}, (_, n) =>
      'rgb(' + Math.round(52 + n*3.68) + ',' + Math.round(49 + n*3.5) + ',' + Math.round(83 + n*3.17) + ')');
    for (const p of points) {
      const [x,y,z] = project(...p);
      if (z < 0) continue;
      const light = Math.max(0, Math.min(1, (0.67*z - 0.47*x/radius - 0.67*y/radius + 0.23)));
      ctx.fillStyle = tones[Math.round(54 * light)];
      const size = 1.35 + light * 0.78;
      ctx.fillRect(x, y, size, size);
    }
    // One continuous spherical seam, with individual stitches across its path.
    function seam(t) {
      return project(0.75*Math.cos(t)+0.25*Math.cos(3*t),
        0.75*Math.sin(t)-0.25*Math.sin(3*t), Math.sqrt(0.75)*Math.sin(2*t));
    }
    ctx.strokeStyle = '#554f6a';ctx.lineWidth = 3;ctx.beginPath();
    let previousVisible = false;
    for (let i = 0; i <= 720; i++) {
      const [x,y,z] = seam(i * Math.PI / 360);
      if (z >= 0 && previousVisible) ctx.lineTo(x,y);
      else ctx.moveTo(x,y);
      previousVisible = z >= 0;
    }
    ctx.stroke();
    ctx.lineCap = 'round';
    for (let i = 0; i < 148; i++) {
      const t = i * Math.PI / 74;
      const [x,y,z] = seam(t);
      if (z < 0.02) continue;
      const [xx,yy] = seam(t + 0.003);
      const length = Math.hypot(xx-x, yy-y) || 1;
      const dx = (xx-x)/length, dy = (yy-y)/length;
      const span = (0.45 + 0.55*z) * 6.4;
      ctx.strokeStyle = '#e5b29e';ctx.lineWidth = 2.0;
      ctx.beginPath();ctx.moveTo(x-dy*span-dx*1.5,y+dx*span-dy*1.5);
      ctx.lineTo(x+dx*1.2,y+dy*1.2);ctx.lineTo(x+dy*span-dx*1.5,y-dx*span-dy*1.5);ctx.stroke();
    }
    rotationValue.textContent = angle.value + '°';
  }
  let frame;
  function queueDraw() { cancelAnimationFrame(frame); frame = requestAnimationFrame(draw); }
  angle.addEventListener('input', queueDraw);
  if ('ResizeObserver' in window) new ResizeObserver(queueDraw).observe(canvas);
  else window.addEventListener('resize', queueDraw);
  draw();
})();
