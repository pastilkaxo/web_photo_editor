import React, { useState, useEffect, useCallback, useRef } from "react";
import { filters as fabricFilters } from "fabric";
import { Slider, Typography, Checkbox, FormControlLabel, Box, Button, Stack, IconButton as MuiIconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { FABRIC_MENU } from "./styles";

const SHARPEN_MATRIX = [0, -1, 0, -1, 5, -1, 0, -1, 0];
const EMBOSS_MATRIX = [1, 1, 1, 1, 0.7, -1, -1, -1, -1];

function matricesClose(a, b, eps = 1e-3) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => Math.abs(Number(v) - Number(b[i])) <= eps);
}

function createDefaultFiltersState() {
    return {
        brightness: 0,
        contrast: 0,
        saturation: 0,
        vibrance: 0,
        hue: 0,
        noise: 0,
        pixelate: 1,
        blur: 0,
        grayscale: false,
        invert: false,
        sepia: false,
        kodachrome: false,
        vintage: false,
        technicolor: false,
        polaroid: false,
        brownie: false,
        blackwhite: false,
        sharpen: false,
        emboss: false,
        gamma: { r: 1, g: 1, b: 1 },
    };
}

function parseFiltersFromImage(img, f) {
    const state = createDefaultFiltersState();
    const list = img.filters || [];
    for (const filt of list) {
        if (filt instanceof f.Grayscale) state.grayscale = true;
        if (filt instanceof f.Invert) state.invert = !!filt.invert;
        if (filt instanceof f.Sepia) state.sepia = true;
        if (filt instanceof f.Vintage) state.vintage = true;
        if (filt instanceof f.Technicolor) state.technicolor = true;
        if (filt instanceof f.Polaroid) state.polaroid = true;
        if (filt instanceof f.Kodachrome) state.kodachrome = true;
        if (filt instanceof f.Brownie) state.brownie = true;
        if (filt instanceof f.BlackWhite) state.blackwhite = true;
        if (filt instanceof f.Brightness) state.brightness = filt.brightness ?? 0;
        if (filt instanceof f.Contrast) state.contrast = filt.contrast ?? 0;
        if (filt instanceof f.Saturation) state.saturation = filt.saturation ?? 0;
        if (filt instanceof f.Vibrance) state.vibrance = filt.vibrance ?? 0;
        if (filt instanceof f.HueRotation) state.hue = filt.rotation ?? 0;
        if (filt instanceof f.Noise) state.noise = filt.noise ?? 0;
        if (filt instanceof f.Pixelate) state.pixelate = Math.max(1, filt.blocksize ?? 1);
        if (filt instanceof f.Blur) state.blur = filt.blur ?? 0;
        if (filt instanceof f.Convolute) {
            const m = filt.matrix;
            if (m && matricesClose(m, SHARPEN_MATRIX)) state.sharpen = true;
            if (m && matricesClose(m, EMBOSS_MATRIX)) state.emboss = true;
        }
        if (filt instanceof f.Gamma && Array.isArray(filt.gamma) && filt.gamma.length >= 3) {
            state.gamma = { r: filt.gamma[0], g: filt.gamma[1], b: filt.gamma[2] };
        }
    }
    return state;
}

