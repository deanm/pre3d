Pre3d is a JavaScript library, which will project a 3d scene into 2d, and draw
it to a <canvas> element.  The API is immediate mode, with the basic primitive
of a Shape, consisting of QuadFace quad and/or triangle faces.  The library is
designed to be low-level and direct, there is no retrained or scene graph API.

There are currently 2 JavaScript files, the core engine and some mesh utils.
There are no external dependencies, and the DOM shouldn't be touched outside
of using the <canvas> element passed to the Renderer.

  pre3d.js - The core math routines, data structures, and rendering code.  It
  does not touch the DOM, except the <canvas> element passed to the Renderer.

  pre3d_shape_utils.js - While pre3d.js defines the basic shape datastructures,
  it implement much code for working with them.  This is a collection of code
  for creating new Shapes (cube, sphere, etc), and for manipulating Shapes.  It
  implements some basic procedural operators like smooth and subdivide.

There are some demo applications implemented in the demos/ directory.  Along
with the comments in the source code, the demos are the best source of
documentation.  They should give you an idea of how to use the engine, and what
it is capable of. demos/demo_utils.js implements some UI helpers, like moving
camera when the canvas element is dragged on, etc.

License:
  The engine code is free to use under the BSD license.  The examples / demos
  are (c) Dean McNamee, All rights reserved.

Credits:
  Kragen's torus is the best/simplest/cleanest JS 3d code I've seen, and was
  a good source of inspiration.  http://www.canonical.org/~kragen/sw/torus.html

  The Demoscene has strongly influenced how I think about graphics, and this
  engine is a joke compared to what is being done there.

  Thatcher Ulrich gave me a bunch of help and ideas, and implemented the
  textured triangle drawing.
