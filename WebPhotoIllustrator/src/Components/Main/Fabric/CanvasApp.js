import React,{useRef,useState,useEffect,useContext,useCallback} from "react"

import { IconButton } from "blocksin-system";
import { Canvas, Rect, Circle, Textbox, Triangle, Group, Line, FabricImage } from "fabric";
import { observer } from "mobx-react-lite";
import { useParams , Link, useNavigate } from "react-router-dom";
import {
  SquareIcon, CircleIcon, TextIcon,
  LayersIcon, SlashIcon, TriangleIcon, ImageIcon, UnionIcon, IntersectIcon,
  CropIcon, Pencil1Icon, ResetIcon, ReloadIcon,EyeOpenIcon
} from "sebikostudio-icons"
import {
  Redo,
  Undo,
  Tune,
  Close,
  AspectRatio,
  CenterFocusStrong,
  DeleteOutline,
  Palette,
  SettingsOutlined,
  Layers as LayersOutlinedIcon,
} from "@mui/icons-material"
import { IconButton as MuiIconButton, Tooltip, Button } from "@mui/material"

import CanvasSettings from "./CanvasSettings";
import Cropping from "./Cropping";
import CroppingSettings from "./CroppingSettings";
import CropTool from "./CropTool";
import FabricAssist from "./fabricAssist";
import FileExport from "./FileExport";
import ImageTool from "./ImageFromUrl";
import PhotoFilterTool from "./PhotoFilterTool";
import CanvasSizeModal from "./CanvasSizeModal";
import LayersList from "./LayersList";
import PensilTool from "./PencilTool";
import Settings from "./Settings";
import { handleObjectMoving, clearGuideLines } from "./snappingHelpers";
import StyleEditor from "./StyleEditor";
import Video from "./Video";
import ZoomControl from "./ZoomControl";
import { Context } from "../../..";
import ProjectService from "../../../Services/ProjectService";
import NotFound from "../../ErrorAlerts/NotFound";
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { modalStyle } from "./styles";
import {
  setUniformViewportZoom,
  wheelZoomArtboardCenter,
  wheelZoomAtPointer,
  isEventTargetOnFabricCanvas,
} from "./canvasViewportUtils";
import { SERIALIZATION_PROPS, extendObjectWithCustomProps } from "./fabricSerialization";

export { SERIALIZATION_PROPS };

const DEFAULT_NEW_CANVAS_WIDTH = 800;
const DEFAULT_NEW_CANVAS_HEIGHT = 600;
// Photo mode: longest side is capped here. Keeps the canvas fast and easy to edit.
const PHOTO_CANVAS_MAX_SIZE = 1000;
// Абсолютный потолок (редко нужен); ввод ограничивается экраном пользователя.
const ABSOLUTE_CANVAS_MAX = 8192;
const WORKSPACE_CONTENT_INSET = 16;
/** Без множителя: макс. размер холста не больше видимой области рабочей зоны (без горизонтального overflow). */
function measureMaxCanvasFromViewport(workspaceEl) {
  let aw =
    typeof window !== "undefined"
      ? Math.max(320, window.innerWidth - 440)
      : 1200;
  let ah =
    typeof window !== "undefined"
      ? Math.max(240, window.innerHeight - 120)
      : 800;
  if (workspaceEl && typeof workspaceEl.clientWidth === "number") {
    aw = Math.max(200, workspaceEl.clientWidth - WORKSPACE_CONTENT_INSET * 2);
    ah = Math.max(200, workspaceEl.clientHeight - WORKSPACE_CONTENT_INSET * 2);
  }
  const maxW = Math.min(ABSOLUTE_CANVAS_MAX, Math.max(320, Math.floor(aw)));
  const maxH = Math.min(ABSOLUTE_CANVAS_MAX, Math.max(240, Math.floor(ah)));
  return { maxW, maxH };
}


