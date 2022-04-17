////////////////////////////////////////////////////////////////////////////////
// Vis function.
////////////////////////////////////////////////////////////////////////////////

import * as PIXI from 'pixi.js';
import { shapeTexture } from './shape-texture.js';
import { colors } from './colors.js';

PIXI.utils.skipHello();

export { PIXI, colors };

export function vis(sim, options = {}) {

  // options
  const {
    
    target                  = document.body,
    run                     = true,
    maxFPS                  = 0,
    stats                   = false,
    cleanup                 = false,
    resolution              = window.devicePixelRatio || 1,
    autoDensity             = true,
    antialias               = true,  
    clearBeforeRender       = true,
    sprites                 = [],
    beforeSetup             = null,
    afterSetup              = null,
    beforeTick              = null,
    afterTick               = null,
    finished                = null,
        
    baseColor               = 0x808080,
    baseAlpha               = 1,

    backgroundVisible       = false,
    backgroundTint          = 0xffffff,
    backgroundAlpha         = 1,
    backgroundSprite        = null,
    updateBackgroundVisible = true,
    updateBackgroundTint    = true,
    updateBackgroundAlpha   = true,
    updateBackgroundSprite  = true,
    backgroundTile          = false,

    squareVisible           = false,
    squareTint              = 0xffffff,  
    squareAlpha             = 1,
    squareSprite            = null,
    updateSquareVisible     = true,
    updateSquareTint        = true,
    updateSquareAlpha       = true,
    updateSquareSprite      = true,
    squareAdvanced          = false,
    squareLineColor         = 0x0,
    squareLineAlpha         = 1,
    squareLineWidth         = 1,
    squareLineAlign         = 0.5,
    squareFillColor         = 0xffffff,
    squareFillAlpha         = 1,
    squareParticles         = false,
    
    zoneVisible             = true,
    zoneTint                = 0xffffff,
    zoneAlpha               = 1,
    zoneSprite              = null,
    updateZoneVisible       = true,
    updateZoneTint          = true,
    updateZoneAlpha         = true,
    updateZoneSprite        = true,
    zoneAdvanced            = false,
    zoneLineColor           = 0x0,
    zoneLineAlpha           = 1,
    zoneLineWidth           = 1,
    zoneLineAlign           = 0.5,
    zoneFillColor           = 0xffffff,
    zoneFillAlpha           = 1,
    zoneTile                = false,
    zoneParticles           = false,
    
    actorVisible            = true,
    actorTint               = 0xffffff,
    actorAlpha              = 1,
    actorSprite             = null,
    updateActorVisible      = true,
    updateActorTint         = true,
    updateActorAlpha        = true,
    updateActorSprite       = true,
    actorAdvanced           = false,
    actorLineColor          = 0x0,
    actorLineAlpha          = 1,
    actorLineWidth          = 1,
    actorLineAlign          = 0.5,
    actorFillColor          = 0xffffff,
    actorFillAlpha          = 1,
    actorPointing           = true,
    actorRadius             = true,
    actorParticles          = false,
    basicCircleRadius       = 64,
    advancedCircleScale     = 5,
    
  } = options;

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
    clearBeforeRender
  });
  app.ticker.maxFPS = maxFPS;
  target.appendChild(app.view);

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

  // background
  let addBackground, updateBackground;
  if (backgroundVisible) {  // backgroundVisible may be function or other truthy

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
      spr.visible = backgroundOptionValue(backgroundVisible);
      app.stage.addChild(spr);
    };

    // update background
    let updateVisible;
    if (updateBackgroundVisible && typeof backgroundVisible === 'function') {
      updateVisible = () => spr.visible = backgroundVisible(sim);
    }    
    const updateFunctions = [];
    if (updateBackgroundSprite && typeof backgroundSprite === 'function') {
      updateFunctions.push(() => {
        const texture = backgroundImageTexture() || PIXI.Texture.WHITE;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (updateBackgroundTint && typeof backgroundTint === 'function') {
      updateFunctions.push(() => spr.tint = backgroundTint(sim));
    }
    if (updateBackgroundAlpha && typeof backgroundAlpha === 'function') {
      updateFunctions.push(() => spr.alpha = backgroundAlpha(sim));
    }
    if (updateVisible || updateFunctions.length) {
      updateBackground = function() {
        updateVisible?.();
        if (spr.visible) {
          for (let f of updateFunctions) f();
        }
      };
    }

  }

  // squares
  let squaresMap, squaresContainer, addSquare, updateSquare;
  if (squareVisible) {  // squareVisible may be function or other truthy

    // squares map and container
    squaresMap = new Map();
    squaresContainer = squareParticles
      ? new PIXI.ParticleContainer(sim.squares.size, {tint: true})
      : new PIXI.Container();
  
    // add square
    addSquare = function(sq) {
      const info = {};
      info.imgTexture = imageTexture(sq, squareSprite);
      if (!info.imgTexture ||
          (updateSquareSprite && typeof squareSprite === 'function')) {    
        if (optionValue(sq, squareAdvanced)) {
          info.shpTexture = shapeTexture({
            name: 'rect',
            color: optionValue(sq, squareFillColor),
            alpha: optionValue(sq, squareFillAlpha),
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
      spr.visible = optionValue(sq, squareVisible);
      info.spr = spr;
      squaresContainer.addChild(spr);
      squaresMap.set(sq, info);
    };
  
    // update square
    let updateVisible;
    if (updateSquareVisible && typeof squareVisible === 'function') {
      updateVisible = (spr, sq) => spr.visible = squareVisible(sq);
    } 
    const updateFunctions = [];
    if (updateSquareSprite && typeof squareSprite === 'function') {
      updateFunctions.push((spr, sq) => {
        const info = squaresMap.get(sq);
        info.imgTexture = imageTexture(sq, squareSprite);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (updateSquareTint && typeof squareTint === 'function') {
      updateFunctions.push((spr, sq) => spr.tint = squareTint(sq));
    }
    if (updateSquareAlpha && typeof squareAlpha === 'function') {
      updateFunctions.push((spr, sq) => spr.alpha = squareAlpha(sq));
    }
    if (updateVisible || updateFunctions.length) {
      updateSquare = function({spr}, sq) {
        updateVisible?.(spr, sq);
        if (spr.visible) {
          for (let f of updateFunctions) f(spr, sq);
        }
      };
    }

  }

  // zones
  let zonesMap, zonesContainer, addZone, updateZone;
  if (zoneVisible) {  // zoneVisible may be function or other truthy
    
    // zones map and container
    zonesMap = new Map();
    zonesContainer = zoneParticles
      ? new PIXI.ParticleContainer(
          Number.isInteger(zoneParticles) ? zoneParticles : 1000, 
          {tint: true}
        )
      : new PIXI.Container();

    // add zone
    addZone = function(zn) {
      const w = zn.xMax - zn.xMin;
      const h = zn.yMax - zn.yMin;
      const info = {};
      info.imgTexture = imageTexture(zn, zoneSprite);
      const useTiling = optionValue(zn, zoneTile);
      if (!info.imgTexture ||
          (updateZoneSprite && typeof zoneSprite === 'function')) { 
        if (optionValue(zn, zoneAdvanced)) {
          info.shpTexture = shapeTexture({
            name: 'rect',
            color: optionValue(zn, zoneFillColor),
            alpha: optionValue(zn, zoneFillAlpha),
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
      spr.visible = optionValue(zn, zoneVisible);
      info.spr = spr;
      zonesContainer.addChild(spr);
      zonesMap.set(zn, info);
    };

    // update zone
    let updateVisible;
    if (updateZoneVisible && typeof zoneVisible === 'function') {
      updateVisible = (spr, zn) => spr.visible = zoneVisible(zn);
    } 
    const updateFunctions = [];
    if (updateZoneSprite && typeof zoneSprite === 'function') {
      updateFunctions.push((spr, zn) => {
        const info = zonesMap.get(zn);
        info.imgTexture = imageTexture(zn, zoneSprite);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (updateZoneTint && typeof zoneTint === 'function') {
      updateFunctions.push((spr, zn) => spr.tint = zoneTint(zn));
    }
    if (updateZoneAlpha && typeof zoneAlpha === 'function') {
      updateFunctions.push((spr, zn) => spr.alpha = zoneAlpha(zn));
    }
    if (updateVisible || updateFunctions.length) {
      updateZone = function({spr}, zn) {
        updateVisible?.(spr, zn);
        if (spr.visible) {
          for (let f of updateFunctions) f(spr, zn);
        }
      };
    }
  }

  // actors
  let actorsMap, actorsContainer, addActor, updateActor;
  if (actorVisible) {  // actorVisible may be function or other truthy

    // basic circle texture
    const basicCircle = shapeTexture({
      name: 'circle',
      color: 0xffffff,
      radius: basicCircleRadius
    }, app);

    // actors map and container
    actorsMap = new Map();
    actorsContainer = actorParticles
      ? new PIXI.ParticleContainer(
          Number.isInteger(actorParticles) ? actorParticles : 10000,
          { rotation: true, tint: true, vertices: true }
        )
      : new PIXI.Container();

    // add actor
    addActor = function(ac) {
      const info = {};
      info.imgTexture = imageTexture(ac, actorSprite);
      if (!info.imgTexture ||
          (updateActorSprite && typeof actorSprite === 'function')) { 
        if (optionValue(ac, actorAdvanced)) {
          info.shpTexture = shapeTexture({
            name: 'circle',
            color: optionValue(ac, actorFillColor),
            alpha: optionValue(ac, actorFillAlpha),
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
      spr.visible = optionValue(ac, actorVisible);
      info.spr = spr;
      actorsContainer.addChild(spr);
      actorsMap.set(ac, info);
    };

    // update actor
    let updateVisible;
    if (updateActorVisible && typeof actorVisible === 'function') {
      updateVisible = (spr, ac) => spr.visible = actorVisible(ac);
    } 
    const updateFunctions = [];
    if (updateActorSprite && typeof actorSprite === 'function') {
      updateFunctions.push((spr, ac) => {
        const info = actorsMap.get(ac);
        info.imgTexture = imageTexture(ac, actorSprite);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (actorRadius) {
      const actorRadiusIsFunction = typeof actorRadius === 'function';
      updateFunctions.push((spr, ac) => {
        if (!actorRadiusIsFunction || actorRadius(ac)) {
          spr.width = spr.height = 2 * ac.radius;
        }
      });
    }
    if (actorPointing) {
      const actorPointingIsFunction = typeof actorPointing === 'function';
      updateFunctions.push((spr, ac) => {
        if (!actorPointingIsFunction || actorPointing(ac)) {
          spr.rotation = ac.pointing ?? ac.heading();
        }
      });
    }
    if (updateActorTint && typeof actorTint === 'function') {
      updateFunctions.push((spr, ac) => spr.tint = actorTint(ac));
    }
    if (updateActorAlpha && typeof actorAlpha === 'function') {
      updateFunctions.push((spr, ac) => spr.alpha = actorAlpha(ac));
    }
    updateActor = function({spr}, ac) {
      updateVisible?.(spr, ac);
      if (spr.visible) {
        spr.position.set(ac.x, ac.y);
        for (let f of updateFunctions) f(spr, ac);
      }
    };
  }

  // setup
  function setup() {

    // before setup
    beforeSetup?.(sim, app, PIXI);

    // add background
    addBackground?.();

    // add squares
    if (squareVisible) {
      sim.squares.forEach(addSquare);
      app.stage.addChild(squaresContainer);
    }
    
    // add zones
    if (zoneVisible) {
      sim.zones.forEach(addZone);
      app.stage.addChild(zonesContainer);
    }
    
    // add actors
    if (actorVisible) {
      sim.actors.forEach(addActor);
      app.stage.addChild(actorsContainer);
    }

    // after setup
    afterSetup?.(sim, app, PIXI);
  
    // run simulation
    if (run) app.ticker.add(tick);

    // reset loader
    loader.destroy();

  }

  // setup stats
  if (stats) {
    var fpsLast5 = [];
    var statsDiv = target.appendChild(document.createElement('div'));
    statsDiv.style.font = '14px sans-serif';
  }

  // tick
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
    if (zoneVisible) {
      for (let zn of sim._zonesRemoved) {
        zonesContainer.removeChild(zonesMap.get(zn).spr);
        zonesMap.delete(zn);
      }
      sim._zonesAdded.forEach(addZone);
      if (updateZone) zonesMap.forEach(updateZone);
    }

    // actors: remove, add, update
    if (actorVisible) {
      for (let ac of sim._actorsRemoved) {
        actorsContainer.removeChild(actorsMap.get(ac).spr);
        actorsMap.delete(ac);
      }
      sim._actorsAdded.forEach(addActor);
      if (updateActor) actorsMap.forEach(updateActor);
    }

    // after tick
    afterTick?.(sim, app, PIXI);

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

  // load sprite images (unless already loaded) then call setup
  // - urls of spritesheets have '_image' appended to them in the TextureCache
  const cachedTextureURLs = Object.keys(PIXI.utils.TextureCache);
  loader.add(sprites.filter(src => {
    return src.split('.').pop() === 'json'
      ? !cachedTextureURLs.some(s => s.slice(0, src.length) === src)
      : !PIXI.utils.TextureCache[src];
  })).load(setup);
  return app;

}

// convenience function for using vis in Observable
export function visObs(sim, options) {
  const div = document.createElement('div');
  options = {...options, target: div, cleanup: true};
  vis(sim, options);
  return div;
}