const PhotoFilterTool = ({ canvas, showFilterMenu, setShowFilterMenu, historyRevision = 0 }) => {
    const [selectedObject, setSelectedObject] = useState(null);
    const [filters, setFilters] = useState(createDefaultFiltersState);
    const filtersRef = useRef(filters);
    filtersRef.current = filters;

    const syncUIFromCanvas = useCallback(() => {
        if (!canvas) return;
        const active = canvas.getActiveObject();
        if (active && active.isType("image")) {
            setSelectedObject(active);
            setFilters(parseFiltersFromImage(active, fabricFilters));
        } else {
            setSelectedObject(null);
        }
    }, [canvas]);

    useEffect(() => {
        if (!canvas) return;
        const onSel = () => syncUIFromCanvas();
        canvas.on("selection:created", onSel);
        canvas.on("selection:updated", onSel);
        canvas.on("selection:cleared", onSel);
        return () => {
            canvas.off("selection:created", onSel);
            canvas.off("selection:updated", onSel);
            canvas.off("selection:cleared", onSel);
        };
    }, [canvas, syncUIFromCanvas]);

    useEffect(() => {
        if (showFilterMenu) syncUIFromCanvas();
    }, [showFilterMenu, historyRevision, syncUIFromCanvas]);

    const commitFilterHistory = useCallback(() => {
        const obj = canvas?.getActiveObject();
        if (!obj || !obj.isType("image") || !canvas) return;
        canvas.fire("object:modified", { target: obj });
    }, [canvas]);

    const applyFilter = (filterName, value, { recordHistory = true } = {}) => {
        const img = canvas?.getActiveObject();
        if (!img || !img.isType("image") || !canvas) return;

        const f = fabricFilters;
        img.filters = img.filters || [];

        const getFilterIndex = (type) => img.filters.findIndex((filt) => filt instanceof type);

        const addOrUpdateFilter = (type, options) => {
            const index = getFilterIndex(type);
            if (index > -1) {
                img.filters[index] = new type(options);
            } else {
                img.filters.push(new type(options));
            }
        };

        const removeFilter = (type) => {
            const index = getFilterIndex(type);
            if (index > -1) img.filters.splice(index, 1);
        };

        const addConvolute = (matrix) => {
            removeFilter(f.Convolute);
            if (value) {
                img.filters.push(new f.Convolute({ matrix }));
            }
        };

        switch (filterName) {
            case "grayscale":
                value ? addOrUpdateFilter(f.Grayscale) : removeFilter(f.Grayscale);
                break;
            case "invert":
                value ? addOrUpdateFilter(f.Invert) : removeFilter(f.Invert);
                break;
            case "sepia":
                value ? addOrUpdateFilter(f.Sepia) : removeFilter(f.Sepia);
                break;
            case "vintage":
                value ? addOrUpdateFilter(f.Vintage) : removeFilter(f.Vintage);
                break;
            case "technicolor":
                value ? addOrUpdateFilter(f.Technicolor) : removeFilter(f.Technicolor);
                break;
            case "polaroid":
                value ? addOrUpdateFilter(f.Polaroid) : removeFilter(f.Polaroid);
                break;
            case "kodachrome":
                value ? addOrUpdateFilter(f.Kodachrome) : removeFilter(f.Kodachrome);
                break;
            case "brownie":
                value ? addOrUpdateFilter(f.Brownie) : removeFilter(f.Brownie);
                break;
            case "blackwhite":
                value ? addOrUpdateFilter(f.BlackWhite) : removeFilter(f.BlackWhite);
                break;
            case "brightness":
                removeFilter(f.Brightness);
                if (value !== 0) addOrUpdateFilter(f.Brightness, { brightness: parseFloat(value) });
                break;
            case "contrast":
                removeFilter(f.Contrast);
                if (value !== 0) addOrUpdateFilter(f.Contrast, { contrast: parseFloat(value) });
                break;
            case "saturation":
                removeFilter(f.Saturation);
                if (value !== 0) addOrUpdateFilter(f.Saturation, { saturation: parseFloat(value) });
                break;
            case "vibrance":
                removeFilter(f.Vibrance);
                if (value !== 0) addOrUpdateFilter(f.Vibrance, { vibrance: parseFloat(value) });
                break;
            case "hue":
                removeFilter(f.HueRotation);
                if (value !== 0) addOrUpdateFilter(f.HueRotation, { rotation: parseFloat(value) });
                break;
            case "noise":
                removeFilter(f.Noise);
                if (value !== 0) addOrUpdateFilter(f.Noise, { noise: parseInt(value, 10) });
                break;
            case "pixelate":
                removeFilter(f.Pixelate);
                if (value > 1) addOrUpdateFilter(f.Pixelate, { blocksize: parseInt(value, 10) });
                break;
            case "blur":
                removeFilter(f.Blur);
                if (value > 0) addOrUpdateFilter(f.Blur, { blur: parseFloat(value) });
                break;
            case "sharpen":
                addConvolute(SHARPEN_MATRIX);
                break;
            case "emboss":
                addConvolute(EMBOSS_MATRIX);
                break;
            case "gamma":
                removeFilter(f.Gamma);
                addOrUpdateFilter(f.Gamma, { gamma: [value.r, value.g, value.b] });
                break;
            default:
                break;
        }

        img.applyFilters();
        canvas.renderAll();
        if (recordHistory) {
            canvas.fire("object:modified", { target: img });
        }
    };

    const handleFilterChange = (name, val, options = {}) => {
        setFilters((prev) => ({ ...prev, [name]: val }));
        applyFilter(name, val, options);
    };

    const handleGammaChange = (channel, val, options = {}) => {
        const newGamma = { ...filtersRef.current.gamma, [channel]: val };
        setFilters((prev) => ({ ...prev, gamma: newGamma }));
        applyFilter("gamma", newGamma, options);
    };

    if (!showFilterMenu) return null;

    const labelSx = { "& .MuiFormControlLabel-label": { color: "rgba(255,255,255,0.88)", fontSize: 14 } };
    const capSx = { color: "rgba(255,255,255,0.55)" };
    const filterToggleSx = (active) => ({
        textTransform: "none",
        fontSize: 13,
        ...(active
            ? {
                  bgcolor: FABRIC_MENU.primary,
                  color: FABRIC_MENU.primaryText,
                  "&:hover": { bgcolor: FABRIC_MENU.primaryHover },
              }
            : {
                  borderColor: "rgba(255,255,255,0.35)",
                  color: "#fff",
                  "&:hover": { borderColor: "rgba(255,255,255,0.55)", bgcolor: FABRIC_MENU.rowHover },
              }),
    });

    const sliderHist = {
        onChange: (name, v) => handleFilterChange(name, v, { recordHistory: false }),
        onChangeCommitted: () => commitFilterHistory(),
    };

    return (
        <div className="settings-panel-dark" style={{ width: "100%" }}>
            <div className="settings-panel-dark__header">
                <h3 className="settings-panel-dark__title">Фото-фильтры</h3>
                <MuiIconButton
                    aria-label="Закрыть"
                    onClick={() => setShowFilterMenu(false)}
                    size="small"
                    sx={{ color: "rgba(255,255,255,0.75)" }}
                >
                    <CloseIcon fontSize="small" />
                </MuiIconButton>
            </div>

            {!selectedObject ? (
                <Typography sx={{ color: "rgba(255,255,255,0.55)", textAlign: "center", m: 0 }}>
                    Выберите изображение на холсте, чтобы применить фильтры.
                </Typography>
            ) : (
                <Stack spacing={2} sx={{ "& .MuiSlider-root": { color: FABRIC_MENU.primary } }}>
                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>Пресеты</Typography>
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.grayscale} onChange={(e) => handleFilterChange("grayscale", e.target.checked)} />} label="Оттенки серого" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.invert} onChange={(e) => handleFilterChange("invert", e.target.checked)} />} label="Инверсия" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.sepia} onChange={(e) => handleFilterChange("sepia", e.target.checked)} />} label="Сепия" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.vintage} onChange={(e) => handleFilterChange("vintage", e.target.checked)} />} label="Винтаж" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.technicolor} onChange={(e) => handleFilterChange("technicolor", e.target.checked)} />} label="Техниколор" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.polaroid} onChange={(e) => handleFilterChange("polaroid", e.target.checked)} />} label="Полароид" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.kodachrome} onChange={(e) => handleFilterChange("kodachrome", e.target.checked)} />} label="Кодахром" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.brownie} onChange={(e) => handleFilterChange("brownie", e.target.checked)} />} label="Брауни" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.blackwhite} onChange={(e) => handleFilterChange("blackwhite", e.target.checked)} />} label="Чёрно-белый" />

                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>Свёртка</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button variant={filters.sharpen ? "contained" : "outlined"} sx={filterToggleSx(filters.sharpen)} onClick={() => handleFilterChange("sharpen", !filters.sharpen)} size="small">Резкость</Button>
                        <Button variant={filters.emboss ? "contained" : "outlined"} sx={filterToggleSx(filters.emboss)} onClick={() => handleFilterChange("emboss", !filters.emboss)} size="small">Тиснение</Button>
                    </Stack>

                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>Коррекция</Typography>

                    <Box>
                        <Typography variant="caption" sx={capSx}>Яркость</Typography>
                        <Slider value={filters.brightness} min={-1} max={1} step={0.01} onChange={(_, v) => sliderHist.onChange("brightness", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Контраст</Typography>
                        <Slider value={filters.contrast} min={-1} max={1} step={0.01} onChange={(_, v) => sliderHist.onChange("contrast", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Насыщенность</Typography>
                        <Slider value={filters.saturation} min={-1} max={1} step={0.01} onChange={(_, v) => sliderHist.onChange("saturation", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Сочность</Typography>
                        <Slider value={filters.vibrance} min={-1} max={1} step={0.01} onChange={(_, v) => sliderHist.onChange("vibrance", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Оттенок</Typography>
                        <Slider value={filters.hue} min={-1} max={1} step={0.01} onChange={(_, v) => sliderHist.onChange("hue", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Шум</Typography>
                        <Slider value={filters.noise} min={0} max={100} step={1} onChange={(_, v) => sliderHist.onChange("noise", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Пикселизация</Typography>
                        <Slider value={filters.pixelate} min={1} max={20} step={1} onChange={(_, v) => sliderHist.onChange("pixelate", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Размытие</Typography>
                        <Slider value={filters.blur} min={0} max={1} step={0.01} onChange={(_, v) => sliderHist.onChange("blur", v)} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>

                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Гамма</Typography>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Красный</Typography>
                        <Slider value={filters.gamma.r} min={0.2} max={2.2} step={0.01} onChange={(_, v) => handleGammaChange("r", v, { recordHistory: false })} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Зелёный</Typography>
                        <Slider value={filters.gamma.g} min={0.2} max={2.2} step={0.01} onChange={(_, v) => handleGammaChange("g", v, { recordHistory: false })} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Синий</Typography>
                        <Slider value={filters.gamma.b} min={0.2} max={2.2} step={0.01} onChange={(_, v) => handleGammaChange("b", v, { recordHistory: false })} onChangeCommitted={sliderHist.onChangeCommitted} size="small" />
                    </Box>
                </Stack>
            )}
        </div>
    );
};

export default PhotoFilterTool;
