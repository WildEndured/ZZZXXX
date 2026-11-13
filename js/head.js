(function () {
  'use strict';

  const Head = {
    name: 'head',
    config: {
      centerX: 2048,
      topY: 0,
      headHeight: 0,
    },

    update(geometry) {
      this.config.centerX = geometry.centerX;
      this.config.topY = geometry.topY;
      this.config.headHeight = geometry.headHeight;
    },

    build() {
      return null;
    },
  };

  window.Head = Head;
})();
