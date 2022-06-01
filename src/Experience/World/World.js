import Experience from '../Experience.js';
import Confetti from './Confetti.js';
import WebcamPlane from './WebcamPlane.js';
import KptVisualization from './KptVisualization.js';
import {computePlaneDepth} from '../Utils/Sizes.js';

export default class World {
  constructor(imgTransformationFn) {
    this.experience = new Experience();
    this.scene = this.experience.scene;
    this.camera = this.experience.camera;
    this.webCamera = this.experience.webCamera;

    const planeDepth = this.getPlaneDepth();
    const segDepth = planeDepth - 5.0;
    this.webcamPlane = new WebcamPlane(planeDepth, segDepth);
    this.confetti = new Confetti(planeDepth - 2.5);
    this.keypointVisualization = new KptVisualization(planeDepth - 10.0,
      imgTransformationFn);

  }

  resize() {
    const planeDepth = this.getPlaneDepth();
    const segDepth = planeDepth - 5.0;
    this.webcamPlane.resize(planeDepth, segDepth);
    this.confetti.resize(planeDepth - 1.0);
    this.keypointVisualization.resize(planeDepth - 10.0);
  }

  getPlaneDepth() {
    return computePlaneDepth(
      this.camera.perspectiveCamera, this.webCamera.video.width,
      this.webCamera.video.height);
  }

  update(pose, handEvent) {
    this.webcamPlane.update(pose);
    this.confetti.update(handEvent);
    this.keypointVisualization.update(pose);
  }
}