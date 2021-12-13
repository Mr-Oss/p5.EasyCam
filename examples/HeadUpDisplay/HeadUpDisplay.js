
const D = 500;
const SIZE = 5;
const HUD_DATA_STRUCT = [
  ["gpu_renderer",
    "wgl_version",
    "wgl_glsl",

  ],
  [
    "Framerate",
    "Viewport",
    "Distance",
    "Center",
    "Rotation",
  ]
];
let grid, easycam;

function setup() {
  // -- create canvas for WEBGL and EasyCam
  pixelDensity(2);

  createCanvas(D, D, WEBGL);

  setAttributes('antialias', true);
  // -------
  print(Dw.EasyCam.INFO);
  // ------- init EasyCamp and HUD
  easycam = new Dw.EasyCam(this._renderer, { distance: 300 });
  // HUD dom selection
  hudDom = select('#easycamhud');

  initHUD(hudOptions);

  grid = createGrid(SIZE);
  weightSize = getWeightSize(SIZE)
  print(grid, weightSize);
}

function getWeightSize(size) {
  return D / size;
}
// utility function to get some GL/GLSL/WEBGL information
function getGLInfo() {

  var gl = this._renderer.GL;

  var info = {};
  info.gl = gl;

  var debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  if (debugInfo) {
    info.gpu_renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
    info.gpu_vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
  }
  info.wgl_renderer = gl.getParameter(gl.RENDERER);
  info.wgl_version = gl.getParameter(gl.VERSION);
  info.wgl_glsl = gl.getParameter(gl.SHADING_LANGUAGE_VERSION);
  info.wgl_vendor = gl.getParameter(gl.VENDOR);

  return info;
}

function initHUD() {

  const hudDataStructKeys = HUD_DATA_STRUCT;

  const info = getGLInfo();
  const { gpu_renderer, wgl_version, wgl_glsl } = info;

  const viewParamKeyLabels = hudDataStructKeys[1];
  let fnks = [
    () => { return nfs(frameRate(), 1, 2); },
    () => { return nfs(easycam.getViewport()); },
    () => { return nfs(state.distance, 1, 2); },
    () => { return nfs(state.center, 1, 2); },
    () => { return nfs(state.rotation, 1, 3); },
  ];
  for (let index in viewMeta) {
    let textValue = viewMeta[index];
    print(textValue)
    createElement('li', '...').parent(ulRight);
  }
}
function displayHUD(options) {
  const { minimalView } = options;
  easycam.beginHUD();

  var state = easycam.getState();

  var ul = select('#hud-right');

  // draw screen-aligned rectangles
  var ny = 10;
  var off = 20;
  var rs = (height - off) / ny - off;
  for (var y = 0; y < ny; y++) {
    var r = 255 * y / ny;
    var g = 255 - r;
    var b = r + g;
    var px = width - off - rs;
    var py = off + y * (rs + off);
    noStroke();
    fill(r, g, b);
    rect(px, py, rs, rs);
  }

  easycam.endHUD();
}
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0, 0, windowWidth, windowHeight]);
}


function createGrid(size = 1) {
  const base = Array.from(Array(size).keys());
  return base.map((r, y) => {
    return base.map((c, x) => {
      return { x, y }
    })
  });
}
function drawOrigin() {
  translate(0, 0, 0);
  stroke('red');
  strokeWeight(5);
  point(0, 0);
}

function draw() {
  background(220);


  // projection
  perspective(60 * PI / 180, width / height, 1, 5000);

  // BG
  background(32);

  drawOrigin();

  // gizmo
  strokeWeight(1);
  stroke(255, 32, 0); line(0, 0, 0, 100, 0, 0);
  stroke(32, 255, 32); line(0, 0, 0, 0, 100, 0);
  stroke(0, 32, 255); line(0, 0, 0, 0, 0, 100);

  // objects
  strokeWeight(0.5);
  stroke(0);

  push();
  translate(50, 50, 0);
  fill(255);
  box(50, 50, 25);
  pop();

  push();
  translate(-50, -50, 0);
  fill(255, 0, 128);
  box(50, 50, 25);
  pop();

  push();
  translate(+50, -50, 0);
  fill(0, 128, 255);
  box(50, 50, 25);
  pop();

  push();
  translate(-50, +50, 0);
  rotateX(PI / 2);
  fill(128);
  sphere(30);
  pop();

  // HeadUpDisplay
  displayHUD(hudOptions);

}