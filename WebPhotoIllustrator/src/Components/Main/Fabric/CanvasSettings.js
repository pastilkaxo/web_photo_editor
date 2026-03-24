import React, { useEffect, useState } from "react"

import CloseIcon from "@mui/icons-material/Close"
import { Box, IconButton, TextField, Typography } from "@mui/material"

import { FABRIC_MENU } from "./styles"
import { refreshSnapGuideLines } from "./snappingHelpers"

function CanvasSettings({
  canvas,
  onCanvasResized,
  currentWidth,
  currentHeight,
  maxCanvasWidth,
  maxCanvasHeight,
  onClose,
}) {
    const [canvasHeight, setCanvasHeight] = useState(0);
    const [canvasWidth, setCanvasWidth] = useState(0);
    const [isReady, setIsReady] = useState(false);
    const [isSyncingFromExternal, setIsSyncingFromExternal] = useState(false);

    useEffect(() => {
        if (!canvas) return;
        setIsSyncingFromExternal(true);
        setCanvasWidth(Math.round(canvas.getWidth() || 0));
        setCanvasHeight(Math.round(canvas.getHeight() || 0));
        setIsReady(true);
    }, [canvas]);

    useEffect(() => {
        if (!currentWidth || !currentHeight) return;
        setIsSyncingFromExternal(true);
        setCanvasWidth(currentWidth);
        setCanvasHeight(currentHeight);
        setIsReady(true);
    }, [currentWidth, currentHeight]);

    useEffect(() => {
        if (!canvas || !canvasWidth || !canvasHeight || !isReady) return;
        if (isSyncingFromExternal) {
            setIsSyncingFromExternal(false);
            return;
        }
        const hasChanged = canvas.getWidth() !== canvasWidth || canvas.getHeight() !== canvasHeight;
        if (!hasChanged) return;

        canvas.setDimensions({ width: canvasWidth, height: canvasHeight });
        refreshSnapGuideLines(canvas);
        canvas.requestRenderAll();
        if (onCanvasResized) {
            onCanvasResized(canvasWidth, canvasHeight);
        }
    }, [canvasHeight, canvasWidth, canvas, onCanvasResized, isReady, isSyncingFromExternal]);

    const maxW = maxCanvasWidth || 6000;
    const maxH = maxCanvasHeight || 6000;

    const handleWidthChange = (e) => {
        const value = e.target.value.replace(/,/g, "");
        const intValue = parseInt(value, 10);
        if (!Number.isNaN(intValue) && intValue >= 1) {
            setCanvasWidth(Math.min(intValue, maxW));
        }
    }

    const handleHeightChange = (e) => {
        const value = e.target.value.replace(/,/g, "");
        const intValue = parseInt(value, 10);
        if (!Number.isNaN(intValue) && intValue >= 1) {
            setCanvasHeight(Math.min(intValue, maxH));
        }
    }

    const fieldSx = {
        "& .MuiOutlinedInput-root": {
            bgcolor: FABRIC_MENU.fieldBg,
            fontSize: 14,
            color: "#eee",
        },
        "& .MuiOutlinedInput-notchedOutline": {
            borderColor: FABRIC_MENU.borderStrong,
        },
        "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.35)",
        },
        "& .MuiInputBase-input": {
            py: 0.75,
        },
    };

    return (
        <Box
            className="CanvasSettings darkmode settings-panel-dark"
            sx={{
                position: "relative",
                gap: 1.5,
                display: "flex",
                flexDirection: "column",
            }}
        >
            <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                <Typography
                    component="h3"
                    className="settings-panel-dark__title"
                    sx={{ fontWeight: 600, fontSize: 16, color: "#fff", lineHeight: 1.2, m: 0 }}
                >
                    Холст
                </Typography>
                {onClose && (
                    <IconButton
                        size="small"
                        aria-label="Скрыть панель размера холста"
                        onClick={onClose}
                        sx={{ mt: -0.5, mr: -0.5, color: "rgba(255,255,255,0.75)" }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
                <Typography component="span" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500, minWidth: 14 }}>
                    W
                </Typography>
                <TextField
                    size="small"
                    variant="outlined"
                    value={canvasWidth || ""}
                    onChange={handleWidthChange}
                    inputProps={{ inputMode: "numeric" }}
                    sx={{ ...fieldSx, flex: "1 1 100px", minWidth: 72 }}
                />
                <Typography component="span" sx={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 500, minWidth: 14, ml: 0.5 }}>
                    H
                </Typography>
                <TextField
                    size="small"
                    variant="outlined"
                    value={canvasHeight || ""}
                    onChange={handleHeightChange}
                    inputProps={{ inputMode: "numeric" }}
                    sx={{ ...fieldSx, flex: "1 1 100px", minWidth: 72 }}
                />
            </Box>

            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", display: "block", mt: -0.5 }}>
                Максимум: {maxW} × {maxH} px (по рабочей области)
            </Typography>
        </Box>
  )
}

export default CanvasSettings
