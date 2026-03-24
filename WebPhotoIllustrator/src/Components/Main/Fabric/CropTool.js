import React from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { CheckIcon, Cross1Icon } from "sebikostudio-icons";

import { FABRIC_MENU } from "./styles";
import { refreshSnapGuideLines } from "./snappingHelpers";

const font = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';

function CropTool({ canvas, showCropTool, cropRect, setCropRect, setShowCropTool, onCanvasChanged }) {
    const applyCrop = () => {
        if (!canvas || !cropRect) return;

        const width = cropRect.getScaledWidth();
        const height = cropRect.getScaledHeight();
        const left = cropRect.left;
        const top = cropRect.top;

        canvas.remove(cropRect);

        canvas.getObjects().forEach((obj) => {
            obj.set({
                left: obj.left - left,
                top: obj.top - top,
            });
            obj.setCoords();
        });

        canvas.setDimensions({ width: width, height: height });
        refreshSnapGuideLines(canvas);

        setCropRect(null);
        setShowCropTool(false);
        canvas.renderAll();
        if (typeof onCanvasChanged === "function") {
            onCanvasChanged();
        }
    };

    const cancelCrop = () => {
        if (!canvas) return;
        if (cropRect) {
            canvas.remove(cropRect);
            canvas.renderAll();
            setCropRect(null);
        }
        setShowCropTool(false);
    };

    if (!showCropTool) {
        return null;
    }

    return (
        <Box className="settings-panel-dark" sx={{ fontFamily: font }}>
            <Box className="settings-panel-dark__header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography component="h3" className="settings-panel-dark__title" sx={{ m: 0 }}>
                    Обрезка
                </Typography>
                <IconButton size="small" aria-label="Закрыть обрезку" onClick={cancelCrop} sx={{ color: "rgba(255,255,255,0.75)" }}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                <Button
                    onClick={applyCrop}
                    size="small"
                    fullWidth
                    disabled={!cropRect}
                    variant="contained"
                    sx={{
                        fontFamily: font,
                        textTransform: "none",
                        bgcolor: FABRIC_MENU.primary,
                        color: FABRIC_MENU.primaryText,
                        "&:hover": { bgcolor: FABRIC_MENU.primaryHover },
                    }}
                >
                    <CheckIcon /> Применить
                </Button>
                <Button
                    onClick={cancelCrop}
                    size="small"
                    fullWidth
                    variant="outlined"
                    sx={{
                        fontFamily: font,
                        textTransform: "none",
                        borderColor: "rgba(255,255,255,0.35)",
                        color: "rgba(255,255,255,0.9)",
                        "&:hover": { borderColor: "rgba(255,255,255,0.5)", bgcolor: FABRIC_MENU.rowHover },
                    }}
                >
                    <Cross1Icon /> Отмена
                </Button>
            </Stack>
        </Box>
    );
}

export default CropTool;
