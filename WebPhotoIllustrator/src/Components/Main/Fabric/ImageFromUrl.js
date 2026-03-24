import React, { useState, useRef } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { FabricImage } from "fabric";

import { FABRIC_MENU } from "./styles";

const font = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';

function ImageTool({ canvas, showImageMenu, setShowImageMenu }) {
    const [imageUrl, setImageUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [uploadMessage, setUploadMessage] = useState("");
    const fileInputRef = useRef(null);

    const getCanvasCenter = () => {
        if (!canvas) return { left: 0, top: 0 };
        return { left: canvas.getWidth() / 2, top: canvas.getHeight() / 2 };
    };

    const addImageToCanvas = (img) => {
        if (!canvas) return;

        if (canvas.width && canvas.height) {
            const scale = Math.min(
                (canvas.width - 50) / img.width,
                (canvas.height - 50) / img.height,
                1
            );
            img.scale(scale < 1 ? scale : 0.5);
        }

        const { left, top } = getCanvasCenter();
        img.set({
            left: left - img.getScaledWidth() / 2,
            top: top - img.getScaledHeight() / 2,
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();

        setUploadMessage("Загружено");
        setTimeout(() => {
            setUploadMessage("");
        }, 3000);
        setLoading(false);
    };

    const addImageFromUrl = async () => {
        if (!canvas || !imageUrl) return;

        setLoading(true);
        setUploadMessage("Загрузка…");

        const currentUrl = imageUrl;
        setImageUrl("");

        try {
            const img = await FabricImage.fromURL(currentUrl, {
                crossOrigin: "anonymous",
            });

            addImageToCanvas(img);
        } catch (error) {
            console.error("Failed to load image from URL:", error);
            setUploadMessage("Не удалось загрузить");
            setLoading(false);
        }
    };

    const handleLocalFileSelect = () => {
        fileInputRef.current.click();
    };

    const addImageFromFile = async (event) => {
        if (!canvas) return;

        const file = event.target.files[0];
        if (file && file.type.startsWith("image/")) {
            const reader = new FileReader();

            reader.onload = async (f) => {
                const data = f.target.result;
                setLoading(true);
                setUploadMessage("Чтение файла…");

                try {
                    const img = await FabricImage.fromURL(data);
                    img.set({ src: data });
                    addImageToCanvas(img);
                    event.target.value = null;
                } catch (error) {
                    console.error("Failed to load local file:", error);
                    setUploadMessage("Не удалось загрузить");
                    setLoading(false);
                }
            };

            reader.readAsDataURL(file);
        }
    };

    if (!showImageMenu) {
        return null;
    }

    const fieldSx = {
        fontFamily: font,
        "& .MuiOutlinedInput-root": {
            color: "#eee",
            bgcolor: FABRIC_MENU.fieldBg,
        },
        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.2)" },
        "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.65)" },
    };

    return (
        <Box className="ImageTool settings-panel-dark" sx={{ fontFamily: font, width: "100%" }}>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={addImageFromFile}
            />
            <Box className="settings-panel-dark__header" sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <Typography component="h3" className="settings-panel-dark__title" sx={{ m: 0 }}>
                    Изображение
                </Typography>
                {setShowImageMenu && (
                    <IconButton size="small" aria-label="Закрыть" onClick={() => setShowImageMenu(false)} sx={{ color: "rgba(255,255,255,0.75)" }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                )}
            </Box>
            <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />
            <Stack spacing={1.5}>
                <Button
                    onClick={handleLocalFileSelect}
                    disabled={loading}
                    fullWidth
                    variant="outlined"
                    sx={{
                        fontFamily: font,
                        textTransform: "none",
                        borderColor: "rgba(255,255,255,0.35)",
                        color: "#fff",
                        "&:hover": { borderColor: "rgba(255,255,255,0.55)", bgcolor: "rgba(255,255,255,0.06)" },
                    }}
                >
                    С компьютера
                </Button>
                <TextField
                    fullWidth
                    size="small"
                    label="Ссылка на изображение"
                    placeholder="Вставьте URL"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    sx={fieldSx}
                />
                <Button
                    onClick={addImageFromUrl}
                    disabled={!imageUrl || loading}
                    fullWidth
                    variant="contained"
                    sx={{
                        fontFamily: font,
                        textTransform: "none",
                        bgcolor: FABRIC_MENU.primary,
                        color: FABRIC_MENU.primaryText,
                        "&:hover": { bgcolor: FABRIC_MENU.primaryHover },
                    }}
                >
                    {loading ? "Добавление…" : "По ссылке"}
                </Button>
            </Stack>
            {uploadMessage && (
                <Typography variant="caption" sx={{ display: "block", mt: 1, color: "rgba(255,255,255,0.55)", fontFamily: font }}>
                    {uploadMessage}
                </Typography>
            )}
        </Box>
    );
}

export default ImageTool;
