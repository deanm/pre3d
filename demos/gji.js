// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.
// Original concept / artwork by Ji Lee.
//   http://pleaseenjoy.com/project.php?cat=2&subcat=&pid=111&navpoint=6

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

  var circle_path = Pre3d.PathUtils.makeCircle();

  var circle_data = [
    {r: 75, x: 0, y: 58,
        c: new Pre3d.RGBA(27 / 255, 98 / 255, 183 / 255, 1), },
    {r: 46, x: 126, y: 0,
        c: new Pre3d.RGBA(237 / 255, 28 / 255, 36 / 255, 1), },
    {r: 46, x: 100, y: 0,
        c: new Pre3d.RGBA(254 / 255, 221 / 255, 3 / 255, 1), },
    {r: 46, x: 100, y: 0,
        c: new Pre3d.RGBA(27 / 255, 98 / 255, 183 / 255, 1), },
    {r: 46, x: 0, y: -98,
        c: new Pre3d.RGBA(27 / 255, 98 / 255, 183 / 255, 1), },
    {r: 46, x: 100, y: 0,
        c: new Pre3d.RGBA(0, 166 / 255, 80 / 255, 1), },
    {r: 46, x: 0, y: 98,
        c: new Pre3d.RGBA(0, 166 / 255, 80 / 255, 1), },
    {r: 46, x: 100, y: 0,
        c: new Pre3d.RGBA(237 / 255, 28 / 255, 36 / 255, 1), },
  ];

  var circles = [ ];
  for (var x = 0, i = 0, il = circle_data.length; i < il; ++i) {
    var kUnitFactor = 75;
    var d = circle_data[i];
    var r = d.r / kUnitFactor * 2;
    x += d.x;

    for (var z = 0; z > -5; z -= 0.5) {
      var t = new Pre3d.Transform();
      t.translate(-0.5, -0.5, 0);  // Center the circle over the origin.
      t.scale(r, r, 1);
      t.translate(x / kUnitFactor, d.y / kUnitFactor, 0);
      t.translate(-3, 0, z);

      circles.push({t: t, c: d.c});
    }
  }

  var fill = true;

  function draw() {
    // White background.
    renderer.ctx.setFillColor(1, 1, 1, 1);
    renderer.drawBackground();

    for (var i = 0, il = circles.length; i < il; ++i) {
      var c = circles[i];
      var cc = c.c;
      renderer.ctx.setFillColor(cc.r, cc.g, cc.b, 0.2);
      renderer.transform = c.t;
      renderer.drawPath(circle_path, {fill: fill});
    }
  }

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -20, 0, 0, 0, draw);

  var toolbar = new DemoUtils.ToggleToolbar();
  toolbar.addEntry('Debug points', false, function(e) {
    if (this.checked) {
      renderer.ctx.bezierCurveTo = debug_bezierCurveTo;
    } else {
      renderer.ctx.bezierCurveTo = orig_bezierCurveTo;
    }
    draw();
  });

  toolbar.addEntry("Stroke (don't fill)", false, function(e) {
    fill = !this.checked;
    draw();
  });

  toolbar.populateDiv(document.getElementById('toolbar'));

  draw();
}

start3d();
