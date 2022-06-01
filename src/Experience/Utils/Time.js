import EventEmitter from './EventEmitter.js';

export default class Time extends EventEmitter {
  // We pass in the HTMLVideoElement to produce ticks on newly available video
  // frames.
  constructor(video) {
    super();

    // Setup
    this.start = Date.now();
    this.current = this.start;
    this.elapsedTime = 0;
    this.delta = 33. / 1000;  // sec
    this.video = video;
  }

  startTimer() {
    // Note that we don't call this.tick() directly because that will produce
    // a delta of 0.
    this.video.requestVideoFrameCallback(() => this.tick());
    // window.requestAnimationFrame(() => this.tick());
  }

  tick() {
    const currentTime = Date.now();
    this.delta = (currentTime - this.current) / 1000.;
    this.current = currentTime;
    this.elapsedTime = (this.current - this.start) / 1000.;

    this.trigger('tick');

    // window.requestAnimationFrame(() => this.tick());
    this.video.requestVideoFrameCallback(() => this.tick());
  }
}