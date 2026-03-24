import React,{useEffect,useState} from "react"

import CloseIcon from "@mui/icons-material/Close";
import { IconButton as MuiIconButton } from "@mui/material";
import { IconButton } from "blocksin-system";
import { Canvas } from "fabric";
import { ArrowUpIcon, ArrowDownIcon,EyeClosedIcon,EyeOpenIcon,    LockClosedIcon, 
    LockOpen2Icon, Pencil1Icon, CheckIcon } from "sebikostudio-icons"

import { FABRIC_MENU } from "./styles";

const addIdToObject = (object) => {
    if (!object.id) {
        const timestamp = new Date().getTime();
        object.id = `${object.type}_${timestamp}`;
    }
}

Canvas.prototype.updateZIndices = function () {
    const objects = this.getObjects();
    objects.forEach((object,index) => {
        addIdToObject(object);
        object.zIndex = index;
    });
}

function LayersList({ canvas, showLayers, onClose }) {
    const [layers, setLayers] = useState([]);
    const [selectedLayer, setSelectedLayer] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState("");

    const isUserLayerObject = (obj) => obj.id && !(
        obj.id.startsWith("vertical-") || obj.id.startsWith("horizontal-") || obj.excludeFromExport
    );

    const moveObjectStep = (direction, object) => {
        if (!canvas || !object) return false;

        if (direction === "up") {
            if (typeof canvas.bringObjectForward === "function") {
                canvas.bringObjectForward(object);
                return true;
            }
            if (typeof canvas.bringForward === "function") {
                canvas.bringForward(object);
                return true;
            }
        }

        if (direction === "down") {
            if (typeof canvas.sendObjectBackwards === "function") {
                canvas.sendObjectBackwards(object);
                return true;
            }
            if (typeof canvas.sendBackwards === "function") {
                canvas.sendBackwards(object);
                return true;
            }
        }

        return false;
    };


    const hideSelectedLayer = () => {
        if (!selectedLayer) return;

        const object = canvas.getObjects().find((obj) => obj.id === selectedLayer.id);
        if (!object) return;

        if (object.opacity === 0) {
            object.opacity = object.prevOpacity || 1;
            object.prevOpacity = undefined;
        }
        else {
            object.prevOpacity = object.opacity || 1;
            object.opacity = 0;
        }
        canvas.renderAll();
        canvas.fire('object:modified', { target: object });
        updateLayers();
        setSelectedLayer({ ...selectedLayer, opacity: object.opacity });
    }

    const lockSelectedLayer = () => { 
        if (!selectedLayer) return;
        const object = canvas.getObjects().find((obj) => obj.id === selectedLayer.id);
        if (!object) return;
        const shouldLock = object.selectable;
        object.set({
            selectable: !shouldLock,
            evented: !shouldLock,
            lockMovementX: shouldLock,
            lockMovementY: shouldLock,
            lockRotation: shouldLock,
            lockScalingX: shouldLock,
            lockScalingY: shouldLock
        })
        if(shouldLock){
           canvas.discardActiveObject();
        }
        else {
            setSelectedLayer({ ...selectedLayer, locked: false });
        }
        canvas.renderAll();
        canvas.fire('object:modified', { target: object });
        updateLayers();
    }

    const moveSelectedLayer = (direction) => {
        if (!selectedLayer) return;
        const object = canvas.getObjects().find((obj) => obj.id === selectedLayer.id);
        if (!object || !isUserLayerObject(object)) return;

        const visibleLayers = canvas.getObjects().filter(isUserLayerObject);
        const visibleIndex = visibleLayers.findIndex((layer) => layer.id === object.id);
        if (visibleIndex === -1) return;

        const targetVisibleLayer = direction === "up"
            ? visibleLayers[visibleIndex + 1]
            : visibleLayers[visibleIndex - 1];

        if (!targetVisibleLayer) return;

        let moved = false;
        let allObjects = canvas.getObjects();
        const targetIndex = allObjects.indexOf(targetVisibleLayer);
        if (targetIndex === -1) return;

        if (direction === "up") {
            while (allObjects.indexOf(object) < targetIndex) {
                const stepDone = moveObjectStep("up", object);
                if (!stepDone) break;
                moved = true;
                allObjects = canvas.getObjects();
            }
        } else if (direction === "down") {
            while (allObjects.indexOf(object) > targetIndex) {
                const stepDone = moveObjectStep("down", object);
                if (!stepDone) break;
                moved = true;
                allObjects = canvas.getObjects();
            }
        }

        if (moved) {
            canvas.renderAll();
            canvas.fire('object:modified', { target: object });
            // updateLayers will be called automatically via event listener
        }
    }

    const updateLayers = () => {
        if (canvas) {
            canvas.updateZIndices();
            const objects = canvas
                .getObjects()
                .filter(isUserLayerObject).map((obj) => ({
                    id: obj.id,
                    zIndex: obj.zIndex,
                    type: obj.type,
                    opacity: obj.opacity,
                    locked: !obj.selectable,
                    name: obj.name || `${obj.type} ${obj.zIndex}`
                }));
            setLayers([...objects].reverse());
        }
    }

    const startEditing = () => {
        if (!selectedLayer) return;
        const layer = layers.find(l => l.id === selectedLayer.id);
        setNewName(layer?.name || "");
        setIsEditing(true);
    };

    const saveName = () => {
        if (!selectedLayer) return;
        const object = canvas.getObjects().find((obj) => obj.id === selectedLayer.id);
        if (object) {
            object.set("name", newName);
            canvas.fire('object:modified', { target: object });
        }
        setIsEditing(false);
    };

    const handleObjectSelected = (e) => {
        const selectedObject = e.selected ? e.selected[0] : null;
        if (selectedObject) {
            setSelectedLayer({id:selectedObject.id, opacity:selectedObject.opacity, locked: !selectedObject.selectable});
        }
        else {
            setSelectedLayer(null);
            setIsEditing(false);
        }
    }

    const selectLayerInCanvas = (layerId) => {
        const object = canvas.getObjects().find((obj) => obj.id === layerId);
        if (object) {
            canvas.setActiveObject(object);
            canvas.renderAll();

            setSelectedLayer({
                id: object.id, 
                opacity: object.opacity,
                locked: !object.selectable
            });
        }
    }

    useEffect(() => {
        if (canvas) {
            canvas.on("object:added", updateLayers);
            canvas.on("object:removed", updateLayers);
            canvas.on("object:modified", updateLayers);

            canvas.on("selection:created", handleObjectSelected);
            canvas.on("selection:updated", handleObjectSelected);
            canvas.on("selection:cleared", ()=> {
                 setSelectedLayer(null);
                 setIsEditing(false);
            });

            updateLayers();
            return () => {
                canvas.off("object:added", updateLayers);
                canvas.off("object:removed", updateLayers);
                canvas.off("object:modified", updateLayers);
                canvas.off("selection:created", handleObjectSelected);
                canvas.off("selection:updated", handleObjectSelected);
                canvas.off("selection:cleared", ()=> {
                    setSelectedLayer(null);
                    setIsEditing(false);
                });
            }
        }
    },[canvas])

  return (
      <div
          className="layersList settings-panel-dark"
          style={showLayers ? { display: "flex", flexDirection: "column" } : { display: "none" }}
      >
          <div className="settings-panel-dark__header">
              <h3 className="settings-panel-dark__title">Слои</h3>
              {onClose && (
                <MuiIconButton size="small" aria-label="Скрыть панель слоёв" onClick={onClose} sx={{ color: "rgba(255,255,255,0.75)" }}>
                  <CloseIcon fontSize="small" />
                </MuiIconButton>
              )}
          </div>
          <div style={{display:"flex", gap:"4px", marginBottom:8}}>
              <IconButton size='small' onClick={() => moveSelectedLayer("up")} disabled={!selectedLayer || layers[0]?.id === selectedLayer.id}> 
                  <ArrowUpIcon/>
              </IconButton>
              <IconButton size='small' onClick={() => moveSelectedLayer("down")} disabled={!selectedLayer || layers[layers.length - 1]?.id === selectedLayer.id}> 
                  <ArrowDownIcon/>
              </IconButton> 
              <IconButton size="small" onClick={hideSelectedLayer} disabled={!selectedLayer}>
                  {selectedLayer?.opacity === 0 ? <EyeClosedIcon/> : <EyeOpenIcon/>}
              </IconButton>
              <IconButton size="small" onClick={lockSelectedLayer} disabled={!selectedLayer}>
                  {selectedLayer?.locked ? <LockClosedIcon/> : <LockOpen2Icon/>}
              </IconButton>
              <IconButton size="small" onClick={startEditing} disabled={!selectedLayer}>
                  <Pencil1Icon/>
              </IconButton>
          </div>

        {isEditing && (
            <div style={{display:"flex", gap:"6px", marginBottom:8, alignItems:"center"}}>
                <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") saveName(); }}
                    style={{
                        flex: 1,
                        background: FABRIC_MENU.surfaceInput,
                        border: `1px solid ${FABRIC_MENU.border}`,
                        borderRadius: 6,
                        color: FABRIC_MENU.text,
                        fontSize: 13,
                        padding: "6px 8px",
                        outline: "none",
                        minWidth: 0,
                    }}
                />
                <IconButton size="small" onClick={saveName} variant="ghost" style={{color:"#4caf50", flexShrink:0}}><CheckIcon/></IconButton>
            </div>
        )}

          <ul>
              {layers.length === 0 ? (<p style={{ color: "rgba(255,255,255,0.5)", textAlign: "center", margin: "8px 0" }}>Нет объектов</p>) : null}
              {layers.map((layer) => (
                <li key={layer.id} onClick={()=> selectLayerInCanvas(layer.id)} className={selectedLayer && layer.id === selectedLayer.id ? "selected-layer" : ""}>
                     {layer.name}  <span style={{marginRight: 5}}>{layer.locked && "🔒"}</span>
                </li>
            ))}    
        </ul>      
    </div>
  )
}

export default LayersList