////////////////////////////////////////////////////////////////////////////////
// Default option values.
////////////////////////////////////////////////////////////////////////////////

export const defaults = {

  vis: {
    target: document.body,
    run: true,
    maxFPS: 0,
    stats: false,
    cleanup: false,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,  
    clearBeforeRender: true,
    preserveDrawingBuffer: false,
    images: [],
    fontName: null,
    fontSize: 16,
    backParticles: false,
    middleParticles: false,
    frontParticles: false,
    basicCircleRadius: 64,
    advancedCircleScale: 5,
    updateRadii: true,
    updatePointings: true,
    updateDrawOrder: true,
    beforeSetup: null,
    afterSetup: null,
    beforeTick: null,
    afterTick: null,
    finished: null
  },

  simulation: {
    baseColor: 0x808080,
    baseAlpha: 1,
    background: false,
    tint: 0xffffff,
    alpha: 1,
    image: null,
    tile: false
  },

  square: {
    tint: 0xffffff,
    alpha: 1,
    image: null,
    text: null,
    textPosition: 'center',
    textPadding: 3,
    textAlign: 'center',
    textTint: 0x0,
    textAlpha: 1,
    fontName: null,
    fontSize: null,
    advanced: false,
    lineColor: 0x0,
    lineAlpha: 1,
    lineWidth: 1,
    lineAlign: 0.5,
    fillColor: 0xffffff,
    fillAlpha: 1
  },

  zone: {
    tint: 0xffffff,
    alpha: 1,
    image: null,
    text: null,
    textPosition: 'center',
    textPadding: 3,
    textAlign: 'center',
    textTint: 0x0,
    textAlpha: 1,
    fontName: null,
    fontSize: null,
    advanced: false,
    lineColor: 0x0,
    lineAlpha: 1,
    lineWidth: 1,
    lineAlign: 0.5,
    fillColor: 0xffffff,
    fillAlpha: 1,
    tile: false
  },

  actor: {
    tint: 0xffffff,
    alpha: 1,
    image: null,
    text: null,
    textRotate: false,
    textMaxWidth: 0,
    textAlign: 'center',
    textTint: 0x0,
    textAlpha: 1,
    fontName: null,
    fontSize: null,
    advanced: false,
    lineColor: 0x0,
    lineAlpha: 1,
    lineWidth: 1,
    lineAlign: 0.5,
    fillColor: 0xffffff,
    fillAlpha: 1
  }

};