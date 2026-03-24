import { Line } from "fabric";

const snappingDistance = 10;

function collectGuideLineObjects(canvas) {
    if (!canvas) return [];
    return canvas.getObjects().filter(
        (obj) =>
            obj &&
            obj.id &&
            (obj.id.startsWith("vertical-") || obj.id.startsWith("horizontal-"))
    );
}

function readBounds(obj) {
    obj.setCoords();
    if (typeof obj.getBoundingRect === "function") {
        const r = obj.getBoundingRect();
        return {
            left: r.left,
            top: r.top,
            width: r.width,
            height: r.height,
        };
    }
    const w =
        typeof obj.getScaledWidth === "function"
            ? obj.getScaledWidth()
            : obj.width * (obj.scaleX || 1);
    const h =
        typeof obj.getScaledHeight === "function"
            ? obj.getScaledHeight()
            : obj.height * (obj.scaleY || 1);
    return {
        left: obj.left,
        top: obj.top,
        width: w,
        height: h,
    };
}

function boundsToEdges(b) {
    return {
        left: b.left,
        top: b.top,
        right: b.left + b.width,
        bottom: b.top + b.height,
        centerX: b.left + b.width / 2,
        centerY: b.top + b.height / 2,
        width: b.width,
        height: b.height,
    };
}

function sceneBoundsOfViewport(canvas) {
    const vpt = canvas.viewportTransform;
    const sx = vpt[0] || 1;
    const sy = vpt[3] || 1;
    const tx = vpt[4];
    const ty = vpt[5];
    const cw = canvas.getWidth();
    const ch = canvas.getHeight();
    return {
        left: -tx / sx,
        top: -ty / sy,
        right: (cw - tx) / sx,
        bottom: (ch - ty) / sy,
        centerX: (cw / 2 - tx) / sx,
        centerY: (ch / 2 - ty) / sy,
    };
}

const getVisibleBounds = (canvas) => {
    const vpt = canvas.viewportTransform;
    const sx = vpt[0] || 1;
    const sy = vpt[3] || 1;
    const top = (0 - vpt[5]) / sy;
    const bottom = (canvas.getHeight() - vpt[5]) / sy;
    const left = (0 - vpt[4]) / sx;
    const right = (canvas.getWidth() - vpt[4]) / sx;
    const padding = 5000 / Math.max(Math.abs(sx), 0.0001);
    return {
        top: top - padding,
        bottom: bottom + padding,
        left: left - padding,
        right: right + padding,
    };
};

export function createVerticalGuideline(canvas, x, id) {
    const bounds = getVisibleBounds(canvas);
    const z = Math.max(canvas.getZoom() || 1, 0.0001);
    return new Line([x, bounds.top, x, bounds.bottom], {
        id,
        stroke: "rgba(255, 0, 0, 0.88)",
        strokeWidth: 1 / z,
        selectable: false,
        evented: false,
        strokeDashArray: [5 / z, 5 / z],
        opacity: 0.88,
        excludeFromExport: true,
    });
}

export function createHorizontalGuideline(canvas, y, id) {
    const bounds = getVisibleBounds(canvas);
    const z = Math.max(canvas.getZoom() || 1, 0.0001);
    return new Line([bounds.left, y, bounds.right, y], {
        id,
        stroke: "rgba(255, 0, 0, 0.88)",
        strokeWidth: 1 / z,
        selectable: false,
        evented: false,
        strokeDashArray: [5 / z, 5 / z],
        opacity: 0.88,
        excludeFromExport: true,
    });
}

export const clearGuideLines = (canvas) => {
    if (!canvas) return;
    collectGuideLineObjects(canvas).forEach((obj) => canvas.remove(obj));
};

/** После зума/панорамы — убрать направляющие (при следующем перетаскивании появятся заново). */
export function refreshSnapGuideLines(canvas) {
    if (!canvas) return;
    clearGuideLines(canvas);
    canvas.requestRenderAll();
}

export const handleObjectMoving = (canvas, obj) => {
    const zoom = Math.max(canvas.getZoom() || 1, 0.0001);
    const dist = snappingDistance / zoom;
    const vp = sceneBoundsOfViewport(canvas);

    clearGuideLines(canvas);

    const applyDelta = (dx, dy) => {
        if (dx === 0 && dy === 0) return;
        obj.set({ left: obj.left + dx, top: obj.top + dy });
        obj.setCoords();
    };

    const newLines = [];
    let snapped = false;

    let b = boundsToEdges(readBounds(obj));
    if (Math.abs(b.left - vp.left) < dist) {
        applyDelta(vp.left - b.left, 0);
        snapped = true;
        newLines.push(createVerticalGuideline(canvas, vp.left, "vertical-left"));
    }

    b = boundsToEdges(readBounds(obj));
    if (Math.abs(b.right - vp.right) < dist) {
        applyDelta(vp.right - b.right, 0);
        snapped = true;
        newLines.push(createVerticalGuideline(canvas, vp.right, "vertical-right"));
    }

    b = boundsToEdges(readBounds(obj));
    if (Math.abs(b.centerX - vp.centerX) < dist) {
        applyDelta(vp.centerX - b.centerX, 0);
        snapped = true;
        newLines.push(createVerticalGuideline(canvas, vp.centerX, "vertical-center"));
    }

    b = boundsToEdges(readBounds(obj));
    if (Math.abs(b.top - vp.top) < dist) {
        applyDelta(0, vp.top - b.top);
        snapped = true;
        newLines.push(createHorizontalGuideline(canvas, vp.top, "horizontal-top"));
    }

    b = boundsToEdges(readBounds(obj));
    if (Math.abs(b.bottom - vp.bottom) < dist) {
        applyDelta(0, vp.bottom - b.bottom);
        snapped = true;
        newLines.push(createHorizontalGuideline(canvas, vp.bottom, "horizontal-bottom"));
    }

    b = boundsToEdges(readBounds(obj));
    if (Math.abs(b.centerY - vp.centerY) < dist) {
        applyDelta(0, vp.centerY - b.centerY);
        snapped = true;
        newLines.push(createHorizontalGuideline(canvas, vp.centerY, "horizontal-center"));
    }

    if (snapped) {
        newLines.forEach((line) => canvas.add(line));
    }

    canvas.renderAll();
};
