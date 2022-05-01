////////////////////////////////////////////////////////////////////////////////
// Vis function.
////////////////////////////////////////////////////////////////////////////////

// use browser version of PixiJS to fix issue #2
import * as PIXI from '../node_modules/pixi.js/dist/browser/pixi.mjs';
import { shapeTexture } from './shape-texture.js';
import { colors } from './colors.js';

PIXI.utils.skipHello();

export { PIXI, colors };


// ===== vis function ==========================================================

export function vis(sim, options = {}) {


  // ===== options =============================================================

  const {
    
    target                = document.body,
    run                   = true,
    maxFPS                = 0,
    stats                 = false,
    cleanup               = false,
    resolution            = window.devicePixelRatio || 1,
    autoDensity           = true,
    antialias             = true,  
    clearBeforeRender     = true,
    preserveDrawingBuffer = false,
    sprites               = [],
    beforeSetup           = null,
    afterSetup            = null,
    beforeTick            = null,
    afterTick             = null,
    finished              = null,
    
    backParticles         = false,
    middleParticles       = false,
    frontParticles        = false,

    baseColor             = 0x808080,
    baseAlpha             = 1,

    background            = false,
    backgroundTint        = 0xffffff,
    backgroundAlpha       = 1,
    backgroundSprite      = null,
    backgroundTile        = false,

    squareTint            = 0xffffff,  
    squareAlpha           = 1,
    squareSprite          = null,
    squareAdvanced        = false,
    squareLineColor       = 0x0,
    squareLineAlpha       = 1,
    squareLineWidth       = 1,
    squareLineAlign       = 0.5,
    squareFillColor       = 0xffffff,
    squareFillAlpha       = 1,
    
    zoneTint              = 0xffffff,
    zoneAlpha             = 1,
    zoneSprite            = null,
    zoneAdvanced          = false,
    zoneLineColor         = 0x0,
    zoneLineAlpha         = 1,
    zoneLineWidth         = 1,
    zoneLineAlign         = 0.5,
    zoneFillColor         = 0xffffff,
    zoneFillAlpha         = 1,
    zoneTile              = false,
    
    actorTint             = 0xffffff,
    actorAlpha            = 1,
    actorSprite           = null,
    actorAdvanced         = false,
    actorLineColor        = 0x0,
    actorLineAlpha        = 1,
    actorLineWidth        = 1,
    actorLineAlign        = 0.5,
    actorFillColor        = 0xffffff,
    actorFillAlpha        = 1,
    basicCircleRadius     = 64,
    advancedCircleScale   = 5,

    updateTint            = true,
    updateAlpha           = true,
    updateSprite          = true,
    updateRadius          = false,
    updatePointing        = false,
    updateZIndex          = false

  } = options;


  // ===== Pixi and app ========================================================

  // Pixi aliases
  const loader = new PIXI.Loader();
  const { Sprite, TilingSprite } = PIXI;

  // app
  const app = new PIXI.Application({
    width: sim.width,   
    height: sim.height,
    backgroundColor: baseColor,
    backgroundAlpha: baseAlpha,
    resolution,
    autoDensity,
    antialias,    
    clearBeforeRender,
    preserveDrawingBuffer
  });
  app.ticker.maxFPS = maxFPS;
  target.appendChild(app.view);


  // ===== helper functions ====================================================

  // evaluate option value
  function optionValue(agent, option) {
    return typeof option === 'function' ? option(agent) : option;
  }

  // evaluate background option value
  function backgroundOptionValue(option) {
    return typeof option === 'function' ? option(sim) : option;
  }

  // get image texture for agent
  function imageTexture(agent, option) {
    const imgPath = optionValue(agent, option);
    return imgPath ? PIXI.Texture.from(imgPath) : null;
  }

  // get background image texture
  function backgroundImageTexture() {
    const imgPath = backgroundOptionValue(backgroundSprite);
    return imgPath ? PIXI.Texture.from(imgPath) : null;
  }

  // include agent in vis? 
  function includeAgent({zIndex}) {
    return typeof zIndex === 'number' && !Number.isNaN(zIndex);
  }


  // ===== background ==========================================================

  let addBackground, updateBackground;
  if (background) {

    let spr;

    // add background
    addBackground = function() {
      const texture = backgroundImageTexture() || PIXI.Texture.WHITE;
      if (backgroundTile) {
        spr = TilingSprite.from(texture, {
          width: sim.width,
          height: sim.height
        });
        spr.tileScale.x = sim.gridStep / texture.width;
        spr.tileScale.y = sim.gridStep / texture.height;
      }
      else {
        spr = new Sprite(texture);
        spr.width = sim.width;
        spr.height = sim.height;
      }
      spr.tint = backgroundOptionValue(backgroundTint);
      spr.alpha = backgroundOptionValue(backgroundAlpha);
      app.stage.addChild(spr);
    };

    // update background
    const updateFunctions = [];
    if (typeof backgroundSprite === 'function') {
      updateFunctions.push(() => {
        const texture = backgroundImageTexture() || PIXI.Texture.WHITE;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (typeof backgroundTint === 'function') {
      updateFunctions.push(() => spr.tint = backgroundTint(sim));
    }
    if (typeof backgroundAlpha === 'function') {
      updateFunctions.push(() => spr.alpha = backgroundAlpha(sim));
    }
    if (updateFunctions.length) {
      updateBackground = function() {
        for (let f of updateFunctions) f();
      }
    }

  }


  // =====  back, middle and front containers ==================================

  function createContainer(particles) {
    return particles
      ? new PIXI.ParticleContainer(
          Number.isInteger(particles) ? particles : 10_000,
          { rotation: true, tint: true, vertices: true, autoResize: true }
        )
      : new PIXI.Container();
  }
  const backContainer   = createContainer(backParticles);
  const middleContainer = createContainer(middleParticles);
  const frontContainer  = createContainer(frontParticles);

  // only middle container uses z-index
  middleContainer.sortableChildren = true;

  // add sprite to container
  function addSpriteToContainer(agent, spr) {
    const container = agent.zIndex === -Infinity
      ? backContainer
      : agent.zIndex === Infinity
        ? frontContainer
        : middleContainer;
    container.addChild(spr);
    if (container === middleContainer) {
      spr.zIndex = agent.zIndex;
      if (updateZIndex) spr.__agent__ = agent;
    }
  }

  
  // ===== squares =============================================================

  // add square
  const squaresMap = new Map();
  function addSquare(sq) {
    const info = {};
    info.imgTexture = imageTexture(sq, squareSprite);
    if (!info.imgTexture ||
        (updateSprite && typeof squareSprite === 'function')) {    
      if (optionValue(sq, squareAdvanced)) {
        info.shpTexture = shapeTexture({
          name: 'rect',
          color:     optionValue(sq, squareFillColor),
          alpha:     optionValue(sq, squareFillAlpha),
          lineColor: optionValue(sq, squareLineColor),
          lineWidth: optionValue(sq, squareLineWidth),
          lineAlpha: optionValue(sq, squareLineAlpha),
          lineAlign: optionValue(sq, squareLineAlign),
          width: sim.gridStep,
          height: sim.gridStep
        }, app, true);
      }
      else {
        info.shpTexture = PIXI.Texture.WHITE;
      }
    }
    const spr = new Sprite(info.imgTexture || info.shpTexture);
    spr.position.set(sq.xMin, sq.yMin);
    spr.width = sim.gridStep;
    spr.height = sim.gridStep;
    spr.tint = optionValue(sq, squareTint);
    spr.alpha = optionValue(sq, squareAlpha);
    addSpriteToContainer(sq, spr);
    info.spr = spr;
    squaresMap.set(sq, info);
  };
  
  // update square
  let updateSquare;
  {
    const updateFunctions = [];
    if (updateSprite && typeof squareSprite === 'function') {
      updateFunctions.push((spr, sq) => {
        const info = squaresMap.get(sq);
        info.imgTexture = imageTexture(sq, squareSprite);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (updateTint && typeof squareTint === 'function') {
      updateFunctions.push((spr, sq) => spr.tint = squareTint(sq));
    }
    if (updateAlpha && typeof squareAlpha === 'function') {
      updateFunctions.push((spr, sq) => spr.alpha = squareAlpha(sq));
    }
    if (updateFunctions.length) {
      updateSquare = function({spr}, sq) {
        for (let f of updateFunctions) f(spr, sq);
      };
    }
  }


  // ===== zones ===============================================================
    
  // add zone
  const zonesMap = new Map();
  function addZone(zn) {
    const w = zn.xMax - zn.xMin;
    const h = zn.yMax - zn.yMin;
    const info = {};
    info.imgTexture = imageTexture(zn, zoneSprite);
    const useTiling = optionValue(zn, zoneTile);
    if (!info.imgTexture ||
        (updateSprite && typeof zoneSprite === 'function')) { 
      if (optionValue(zn, zoneAdvanced)) {
        info.shpTexture = shapeTexture({
          name: 'rect',
          color:     optionValue(zn, zoneFillColor),
          alpha:     optionValue(zn, zoneFillAlpha),
          lineColor: optionValue(zn, zoneLineColor),
          lineWidth: optionValue(zn, zoneLineWidth),
          lineAlpha: optionValue(zn, zoneLineAlpha),
          lineAlign: optionValue(zn, zoneLineAlign),
          width: useTiling ? sim.gridStep : w,
          height: useTiling ? sim.gridStep : h,
        }, app, true);
      }
      else {
        info.shpTexture = PIXI.Texture.WHITE;
      }
    }
    let spr;
    const texture = info.imgTexture || info.shpTexture;
    if (useTiling) {
      spr = TilingSprite.from(texture, {width: w, height: h});
      spr.tileScale.x = sim.gridStep / texture.width;
      spr.tileScale.y = sim.gridStep / texture.height;
    }
    else {
      spr = new Sprite(texture);
      spr.width = w;
      spr.height = h;
    }
    spr.position.set(zn.xMin, zn.yMin);
    spr.tint = optionValue(zn, zoneTint);
    spr.alpha = optionValue(zn, zoneAlpha);
    addSpriteToContainer(zn, spr);
    info.spr = spr;
    zonesMap.set(zn, info);
  };

  // update zone
  let updateZone;
  {
    const updateFunctions = [];
    if (updateSprite && typeof zoneSprite === 'function') {
      updateFunctions.push((spr, zn) => {
        const info = zonesMap.get(zn);
        info.imgTexture = imageTexture(zn, zoneSprite);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (updateTint && typeof zoneTint === 'function') {
      updateFunctions.push((spr, zn) => spr.tint = zoneTint(zn));
    }
    if (updateAlpha && typeof zoneAlpha === 'function') {
      updateFunctions.push((spr, zn) => spr.alpha = zoneAlpha(zn));
    }
    if (updateFunctions.length) {
      updateZone = function({spr}, zn) {
        for (let f of updateFunctions) f(spr, zn);
      }
    }
  }


  // ===== actors ==============================================================

  // basic circle texture
  const basicCircle = shapeTexture({
    name: 'circle',
    color: 0xffffff,
    radius: basicCircleRadius
  }, app);

  // add actor
  const actorsMap = new Map();
  function addActor(ac) {
    const info = {};
    info.imgTexture = imageTexture(ac, actorSprite);
    if (!info.imgTexture ||
        (updateSprite && typeof actorSprite === 'function')) { 
      if (optionValue(ac, actorAdvanced)) {
        info.shpTexture = shapeTexture({
          name: 'circle',
          color:     optionValue(ac, actorFillColor),
          alpha:     optionValue(ac, actorFillAlpha),
          lineColor: optionValue(ac, actorLineColor),
          lineWidth: optionValue(ac, actorLineWidth) * advancedCircleScale,
          lineAlpha: optionValue(ac, actorLineAlpha),
          lineAlign: optionValue(ac, actorLineAlign),
          radius: ac.radius * advancedCircleScale,
        }, app, true);
      }
      else {
        info.shpTexture = basicCircle;
      }
    }
    const spr = new Sprite(info.imgTexture || info.shpTexture);
    spr.anchor.set(0.5, 0.5);
    spr.position.set(ac.x, ac.y);
    spr.width = spr.height = 2 * ac.radius;
    spr.rotation = ac.pointing ?? ac.heading();
    spr.tint = optionValue(ac, actorTint);
    spr.alpha = optionValue(ac, actorAlpha);
    addSpriteToContainer(ac, spr);
    info.spr = spr;
    actorsMap.set(ac, info);
  };

  // update actor
  let updateActor;
  {
    const updateFunctions = [];
    if (updateSprite && typeof actorSprite === 'function') {
      updateFunctions.push((spr, ac) => {
        const info = actorsMap.get(ac);
        info.imgTexture = imageTexture(ac, actorSprite);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (updateRadius) {
      updateFunctions.push((spr, ac) => {
        spr.width = spr.height = 2 * ac.radius;
      });
    }
    if (updatePointing) {
      updateFunctions.push((spr, ac) => {
        spr.rotation = ac.pointing ?? ac.heading();
      });
    }
    if (updateTint && typeof actorTint === 'function') {
      updateFunctions.push((spr, ac) => spr.tint = actorTint(ac));
    }
    if (updateAlpha && typeof actorAlpha === 'function') {
      updateFunctions.push((spr, ac) => spr.alpha = actorAlpha(ac));
    }
    updateActor = function({spr}, ac) {
      spr.position.set(ac.x, ac.y);
      for (let f of updateFunctions) f(spr, ac);
    };
  }

  
  // ===== setup function ======================================================

  function setup() {

    // before setup
    beforeSetup?.(sim, app, PIXI);

    // add background
    addBackground?.();

    // add squares, zones and actors
    for (let sq of sim.squares) if (includeAgent(sq)) addSquare(sq);
    for (let zn of sim.zones)   if (includeAgent(zn)) addZone(zn);
    for (let ac of sim.actors)  if (includeAgent(ac)) addActor(ac);
    
    // add containers to stage
    app.stage.addChild(backContainer);
    app.stage.addChild(middleContainer);
    app.stage.addChild(frontContainer);

    // after setup
    afterSetup?.(sim, app, PIXI);

    // sort on z-index and disable future sorting if appropriate
    middleContainer.sortChildren();
    if (!updateZIndex) middleContainer.sortableChildren = false;

    // run simulation
    if (run) app.ticker.add(tick);

    // destroy loader
    loader.destroy();

  }

  // setup stats
  if (stats) {
    var fpsLast5 = [];
    var statsDiv = target.appendChild(document.createElement('div'));
    statsDiv.style.font = '14px sans-serif';
  }


  // ===== tick function =======================================================

  function tick() {

    // finished?
    if (sim._finished) {
      finished?.(sim, app, PIXI);
      app.ticker.stop();
      if (cleanup) {
        statsDiv?.remove();
        app.stop();
        app.renderer.context.gl.getExtension('WEBGL_lose_context').loseContext();
        app.destroy(true, {children: true, texture: false, baseTexture: false});
      }
      return;
    }

    // paused?
    if (sim._pause) return;

    // before tick
    beforeTick?.(sim, app, PIXI);

    // simulation tick
    sim.tick();

    // background: update
    updateBackground?.();

    // squares: update
    if (updateSquare) squaresMap.forEach(updateSquare);
    
    // zones: remove, add, update
    for (let zn of sim._zonesRemoved) {
      if (zonesMap.has(zn)) {
        const spr = zonesMap.get(zn).spr;
        spr.parent.removeChild(spr);
        zonesMap.delete(zn);
      }
    }
    for (let zn of sim._zonesAdded) {
      if (includeAgent(zn)) addZone(zn);
    }
    if (updateZone) zonesMap.forEach(updateZone);
    
    // actors: remove, add, update
    for (let ac of sim._actorsRemoved) {
      if (actorsMap.has(ac)) {
        const spr = actorsMap.get(ac).spr;
        spr.parent.removeChild(spr);
        actorsMap.delete(ac);
      }
    }
    for (let ac of sim._actorsAdded) {
      if (includeAgent(ac)) addActor(ac);
    }
    if (updateActor) actorsMap.forEach(updateActor);

    // after tick
    afterTick?.(sim, app, PIXI);

    // update z-index
    if (updateZIndex &&
        (typeof updateZIndex !== 'function' || updateZIndex(sim))) {
      for (let spr of middleContainer.children) {
        spr.zIndex = spr.__agent__.zIndex;
      }
      middleContainer.sortChildren();
    }

    // update stats
    if (stats) {
      fpsLast5.push(app.ticker.FPS);
      if (sim.tickIndex % 5 === 0) {
        statsDiv.textContent =
          `squares ${sim.squares.size
          } | zones ${sim.zones.size
          } | actors ${sim.actors.size
          } | FPS ${Math.round(fpsLast5.reduce((prev, curr) => prev + curr, 0) /
             fpsLast5.length)}`;
        fpsLast5.length = 0;
      }
    }

  }

  
  // =====  load sprite images then call setup =================================
  // - filter out images that have already been loaded
  // - urls of spritesheets have '_image' appended to them in the TextureCache
  
  const cachedTextureURLs = Object.keys(PIXI.utils.TextureCache);
  loader.add(sprites.filter(src => {
    return src.split('.').pop() === 'json'
      ? !cachedTextureURLs.some(s => s.slice(0, src.length) === src)
      : !PIXI.utils.TextureCache[src];
  })).load(setup);
  return app;

}


// ===== convenience function for using vis in Observable ======================

export function visObs(sim, options) {
  const div = document.createElement('div');
  options = {...options, target: div, cleanup: true};
  vis(sim, options);
  return div;
}