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

export function vis(sim, ops) {


  // ===== default options =====================================================

  ops = Object.assign({
    
    target:                document.body,
    run:                   true,
    maxFPS:                0,
    stats:                 false,
    cleanup:               false,
    resolution:            window.devicePixelRatio || 1,
    autoDensity:           true,
    antialias:             true,  
    clearBeforeRender:     true,
    preserveDrawingBuffer: false,
    sprites:               [],
    beforeSetup:           null,
    afterSetup:            null,
    beforeTick:            null,
    afterTick:             null,
    finished:              null,
    
    backParticles:         false,
    middleParticles:       false,
    frontParticles:        false,

    baseColor:             0x808080,
    baseAlpha:             1,

    background:            false,
    backgroundTint:        0xffffff,
    backgroundAlpha:       1,
    backgroundSprite:      null,
    backgroundTile:        false,

    squareTint:            0xffffff,  
    squareAlpha:           1,
    squareSprite:          null,
    squareText:            null,
    squareTextPosition:    'center',
    squareTextPadding:     3,
    squareTextAlign:       'center',
    squareTextTint:        0x0,
    squareTextAlpha:       1,
    squareFontName:        null,
    squareFontSize:        16,
    squareAdvanced:        false,
    squareLineColor:       0x0,
    squareLineAlpha:       1,
    squareLineWidth:       1,
    squareLineAlign:       0.5,
    squareFillColor:       0xffffff,
    squareFillAlpha:       1,
    
    zoneTint:              0xffffff,
    zoneAlpha:             1,
    zoneSprite:            null,
    zoneText:              null,
    zoneTextPosition:      'center',
    zoneTextPadding:       3,
    zoneTextAlign:         'center',
    zoneTextTint:          0x0,
    zoneTextAlpha:         1,
    zoneFontName:          null,
    zoneFontSize:          16,
    zoneAdvanced:          false,
    zoneLineColor:         0x0,
    zoneLineAlpha:         1,
    zoneLineWidth:         1,
    zoneLineAlign:         0.5,
    zoneFillColor:         0xffffff,
    zoneFillAlpha:         1,
    zoneTile:              false,
    
    actorTint:             0xffffff,
    actorAlpha:            1,
    actorSprite:           null,
    actorText:             null,
    actorTextRotate:       false,
    actorTextMaxWidth:     0,
    actorTextAlign:        'center',
    actorTextTint:         0x0,
    actorTextAlpha:        1,
    actorFontName:         null,
    actorFontSize:         16,
    actorAdvanced:         false,
    actorLineColor:        0x0,
    actorLineAlpha:        1,
    actorLineWidth:        1,
    actorLineAlign:        0.5,
    actorFillColor:        0xffffff,
    actorFillAlpha:        1,
    basicCircleRadius:     64,
    advancedCircleScale:   5,

    updateTint:            true,
    updateAlpha:           true,
    updateSprite:          true,
    updateText:            false,
    updateTextTint:        false,
    updateTextAlpha:       false,
    updateFontName:        false,
    updateFontSize:        false,
    updateRadius:          false,
    updatePointing:        false,
    updateZIndex:          false

  }, ops);


  // ===== Pixi and app ========================================================

  // Pixi aliases
  const loader = new PIXI.Loader();
  const { Sprite, TilingSprite } = PIXI;

  // app
  const app = new PIXI.Application({
    width: sim.width,   
    height: sim.height,
    backgroundColor: ops.baseColor,
    backgroundAlpha: ops.baseAlpha,
    resolution: ops.resolution,
    autoDensity: ops.autoDensity,
    antialias: ops.antialias,    
    clearBeforeRender: ops.clearBeforeRender,
    preserveDrawingBuffer: ops.preserveDrawingBuffer
  });
  app.ticker.maxFPS = ops.maxFPS;
  ops.target.appendChild(app.view);


  // ===== helper functions ====================================================

  // evaluate option value
  function optionValue(agent, optionName) {
    const option = ops[optionName];
    return typeof option === 'function' ? option(agent) : option;
  }

  // evaluate background option value
  function backgroundOptionValue(optionName) {
    const option = ops[optionName];
    return typeof option === 'function' ? option(sim) : option;
  }

  // get image texture for agent
  function imageTexture(agent, optionName) {
    const imgPath = optionValue(agent, optionName);
    return imgPath ? PIXI.Texture.from(imgPath) : null;
  }

  // get background image texture
  function backgroundImageTexture() {
    const imgPath = backgroundOptionValue('backgroundSprite');
    return imgPath ? PIXI.Texture.from(imgPath) : null;
  }

  // include agent in vis? 
  function includeAgent({zIndex}) {
    return typeof zIndex === 'number' && !Number.isNaN(zIndex);
  }

  // is nullish?
  function isNullish(v) {
    return v === null || v === undefined;
  }


  // ===== add bitmap text to sprite ===========================================

  function addText(content, agent, spr) {

    if (isNullish(content) || content === '') return;
    content = String(content);
    const type = agent.type;
    const isTilingSprite = type === 'zone' && spr instanceof PIXI.TilingSprite;
    const xScale = isTilingSprite ? 1 : spr.texture.width / spr.width;
    const fontName      = optionValue(agent, `${type}FontName`);
    const fontSize      = optionValue(agent, `${type}FontSize`) ;
    const align         = optionValue(agent, `${type}TextAlign`);
    const tint          = optionValue(agent, `${type}TextTint`);
    const alpha         = optionValue(agent, `${type}TextAlpha`);
    let txt;
    
    // actor
    if (type === 'actor') {
      txt = new PIXI.BitmapText(content, {
        fontName,
        fontSize: fontSize * xScale,
        align,
        tint,
        maxWidth: optionValue(agent, 'actorTextMaxWidth') * xScale
      });
      txt.alpha = alpha;
      txt.anchor = new PIXI.Point(0.5, 0.5);
      const textRotate = optionValue(agent, 'actorTextRotate');
      if (!textRotate) txt.rotation = -spr.rotation;
      if (ops.updatePointing) {
        spr.__textRotate__ = textRotate;
      }
    }

    // square or zone
    else {
      const yScale = isTilingSprite ? 1 : spr.texture.height / spr.height;
      const position = optionValue(agent, `${type}TextPosition`);
      const padding  = optionValue(agent, `${type}TextPadding`);
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
      if (ops.updateFontSize) spr.__isTilingSprite__ = isTilingSprite;
    }

    spr.addChild(txt);

  };


  // ===== background ==========================================================

  let addBackground, updateBackground;
  if (ops.background) {

    let spr;

    // add background
    addBackground = function() {
      const texture = backgroundImageTexture() || PIXI.Texture.WHITE;
      if (ops.backgroundTile) {
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
      spr.tint = backgroundOptionValue('backgroundTint');
      spr.alpha = backgroundOptionValue('backgroundAlpha');
      app.stage.addChild(spr);
    };

    // update background
    const updateFunctions = [];
    if (typeof ops.backgroundSprite === 'function') {
      updateFunctions.push(() => {
        const texture = backgroundImageTexture() || PIXI.Texture.WHITE;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (typeof ops.backgroundTint === 'function') {
      updateFunctions.push(() => spr.tint = ops.backgroundTint(sim));
    }
    if (typeof ops.backgroundAlpha === 'function') {
      updateFunctions.push(() => spr.alpha = ops.backgroundAlpha(sim));
    }
    if (updateFunctions.length) {
      updateBackground = function() {
        for (let f of updateFunctions) f();
      }
    }

  }


  // ===== containers and agent maps ===========================================

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
  const backContainer   = createContainer(ops.backParticles);
  const middleContainer = createContainer(ops.middleParticles);
  const frontContainer  = createContainer(ops.frontParticles);

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
      if (ops.updateZIndex) spr.__agent__ = agent;
    }
  }

  const agentMaps = {
    square: new Map(),
    zone:   new Map(),
    actor:  new Map()
  };

  
  // ===== add square or zone ==================================================

  function addSquareOrZone(agent) {
    const type = agent.type;
    let w, h, useTiling;
    if (type === 'zone') {
      w = agent.xMax - agent.xMin;
      h = agent.yMax - agent.yMin;
      useTiling = optionValue(agent, 'zoneTile');
    }
    const info = {};
    info.imgTexture = imageTexture(agent, `${type}Sprite`);
    if (!info.imgTexture ||
        (ops.updateSprite && typeof ops[`${type}Sprite`] === 'function')) {    
      if (optionValue(agent, `${type}Advanced`)) {
        info.shpTexture = shapeTexture({
          name: 'rect',
          color:     optionValue(agent, `${type}FillColor`),
          alpha:     optionValue(agent, `${type}FillAlpha`),
          lineColor: optionValue(agent, `${type}LineColor`),
          lineWidth: optionValue(agent, `${type}LineWidth`),
          lineAlpha: optionValue(agent, `${type}LineAlpha`),
          lineAlign: optionValue(agent, `${type}LineAlign`),
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
      spr = new Sprite(info.imgTexture || info.shpTexture);
      spr.width = sim.gridStep;
      spr.height = sim.gridStep;
    }
    else {  // zone
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
    }
    spr.position.set(agent.xMin, agent.yMin);
    spr.tint = optionValue(agent, `${type}Tint`);
    spr.alpha = optionValue(agent, `${type}Alpha`);
    addText(optionValue(agent, `${type}Text`), agent, spr);
    addSpriteToContainer(agent, spr);
    info.spr = spr;
    agentMaps[type].set(agent, info);
  };


  // ===== add actor ===========================================================

  // basic circle texture
  const basicCircle = shapeTexture({
    name: 'circle',
    color: 0xffffff,
    radius: ops.basicCircleRadius
  }, app);

  // add actor
  function addActor(ac) {
    const info = {};
    info.imgTexture = imageTexture(ac, 'actorSprite');
    if (!info.imgTexture ||
        (ops.updateSprite && typeof ops.actorSprite === 'function')) { 
      if (optionValue(ac, 'actorAdvanced')) {
        info.shpTexture = shapeTexture({
          name: 'circle',
          color:     optionValue(ac, 'actorFillColor'),
          alpha:     optionValue(ac, 'actorFillAlpha'),
          lineColor: optionValue(ac, 'actorLineColor'),
          lineWidth: optionValue(ac, 'actorLineWidth') * ops.advancedCircleScale,
          lineAlpha: optionValue(ac, 'actorLineAlpha'),
          lineAlign: optionValue(ac, 'actorLineAlign'),
          radius: ac.radius * ops.advancedCircleScale,
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
    spr.tint = optionValue(ac, 'actorTint');
    spr.alpha = optionValue(ac, 'actorAlpha');
    addText(optionValue(ac, 'actorText'), ac, spr);
    addSpriteToContainer(ac, spr);
    info.spr = spr;
    agentMaps.actor.set(ac, info);
  };


  // ===== update function for each agent type =================================

  const updateAgent = {};
  for (let type of ['square', 'zone', 'actor']) {
    const updateFunctions = [];
    if (type === 'actor') {
      updateFunctions.push((spr, ac) => {
        spr.position.set(ac.x, ac.y);
      });
      if (ops.updateRadius) {
        updateFunctions.push((spr, ac) => {
          spr.width = spr.height = 2 * ac.radius;
        });
      }
      if (ops.updatePointing) {
        updateFunctions.push((spr, ac) => {
          spr.rotation = ac.pointing ?? ac.heading();
          const txt = spr.children[0];
          if (txt?.text && !spr.__textRotate__) txt.rotation = -spr.rotation;
        });
      }
    }
    const agentOptions = {};
    [
      'Sprite', 'Tint', 'Alpha', 'Text', 'TextTint', 'TextAlpha', 'FontName',
      'FontSize'
    ].forEach(suffix => {
      agentOptions[suffix] = ops[`${type}${suffix}`];
    });
    if (ops.updateSprite && typeof agentOptions.Sprite === 'function') {
      updateFunctions.push((spr, agent) => {
        const info = agentMaps[type].get(agent);
        info.imgTexture = imageTexture(agent, `${type}Sprite`);
        const texture = info.imgTexture || info.shpTexture;
        if (spr.texture !== texture) spr.texture = texture;
      });
    }
    if (ops.updateTint && typeof agentOptions.Tint === 'function') {
      updateFunctions.push((spr, agent) => spr.tint = agentOptions.Tint(agent));
    }
    if (ops.updateAlpha && typeof agentOptions.Alpha === 'function') {
      updateFunctions
        .push((spr, agent) => spr.alpha = agentOptions.Alpha(agent));
    }
    if (ops.updateText && typeof agentOptions.Text === 'function') {
      updateFunctions.push((spr, agent) => {
        const txt = spr.children[0];
        let content = agentOptions.Text(agent);
        if (isNullish(content) || content === '') {
          if (txt) txt.text = '';
        }
        else {
          txt ? (txt.text = String(content)) : addText(content, agent, spr);
        }
      });
    }
    if (ops.updateFontSize && typeof agentOptions.FontSize === 'function') {
      updateFunctions.push((spr, agent) => {
        const txt = spr.children[0];
        if (txt?.text) {
          txt.fontSize = agentOptions.FontSize(agent) *
            (agent.type === 'zone' && spr.__isTilingSprite__
              ? 1
              : spr.texture.width / spr.width);
        }
      });
    }
    for (let [uOption, aOption, propName] of [
      [ ops.updateTextTint,  agentOptions.TextTint,  'tint'     ],
      [ ops.updateTextAlpha, agentOptions.TextAlpha, 'alpha'    ],
      [ ops.updateFontName,  agentOptions.FontName,  'fontName' ]
    ]) {
      if (uOption && typeof aOption === 'function') {
        updateFunctions.push((spr, agent) => {
          const txt = spr.children[0];
          if (txt?.text) txt[propName] = aOption(agent);
        });
      }
    }
    if (updateFunctions.length) {
      updateAgent[type] = function({spr}, agent) {
        for (let f of updateFunctions) f(spr, agent);
      };
    }
  }


  // ===== setup function ======================================================

  function setup() {

    // before setup
    ops.beforeSetup?.(sim, app, PIXI);

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
    ops.afterSetup?.(sim, app, PIXI);

    // sort on z-index and disable future sorting if appropriate
    middleContainer.sortChildren();
    if (!ops.updateZIndex) middleContainer.sortableChildren = false;

    // run simulation
    if (ops.run) app.ticker.add(tick);

    // destroy loader
    loader.destroy();

  }

  // setup stats
  if (ops.stats) {
    var fpsLast5 = [];
    var statsDiv = ops.target.appendChild(document.createElement('div'));
    statsDiv.style.font = '14px sans-serif';
  }


  // ===== tick function =======================================================

  function tick() {

    // finished?
    if (sim._finished) {
      ops.finished?.(sim, app, PIXI);
      app.ticker.stop();
      if (ops.cleanup) {
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
    ops.beforeTick?.(sim, app, PIXI);

    // simulation tick
    sim.tick();

    // background: update
    updateBackground?.();

    // squares: update
    if (updateAgent.square) agentMaps.square.forEach(updateAgent.square);
    
    // zones: remove, add, update
    for (let zn of sim._zonesRemoved) {
      if (agentMaps.zone.has(zn)) {
        const spr = agentMaps.zone.get(zn).spr;
        spr.parent.removeChild(spr);
        agentMaps.zone.delete(zn);
      }
    }
    for (let zn of sim._zonesAdded) {
      if (includeAgent(zn)) addSquareOrZone(zn);
    }
    if (updateAgent.zone) agentMaps.zone.forEach(updateAgent.zone);
    
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
    if (updateAgent.actor) agentMaps.actor.forEach(updateAgent.actor);

    // after tick
    ops.afterTick?.(sim, app, PIXI);

    // update z-index
    if (ops.updateZIndex &&
        (typeof ops.updateZIndex !== 'function' || ops.updateZIndex(sim))) {
      for (let spr of middleContainer.children) {
        spr.zIndex = spr.__agent__.zIndex;
      }
      middleContainer.sortChildren();
    }

    // update stats
    if (ops.stats) {
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

  
  // =====  load sprite files then call setup ==================================

  function getStem(s) {
    const dotIndex = s.lastIndexOf('.');
    return dotIndex === -1 ? s : s.slice(0, dotIndex);
  }
  const cachedTextureStems =
    new Set(Object.keys(PIXI.utils.TextureCache).map(getStem));
  loader
    .add(ops.sprites.filter(src => !cachedTextureStems.has(getStem(src))))
    .load(setup);
  return app;

}


// ===== convenience function for using vis in Observable ======================

export function visObs(sim, options) {
  const div = document.createElement('div');
  options = {...options, target: div, cleanup: true};
  vis(sim, options);
  return div;
}