import p5 from 'p5';
import {Rotation} from './rotation';

/*
 *
 * The p5.EasyCam library - Easy 3D CameraControl for p5.js and WEBGL.
 *
 *   Copyright © 2017-2021 by p5.EasyCam authors
 *
 *   Source: https://github.com/freshfork/p5.EasyCam
 *
 *   MIT License: https://opensource.org/licenses/MIT
 *
 *
 * explanatory notes:
 *
 * p5.EasyCam is a derivative
 * of the original PeasyCam Library by Jonathan Feinberg
 * and combines new useful features with the great look and feel of its parent.
 *
 */

interface EasyCamOptions {
    // define default options
    distance? : number;
    center? : Array<number>;
    rotation? : any; // TODO: expected Rotation.identity()
    viewport? : Array<number>;
    offset? : Array<number>;
}
// the value is relevant only at construction time, therefore it is immutable
const defaultOptions : EasyCamOptions= {
  // define default options
  distance: 500,
  center: [0, 0, 0],
  rotation: Rotation.identity(),
  viewport: [0, 0, renderer.width, renderer.height],
  offset: [bounds.x + window.scrollX, bounds.y + window.scrollY],
  // TODO: how do we handle outer contexts?
};

export class EasyCam {
  bound:any;
  LOOK:Array<number> = [0, 0, 1];
  UP:Array<number> = [0, 1, 0];
  YAW:number = 0x01;
  PITCH:number = 0x02;
  ROLL:number = 0x04;
  AXIS: object;

  renderer:any;
  graphics:any;
  P5: any;

  constructor(
      renderer: p5.RendererGL,
      options: EasyCamOptions = defaultOptions) {
    bounds = renderer.elt.getBoundingClientRect();
    this.setCanvas(renderer);

    // TODO: do we need that in ts?
    // self reference
    const cam = this;
    this.cam = cam;
    // principal axes flags
    this.AXIS = {
      YAW,
      PITCH,
      ROLL,
      ALL: YAW | PITCH | ROLL,
    };
  }

  /**
   * sets the WEBGL renderer the camera is working on
   *
   * @param {p5.RendererGL} renderer ... p5 WEBGL renderer
   */
  setCanvas(renderer: p5.RendererGL): void {
    // p5js seems to be not very clear about this
    // ... a bit confusing, so i guess this could change in future releases
    this.renderer = renderer;
    if (renderer._pInst instanceof p5) {
      this.graphics = renderer;
    } else {
      this.graphics = renderer._pInst;
    }
    this.P5 = this.graphics._pInst;
  }

  /** @return {p5.RendererGL} the currently used renderer */
  getCanvas() {
    return this.renderer;
  }
}
