/* eslint-disable max-len */
//
// ROTATION (Quaternion)
//
/**
* Rotation as Quaternion [q0, q1, q2, q3]
*
* Note: Only functions that were required for the EasyCam to work
* are implemented.
*
* @namespace
*/

export const Rotation =
{

  assert: function(dst) {
    return ((dst === undefined) || (dst.constructor !== Array)) ? [1, 0, 0, 0] : dst;
  },

  /** @return {Number[]} an identity rotation [1,0,0,0] */
  identity: function() {
    return [1, 0, 0, 0];
  },

  /**
     * Applies the rotation to a vector and returns dst or a new vector.
     *
     * @param {Number[]} rot - Rotation (Quaternion)
     * @param {Number[]} vec - vector to be rotated by rot
     * @param {Number[]} dst - resulting vector
     * @return {Number[]} dst- resulting vector
     */
  applyToVec3: function(rot, vec, dst) {
    const [x, y, z] = vec;
    const [q0, q1, q2, q3] = rot;

    const s = q1 * x + q2 * y + q3 * z;

    dst = Vec3.assert(dst);
    dst[0] = 2 * (q0 * (x * q0 - (q2 * z - q3 * y)) + s * q1) - x;
    dst[1] = 2 * (q0 * (y * q0 - (q3 * x - q1 * z)) + s * q2) - y;
    dst[2] = 2 * (q0 * (z * q0 - (q1 * y - q2 * x)) + s * q3) - z;
    return dst;
  },

  /**
     * Applies the rotation to another rotation and returns dst or a new rotation.
     *
     * @param {Number[]} rotA - RotationA (Quaternion)
     * @param {Number[]} rotB - RotationB (Quaternion)
     * @param {Number[]} dst - resulting rotation
     * @return {Number[]} dst - resulting rotation
     */
  applyToRotation(rotA, rotB, dst) {
    const [a0, a1, a2, a3] = rotA;
    const [b0, b1, b2, b3] = rotB;

    dst = Rotation.assert(dst);
    dst[0] = b0 * a0 - (b1 * a1 + b2 * a2 + b3 * a3);
    dst[1] = b1 * a0 + b0 * a1 + (b2 * a3 - b3 * a2);
    dst[2] = b2 * a0 + b0 * a2 + (b3 * a1 - b1 * a3);
    dst[3] = b3 * a0 + b0 * a3 + (b1 * a2 - b2 * a1);
    return dst;
  },


  /**
     * Interpolates a rotation.
     *
     * @param {Number[]} rotA - RotationA (Quaternion)
     * @param {Number[]} rotB - RotationB (Quaternion)
     * @param {Number  } t - interpolation parameter
     * @param {Number[]} dst - resulting rotation
     * @return {Number[]} dst - resulting rotation
     */
  slerp: function(rotA, rotB, t, dst) {
    const [a0, a1, a2, a3] = rotA;
    let [b0, b1, b2, b3] = rotB;

    let cosTheta = a0 * b0 + a1 * b1 + a2 * b2 + a3 * b3;
    if (cosTheta < 0) {
      b0 = -b0;
      b1 = -b1;
      b2 = -b2;
      b3 = -b3;
      cosTheta = -cosTheta;
    }

    const theta = Math.acos(cosTheta);
    const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);

    let w1; let w2;
    if (sinTheta > 0.001) {
      w1 = Math.sin((1.0 - t) * theta) / sinTheta;
      w2 = Math.sin(t * theta) / sinTheta;
    } else {
      w1 = 1.0 - t;
      w2 = t;
    }

    dst = Rotation.assert(dst);
    dst[0] = w1 * a0 + w2 * b0;
    dst[1] = w1 * a1 + w2 * b1;
    dst[2] = w1 * a2 + w2 * b2;
    dst[3] = w1 * a3 + w2 * b3;

    return Rotation.create({rotation: dst, normalize: true}, dst);
  },

  /**
     * Creates/Initiates a new Rotation
     *
     * <pre>
     *
     *    1) Axis,Angle:
     *       {
     *         axis : [x, y, z],
     *         angle: double
     *       }
     *
     *    2) Another Rotation:
     *       {
     *         rotation : [q0, q1, q2, q3],
     *         normalize: boolean
     *       }
     *
     *    3) 3 euler angles, XYZ-order:
     *       {
     *         angles_xyz : [rX, rY, rZ]
     *       }
     *
     * </pre>
     *
     *
     * @param {Object} def - Definition, for creating the new Rotation
     * @param {Number[]} dst - resulting rotation
     * @return {Number[]} dst - resulting rotation
     */
  create: function(def, dst) {
    dst = Rotation.assert(dst);

    // 1) from axis and angle
    if (def.axis) {
      const axis = def.axis;
      const angle = def.angle;

      const norm = Vec3.mag(axis);
      if (norm == 0.0) return; // vector is of zero length

      const halfAngle = -0.5 * angle;
      const coeff = Math.sin(halfAngle) / norm;

      dst[0] = Math.cos(halfAngle);
      dst[1] = coeff * axis[0];
      dst[2] = coeff * axis[1];
      dst[3] = coeff * axis[2];
      return dst;
    }

    // 2) from another rotation
    if (def.rotation) {
      dst[0] = def.rotation[0];
      dst[1] = def.rotation[1];
      dst[2] = def.rotation[2];
      dst[3] = def.rotation[3];

      if (def.normalize) {
        const inv = 1.0 / Math.sqrt(dst[0] * dst[0] + dst[1] * dst[1] + dst[2] * dst[2] + dst[3] * dst[3]);
        dst[0] *= inv;
        dst[1] *= inv;
        dst[2] *= inv;
        dst[3] *= inv;
      }

      return dst;
    }

    // 3) from 3 euler angles, order XYZ
    if (def.angles_xyz) {
      const ax = -0.5 * def.angles_xyz[0];
      const ay = -0.5 * def.angles_xyz[1];
      const az = -0.5 * def.angles_xyz[2];

      const rotX = [Math.cos(ax), Math.sin(ax), 0, 0];
      const rotY = [Math.cos(ay), 0, Math.sin(ay), 0];
      const rotZ = [Math.cos(az), 0, 0, Math.sin(az)];

      Rotation.applyToRotation(rotY, rotZ, dst);
      Rotation.applyToRotation(rotX, dst, dst);

      return dst;
    }
  },


  //
  // ... to be continued ...
  //

};
