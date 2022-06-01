import * as THREE from 'three';
import Experience from '../Experience.js';
import {computePlaneDepth} from '../Utils/Sizes.js';

import fragmentShader from './Shaders/Mask/fragment.glsl';
import vertexShader from './Shaders/Mask/vertex.glsl';

export default class WebcamPlane {
  constructor(planeDepth, segDepth) {
    this.experience = new Experience();
    this.camera = this.experience.camera;  // Three camera.
    this.webCamera = this.experience.webCamera;
    this.scene = this.experience.scene;
    this.debug = this.experience.debug;

    // Setup.
    this.setup(planeDepth, segDepth);

    // Debug
    if (this.debug.active) {
      this.debugFolder = this.debug.ui.addFolder('Mask');
      const debugObject = {
        displaySegMask: false,
      };
      this.debugFolder.add(debugObject, 'displaySegMask').onChange(
        (val) => {
          this.bodyMaskMesh.material.uniforms.uDisplaySegMask.value = val;
        }
      )
    }
  }

  setup(planeDepth, segDepth) {
    this.webcamCanvas = document.createElement('canvas');
    this.webcamCanvas.width = this.webCamera.video.width;
    this.webcamCanvas.height = this.webCamera.video.height;
    this.webcamCanvasCtx = this.webcamCanvas.getContext('2d');
    this.webcamCanvasCtx.fillStyle = '#000000'
    this.webcamCanvasCtx.fillRect(0, 0, this.webcamCanvas.width,
      this.webcamCanvas.height);

    this.webcamTexture = new THREE.Texture(this.webcamCanvas);
    this.webcamTexture.minFilter = THREE.LinearFilter;
    this.webcamTexture.maxFilter = THREE.LinearFilter;

    this.bodyMaskCanvas = document.createElement('canvas');
    this.bodyMaskCanvas.width = this.webCamera.video.width;
    this.bodyMaskCanvas.height = this.webCamera.video.height;
    this.bodyMaskCanvasCtx = this.bodyMaskCanvas.getContext('2d');
    this.bodyMaskCanvasCtx.fillStyle = '#000000';
    this.bodyMaskCanvasCtx.fillRect(0, 0, this.bodyMaskCanvas.width,
      this.bodyMaskCanvas.height);

    this.bodyMaskTexture = new THREE.Texture(this.bodyMaskCanvas);
    this.bodyMaskTexture.minFilter = THREE.LinearFilter;
    this.bodyMaskTexture.maxFilter = THREE.LinearFilter;

    // Webcam.
    const shaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.webcamTexture },
        uSeg: { value: this.bodyMaskTexture},
        uPixelSize: { value: new THREE.Vector2(
          1.0 / this.webcamCanvas.width, 1.0 / this.webcamCanvas.height)},
        uPixelOffset: { value: 4},
        uPersonVisible: {value: false},
        uTransparentBackground: {value: false},
        uDisplaySegMask: {value: false}
      },
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });

    this.webcamMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.webcamCanvas.width, this.webcamCanvas.height),
      shaderMaterial
    );
    this.webcamMesh.position.z = -planeDepth;
    this.scene.add(this.webcamMesh);

    // Body segmentation.
    const segShaderMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: this.webcamTexture },
        uSeg: { value: this.bodyMaskTexture},
        uPixelSize: { value: new THREE.Vector2(
          1.0 / this.bodyMaskCanvas.width, 1.0 / this.bodyMaskCanvas.height)},
        uPixelOffset: { value: 4},
        uPersonVisible: {value: false},
        uTransparentBackground: {value: true},
        uDisplaySegMask: {value: false}
      },
      transparent: true,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader
    });
    this.bodyMaskMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(this.webcamCanvas.width, this.webcamCanvas.height),
      segShaderMaterial
    );
    this.bodyMaskMesh.position.z = -segDepth;
    this.scene.add(this.bodyMaskMesh);
  }

  resize(planeDepth, segDepth) {
    this.webcamMesh.position.z = -planeDepth;
    this.bodyMaskMesh.position.z = -segDepth;
  }

  update(pose) {
    if (this.webCamera.video.readyState === this.webCamera.video.HAVE_ENOUGH_DATA) {
      this.webcamCanvasCtx.drawImage(this.webCamera.video, 0, 0,
        this.webcamCanvas.width, this.webcamCanvas.height);
      this.webcamTexture.needsUpdate = true;

      this.bodyMaskCanvasCtx.clearRect(0, 0, this.bodyMaskCanvas.width,
        this.bodyMaskCanvas.height);
      this.bodyMaskTexture.needsUpdate = true;
      this.bodyMaskMesh.material.uniforms.uPersonVisible.value = false;
      if (pose !== null) {
        this.bodyMaskCanvasCtx.drawImage(pose.segmentation.mask.mask, 0, 0,
          this.bodyMaskCanvas.width, this.bodyMaskCanvas.height);
        this.bodyMaskMesh.material.uniforms.uPersonVisible.value = true;
      }
    }
  }
}