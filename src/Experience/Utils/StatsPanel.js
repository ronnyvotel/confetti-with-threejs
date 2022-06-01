import Stats from 'stats-js';

export default class StatsPanel {
  constructor() {
    this.stats = new Stats();
    this.stats.customFpsPanel = this.stats.addPanel(
      new Stats.Panel('FPS', '#0ff', '#002'));
    this.stats.showPanel(this.stats.domElement.children.length - 1);

    const parent = document.getElementById('stats');
    parent.appendChild(this.stats.domElement);

    const statsPanes = parent.querySelectorAll('canvas');

    for (let i = 0; i < statsPanes.length; ++i) {
      statsPanes[i].style.width = '140px';
      statsPanes[i].style.height = '80px';
    }
    this.startTime = 0.0;
    this.totalTime = 0.0;
    this.count = 0;
    this.panelUpdateMilliseconds = 1000;
    this.lastPanelUpdate = 0.0;
  }

  begin() {
    this.startTime = Date.now();
  }

  end() {
    const endTime = Date.now();
    this.totalTime += endTime - this.startTime;
    ++this.count;


    if (endTime - this.lastPanelUpdate >= this.panelUpdateMilliseconds) {
      const averageTime = this.totalTime / this.count;
      this.totalTime = 0.0;
      this.count = 0;
      this.stats.customFpsPanel.update(
          1000.0 / averageTime, 120 /* maxValue */);
      this.lastPanelUpdate = endTime;
    }
  }
}