// (c) Dean McNamee <dean@gmail.com>.  All rights reserved.

// Approximation of a trefoil knot.  Based on ideas from:
//   http://www.jcu.edu/math/ictcm99/animations/knot.htm
//   http://virtualmathmuseum.org/SpaceCurves/
// I then butchered the math a bit, so don't trust it.
function trefoilFunc(t) {
  var t2 = t+t;
  var t3 = t2+t;
  return 41*Math.cos(t) - 18*Math.sin(t) -
         83*Math.cos(t2) - 83*Math.sin(t2) -
         11*Math.cos(t3) + 27*Math.sin(t3);
}

function trefoilPoint(t) {
  var kScale = 0.01;
  var x = trefoilFunc(t);
  var y = trefoilFunc(6.283185 - t);
  var z = trefoilFunc(t - 1.828453);
  return {x: kScale * x, y: kScale * y, z: kScale * z};
}

function start3d() {
  var subPoints3d = Pre3d.Math.subPoints3d;
  var mulPoint3d = Pre3d.Math.mulPoint3d;
  var unitVector3d = Pre3d.Math.unitVector3d;
  var crossProduct = Pre3d.Math.crossProduct;
  var dotProduct2d = Pre3d.Math.dotProduct2d;

  var screen_canvas = document.getElementById('canvas');
  var renderer = new Pre3d.Renderer(screen_canvas);

  // Hook into the canvas for draw debugging.
  //   - quadratic cubic curve
  //     - red: control point 0
  //     - green: control point 1
  //     - blue: end point
  var orig_quadraticCurveTo = renderer.ctx.quadraticCurveTo;
  function debug_quadraticCurveTo(c0x, c0y, epx, epy) {
    this.save();
    this.setFillColor(1, 0, 0, 1);
    this.fillRect(c0x, c0y, 3, 3);
    this.setFillColor(0, 0, 1, 1);
    this.fillRect(epx, epy, 3, 3);
    this.restore();
    orig_quadraticCurveTo.call(this, c0x, c0y, epx, epy);
  }
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

  var path = null;
  var points = [ ];
  var curves = [ ];

  var kPathDistance = 0.05;
  var kKappa = kPathDistance * 2 * 0.66666666666;  // Circle via 2 cubics.

  var next_cp = null;
  for (var t = 0, flip = false; t < 6.28; t += 0.01, flip = !flip) {
    // We work with 3 points in time, t0, a tiny bit before t,
    // t, and t1, a tiny bit after t.  This will lead to two vectors
    // defining a plane, v0 (t0 - t), and v1 (t - t1).  This won't work
    // if v0 == v1 (the line is straight).
    var t0 = t - 0.00001;
    var t1 = t + 0.00001;

    var p = trefoilPoint(t);
    var v0 = subPoints3d(p, trefoilPoint(t0));
    var v1 = subPoints3d(trefoilPoint(t1), p);
    var out = crossProduct(v1, v0);
    var up = crossProduct(v1, out);

    // The new local coordinate system.
    var x_axis = unitVector3d(v1);
    var y_axis = unitVector3d(out);
    var z_axis = unitVector3d(up);

    // We're drawing a half circle at a time, with |flip| alternating sides.
    var tm = new Pre3d.Transform();
    tm.setDCM(x_axis, y_axis, z_axis);
    tm.rotateXPre(flip ? 3.14159265 : 0);
    tm.translate(p.x, p.y, p.z);

    var p0 = tm.transformPoint({x: 0, y: -kPathDistance, z: -kKappa});
    var p1 = tm.transformPoint({x: 0, y: -kPathDistance, z: 0});
    var p2 = tm.transformPoint({x: 0, y: -kPathDistance, z: kKappa});

    if (next_cp === null) {
      points.push(p1);
    } else {
      var c = points.length;
      points.push(next_cp);
      points.push(p0);
      points.push(p1);
      curves.push(new Pre3d.Curve(c + 2, c, c + 1));
    }
    next_cp = p2;
  }

  var path = new Pre3d.Path();
  path.starting_point = 0;
  path.points = points;
  path.curves = curves;

  renderer.ctx.setStrokeColor(0x52 / 255, 0xbb / 255, 0x5c / 255, 1);
  renderer.ctx.lineWidth = 1;

  function draw() {
    // White background.
    renderer.ctx.setFillColor(1, 1, 1, 1);
    renderer.drawBackground();
    renderer.drawPath(path);
  }

  renderer.camera.focal_length = 2.5;
  DemoUtils.autoCamera(renderer, 0, 0, -8, 0, 0, 0, draw);

  var toolbar = new DemoUtils.ToggleToolbar();
  toolbar.addEntry('Debug points', false, function(e) {
    if (this.checked) {
      renderer.ctx.quadraticCurveTo = debug_quadraticCurveTo;
      renderer.ctx.bezierCurveTo = debug_bezierCurveTo;
    } else {
      renderer.ctx.quadraticCurveTo = orig_quadraticCurveTo;
      renderer.ctx.bezierCurveTo = orig_bezierCurveTo;
    }
    draw();
  });
  toolbar.populateDiv(document.getElementById('toolbar'));

  draw();
}

start3d();
