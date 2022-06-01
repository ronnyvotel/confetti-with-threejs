import * as THREE from 'three';
import Experience from '../Experience.js';
import {computePlaneDepth} from '../Utils/Sizes.js';
import fragmentShader from './Shaders/Keypoint/fragment.glsl';
import vertexShader from './Shaders/Keypoint/vertex.glsl';

export default class KptVisualization {
  constructor(depth, imgTransformationFn) {
    this.experience = new Experience();
    this.camera = this.experience.camera;  // Three camera.
    this.webCamera = this.experience.webCamera;
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;
    this.imgTransformationFn = imgTransformationFn;

    // Setup.
    this.setup(depth);

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Keypoints');
      const debugObject = {
        displayKeypoints: false,
      };
      this.debugFolder.add(debugObject, 'displayKeypoints').onChange(
        (val) => {
          this.keypoints.visible = val;
        }
      )
    }

  }

  setup(depth) {
    // Keypoints shader.
    const numKpts = 33;
    const kptsGeometry = new THREE.BufferGeometry()
    const kptPositions = new Float32Array(3 * numKpts);
    const kptConfidences = new Float32Array(1 * numKpts);
    kptsGeometry.setAttribute('position', new THREE.BufferAttribute(kptPositions, 3));
    kptsGeometry.setAttribute('aConfidence', new THREE.BufferAttribute(kptConfidences, 1));
    const kptsMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMaximumX: {value: this.webCamera.video.width},
        uMaximumY: {value: this.webCamera.video.height},
      },
      depthWrite: false,
      transparent: true,
      vertexColors: true,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    });
    this.keypoints = new THREE.Points(kptsGeometry, kptsMaterial);
    this.keypoints.visible = false;

    this.keypoints.position.z = -depth;
    this.scene.add(this.keypoints);

  }

  resize(depth) {
    this.keypoints.position.z = -depth;
  }

  update(pose) {
    if (pose === null) {
      this.keypoints.geometry.attributes['aConfidence'].array.fill(0.0);
      this.keypoints.geometry.attributes['aConfidence'].needsUpdate = true;
      return;
    }

    const kptPositionArray = this.keypoints.geometry.attributes['position'].array;
    const kptConfidenceArray = this.keypoints.geometry.attributes['aConfidence'].array;
    for (let i = 0; i < this.keypoints.geometry.attributes['position'].count; i++) {
      // Note that blazepose coordinates are in image coordinates (+y = down),
      // and we need to flip horizontally for mirror mode.
      const transformedKpt = this.imgTransformationFn([
        pose.keypoints[i].x, pose.keypoints[i].y]);
      kptPositionArray[3 * i] = transformedKpt[0];
      kptPositionArray[3 * i + 1] =  transformedKpt[1];
      kptPositionArray[3 * i + 2] = 0.0;
      kptConfidenceArray[i] = pose.keypoints[i].score;
    }
    this.keypoints.geometry.attributes['position'].needsUpdate = true;
    this.keypoints.geometry.attributes['aConfidence'].needsUpdate = true;
  }
}