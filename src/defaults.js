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
    sprites: [],
    backParticles: false,
    middleParticles: false,
    frontParticles: false,
    beforeSetup: null,
    afterSetup: null,
    beforeTick: null,
    afterTick: null,
    finished: null,
    updateRadii: true,
    updatePointings: true,
    updateDrawOrder: true,
    basicCircleRadius: 64,
    advancedCircleScale: 5
  },

  simulation: {
    baseColor: 0x808080,
    baseAlpha: 1,
    background: false,
    tint: 0xffffff,
    alpha: 1,
    sprite: null,
    tile: false
  },

  square: {
    tint: 0xffffff,
    alpha: 1,
    sprite: null,
    text: null,
    textPosition: 'center',
    textPadding: 3,
    textAlign: 'center',
    textTint: 0x0,
    textAlpha: 1,
    fontName: null,
    fontSize: 16,
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
    sprite: null,
    text: null,
    textPosition: 'center',
    textPadding: 3,
    textAlign: 'center',
    textTint: 0x0,
    textAlpha: 1,
    fontName: null,
    fontSize: 16,
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
    sprite: null,
    text: null,
    textRotate: false,
    textMaxWidth: 0,
    textAlign: 'center',
    textTint: 0x0,
    textAlpha: 1,
    fontName: null,
    fontSize: 16,
    advanced: false,
    lineColor: 0x0,
    lineAlpha: 1,
    lineWidth: 1,
    lineAlign: 0.5,
    fillColor: 0xffffff,
    fillAlpha: 1
  }

};