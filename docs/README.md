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
// or use named imports, e.g.
import {vis, colors} from 'https://cdn.skypack.dev/@gjmcn/atomic-agents-vis';
```

?> Note: append `?min` to the Skypack URL for minified code.

## Usage

Atomic Agents Vis exports:

* `vis`: the main visualisation function. 
* [`visObs`](#the-visObs-function): a wrapper function for use in [Observable](https://observablehq.com/).
* [`colors`](#colors): a categorical color scheme.
* `PIXI`: the [PixiJS](https://pixijs.com/) object.
* [Helper functions](#helpers).

Use `vis(sim)` or `vis(sim, options)` to visualise a simulation, where `sim` is an Atomic Agents simulation, and `options` is an object. The `vis` function automatically runs the simulation (do not use `sim.tick()` or `sim.run()`) and returns the PixiJS application. The simulation can be paused and unpaused as normal: `sim.pause(true)`, `sim.pause(false)`. When the simulation is paused, the visualisation is frozen and the [`beforeTick`](#vis-options) and [`afterTick`](#vis-options) functions are not called. When the simulation is unpaused, it automatically resumes.

While an Atomic Agents simulation will run in any JavaScript environment, Atomic Agents Vis can only be used in the browser &mdash; or a browser-like environment like [Electron](https://www.electronjs.org/).

The `visObs` function can be used instead of `vis` when working in [Observable](https://observablehq.com/). `visObs` does the following:

1. Creates a div element.
1. Shallow copies the `options` object, and sets the `target` option to the created div and the `cleanup` option to `true`.
1. Calls `vis(sim, options)`.
1. Returns the div.

## Vis Options

The `options` object passed to `vis` or `visObs` can include the following:

| Option       | Default   | Description |
|:-------------|:-----------|:------------|
| `target` | `document.body` | HTML element where the canvas is inserted. |
| `run` | `true` | Run the simulation to completion? If `false`, draws the agents currently in the simulation, but does not run the simulation. |
| `maxFPS` | `0` (no limit) | Max frames per second. If used, should be one of `10`, `12`, `15`, `20`, `30` or `60`. |
| `stats` | `false` | Show basic stats: number of squares, zones and actors, and frames per second. Updated every 5 frames &mdash; the frames per second is the mean for the last 5 frames. |
| `cleanup` | `false` | Clean up the visualisation when the simulation finishes: remove stats, stop the PIXI app, lose its WebGL context, destroy the app, remove the canvas.<br><br>__Note:__ textures and base textures are not destroyed when `cleanup` is used &mdash; they are reused by subsequent visualisations. |
| `resolution` | `window.devicePixelRatio`<br>or `1`</code> | Resolution / device pixel ratio of the renderer. |
| `autoDensity` | `true` | Resize renderer view in CSS pixels to allow for resolutions other than 1? |
| `antialias` | `true` | Antialias? |
| `clearBeforeRender` | `true` | Clear the canvas before each render pass? |
| `preserveDrawingBuffer` | `false` | Enable drawing buffer preservation? |
| `images` | `[]` | Paths/URLs to image, sprite sheet and bitmap font files. Files that have already been loaded (i.e. where the texture already exists) are skipped. See [Images](#images) for details. |
| `backParticles` | `false` | Back container is a particle container? &mdash; see [Particles](#particles) |
| `middleParticles` | `false` | Middle container is a particle container? &mdash; see [Particles](#particles) |
| `frontParticles` | `false` | Front container is a particle container? &mdash; see [Particles](#particles) |
| `basicCircleRadius` | `64` | Radius of the default circle texture used for actors. The higher the value, the smoother the circles. |
| `advancedCircleScale` | `5` | How many times larger each circle texture is than its actor when using [advanced shape options](#shape). The higher the value, the smoother the circles. |
| `updateRadii` | `true` | If `false`, the size of actors' shapes/images are not updated during the simulation. |
| `updatePointings` | `true` | If `false`, the rotations of actors' shapes/images are not updated during the simulation. If `updatePointings` is `true`, each actor's rotation is given by its `pointing` property, unless this is `null` or `undefined`, in which case the value returned by the actor's `heading` method is used. |
| `updateDrawOrder` | `true` | If `false`, the drawing order of contents in the middle container is not updated during the simulation. If `updateDrawOrder` is a function, it is called each tick (and passed the simulation object); if it returns a truthy value, the drawing order for the middle container is updated that tick. |
| `beforeSetup` | `null` | Function to call before setup (before the background is added). The function is passed the simulation object, the PIXI app and the PIXI object. |
| `afterSetup` | `null` | Function call to after setup (after existing agents are added). The function is passed the simulation object, the PIXI app and the PIXI object. |
| `beforeTick` | `null` | Function to call before each tick (before `sim.tick` is called). The function is passed the simulation object, the PIXI app and the PIXI object. <br><br>__Note:__ pausing or ending the simulation from `beforeTick` may cause issues; pause or end the simulation from inside the simulation itself (e.g. using `sim.beforeTick`), or from the `afterTick` function. |
| `afterTick` | `null` | Function to call after each tick (after `sim.afterTick` is called and the visualisation is updated). The function is passed the simulation object, the PIXI app and the PIXI object. |
| `finished` | `null` | Function to call after the simulation ends. The function is passed the simulation object, the PIXI app and the PIXI object. |

?> Note: 'top-level' text options can also be passed to `vis` and `visObs`. See [Text](#text) for details.

To avoid clearing the canvas between frames, use `clearBeforeRender: false` <i>and</i> `preserveDrawingBuffer: true`. In this case, [`baseColor`](#basic) and [`baseAlpha`](#basic) are ignored; if there is no [background](#base-and-background), actors leave permanent trails; if there is a background with alpha less than 1, actors leave fading trails. Note that 'trails' are from previous frames so are covered by anything drawn in the current frame. Also, a background with alpha less than one will not appear faint since the background will keep being drawn on top of itself.

## Background and Agent Options

Background and agent options are set on the simulation/agent directly using the `vis` method. For example:

```js
// url of grass image
const grass = 'https://cdn.jsdelivr.net/gh/gjmcn/sprites/images/outside/nature-grass.png';

