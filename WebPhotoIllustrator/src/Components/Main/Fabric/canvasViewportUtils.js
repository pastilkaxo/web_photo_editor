import { Point } from "fabric";

import { refreshSnapGuideLines } from "./snappingHelpers";

/**
 * Масштаб с центрированием в буфере холста: весь лист (фон + объекты) вместе, отдаление/приближение единым блоком.
 */
export function setUniformViewportZoom(canvas, zoom) {
  if (!canvas) return;
  const z = Math.max(0.05, Math.min(5, Number(zoom) || 1));
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  const offsetX = (cw - cw * z) / 2;
  const offsetY = (ch - ch * z) / 2;
  canvas.setViewportTransform([z, 0, 0, z, offsetX, offsetY]);
  refreshSnapGuideLines(canvas);
  canvas.requestRenderAll();
}

/**
 * Кнопки «+ / −»: зум всего холста относительно центра листа (не точки на клетке).
 */
export function zoomCanvasAtArtboardCenter(canvas, zoomPercent) {
  if (!canvas) return;
  const z = Math.min(5, Math.max(0.05, Number(zoomPercent) / 100));
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  canvas.zoomToPoint(new Point(cw / 2, ch / 2), z);
  refreshSnapGuideLines(canvas);
  canvas.requestRenderAll();
}

/** Ctrl/⌘ + колесо по клетке (вне холста): зум всего листа от центра — как отдаление целого холста */
export function wheelZoomArtboardCenter(canvas, deltaY) {
  if (!canvas) return 1;
  let z = canvas.getZoom();
  z *= 0.999 ** deltaY;
  z = Math.min(5, Math.max(0.05, z));
  const cw = canvas.getWidth();
  const ch = canvas.getHeight();
  canvas.zoomToPoint(new Point(cw / 2, ch / 2), z);
  refreshSnapGuideLines(canvas);
  canvas.requestRenderAll();
  return z;
}

/** Ctrl/⌘ + колесо по холсту: зум к курсору (тот же единый viewport, что и по клетке) */
export function wheelZoomAtPointer(canvas, clientX, clientY, deltaY) {
  if (!canvas?.upperCanvasEl) return 1;
  const upper = canvas.upperCanvasEl;
  const cr = upper.getBoundingClientRect();
  let x = clientX - cr.left;
  let y = clientY - cr.top;
  x = Math.max(0, Math.min(cr.width, x));
  y = Math.max(0, Math.min(cr.height, y));
  let z = canvas.getZoom();
  z *= 0.999 ** deltaY;
  z = Math.min(5, Math.max(0.05, z));
  canvas.zoomToPoint(new Point(x, y), z);
  refreshSnapGuideLines(canvas);
  canvas.requestRenderAll();
  return z;
}

export function isEventTargetOnFabricCanvas(canvas, target) {
  if (!canvas?.upperCanvasEl || !target) return false;
  const upper = canvas.upperCanvasEl;
  const lower = canvas.lowerCanvasEl;
  if (target === upper || target === lower) return true;
  if (upper.contains && upper.contains(target)) return true;
  if (lower && lower.contains && lower.contains(target)) return true;
  return false;
}
