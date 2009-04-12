// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

function start3d() {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var box1 = Pre3d.ShapeUtils.makeBoxWithHole(1, 1, 1, 0.4, 0.4);
  var box2 = Pre3d.ShapeUtils.makeCube(1);

  var orange = new Pre3d.RGBA(0xff / 255, 0x78 / 255, 0, 1);
  var green = new Pre3d.RGBA(0x78 / 255, 0xff / 255, 0, 1);

  for (var i = 0; i < 3; ++i) {
    Pre3d.ShapeUtils.linearSubdivide(box1);
    Pre3d.ShapeUtils.averageSmooth(box1);
  }

  var state = {
    box1_rotate_y_rad: 0,
    box1_rotate_x_rad: 0,
    box1_rotate_z_rad: 0,
    box1_z: 0,

    box2_rotate_y_rad: 0,
    box2_rotate_x_rad: 0,
    box2_x: 2,
    box2_y: 0,
  };

  function draw() {
    renderer.transform.reset();
    renderer.transform.rotateZ(state.box1_rotate_z_rad);
    renderer.transform.rotateX(state.box1_rotate_x_rad);
    renderer.transform.rotateY(state.box1_rotate_y_rad);
    renderer.transform.translate(0, 0, state.box1_z);
    renderer.fill_rgba = orange;
    renderer.bufferShape(box1);

    renderer.transform.reset();
    renderer.transform.rotateX(state.box2_rotate_x_rad);
    renderer.transform.rotateY(state.box2_rotate_y_rad);
    renderer.transform.translate(state.box2_x, state.box2_y, -4);
    renderer.fill_rgba = green;
    renderer.bufferShape(box2);

    // White background.
    renderer.ctx.setFillColor(1, 1, 1, 1);
    renderer.drawBackground();

    renderer.drawBuffer();
    renderer.emptyBuffer();
  }

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -8, 0, 0, 0, draw);

  function spin_and_draw() {
    state.box1_rotate_y_rad += 0.1;
    state.box1_rotate_x_rad += 0.01;
    state.box1_rotate_z_rad += 0.03;
    state.box1_z = Math.sin(state.box1_rotate_y_rad / 2);

    state.box2_rotate_y_rad += 0.1;
    state.box2_rotate_x_rad += 0.01;
    state.box2_x = Math.sin(state.box2_rotate_y_rad / 2) * 3;
    state.box2_y = Math.sin(state.box2_rotate_x_rad * 4) * 3;
    draw();
  };

  var ticker = new DemoUtils.Ticker(30, spin_and_draw);

  var toolbar = new DemoUtils.ToggleToolbar();
  toolbar.addEntry('Go!', true, function(e) {
    if (this.checked) {
      ticker.start();
    } else {
      ticker.stop();
    }
  });
  toolbar.populateDiv(document.getElementById('toolbar'));

  ticker.start();
}

start3d();