// simulation with tiled grass image for the background
const sim = new AA.Simulation().vis({
  background: true,
  image: grass,
  tile: true
})

// red actor
new AA.Actor({
  x: 100,
  y: 100,
  radius: 50,
}).vis({
  tint: 0xff0000
}).addTo(sim);

// run and visualise
AV.vis(sim, {images: [grass]});
```

!> The `vis` method of an agent or simulation can only be called once and (if used) should be called before the agent/simulation is added to the visualisation. To ensure this, call  the `vis` method immediately after creating the agent/simulation.

The background and agent options are summarised in the following sections.

### Basic

| Option       | Simulation | Square | Zone | Actor | Update |
|:-------------|:-----------|:-------|:-----|:------|:------:|
| `baseColor` | `0x808080` |  |  |  |  |
| `baseAlpha` | `1` |  |  |  |  |
| `background` | `false` |  |  |  |  |
| `tint` | `0xffffff` | `0xffffff` | `0xffffff` | `0xffffff` | ✓ |
| `alpha` | `1` | `1` | `1` | `1` | ✓ |
| `image` | `null` | `null` | `null` | `null` | ✓ |
| `tile` | `false` |  | `false` |  |  |

<p style="font-size: 0.9em; margin-top: -0.9em;">(Default values shown; empty cell indicates that option is not used.)</p>

The <i>base</i> is below the <i>background</i>. Use `baseColor` for a simple colored background that does not change. The background is only added if the `background` option is truthy.

The "Update" column indicates if an option can be a function. When an option is a function, it is called each tick and is passed the agent (or simulation object for a background option), and the returned value is used for the option &mdash; if the value is `null` or `undefined`, the option's default value is used. If an option is a 'standard function' (rather than an arrow function), `this` also refers to the agent/simulation inside the function.

### Text

| Option       | Top-level | Square | Zone | Actor | Update |
|:-------------|:----------|:-------|:-------|:-----|:-----:|
| `text` |  | `null`  | `null` | `null` | ✓ |
| `textPosition` |  | `'center'` | `'center'` |  |  |
| `textPadding` |  | `3` | `3` |  |  |
| `textRotate` |  |  |  | `false` |  |
| `textMaxWidth` |  |  |  | `0` |  |
| `textAlign` | `'center'` | `null` | `null` | `null` |  |
| `textTint` | `0x0` | `null` | `null` | `null` | ✓ (except top-level) |
| `textAlpha` | `1` | `null` | `null` | `null` | ✓ (except top-level) |
| `fontName` | `null` |  `null` | `null` | `null` | ✓ (except top-level) |
| `fontSize` | 16 |  `null` | `null` | `null` | ✓ (except top-level) |

<p style="font-size: 0.9em; margin-top: -0.9em">(Default values shown; empty cell indicates that option is not used; see Basic options for an explanation of "Update".)</p>

'Top-level' options are passed to the `vis` or `visObs` functions. A top-level option is used when the corresponding agent option is `null` or `undefined`.

Atomic Agents Vis uses bitmap text, so one or more bitmap fonts should be preloaded using the `images` option. For example:

```js
AV.vis(sim, {
  images: ['https://cdn.jsdelivr.net/gh/gjmcn/sprites/bitmap-fonts-96/hack.xml'],
  fontName: 'Hack'  // top-level option
});
```

__Notes:__

* [This repository](https://github.com/gjmcn/sprites) has some bitmap fonts to get started. New bitmap fonts can be generated from font files using free online tools such as [SnowBamboo](https://snowb.org/).

* If an agent has text, its `fontName` must be specified, or a top-level `fontName` must be specified (or both).

* If `textRotate` is `true`, the actor's text is rotated with its shape/image.

* By default, an actor's text scales with its shape/image &mdash; preserving the scale ratio from when the text was first added. To prevent this automatic scaling, the actor's font size must be updated &mdash; i.e. the agent's `fontSize` option must be a function.

* `textAlign` can be `'left'`, `'right'`, `'center'` or  `'justify'`.

* `textPosition` can be `'center'`, `'top'`, `'top-right'`, `'right'`, `'bottom-right'`, `'bottom'`, `'bottom-left'`, `'left'` or `'top-left'`. 

* Text automatically wraps in squares and zones to keep the text width (plus padding) less than the width of the square/zone. In actors, text is wrapped to keep its width less than `textMaxWidth`. Use `'\n'` characters in text for explicit line breaks. 

* If an agent's text is `null`, `undefined` or an empty string, no text is shown &mdash; and since a text object is only added when it is first required, no text object is added.

* At a given tick, `textTint`, `textAlpha`, `fontName` and `fontSize` are only updated if the relevent agent has (nonempty) text.

!> Currently, text does not behave reliably when the size of the agent's texture is changed. For example, when a zone's image is changed to an image of a different size (or to no image so a shape is used).

### Shape

| Option       | Square | Zone | Actor |
|:-------------|:-------|:-----|:------|
| `advanced` | `false` | `false` | `false` |
| `lineColor` | `0x0` | `0x0` | `0x0` |
| `lineAlpha` | `1` | `1` | `1` |
| `lineWidth` | `1` | `1` | `1` |
| `lineAlign` | `0.5` | `0.5` | `0.5` |
| `fillColor` | `0xffffff` | `0xffffff` | `0xffffff` |
| `fillAlpha` | `1` | `1` | `1` |

<p style="font-size: 0.9em; margin-top: -0.9em">(Default values shown.)</p>

When an agent's [image](#images) path is falsy, the agent's shape is used &mdash; a square, rectangle or circle. Use `advanced: true` to enable the advanced shape options (i.e. the line and fill options above).

__Notes:__

* The basic `tint` option is essentially the fill color for a shape or white image; do not use advanced options purely for a fill color.

* Unlike `tint` and `alpha`, advanced options cannot be updated &mdash; i.e. they cannot be functions.

* Using advanced shape options with a large number of agents may impact performance.

* `lineAlign` can be `0` (inner), `0.5` (middle) or `1` (outer).

### Interaction

Event listeners can be added to agents or to the simulation (i.e. the background) using the following options:

&emsp;&emsp;`click`<br>
&emsp;&emsp;`pointercancel`<br>
&emsp;&emsp;`pointerdown`<br>
&emsp;&emsp;`pointerout`<br>
&emsp;&emsp;`pointerover`<br>
&emsp;&emsp;`pointertap`<br>
&emsp;&emsp;`pointerup`<br>
&emsp;&emsp;`pointerupoutside`<br>

Pointer events fire for both mouse and touch events.

!> When adding event listeners to the simulation (i.e. the background), remember to also include `background: true` otherwise the background will not exist.

An event listener is a function. When an event of the relevant type is 'heard', the function is called and is passed the event. Inside the function (assuming it is not an arrow function), `this` is the agent/simulation that the listener belongs to.

If an agent has even a single event listener, it becomes interactive and blocks events firing on the agents/background below. This behavior can be frustrating in some cases, but useful in others. For example, to have an agent block all events getting through, give it an empty click listener: `click: () => {}`.

## Drawing Order

An agent is either never drawn, or it is added to one of three <i>visualisation containers</i> based on its `zIndex` property when `vis` or `visObs` is called (or if the agent is added to the simulation after it has started, the value of `zIndex` at the end of the tick when the agent is added):

* never drawn, `zIndex`: `NaN` (or any non-number).
* <i>back container</i>, `zIndex`: `-Infinity`.
* <i>middle container</i>, `zIndex`: finite number.
* <i>front container</i>, `zIndex`: `Infinity`.

When `vis` or `visObs` is called, agents in the simulation are added to visualisation containers in the order: squares, then zones, then actors. For each agent type, agents are added in the order they were added to the simulation. Each tick, new agents are added to containers using the same rules.

Each tick, the simulation is drawn in the following order:

1. The background.
1. Agents in the back container; drawn in the order they were added to the container.
1. Agents in the middle container; drawn in ascending order of their `zIndex` properties.
1. Agents in the front container; drawn in the order they were added to the container.

An agent cannot move between containers. If an agent's position in the drawing order might change during the simulation (i.e. its `zIndex` might change), the agent should be added to the middle container (i.e. its initial `zIndex` should be a finite number).

?> Note: once an agent has been added to a container, setting it's `zIndex` to `NaN` does not hide the agent. Instead, use an alpha of `0` to hide the agent.

?> Note: in Atomic Agents, the `zIndex` property of squares is `NaN` by default &mdash; so squares are not drawn in Atomic Agents Vis by default.

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

## Images

To use a sprite sheet, preload it with the `images` option. Use the image names from the sprite sheet when setting the `image` option of agents or the simulation (i.e. the background). For example:

```js
// simulation with tiled grass image for the background
const sim = new AA.Simulation().vis({
  background: true,
  image: 'grass.png',
  tile: true
})

