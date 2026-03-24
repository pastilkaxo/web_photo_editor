import React from "react"

import { Flex, Button, Input } from "blocksin-system";
import { PlusIcon, MinusIcon,MagnifyingGlassIcon,ZoomInIcon,ZoomOutIcon } from "sebikostudio-icons";
import { zoomCanvasAtArtboardCenter } from "./canvasViewportUtils";

function ZoomControl({ canvas, zoom, setZoom }) {

    const handleZoom = (factor) => {
        if (!canvas) return;
        let newZoom = zoom + factor;
        if (newZoom < 10) newZoom = 10;
        if (newZoom > 500) newZoom = 500;
        zoomCanvasAtArtboardCenter(canvas, newZoom);
        setZoom(newZoom);
    };

    const handleInput = (e) => {
        const val = parseInt(e.target.value, 10);
        if (!isNaN(val)) {
            handleZoom(val - zoom);
        }
    };


  return (
   <Flex gap={50} align="center" className="ZoomControl darkmode" style={{ padding: "0 10px" }}>
            <Button size="small" variant="ghost" onClick={() => handleZoom(-10)}>
                <ZoomOutIcon />
            </Button>
          <Input 
                label="Масштаб"
                value={`${Math.round(zoom)}%`} 
                onChange={handleInput} 
                style={{ width: "76px", textAlign: "center" }} 
            />
            <Button size="small" variant="ghost" onClick={() => handleZoom(10)}>
                <ZoomInIcon />
            </Button>
        </Flex>
  )
}

export default ZoomControl