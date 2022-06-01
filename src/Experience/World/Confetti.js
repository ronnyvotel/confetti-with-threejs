import * as THREE from 'three';
import Experience from '../Experience.js';
import {computePlaneDepth} from '../Utils/Sizes.js';
import {HandEvent} from '../Vision/HandTracker.js';
import confettiFragmentShader from './Shaders/Confetti/fragment.glsl';
import confettiVertexShader from './Shaders/Confetti/vertex.glsl';

export default class Confetti {
  constructor(depth, imgTransformationFn) {
    this.experience = new Experience();
    this.camera = this.experience.camera;  // Three camera.
    this.webCamera = this.experience.webCamera;
    this.scene = this.experience.scene;
    this.renderer = this.experience.renderer;
    this.time = this.experience.time;
    this.handTracker = this.experience.handTracker;
    this.imgTransformationFn = imgTransformationFn;


    // Setup.
    this.numParticlesPerHand = 100;
    this.numSimultaneous = 3;
    this.setup(depth);
  }

  setup(depth) {
    const baseGeometry = new THREE.PlaneGeometry(1, 1);
    const numParticles = this.numParticlesPerHand * this.numSimultaneous;

    // Left
    const leftInstancedGeometry = new THREE.InstancedBufferGeometry().copy(
      baseGeometry);
    leftInstancedGeometry.instanceCount = numParticles;
    const leftPositions = new Float32Array(numParticles * 3);
    this.leftVelocities = new Float32Array(numParticles * 3);
    const leftColors = new Float32Array(numParticles * 3);
    const leftAlphas = new Float32Array(numParticles * 1);
    const leftWidthScales = new Float32Array(numParticles * 1);
    const leftAxisAngularRate = new Float32Array(numParticles * 4);
    this.leftConfettiGroupVisible = new Array(this.numSimultaneous).fill(false);
    this.leftConfettiStartTimes = new Array(this.numSimultaneous).fill(0.0);

    const rightInstancedGeometry = new THREE.InstancedBufferGeometry().copy(
      baseGeometry);
    rightInstancedGeometry.instanceCount = numParticles;
    const rightPositions = new Float32Array(numParticles * 3);
    this.rightVelocities = new Float32Array(numParticles * 3);
    const rightColors = new Float32Array(numParticles * 3);
    const rightAlphas = new Float32Array(numParticles * 1);
    const rightScales = new Float32Array(numParticles * 1);
    const rightWidthScales = new Float32Array(numParticles * 1);
    const rightAxisAngularRate = new Float32Array(numParticles * 4);
    this.rightConfettiGroupVisible = new Array(this.numSimultaneous).fill(false);
    this.rightConfettiStartTimes = new Array(this.numSimultaneous).fill(0.0);

    const colorOptions = ['green', 'aqua', 'crimson', 'hotpink', 'purple',
        'yellow'];
    for (let i = 0; i < numParticles; i++) {
      const i3 = i * 3;
      const i4 = i * 4;

      // Left.
      leftPositions[i3] = 200.0 * (Math.random() - 0.5);
      leftPositions[i3 + 1] = 200.0 * (Math.random() - 0.5);
      leftPositions[i3 + 2] = 0.0;
      let randomColor = colorOptions[
          Math.floor(Math.random() * colorOptions.length)];
      let color = new THREE.Color(randomColor);
      leftColors[i3] = color.r;
      leftColors[i3 + 1] = color.g;
      leftColors[i3 + 2] = color.b;
      leftAlphas[i] = 0.0;
      leftWidthScales[i] = 1.8 * Math.random() + 0.2;
      let randomDir = new THREE.Vector3(Math.random(), Math.random(), Math.random());
      randomDir.normalize();
      leftAxisAngularRate[i4] = randomDir.x;
      leftAxisAngularRate[i4 + 1] = randomDir.y;
      leftAxisAngularRate[i4 + 2] = randomDir.z;
      leftAxisAngularRate[i4 + 3] = 10 * Math.random();

      // Right.
      rightPositions[i3] = 200.0 * (Math.random() - 0.5);
      rightPositions[i3 + 1] = 200.0 * (Math.random() - 0.5);
      rightPositions[i3 + 2] = 0.0;
      randomColor = colorOptions[
          Math.floor(Math.random() * colorOptions.length)];
      color = new THREE.Color(randomColor);
      rightColors[i3] = color.r;
      rightColors[i3 + 1] = color.g;
      rightColors[i3 + 2] = color.b;
      rightAlphas[i] = 0.0;
      rightWidthScales[i] = 1.5 * Math.random() + 0.5;
      randomDir = new THREE.Vector3(Math.random(), Math.random(), Math.random());
      randomDir.normalize();
      rightAxisAngularRate[i4] = randomDir.x;
      rightAxisAngularRate[i4 + 1] = randomDir.y;
      rightAxisAngularRate[i4 + 2] = randomDir.z;
      rightAxisAngularRate[i4 + 3] = 10 * Math.random();
    }
    leftInstancedGeometry.setAttribute('aOffset',
       new THREE.InstancedBufferAttribute(leftPositions, 3, false));
    leftInstancedGeometry.setAttribute('aColor',
      new THREE.InstancedBufferAttribute(leftColors, 3, false));
    leftInstancedGeometry.setAttribute('aAlpha',
      new THREE.InstancedBufferAttribute(leftAlphas, 1, false));
    leftInstancedGeometry.setAttribute('aWidthScale',
      new THREE.InstancedBufferAttribute(leftWidthScales, 1, false));
    leftInstancedGeometry.setAttribute('aAxisAngularRate',
      new THREE.InstancedBufferAttribute(leftAxisAngularRate, 4, false));
    rightInstancedGeometry.setAttribute('aOffset',
      new THREE.InstancedBufferAttribute(rightPositions, 3, false));
    rightInstancedGeometry.setAttribute('aColor',
      new THREE.InstancedBufferAttribute(rightColors, 3, false));
    rightInstancedGeometry.setAttribute('aAlpha',
      new THREE.InstancedBufferAttribute(rightAlphas, 1, false));
    rightInstancedGeometry.setAttribute('aWidthScale',
      new THREE.InstancedBufferAttribute(rightWidthScales, 1, false));
    rightInstancedGeometry.setAttribute('aAxisAngularRate',
      new THREE.InstancedBufferAttribute(rightAxisAngularRate, 4, false));

    const material = new THREE.ShaderMaterial({
        vertexShader: confettiVertexShader,
        fragmentShader: confettiFragmentShader,
        side: THREE.DoubleSide,
        uniforms: {
          uTime: { value: 0.0},
          uSize: { value: 3.0 * this.renderer.instance.getPixelRatio()},
        },
        transparent: true,
        depthWrite: true
    })

    // Create Points objects.
    this.leftConfetti = new THREE.Mesh(leftInstancedGeometry, material);
    this.leftConfetti.position.z = -depth;
    this.scene.add(this.leftConfetti);
    this.rightConfetti = new THREE.Mesh(rightInstancedGeometry, material);
    this.rightConfetti.position.z = -depth;
    this.scene.add(this.rightConfetti);

  }

