import EventEmitter from './EventEmitter.js';

export class Sizes extends EventEmitter{
  constructor() {
    super();

    // Setup.
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.pixelRatio = Math.min(window.devicePixelRatio, 2);

    // Resize event
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.pixelRatio = Math.min(window.devicePixelRatio, 2);

      this.trigger('resize');
    })
  }
}

// Computes the distance (in the -Z direction) that the web plane should be
// placed such that it fills the camera FOV without clipping an axis.
export function computePlaneDepth(camera, canvasWidth, canvasHeight) {
  const camAspect = camera.aspect;
  const canvasAspect = canvasWidth / canvasHeight;
  const dim = canvasAspect > camAspect ? canvasWidth : canvasHeight;
  const fov = canvasAspect > camAspect ? camAspect * camera.fov : camera.fov;

  const depth = dim / (2 * Math.tan((Math.PI / 180) * fov / 2));
  return depth;
}
