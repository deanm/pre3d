// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

function start3d() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  // Hook into the canvas for draw debugging.
  //   - bezier cubic curve
  //     - red: control point 0
  //     - green: control point 1
  //     - blue: end point
  var orig_bezierCurveTo = renderer.ctx.bezierCurveTo;
  function debug_bezierCurveTo(c0x, c0y, c1x, c1y, epx, epy) {
    this.save();
    this.setFillColor(1, 0, 0, 1);
    this.fillRect(c0x, c0y, 3, 3);
    this.setFillColor(0, 1, 0, 1);
    this.fillRect(c1x, c1y, 3, 3);
    this.setFillColor(0, 0, 1, 1);
    this.fillRect(epx, epy, 3, 3);
    this.restore();
    orig_bezierCurveTo.call(this, c0x, c0y, c1x, c1y, epx, epy);
  }

  var spiral = Pre3d.PathUtils.makeSpiral(10);

  // Setup the canvas context for stroking the spiral blue and double thick.
  renderer.ctx.setStrokeColor(0x52 / 255, 0xbb / 255, 0x5c / 255, 1);
  renderer.ctx.lineWidth = 2;

  function draw() {
    renderer.transform.reset();
    renderer.transform.translate(-0.5, 0, 0.5);  // Center over the origin.
    // Elongate our spiral a bit (stretch in the z direction).
    renderer.transform.scale(1, 1, 2);

    // White background.
    renderer.ctx.setFillColor(1, 1, 1, 1);
    renderer.drawBackground();

    renderer.drawPath(spiral);
  }

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -8, 0, 0, 0, draw);

  var toolbar = new DemoUtils.ToggleToolbar();
  toolbar.addEntry('Debug points', false, function(e) {
    if (this.checked) {
      renderer.ctx.bezierCurveTo = debug_bezierCurveTo;
    } else {
      renderer.ctx.bezierCurveTo = orig_bezierCurveTo;
    }
    draw();
  });
  toolbar.populateDiv(document.getElementById('toolbar'));

  draw();
}

start3d();
