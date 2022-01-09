
// /**
//  * @submodule Camera
//  * @for p5
//  */

// if (p5) {
//   /**
//      * p5.EasyCam creator function.
//      * Arguments are optional, and equal to the default EasyCam constructor.
//      * @return {EasyCam} a new EasyCam
//      */
//   p5.prototype.createEasyCam = function(/* p5.RendererGL, {state} */) {
//     let renderer = this._renderer;
//     let args = arguments[0];

//     if (arguments[0] instanceof p5.RendererGL) {
//       renderer = arguments[0];
//       args = arguments[1]; // could still be undefined, which is fine
//     }

//     return new Dw.EasyCam(renderer, args);
//   };
// }
