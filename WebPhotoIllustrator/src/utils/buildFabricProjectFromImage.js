import { Canvas, FabricImage } from "fabric";

import { SERIALIZATION_PROPS, extendObjectWithCustomProps } from "../Components/Main/Fabric/fabricSerialization";

const PHOTO_CANVAS_MAX_SIZE = 1000;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Не удалось прочитать файл"));
    reader.readAsDataURL(file);
  });
}

function loadNaturalSize(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Не удалось загрузить изображение"));
    img.src = src;
  });
}

/**
 * Собирает JSON проекта Fabric (как при создании из фото в редакторе) для сохранения в облаке.
 */
export async function buildFabricProjectPayloadFromImageFile(file) {
  if (!file?.type?.startsWith("image/")) {
    throw new Error("Выберите файл изображения");
  }
  const dataUrl = await readFileAsDataUrl(file);
  const { width: nw, height: nh } = await loadNaturalSize(dataUrl);
  const sourceWidth = Math.max(1, Math.round(nw));
  const sourceHeight = Math.max(1, Math.round(nh));
  const imageScale =
    sourceWidth > PHOTO_CANVAS_MAX_SIZE || sourceHeight > PHOTO_CANVAS_MAX_SIZE
      ? Math.min(PHOTO_CANVAS_MAX_SIZE / sourceWidth, PHOTO_CANVAS_MAX_SIZE / sourceHeight)
      : 1;
  const cw = Math.max(1, Math.round(sourceWidth * imageScale));
  const ch = Math.max(1, Math.round(sourceHeight * imageScale));

  const el = document.createElement("canvas");
  const canvas = new Canvas(el, { width: cw, height: ch });
  canvas.backgroundColor = "#ffffff";

  let imageObject;
  try {
    imageObject = await FabricImage.fromURL(dataUrl, { crossOrigin: "anonymous" });
  } catch {
    imageObject = await FabricImage.fromURL(dataUrl);
  }
  if (Number.isFinite(imageScale) && imageScale > 0) {
    imageObject.scale(imageScale);
  }
  const displayName = (file.name || "").replace(/\.[^.]+$/i, "").trim() || "Базовое изображение";
  imageObject.set({
    left: 0,
    top: 0,
    src: dataUrl,
    name: displayName,
    selectable: true,
    evented: true,
  });
  imageObject.setCoords();
  extendObjectWithCustomProps(imageObject);
  canvas.add(imageObject);
  canvas.setActiveObject(imageObject);

  const json = canvas.toJSON(SERIALIZATION_PROPS);
  json.width = cw;
  json.height = ch;

  const previewImage = canvas.toDataURL({
    format: "png",
    quality: 0.5,
    width: cw,
    height: ch,
  });

  canvas.dispose();

  const suggestedName = displayName.slice(0, 120) || "Фото из галереи";
  return { json, previewImage, suggestedName };
}
