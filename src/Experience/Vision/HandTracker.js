import Experience from '../Experience.js'

export const HandState = {
  NoPose: 'NoPose',
  Default: 'Default',
  Up: 'Up',
  Stopped: 'Stopped'
};

export const HandEvent = {
  None: 'None',
  Confetti: 'Confetti'
}

const SHOULDER_KPTS = [11, 12];
const LEFT_HAND_KPTS = [17, 19, 21];
const RIGHT_HAND_KPTS = [18, 20, 22];

export default class HandTracker {
  constructor(coordTransformationFn, velThreshold = 3.0, upDuration = 0.1,
    stoppedDuration = 0.5, minKptConfidence = 0.4) {
    this.experience = new Experience();
    this.time = this.experience.time;

    this.velThreshold = velThreshold;
    this.coordTransformationFn = coordTransformationFn;
    this.upDuration = upDuration;
    this.stoppedDuration = stoppedDuration;
    this.minKptConfidence = minKptConfidence;
    this.resetLeftHandState();
    this.resetRightHandState();
  }

  update(pose) {
    if (pose === null) {
      this.reset();
      return {};
    }
    return this.updateHandStates(pose);
  }

  updateHandStates(pose) {
    // Time since the last upate;

    // Shoulders.
    if (pose.keypoints[SHOULDER_KPTS[0]].score < this.minKptConfidence ||
        pose.keypoints[SHOULDER_KPTS[1]].score < this.minKptConfidence) {
      this.reset();
      return;
    }
    const shoulderDist = Math.sqrt(
      Math.pow(pose.keypoints[SHOULDER_KPTS[0]].x - pose.keypoints[SHOULDER_KPTS[1]].x, 2) +
      Math.pow(pose.keypoints[SHOULDER_KPTS[0]].y - pose.keypoints[SHOULDER_KPTS[1]].y, 2)
    )

    // Left hand.
    const leftHandEvent = this.updateHand(pose, 'left', shoulderDist);
    const rightHandEvent = this.updateHand(pose, 'right', shoulderDist);
    return {
      'leftHandEvent': leftHandEvent,
      'rightHandEvent': rightHandEvent
    }
  }

