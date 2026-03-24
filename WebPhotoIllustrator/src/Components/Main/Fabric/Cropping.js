import React from "react"

import { IconButton } from "blocksin-system"
import { Rect } from "fabric"
import { FrameIcon } from "sebikostudio-icons"


function Cropping({canvas,onFrameUpdated}) {
    const addFrameToCanvas = () => {
        const frameName = `Рамка ${canvas.getObjects("rect").length + 1}`;
        
        const frame = new Rect({
            left: 100,
            top: 100,
            width: 200,
            height: 200,
            fill: "transparent",
            stroke: "#07FE3d",
            strokeWidth: 1,
            selectable: true,
            evented: true,
            name: frameName
        });
        canvas.add(frame);
        canvas.renderAll();

        const maintainStrokeWidth = (object) => {
            const scaleX = object.scaleX || 1;
            const scaleY = object.scaleY || 1;

            object.set({
                width: object.width * scaleX,
                height: object.height * scaleY,
                scaleY: 1,
                scaleX: 1,
                strokeWidth: 1,
            })
            object.setCoords();
        }

        frame.on("scaling", () => {
            maintainStrokeWidth(frame);
            canvas.renderAll();
        })

        frame.on("modified", () => {
            maintainStrokeWidth(frame);
            canvas.renderAll();
        })

        if (onFrameUpdated && typeof onFrameUpdated === "function") {
            onFrameUpdated();
        }
    }


    return (
        <div className='FrameComponent'>
            <IconButton variant="ghost" onClick={addFrameToCanvas}>
                <FrameIcon/>
            </IconButton>
      </div>
  )
}

export default Cropping