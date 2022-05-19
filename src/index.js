////////////////////////////////////////////////////////////////////////////////
// Vis function.
////////////////////////////////////////////////////////////////////////////////

// use browser version of PixiJS to fix issue #2
import * as PIXI from '../node_modules/pixi.js/dist/browser/pixi.mjs';
import { shapeTexture } from './shape-texture.js';
import { colors } from './colors.js';
import { defaults } from './defaults.js';

PIXI.utils.skipHello();

export { PIXI, colors };


// ===== vis function ==========================================================

export function vis(sim, visOps = {}) {

  // default vis options
  visOps = Object.assign({}, defaults.vis, visOps);


  // ===== local helper functions ==============================================

  // evaluate agent option - which may be a function, value or absent
  function optionValue(agent, optionName) {
    if (agent._visUpdates?.has(optionName)) {
      return agent._visUpdates.get(optionName)(agent) ??
        defaults[agent.type][optionName];
    }
    else {
      return agent._vis?.get(optionName) ?? defaults[agent.type][optionName];
    }
  }

  // evaluate simulation option - which may be a function, value or absent
  function simulationOptionValue(optionName) {
    if (sim._visUpdates?.has(optionName)) {
      return sim._visUpdates.get(optionName)(sim) ??
        defaults.simulation[optionName];
    }
    else {
      return sim._vis?.get(optionName) ?? defaults.simulation[optionName];
    }
  }

  // include agent in vis? 
  function includeAgent({zIndex}) {
    return typeof zIndex === 'number' && !Number.isNaN(zIndex);
  }

  // is nullish?
  function isNullish(v) {
    return v === null || v === undefined;
  }


  // ===== Pixi and app ========================================================

  // Pixi aliases
  const loader = new PIXI.Loader();
  const { Sprite, TilingSprite } = PIXI;

  // app
  const app = new PIXI.Application({
    width: sim.width,   
    height: sim.height,
    backgroundColor: simulationOptionValue('baseColor'),
    backgroundAlpha: simulationOptionValue('baseAlpha'),
    resolution: visOps.resolution,
    autoDensity: visOps.autoDensity,
    antialias: visOps.antialias,    
    clearBeforeRender: visOps.clearBeforeRender,
    preserveDrawingBuffer: visOps.preserveDrawingBuffer
  });
  app.ticker.maxFPS = visOps.maxFPS;
  visOps.target.appendChild(app.view);


  // ===== add bitmap text to sprite ===========================================

  function addText(content, agent, spr) {

    if (isNullish(content) || content === '') return;
    content = String(content);
    const type = agent.type;
    const isTilingSprite = type === 'zone' && spr instanceof PIXI.TilingSprite;
    const xScale = isTilingSprite ? 1 : spr.texture.width / spr.width;
    const fontName = optionValue(agent, 'fontName');
    const fontSize = optionValue(agent, 'fontSize') ;
    const align    = optionValue(agent, 'textAlign');
    const tint     = optionValue(agent, 'textTint');
    const alpha    = optionValue(agent, 'textAlpha');
    let txt;
    
    // actor
    if (type === 'actor') {
      txt = new PIXI.BitmapText(content, {
        fontName,
        fontSize: fontSize * xScale,
        align,
        tint,
        maxWidth: optionValue(agent, 'textMaxWidth') * xScale
      });
      txt.alpha = alpha;
      txt.anchor = new PIXI.Point(0.5, 0.5);
      if (!optionValue(agent, 'textRotate')) txt.rotation = -spr.rotation;
    }

    // square or zone
    else {
      const yScale = isTilingSprite ? 1 : spr.texture.height / spr.height;
      const position = optionValue(agent, 'textPosition');
      const padding  = optionValue(agent, 'textPadding');
      txt = new PIXI.BitmapText(content, {
        fontName,
        fontSize: fontSize * xScale,
        align,
        tint,
        maxWidth: agent.xMax - agent.xMin - 2 * padding
      });
      txt.alpha = alpha;
      if (!spr.texture.__advanced__ && !isTilingSprite) {
        txt.height *= spr.width / spr.height;
        txt.maxWidth *= xScale;
      }
      let x = (agent.x - agent.xMin) * xScale;
      let y = (agent.y - agent.yMin) * yScale;
      let xAnchor = 0.5;
      let yAnchor = 0.5;
      if (position.includes('top')) {
        y = padding * yScale;
        yAnchor = 0;
      }
      else if (position.includes('bottom')) {
        y = (agent.yMax - agent.yMin - padding) * yScale;
        yAnchor = 1;
      }
      if (position.includes('right')) {
        x = (agent.xMax - agent.xMin - padding) * xScale;
        xAnchor = 1;
      }
      else if (position.includes('left')) {
        x = padding * xScale;
        xAnchor = 0;
      }
      txt.x = x;
      txt.y = y;
      txt.anchor = new PIXI.Point(xAnchor, yAnchor);
    }

    spr.addChild(txt);

  }


  // ===== add event listeners to sprites ======================================

  // agent will be the simulation if spr is the background
  function addInteraction(agent, spr) {
    if (agent._interaction) {
      spr.interactive = true;
      spr.interactiveChildren = false;
      for (let [eventName, handler] of agent._interaction) {
        spr.on(eventName, handler);
      }
    }
    if (agent.type === 'actor') {
      spr.hitArea = new PIXI.Circle(agent.x, agent.y, agent.radius);
    }
  }


  // ===== background ==========================================================

  let addBackground, updateBackground;
  if (simulationOptionValue('background')) {

    let spr;

    // add background
    addBackground = function() {
      const imgPath = simulationOptionValue('image');
      const texture = imgPath
        ? PIXI.Texture.from(imgPath)
        : PIXI.Texture.WHITE;
      if (simulationOptionValue('tile')) {
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
      spr.tint = simulationOptionValue('tint');
      spr.alpha = simulationOptionValue('alpha');
      addInteraction(sim, spr);
      app.stage.addChild(spr);
    };

    // update background
    if (sim._visUpdates) {
      const backgroundUpdateFunctions = {    
        tint: f => spr.tint = f(sim) ?? defaults.simulation.tint,
        alpha: f => spr.alpha = f(sim) ?? defaults.simulation.alpha,
        image: f => {
          const imgPath = f(sim) ?? defaults.simulation.image;
          const texture = imgPath 
            ? PIXI.Texture.from(imgPath)
            : PIXI.Texture.WHITE;
          if (spr.texture !== texture) spr.texture = texture;
        }
      };
      updateBackground = function() {
        for (let [key, f] of sim._visUpdates) {
          backgroundUpdateFunctions[key](f);
        }
      }
    }

  }


  // ===== containers, agent maps and update sets ==============================

  function createContainer(particles) {
    if (particles) {
      const maxSize = Number.isInteger(particles) ? particles : 10_000;
      return new PIXI.ParticleContainer(
        maxSize,
        { rotation: true, tint: true, vertices: true },
        maxSize,
        true
      );
    }
    return new PIXI.Container();
  }
  const backContainer   = createContainer(visOps.backParticles);
  const middleContainer = createContainer(visOps.middleParticles);
  const frontContainer  = createContainer(visOps.frontParticles);

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
      if (visOps.updateDrawOrder) spr.__agent__ = agent;
    }
  }

  const agentMaps = {
    square: new Map(),
    zone:   new Map(),
    actor:  new Map()
  };

  const updateSets = {
    square: new Set(),
    zone:   new Set()
  };

  
  // ===== add square or zone ==================================================

  function addSquareOrZone(agent) {
    const type = agent.type;
    let w, h, useTiling;
    if (type === 'zone') {
      w = agent.xMax - agent.xMin;
      h = agent.yMax - agent.yMin;
      useTiling = optionValue(agent, 'tile');
    }
    const info = {};
    const imgPath = optionValue(agent, 'image');
    const imgTexture = imgPath ? PIXI.Texture.from(imgPath) : null;
    if (!imgTexture || agent._visUpdates?.has('image')) {    
      if (optionValue(agent, 'advanced')) {
        info.shpTexture = shapeTexture({
          name: 'rect',
          color:     optionValue(agent, 'fillColor'),
          alpha:     optionValue(agent, 'fillAlpha'),
          lineColor: optionValue(agent, 'lineColor'),
          lineWidth: optionValue(agent, 'lineWidth'),
          lineAlpha: optionValue(agent, 'lineAlpha'),
          lineAlign: optionValue(agent, 'lineAlign'),
          width:  type === 'zone' && !useTiling ? w : sim.gridStep,  
          height: type === 'zone' && !useTiling ? h : sim.gridStep
        }, app, true);
        info.shpTexture.__advanced__ = true;
      }
      else {
        info.shpTexture = PIXI.Texture.WHITE;
      }
    }
    let spr;
    if (type === 'square') {
      spr = new Sprite(imgTexture || info.shpTexture);
      spr.width = sim.gridStep;
      spr.height = sim.gridStep;
    }
    else {  // zone
      const texture = imgTexture || info.shpTexture;
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
    }
    spr.position.set(agent.xMin, agent.yMin);
    spr.tint = optionValue(agent, 'tint');
    spr.alpha = optionValue(agent, 'alpha');
    addText(optionValue(agent, 'text'), agent, spr);
    addInteraction(agent, spr);
    addSpriteToContainer(agent, spr);
    info.spr = spr;
    agentMaps[type].set(agent, info);
    if (agent._visUpdates) updateSets[type].add(agent);
  }


  // ===== add actor ===========================================================

  // basic circle texture
  const basicCircle = shapeTexture({
    name: 'circle',
    color: 0xffffff,
    radius: visOps.basicCircleRadius
  }, app);

  // add actor
  function addActor(ac) {
    const info = {};
    const imgPath = optionValue(ac, 'image');
    const imgTexture = imgPath ? PIXI.Texture.from(imgPath) : null;
    if (!imgTexture || ac._visUpdates?.has('image')) {
      if (optionValue(ac, 'advanced')) {
        info.shpTexture = shapeTexture({
          name: 'circle',
          color:     optionValue(ac, 'fillColor'),
          alpha:     optionValue(ac, 'fillAlpha'),
          lineColor: optionValue(ac, 'lineColor'),
          lineWidth: optionValue(ac, 'lineWidth') * visOps.advancedCircleScale,
          lineAlpha: optionValue(ac, 'lineAlpha'),
          lineAlign: optionValue(ac, 'lineAlign'),
          radius: ac.radius * visOps.advancedCircleScale,
        }, app, true);
      }
      else {
        info.shpTexture = basicCircle;
      }
    }
    const spr = new Sprite(imgTexture || info.shpTexture);
    spr.anchor.set(0.5, 0.5);
    spr.position.set(ac.x, ac.y);
    spr.width = spr.height = 2 * ac.radius;
    spr.rotation = ac.pointing ?? ac.heading();
    spr.tint = optionValue(ac, 'tint');
    spr.alpha = optionValue(ac, 'alpha');
    addText(optionValue(ac, 'text'), ac, spr);
    addInteraction(ac, spr);
    addSpriteToContainer(ac, spr);
    info.spr = spr;
    agentMaps.actor.set(ac, info);
  };


  // ===== update agent ========================================================

  const agentUpdateFunctions = {
    tint: (agent, spr, f) => {
      spr.tint = f(agent) ?? defaults[agent.type].tint;
    },
    alpha: (agent, spr, f) => {
      spr.alpha = f(agent) ?? defaults[agent.type].alpha;
    },
    image: (agent, spr, f) => {
      const imgPath = f(agent) ?? defaults[agent.type].image;
      const texture = imgPath 
        ? PIXI.Texture.from(imgPath)
        : agentMaps[agent.type].get(agent).shpTexture;
      if (spr.texture !== texture) spr.texture = texture;
    },
    text: (agent, spr, f) => {
      const txt = spr.children[0];
      let content = f(agent) ?? defaults[agent.type].text;
      if (isNullish(content) || content === '') {
        if (txt) txt.text = '';
      }
      else {
        txt ? (txt.text = String(content)) : addText(content, agent, spr);
      }
    },
    fontSize: (agent, spr, f) => {
      const txt = spr.children[0];
      if (txt?.text) {
        txt.fontSize = (f(agent) ?? defaults[agent.type].fontSize) *
          (agent._vis?.tile ?? defaults[agent.type].tile
            ? 1
            : spr.texture.width / spr.width
          );
      }
    },
    textTint: (agent, spr, f) => {
      const txt = spr.children[0];
      if (txt?.text) txt.tint = f(agent) ?? defaults[agent.type].textTint;
    },
    textAlpha: (agent, spr, f) => {
      const txt = spr.children[0];
      if (txt?.text) txt.alpha = f(agent) ?? defaults[agent.type].textAlpha;
    },
    fontName: (agent, spr, f) => {
      const txt = spr.children[0];
      if (txt?.text) txt.fontName = f(agent) ?? defaults[agent.type].fontName;
    }
  };
  function updateAgent(agent, {spr}) {
    if (agent.type === 'actor') {
      spr.position.set(agent.x, agent.y);
      if (agent._interaction) {
        spr.hitArea.x = agent.x;
        spr.hitArea.y = agent.y;
      }
      if (visOps.updateRadii) {
        spr.width = spr.height = 2 * agent.radius;
        if (agent._interaction) {
          spr.hitArea.radius = agent.radius;
        }
      }
      if (visOps.updatePointings) {
        spr.rotation = agent.pointing ?? agent.heading();
        const txt = spr.children[0];
        if (txt?.text &&
            !(agent._vis.textRotate ?? defaults.actor.textRotate)) {
          txt.rotation = -spr.rotation;
        }
      }
    }
    if (agent._visUpdates) {
      for (let [key, f] of agent._visUpdates) {
        agentUpdateFunctions[key](agent, spr, f);
      }
    }
  }

  
  // ===== setup function ======================================================

  function setup() {

    // before setup
    visOps.beforeSetup?.(sim, app, PIXI);

    // add background
    addBackground?.();

    // add squares, zones and actors
    for (let sq of sim.squares) if (includeAgent(sq)) addSquareOrZone(sq);
    for (let zn of sim.zones)   if (includeAgent(zn)) addSquareOrZone(zn);
    for (let ac of sim.actors)  if (includeAgent(ac)) addActor(ac);
    
    // add containers to stage
    app.stage.addChild(backContainer);
    app.stage.addChild(middleContainer);
    app.stage.addChild(frontContainer);

    // after setup
    visOps.afterSetup?.(sim, app, PIXI);

    // sort on z-index and disable future sorting if appropriate
    middleContainer.sortChildren();
    if (!visOps.updateDrawOrder) middleContainer.sortableChildren = false;

    // run simulation
    if (visOps.run) app.ticker.add(tick);

    // destroy loader
    loader.destroy();

  }

  // setup stats
  if (visOps.stats) {
    var fpsLast5 = [];
    var statsDiv = visOps.target.appendChild(document.createElement('div'));
    statsDiv.style.font = '14px sans-serif';
  }


  // ===== tick function =======================================================

  function tick() {

    // finished?
    if (sim._finished) {
      visOps.finished?.(sim, app, PIXI);
      app.ticker.stop();
      if (visOps.cleanup) {
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
    visOps.beforeTick?.(sim, app, PIXI);

    // simulation tick
    sim.tick();

    // background: update
    updateBackground?.();

    // squares: update
    for (let sq of updateSets.square) {
      updateAgent(sq, agentMaps.square.get(sq));
    }
    
    // zones: remove, add, update
    for (let zn of sim._zonesRemoved) {
      if (agentMaps.zone.has(zn)) {
        const spr = agentMaps.zone.get(zn).spr;
        spr.parent.removeChild(spr);
        agentMaps.zone.delete(zn);
        updateSets.zone.delete(zn);
      }
    }
    for (let zn of sim._zonesAdded) {
      if (includeAgent(zn)) addSquareOrZone(zn);
    }
    for (let zn of updateSets.zone) {
      updateAgent(zn, agentMaps.zone.get(zn));
    }
    
    // actors: remove, add, update
    for (let ac of sim._actorsRemoved) {
      if (agentMaps.actor.has(ac)) {
        const spr = agentMaps.actor.get(ac).spr;
        spr.parent.removeChild(spr);
        agentMaps.actor.delete(ac);
      }
    }
    for (let ac of sim._actorsAdded) {
      if (includeAgent(ac)) addActor(ac);
    }
    for (let [ac, info] of agentMaps.actor) {
      updateAgent(ac, info);
    }
    
    // after tick
    visOps.afterTick?.(sim, app, PIXI);

    // update z-index
    if (visOps.updateDrawOrder &&
        (typeof visOps.updateDrawOrder !== 'function' ||
          visOps.updateDrawOrder(sim))) {
      for (let spr of middleContainer.children) {
        spr.zIndex = spr.__agent__.zIndex;
      }
      middleContainer.sortChildren();
    }

    // update stats
    if (visOps.stats) {
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

  
  // =====  load image files then call setup ==================================

  function getStem(s) {
    const dotIndex = s.lastIndexOf('.');
    return dotIndex === -1 ? s : s.slice(0, dotIndex);
  }
  const cachedTextureStems =
    new Set(Object.keys(PIXI.utils.TextureCache).map(getStem));
  loader
    .add(visOps.images.filter(src => !cachedTextureStems.has(getStem(src))))
    .load(setup);
  return app;

}


// ===== convenience function for using vis in Observable ======================

export function visObs(sim, visOps) {
  const div = document.createElement('div');
  visOps = {...visOps, target: div, cleanup: true};
  vis(sim, visOps);
  return div;
}