  resize(depth) {
    this.leftConfetti.position.z = -depth;
    this.rightConfetti.position.z = -depth;
  }

  update(handEvent) {
    this.leftConfetti.material.uniforms.uTime.value = this.time.elapsedTime;
    this.rightConfetti.material.uniforms.uTime.value = this.time.elapsedTime;

    // Left.
    for (let groupInd = 0; groupInd < this.numSimultaneous; groupInd++) {
      // console.log(`Group ind: ${groupInd}, visible: ${this.leftConfettiGroupVisible[groupInd]}`)
      if (this.leftConfettiGroupVisible[groupInd]) {
        const positions = this.leftConfetti.geometry.getAttribute('aOffset').array;
        const velocities = this.leftVelocities;
        this.updatePositionsAndVelocities(positions, velocities, groupInd);
        const alphas = this.leftConfetti.geometry.getAttribute('aAlpha').array;
        this.updateAlphas(alphas, this.leftConfettiStartTimes[groupInd], groupInd);
        if (alphas[groupInd * this.numParticlesPerHand] < 1e-3) {
          this.leftConfettiGroupVisible[groupInd] = false;
        }
        this.leftConfetti.geometry.getAttribute('aOffset').needsUpdate = true;
        this.leftConfetti.geometry.getAttribute('aAlpha').needsUpdate = true;
      }
    }

    if (handEvent['leftHandEvent'] === HandEvent.Confetti) {
      for (let groupInd = 0; groupInd < this.numSimultaneous; groupInd++) {
        if (!this.leftConfettiGroupVisible[groupInd]) {
          // Found an available group of confetti that can be utilized.
          this.leftConfettiGroupVisible[groupInd] = true;
          this.leftConfettiStartTimes[groupInd] = this.time.current;
          const initialPosition = this.handTracker.leftHand().positionAtStoppedTransition;
          const initialVelocity = this.handTracker.leftHand().velocityAtStoppedTransition;
          const positions = this.leftConfetti.geometry.getAttribute('aOffset').array;
          const velocities = this.leftVelocities;
          this.randomizeInitialPositionsAndVelocities(positions, velocities,
            initialPosition, initialVelocity, groupInd);
          break;
        }
      }
    }

    // Right.
    for (let groupInd = 0; groupInd < this.numSimultaneous; groupInd++) {
      // console.log(`Group ind: ${groupInd}, visible: ${this.rightConfettiGroupVisible[groupInd]}`)
      if (this.rightConfettiGroupVisible[groupInd]) {
        const positions = this.rightConfetti.geometry.getAttribute('aOffset').array;
        const velocities = this.rightVelocities;
        this.updatePositionsAndVelocities(positions, velocities, groupInd);
        const alphas = this.rightConfetti.geometry.getAttribute('aAlpha').array;
        this.updateAlphas(alphas, this.rightConfettiStartTimes[groupInd], groupInd);
        if (alphas[groupInd * this.numParticlesPerHand] < 1e-3) {
          this.rightConfettiGroupVisible[groupInd] = false;
        }
        this.rightConfetti.geometry.getAttribute('aOffset').needsUpdate = true;
        this.rightConfetti.geometry.getAttribute('aAlpha').needsUpdate = true;
      }
    }

    if (handEvent['rightHandEvent'] === HandEvent.Confetti) {
      for (let groupInd = 0; groupInd < this.numSimultaneous; groupInd++) {
        if (!this.rightConfettiGroupVisible[groupInd]) {
          // Found an available group of confetti that can be utilized.
          this.rightConfettiGroupVisible[groupInd] = true;
          this.rightConfettiStartTimes[groupInd] = this.time.current;
          const initialPosition = this.handTracker.rightHand().positionAtStoppedTransition;
          const initialVelocity = this.handTracker.rightHand().velocityAtStoppedTransition;
          const positions = this.rightConfetti.geometry.getAttribute('aOffset').array;
          const velocities = this.rightVelocities;
          this.randomizeInitialPositionsAndVelocities(positions, velocities,
            initialPosition, initialVelocity, groupInd);
          break;
        }
      }
    }
  }

