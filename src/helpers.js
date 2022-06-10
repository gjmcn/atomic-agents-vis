////////////////////////////////////////////////////////////////////////////////
// Helper constants and functions.
////////////////////////////////////////////////////////////////////////////////


import * as PIXI from '../node_modules/pixi.js/dist/browser/pixi.mjs';

export const directionCodes = [0, 6, 4, 2, 12, 8];

export function line(points, options) {
  options = Object.assign({
    width: 1,
    color: 0x0,
    alpha: 1,
    join: 'miter',
    cap: 'butt'
  }, options);
  options.join = PIXI.LINE_JOIN[options.join.toUpperCase()];
  options.cap  = PIXI.LINE_CAP[options.cap.toUpperCase()];
  const g = new PIXI.Graphics();
  g.lineStyle(options);
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  return g;
}

export function text(t, x, y, options) {
  options = Object.assign({
    fontName: null,
    fontSize: 16,
    align: 'center',
    tint: 0x0,
    letterSpacing: 0,
    maxWidth: 0,
    alpha: 1,
    xAnchor: 0.5,
    yAnchor: 0.5,
  }, options);
  const txt = new PIXI.BitmapText(t, options);
  txt.x = x ?? 0;
  txt.y = y ?? 0;
  txt.alpha = options.alpha;
  txt.anchor = new PIXI.Point(options.xAnchor, options.yAnchor);
  return txt;
}