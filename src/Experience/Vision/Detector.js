import '@tensorflow/tfjs-backend-webgl';
import * as mpPose from '@mediapipe/pose';
import * as posedetection from '@tensorflow-models/pose-detection';

import * as tfjsWasm from '@tensorflow/tfjs-backend-wasm';
tfjsWasm.setWasmPaths(
    `https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-wasm@${
        tfjsWasm.version_wasm}/dist/`);

import Experience from '../Experience.js';
import {STATE} from './Params.js';

export default class Detector {
  constructor(detector) {
    this.experience = new Experience();
    this.canvas = this.experience.canvas;
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.webCamera = this.experience.webCamera;
    this.instance = detector;
  }


  static async instantiateDetector() {
    const runtime = STATE.backend.split('-')[0];
    let instance;
    if (runtime === 'mediapipe') {
      instance = await posedetection.createDetector(STATE.model, {
        runtime,
        modelType: STATE.modelConfig.type,
        enableSegmentation: true,
        solutionPath: `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}`
      });
    } else if (runtime === 'tfjs') {
      instance = await posedetection.createDetector(STATE.model, {
        runtime,
        modelType: STATE.modelConfig.type,
        enableSegmentation: true});
    } else {
      throw new Error('The runtime must be "mediapipe" or "tfjs".');
    }
    return instance;
  }


  async update() {
    let poses;
    try {
      poses = await this.instance.estimatePoses(
          this.webCamera.video,
          {maxPoses: STATE.modelConfig.maxPoses, flipHorizontal: false});
    } catch (error) {
      console.log(error)
      // alert(error);
      // this.instance.dispose();
      // this.instance = null;
      
    }
    return poses;
  }
}