  randomizeInitialPositionsAndVelocities(positions, velocities, x0, v0, groupInd) {
    v0[1] = Math.max(Math.min(v0[1], 1000.0), 300.0);
    // v0[0] = Math.max(Math.min(0.3*v0[1], v0[0]), -0.3*v0[1]);

    const startInd = groupInd * this.numParticlesPerHand;
    const endInd = (groupInd + 1) * this.numParticlesPerHand;
    for (let i = startInd; i < endInd; i++) {
      const i3 = i * 3;
      const ux = this.generateRandom();
      const uy = this.generateRandom();
      const vx = this.generateRandom();
      const vy = this.generateRandom();
      positions[i3] = x0[0] + ux * 20.0;
      positions[i3 + 1] = x0[1] + uy * 20.0 + 10.0;
      velocities[i3] = v0[0] + vx * 100.0;
      velocities[i3 + 1] = v0[1] + vy * 200.0;
      velocities[i3 + 2] = 2.0 * Math.random();
    }
  }

  updatePositionsAndVelocities(positions, velocities, groupInd) {
    const gravity = 400.0;
    const dragCoeff = 0.01;
    const dt = this.time.delta;

    const startInd = groupInd * this.numParticlesPerHand;
    const endInd = (groupInd + 1) * this.numParticlesPerHand;
    for (let i = startInd; i < endInd; i++) {
      const i3 = i * 3;
      const px = positions[i3];
      const py = positions[i3 + 1];
      const pz = positions[i3 + 2];
      const vx = velocities[i3];
      const vy = velocities[i3 + 1];
      const vz = velocities[i3 + 2];
      const ay = -Math.sign(vy) * 0.5 * dragCoeff * vy * vy - gravity;

      positions[i3] = px + vx * dt;
      positions[i3 + 1] = py + vy * dt + 0.5 * ay * dt * dt;
      positions[i3 + 2] = pz + vz * dt;
      velocities[i3 + 1] = vy + ay * dt;
    }
  }

  updateAlphas(alphas, startTime, groupInd) {
    const maxVisibleTime = 3.0;
    const elapsedTime = (this.time.current - startTime) / 1000.;
    let alpha = 0.0;
    if (elapsedTime < maxVisibleTime) {
      alpha = Math.max(
        0.0, Math.cos((elapsedTime / maxVisibleTime) * Math.PI / 2.0));
    }
    const startInd = groupInd * this.numParticlesPerHand;
    const endInd = (groupInd + 1) * this.numParticlesPerHand;
    for (let i = startInd; i < endInd; i++) {
      alphas[i] = alpha;
    }
  }

  generateRandom() {
    const numIter = 3;
    let tot = 0.0;
    for (let i = 0; i < numIter; i++) {
      tot += (Math.random() - 0.5);
    }
    return tot / numIter;
  }
}