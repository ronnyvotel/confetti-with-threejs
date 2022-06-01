import * as THREE from 'three'
import Experience from './Experience.js'

export default class Camera {
  constructor() {
    this.experience = new Experience()
    this.sizes = this.experience.sizes;
    this.scene = this.experience.scene;
    this.canvas = this.experience.canvas;

    this.setInstance();
  }

  setInstance() {
    this.perspectiveCamera = new THREE.PerspectiveCamera(
      35,
      this.sizes.width / this.sizes.height,
      0.1,
      5000
    )
    this.scene.add(this.perspectiveCamera)
  }

  resize() {
    this.perspectiveCamera.aspect = this.sizes.width / this.sizes.height
    this.perspectiveCamera.updateProjectionMatrix()
  }

}