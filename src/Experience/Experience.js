import * as THREE from 'three';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import World from './World/World.js';

import Detector from './Vision/Detector.js';
import HandTracker from './Vision/HandTracker.js';
import WebCamera from './Vision/WebCamera.js';
import {STATE} from './Vision/Params.js';
import {imgCoordToSceneCoord} from './Vision/Util.js';


import Debug from './Utils/Debug.js';
import {Sizes} from './Utils/Sizes.js';
import StatsPanel from './Utils/StatsPanel.js';
import Time from './Utils/Time.js';


// Singleton variable.
let instance = null;


export default class Experience {
  constructor(sizes, time) {
    if (instance) {
      return instance;
    }
    instance = this;

    // Sizes resize event.
    this.sizes = sizes;
    this.sizes.on('resize', () => {
      this.resize();
    })

    // Time tick event
    this.time = time;
    this.time.on('tick', () => {
      this.update();
    })

    // Global access.jouf
    window.experience = this;
  }

  static async setupExperience(canvas) {

    const webCamera = await WebCamera.setupCamera(STATE.camera);
    const poseSegModel = await Detector.instantiateDetector();

    const sizes = new Sizes();
    const time = new Time(webCamera.video);
    // Once the experience has been created, all future objects will have
    // access to the singleton object.
    const experience = new Experience(sizes, time);
    
    // Note that the webCamera must be set by the time the Detector is created.
    experience.webCamera = webCamera;
    experience.detector = new Detector(poseSegModel);
    experience.canvas = canvas;
    experience.debug = new Debug();
    experience.statsPanel = new StatsPanel();
    experience.scene = new THREE.Scene();
    experience.camera = new Camera();
    experience.renderer = new Renderer();
    const imgTransformationFn = imgCoordToSceneCoord(
      experience.webCamera.video.width, experience.webCamera.video.height);
    experience.handTracker = new HandTracker(imgTransformationFn);
    experience.world = new World(imgTransformationFn);

    time.startTimer();

    return experience;
  }

  resize() {
    this.camera.resize();
    this.world.resize();
    this.renderer.resize();
  }

  async update() {
    this.statsPanel.begin();
    let poses = await this.detector.update();
    const pose = poses.length >= 1 ? poses[0] : null;
    const handEvent = this.handTracker.update(pose);
    this.world.update(pose, handEvent);
    this.statsPanel.end();

    this.renderer.update();
  }

  destroy() {
    this.sizes.off('resize');
    this.time.off('tick');

    // Traverse the whole scene.
    this.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();

        // Loop through the material properties
        for (const key in child.material) {
          const value = child.material[key];

          // Test if there is a dispose function
          if (value && typeof value.dispose === 'function') {
            value.dispose();
          }
        }
      }
    })

    this.renderer.instance.dispose();

    if (this.debug.active) {
      this.debug.ui.destroy();
    }
  }

}