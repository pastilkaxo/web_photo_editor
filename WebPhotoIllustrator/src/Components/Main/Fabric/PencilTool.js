import React, { useState, useEffect } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { Box, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";
import { PencilBrush } from "fabric";

import { FABRIC_MENU } from "./styles";

const font = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';

function PencilTool({ canvas, isDrawing, setIsDrawing }) {
    const [color, setColor] = useState("#000000");
    const [width, setWidth] = useState(5);

    useEffect(() => {
        if (!canvas) return;

        canvas.isDrawingMode = isDrawing;

        if (isDrawing) {
            const brush = new PencilBrush(canvas);
            brush.color = color;
            brush.width = parseInt(width, 10);
            canvas.freeDrawingBrush = brush;
        }

        return () => {
            if (canvas) {
                canvas.isDrawingMode = false;
            }
        };
    }, [isDrawing, canvas]);

    useEffect(() => {
        if (canvas && canvas.freeDrawingBrush && isDrawing) {
            canvas.freeDrawingBrush.color = color;
            canvas.freeDrawingBrush.width = parseInt(width, 10);
        }
    }, [color, width, canvas, isDrawing]);

    if (!isDrawing) {
        return null;
    }

    return (
        <Box className="settings-panel-dark" sx={{ fontFamily: font }}>
            <Box className="settings-panel-dark__header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <Typography component="h3" className="settings-panel-dark__title" sx={{ m: 0 }}>
                    Кисть
                </Typography>
                {setIsDrawing && (
                    <IconButton size="small" aria-label="Выключить кисть" onClick={() => setIsDrawing(false)} sx={{ color: "rgba(255,255,255,0.75)" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
            <Stack spacing={1.5}>
                <Box>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", display: "block", mb: 0.5 }}>
                        Цвет кисти
                    </Typography>
                    <input
                        type="color"
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        style={{ width: "100%", height: 36, cursor: "pointer", borderRadius: 6, border: "1px solid rgba(255,255,255,0.2)" }}
                    />
                </Box>
                <TextField
                    label="Толщина кисти"
                    type="number"
                    size="small"
                    inputProps={{ min: 1, max: 100 }}
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    fullWidth
                    sx={{
                        fontFamily: font,
                        "& .MuiOutlinedInput-root": { color: "#eee", bgcolor: FABRIC_MENU.fieldBg },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: FABRIC_MENU.borderStrong },
                        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)" },
                    }}
                />
            </Stack>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)", mt: 1 }} />
        </Box>
    );
}

export default PencilTool;