function CanvasApp() {
  const { id: projectId } = useParams();
  const { store } = useContext(Context);
  const navigate = useNavigate();

  const canvasRef = useRef(null);
  const workspaceRef = useRef(null);
  const [canvas, setCanvas] = useState(null);

  const [refreshKey, setRefreshKey] = useState(0);
  const [showLayers, setShowLayers] = useState(true);
  const [showImageMenu, setShowImageMenu] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [showCropTool, setShowCropTool] = useState(false);

  const [sizeChosen, setSizeChosen] = useState(false);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [maxCanvasWidth, setMaxCanvasWidth] = useState(
    () => measureMaxCanvasFromViewport(null).maxW
  );
  const [maxCanvasHeight, setMaxCanvasHeight] = useState(
    () => measureMaxCanvasFromViewport(null).maxH
  );

  const [isDrawing, setIsDrawing] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [cropRect, setCropRect] = useState(null);
  
  const [isReadOnly, setIsReadOnly] = useState(false);
  const isReadOnlyRef = useRef(false);
  const isUnsavedRef = useRef(false);
  const clipboardRef = useRef(null);

  const isDragging = useRef(false);
  const lastPosX = useRef(0);
  const lastPosY = useRef(0);
  const pendingInitialImageRef = useRef(null);
  const pendingNewProjectConfigRef = useRef(null);
  const newProjectInitIdRef = useRef(0);
  
  // State нужен только для обновления UI (активность кнопок), 
  // а Ref хранит актуальные данные для слушателей событий.
  const [historyIndex, setHistoryIndex] = useState(-1); 
  const historyRef = useRef([]);
  const historyIndexRef = useRef(-1);

  const isHistoryProcessing = useRef(false);
  const isTransaction = useRef(false);
  const [isNotFound, setIsNotFound] = useState(false);

  const [open, setOpen] = React.useState(false);
  const handleClose = () => setOpen(false);
  const [showCanvasSettings, setShowCanvasSettings] = useState(true);
  const [showStylePanel, setShowStylePanel] = useState(true);
  const [showObjectSettings, setShowObjectSettings] = useState(true);

  const updateCanvasLimits = useCallback(() => {
    const { maxW, maxH } = measureMaxCanvasFromViewport(workspaceRef.current);
    setMaxCanvasWidth(maxW);
    setMaxCanvasHeight(maxH);
  }, []);

  const centerCanvasViewport = useCallback((targetCanvas, options = {}) => {
    if (!targetCanvas || !workspaceRef.current) return;

    const ws = workspaceRef.current;
    const canvasW = targetCanvas.getWidth();
    const canvasH = targetCanvas.getHeight();
    const safePadding = 4;

    let currentZoom;
    if (options.fitToScreen) {
      const availW = Math.max(80, ws.clientWidth - safePadding * 2);
      const availH = Math.max(80, ws.clientHeight - safePadding * 2);
      currentZoom = Math.min(availW / canvasW, availH / canvasH, 1);
      currentZoom = Math.max(currentZoom, 0.05);
    } else if (options.resetZoom) {
      currentZoom = 1;
    } else {
      currentZoom = targetCanvas.getZoom() || 1;
    }

    setUniformViewportZoom(targetCanvas, currentZoom);
    setZoom(Math.round(currentZoom * 100));
  }, []);

  useEffect(() => {
    if (!canvas || !maxCanvasWidth || !maxCanvasHeight) return;
    const w = canvas.getWidth();
    const h = canvas.getHeight();
    const nw = Math.min(w, maxCanvasWidth);
    const nh = Math.min(h, maxCanvasHeight);
    if (nw !== w || nh !== h) {
      canvas.setDimensions({ width: nw, height: nh });
      setCanvasWidth(nw);
      setCanvasHeight(nh);
      canvas.requestRenderAll();
      centerCanvasViewport(canvas, { fitToScreen: true });
    }
  }, [canvas, maxCanvasWidth, maxCanvasHeight, centerCanvasViewport]);

  useEffect(() => {
      isReadOnlyRef.current = isReadOnly;
      if (canvas) {
          canvas.selection = !isReadOnly;
          canvas.defaultCursor = isReadOnly ? "default" : "default";
          canvas.hoverCursor = isReadOnly ? "default" : "move";
          if (isReadOnly) {
            canvas.discardActiveObject();
            canvas.forEachObject((obj) => {
                  obj.set({
                    selectable: false,
                    evented: false,
                    lockMovementX: true,
                    lockMovementY: true,
                    lockRotation: true,
                    lockScalingX: true,
                    lockScalingY: true,
                    hasControls: false, 
                    hasBorders: false
                  });
            });
          }
          else {
            canvas.forEachObject((obj) => {
                  obj.set({         
                    selectable: true,
                    evented: true,
                    lockMovementX: false,
                    lockMovementY: false,
                    lockRotation: false,
                    lockScalingX: false,
                    lockScalingY: false,
                    hasControls: true, 
                    hasBorders: true
                  });
            });
          }
          canvas.requestRenderAll();
      }
  }, [isReadOnly, canvas]);

const groupSelectedObjects = () => {
  if (canvas) {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length > 1) {
      isTransaction.current = true;
      const group = new Group(activeObjects, {});
      activeObjects.forEach((obj) => {
        canvas.remove(obj);
      });
      canvas.add(group);
      canvas.setActiveObject(group);
      canvas.renderAll();
      isTransaction.current = false;
      saveHistory(canvas);
    }
  }
};

  const ungroupSelectedObjects = () => {
    if (canvas && !isReadOnly) {
      const activeObject = canvas.getActiveObject();
      if (activeObject && activeObject.type === "group") {
        isTransaction.current = true;
        activeObject.toActiveSelection();
        isTransaction.current = false;
        canvas.requestRenderAll(); 
        saveHistory(canvas);
      }
    }
  };
  
  const saveHistory = (c) => {
    if (isHistoryProcessing.current || (isTransaction.current && isTransaction.current === true) || !c || isReadOnlyRef.current) return; 
    try {
      const json = c.toJSON(SERIALIZATION_PROPS);
      const currentHistory = historyRef.current;
      const currentIndex = historyIndexRef.current;
      let newHistory = currentHistory.slice(0, currentIndex + 1);
      newHistory.push(json);
      historyRef.current = newHistory;
      historyIndexRef.current = newHistory.length - 1;
      setHistoryIndex(historyIndexRef.current);
      isUnsavedRef.current = true;
    } catch (err) { console.log("error save history:", err); }
  }
  
  const undo = async () => {
     if (isHistoryProcessing.current || historyIndexRef.current <= 0 || !canvas || isReadOnly) return;
    isHistoryProcessing.current = true;
    const prevIndex = historyIndexRef.current - 1;
    const prevState = historyRef.current[prevIndex];
    try {
      await canvas.loadFromJSON(prevState);
      canvas.renderAll();
      historyIndexRef.current = prevIndex;
      setHistoryIndex(prevIndex);
    } catch (err) { console.log("error undo:", err); }
    finally { isHistoryProcessing.current = false }
  }

  const redo = async () => {
    if (isHistoryProcessing.current || historyIndexRef.current >= historyRef.current.length - 1 || !canvas || isReadOnly) return;
    isHistoryProcessing.current = true;
    const nextIndex = historyIndexRef.current + 1;
    const nextState = historyRef.current[nextIndex];
    try {
      await canvas.loadFromJSON(nextState);
      canvas.renderAll();
      historyIndexRef.current = nextIndex;
      setHistoryIndex(nextIndex);
    } catch (err) { console.log("error redo:", err); }
    finally { isHistoryProcessing.current = false }
  }

  const handleSizeSelect = (width, height) => {
    pendingInitialImageRef.current = null;
    pendingNewProjectConfigRef.current = {
      width,
      height,
      image: null
    };
    setCanvasWidth(width);
    setCanvasHeight(height);
    setSizeChosen(true);
  };

  const handleCreateFreeCanvas = () => {
    handleSizeSelect(DEFAULT_NEW_CANVAS_WIDTH, DEFAULT_NEW_CANVAS_HEIGHT);
  };

  const handleCreateProjectFromImage = (payload) => {
    if (!payload?.src || !payload?.width || !payload?.height) return;

    const sourceWidth = Math.max(1, Math.round(payload.width));
    const sourceHeight = Math.max(1, Math.round(payload.height));

    // Scale proportionally so the longest side fits within PHOTO_CANVAS_MAX_SIZE.
    // The canvas = scaled photo dimensions, the image fills the canvas exactly at (0,0).
    const imageScale = sourceWidth > PHOTO_CANVAS_MAX_SIZE || sourceHeight > PHOTO_CANVAS_MAX_SIZE
      ? Math.min(PHOTO_CANVAS_MAX_SIZE / sourceWidth, PHOTO_CANVAS_MAX_SIZE / sourceHeight)
      : 1;

    const targetCanvasWidth = Math.max(1, Math.round(sourceWidth * imageScale));
    const targetCanvasHeight = Math.max(1, Math.round(sourceHeight * imageScale));

    pendingInitialImageRef.current = payload;
    pendingNewProjectConfigRef.current = {
      width: targetCanvasWidth,
      height: targetCanvasHeight,
      image: { ...payload, imageScale }
    };
    setCanvasWidth(targetCanvasWidth);
    setCanvasHeight(targetCanvasHeight);
    setSizeChosen(true);
  };
    
  // load and block 

  useEffect(() => {
    if (!canvas) return;
    let isCancelled = false;

    const loadProject = async () => {
      if (projectId) { 
        await loadProjectFromCloud(canvas, projectId);
      } else {
        if (!sizeChosen) return;
        // Important: initialize a new project only from the explicit pending config.
        // Without this guard React re-renders can trigger a second initialization pass
        // after refs are cleared, producing a blank canvas (without the selected photo).
        const config = pendingNewProjectConfigRef.current;
        if (!config?.width || !config?.height) return;
        const initId = ++newProjectInitIdRef.current;
        
        canvas.clear();
        canvas.setDimensions({width: config.width, height: config.height});
        canvas.backgroundColor = "#ffffff";
        centerCanvasViewport(canvas, { fitToScreen: true });
        setIsReadOnly(false);
        setCanvasWidth(config.width);
        setCanvasHeight(config.height);

        const pendingImage = config.image || pendingInitialImageRef.current;
        pendingInitialImageRef.current = null;
        pendingNewProjectConfigRef.current = null;
        if (pendingImage?.src) {
          try {
            isTransaction.current = true;
            let imageObject;
            try {
              imageObject = await FabricImage.fromURL(pendingImage.src, {
                crossOrigin: "anonymous"
              });
            } catch {
              // Data URLs/local blobs can fail with CORS options in some browsers.
              imageObject = await FabricImage.fromURL(pendingImage.src);
            }
            if (isCancelled || initId !== newProjectInitIdRef.current) return;
            const initialScale = pendingImage.imageScale ?? 1;
            if (Number.isFinite(initialScale) && initialScale > 0) {
              imageObject.scale(initialScale);
            }
            // Photo-mode: image is scaled to exactly match canvas size, place at origin.
            imageObject.set({
              left: 0,
              top: 0,
              src: pendingImage.src,
              name: pendingImage.name || "Базовое изображение",
              selectable: true,
              evented: true
            });
            imageObject.setCoords();
            extendObjectWithCustomProps(imageObject);
            canvas.add(imageObject);
            canvas.setActiveObject(imageObject);
          } catch (error) {
            console.error("Failed to initialize project from image:", error);
          } finally {
            isTransaction.current = false;
          }
        }
        if (isCancelled || initId !== newProjectInitIdRef.current) return;

        centerCanvasViewport(canvas, { fitToScreen: true });
        
        const initialJSON = canvas.toJSON(SERIALIZATION_PROPS);
        historyRef.current = [initialJSON];
        historyIndexRef.current = 0;
        setHistoryIndex(0);
        isUnsavedRef.current = false;
        canvas.requestRenderAll();
      }
    };

    loadProject();
    return () => {
      isCancelled = true;
    };
  }, [canvas, projectId, sizeChosen, centerCanvasViewport]);

  const loadProjectFromCloud = async (fabricCanvas, id) => {
    try {
      const response = await ProjectService.getProjectById(id);
      const projectData = response.data;
      const currentUserId = store.user?.id;
      const isNotOwner = !projectData.isOwner || (projectData.info && projectData.info.owner !== currentUserId);

      if (isNotOwner) {
        setIsReadOnly(true);
      } else {
        setIsReadOnly(false);
      }

      if (projectData && projectData.content) {
        await fabricCanvas.loadFromJSON(projectData.content);
        if (projectData.content.width && projectData.content.height) {
            fabricCanvas.setDimensions({
                width: projectData.content.width,
                height: projectData.content.height
            });
            setCanvasWidth(projectData.content.width);
            setCanvasHeight(projectData.content.height);
        }
        centerCanvasViewport(fabricCanvas, { fitToScreen: true });
        fabricCanvas.forEachObject((obj) => {
            extendObjectWithCustomProps(obj);
        });
        fabricCanvas.renderAll();
        
        if (isNotOwner) {
          fabricCanvas.forEachObject((obj) => {
            obj.set({
              selectable: false,
              evented: false,
              lockMovementX: true,
              lockMovementY: true,
              lockRotation: true,
              lockScalingX: true,
              lockScalingY: true,
              hasControls: false,
              hasBorders: false
            });
          });
          fabricCanvas.renderAll();
        } else {
          const initialJSON = fabricCanvas.toJSON(SERIALIZATION_PROPS);
          historyRef.current = [initialJSON];
          historyIndexRef.current = 0;
          setHistoryIndex(0);
          isUnsavedRef.current = false;
        }
      }
    }
    catch (err) {
      console.error("Error loading project:", err);
      if (err.response && (err.response.status === 404 || err.response.status === 400)) {
          setIsNotFound(true);
      } else {
              console.log("Ошибка доступа или сервера");
      }
      
    }
  };

 
  useEffect(() => {
    if (canvasRef.current) {
      const initCanvas = new Canvas(canvasRef.current, {  
        width: 1,
        height: 1,
        selection: true,
      });
      initCanvas.backgroundColor = "#ffffff";
      initCanvas.renderAll();
      setCanvas(initCanvas);
      centerCanvasViewport(initCanvas, { resetZoom: true });

      const initialJSON = initCanvas.toJSON(["id", "styleID", "zIndex", "selectable", "evented"]);
      historyRef.current = [initialJSON];
      historyIndexRef.current = 0;
      setHistoryIndex(0);
      isUnsavedRef.current = false;
      updateCanvasLimits();


      initCanvas.on("object:added", (event) => { 
        if(!isReadOnlyRef.current) {
            if (event.target && (event.target.excludeFromExport || event.target.name === "crop-mask" || (event.target.id && (event.target.id.startsWith("vertical-") || event.target.id.startsWith("horizontal-"))))) return;
            extendObjectWithCustomProps(event.target);
            saveHistory(initCanvas);
        }
      });

      initCanvas.on("mouse:down", function (opt) {
        const evt = opt.e;
        if (evt.ctrlKey) {
          isDragging.current = true;
          initCanvas.selection = false; 
          initCanvas.defaultCursor = "grab";
          lastPosX.current = evt.clientX; 
          lastPosY.current = evt.clientY; 
        }
      });
      

      initCanvas.on("mouse:move", function (opt) {
        if (isDragging.current) {
          const e = opt.e;
          const vpt = initCanvas.viewportTransform;
          
          // Вычисляем смещение и обновляем vpt (матрицу вида)
          // vpt[4] - это translateX, vpt[5] - это translateY
          vpt[4] += e.clientX - lastPosX.current;
          vpt[5] += e.clientY - lastPosY.current;
          
          initCanvas.requestRenderAll(); // Перерисовываем
          
          // Обновляем последние координаты
          lastPosX.current = e.clientX;
          lastPosY.current = e.clientY;
        }
      });

      initCanvas.on("mouse:up", function (opt) {
        if (isDragging.current) {
            initCanvas.setViewportTransform(initCanvas.viewportTransform);
            isDragging.current = false;
            initCanvas.selection = true; // Возвращаем возможность выделения
            initCanvas.defaultCursor = "default"; // Возвращаем курсор
        }
      });


      initCanvas.on("object:moving", (event) => {
        if (!isReadOnlyRef.current) {
            handleObjectMoving(initCanvas, event.target);
        }
      });

      initCanvas.on("object:removed", (event) => {
        if(!isReadOnlyRef.current) {
            if (event.target && (event.target.excludeFromExport || event.target.name === "crop-mask" || (event.target.id && (event.target.id.startsWith("vertical-") || event.target.id.startsWith("horizontal-"))))) return;
            saveHistory(initCanvas);
        }
      });

      initCanvas.on("object:modified", (event) => {
         if(!isReadOnlyRef.current) { 
             if (event.target && (event.target.excludeFromExport || event.target.name === "crop-mask" || (event.target.id && (event.target.id.startsWith("vertical-") || event.target.id.startsWith("horizontal-"))))) return;

             clearGuideLines(initCanvas); 
             saveHistory(initCanvas); 
         }
      });

      const handleKeyDown = (e) => {
        if (isReadOnlyRef.current) return;
        if (["INPUT", "TEXTAREA", "SELECT"].includes(e.target.tagName) || e.target?.isContentEditable) {
            return;
        }

        if (e.key === "Delete" || e.key === "Backspace") {
            const activeObjects = initCanvas.getActiveObjects();
            const activeObject = initCanvas.getActiveObject();

            if (activeObject && activeObject.isEditing) {
                return;
            }

            if (activeObjects.length) {
                activeObjects.forEach((obj) => {
                    initCanvas.remove(obj);
                });
                
                initCanvas.discardActiveObject(); 
                initCanvas.requestRenderAll(); 
            }
        }
        };
      
      window.addEventListener("keydown", handleKeyDown);

      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        initCanvas.dispose();
      }
    }
  }, [centerCanvasViewport, updateCanvasLimits])

  useEffect(() => {
    if (!canvas) return;
    const handleResize = () => {
      updateCanvasLimits();
      centerCanvasViewport(canvas, { fitToScreen: true });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvas, centerCanvasViewport, updateCanvasLimits]);

  /**
   * Зум только с Ctrl/⌘: по холсту — к курсору, вне холста (клетка) — от центра листа.
   */
  useEffect(() => {
    const ws = workspaceRef.current;
    if (!ws || !canvas) return;

    const onWheelCapture = (e) => {
      const t = e.target;
      const tag = t?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t?.isContentEditable) {
        return;
      }
      if (!ws.contains(t)) return;
      if (!e.ctrlKey && !e.metaKey) return;

      const onFabric = isEventTargetOnFabricCanvas(canvas, t);
      const z = onFabric
        ? wheelZoomAtPointer(canvas, e.clientX, e.clientY, e.deltaY)
        : wheelZoomArtboardCenter(canvas, e.deltaY);
      setZoom(Math.round(z * 100));
      e.preventDefault();
      e.stopImmediatePropagation();
    };

    ws.addEventListener("wheel", onWheelCapture, { passive: false, capture: true });
    return () => ws.removeEventListener("wheel", onWheelCapture, true);
  }, [canvas]);

  const handleResetZoom = useCallback(() => {
    if (!canvas) return;
    centerCanvasViewport(canvas, { fitToScreen: true });
  }, [canvas, centerCanvasViewport]);

  const handleDeleteSelected = useCallback(() => {
    if (!canvas || isReadOnlyRef.current) return;
    const activeObjects = canvas.getActiveObjects();
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.isEditing) return;
    if (!activeObjects.length) return;
    activeObjects.forEach((obj) => {
      canvas.remove(obj);
    });
    canvas.discardActiveObject();
    canvas.requestRenderAll();
  }, [canvas]);

  const handleCanvasResized = useCallback(
    (nextWidth, nextHeight) => {
      if (!canvas) return;
      if (nextWidth && nextHeight) {
        setCanvasWidth(nextWidth);
        setCanvasHeight(nextHeight);
      }
      centerCanvasViewport(canvas, { fitToScreen: true });
    },
    [canvas, centerCanvasViewport]
  );

  const commitCanvasChange = useCallback((target) => {
    if (!canvas || isReadOnlyRef.current) return;
    if (target) {
      canvas.fire("object:modified", { target });
      return;
    }
    saveHistory(canvas);
  }, [canvas]);


  useEffect(() => {
    const handleShortcuts = (e) => {
        const activeObject = canvas?.getActiveObject();
        const targetTag = e.target?.tagName;
        const isFormField = ["INPUT", "TEXTAREA", "SELECT"].includes(targetTag) || e.target?.isContentEditable;
        if (isFormField || activeObject?.isEditing || isReadOnly) return;
        const isModKey = e.ctrlKey || e.metaKey;
        
        const isUndoHotkey = e.code === "KeyZ" || e.key.toLowerCase() === "z";
        const isRedoHotkey = e.code === "KeyY" || e.key.toLowerCase() === "y";

        if (isModKey && isUndoHotkey && !e.shiftKey) {
            e.preventDefault();
            undo();
        }
        if (
          (isModKey && isRedoHotkey) ||
          (isModKey && e.shiftKey && isUndoHotkey)
        ) {
            e.preventDefault();
            redo();
        }
        if (isModKey && e.key.toLowerCase() === "c") {
            e.preventDefault();
            copy();
        }
        if (isModKey && e.key.toLowerCase() === "v") {
            e.preventDefault();
            paste();
        } 
    }
    window.addEventListener("keydown", handleShortcuts);
    return () => window.removeEventListener("keydown", handleShortcuts);
  }, [canvas, isReadOnly]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
        if (!isReadOnlyRef.current && isUnsavedRef.current) {
            e.preventDefault();
            e.returnValue = '';
        }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []); 

  const handleGoHome = () => {
      if(!isReadOnly && isUnsavedRef.current && !window.confirm("У вас могут быть несохраненные изменения. Вы уверены, что хотите покинуть редактор?")) {
          return;
      }
      navigate("/");
  }

  const handleShowLayer = () => {
    showLayers ? setShowLayers(false) : setShowLayers(true);
  }

  const handleImageEditor = () => {
    !showImageMenu ? setShowImageMenu(true) : setShowImageMenu(false);
  }

  const handleShowCropTool = () => {
    showCropTool ? setShowCropTool(false) : (setShowCropTool(true), startCrop());
  }

  const toggleDrawing = () => {
        setIsDrawing(!isDrawing);
  };

  const getCanvasCenter = () => {
     if (!canvas) return { left: 0, top: 0 };
     const vpt = canvas.viewportTransform;
     const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
     const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];
     return { left: centerX, top: centerY };
  }

  const startCrop = () => {
          if (!isReadOnly && canvas) {
              const { left, top } = getCanvasCenter();
              const rect = new Rect({
                  left: left - 100, // half of 200
                  top: top - 100,
                  width: 200,
                  height: 200,
                  fill: "rgba(0,0,0,0.3)",
                  stroke: "#fff",
                  strokeWidth: 2,
                  strokeDashArray: [5, 5],
                  cornerColor: "white",
                  cornerStrokeColor: "black",
                  borderColor: "white",
                  cornerStyle: "circle",
                  transparentCorners: false,
                  name: "crop-mask",
                  excludeFromExport: true
              });
      
              canvas.add(rect);
              canvas.setActiveObject(rect);
              canvas.renderAll();
              
              setCropRect(rect);
          }
  };

  const addLine = () => {
    if (!isReadOnly && canvas) {
      const { left, top } = getCanvasCenter();
      const line = new Line([left - 75, top, left + 75, top], {
        left: left - 75,
        top: top,
        stroke: "#000000",
        strokeWidth: 5,
      });
      canvas.add(line);
      canvas.setActiveObject(line);
      canvas.renderAll();
    }
   }
  const addRectangle = () => {
    if (!isReadOnly && canvas) {
      const { left, top } = getCanvasCenter();
      const rect = new Rect({
        top: top - 30,
        left: left - 50,
        width: 100,
        height: 60,
        fill: "#D84D42"
      })

      canvas.add(rect);
      canvas.setActiveObject(rect);
      canvas.renderAll();
    }
  }
  const addTriangle = () => {
    if (!isReadOnly && canvas) {
      const { left, top } = getCanvasCenter();
      const trgl = new Triangle({
        top: top - 50,
        left: left - 50,
        width: 100,
        height: 100,
        fill: "#FFC107"
      })
      canvas.add(trgl);
      canvas.setActiveObject(trgl);
      canvas.renderAll();
    }
  }
  const addCircle = () => {
    if (!isReadOnly && canvas) {
      const { left, top } = getCanvasCenter();
      const circle = new Circle({
        top: top - 50,
        left: left - 50,
        radius: 50,
        fill:"#2F4DC6"
      })
      canvas.add(circle);
      canvas.setActiveObject(circle);
      canvas.renderAll();
    }
  }

  const addText = () => {
    if (!isReadOnly && canvas) {
      const { left, top } = getCanvasCenter();
      const textbox = new Textbox(
        "Текст",{
          top: top - 15,
          left: left - 100,
          width: 200,
          fontSize:20,
          fill: "#333",
          lockScalingFlip: true,
          editable: true,
          lockSclingX: false,
          lockScalingY: false,
          fontFamily: "'IBM Plex Sans', sans-serif",
          textAlign: "left",
        
        
      })
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      canvas.renderAll();
    }
  }
  
  const copy = () => {
    if (!isReadOnly && canvas) {
      const activeObject = canvas.getActiveObject();
      if (!activeObject) return;
      activeObject.clone().then((cloned) => {
        clipboardRef.current = cloned;
      });
    }
  }

  const paste = async () => {
    if (isReadOnly || !canvas || !clipboardRef.current) return;
    const clonedObj = await clipboardRef.current.clone();
    canvas.discardActiveObject();
    clonedObj.set({
      left: clonedObj.left + 10,
      top: clonedObj.top + 10,
      evented: true,
    });
    if (clonedObj.type === "activeSelection") {
      clonedObj.canvas = canvas;
      clonedObj.forEachObject(function(obj) {
        canvas.add(obj);
      });
      clonedObj.setCoords();
    }
    else {
      canvas.add(clonedObj);
    }
    clipboardRef.current.top += 10;
    clipboardRef.current.left += 10;
    canvas.setActiveObject(clonedObj);
    canvas.requestRenderAll();
  }


  const handleFramesUpdated = () => {
    setRefreshKey((prevKey) => prevKey + 1);
  }

  if(isNotFound) {
      return <NotFound />;
  }

  useEffect(() => {
    if (!store.isAuth && !projectId) {
      setOpen(true);
    }
  },[store.isAuth,projectId]);

  return (
    <div className="CanvasApp">
      {!projectId && !sizeChosen && (
         <CanvasSizeModal
           open={true}
           onCreateFree={handleCreateFreeCanvas}
           onCreateFromImage={handleCreateProjectFromImage}
           onClose={() => navigate("/")}
         />
      )}
      <Modal
        open={open && !store.isAuth && (projectId || sizeChosen)}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
        style={{zIndex:100000000}}
      >
      <Box sx={{ ...modalStyle, position: "relative" }}>
        <MuiIconButton
          aria-label="Закрыть"
          onClick={handleClose}
          size="small"
          sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.75)" }}
        >
          <Close />
        </MuiIconButton>
        <Typography id="demo-modal-title" variant="h6" component="h2" sx={{ color: "#fff" }}>
          🎨 Демо-режим
        </Typography>
        <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.78)" }}>
          Вы используете редактор в демо-режиме. Все изменения не будут сохранены.
        </Typography>
        <Typography sx={{ mt: 2, mb: 2, cursor: "pointer" }}>
          <Link to="/" style={{ color: "#7dd3fc" }}>Авторизируйтесь</Link>
        </Typography>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
        <Button onClick={handleClose} variant="contained" sx={{ textTransform: "none", bgcolor: "#2dd4bf", color: "#0f172a", "&:hover": { bgcolor: "#5eead4" } }}>
              Продолжить демо
        </Button>
        </div>
      </Box>
      </Modal>
    {!isReadOnly ? (
          <div className='Toolbar darkmode'>
            <Cropping canvas={canvas} onFrameUpdated={handleFramesUpdated} />
            <IconButton onClick={handleShowCropTool} variant="ghost" size="medium" active={showCropTool}><CropIcon/></IconButton>
            <Video canvas={canvas} canvasRef={canvasRef}/>
            <IconButton onClick={addRectangle} variant="ghost" size="medium"><SquareIcon/></IconButton>
            <IconButton onClick={toggleDrawing} variant="ghost" size="medium" style={{ backgroundColor: isDrawing ? "rgba(255, 255, 255, 0.2)" : "transparent" }}><Pencil1Icon/></IconButton>
            <IconButton onClick={addCircle} variant="ghost" size="medium"><CircleIcon/></IconButton>
            <IconButton onClick={addTriangle} variant="ghost" size="medium"><TriangleIcon/></IconButton>
            <IconButton onClick={addLine} variant="ghost" size="medium"><SlashIcon/></IconButton>
            <IconButton onClick={groupSelectedObjects} variant="ghost" size="medium"><UnionIcon/></IconButton>
            <IconButton onClick={ungroupSelectedObjects} variant="ghost" size="medium"><IntersectIcon/></IconButton>
            <IconButton onClick={addText} variant="ghost" size="medium"><TextIcon/></IconButton>
            <IconButton onClick={() => setShowFilterMenu(!showFilterMenu)} variant="ghost" size="medium" active={showFilterMenu}><Tune sx={{color:'white'}}/></IconButton>
            <IconButton onClick={handleImageEditor} variant="ghost" size="medium" active={showImageMenu}><ImageIcon/></IconButton>
            <IconButton onClick={handleShowLayer} variant="ghost" size="medium" active={showLayers}><LayersIcon/></IconButton>
          </div>
      ) : null}
      <div className="TopNavBar darkmode">
        <button
          type="button"
          onClick={handleGoHome}
          style={{ border: "none", background: "transparent", padding: 0, cursor: "pointer", display: "flex", alignItems: "center" }}
          aria-label="Вернуться в меню"
        >
          <img src="/Images/logo.png" alt="logo" width={50}/>
        </button>
        <FileExport canvas={canvas} isReadOnly={isReadOnly} isUnsavedRef={isUnsavedRef} />
        <ZoomControl canvas={canvas} zoom={zoom} setZoom={setZoom} />
        {isReadOnly && (<div style={{ display: "flex", gap: 5, marginLeft: 10, alignItems: "center" }}>
              <Tooltip title="Сбросить масштаб (вписать в экран)">
                  <MuiIconButton
                    onClick={handleResetZoom}
                    size="small"
                    sx={{ color: "rgba(255,255,255,0.85)" }}
                    aria-label="Сбросить масштаб"
                  >
                    <CenterFocusStrong />
                  </MuiIconButton>
                </Tooltip>
        </div>)}
         {!isReadOnly && (
            <div style={{ display: "flex", gap: 5, marginLeft: 10, alignItems: "center" }}>
                <Tooltip title="Сбросить масштаб (вписать в экран)">
                  <MuiIconButton
                    onClick={handleResetZoom}
                    size="small"
                    sx={{ color: "rgba(255,255,255,0.85)" }}
                    aria-label="Сбросить масштаб"
                  >
                    <CenterFocusStrong />
                  </MuiIconButton>
                </Tooltip>
                <Tooltip title="Удалить выделенное">
                  <MuiIconButton
                    onClick={handleDeleteSelected}
                    size="small"
                    sx={{ color: "rgba(255,255,255,0.85)" }}
                    aria-label="Удалить выделенный объект"
                  >
                    <DeleteOutline />
                  </MuiIconButton>
                </Tooltip>
                <IconButton onClick={undo} disabled={historyIndex <= 0} variant="ghost" size="small"><Undo /></IconButton>
                <IconButton onClick={redo} disabled={historyIndex >= historyRef.current.length - 1} variant="ghost" size="small"><Redo /></IconButton>
                {!showCanvasSettings && (
                  <Tooltip title="Размер холста">
                    <MuiIconButton
                      onClick={() => setShowCanvasSettings(true)}
                      size="small"
                      sx={{ color: "rgba(255,255,255,0.85)" }}
                      aria-label="Показать настройки размера холста"
                    >
                      <AspectRatio />
                    </MuiIconButton>
                  </Tooltip>
                )}
                {!showStylePanel && (
                  <Tooltip title="Палитра стилей">
                    <MuiIconButton
                      onClick={() => setShowStylePanel(true)}
                      size="small"
                      sx={{ color: "rgba(255,255,255,0.85)" }}
                      aria-label="Показать палитру стилей"
                    >
                      <Palette />
                    </MuiIconButton>
                  </Tooltip>
                )}
                {!showObjectSettings && (
                  <Tooltip title="Свойства объекта">
                    <MuiIconButton
                      onClick={() => setShowObjectSettings(true)}
                      size="small"
                      sx={{ color: "rgba(255,255,255,0.85)" }}
                      aria-label="Показать свойства объекта"
                    >
                      <SettingsOutlined />
                    </MuiIconButton>
                  </Tooltip>
                )}
                {!showLayers && (
                  <Tooltip title="Слои">
                    <MuiIconButton
                      onClick={() => setShowLayers(true)}
                      size="small"
                      sx={{ color: "rgba(255,255,255,0.85)" }}
                      aria-label="Показать панель слоёв"
                    >
                      <LayersOutlinedIcon />
                    </MuiIconButton>
                  </Tooltip>
                )}
            </div>
        )}
        <div>
        </div>
      </div>
      {!isReadOnly && <FabricAssist canvas={canvas}/>}
      
      <div className="workspace-container" ref={workspaceRef}>
        <div className="canvas-artboard-mount">
          <canvas id="canvas" ref={canvasRef} />
        </div>
      </div>

      {!isReadOnly && (
          <div className="SettingsGroup">
            {showObjectSettings && (
              <Settings canvas={canvas} onClose={() => setShowObjectSettings(false)} />
            )}
            <CropTool
              canvas={canvas}
              showCropTool={showCropTool}
              cropRect={cropRect}
              setCropRect={setCropRect}
              setShowCropTool={setShowCropTool}
              onCanvasChanged={commitCanvasChange}
            />
            <PensilTool canvas={canvas} isDrawing={isDrawing} setIsDrawing={setIsDrawing} />
            <ImageTool canvas={canvas} showImageMenu={showImageMenu} setShowImageMenu={setShowImageMenu} />
            <PhotoFilterTool canvas={canvas} showFilterMenu={showFilterMenu} setShowFilterMenu={setShowFilterMenu} />
            {showCanvasSettings && (
            <CanvasSettings
              canvas={canvas}
              onCanvasResized={handleCanvasResized}
              currentWidth={canvasWidth}
              currentHeight={canvasHeight}
              maxCanvasWidth={maxCanvasWidth}
              maxCanvasHeight={maxCanvasHeight}
              onClose={() => setShowCanvasSettings(false)}
            />
            )}
            <CroppingSettings canvas={canvas} refreshKey={refreshKey} />
            <LayersList canvas={canvas} showLayers={showLayers} onClose={() => setShowLayers(false)} />
            {showStylePanel && (
              <StyleEditor canvas={canvas} onClose={() => setShowStylePanel(false)} />
            )}
          </div>
      )}
    </div>
  )
}

export default observer(CanvasApp);