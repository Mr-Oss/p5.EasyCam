/* eslint-disable no-unused-vars */

const D = 500;
const SIZE = 1;
const HUD_PROP_TPL = _.template(getTemplateById('tpl-hud-prop'));
const HUD_DATA_STRUCT = [
  ['gpu_renderer',
    'wgl_version',
    'wgl_glsl',
  ],
  [
    'Framerate',
    'Viewport',
    'Distance',
    'Center',
    'Rotation',
  ],
];

let grid; let easycam; let hudStruct;

/**
 * Return hml of embedded template by it's id
 * @param {any} id
 * @return {any}
 */
function getTemplateById(id) {
  return $('#' + id).html();
}

/**
 * Setup WEBGL environment with p5.EasyCamera and debugging HUD
 * @return {void}
 */
function setup() {
  // -- create canvas for WEBGL and EasyCam
  pixelDensity(2);

  createCanvas(D, D, WEBGL);

  setAttributes('antialias', true);
  // -------
  print(Dw.EasyCam.INFO);
  // ------- init EasyCamp and HUD
  easycam = new Dw.EasyCam(this._renderer, {distance: 300});
  // HUD dom selection
  hudDom = select('#easycamhud');
  const state = easycam.getState();
  hudStruct = initHUD(state);
  displayHUD(hudStruct);

  grid = createGrid(SIZE);
}

/**
 * Initialize hud drawing handlers
 * @param {object} state - EasyCam state
 * @return {any}
 */
function initHUD(state) {
  const hudDataStructKeys = HUD_DATA_STRUCT;

  const info = getGLInfo();
  const gpuWglParamKeyLabels = HUD_DATA_STRUCT[0];
  const viewParamKeyLabels = HUD_DATA_STRUCT[1];
  const gpuWglFnks = _.zip(
      gpuWglParamKeyLabels,
      gpuWglParamKeyLabels.map((gpuWglParamKey) => {
        return () => {
          return info[gpuWglParamKey];
        };
      }));
  const viewFnks = _.zip(viewParamKeyLabels, [
    (state) => {
      return nfs(frameRate(), 1, 2);
    },
    (state, easycam) => {
      return nfs(easycam.getViewport());
    },
    (state) => {
      return nfs(state.distance, 1, 2);
    },
    (state) => {
      return nfs(state.center, 1, 2);
    },
    (state) => {
      return nfs(state.rotation, 1, 3);
    },
  ]);
  return gpuWglFnks.concat(viewFnks);
}

// eslint-disable-next-line require-jsdoc
function displayHUD(hudStruct, verbose = false) {
  easycam.beginHUD();

  const state = easycam.getState();
  // update hud DOM
  if (!verbose) hudStruct = hudStruct.slice(3);

  const propsHtml = hudStruct.map((property, index) => {
    const [label, fnk] = property;
    return HUD_PROP_TPL({label, value: fnk(state, easycam)});
  });
  hudDom.elt.innerHTML = propsHtml.join('');
  easycam.endHUD();
}

/**
 * Draw p5 frame
 * @return {void}
 */
function draw() {
  background(220);

  // projection
  perspective(60 * PI / 180, width / height, 1, 5000);

  // BG
  background(32);

  drawOrigin();

  // gizmo
  drawOrientationHelper();

  // objects
  // drawObjects();

  displayIcons();
  // HeadUpDisplay
  displayHUD(hudStruct);
  // weightSize = getWeightSize(SIZE);
  drawGrid(grid);
}
// eslint-disable-next-line require-jsdoc
function drawGenesisCell(cell, c = color(0, 0, 0, 50)) {
  const {x, y, z} = cell;
  fill(c);
  const f = D/ 20;
  translate(x, y, z);
  box(f);
}
// eslint-disable-next-line require-jsdoc
function drawCell(cell, c = color(0, 0, 0, 50)) {
  const {x, y} = cell;
  fill(c);
  const f = D/ 20;
  translate(f, f);
  box(f);
}
// eslint-disable-next-line require-jsdoc
function drawGrid(grid) {
  const genesisCell = {x: 0, y: 0, z: 0};
  // print('Drawing cells!', grid);
  // print('Draw genesis!', genesisCell);
  drawGenesisCell(genesisCell);
  // const g = grid.map((rowS, y) => {
  //   const r = rowS.map((row, ri) => {
  //     row.map((cell, x) => {
  //       // print('cell?', cell);
  //       // drawCell(cell, color(2355, 0, 0));
  //     });
  //   });
  // });
  // return g;
}
/**
  Draw screen aligned rectangles on the right side
 * @return {void}
 */
function displayIcons() {
  easycam.beginHUD();

  const state = easycam.getState();

  // draw screen-aligned rectangles
  const ny = 10;
  const off = 20;
  const rs = (height - off) / ny - off;
  for (let y = 0; y < ny; y++) {
    const r = 255 * y / ny;
    const g = 255 - r;
    const b = r + g;
    const px = width - off - rs;
    const py = off + y * (rs + off);
    noStroke();
    fill(r, g, b);
    rect(px, py, rs, rs);
  }

  easycam.endHUD();
}


// eslint-disable-next-line require-jsdoc
function drawOrientationHelper() {
  strokeWeight(1);
  stroke(255, 32, 0); line(0, 0, 0, 100, 0, 0);
  stroke(255, 32, 0); line(0, 0, 0, -100, 0, 0);
  stroke(32, 255, 32); line(0, 0, 0, 0, 100, 0);
  stroke(32, 255, 32); line(0, 0, 0, 0, -100, 0);
  stroke(0, 32, 255); line(0, 0, 0, 0, 0, 100);
  stroke(0, 32, 255); line(0, 0, 0, 0, 0, -100);
}

// eslint-disable-next-line require-jsdoc
function drawObjects() {
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
}

/**
 * Handle viewport on window resize
 * @return {void}
 */
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  easycam.setViewport([0, 0, windowWidth, windowHeight]);
}

/**
 * Get GL/GLSL/WEBGL information
 * @return {object}
 */
function getGLInfo() {
  const gl = this._renderer.GL;

  const info = {};
  info.gl = gl;

  const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
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

/**
 * Return floored ration of canvas size to defined constant of sections.
 * @param {int} size
 * @return {int}
 */
function getWeightSize(size) {
  switch (size) {
    case 1:
      // normalize for genesis edge case
      size = 10;
      break;
    case 2:
      // normalize for genesis edge case
      size = 5;
      break;
  }

  return Math.floor(D / size);
}


/**
 * Create multi dimensional cubic data structure, based on intupt
 * @param {int} size=1
 * @return {Array<Object>}
 */
function createGrid(size = 1) {
  const base = Array.from(Array(size).keys());
  return base.map((r, y) => {
    return base.map((c, x) => {
      return base.map((d, z)=> {
        return {x: x + 1, y: y + 1, z: z + 1};
      });
    });
  });
}

/**
 * Draw Origin point
 * @return {void}
 */
function drawOrigin() {
  translate(0, 0, 0);
  stroke('red');
  strokeWeight(5);
  point(0, 0);
}
