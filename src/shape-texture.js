////////////////////////////////////////////////////////////////////////////////
// Textures for simple geometric shapes - draws the shape as a graphic then
// converts it to a texture.
////////////////////////////////////////////////////////////////////////////////

// use browser version of PixiJS to fix issue #2
import * as PIXI from '../node_modules/pixi.js/dist/browser/pixi.mjs';


const drawShape = {

  rect(shape, gr) {
    gr.drawRect(
      0,
      0,
      shape.width,
      shape.height
    );
  },

  circle(shape, gr) {
    gr.drawCircle(
      shape.radius,
      shape.radius,
      shape.radius
    );
  },

}

export function shapeTexture(shape, app, useLine) {
  const gr = new PIXI.Graphics();
  useLine
    ? gr.lineStyle(
        shape.lineWidth,
        shape.lineColor,
        shape.lineAlpha,
        shape.lineAlign
      )
    : gr.lineStyle(0);
  gr.beginFill(shape.color, shape.alpha);
  drawShape[shape.name](shape, gr);
  gr.endFill();
  const t = app.renderer.generateTexture(gr);
  gr.destroy();
  return t;
}