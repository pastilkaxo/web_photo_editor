import React, { useState, useRef, useEffect } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import { FABRIC_MENU } from "./styles";

const font = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';

function StyleEditor({ canvas, onClose }) {
    const [colors, setColors] = useState([]);
    const [newColor, setNewColor] = useState("#ffffff");
    const colorInputRef = useRef(null);

    useEffect(() => {
        const savedStyles = JSON.parse(localStorage.getItem("canvasStyles")) || [];
        setColors(savedStyles);
    }, []);

    const addColor = () => {
        if (colors.length > 5) return;
        const id = `color${Date.now()}`;
        const updatedColors = [...colors, { id, color: newColor }];
        setColors(updatedColors);
    };

    const openColorPicker = () => {
        colorInputRef.current.click();
    };

    const saveColors = () => {
        localStorage.setItem("canvasStyles", JSON.stringify(colors));
        canvas?.getObjects().forEach((object) => {
            const objectStyleID = object.get("styleID");
            const colorToUpdate = colors.find((color) => color.id === objectStyleID);
            if (colorToUpdate && object.get("fill") !== colorToUpdate.color) {
                object.set("fill", colorToUpdate.color);
                canvas.fire("object:modified", { target: object });
            }
        });
        canvas.renderAll();
    };

    const applyStyle = (color, id) => {
        const activeObject = canvas?.getActiveObject();
        if (activeObject) {
            activeObject.set("fill", color);
            activeObject.set("styleID", id);
            canvas.fire("object:modified", { target: activeObject });
            canvas.renderAll();
        }
    };

    const updateColor = (id, next) => {
        const updatedColors = colors.map((item) =>
            item.id === id ? { ...item, color: next } : item
        );
        setColors(updatedColors);
    };

    const openColorPickerById = (id) => {
        document.getElementById(`color-${id}`)?.click();
    };

    const btnOutlined = {
        fontFamily: font,
        textTransform: "none",
        borderColor: "rgba(255,255,255,0.35)",
        color: "#fff",
        "&:hover": {
            borderColor: "rgba(255,255,255,0.55)",
            bgcolor: FABRIC_MENU.rowHover,
        },
    };

    return (
        <Box
            className="StyleEditor settings-panel-dark"
            sx={{ fontFamily: font }}
        >
            <Box className="settings-panel-dark__header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Typography component="h3" className="settings-panel-dark__title" sx={{ m: 0 }}>
                    Палитра стилей
                </Typography>
                {onClose && (
                    <IconButton size="small" aria-label="Скрыть палитру" onClick={onClose} sx={{ color: "rgba(255,255,255,0.75)" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
            <input
                ref={colorInputRef}
                type="color"
                value={newColor}
                onChange={(e) => setNewColor(e.target.value)}
                style={{ pointerEvents: "none", width: 0, height: 0, opacity: 0 }}
            />
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" useFlexGap>
                <Box
                    className="colorBox"
                    onClick={openColorPicker}
                    role="presentation"
                    sx={{ bgcolor: newColor, flexShrink: 0 }}
                />
                <Button size="small" variant="outlined" onClick={addColor} sx={btnOutlined}>
                    Добавить цвет
                </Button>
            </Stack>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
            <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                {colors.map(({ id, color }) => (
                    <Box
                        key={id}
                        className="colorBox"
                        onClick={() => applyStyle(color, id)}
                        role="presentation"
                        sx={{
                            bgcolor: color,
                            fontSize: 10,
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            cursor: "pointer",
                        }}
                    >
                        +
                    </Box>
                ))}
            </Stack>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: "rgba(255,255,255,0.92)", fontFamily: font }}>
                Редактирование
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: "auto" }}>
                <Stack spacing={1.25}>
                    {colors.map(({ id, color }) => (
                        <Stack key={id} direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                            <input
                                id={`color-${id}`}
                                style={{ pointerEvents: "none", opacity: 0, width: 0, height: 0 }}
                                type="color"
                                value={color}
                                onChange={(e) => updateColor(id, e.target.value)}
                            />
                            <Box
                                className="colorBox"
                                sx={{ bgcolor: color, cursor: "pointer", flexShrink: 0 }}
                                onClick={() => openColorPickerById(id)}
                                role="presentation"
                            />
                            <Box
                                component="input"
                                type="text"
                                value={color}
                                onChange={(e) => updateColor(id, e.target.value)}
                                sx={{
                                    fontFamily: font,
                                    background: FABRIC_MENU.surfaceInput,
                                    border: `1px solid ${FABRIC_MENU.border}`,
                                    borderRadius: 1,
                                    color: FABRIC_MENU.text,
                                    padding: "6px 10px",
                                    fontSize: 13,
                                    width: 100,
                                    outline: "none",
                                }}
                            />
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.65)", fontFamily: font, flex: 1, minWidth: 0 }}>
                                {id}
                            </Typography>
                        </Stack>
                    ))}
                </Stack>
            </Box>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
            <Button
                size="medium"
                fullWidth
                onClick={saveColors}
                sx={{
                    fontFamily: font,
                    textTransform: "none",
                    fontWeight: 600,
                    bgcolor: FABRIC_MENU.primary,
                    color: FABRIC_MENU.primaryText,
                    "&:hover": { bgcolor: FABRIC_MENU.primaryHover },
                }}
            >
                Сохранить палитру
            </Button>
        </Box>
    );
}

export default StyleEditor;
