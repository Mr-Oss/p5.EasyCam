/* eslint-disable max-len */
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




/** @namespace  */
const Dw = (function(ext) {
  /**
 * EasyCam
 *
 * <pre>
 *
 *   new Dw.EasyCam(p5.RendererGL, {
 *     distance : z,                 // scalar
 *     center   : [x, y, z],         // vector
 *     rotation : [q0, q1, q2, q3],  // quaternion
 *     viewport : [x, y, w, h],      // array
 *   }
 *
 * </pre>
 *
 * @param {p5.RendererGL} renderer - p5 WEBGL renderer
 * @param {Object}        args     - {distance, center, rotation, viewport}
 *
 */
  class EasyCam {
    /**
   * @constructor
   */
    constructor(renderer, args) {
      // mouse action constraints
      this.SHIFT_CONSTRAINT = 0; // applied when pressing the shift key
      this.FIXED_CONSTRAINT = 0; // applied, when set by user and SHIFT_CONSTRAINT is 0
      this.DRAG_CONSTRAINT = 0; // depending on SHIFT_CONSTRAINT and FIXED_CONSTRAINT, default is ALL

      // mouse action speed
      this.scaleRotation = 0.001;
      this.scalePan = 0.0002;
      this.scaleZoom = 0.001;
      this.scaleZoomwheel = 20.0;

      // zoom limits
      this.distanceMinLimit = 0.01;
      this.distanceMin = 1.0;
      this.distanceMax = Number.MAX_VALUE;

      // main state
      this.state = {
        distance: args.distance, // scalar
        center: args.center.slice(), // vec3
        rotation: args.rotation.slice(), // quaternion

        copy: function(dst) {
          dst = dst || {};
          dst.distance = this.distance;
          dst.center = this.center.slice();
          dst.rotation = this.rotation.slice();
          return dst;
        },
      };

      // backup-state at start
      this.state_reset = this.state.copy();
      // backup-state, probably not required
      this.state_pushed = this.state.copy();

      // viewport for the mouse-pointer [x,y,w,h]
      this.viewport = args.viewport.slice();

      // offset of the canvas in the container
      this.offset = args.offset.slice();

      // add a handler for window resizing
      window.addEventListener('resize', function(e) {
        const p = renderer.elt.getBoundingClientRect();
        cam.offset = [p.x + window.scrollX, p.y + window.scrollY];
      });

      // mouse/touch/key action handler
      this.mouse = {

        cam: cam,

        curr: [0, 0, 0],
        prev: [0, 0, 0],
        dist: [0, 0, 0],
        mwheel: 0,

        isPressed: false, // true if (istouchdown || ismousedown)
        istouchdown: false, // true, if input came from a touch
        ismousedown: false, // true, if input came from a mouse

        BUTTON: {LMB: 0x01, MMB: 0x02, RMB: 0x04},

        button: 0,

        mouseDragLeft: cam.mouseDragRotate.bind(cam),
        mouseDragCenter: cam.mouseDragPan.bind(cam),
        mouseDragRight: cam.mouseDragZoom.bind(cam),
        mouseWheelAction: cam.mouseWheelZoom.bind(cam),

        touchmoveSingle: cam.mouseDragRotate.bind(cam),
        touchmoveMulti: function() {
          cam.mouseDragPan();
          cam.mouseDragZoom();
        },


        insideViewport: function(x, y) {
          const x0 = cam.viewport[0]; const x1 = x0 + cam.viewport[2];
          const y0 = cam.viewport[1]; const y1 = y0 + cam.viewport[3];
          return (x > x0) && (x < x1) && (y > y0) && (y < y1);
        },

        solveConstraint: function() {
          const dx = this.dist[0];
          const dy = this.dist[1];

          // YAW, PITCH
          if (this.shiftKey && !cam.SHIFT_CONSTRAINT && Math.abs(dx - dy) > 1) {
            cam.SHIFT_CONSTRAINT = Math.abs(dx) > Math.abs(dy) ? cam.AXIS.YAW : cam.AXIS.PITCH;
          }

          // define constraint by increasing priority
          cam.DRAG_CONSTRAINT = cam.AXIS.ALL;
          if (cam.FIXED_CONSTRAINT) cam.DRAG_CONSTRAINT = cam.FIXED_CONSTRAINT;
          if (cam.SHIFT_CONSTRAINT) cam.DRAG_CONSTRAINT = cam.SHIFT_CONSTRAINT;
        },

        updateInput: function(x, y, z) {
          const mouse = cam.mouse;
          const pd = cam.P5.pixelDensity();

          mouse.prev[0] = mouse.curr[0];
          mouse.prev[1] = mouse.curr[1];
          mouse.prev[2] = mouse.curr[2];

          mouse.curr[0] = x;
          mouse.curr[1] = y;
          mouse.curr[2] = z;

          mouse.dist[0] = -(mouse.curr[0] - mouse.prev[0]) / pd;
          mouse.dist[1] = -(mouse.curr[1] - mouse.prev[1]) / pd;
          mouse.dist[2] = -(mouse.curr[2] - mouse.prev[2]) / pd;
        },


        // ////////////////////////////////////////////////////////////////////////
        // mouseinput
        // ////////////////////////////////////////////////////////////////////////

        mousedown: function(event) {
          const mouse = cam.mouse;
          // Account for canvas shift:
          const offX = cam.offset[0] - window.scrollX;
          const offY = cam.offset[1] - window.scrollY;

          if (event.button === 0) mouse.button |= mouse.BUTTON.LMB;
          if (event.button === 1) mouse.button |= mouse.BUTTON.MMB;
          if (event.button === 2) mouse.button |= mouse.BUTTON.RMB;

          if (mouse.insideViewport(event.x - offX, event.y - offY)) {
            mouse.updateInput(event.x - offX, event.y - offY, event.y - offY);
            mouse.ismousedown = mouse.button > 0;
            mouse.isPressed = mouse.ismousedown;
            cam.SHIFT_CONSTRAINT = 0;
          }
        },

        mousedrag: function() {
          const mouse = cam.mouse;
          if (mouse.ismousedown) {
            const x = cam.P5.mouseX;
            const y = cam.P5.mouseY;
            const z = y;

            mouse.updateInput(x, y, z);
            mouse.solveConstraint();

            const LMB = mouse.button & mouse.BUTTON.LMB;
            const MMB = mouse.button & mouse.BUTTON.MMB;
            const RMB = mouse.button & mouse.BUTTON.RMB;

            if (LMB && mouse.mouseDragLeft) mouse.mouseDragLeft();
            if (MMB && mouse.mouseDragCenter) mouse.mouseDragCenter();
            if (RMB && mouse.mouseDragRight) mouse.mouseDragRight();
          }
        },

        mouseup: function(event) {
          const mouse = cam.mouse;

          if (event.button === 0) mouse.button &= ~mouse.BUTTON.LMB;
          if (event.button === 1) mouse.button &= ~mouse.BUTTON.MMB;
          if (event.button === 2) mouse.button &= ~mouse.BUTTON.RMB;

          mouse.ismousedown = mouse.button > 0;
          mouse.isPressed = (mouse.istouchdown || mouse.ismousedown);
          cam.SHIFT_CONSTRAINT = 0;
        },

        dblclick: function(event) {
          // Account for canvas shift:
          const offX = cam.offset[0] - window.scrollX;
          const offY = cam.offset[1] - window.scrollY;

          if (cam.mouse.insideViewport(event.x - offX, event.y - offY)) {
            cam.reset();
          }
        },

        wheel: function(event) {
          const x = event.x;
          const y = event.y;
          const mouse = cam.mouse;
          if (mouse.insideViewport(x, y)) {
            mouse.mwheel = event.deltaY * 0.01;
            if (mouse.mouseWheelAction) mouse.mouseWheelAction();
          }
        },


        // ////////////////////////////////////////////////////////////////////////
        // touchinput
        // ////////////////////////////////////////////////////////////////////////

        evaluateTouches: function(event) {
          const touches = event.touches;
          let avgX = 0.0;
          let avgY = 0.0;
          let avgD = 0.0;
          let i; let dx; let dy; const count = touches.length;
          // Account for canvas shift:
          const offX = cam.offset[0] - window.scrollX;
          const offY = cam.offset[1] - window.scrollY;

          // center, averaged touch position
          for (i = 0; i < count; i++) {
            avgX += touches[i].clientX - offX;
            avgY += touches[i].clientY - offY;
          }
          avgX /= count;
          avgY /= count;

          // offset, mean distance to center
          for (i = 0; i < count; i++) {
            dx = avgX - (touches[i].clientX - offX);
            dy = avgY - (touches[i].clientY - offY);
            avgD += Math.sqrt(dx * dx + dy * dy);
          }
          avgD /= count;

          cam.mouse.updateInput(avgX, avgY, -avgD);
        },


        touchstart: function(event) {
          event.preventDefault();
          event.stopPropagation();

          const mouse = cam.mouse;

          mouse.evaluateTouches(event);
          mouse.istouchdown = mouse.insideViewport(mouse.curr[0], mouse.curr[1]);
          mouse.isPressed = (cam.mouse.istouchdown || cam.mouse.ismousedown);

          mouse.dbltap(event);
        },

        touchmove: function(event) {
          event.preventDefault();
          event.stopPropagation();

          const mouse = cam.mouse;

          if (mouse.istouchdown) {
            mouse.evaluateTouches(event);
            mouse.solveConstraint();

            if (event.touches.length === 1) {
              mouse.touchmoveSingle();
            } else {
              mouse.touchmoveMulti();
              mouse.tapcount = 0;
            }
          }
        },

        touchend: function(event) {
          event.preventDefault();
          event.stopPropagation();

          const mouse = cam.mouse;

          mouse.istouchdown = false,
          mouse.isPressed = (mouse.istouchdown || mouse.ismousedown);
          cam.SHIFT_CONSTRAINT = 0;

          if (mouse.tapcount >= 2) {
            if (mouse.insideViewport(mouse.curr[0], mouse.curr[1])) {
              cam.reset();
            }
            mouse.tapcount = 0;
          }
        },


        tapcount: 0,

        dbltap: function(event) {
          if (cam.mouse.tapcount++ == 0) {
            setTimeout(function() {
              cam.mouse.tapcount = 0;
            }, 350);
          }
        },


        // ////////////////////////////////////////////////////////////////////////
        // keyingput
        // ////////////////////////////////////////////////////////////////////////

        // key-event for shift constraints
        shiftKey: false,

        keydown: function(event) {
          const mouse = cam.mouse;
          if (!mouse.shiftKey) {
            mouse.shiftKey = (event.keyCode === 16);
          }
        },

        keyup: function(event) {
          const mouse = cam.mouse;
          if (mouse.shiftKey) {
            mouse.shiftKey = (event.keyCode !== 16);
            if (!mouse.shiftKey) {
              cam.SHIFT_CONSTRAINT = 0;
            }
          }
        },

      };


      // camera mouse listeners
      this.attachMouseListeners();

      // P5 registered callbacks, TODO unregister on dispose
      this.auto_update = true;
      this.P5.registerMethod('pre', function() {
        if (cam.auto_update) {
          cam.update();
        }
      });

      // damped camera transition
      this.dampedZoom = new DampedAction(function(d) {
        cam.zoom(d * cam.getZoomMult());
      });
      this.dampedPanX = new DampedAction(function(d) {
        cam.panX(d * cam.getPanMult());
      });
      this.dampedPanY = new DampedAction(function(d) {
        cam.panY(d * cam.getPanMult());
      });
      this.dampedRotX = new DampedAction(function(d) {
        cam.rotateX(d * cam.getRotationMult());
      });
      this.dampedRotY = new DampedAction(function(d) {
        cam.rotateY(d * cam.getRotationMult());
      });
      this.dampedRotZ = new DampedAction(function(d) {
        cam.rotateZ(d * cam.getRotationMult());
      });

      // interpolated camera transition
      this.timedRot = new Interpolation(cam.setInterpolatedRotation.bind(cam));
      this.timedPan = new Interpolation(cam.setInterpolatedCenter.bind(cam));
      this.timedzoom = new Interpolation(cam.setInterpolatedDistance.bind(cam));
    }


    attachListener(el, ev, fx, op) {
      if (!el || (el === fx.el)) {
        return;
      }

      this.detachListener(fx);

      fx.el = el;
      fx.ev = ev;
      fx.op = op;
      fx.el.addEventListener(fx.ev, fx, fx.op);
    }

    detachListener(fx) {
      if (fx.el) {
        fx.el.removeEventListener(fx.ev, fx, fx.op);
        fx.el = undefined;
      }
    }

    /** attaches input-listeners (mouse, touch, key) to the used renderer */
    attachMouseListeners(renderer) {
      const cam = this.cam;
      const mouse = cam.mouse;

      renderer = renderer || cam.renderer;
      if (renderer) {
        const op = {passive: false};
        const el = renderer.elt;

        cam.attachListener(el, 'mousedown', mouse.mousedown, op);
        cam.attachListener(el, 'mouseup', mouse.mouseup, op);
        cam.attachListener(el, 'dblclick', mouse.dblclick, op);
        cam.attachListener(el, 'wheel', mouse.wheel, op);
        cam.attachListener(el, 'touchstart', mouse.touchstart, op);
        cam.attachListener(el, 'touchend', mouse.touchend, op);
        cam.attachListener(el, 'touchmove', mouse.touchmove, op);
        cam.attachListener(window, 'keydown', mouse.keydown, op);
        cam.attachListener(window, 'keyup', mouse.keyup, op);
      }
    }

    /** detaches all attached input-listeners */
    removeMouseListeners() {
      const cam = this.cam;
      const mouse = cam.mouse;

      cam.detachListener(mouse.mousedown);
      cam.detachListener(mouse.mouseup);
      cam.detachListener(mouse.dblclick);
      cam.detachListener(mouse.wheel);
      cam.detachListener(mouse.keydown);
      cam.detachListener(mouse.keyup);
      cam.detachListener(mouse.touchstart);
      cam.detachListener(mouse.touchend);
      cam.detachListener(mouse.touchmove);
    }

    /** Disposes/releases the camera. */
    dispose() {
      // TODO: p5 unregister 'pre', ... not available in 0.5.16
      removeMouseListeners();
    }

    /** @return {boolean} the current autoUpdate state */
    getAutoUpdate() {
      return this.auto_update;
    }
    /**
   * If true, the EasyCam will update automatically in a pre-draw step.
   * This updates the camera state and updates the renderers
   * modelview/camera matrix.
   *
   * If false, the update() needs to be called manually.
   *
   * @param {boolean} the new autoUpdate state
   */
    setAutoUpdate(status) {
      this.auto_update = status;
    }


    /**
   * Updates the camera state (interpolated / damped animations) and updates
   * the renderers' modelview/camera matrix.
   *
   * if "auto_update" is true, this is called automatically in a pre-draw call.
   */
    update() {
      const cam = this.cam;
      const mouse = cam.mouse;

      mouse.mousedrag();

      let bUpdate = false;
      bUpdate |= cam.dampedZoom.update();
      bUpdate |= cam.dampedPanX.update();
      bUpdate |= cam.dampedPanY.update();
      bUpdate |= cam.dampedRotX.update();
      bUpdate |= cam.dampedRotY.update();
      bUpdate |= cam.dampedRotZ.update();

      // interpolated actions have lower priority then damped actions
      if (bUpdate) {
        cam.timedRot.stop();
        cam.timedPan.stop();
        cam.timedzoom.stop();
      } else {
        cam.timedRot.update();
        cam.timedPan.update();
        cam.timedzoom.update();
      }

      cam.apply();
    }

    /**
   * Applies the current camera state to the renderers' modelview/camera matrix.
   * If no argument is given, then the cameras currently set renderer is used.
   */
    apply(renderer) {
      const cam = this.cam;
      renderer = renderer || cam.renderer;

      if (renderer) {
        this.camEYE = this.getPosition(this.camEYE);
        this.camLAT = this.getCenter(this.camLAT);
        this.camRUP = this.getUpVector(this.camRUP);

        if (undefined === renderer._curCamera) {
          renderer.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2],
              this.camLAT[0], this.camLAT[1], this.camLAT[2],
              this.camRUP[0], this.camRUP[1], this.camRUP[2]);
        } else {
          renderer._curCamera.camera(this.camEYE[0], this.camEYE[1], this.camEYE[2],
              this.camLAT[0], this.camLAT[1], this.camLAT[2],
              this.camRUP[0], this.camRUP[1], this.camRUP[2]);
        }
      }
    }


    /** @param {int[]} the new viewport-def, as [x,y,w,h] */
    setViewport(viewport) {
      this.viewport = viewport.slice();
    }

    /** @return {int[]} the current viewport-def, as [x,y,w,h] */
    getViewport() {
      return this.viewport;
    }


    //
    // mouse state changes
    //

    /** implemented zoom-cb for mouswheel handler.*/
    mouseWheelZoom() {
      const cam = this;
      const mouse = cam.mouse;
      cam.dampedZoom.addForce(mouse.mwheel * cam.scaleZoomwheel);
    }

    /** implemented zoom-cb for mousedrag/touch handler.*/
    mouseDragZoom() {
      const cam = this;
      const mouse = cam.mouse;
      cam.dampedZoom.addForce(-mouse.dist[2]);
    }

    /** implemented pan-cb for mousedrag/touch handler.*/
    mouseDragPan() {
      const cam = this;
      const mouse = cam.mouse;

      cam.dampedPanX.addForce((cam.DRAG_CONSTRAINT & cam.AXIS.YAW) ? mouse.dist[0] : 0);
      cam.dampedPanY.addForce((cam.DRAG_CONSTRAINT & cam.AXIS.PITCH) ? mouse.dist[1] : 0);
    }

    /** implemented rotate-cb for mousedrag/touch handler.*/
    mouseDragRotate() {
      const cam = this;
      const mouse = cam.mouse;

      const mx = mouse.curr[0]; const my = mouse.curr[1];
      const dx = mouse.dist[0]; const dy = mouse.dist[1];

      // mouse [-1, +1]
      const mxNdc = Math.min(Math.max((mx - cam.viewport[0]) / cam.viewport[2], 0), 1) * 2 - 1;
      const myNdc = Math.min(Math.max((my - cam.viewport[1]) / cam.viewport[3], 0), 1) * 2 - 1;

      if (cam.DRAG_CONSTRAINT & cam.AXIS.YAW) {
        cam.dampedRotY.addForce(+dx * (1.0 - myNdc * myNdc));
      }
      if (cam.DRAG_CONSTRAINT & cam.AXIS.PITCH) {
        cam.dampedRotX.addForce(-dy * (1.0 - mxNdc * mxNdc));
      }
      if (cam.DRAG_CONSTRAINT & cam.AXIS.ROLL) {
        cam.dampedRotZ.addForce(-dx * myNdc);
        cam.dampedRotZ.addForce(+dy * mxNdc);
      }
    }


    //
    // damped multipliers
    //
    /** (private) returns the used zoom -multiplier for damped actions. */
    getZoomMult() {
      return this.state.distance * this.scaleZoom;
    }
    /** (private) returns the used pan-multiplier for damped actions. */
    getPanMult() {
      return this.state.distance * this.scalePan;
    }
    /** (private) returns the used rotate-multiplier for damped actions. */
    getRotationMult() {
      return Math.pow(Math.log10(1 + this.state.distance), 0.5) * this.scaleRotation;
    }


    //
    // damped state changes
    //
    /** Applies a change to the current zoom.  */
    zoom(dz) {
      const cam = this.cam;
      let distanceTmp = cam.state.distance + dz;

      // check lower bound
      if (distanceTmp < cam.distance_min) {
        distanceTmp = cam.distance_min;
        cam.dampedZoom.stop();
      }

      // check upper bound
      if (distanceTmp > cam.distance_max) {
        distanceTmp = cam.distance_max;
        cam.dampedZoom.stop();
      }

      cam.state.distance = distanceTmp;
    }

    /** Applies a change to the current pan-xValue.  */
    panX(dx) {
      const state = this.cam.state;
      if (dx) {
        const val = Rotation.applyToVec3(state.rotation, [dx, 0, 0]);
        Vec3.add(state.center, val, state.center);
      }
    }

    /** Applies a change to the current pan-yValue.  */
    panY(dy) {
      const state = this.cam.state;
      if (dy) {
        const val = Rotation.applyToVec3(state.rotation, [0, dy, 0]);
        Vec3.add(state.center, val, state.center);
      }
    }

    /** Applies a change to the current pan-value.  */
    pan(dx, dy) {
      this.cam.panX(dx);
      this.cam.panY(dx);
    }

    /** Applies a change to the current xRotation.  */
    rotateX(rx) {
      this.cam.rotate([1, 0, 0], rx);
    }

    /** Applies a change to the current yRotation.  */
    rotateY(ry) {
      this.cam.rotate([0, 1, 0], ry);
    }

    /** Applies a change to the current zRotation.  */
    rotateZ(rz) {
      this.cam.rotate([0, 0, 1], rz);
    }

    /** Applies a change to the current rotation, using the given axis/angle.  */
    rotate(axis, angle) {
      const state = this.cam.state;
      if (angle) {
        const newRotation = Rotation.create({axis: axis, angle: angle});
        Rotation.applyToRotation(state.rotation, newRotation, state.rotation);
      }
    }


    //
    // interpolated states
    //
    /** Sets the new camera-distance, interpolated (t) between given A and B. */
    setInterpolatedDistance(valA, valB, t) {
      this.cam.state.distance = Scalar.mix(valA, valB, Scalar.smoothstep(t));
    }
    /** Sets the new camera-center, interpolated (t) between given A and B. */
    setInterpolatedCenter(valA, valB, t) {
      this.cam.state.center = Vec3.mix(valA, valB, Scalar.smoothstep(t));
    }
    /** Sets the new camera-rotation, interpolated (t) between given A and B. */
    setInterpolatedRotation(valA, valB, t) {
      this.cam.state.rotation = Rotation.slerp(valA, valB, t);
    }


    //
    // DISTANCE
    //
    /** Sets the minimum camera distance. */
    setDistanceMin(distanceMin) {
      this.distanceMin = Math.max(distanceMin, this.distanceMinLimit);
      this.zoom(0); // update, to ensure new minimum
    }

    /** Sets the maximum camera distance. */
    setDistanceMax(distanceMax) {
      this.distanceMax = distanceMax;
      this.zoom(0); // update, to ensure new maximum
    }

    /**
   * Sets the new camera distance.
   *
   * @param {double} new distance.
   * @param {long} animation time in millis.
   */
    setDistance(distance, duration) {
      this.timedzoom.start(this.state.distance, distance, duration, [this.dampedZoom]);
    }

    /** @return {double} the current camera distance. */
    getDistance() {
      return this.state.distance;
    }


    //
    // CENTER / LOOK AT
    //
    /**
   * Sets the new camera center.
   *
   * @param {double[]} new center.
   * @param {long} animation time in millis.
   */
    setCenter(center, duration) {
      this.timedPan.start(this.state.center, center, duration, [this.dampedPanX, this.dampedPanY]);
    }

    /** @return {double[]} the current camera center. */
    getCenter() {
      return this.state.center;
    }


    //
    // ROTATION
    //
    /**
   * Sets the new camera rotation (quaternion).
   *
   * @param {double[]} new rotation as quat[q0,q1,q2,q3].
   * @param {long} animation time in millis.
   */
    setRotation(rotation, duration) {
      this.timedRot.start(this.state.rotation, rotation, duration, [this.dampedRotX, this.dampedRotY, this.dampedRotZ]);
    }

    /** @return {double[]} the current camera rotation as quat[q0,q1,q2,q3]. */
    getRotation() {
      return this.state.rotation;
    }


    //
    // CAMERA POSITION/EYE
    //
    /** @return {double[]} the current camera position, aka. the eye position. */
    getPosition(dst) {
      const cam = this.cam;
      const state = cam.state;

      dst = Vec3.assert(dst);
      Rotation.applyToVec3(state.rotation, cam.LOOK, dst);
      Vec3.mult(dst, state.distance, dst);
      Vec3.add(dst, state.center, dst);

      return dst;
    }

    //
    // CAMERA UP
    //
    /** @return {double[]} the current camera up vector. */
    getUpVector(dst) {
      const cam = this.cam;
      const state = cam.state;
      dst = Vec3.assert(dst);
      Rotation.applyToVec3(state.rotation, cam.UP, dst);
      return dst;
    }


    //
    // STATE (rotation, center, distance)
    //
    /** @return {Object} a copy of the camera state {distance,center,rotation} */
    getState() {
      return this.state.copy();
    }
    /**
   * @param {Object} a new camera state {distance,center,rotation}.
   * @param {long} animation time in millis.
   */
    setState(other, duration) {
      if (other) {
        this.setDistance(other.distance, duration);
        this.setCenter(other.center, duration);
        this.setRotation(other.rotation, duration);
      }
    }

    pushState() {
      return (this.state_pushed = this.getState());
    }
    popState(duration) {
      this.setState(this.state_pushed, duration);
    }

    /** sets the current state as reset-state. */
    pushResetState() {
      return (this.state_reset = this.getState());
    }
    /** resets the camera, by applying the reset-state. */
    reset(duration) {
      this.setState(this.state_reset, duration);
    }


    /** sets the rotation scale/speed. */
    setRotationScale(scaleRotation) {
      this.scaleRotation = scaleRotation;
    }
    /** sets the pan scale/speed. */
    setPanScale(scalePan) {
      this.scalePan = scalePan;
    }
    /** sets the zoom scale/speed. */
    setZoomScale(scaleZoom) {
      this.scaleZoom = scaleZoom;
    }
    /** sets the wheel scale/speed. */
    setWheelScale(wheelScale) {
      this.scaleZoomwheel = wheelScale;
    }
    /** @return the rotation scale/speed. */
    getRotationScale() {
      return this.scaleRotation;
    }
    /** @return the pan scale/speed. */
    getPanScale() {
      return this.scalePan;
    }
    /** @return the zoom scale/speed. */
    getZoomScale() {
      return this.scaleZoom;
    }
    /** @return the wheel scale/speed. */
    getWheelScale() {
      return this.scaleZoomwheel;
    }

    /** sets the default damping scale/speed. */
    setDamping(damping) {
      this.dampedZoom.damping = damping;
      this.dampedPanX.damping = damping;
      this.dampedPanY.damping = damping;
      this.dampedRotX.damping = damping;
      this.dampedRotY.damping = damping;
      this.dampedRotZ.damping = damping;
    }
    /** sets the default interpolation time in millis. */
    setDefaultInterpolationTime(duration) {
      this.timedRot.default_duration = duration;
      this.timedPan.default_duration = duration;
      this.timedzoom.default_duration = duration;
    }


    /**
   * sets the rotation constraint for each axis separately.
   *
   * @param {boolean} yaw constraint
   * @param {boolean} pitch constraint
   * @param {boolean} roll constraint
   */
    setRotationConstraint(yaw, pitch, roll) {
      const cam = this.cam;
      cam.FIXED_CONSTRAINT = 0;
      cam.FIXED_CONSTRAINT |= yaw ? cam.AXIS.YAW : 0;
      cam.FIXED_CONSTRAINT |= pitch ? cam.AXIS.PITCH : 0;
      cam.FIXED_CONSTRAINT |= roll ? cam.AXIS.ROLL : 0;
    }


    /**
   *
   * begin screen-aligned 2D-drawing.
   *
   * <pre>
   * beginHUD()
   *   disabled depth test
   *   ortho
   *   ... your code is executed here ...
   * endHUD()
   * </pre>
   *
   */
    beginHUD(renderer, w, h) {
      const cam = this.cam;
      renderer = renderer || cam.renderer;

      if (!renderer) return;
      this.pushed_rendererState = renderer.push();

      const gl = renderer.drawingContext;
      w = (w !== undefined) ? w : renderer.width;
      h = (h !== undefined) ? h : renderer.height;
      const d = Number.MAX_VALUE;

      gl.flush();
      // gl.finish();

      // 1) disable DEPTH_TEST
      gl.disable(gl.DEPTH_TEST);
      // 2) push modelview/projection
      //    p5 is not creating a push/pop stack
      this.pushed_uMVMatrix = renderer.uMVMatrix.copy();
      this.pushed_uPMatrix = renderer.uPMatrix.copy();

      // 3) set new modelview (identity)
      renderer.resetMatrix();
      // 4) set new projection (ortho)
      renderer._curCamera.ortho(0, w, -h, 0, -d, +d);
      // renderer.ortho();
      // renderer.translate(-w/2, -h/2);
    }


    /**
   *
   * end screen-aligned 2D-drawing.
   *
   */
    endHUD(renderer) {
      const cam = this.cam;
      renderer = renderer || cam.renderer;

      if (!renderer) return;

      const gl = renderer.drawingContext;

      gl.flush();
      // gl.finish();

      // 2) restore modelview/projection
      renderer.uMVMatrix.set(this.pushed_uMVMatrix);
      renderer.uPMatrix.set(this.pushed_uPMatrix);
      // 1) enable DEPTH_TEST
      gl.enable(gl.DEPTH_TEST);
      renderer.pop(this.pushed_rendererState);
    }
  }


  /**
 * Damped callback, that accepts the resulting damped/smooth value.
 *
 * @callback dampedCallback
 * @param {double} value - the damped/smoothed value
 *
 */


  /**
 *
 * DampedAction, for smoothly changing a value to zero.
 *
 * @param {dampedCallback} cb - callback that accepts the damped value as argument.
 */
  class DampedAction {
    /**  @constructor */
    constructor(cb) {
      this.value = 0.0;
      this.damping = 0.85;
      this.action = cb;
    }

    /** adds a value to the current value beeing damped.
   * @param {double} force - the value beeing added.
   */
    addForce(force) {
      this.value += force;
    }

    /** updates the damping and calls {@link damped-callback}. */
    update() {
      const active = (this.value * this.value) > 0.000001;
      if (active) {
        this.action(this.value);
        this.value *= this.damping;
      } else {
        this.stop();
      }
      return active;
    }

    /** stops the damping. */
    stop() {
      this.value = 0.0;
    }
  }


  /**
 * Interpolation callback, that implements any form of interpolation between
 * two values A and B and the interpolationparameter t.
 * <pre>
 *   linear: A * (1-t) + B * t
 *   smooth, etc...
 * </pre>
 * @callback interpolationCallback
 * @param {Object} A - First Value
 * @param {Object} B - Second Value
 * @param {double} t - interpolation parameter [0, 1]
 *
 */


  /**
 *
 * Interpolation, for smoothly changing a value by interpolating it over time.
 *
 * @param {interpolationCallback} cb - callback for interpolating between two values.
 */
  class Interpolation {
    /**  @constructor */
    constructor(cb) {
      this.default_duration = 300;
      this.action = cb;
    }

    /** starts the interpolation.
   *  If the given interpolation-duration is 0, then
   * {@link interpolation-callback} is called immediately.
   */
    start(valA, valB, duration, actions) {
      for (const key in actions) {
        if (Object.prototype.hasOwnProperty.call(actions, key)) {
          actions[key].stop();
        }
      }
      this.valA = valA;
      this.valB = valB;
      this.duration = (duration === undefined) ? this.default_duration : duration;
      this.timer = new Date().getTime();
      this.active = this.duration > 0;
      if (!this.active) {
        this.interpolate(1);
      }
    }

    /** updates the interpolation and calls {@link interpolation-callback}.*/
    update() {
      if (this.active) {
        const t = (new Date().getTime() - this.timer) / this.duration;
        if (t > 0.995) {
          this.interpolate(1);
          this.stop();
        } else {
          this.interpolate(t);
        }
      }
    }

    interpolate(t) {
      this.action(this.valA, this.valB, t);
    }

    /** stops the interpolation. */
    stop() {
      this.active = false;
    }
  }




  // //////////////////////////////////////////////////////////////////////////////
  //
  // public objects
  //
  // //////////////////////////////////////////////////////////////////////////////

  ext = (ext !== undefined) ? ext : {};

  /**
 * @memberof Dw
 */
  ext.EasyCam = EasyCam;
  /**
 * @memberof Dw
 */
  ext.DampedAction = DampedAction;
  /**
 * @memberof Dw
 */
  ext.Interpolation = Interpolation;
  /**
 * @memberof Dw
 */
  ext.Rotation = Rotation;
  /**
 * @memberof Dw
 */
  ext.Vec3 = Vec3;
  /**
 * @memberof Dw
 */
  ext.Scalar = Scalar;

  return ext;
})(Dw);


