// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

function start3d() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var circle = Pre3d.PathUtils.makeCircle();

  renderer.ctx.setStrokeColor(0x52 / 255, 0xbb / 255, 0x5c / 255, 1);
  renderer.ctx.lineWidth = 2;

  function draw() {
    // White background.
    renderer.ctx.setFillColor(1, 1, 1, 1);
    renderer.drawBackground();

    renderer.transform.reset();
    renderer.transform.translate(-0.5, 0, 0);  // Center over the origin.

    var side_line = Pre3d.PathUtils.makeLine({x: 0, y: 0, z: -0.5},
                                             {x: 0, y: 0, z: -5});
    renderer.pushTransform();
    for (var i = 0, il = 8; i < il; ++i) {
      renderer.transform.rotateZ(1/il * Math.PI * 2);
      renderer.drawPath(side_line);
    }
    renderer.popTransform();

    for (var i = 0; i < 10; ++i) {
      renderer.transform.translate(0, 0, -0.5);
      renderer.drawPath(circle);
    }
  }

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -8, 0, 0, 0, draw);
  draw();
}

start3d();
