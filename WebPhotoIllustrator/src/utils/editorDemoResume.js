import { SERIALIZATION_PROPS } from "../Components/Main/Fabric/fabricSerialization";

export const DEMO_SNAPSHOT_KEY = "wi_editor_demo_snapshot";
export const DEMO_INTENT_KEY = "wi_editor_demo_resume_intent";
export const OPEN_SAVE_AFTER_RESUME_KEY = "wi_editor_open_save_after_resume";

/**
 * @param {{ includePreview?: boolean }} [options] — превью увеличивает размер; для автосохранения оставлять false.
 */
export function persistDemoSnapshot(canvas, options = {}) {
  if (!canvas) return;
  const { includePreview = false } = options;
  try {
    const json = canvas.toJSON(SERIALIZATION_PROPS);
    json.width = canvas.width;
    json.height = canvas.height;
    let previewImage;
    if (includePreview) {
      try {
        previewImage = canvas.toDataURL({
          format: "png",
          quality: 0.45,
          multiplier: 0.35,
        });
      } catch (e) {
        console.warn("persistDemoSnapshot preview:", e);
      }
    }
    let carryPreview;
    if (!previewImage && !includePreview) {
      try {
        const prevRaw = sessionStorage.getItem(DEMO_SNAPSHOT_KEY);
        if (prevRaw) {
          const prev = JSON.parse(prevRaw);
          if (typeof prev.previewImage === "string" && prev.previewImage.length > 0) {
            carryPreview = prev.previewImage;
          }
        }
      } catch {
        /* ignore */
      }
    }
    sessionStorage.setItem(
      DEMO_SNAPSHOT_KEY,
      JSON.stringify({
        v: 1,
        savedAt: Date.now(),
        content: json,
        ...(previewImage || carryPreview
          ? { previewImage: previewImage || carryPreview }
          : {}),
      })
    );
  } catch (e) {
    console.warn("persistDemoSnapshot:", e);
  }
}

export function readDemoSnapshot() {
  try {
    const raw = sessionStorage.getItem(DEMO_SNAPSHOT_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data || !data.content) return null;
    return data;
  } catch {
    return null;
  }
}

export function clearDemoSnapshot() {
  sessionStorage.removeItem(DEMO_SNAPSHOT_KEY);
}

export function setResumeAfterAuthIntent() {
  sessionStorage.setItem(DEMO_INTENT_KEY, "1");
}

export function hasResumeIntent() {
  return sessionStorage.getItem(DEMO_INTENT_KEY) === "1";
}

export function clearResumeIntent() {
  sessionStorage.removeItem(DEMO_INTENT_KEY);
}

export function setOpenSaveDialogAfterResume() {
  sessionStorage.setItem(OPEN_SAVE_AFTER_RESUME_KEY, "1");
}

/** Однократно: после восстановления демо-холста открыть модалку «Сохранить в облако». */
export function consumeOpenSaveDialogAfterResume() {
  if (sessionStorage.getItem(OPEN_SAVE_AFTER_RESUME_KEY) !== "1") return false;
  sessionStorage.removeItem(OPEN_SAVE_AFTER_RESUME_KEY);
  return true;
}
