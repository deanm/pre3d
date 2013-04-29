// (c) Dean McNamee <dean@gmail.com>, Ron Peleg <ron.peleg@gmail.com>.  All rights reserved.

var SciGraph = (function() {

  function maxV(_data) {
    retval = 0;
    for(z=0; z<_data.length; z++) {
      for(x=0; x<_data[z].length; x++) {
        retval = Math.max(retval, Math.abs(_data[z][x]));
      }
    }
    return retval;
  }

  function makeGraph(_data,_facx, _facz, _facy) {
    var s = new Pre3d.Shape();
    s.vertices = [];
    s.quads = [];
    len_x = _data[0].length;
    len_z = _data.length;
    max_y = maxV(_data);


    for(x=0; x<len_x; x++) {
      for(z=0; z<len_z; z++) {
        // normalize and then factor vertice values
        s.vertices.push({
          x: (x-len_x/2)/len_x*_facx,
          z: (z-len_z/2)/len_z*_facz, 
          y: _data[z][x]/max_y*_facy
        });

        // close quads
        if(x>=1 && z>=1) {
          prev = (x-1)*len_z;
          curr = x*len_z;
          s.quads.push( new Pre3d.QuadFace(prev+z-1,prev+z,curr+z,curr+z-1));
          s.quads.push( new Pre3d.QuadFace(curr+z-1,curr+z,prev+z,prev+z-1));
        }
      }
    }

    Pre3d.ShapeUtils.averageSmooth(s,1);
    // Pre3d.ShapeUtils.triangulate(s);
    Pre3d.ShapeUtils.rebuildMeta(s);

    return s;
  }

  // the _range paramaters are hash maps with the values {min: ##, max: ##, step: ##}
  // the _func is a regular y=f(x,z)
  function func2Data(_func,_xrange,_zrange) {
    var data = [];
    for(z=_zrange.min;z<=_zrange.max;z+=_zrange.step) {
      row = [];
      for(x=_xrange.min;x<=_xrange.max;x+=_xrange.step) {
        row.push(_func(x,z));
      }
      data.push(row);
    }
    return data;
  }


  return {
    func2Data: func2Data,
    makeGraph: makeGraph
  };
})();
