// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

// Inspired by http://www.unitzeroone.com/labs/alchemyPushingPixels/
// Also reading 'Strange Attractors: Creating Patterns in Chaos'.
// This attractor is Lorenz-84, with parameters from chaoscope.

window.addEventListener('load', function() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  renderer.ctx.lineWidth = 0.2;

  var x = 1;
  var y = 1;
  var z = 1;

  function step() {
    var dx = (-1.111 * x - y * y - z * z + 1.111 * 4.494) * 0.136;
    var dy = (-y + x * y - 1.479 * x * z + 0.44) * 0.136;
    var dz = (-z + 1.479 * x * y + x * z) * 0.136;

    x += dx;
    y += dy;
    z += dz;

    return {x: x, y: y, z: z};
  }

  var N = 7000;
  var path = new Pre3d.Path();
  path.points = new Array(N * 2 + 1);
  path.curves = new Array(N);

  // Warm up a bit so we don't get a cast from the origin into the attractor.
  for (var i = 0; i < 10; ++i)
    step();

  // Setup our initial point, |p0| will track our previous end point.
  var p0 = step();
  path.points[path.points.length - 1] = p0;
  path.starting_point = path.points.length - 1;

  for (var i = 0; i < N; ++i) {
    path.curves[i] = new Pre3d.Curve(i * 2, i * 2 + 1, null);  // Quadratic.

    var p1 = step();
    var p2 = step();
    path.points[i * 2 + 1] = Pre3d.PathUtils.fitQuadraticToPoints(p0, p1, p2);
    path.points[i * 2] = p2;
    p0 = p2;
  }

  var colormap = [
    {n: 'r', c: new Pre3d.RGBA(1, 0, 0, 1)},
    {n: 'g', c: new Pre3d.RGBA(0, 1, 0, 1)},
    {n: 'b', c: new Pre3d.RGBA(0, 0, 1, 1)},
    {n: 'a', c: new Pre3d.RGBA(0, 1, 1, 1)},
    {n: 'y', c: new Pre3d.RGBA(1, 1, 0, 1)},
    {n: 'w', c: new Pre3d.RGBA(1, 1, 1, 1)}
  ];

  var fgcolor = new Pre3d.RGBA(1, 0, 0, 1);

  function draw() {
    renderer.ctx.setFillColor(0, 0, 0, 1);
    renderer.drawBackground();

    renderer.ctx.setStrokeColor(fgcolor.r, fgcolor.g, fgcolor.b, fgcolor.a);
    renderer.drawPath(path);
  }

  var colordiv = document.createElement('div');
  colordiv.appendChild(document.createTextNode('color \u2192 '));
  for (var i = 0, il = colormap.length; i < il; ++i) {
    var cm = colormap[i];
    var a = document.createElement('a');
    a.href = '#';
    a.onclick = (function(c) {
      return function() {
        fgcolor = c.c
        draw();
        return false;
      }
    })(cm);
    a.appendChild(document.createTextNode(cm.n));
    colordiv.appendChild(a);
  }
  document.body.insertBefore(colordiv, document.body.firstChild);

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -15, 0, -1.7, 0, draw);

  draw();
}, false);
