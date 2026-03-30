export const SERIALIZATION_PROPS = [
  "id",
  "styleID",
  "zIndex",
  "name",
  "selectable",
  "evented",
  "lockMovementX",
  "lockMovementY",
  "lockRotation",
  "lockScalingX",
  "lockScalingY",
  "src",
  "filters",
  "clipPath",
  "text",
  "fontSize",
  "fontFamily",
  "fill",
  "stroke",
  "strokeWidth",
  "backgroundColor",
];

export function extendObjectWithCustomProps(object) {
  object.styleID = object.styleID || null;
  object.zIndex = object.zIndex || 0;
  object.id = object.id || `obj-${Date.now()}`;

  const originalToObject = object.toObject;

  object.toObject = function (propertiesToInclude = []) {
    const allProps = [...new Set([...propertiesToInclude, ...SERIALIZATION_PROPS])];
    return originalToObject.call(this, allProps);
  };
}
