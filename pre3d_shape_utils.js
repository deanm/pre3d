// Pre3d, a JavaScript software 3d renderer.
// (c) Dean McNamee <dean@gmail.com>, Dec 2008.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
// FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
// IN THE SOFTWARE.
//
// This file implements helpers related to creating / modifying Shapes.  Some
// routines exist for basic primitives (box, sphere, etc), along with some
// routines for procedural shape operations (extrude, subdivide, etc).
//
// The procedural operations were inspired from the demoscene.  A lot of the
// ideas are based on similar concepts in Farbrausch's werkkzeug1.

Pre3d.ShapeUtils = (function() {

  // TODO(deanm): Having to import all the math like this is a bummer.
  var crossProduct = Pre3d.Math.crossProduct;
  var dotProduct2d = Pre3d.Math.dotProduct2d;
  var dotProduct3d = Pre3d.Math.dotProduct3d;
  var subPoints2d = Pre3d.Math.subPoints2d;
  var subPoints3d = Pre3d.Math.subPoints3d;
  var addPoints2d = Pre3d.Math.addPoints2d;
  var addPoints3d = Pre3d.Math.addPoints3d;
  var mulPoint2d = Pre3d.Math.mulPoint2d;
  var mulPoint3d = Pre3d.Math.mulPoint3d;
  var vecMag2d = Pre3d.Math.vecMag2d;
  var vecMag3d = Pre3d.Math.vecMag3d;
  var unitVector2d = Pre3d.Math.unitVector2d;
  var unitVector3d = Pre3d.Math.unitVector3d;
  var linearInterpolate = Pre3d.Math.linearInterpolate;
  var linearInterpolatePoints3d = Pre3d.Math.linearInterpolatePoints3d;
  var averagePoints = Pre3d.Math.averagePoints;

  var k2PI = Math.PI * 2;

  // averagePoints() specialized for averaging 2 points.
  function averagePoints2(a, b) {
    return {
      x: (a.x + b.x) * 0.5,
      y: (a.y + b.y) * 0.5,
      z: (a.z + b.z) * 0.5
    };
  }

  // Rebuild the pre-computed "metadata", for the Shape |shape|.  This
  // calculates the centroids and normal vectors for each QuadFace.
  function rebuildMeta(shape) {
    var quads = shape.quads;
    var num_quads = quads.length;
    var vertices = shape.vertices;

    // TODO: It's possible we could save some work here, we could mark the
    // faces "dirty" which need their centroid or normal recomputed.  Right now
    // if we do an operation on a single face, we rebuild all of them.  A
    // simple scheme would be to track any writes to a QuadFace, and to set
    // centroid / normal1 / normal2 to null.  This would also prevent bugs
    // where you forget to call rebuildMeta() and used stale metadata.

    for (var i = 0; i < num_quads; ++i) {
      var qf = quads[i];

      var centroid;
      var n1, n2;

      var vert0 = vertices[qf.i0];
      var vert1 = vertices[qf.i1];
      var vert2 = vertices[qf.i2];
      var vec01 = subPoints3d(vert1, vert0);
      var vec02 = subPoints3d(vert2, vert0);
      var n1 = crossProduct(vec01, vec02);

      if (qf.isTriangle()) {
        n2 = n1;
        centroid = averagePoints([vert0, vert1, vert2]);
      } else {
        var vert3 = vertices[qf.i3];
        var vec03 = subPoints3d(vert3, vert0);
        n2 = crossProduct(vec02, vec03);
        centroid = averagePoints([vert0, vert1, vert2, vert3]);
      }

      qf.centroid = centroid;
      qf.normal1 = n1;
      qf.normal2 = n2;
    }

    return shape;
  }

  // Convert any quad faces into two triangle faces.  After triangulation,
  // |shape| should only consist of triangles.
  function triangulate(shape) {
    var quads = shape.quads;
    var num_quads = quads.length;
    for (var i = 0; i < num_quads; ++i) {
      var qf = quads[i];
      if (qf.isTriangle())
        continue;

      // TODO(deanm): Should we follow some clockwise rule here?
      var newtri = new Pre3d.QuadFace(qf.i0, qf.i2, qf.i3, null);
      // Convert the original quad into a triangle.
      qf.i3 = null;
      // Add the new triangle to the list of faces.
      quads.push(newtri);
    }
    rebuildMeta(shape);
    return shape;
  }

  // Call |func| for each face of |shape|.  The callback |func| should return
  // false to continue iteration, or true to stop.  For example:
  //   forEachFace(shape, function(quad_face, quad_index, shape) {
  //     return false;
  //   });
  function forEachFace(shape, func) {
    var quads = shape.quads;
    for (var i = 0, il = quads.length; i < il; ++i) {
      if (func(quads[i], i, shape) === true)
        break;
    }
    return shape;
  }

  function forEachVertex(shape, func) {
    var vertices = shape.vertices;
    for (var i = 0, il = vertices.length; i < il; ++i) {
      if (func(vertices[i], i, shape) === true)
        break;
    }
    return shape;
  }

  function makePlane(p1, p2, p3, p4) {
    var s = new Pre3d.Shape();
    s.vertices = [p1, p2, p3, p4];
    s.quads = [new Pre3d.QuadFace(0, 1, 2, 3)];
    rebuildMeta(s);
    return s;
  }

  // Make a box with width (x) |w|, height (y) |h|, and depth (z) |d|.
  function makeBox(w, h, d) {
    var s = new Pre3d.Shape();
    s.vertices = [
      {x:  w, y:  h, z: -d},  // 0
      {x:  w, y:  h, z:  d},  // 1
      {x:  w, y: -h, z:  d},  // 2
      {x:  w, y: -h, z: -d},  // 3
      {x: -w, y:  h, z: -d},  // 4
      {x: -w, y:  h, z:  d},  // 5
      {x: -w, y: -h, z:  d},  // 6
      {x: -w, y: -h, z: -d}   // 7
    ];

    //    4 -- 0
    //   /|   /|     +y
    //  5 -- 1 |      |__ +x
    //  | 7 -|-3     /
    //  |/   |/    +z
    //  6 -- 2

    s.quads = [
      new Pre3d.QuadFace(0, 1, 2, 3),  // Right side
      new Pre3d.QuadFace(1, 5, 6, 2),  // Front side
      new Pre3d.QuadFace(5, 4, 7, 6),  // Left side
      new Pre3d.QuadFace(4, 0, 3, 7),  // Back side
      new Pre3d.QuadFace(0, 4, 5, 1),  // Top side
      new Pre3d.QuadFace(2, 6, 7, 3)   // Bottom side
    ];

    rebuildMeta(s);

    return s;
  }

  // Make a cube with width, height, and depth |whd|.
  function makeCube(whd) {
    return makeBox(whd, whd, whd);
  }

  function makeBoxWithHole(w, h, d, hw, hh) {
    var s = new Pre3d.Shape();
    s.vertices = [
      {x:  w, y:  h, z: -d},  // 0
      {x:  w, y:  h, z:  d},  // 1
      {x:  w, y: -h, z:  d},  // 2
      {x:  w, y: -h, z: -d},  // 3
      {x: -w, y:  h, z: -d},  // 4
      {x: -w, y:  h, z:  d},  // 5
      {x: -w, y: -h, z:  d},  // 6
      {x: -w, y: -h, z: -d},  // 7

      // The front new points ...
      {x: hw, y:   h, z: d},  // 8
      {x:  w, y:  hh, z: d},  // 9
      {x: hw, y:  hh, z: d},  // 10
      {x: hw, y:  -h, z: d},  // 11
      {x:  w, y: -hh, z: d},  // 12
      {x: hw, y: -hh, z: d},  // 13

      {x: -hw, y:   h, z: d},  // 14
      {x:  -w, y:  hh, z: d},  // 15
      {x: -hw, y:  hh, z: d},  // 16
      {x: -hw, y:  -h, z: d},  // 17
      {x:  -w, y: -hh, z: d},  // 18
      {x: -hw, y: -hh, z: d},  // 19

      // The back new points ...
      {x: hw, y:   h, z: -d},  // 20
      {x:  w, y:  hh, z: -d},  // 21
      {x: hw, y:  hh, z: -d},  // 22
      {x: hw, y:  -h, z: -d},  // 23
      {x:  w, y: -hh, z: -d},  // 24
      {x: hw, y: -hh, z: -d},  // 25

      {x: -hw, y:   h, z: -d},  // 26
      {x: -w,  y:  hh, z: -d},  // 27
      {x: -hw, y:  hh, z: -d},  // 28
      {x: -hw, y:  -h, z: -d},  // 29
      {x: -w,  y: -hh, z: -d},  // 30
      {x: -hw, y: -hh, z: -d}   // 31
    ];

    //                        Front               Back (looking from front)
    //    4 -   - 0           05  14  08  01      04  26  20  00
    //   /|      /|
    //  5 -   - 1 |           15  16--10  09      27  28--22  21
    //  | 7 -   |-3               |////|              |////|
    //  |/      |/            18  19--13  12      30  31--25  24
    //  6 -   - 2
    //                        06  17  11  02      07  29  23  03

    s.quads = [
      // Front side
      new Pre3d.QuadFace( 1,  8, 10,  9),
      new Pre3d.QuadFace( 8, 14, 16, 10),
      new Pre3d.QuadFace(14,  5, 15, 16),
      new Pre3d.QuadFace(16, 15, 18, 19),
      new Pre3d.QuadFace(19, 18,  6, 17),
      new Pre3d.QuadFace(13, 19, 17, 11),
      new Pre3d.QuadFace(12, 13, 11,  2),
      new Pre3d.QuadFace( 9, 10, 13, 12),
      // Back side
      new Pre3d.QuadFace( 4, 26, 28, 27),
      new Pre3d.QuadFace(26, 20, 22, 28),
      new Pre3d.QuadFace(20,  0, 21, 22),
      new Pre3d.QuadFace(22, 21, 24, 25),
      new Pre3d.QuadFace(25, 24,  3, 23),
      new Pre3d.QuadFace(31, 25, 23, 29),
      new Pre3d.QuadFace(30, 31, 29,  7),
      new Pre3d.QuadFace(27, 28, 31, 30),
      // The hole
      new Pre3d.QuadFace(10, 16, 28, 22),
      new Pre3d.QuadFace(19, 31, 28, 16),
      new Pre3d.QuadFace(13, 25, 31, 19),
      new Pre3d.QuadFace(10, 22, 25, 13),
      // Bottom side
      new Pre3d.QuadFace( 6,  7, 29, 17),
      new Pre3d.QuadFace(17, 29, 23, 11),
      new Pre3d.QuadFace(11, 23,  3,  2),
      // Right side
      new Pre3d.QuadFace( 1,  9, 21,  0),
      new Pre3d.QuadFace( 9, 12, 24, 21),
      new Pre3d.QuadFace(12,  2,  3, 24),
      // Left side
      new Pre3d.QuadFace( 5,  4, 27, 15),
      new Pre3d.QuadFace(15, 27, 30, 18),
      new Pre3d.QuadFace(18, 30,  7,  6),
      // Top side
      new Pre3d.QuadFace(14, 26,  4,  5),
      new Pre3d.QuadFace( 8, 20, 26, 14),
      new Pre3d.QuadFace( 1,  0, 20,  8)
    ];

    rebuildMeta(s);
    return s;
  }

  // Tessellate a spherical parametric equation.
  // (two extras are for zenith and azimuth).  There will be |tess_x| vertices
  // along the X-axis.  It is centered on the Y-axis.  It has a radius |r|.
  // The implementation is probably still a bit convulted.  We just handle the
  // middle points like a grid, and special case zenith/aximuth, since we want
  // them to share a vertex anyway.  The math is pretty much standard spherical
  // coordinates, except that we map {x, y, z} -> {z, x, y}.  |tess_x| is phi,
  // and |tess_y| is theta.
  function makeSphericalShape(f, tess_x, tess_y) {
    // TODO(deanm): Preallocate the arrays to the final size.
    var vertices = [ ];
    var quads = [ ];

    // We walk theta 0 .. PI and phi from 0 .. 2PI.
    var theta_step = Math.PI / (tess_y + 1);
    var phi_step = (k2PI) / tess_x;

    // Create all of the vertices for the middle grid portion.
    for (var i = 0, theta = theta_step;
         i < tess_y;
         ++i, theta += theta_step) {  // theta
      for (var j = 0; j < tess_x; ++j) {  // phi
        vertices.push(f(theta, phi_step * j));
      }
    }

    // Generate the quads for the middle grid portion.
    for (var i = 0; i < tess_y-1; ++i) {
      var stride = i * tess_x;
      for (var j = 0; j < tess_x; ++j) {
        var n = (j + 1) % tess_x;
        quads.push(new Pre3d.QuadFace(
          stride + j,
          stride + tess_x + j,
          stride + tess_x + n,
          stride + n
        ));
      }
    }

    // Special case the zenith / azimuth (top / bottom) portion of triangles.
    // We make triangles (degenerated quads).
    var last_row = vertices.length - tess_x;
    var top_p_i = vertices.length;
    var bot_p_i = top_p_i + 1;
    vertices.push(f(0, 0));
    vertices.push(f(Math.PI, 0));

    for (var i = 0; i < tess_x; ++i) {
      // Top triangles...
      quads.push(new Pre3d.QuadFace(
        top_p_i,
        i,
        ((i + 1) % tess_x),
        null
      ));
      // Bottom triangles...
      quads.push(new Pre3d.QuadFace(
        bot_p_i,
        last_row + ((i + 2) % tess_x),
        last_row + ((i + 1) % tess_x),
        null
      ));
    }

    var s = new Pre3d.Shape();
    s.vertices = vertices;
    s.quads = quads;
    rebuildMeta(s);
    return s;
  }

  function makeOctahedron() {
    var s = new Pre3d.Shape();
    s.vertices = [
     {x: -1, y:  0, z:  0},  // 0
     {x:  0, y:  0, z:  1},  // 1
     {x:  1, y:  0, z:  0},  // 2
     {x:  0, y:  0, z: -1},  // 3
     {x:  0, y:  1, z:  0},  // 4
     {x:  0, y: -1, z:  0}   // 5
    ];
    // Top 4 triangles: 5 0 1, 5 1 2, 5 2 3, 5 3 0
    // Bottom 4 triangles: 0 5 1, 1 5 2, 2 5 3, 3 5 0
    quads = Array(8);
    for (var i = 0; i < 4; ++i) {
      var i2 = (i + 1) & 3;
      quads[i*2] = new Pre3d.QuadFace(4, i, i2, null);
      quads[i*2+1] = new Pre3d.QuadFace(i, 5, i2, null);
    }

    s.quads = quads;
    Pre3d.ShapeUtils.rebuildMeta(s);
    return s;
  }

  // Tessellate a sphere.  There will be |tess_y| + 2 vertices along the Y-axis
  // (two extras are for zenith and azimuth).  There will be |tess_x| vertices
  // along the X-axis.  It is centered on the Y-axis.  It has a radius |r|.
  // The implementation is probably still a bit convulted.  We just handle the
  // middle points like a grid, and special case zenith/aximuth, since we want
  // them to share a vertex anyway.  The math is pretty much standard spherical
  // coordinates, except that we map {x, y, z} -> {z, x, y}.  |tess_x| is phi,
  // and |tess_y| is theta.
  // TODO(deanm): This code could definitely be more efficent.
  function makeSphere(r, tess_x, tess_y) {
    return makeSphericalShape(function(theta, phi) {
        return {
          x: r * Math.sin(theta) * Math.sin(phi),
          y: r * Math.cos(theta),
          z: r * Math.sin(theta) * Math.cos(phi)
        };
    }, tess_x, tess_y);
  }

  // Smooth a Shape by averaging the vertices / faces.  This is something like
  // Catmull-Clark, but without the proper weighting.  The |m| argument is the
  // amount to smooth, between 0 and 1, 0 being no smoothing.
  function averageSmooth(shape, m) {
    // TODO(deanm): Remove this old compat code for calling without arguments.
    if (m === void(0))
      m = 1;

    var vertices = shape.vertices;
    var psl = vertices.length;
    var new_ps = Array(psl);

    // Build a connection mapping of vertex_index -> [ quad indexes ]
    var connections = Array(psl);
    for (var i = 0; i < psl; ++i)
      connections[i] = [ ];

    for (var i = 0, il = shape.quads.length; i < il; ++i) {
      var qf = shape.quads[i];
      connections[qf.i0].push(i);
      connections[qf.i1].push(i);
      connections[qf.i2].push(i);
      if (!qf.isTriangle())
        connections[qf.i3].push(i);
    }

    // For every vertex, average the centroids of the faces it's a part of.
    for (var i = 0, il = vertices.length; i < il; ++i) {
      var cs = connections[i];
      var avg = {x: 0, y: 0, z: 0};

      // Sum together the centroids of each face.
      for (var j = 0, jl = cs.length; j < jl; ++j) {
        var quad = shape.quads[cs[j]];
        var p1 = vertices[quad.i0];
        var p2 = vertices[quad.i1];
        var p3 = vertices[quad.i2];
        var p4 = vertices[quad.i3];
        // The centroid.  TODO(deanm) can't shape just come from the QuadFace?
        // That would handle triangles better and avoid some duplication.
        avg.x += (p1.x + p2.x + p3.x + p4.x) / 4;
        avg.y += (p1.y + p2.y + p3.y + p4.y) / 4;
        avg.z += (p1.z + p2.z + p3.z + p4.z) / 4;
        // TODO combine all the div / 4 into one divide?
      }

      // We summed up all of the centroids, take the average for our new point.
      var f = 1 / jl;
      avg.x *= f;
      avg.y *= f;
      avg.z *= f;

      // Interpolate between the average and the original based on |m|.
      new_ps[i] = linearInterpolatePoints3d(vertices[i], avg, m);
    }

    shape.vertices = new_ps;

    rebuildMeta(shape);
    return shape;
  }

  // Small utility function like Array.prototype.map.  Return a new array
  // based on the result of the function on a current array.
  function arrayMap(arr, func) {
    var out = Array(arr.length);
    for (var i = 0, il = arr.length; i < il; ++i) {
      out[i] = func(arr[i], i, arr);
    }
    return out;
  }

  // Divide each face of a Shape into 4 equal new faces.
  // TODO(deanm): Better document, doesn't support triangles, etc.
  function linearSubdivide(shape) {
    var num_quads = shape.quads.length;

    var share_points = { };

    for (var i = 0; i < num_quads; ++i) {
      var quad = shape.quads[i];

      var i0 = quad.i0;
      var i1 = quad.i1;
      var i2 = quad.i2;
      var i3 = quad.i3;

      var p0 = shape.vertices[i0];
      var p1 = shape.vertices[i1];
      var p2 = shape.vertices[i2];
      var p3 = shape.vertices[i3];

      //  p0   p1      p0  n0  p1
      //           ->  n3  n4  n1
      //  p3   p2      p3  n2  p2

      // We end up with an array of vertex indices of the centroids of each
      // side of the quad and the middle centroid.  We start with the vertex
      // indices that should be averaged.  We cache centroids to make sure that
      // we share vertices instead of creating two on top of each other.
      var ni = [
        [i0, i1].sort(),
        [i1, i2].sort(),
        [i2, i3].sort(),
        [i3, i0].sort(),
        [i0, i1, i2, i3].sort()
      ];

      for (var j = 0, jl = ni.length; j < jl; ++j) {
        var ps = ni[j];
        var key = ps.join('-');
        var centroid_index = share_points[key];
        if (centroid_index === undefined) {  // hasn't been seen before
          centroid_index = shape.vertices.length;
          var s = shape;
          shape.vertices.push(averagePoints(
              arrayMap(ps, function(x) { return s.vertices[x]; })));
          share_points[key] = centroid_index;
        }

        ni[j] = centroid_index;
      }

      // New quads ...
      var q0 = new Pre3d.QuadFace(   i0, ni[0], ni[4], ni[3]);
      var q1 = new Pre3d.QuadFace(ni[0],    i1, ni[1], ni[4]);
      var q2 = new Pre3d.QuadFace(ni[4], ni[1],    i2, ni[2]);
      var q3 = new Pre3d.QuadFace(ni[3], ni[4], ni[2],    i3);

      shape.quads[i] = q0;
      shape.quads.push(q1);
      shape.quads.push(q2);
      shape.quads.push(q3);
    }

    rebuildMeta(shape);
    return shape;
  }

  // Divide each triangle of a Shape into 4 new triangle faces.  This is done
  // by taking the mid point of each edge, and creating 4 new triangles.  You
  // can visualize it by inscribing a new upside-down triangle within the
  // current triangle, which then defines 4 new sub-triangles.
  function linearSubdivideTri(shape) {
    var num_tris = shape.quads.length;
    var share_points = { };

    for (var i = 0; i < num_tris; ++i) {
      var tri = shape.quads[i];

      var i0 = tri.i0;
      var i1 = tri.i1;
      var i2 = tri.i2;

      var p0 = shape.vertices[i0];
      var p1 = shape.vertices[i1];
      var p2 = shape.vertices[i2];

      //     p0                 p0
      //              ->      n0  n2
      // p1      p2         p1  n1  p2

      // We end up with an array of vertex indices of the centroids of each
      // side of the triangle.  We start with the vertex indices that should be
      // averaged.  We cache centroids to make sure that we share vertices
      // instead of creating two on top of each other.
      var ni = [
        [i0, i1].sort(),
        [i1, i2].sort(),
        [i2, i0].sort(),
      ];

      for (var j = 0, jl = ni.length; j < jl; ++j) {
        var ps = ni[j];
        var key = ps.join('-');
        var centroid_index = share_points[key];
        if (centroid_index === undefined) {  // hasn't been seen before
          centroid_index = shape.vertices.length;
          var s = shape;
          shape.vertices.push(averagePoints(
              arrayMap(ps, function(x) { return s.vertices[x]; })));
          share_points[key] = centroid_index;
        }

        ni[j] = centroid_index;
      }

      // New triangles ...
      var q0 = new Pre3d.QuadFace(   i0, ni[0], ni[2], null);
      var q1 = new Pre3d.QuadFace(ni[0],    i1, ni[1], null);
      var q2 = new Pre3d.QuadFace(ni[2], ni[1],    i2, null);
      var q3 = new Pre3d.QuadFace(ni[0], ni[1], ni[2], null);

      shape.quads[i] = q0;
      shape.quads.push(q1);
      shape.quads.push(q2);
      shape.quads.push(q3);
    }

    rebuildMeta(shape);
    return shape;
  }

  // Detach all of the faces from each other.  Basically this just duplicates
  // all of the vertices for each face, so a vertex is not shared across faces.
  function explodeFaces(shape) {
    var quads = shape.quads;
    var num_quads = quads.length;
    var verts = shape.vertices;
    var new_verts = [ ];
    for (var i = 0; i < num_quads; ++i) {
      var q = quads[i];
      var pos = new_verts.length;
      new_verts.push({x: verts[q.i0].x, y: verts[q.i0].y, z: verts[q.i0].z});
      new_verts.push({x: verts[q.i1].x, y: verts[q.i1].y, z: verts[q.i1].z});
      new_verts.push({x: verts[q.i2].x, y: verts[q.i2].y, z: verts[q.i2].z});
      q.i0 = pos;
      q.i1 = pos + 1;
      q.i2 = pos + 2;
      if (q.isTriangle() !== true) {
        new_verts.push({x: verts[q.i3].x, y: verts[q.i3].y, z: verts[q.i3].z});
        q.i3 = pos + 3;
      }
    }
    shape.vertices = new_verts;
    return shape;
  }

  // The Extruder implements extruding faces of a Shape.  The class mostly
  // exists as a place to hold all of the extrusion parameters.  The properties
  // are meant to be private, please use the getter/setter APIs.
  function Extruder() {
    // The total distance to extrude, if |count| > 1, then each segment will
    // just be a portion of the distance, and together they will be |distance|.
    this.distance_ = 1.0;
    // The number of segments / steps to perform.  This is can be different
    // than just running extrude multiple times, since we only operate on the
    // originally faces, not our newly inserted faces.
    this.count_ = 1;
    // Selection mechanism.  Access these through the selection APIs.
    this.selector_ = null;
    this.selectAll();

    // TODO(deanm): Need a bunch more settings, controlling which normal the
    // extrusion is performed along, etc.

    // Set scale and rotation.  These are public, you can access them directly.
    // TODO(deanm): It would be great to use a Transform here, but there are
    // a few problems.  Translate doesn't make sense, so it is not really an
    // affine.  The real problem is that we need to interpolate across the
    // values, having them in a matrix is not helpful.
    this.scale = {x: 1, y: 1, z: 1};
    this.rotate = {x: 0, y: 0, z: 0};
  }

  // Selection APIs, control which faces are extruded.
  Extruder.prototype.selectAll = function() {
    this.selector_ = function(shape, vertex_index) { return true; };
  };

  // Select faces based on the function select_func.  For example:
  //   extruder.selectCustom(function(shape, quad_index) {
  //     return quad_index == 0;
  //   });
  // The above would select only the first face for extrusion.
  Extruder.prototype.selectCustom = function(select_func) {
    this.selector_ = select_func;
  };

  Extruder.prototype.distance = function() {
    return this.distance_;
  };
  Extruder.prototype.set_distance = function(d) {
    this.distance_ = d;
  };

  Extruder.prototype.count = function() {
    return this.count_;
  };
  Extruder.prototype.set_count = function(c) {
    this.count_ = c;
  };

  Extruder.prototype.extrude = function extrude(shape) {
    var distance = this.distance();
    var count = this.count();

    var rx = this.rotate.x;
    var ry = this.rotate.y;
    var rz = this.rotate.z;
    var sx = this.scale.x;
    var sy = this.scale.y;
    var sz = this.scale.z;

    var vertices = shape.vertices;
    var quads = shape.quads;

    var faces = [ ];
    for (var i = 0, il = quads.length; i < il; ++i) {
      if (this.selector_(shape, i))
        faces.push(i);
    }

    for (var i = 0, il = faces.length; i < il; ++i) {
      // This is the index of the original face.  It will eventually be
      // replaced with the last iteration's outside face.
      var face_index = faces[i];
      // As we proceed down a count, we always need to connect to the newest
      // new face.  We start |quad| as the original face, and it will be
      // modified (in place) for each iteration, and then the next iteration
      // will connect back to the previous iteration, etc.
      var qf = quads[face_index];
      var original_cent = qf.centroid;

      // This is the surface normal, used to project out the new face.  It
      // will be rotated, but never scaled.  It should be a unit vector.
      var surface_normal = unitVector3d(addPoints3d(qf.normal1, qf.normal2));

      var is_triangle = qf.isTriangle();

      // These are the normals inside the face, from the centroid out to the
      // vertices.  They will be rotated and scaled to create the new faces.
      var inner_normal0 = subPoints3d(vertices[qf.i0], original_cent);
      var inner_normal1 = subPoints3d(vertices[qf.i1], original_cent);
      var inner_normal2 = subPoints3d(vertices[qf.i2], original_cent);
      if (is_triangle !== true) {
        var inner_normal3 = subPoints3d(vertices[qf.i3], original_cent);
      }

      for (var z = 0; z < count; ++z) {
        var m = (z + 1) / count;

        var t = new Pre3d.Transform();
        t.rotateX(rx * m);
        t.rotateY(ry * m);
        t.rotateZ(rz * m);

        // For our new point, we simply want to rotate the original normal
        // proportional to how many steps we're at.  Then we want to just scale
        // it out based on our steps, and add it to the original centorid.
        var new_cent = addPoints3d(original_cent,
          mulPoint3d(t.transformPoint(surface_normal), m * distance));

        // We multiplied the centroid, which should not have been affected by
        // the scale.  Now we want to scale the inner face normals.
        t.scalePre(
          linearInterpolate(1, sx, m),
          linearInterpolate(1, sy, m),
          linearInterpolate(1, sz, m));

        var index_before = vertices.length;

        vertices.push(addPoints3d(new_cent, t.transformPoint(inner_normal0)));
        vertices.push(addPoints3d(new_cent, t.transformPoint(inner_normal1)));
        vertices.push(addPoints3d(new_cent, t.transformPoint(inner_normal2)));
        if (is_triangle !== true) {
          vertices.push(
              addPoints3d(new_cent, t.transformPoint(inner_normal3)));
        }

        // Add the new faces.  These faces will always be quads, even if we
        // extruded a triangle.  We will have 3 or 4 new side faces.
        quads.push(new Pre3d.QuadFace(
            qf.i1,
            index_before + 1,
            index_before,
            qf.i0));
        quads.push(new Pre3d.QuadFace(
            qf.i2,
            index_before + 2,
            index_before + 1,
            qf.i1));

        if (is_triangle === true) {
          quads.push(new Pre3d.QuadFace(
              qf.i0,
              index_before,
              index_before + 2,
              qf.i2));
        } else {
          quads.push(new Pre3d.QuadFace(
              qf.i3,
              index_before + 3,
              index_before + 2,
              qf.i2));
          quads.push(new Pre3d.QuadFace(
              qf.i0,
              index_before,
              index_before + 3,
              qf.i3));
        }

        // Update (in place) the original face with the new extruded vertices.
        qf.i0 = index_before;
        qf.i1 = index_before + 1;
        qf.i2 = index_before + 2;
        if (is_triangle !== true)
          qf.i3 = index_before + 3;
      }
    }

    rebuildMeta(shape);  // Compute all the new normals, etc.
  };

  return {
    rebuildMeta: rebuildMeta,
    triangulate: triangulate,
    forEachFace: forEachFace,
    forEachVertex: forEachVertex,

    makePlane: makePlane,
    makeCube: makeCube,
    makeBox: makeBox,
    makeBoxWithHole: makeBoxWithHole,
    makeSphericalShape: makeSphericalShape,
    makeSphere: makeSphere,
    makeOctahedron: makeOctahedron,

    averageSmooth: averageSmooth,
    linearSubdivide: linearSubdivide,
    linearSubdivideTri: linearSubdivideTri,
    explodeFaces: explodeFaces,

    Extruder: Extruder
  };
})();
