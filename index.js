// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

window.addEventListener('load', function() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var cube = Pre3d.ShapeUtils.makeCube(0.5);
  renderer.draw_overdraw = false;
  renderer.fill_rgba = null;
  renderer.ctx.lineWidth = 1.5;
  renderer.stroke_rgba = new Pre3d.RGBA(1, 0.7, 0, 0.3);

  function setTransform(x, y) {
    var ct = renderer.camera.transform;
    ct.reset();
    ct.rotateZ(0.0);
    ct.rotateY(2.06 * x - 0.5);
    ct.rotateX(1.2 * y + 0.4);
    ct.translate(0, 0, -10);
  }

  renderer.camera.focal_length = 11;
  setTransform(0, 0);

  function draw() {
    renderer.clearBackground();
    renderer.bufferShape(cube);
    renderer.drawBuffer();
    renderer.emptyBuffer();
  }

  document.addEventListener('mousemove', function(e) {
    setTransform(e.clientX / 400, e.clientY / 400);
    draw();
  }, false);

  draw();
}, false);
