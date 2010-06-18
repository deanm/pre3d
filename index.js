// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

window.addEventListener('load', function() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var shape = Pre3d.ShapeUtils.makeOctahedron();
  Pre3d.ShapeUtils.linearSubdivideTri(shape);
  Pre3d.ShapeUtils.forEachVertex(shape, function(v, i, s) {
    s.vertices[i] = Pre3d.Math.unitVector3d(v);  // TODO(deanm): inplace.
  });
  // We need to rebuild the normals after extruding the vertices.
  Pre3d.ShapeUtils.rebuildMeta(shape);
  renderer.draw_overdraw = false;
  renderer.fill_rgba = null;
  renderer.ctx.lineWidth = 0.9;
  renderer.stroke_rgba = new Pre3d.RGBA(0x45/255, 0xb4/255, 0xef/255, 0.4);

  function setTransform(x, y) {
    var ct = renderer.camera.transform;
    ct.reset();
    ct.rotateZ(0.0);
    ct.rotateY(-2.06 * x - 0.5);
    ct.rotateX(2.2 * y + 1.5);
    ct.translate(0, 0, -12);
  }

  renderer.camera.focal_length = 11;
  setTransform(0, 0);

  function draw() {
    renderer.clearBackground();
    renderer.bufferShape(shape);
    renderer.drawBuffer();
    renderer.emptyBuffer();
  }

  document.addEventListener('mousemove', function(e) {
    setTransform(e.clientX / 400, e.clientY / 400);
    draw();
  }, false);

  draw();
}, false);
