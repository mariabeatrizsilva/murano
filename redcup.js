/*
 * Matrix Library
 */
let mIdentity = () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
let mInverse = (m) => {
  let dst = [],
    det = 0,
    cofactor = (c, r) => {
      let s = (i, j) => m[((c + i) & 3) | (((r + j) & 3) << 2)];
      return (
        ((c + r) & 1 ? -1 : 1) *
        (s(1, 1) * (s(2, 2) * s(3, 3) - s(3, 2) * s(2, 3)) -
          s(2, 1) * (s(1, 2) * s(3, 3) - s(3, 2) * s(1, 3)) +
          s(3, 1) * (s(1, 2) * s(2, 3) - s(2, 2) * s(1, 3)))
      );
    };
  for (let n = 0; n < 16; n++) dst.push(cofactor(n >> 2, n & 3));
  for (let n = 0; n < 4; n++) det += m[n] * dst[n << 2];
  for (let n = 0; n < 16; n++) dst[n] /= det;
  return dst;
};
let matrixMultiply = (a, b) => {
  let dst = [];
  for (let n = 0; n < 16; n++)
    dst.push(
      a[n & 3] * b[n & 12] +
        a[(n & 3) | 4] * b[(n & 12) | 1] +
        a[(n & 3) | 8] * b[(n & 12) | 2] +
        a[(n & 3) | 12] * b[(n & 12) | 3]
    );
  return dst;
};
let mTranslate = (tx, ty, tz, m) => {
  return matrixMultiply(m, [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, tx, ty, tz, 1]);
};
let mRotateX = (theta, m) => {
  let c = Math.cos(theta),
    s = Math.sin(theta);
  return matrixMultiply(m, [1, 0, 0, 0, 0, c, s, 0, 0, -s, c, 0, 0, 0, 0, 1]);
};
let mRotateY = (theta, m) => {
  let c = Math.cos(theta),
    s = Math.sin(theta);
  return matrixMultiply(m, [c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, 0, 0, 0, 1]);
};
let mRotateZ = (theta, m) => {
  let c = Math.cos(theta),
    s = Math.sin(theta);
  return matrixMultiply(m, [c, s, 0, 0, -s, c, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
};
let mScale = (sx, sy, sz, m) => {
  return matrixMultiply(m, [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1]);
};
let mPerspective = (fl, m) => {
  return matrixMultiply(m, [1,0,0,0,0,1,0,0,0,0,1,-1 / fl,0,0,0,1,]);
};

/* Handling customizable aspects of cup (i.e. transparency, dimples, etc) */
var alpha = 0.8; // Controls transparency
var noisy = 32; // Controls dimpled-ness

var noisiness = document.getElementById("noisyN");
noisiness.addEventListener("input", function () {
  noisy = noisiness.value;
});

// Rotation Controls
var x_amt = 0;
var y_amt = 0;
var z_amt = 0;

var x_rotation = document.getElementById("xRot");
x_rotation.addEventListener("input", function () {
  x_amt = x_rotation.value / 10;
  console.log(x_amt);
});

var y_rotation = document.getElementById("yRot");
y_rotation.addEventListener("input", function () {
  y_amt = y_rotation.value / 10;
  console.log(y_amt);
});

var z_rotation = document.getElementById("zRot");
z_rotation.addEventListener("input", function () {
  z_amt = z_rotation.value / 10;
  console.log(z_amt);
});

/* Setting up WebGL */
let start_gl = (canvas, meshData, vertexSize, vertexShader, fragmentShader) => {
  let gl = canvas.getContext("webgl");
  let program = gl.createProgram();
  gl.program = program;
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.depthMask(false);

  let addshader = (type, src) => {
    let shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw "Cannot compile shader:\n\n" + gl.getShaderInfoLog(shader);
    gl.attachShader(program, shader);
  };
  addshader(gl.VERTEX_SHADER, vertexShader);
  addshader(gl.FRAGMENT_SHADER, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
    throw "Could not link the shader program!";
  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  let vertexAttribute = (name, size, position) => {
    let attr = gl.getAttribLocation(program, name);
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(
      attr,
      size,
      gl.FLOAT,
      false,
      vertexSize * 4,
      position * 4
    );
  };
  vertexAttribute("aPos", 3, 0);
  vertexAttribute("aNor", 3, 3);
  return gl;
};

/* Setting up Mouse Events */
let r = canvas1.getBoundingClientRect(),
  cursor = [0, 0, 0];
let setCursor = (e, z) =>
  (cursor = [
    ((e.clientX - r.left) / canvas1.width) * 2 - 1,
    1 - ((e.clientY - r.top) / canvas1.height) * 2,
    z !== undefined ? z : cursor[2],
  ]);
canvas1.onmousedown = (e) => setCursor(e, 1);
canvas1.onmousemove = (e) => setCursor(e);
canvas1.onmouseup = (e) => setCursor(e, 0);

let createMesh = (nu, nv, p) => {
  let mesh = [];
  for (let j = nv; j > 0; j--) {
    for (let i = 0; i <= nu; i++)
      mesh.push(p(i / nu, j / nv), p(i / nu, j / nv - 1 / nv));
    mesh.push(p(1, j / nv - 1 / nv), p(0, j / nv - 1 / nv));
  }
  return mesh.flat();
};

let createMeshRing = (nu, nv) => {
  let mesh = [];
  for (let j = nv; j > 0; j--) {
    // loop over v
    let v = 1 / nv;
    for (let i = 0; i <= nu; i++) {
      // loop over u
      u = 1 / nu;
      let theta = 2 * Math.PI * u * i;
      let c = Math.cos(theta),
          s = Math.sin(theta);
      let x = c, y = s;
      let w = 0.9;
      let wx = w * c, wy = w * s;
      mesh.push(x, y, 0, 0, 0, 1);
      mesh.push(wx, wy, 0, 0, 0, 1);
    }
  }
  return mesh.flat();
};

let tube = (nu, nv) =>
  createMesh(nu, nv, (u, v) => {
    // console.log("Creating tube!");
    let theta = 2 * Math.PI * u;
    let x = Math.cos(theta),
      y = Math.sin(theta),
      z = 2 * v - 1;
    return [x, y, z, x, y, 0];
  });

let disk = (nu, nv) =>
  createMesh(nu, nv, (u, v) => {
    let theta = 2 * Math.PI * u;
    let x = v * Math.cos(theta),
      y = v * Math.sin(theta);
    return [x, y, 0, 0, 0, 1];
  });

let meshData = [
  {
    type: 1,
    color: [0.7, 0.1, 0.1, alpha],
    mesh: new Float32Array(tube(40, 40)),
    texture: 1,
  },
  {
    type: 1,
    color: [0.8, 0.1, 0.1, alpha + 0.18],
    mesh: new Float32Array(disk(40, 40)),
    texture: 1,
  },
  {
    type: 1,
    color: [0.7, 0.1, 0.1, alpha],
    mesh: new Float32Array(tube(40, 40)),
    texture: 1,
  },
  {
    type: 1,
    color: [0.8, 0.1, 0.1, alpha],
    mesh: new Float32Array(createMeshRing(40, 40)),
    texture: 1,
  },
];

let vertexSize = 6;
let vertexShader = `
       float noise(vec3 point) { float r = 0.; for (int i=0;i<16;i++) {
       vec3 D, p = point + mod(vec3(i,i/4,i/8) , vec3(4.0,2.0,2.0)) +
              1.7*sin(vec3(i,5*i,8*i)), C=floor(p), P=p-C-.5, A=abs(P);
       C += mod(C.x+C.y+C.z,2.) * step(max(A.yzx,A.zxy),A) * sign(P);
        D=34.*sin(987.*float(i)+876.*C+76.*C.yzx+765.*C.zxy);P=p-C-.5;
          r+=sin(6.3*dot(P,fract(D)-.5))*pow(max(0.,1.-2.*dot(P,P)),4.);
         } return .5 * sin(r); }


       attribute vec3 aPos, aNor;
       uniform mat4 uMatrix, uInvMatrix;
       uniform float uNoisy;
       uniform vec4 uColor1;
       varying vec3 vPos, vNor, vaPos;
       void main() {
         vaPos = aPos;
          float noise = (uNoisy)/100. * noise(aPos.xyz);
          if (noise > .5){
            noise -= .2;
          }
          float tester = uColor1.x;
          if (aPos.z >= .95 || aPos.z <= -.95 || tester == .8){
            noise = 0.;
          }
          // do weighting function for the noise 
          vec4 pos = uMatrix * vec4(aPos.x, aPos.y + noise, aPos.z, 1.0);
          vec4 nor = vec4(aNor, 0.0) * uInvMatrix;
          vPos = pos.xyz;
          vNor = nor.xyz;
          gl_Position = pos * vec4(1.,1.,-.1,1.);
       }
    `;
let fragmentShader = `
       precision mediump float;
       uniform vec4 uColor;
       varying vec3 vPos, vNor, vaPos; // vNor passed from vertex shader 
       uniform vec3  uCursor;

      float noise(vec3 point) { float r = 0.; for (int i=0;i<16;i++) {
         vec3 D, p = point + mod(vec3(i,i/4,i/8) , vec3(4.0,2.0,2.0)) +
            1.7*sin(vec3(i,5*i,8*i)), C=floor(p), P=p-C-.5, A=abs(P);
            C += mod(C.x+C.y+C.z,2.) * step(max(A.yzx,A.zxy),A) * sign(P);
            D=34.*sin(987.*float(i)+876.*C+76.*C.yzx+765.*C.zxy);P=p-C-.5;
            r+=sin(6.3*dot(P,fract(D)-.5))*pow(max(0.,1.-2.*dot(P,P)),4.);
            } return .5 * sin(r); }


      vec3 cup_text_blue(vec3 pos, vec3 light){
         float n = noise(2. * pos);
         vec3 col = light * (n + vec3(.5+5.*n, n + .4, .5 +.4));
         col *= vec3(.5, 1.,1.);
         return col;
      }

      
      vec3 cup_text_red(vec3 pos, vec3 light){
         float n = noise(4.5 * pos);
         vec3 col = light * (n + vec3(.7, n + .4 * n * n, .8 * n ));
         col *= vec3(.5, 1.,1.);
         return col;
      }

      vec3 cup_text_purple(vec3 pos, vec3 light){
         float n = noise(2.5 * pos);
         vec3 col = light * (n + vec3(.5+5.*n, n, .5 +.4));
         col *= vec3(.5, 1.,1.);
         return col;
      }

      vec3 blue_cup(vec3 pos, vec3 light){
         float n = noise(3.5 * pos);
         vec3 col = light * (n + vec3(.5*n, n, .5 +.4));
         col *= vec3(.5, 1.,1.);
         if (n >= .3){
            col = vec3(0.3, .2, 0.);
         }
         else if (n >= .2){
            col *= vec3(0., 0.02,.1);
         }
         else if (n >= .15){
            col = vec3(0.3, 0., 0.);
         }
         return col;
      }

      vec3 favCup(vec3 pos, vec3 light){
         vec3 old = cup_text_red(pos, light);
         float n = noise(4.5 * pos);
         vec3 col = vec3(old.x, old.y, old.z);
         if (n >= .3){
            col = vec3(0.3, .2, 0.);
         }
         else if (n >= .2){
            col *= vec3(0., 0.02,.1);
         }
         return 1.2 * col;
      }

   vec3 cup_text(vec3 pos, vec3 light){
      vec3 col = favCup(pos,light);
      //vec3 col = blue_cup(pos,light);
      return col;
   }


      void main(void) {
         vec3 lightsource = uCursor; 
         vec3 lightCol = vec3(1.); // white
         vec3 ambient = vec3 (.5);
         // constants for specular and diffused
         float ac = .25;
         float dc = .75;
         float sc = .5;         
        // diffused light -- dot (normal at point of surface, vector from point to light source)
            vec3 norm = normalize(vNor);
            vec3 lightDir = normalize(lightsource);
            float c = .5 + max(0.0, dot(lightsource, norm));
            vec3 diff = c * lightCol;

        // specular -- exp(max(dot(R, C),0)k) 
            vec3 cameraSource = vec3(0.0,0.0,1.0);
            vec3 viewSource = normalize(cameraSource);
            vec3 refSource = normalize(reflect(-lightsource, norm)); // reflect direction = 
            float s = pow(max(dot(viewSource, refSource),0.0), 4.0);
            s = pow(s, 4.0);
            vec3 spec = s * lightCol;
            vec3 lighting = ambient * ac + diff * dc + spec * sc;   
            vec3 bgCol = vec3 (0.8549019608, 0.9490196078, 1.);
            vec3 color = cup_text(vaPos, lighting);
          gl_FragColor = vec4(sqrt(color), uColor.w);
       }
    `;

setTimeout(() => {
  let gl = start_gl(canvas1,meshData,vertexSize,vertexShader, fragmentShader);
  let uNoisy = gl.getUniformLocation(gl.program, "uNoisy");
  let uColor = gl.getUniformLocation(gl.program, "uColor");
  let uColor1 = gl.getUniformLocation(gl.program, "uColor1");
  let uMatrix = gl.getUniformLocation(gl.program, "uMatrix");
  let uCursor = gl.getUniformLocation(gl.program, "uCursor");
  let uInvMatrix = gl.getUniformLocation(gl.program, "uInvMatrix");

  let startTime = Date.now() / 1000;
  setInterval(() => {
    let time = Date.now() / 1000 - startTime;
    gl.uniform3fv(uCursor, cursor);
    for (let n = 0; n < meshData.length; n++) {
      let m = mIdentity();
      m = mRotateX(90 + x_amt, m);
      m = mRotateY(y_amt, m);
      m = mRotateZ(z_amt + time / 4, m);
      m = mScale(0.3, 0.3, 0.5, m);
      switch (n) {
        case 0: // main tube
          break;
        case 1: // bottom of cup
          m = mTranslate(0, 0, 1, m);
          break;
        case 2: 
          break;
        case 3: 
          m = mTranslate(0, 0, -0.9999, m);
          break;
      }

      gl.uniform4fv(uColor, meshData[n].color);
      gl.uniform4fv(uColor1, meshData[n].color);
      gl.uniform1f(uNoisy, noisy);
      gl.uniformMatrix4fv(uMatrix, false, m);
      gl.uniformMatrix4fv(uInvMatrix, false, mInverse(m));

      let mesh = meshData[n].mesh;
      gl.bufferData(gl.ARRAY_BUFFER, mesh, gl.STATIC_DRAW);
      gl.drawArrays(
        meshData[n].type ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
        0,
        mesh.length / vertexSize
      );
    }
  }, 30); // END OF SETINTERVAL
}, 100);