// tree
new AA.Actor({
  x: 100,
  y: 100,
  radius: 30
}).vis({
  image: 'tree-dark.png'
}).addTo(sim);

AV.vis(sim, {
  images: ['https://cdn.jsdelivr.net/gh/gjmcn/sprites/sprite-sheets/outside.json']
});
```

?> Note: [this repository](https://github.com/gjmcn/sprites) has some useful images and sprite sheets to get started. New sprite sheets can be created with free online tools such as [Free texture packer](https://free-tex-packer.com/app/).

To use an image file directly, preload the image with `images` and use the same path/URL in the appropriate `image` option &mdash; not just the file name. An image can be used without preloading it, but the image will 'pop in' after it loads. Images that are [tiled](#tiling) must be preloaded for the image-to-tile scale to be computed correctly.

An actor with pointing/heading `0` faces the viewer's right, so images that will be used to indicate actors' pointings/headings should also face right.

For a square or zone, the image is rotated/reflected based on the agent's `direction` property:

| Square/Zone Direction | Image Transformation |
|:---:|:---|
| 0 | no transformation |
| 1 | 90° (clockwise) |
| 2 | 180° | 
| 3 | 270° |
| 4 | flip horizontal |
| 5 | flip vertical |

If the `direction` of a square or zone changes during the simulation, the agent's `image` option must be a function for the image rotation/reflection to be updated &mdash; so even if the image path does not change, use  e.g. `direction: () => 'house.png'` rather than `direction: 'house.png'`.

## Tiling

Use `tile: true` with a zone or simulation (i.e. the background) to tile an image/shape. Tiles are the same size as simulation squares, so the image to be tiled should be square. Currently, each image-to-tile scale is only computed once during initialisation, so if an image is changed during the simulation (e.g. a zone changes from grass to sand), the new image should be the same size as the old image.

## Particles

Each of the back, middle and front containers (see [Drawing Order](#drawing-order)) can be a standard container or a <i>particle container</i>. Particle containers have better performance, but are less flexible:

* Image/shape restictions:

  * When using images, all agents in the container must use the same image, or use images from the same sprite sheet &mdash; in which case an agent's image <i>can</i> be changed during the simulation.
  
  * When not using images, all agents in the container will be of the same shape &mdash; which is typically only appropriate when all agents in the container (or at least those that are drawn) are of the same type. If [advanced shape](#shape) options are used, they
  <i>cannot</i> vary by agent.

* [Tiling](#tiling) <i>cannot</i> be used with agents in a particle container.

* [Text](#text) <i>cannot</i> be used with agents in a particle container.

?> Note: the tints and alphas of agents in a particle container are updated as normal, as are the sizes and rotations of actors.

Set the `backParticles` option to `true` to specify that the back container is a particle container. The `middleParticles` and `frontParticles` options are used similarly.

Instead of setting a particle option to `true`, we can use a positive integer: the estimated maximum size required for the container. This need not be accurate since the container will resize if more 'particles' are required. When a particle option is `true`, `10000` is used as the estimated maximum size.

## Helpers

Atomic Agents Vis exports the following helper functions:

| Function | Description | Return |
|:---|:---|:---|
| `line(points, options)` | Convenience function for creating a line or polyline with `PIXI.Graphics`. `points` should be an array of objects with `x` and `y` properties (so a point can an Atomic Agents vector or agent). If passed, `options` should be an object; valid properties and their defaults are:<ul style="margin:0"><li>`width = 1`: width.</li><li>`color = 0x0`: color.</li><li>`alpha = 1`: alpha.</li><li>`join = 'miter'`: line join style; can be `'bevel'`,`'miter'` or `'round'`.</li><li>`cap = 'butt'`: line cap style; can be `'butt'`,`'round'` or `'square'`.</li></ul> | `PIXI.Graphics`<br>object  |
| `text(t, x, y, options)` | Convenience function for creating a `PIXI.BitmapText` object with text `t` and position `x`,`y`. `options` should be an object; valid properties and their defaults are:<ul style="margin:0"><li>`fontName`: font name (required).</li><li>`fontSize = 16`: font size.</li><li>`align = 'center'`: alignment for multiline text; can be `'left'`, `'center'`, `'right'` or `'justify'`.</li><li>`tint = 0x0`: tint (i.e. color).</li><li>`letterSpacing = 0`: letter spacing.</li><li>`maxWidth = 0`: max width; text automatically wraps to stay within the max width.</li><li>`alpha = 1`: alpha.</li><li>`xAnchor: 0.5`: x anchor; `0` for left, `0.5` for center, `1` for right.</li><li>`yAnchor: 0.5`: y anchor; `0` for top, `0.5` for center, `1` for bottom.</li></ul><br>__Note__: `text` is an independent helper function so is not affected by top-level text options (see [Text](#text)).<br><br>__Note:__ bitmap fonts must be loaded before they are used &mdash; see example below. | `PIXI.BitmapText`<br>object |

An example of using `line` and `text`:

```js
const points = [{x: 20, y: 50}, {x:200, y: 200}, {x: 40, y: 150}];

AV.vis(new AA.Simulation(), {
  
  // load bitmap font
  images: ['https://cdn.jsdelivr.net/gh/gjmcn/sprites/bitmap-fonts-96/swansea.xml'],
  
  // call text after font has loaded
  afterSetup: (sim, app) => {
    app.stage.addChild(AV.line(points, {width: 5}));
    app.stage.addChild(AV.text('hello', 100, 200, {fontName: 'Swansea'}));
  }

});
```