  updateHand(pose, leftOrRight, shoulderDist) {
    // TODO(ronnyvotel: Fix velocity ping-ponging issue)
    let kptIndices, resetFn, handPos, handVel, handVelNormalized, handState;
    let updateStateFn, durationInState, updateDurationFn, handStoppedPos;
    let handStoppedVel;
    let ht = this;
    let event = HandEvent.None;
    if (leftOrRight === 'left') {
      kptIndices = LEFT_HAND_KPTS;
      resetFn = () => ht.resetLeftHandState;
      handPos = this.leftHandPos;
      handVel = this.leftHandVel;
      handVelNormalized = this.leftHandVelNormalized;
      handState = this.leftHandState;
      updateStateFn = (state) => ht.leftHandState = state;
      durationInState = this.leftHandDurationInState;
      updateDurationFn = (dur) => ht.leftHandDurationInState = dur;
      handStoppedPos = this.leftHandStoppedPos;
      handStoppedVel = this.leftHandStoppedVel;
    } else if (leftOrRight === 'right') {
      kptIndices = RIGHT_HAND_KPTS;
      resetFn = () => ht.resetRightHandState;
      handPos = this.rightHandPos;
      handVel = this.rightHandVel;
      handVelNormalized = this.rightHandVelNormalized;
      handState = this.rightHandState;
      updateStateFn = (state) => ht.rightHandState = state;
      durationInState = this.rightHandDurationInState;
      updateDurationFn = (dur) => ht.rightHandDurationInState = dur;
      handStoppedPos = this.rightHandStoppedPos;
      handStoppedVel = this.rightHandStoppedVel;
    } else {
      throw new Error('Hand must be "left" or "right".');
    }

    let avePos = [0.0, 0.0];
    let allKptsValid = true;
    for (let kptInd of kptIndices) {
      if (pose.keypoints[kptInd].score < this.minKptConfidence) {
        resetFn();
        allKptsValid = false;
        break;
      }
      const transformedKpts = this.coordTransformationFn(
        [pose.keypoints[kptInd].x, pose.keypoints[kptInd].y])
      avePos[0] += transformedKpts[0];
      avePos[1] += transformedKpts[1];
    }
    if (allKptsValid) {
      let prevHandPos, prevHandVel;
      if (handState === HandState.NoPose) {
        // No previous pose, so we don't want to use previous hand position
        // to estimate velocity.
        handPos[0] = avePos[0] / kptIndices.length;
        handPos[1] = avePos[1] / kptIndices.length;
        handVel[0] = 0.0;
        handVel[1] = 0.0;
        prevHandPos = [...handPos];
        prevHandVel = [...handVel];
        handVelNormalized[0] = 0.0;
        handVelNormalized[1] = 0.0;
      } else {
        prevHandPos = [...handPos];
        prevHandVel = [...handVel];
        handPos[0] =  avePos[0] / kptIndices.length;
        handPos[1] = avePos[1] / kptIndices.length;
        handVel[0] = (handPos[0] - prevHandPos[0])  / this.time.delta;
        handVel[1] = (handPos[1] - prevHandPos[1])  / this.time.delta;

        // Smooth and normalize.
        handVelNormalized[0] = 0.1 * handVelNormalized[0] + 0.9 * handVel[0] / shoulderDist;
        handVelNormalized[1] = 0.1 * handVelNormalized[1] + 0.9 * handVel[1] / shoulderDist;
      }

      const handMovingUp = handVelNormalized[1] > this.velThreshold;
      switch (handState) {
        case HandState.NoPose:
          // Automatically switch from 
          updateStateFn(HandState.Default);
          break;
        case HandState.Default:
          if (handMovingUp) {
            // Hand is just beginning to move up.
            updateStateFn(HandState.Up);
            updateDurationFn(0.0);
          }
          break;
        case HandState.Up:
          if (handMovingUp) {
            // Hand is still moving up.
            durationInState += this.time.delta;
            updateDurationFn(durationInState); 
          } else if (durationInState > this.upDuration) {
            // Hand is starting to stop from an upward motion.
            const handString = `Hand Confetti: ${leftOrRight}!!!!`
            console.log(handString)
            event = HandEvent.Confetti;
            updateStateFn(HandState.Stopped);
            handStoppedPos[0] = prevHandPos[0];
            handStoppedPos[1] = prevHandPos[1];
            handStoppedVel[0] = prevHandVel[0];
            handStoppedVel[1] = prevHandVel[1];
            updateDurationFn(0.0);
          } else {
            // Hand was not moving up long enough. Switch back to default.
            updateStateFn(HandState.Default);
            updateDurationFn(0.0);
          }
          break;
        case HandState.Stopped:
          durationInState += this.time.delta;
          updateDurationFn(durationInState); 
          if (durationInState > this.stoppedDuration) {
            // Been in the stopped state long enough. Switch back to default.
            updateStateFn(HandState.Default);
            resetFn()
          }
          break;
      }
    } else {
      // Not enough hand information, so reset states.
      resetFn()
    }
    return event;
  }

  leftHand() {
    return {
      state: this.leftHandState,
      durationInState: this.leftHandDurationInState,
      position: this.leftHandPos,
      velocity: this.leftHandVel,
      positionAtStoppedTransition: this.leftHandStoppedPos,
      velocityAtStoppedTransition: this.leftHandStoppedVel,
    }
  }

  rightHand() {
    return {
      state: this.rightHandState,
      durationInState: this.rightHandDurationInState,
      position: this.rightHandPos,
      velocity: this.rightHandVel,
      positionAtStoppedTransition: this.rightHandStoppedPos,
      velocityAtStoppedTransition: this.rightHandStoppedVel,
    }
  }

  reset() {
    this.resetLeftHandState();
    this.resetRightHandState();
  }

  resetLeftHandState() {
    this.leftHandState = HandState.NoPose;
    this.leftHandDurationInState = 0.0;
    this.leftHandPos = [0.0, 0.0];
    this.leftHandVel = [0.0, 0.0];
    this.leftHandVelNormalized = [0.0, 0.0];
    this.leftHandStoppedPos = [0.0, 0.0];
    this.leftHandStoppedVel = [0.0, 0.0];
  }

  resetRightHandState() {
    this.rightHandState = HandState.NoPose;
    this.rightHandDurationInState = 0.0;
    this.rightHandPos = [0.0, 0.0];
    this.rightHandVel = [0.0, 0.0];
    this.rightHandVelNormalized = [0.0, 0.0];
    this.rightHandStoppedPos = [0.0, 0.0];
    this.rightHandStoppedVel = [0.0, 0.0];
  }
}