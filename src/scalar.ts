

/**
 * Scalar as a simple number.
 *
 * Note: Only functions that were required for the EasyCam to work are implemented.
 *
 * @namespace
 */
export const Scalar = {

  /**
   * Linear interpolation between A and B using t[0,1]
   */
  mix: function(a, b, t) {
    return a * (1 - t) + b * t;
  },

  /**
   * modifying t as a function of smoothstep(0,1,t);
   */
  smoothstep: function(x) {
    return x * x * (3 - 2 * x);
  },

  /**
   * modifying t as a function of smootherstep(0,1,t);
   */
  smootherstep: function(t) {
    return x * x * x * (x * (x * 6 - 15) + 10);
  },

};
