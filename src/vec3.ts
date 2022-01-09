
import {Scalar} from './scalar';
/**
 * Vec3 as a 3D vector (Array)
 *
 * @namespace
 */
export const Vec3 =
 {

   assert: function(dst) {
     return ((dst === undefined) || (dst.constructor !== Array)) ? [0, 0, 0] : dst;
   },

   isScalar: function(arg) {
     // TODO: do some profiling to figure out what fails
     return (arg !== undefined) && (arg.constructor !== Array);
     // return typeof(arg) === 'number';
   },

   /** addition: <pre> dst = a + b </pre>  */
   add: function(a, b, dst) {
     dst = this.assert(dst);
     if (this.isScalar(b)) {
       dst[0] = a[0] + b;
       dst[1] = a[1] + b;
       dst[2] = a[2] + b;
     } else {
       dst[0] = a[0] + b[0];
       dst[1] = a[1] + b[1];
       dst[2] = a[2] + b[2];
     }
     return dst;
   },

   /** componentwise multiplication: <pre> dst = a * b </pre>  */
   mult: function(a, b, dst) {
     dst = this.assert(dst);
     if (this.isScalar(b)) {
       dst[0] = a[0] * b;
       dst[1] = a[1] * b;
       dst[2] = a[2] * b;
     } else {
       dst[0] = a[0] * b[0];
       dst[1] = a[1] * b[1];
       dst[2] = a[2] * b[2];
     }
     return dst;
   },

   /** squared length  */
   magSq: function(a) {
     return a[0] * a[0] + a[1] * a[1] + a[2] * a[2];
   },

   /** length  */
   mag: function(a) {
     return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
   },

   /** dot-product  */
   dot: function(a, b) {
     return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
   },

   /** cross-product  */
   cross: function(a, b, dst) {
     dst = this.assert(dst);
     dst[0] = a[1] * b[2] - a[2] * b[1];
     dst[1] = a[2] * b[0] - a[0] * b[2];
     dst[2] = a[0] * b[1] - a[1] * b[0];
     return dst;
   },

   /** angle  */
   angle: function(v1, v2) {
     const normProduct = this.mag(v1) * this.mag(v2);
     if (normProduct === 0.0) {
       return 0.0; // at least one vector is of zero length
     }

     const dot = this.dot(v1, v2);
     const threshold = normProduct * 0.9999;
     if ((dot < -threshold) || (dot > threshold)) {
       // the vectors are almost aligned, compute using the sine
       const v3 = this.cross(v1, v2);
       if (dot >= 0) {
         return Math.asin(this.mag(v3) / normProduct);
       } else {
         return Math.PI - Math.asin(this.mag(v3) / normProduct);
       }
     }

     // the vectors are sufficiently separated to use the cosine
     return Math.acos(dot / normProduct);
   },

   /** linear interpolation: <pre> dst = a * (1 - t) + b * t </pre> */
   mix(a, b, t, dst) {
     dst = this.assert(dst);
     dst[0] = Scalar.mix(a[0], b[0], t);
     dst[1] = Scalar.mix(a[1], b[1], t);
     dst[2] = Scalar.mix(a[2], b[2], t);
     return dst;
   },


   //
   // ... to be continued ...
   //

 };
