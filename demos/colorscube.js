// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

window.addEventListener('load', function() {
  var black = new Pre3d.RGBA(0, 0, 0, 1);
  var white = new Pre3d.RGBA(1, 1, 1, 1);

  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var cubes = [ ];

  for (var i = 0; i < 10; ++i) {
    for (var j = 0; j < 10; ++j) {
      for (var k = 0; k < 10; ++k) {
        if (i == 0 || j == 0 || k == 0 ||
            i == 9 || j == 9 || k == 9) {
          var cube = Pre3d.ShapeUtils.makeCube(0.5);
          var transform = new Pre3d.Transform();
          transform.translate(i - 5, j - 5, k - 5);
          cubes.push({
            shape: cube,
            color: new Pre3d.RGBA(i / 10, j / 10, k / 10, 0.3),
            trans: transform});
        }
      }
    }
  }

  var num_cubes = cubes.length;
  var cur_white = false;  // Default to black background.

  function draw() {
    for (var i = 0; i < num_cubes; ++i) {
      var cube = cubes[i];
      renderer.fill_rgba = cube.color;
      renderer.transform = cube.trans;
      renderer.bufferShape(cube.shape);
    }

    if (cur_white) {
      renderer.ctx.setFillColor(1, 1, 1, 1);
    } else {
      renderer.ctx.setFillColor(0, 0, 0, 1);
    }
    renderer.drawBackground();

    renderer.drawBuffer();
    renderer.emptyBuffer();
  }

  renderer.camera.focal_length = 2.5;
  // Have the engine handle mouse / camera movement for us.
  DemoUtils.autoCamera(renderer, 0, 0, -30, 0.40, -1.06, 0, draw);

  document.addEventListener('keydown', function(e) {
    if (e.keyCode != 84)  // t
      return;

    if (cur_white) {
      document.body.className = "black";
    } else {
      document.body.className = "white";
    }
    cur_white = !cur_white;
    draw();
  }, false);

  draw();
}, false);
