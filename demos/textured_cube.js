// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

function start3d(texture_image) {
  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  var cube = Pre3d.ShapeUtils.makeCube(1);
  // Avoid anti-aliasing cracks along quad faces.  We convert to triangles so
  // that overdraw with overlap the textures along the edges.
  Pre3d.ShapeUtils.triangulate(cube);

  var w = texture_image.width;
  var h = texture_image.height;

  var texinfo1 = new Pre3d.TextureInfo();
  texinfo1.image = texture_image;
  texinfo1.u0 = 0;
  texinfo1.v0 = 0;
  texinfo1.u1 = 0;
  texinfo1.v1 = h;
  texinfo1.u2 = w;
  texinfo1.v2 = h;

  var texinfo2 = new Pre3d.TextureInfo();
  texinfo2.image = texture_image;
  texinfo2.u0 = 0;
  texinfo2.v0 = 0;
  texinfo2.u1 = w;
  texinfo2.v1 = h;
  texinfo2.u2 = w;
  texinfo2.v2 = 0;

  function selectTexture(quad_face, quad_index, shape) {
    // Each face is two triangles, the newly triangulated triangles last.
    renderer.texture = quad_index < 6 ? texinfo1 : texinfo2;
    return false;
  }

  renderer.quad_callback = selectTexture;

  // We don't want to fill, it will show at the edges (and waste cpu).
  renderer.fill_rgba = null;

  var state = {
    cube_rotate_y_rad: 0,
    cube_rotate_x_rad: 0,
    cube_x: 2,
    cube_y: 0
  };

  function draw() {
    renderer.transform.reset();
    renderer.transform.rotateX(state.cube_rotate_x_rad);
    renderer.transform.rotateY(state.cube_rotate_y_rad);
    renderer.transform.translate(state.cube_x, state.cube_y, -4);
    renderer.bufferShape(cube);

    // White background.
    renderer.ctx.setFillColor(1, 1, 1, 1);
    renderer.drawBackground();

    renderer.drawBuffer();
    renderer.emptyBuffer();
  }

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -8, 0, 0, 0, draw);

  function spin_and_draw() {
    state.cube_rotate_y_rad += 0.1;
    state.cube_rotate_x_rad += 0.01;
    state.cube_x = Math.sin(state.cube_rotate_y_rad / 2) * 3;
    state.cube_y = Math.sin(state.cube_rotate_x_rad * 4) * 3;
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

var img = new Image();
img.onload = function() { start3d(img); };
img.src = 'textured_cube_texture.jpg';
