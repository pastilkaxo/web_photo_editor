import React, { useState, useContext, useEffect } from "react";

import CloseIcon from "@mui/icons-material/Close";
import { SparklesIcon } from "sebikostudio-icons";
import { FabricImage } from "fabric";
import { Box, Button, IconButton, Stack, TextField, Typography } from "@mui/material";

import { Context } from "../../../index";
import { FABRIC_MENU } from "./styles";

const CANVAS_PADDING = 40;
const font = '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif';
/** Высота поля и кнопки в одной строке (MUI OutlinedInput size="small" ≈ 40px) */
const AI_ROW_HEIGHT = 40;
const ERROR_AUTO_DISMISS_MS = 3000;

function FabricAssist({ canvas }) {
    const [prompt, setPrompt] = useState("");
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");
    const { store } = useContext(Context);

    useEffect(() => {
        if (!errorMsg) return undefined;
        const id = setTimeout(() => setErrorMsg(""), ERROR_AUTO_DISMISS_MS);
        return () => clearTimeout(id);
    }, [errorMsg]);

    const addImageToCanvas = (img) => {
        if (!canvas) return;
        const canvasW = canvas.getWidth();
        const canvasH = canvas.getHeight();
        const maxW = canvasW - CANVAS_PADDING * 2;
        const maxH = canvasH - CANVAS_PADDING * 2;
        const scale = Math.min(maxW / img.width, maxH / img.height, 1);
        img.scale(scale);
        img.set({
            left: canvasW / 2 - img.getScaledWidth() / 2,
            top: canvasH / 2 - img.getScaledHeight() / 2,
            name: "Изображение ИИ",
            selectable: true,
            evented: true,
        });
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.requestRenderAll();
    };

    const handleGenerate = async (e) => {
        e.preventDefault();
        const trimmed = prompt.trim();
        if (!trimmed || loading) return;

        setLoading(true);
        setErrorMsg("");

        const result = await store.generateImage(trimmed);

        if (result.imageUrl) {
            try {
                const img = await FabricImage.fromURL(result.imageUrl);
                addImageToCanvas(img);
                setPrompt("");
            } catch (err) {
                console.error("Canvas image error:", err);
                setErrorMsg("Изображение получено, но не удалось добавить его на холст.");
            }
        } else {
            setErrorMsg(result.error || "Ошибка генерации. Попробуйте ещё раз.");
        }

        setLoading(false);
    };

    return (
        <Box
            className="fabric-assist-strip fabric-assist-floating"
            sx={{
                fontFamily: font,
                bgcolor: FABRIC_MENU.surface,
                border: "1px solid rgba(255,255,255,0.22)",
                borderRadius: 2,
                boxShadow: "0 10px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(0,0,0,0.25)",
                px: 1.75,
                py: 1.25,
            }}
        >
            <Typography
                variant="caption"
                component="div"
                sx={{
                    color: "rgba(255,255,255,0.72)",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    mb: 0.75,
                    textAlign: "left",
                }}
            >
                AI Generator
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center" useFlexGap sx={{ flexWrap: "nowrap" }}>
                <TextField
                    size="small"
                    hiddenLabel
                    placeholder="Опишите изображение…"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleGenerate(e);
                    }}
                    disabled={loading}
                    sx={{
                        flex: "1 1 auto",
                        minWidth: 0,
                        "& .MuiOutlinedInput-root": {
                            height: AI_ROW_HEIGHT,
                            color: FABRIC_MENU.text,
                            bgcolor: FABRIC_MENU.surfaceInput,
                            "&:hover": { bgcolor: FABRIC_MENU.surfaceElevated },
                        },
                        "& .MuiOutlinedInput-input": {
                            py: 0,
                            height: AI_ROW_HEIGHT,
                            boxSizing: "border-box",
                            display: "flex",
                            alignItems: "center",
                        },
                        "& .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.28)",
                            borderWidth: "1px",
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                            borderColor: "rgba(255,255,255,0.4)",
                        },
                        "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                            borderColor: FABRIC_MENU.primary,
                            borderWidth: "1px",
                        },
                        "& .MuiOutlinedInput-input::placeholder": {
                            color: "rgba(255,255,255,0.42)",
                            opacity: 1,
                        },
                    }}
                />
                <Button
                    variant="contained"
                    size="small"
                    onClick={handleGenerate}
                    disabled={loading || !prompt.trim()}
                    aria-label={loading ? "Генерация" : "Сгенерировать изображение"}
                    sx={{
                        fontFamily: font,
                        textTransform: "none",
                        fontWeight: 600,
                        flexShrink: 0,
                        width: AI_ROW_HEIGHT,
                        minWidth: AI_ROW_HEIGHT,
                        height: AI_ROW_HEIGHT,
                        minHeight: AI_ROW_HEIGHT,
                        p: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 1,
                        bgcolor: FABRIC_MENU.primary,
                        color: FABRIC_MENU.primaryText,
                        boxShadow: "0 2px 8px rgba(45,212,191,0.35)",
                        "&:hover": { bgcolor: FABRIC_MENU.primaryHover, boxShadow: "0 4px 14px rgba(45,212,191,0.45)" },
                        "&:disabled": {
                            bgcolor: "rgba(45,212,191,0.35)",
                            color: "rgba(15,23,42,0.5)",
                        },
                        "& svg": { width: 20, height: 20, display: "block" },
                    }}
                >
                    <SparklesIcon />
                </Button>
            </Stack>
            {loading && (
                <Typography variant="caption" sx={{ display: "block", mt: 0.75, color: "rgba(255,255,255,0.55)", textAlign: "left" }}>
                    Генерация…
                </Typography>
            )}

            {errorMsg && (
                <Box
                    sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 0.5,
                        mt: 1,
                        bgcolor: "rgba(255,138,128,0.1)",
                        border: "1px solid rgba(255,138,128,0.3)",
                        borderRadius: 1,
                        pl: 1.25,
                        pr: 0.25,
                        py: 0.5,
                    }}
                >
                    <Typography
                        variant="caption"
                        component="div"
                        sx={{
                            flex: 1,
                            minWidth: 0,
                            fontSize: 12,
                            color: "#ff8a80",
                            lineHeight: 1.4,
                            pt: 0.25,
                        }}
                    >
                        {errorMsg}
                    </Typography>
                    <IconButton
                        size="small"
                        aria-label="Закрыть сообщение об ошибке"
                        onClick={() => setErrorMsg("")}
                        sx={{
                            color: "#ffab91",
                            flexShrink: 0,
                            "&:hover": { bgcolor: "rgba(255,138,128,0.15)" },
                        }}
                    >
                        <CloseIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                </Box>
            )}
        </Box>
    );
}

export default FabricAssist;
