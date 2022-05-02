## Introduction

Visualise [Atomic Agents](https://gjmcn.github.io/atomic-agents) simulations with WebGL (via [PixiJS](https://pixijs.com/)).

## Install

npm:

```
npm install @gjmcn/atomic-agent-vis
```

Skypack CDN:

```js
// import everything as AV
import * as AV from 'https://cdn.skypack.dev/@gjmcn/atomic-agents-vis';
```

```js
// or use named imports
import {vis, visObs, colors, PIXI} from 'https://cdn.skypack.dev/@gjmcn/atomic-agents-vis';
```

?> Note: append `?min` to the Skypack URL for minified code.

## Usage

Atomic Agents Vis exports:

* `vis`: the main visualisation function. 
* [`visObs`](#the-visObs-function): a wrapper function for use in [Observable](https://observablehq.com/).
* [`colors`](#colors): a categorical color scheme.
* `PIXI`: the [PixiJS](https://pixijs.com/) object.

Use `vis(sim, options)` to visualise a simulation, where `sim` is an Atomic Agents simulation, and `options` is an object (which can be omitted).

The `vis` function returns the PixiJS application.

The `vis` and `visObs` functions automatically run the simulation; do not use `sim.tick()` or `sim.run()` when using Atomic Agents Vis.

The simulation can be paused and unpaused as normal: `sim.pause(true)`, `sim.pause(false)`. When the simulation is paused, the visualisation is frozen and the [`beforeTick`](#before-and-after-functions) and [`afterTick`](#before-and-after-functions) functions are not called. When the simulation is unpaused, it automatically resumes.

## Options

### Top Level

| Option       | Default   | Description |
|:-------------|:-----------|:------------|
| `target` | `document.body` | HTML element where the canvas is inserted. |
| `run` | `true` | Run the simulation to completion? If `false`, draws the agents currently in the simulation, but does not run the simulation. |
| `maxFPS` | `0` (no limit) | Max frames per second. If used, should be one of `10`, `12`, `15`, `20`, `30` or `60`. |
| `stats` | `false` | Show basic stats: number of squares, zones and actors, and frames per second. Updated every 5 frames &mdash; the frames per second is the mean for the last 5 frames. |
| `cleanup` | `false` | Cleanup the visualisation when the simulation finishes: remove stats, stop the PIXI app, 'lose' its WebGL context, destroy the app, remove the canvas.<br><br>__Note:__ textures and base textures are not destroyed when `cleanup` is used &mdash; they are reused by subsequent visualisations. |
| `resolution` | <code>window.devicePixelRatio \|\| 1</code> | Resolution / device pixel ratio of the renderer. |
| `autoDensity` | `true` | Resize renderer view in CSS pixels to allow for resolutions other than 1? |
| `antialias` | `true` | Antialias? |
| `clearBeforeRender` | `true` | Clear the canvas before each render pass? |
| `preserveDrawingBuffer` | `false` | Enable drawing buffer preservation? |
| `sprites` | `[]` | Paths/URLs to sprite files. Files that have already been loaded (i.e. where the texture already exists) are skipped. |
| `backParticles` | `false` | Back container is a particle container? &mdash; see [Particles](#particles) |
| `middleParticles` | `false` | Middle container is a particle container? &mdash; see [Particles](#particles) |
| `frontParticles` | `false` | Front container is a particle container? &mdash; see [Particles](#particles) |

To avoid clearing the canvas between frames, use `clearBeforeRender: false` <i>and</i> `preserveDrawingBuffer: true`. In this case, [`baseColor`](#base-and-background) and [`baseAlpha`](#base-and-background) are ignored; if there is no [background](#base-and-background), actors leave permanent trails; if there is a background with alpha less than 1, actors leave fading trails. Note that 'trails' are from previous frames so are covered by anything drawn in the current frame. Also, a background with alpha less than one will not appear faint since the background will keep being drawn on top of itself.

### Before and After Functions

| Option       | Default   | Description |
|:--------------|:-----------|:------------|
| `beforeSetup` | `null` | Function to call before setup (before background added). |
| `afterSetup` | `null` | Function call to after setup (after existing agents added). |
| `beforeTick` | `null` | Function to call before each tick (before `sim.beforeTick()`). <br><br>__Note:__ pausing or ending the simulation from `beforeTick` may cause issues; pause or end the simulation from inside the simulation itself (e.g. using `sim.beforeTick`), or from the `afterTick` function. |
| `afterTick` | `null` | Function to call after each tick (after `sim.afterTick()`). |
| `finished` | `null` | Function to call after simulation ends. |

Before and after functions are passed the simulation, the PIXI app and the PIXI object. The before and after functions can be used to add extra content with Pixi.JS. For example, some bitmap text:

```js
vis(new Simulation(), {
  sprites: ['../bitmap-text/some-font.xml'],  // use sprites to load bitmap text
  afterSetup: (sim, app, PIXI) => {
    app.stage.addChild(new PIXI.BitmapText('Hello', {fontName: 'SomeFont'}));
  }
});
```

### Base and Background

The <i>base</i> is below the 'background'. Use `baseColor` for a simple colored background that does not change.

The background is only added if the `background` option is truthy. 

| Option       | Default   | Function allowed? | Called each tick? |
|:--------------|:-----------|:------------:|:------------:|
| `baseColor` | `0x808080` |  |  |
| `baseAlpha` | `1` |  |  |
| `background` | `false` |  |
| `backgroundTint` | `0xffffff` | ✓ | ✓ |
| `backgroundAlpha` | `1` | ✓ | ✓ |
| `backgroundSprite` | `null` | ✓ | ✓ |
| `backgroundTile` | `false` |  |

### Squares

| Option       | Default   | Function allowed? | Called each tick? |
|:--------------|:-----------|:------------:|:------------:|
| `squareTint` | `0xffffff` | ✓ |  ✓ | 
| `squareAlpha` | `1` | ✓ | ✓ |
| `squareSprite` | `null` | ✓ | ✓ |
| `squareAdvanced` | `false` | ✓ |  |
| `squareLineColor` | `0x0` | ✓ |  |
| `squareLineAlpha` | `1` | ✓ |  |
| `squareLineWidth` | `1` | ✓ |  |
| `squareLineAlign` | `0.5` | ✓ |  |
| `squareFillColor` | `0xffffff` | ✓ |  |
| `squareFillAlpha` | `1` | ✓ |  |

### Zones

| Option       | Default   | Function allowed? | Called each tick? |
|:--------------|:-----------|:------------:|:------------:|
| `zoneTint` | `0xffffff` | ✓ | ✓ |
| `zoneAlpha` | `1` | ✓ | ✓ |
| `zoneSprite` | `null` | ✓ | ✓ |
| `zoneAdvanced` | `false` | ✓ |  |
| `zoneLineColor` | `0x0` | ✓ |  |
| `zoneLineAlpha` | `1` | ✓ |  |
| `zoneLineWidth` | `1` | ✓ |  |
| `zoneLineAlign` | `0.5` | ✓ |  |
| `zoneFillColor` | `0xffffff` | ✓ |  |
| `zoneFillAlpha` | `1` | ✓ |  |
| `zoneTile` | `false` | ✓ |  |

### Actors

| Option       | Default   | Function allowed? | Called each tick? |
|:--------------|:-----------|:------------:|:------------:|
| `actorTint` | `0xffffff` | ✓ | ✓ |
| `actorAlpha` | `1` | ✓ | ✓ |
| `actorSprite` | `null` | ✓ | ✓ |
| `actorAdvanced` | `false` | ✓ |  |
| `actorLineColor` | `0x0` | ✓ |  |
| `actorLineAlpha` | `1` | ✓ |  |
| `actorLineWidth` | `1` | ✓ |  |
| `actorLineAlign` | `0.5` | ✓ |  |
| `actorFillColor` | `0xffffff` | ✓ |  |
| `actorFillAlpha` | `1` | ✓ |  |
| `basicCircleRadius` | `64` |  |  |
| `advancedCircleScale` | `5` |  |  |

An actor's rotation is given by its `pointing` property, unless this is `null` or `undefined`, in which case the value returned by the actor's `heading` method is used.

`basicCircleRadius` is the radius of the default circle texture used for actors. `advancedCircleScale` is how many times larger each circle texture is than its actor when using [advanced shapes](#advanced-shape-options). Increasing these values gives smoother edges to the circles.

### Updates

| Option       | Default   | Function allowed? | Called each tick? |
|:--------------|:-----------|:------------:|:------------:|
| `updateTint` | `true` |  |  |
| `updateAlpha` | `true` |  |  |
| `updateSprite` | `true` |  |  |
| `updateRadius` | `false` |  |  |
| `updatePointing` | `false` |  |  |
| `updateZIndex` | `false` | ✓ | ✓ |

See the [Functions and Updates](#functions-and-updates) section for details.

## Drawing Order

An agent is either never drawn, or it is added to one of three <i>containers</i> based on its `zIndex` property when `vis` or `visObs` is called (or if the agent is added to the simulation after it has started, the value of `zIndex` at the end of the tick when the agent is added):

* never drawn, `zIndex`: `NaN` (or any non-number).
* <i>back container</i>, `zIndex`: `-Infinity`.
* <i>middle container</i>, `zIndex`: finite number.
* <i>front container</i>, `zIndex`: `Infinity`.

Each tick, the simulation is drawn in the following order:

1. The background.
1. Agents in the back container, in the order they were added to the simulation.
1. Agents in the middle container, in ascending order of their `zIndex` properties.
1. Agents in the front container, in the order they were added to the simulation.

An agent cannot move between containers. If an agent's `zIndex` may change during the simulation, its initial `zIndex` should be a finite number so that the agent is added to the middle container.

?> Note: once an agent has been added to a container, setting it's `zIndex` to `NaN` does not hide the agent. Instead, use an alpha of `0` to hide the agent.

## Functions and Updates

If an option such as `zoneTint` or `actorAlpha` is a function, it is called for each agent of the relevant type. The function is passed the agent (or in the case of background options, the simulation object) and the returned value is used as the option value. Furthermore, the function is called each tick, so the option is updated per agent per tick. If these updates are not required for any agent, the relevant 'update option' (`updateTint`, `updateAlpha` or `updateSprite`) can be set to `false`.

?> Note: the `updateTint`, `updateAlpha` and `updateSprite` options only affect agents; the background is updated each tick if any of `backgroundTint`, `backgroundAlpha` or `backgroundSprite` are functions.

The initial size of an actor's shape/sprite is based on the actor's initial radius. By default, the size of the sprite/shape is not updated when the radius changes; set the `updateRadius` option to `true` to update actors' radii each tick. Similarly, the rotation of an actor's shape/sprite is initialised from its pointing/heading, but the `updatePointing` option must be `true` for actors' rotations to be updated each tick.

The initial [drawing order](#drawing-order) for agents in the middle container is based on the agents' `zIndex` properties. By default, the drawing order is not updated; set the `updateZIndex` option to `true` to update the drawing order every tick. Alternatively, `updateZIndex` can be a function; this is called every tick (and passed the simulation) and the drawing order is updated if the function returns a truthy value.

## Colors

For convenience, Atomic Agents Vis exports `colors`: an array of 9 categorical colors. Colors can be accessed by index (e.g. `colors[3]`) or by name (e.g. `colors.red`). The indices and names are:

| Index  | Name | Number (hexadecimal) |
|:---|:---|:---|
| 0 | blue | 0x1f77b4 |
| 1 | orange | 0xff7f0e |
| 2 | green | 0x2ca02c |
| 3 | red | 0xd62728 |
| 4 | purple | 0x9467bd |
| 5 | brown | 0x8c564b |
| 6 | pink | 0xe377c2 |
| 7 | kiwi | 0xbcbd22 |
| 8 | turquoise | 0x17becf |

?> Note: the colors are [d3.schemeCategory10](https://github.com/d3/d3-scale-chromatic) with gray omitted. 

## Sprites

### Images

To use a sprite sheet, preload it with `sprites` (e.g. `sprites: ['../images/big-cats.json']` ) and use a sprite name as the appropriate sprite option (e.g. `actorSprite: 'lion.png'`).

?> Note: there are simple online tools for creating sprite sheets (e.g. [Free texture packer](https://free-tex-packer.com/app/)) and bitmap fonts (e.g. [SnowBamboo](https://snowb.org/)) that PixiJS can use.

To create sprites from an individual image, preload the image with `sprites` (e.g. `sprites: ['../images/lion.png']`) and use the image's path as the appropriate sprite option (e.g. `actorSprite: '../images/lion.png'`). An image can be used without preloading it, but sprites that use the image will 'pop in' when the image loads. Images that are used for tiled sprites must be preloaded for the image-to-tile scale to be computed correctly.

An actor with pointing/heading `0` faces the viewer's right, so images that will be used to indicate actors' pointings/headings should also face right.

[This repository](https://github.com/gjmcn/sprites) has some useful images and sprite sheets.

### Shapes

When an agent's sprite path is falsy, the agent's shape is used &mdash; a square, rectangle or circle. By default, <i>basic shapes</i> are used; the `squareAdvanced`, `zoneAdvanced` and `actorAdvanced` options can be used to enable <i>advanced shapes</i> &mdash; i.e. to enable line and fill options.

The `xxxLineAlign` options specify line alignment: `0` = inner, `0.5` = middle, `1` = outer.

## Tiling

Use `backgroundTile: true` to tile the background, and `zoneTile: true` (or a function) to tile zones. Tiles are the same size as simulation squares, so when using a sprite for tiles, the image should be square. Currently, each image-to-tile scale is only computed once during initialisation, so if a sprite is changed during the simulation (e.g. the sprite of a tiled zone is switched from a grass image to a sand image), the new image should have the same size as the old image.

## Particles

Each of the back, middle and front containers (see [Drawing Order](#drawing-order)) can be a standard container or a <i>particle container</i>. Particle containers have better performance, but are less flexible: the same shape/image must be used for all agents in the container and this cannot be changed during the simulation. If an [advanced shape](#shapes) is used, its line and fill options cannot vary by agent.

?> Note: the tints and alphas of agents in a particle container can be updated as normal, as can the radii and pointings of actors.

Set the `backParticles` option to `true` to specify that the back container is a particle container. The `middleParticles` and `frontParticles` options are used similarly.

Instead of setting a particle option to `true`, we can use a positive integer: the estimated maximum size required for the container. This need not be accurate since the container will resize if more 'particles' are required. When a particle option is `true`, `10000` is used as the estimated maximum size.

## The `visObs` function

`visObs(sim, options)` can be used instead of `vis(sim, options)` when working in [Observable](https://observablehq.com/). `visObs` does the following:

1. Creates a div element.
1. Shallow copies `options`, and sets the `target` option to the created div and the `cleanup` option to `true`.
1. Calls `vis(sim, options)`.
1. Returns the div.

## Notes

### Browser only

While an Atomic Agents simulation will run in any JavaScript environment, Atomic Agents Vis can only be used in the browser &mdash; or some browser-like environment like [Electron](https://www.electronjs.org/).

### Tips

* Tint options can be used with any sprites, but are particularly useful with [shapes](#shapes) and white images where the tint is essentially the 'fill' color.

* In complex models, use 'lookup objects' to help readability while keeping agent state separate from appearance. For example:

  ```js
  const sim = new Simulation();

  new Actor({state: {mood: 'calm'}})
    .label('role', 'predator')
    .addTo(sim);

  new Actor({state: {mood: 'worried'}})
    .label('role', 'prey')
    .addTo(sim);

  const spriteLookup = {
    predator: 'lion.png',
    prey: 'zebra.png'
  };

  const tintLookup = {
    calm: colors.blue,
    worried: colors.red
  };

  vis(sim, {
    sprites: '../sprites/animals.json',
    actorSprite: ac => spriteLookup[ac.label('role')],
    actorTint: ac => tintLookup[ac.state.mood]
  });
  ```

### Gotchas

* The `background` option is `false` by default.

* The `updateRadius`, `updatePointing` and `updateZIndex` options are `false` by default.

* In Atomic Agents, the `zIndex` property of squares is `NaN` by default &mdash; so squares are not drawn in Atomic Agents Vis by default.

* When an option is a function, the returned value is used 'as is'. In particular, `undefined` and `null` are not replaced with the option's default value.