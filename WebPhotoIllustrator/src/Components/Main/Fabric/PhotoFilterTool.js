import React, { useState, useEffect } from "react";
import { filters as fabricFilters } from "fabric";
import { Slider, Typography, Checkbox, FormControlLabel, Box, Button, Stack, IconButton as MuiIconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";

import { FABRIC_MENU } from "./styles";

const PhotoFilterTool = ({ canvas, showFilterMenu, setShowFilterMenu }) => {
    const [selectedObject, setSelectedObject] = useState(null);
    const [filters, setFilters] = useState({
        brightness: 0,
        contrast: 0,
        saturation: 0,
        vibrance: 0,
        hue: 0,
        noise: 0,
        pixelate: 0,
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
    });

    // Sync with selection
    useEffect(() => {
        if (!canvas) return;
        const handleSelection = () => {
            const active = canvas.getActiveObject();
            if (active && active.isType('image')) {
                setSelectedObject(active);
                // Ideally we should sync state FROM the object's existing filters here 
                // but for now we reset or keep local state. 
                // A full implementation would parse active.filters to populate UI.
            } else {
                setSelectedObject(null);
            }
        };

        canvas.on("selection:created", handleSelection);
        canvas.on("selection:updated", handleSelection);
        canvas.on("selection:cleared", handleSelection);

        return () => {
            canvas.off("selection:created", handleSelection);
            canvas.off("selection:updated", handleSelection);
            canvas.off("selection:cleared", handleSelection);
        };
    }, [canvas]);

    const applyFilter = (filterName, value) => {
        if (!selectedObject || !canvas) return;
        
        const f = fabricFilters;
        selectedObject.filters = selectedObject.filters || [];

        const getFilterIndex = (type) => selectedObject.filters.findIndex(filt => filt instanceof type);

        const addOrUpdateFilter = (type, options) => {
            const index = getFilterIndex(type);
            if (index > -1) {
                selectedObject.filters[index] = new type(options);
            } else {
                selectedObject.filters.push(new type(options));
            }
        };

        const removeFilter = (type) => {
             const index = getFilterIndex(type);
             if(index > -1) selectedObject.filters.splice(index, 1);
        }

        const addConvolute = (matrix) => {
             removeFilter(f.Convolute);
             if (value) {
                 selectedObject.filters.push(new f.Convolute({ matrix }));
             }
        }
        
        switch(filterName) {
            case 'grayscale': value ? addOrUpdateFilter(f.Grayscale) : removeFilter(f.Grayscale); break;
            case 'invert': value ? addOrUpdateFilter(f.Invert) : removeFilter(f.Invert); break;
            case 'sepia': value ? addOrUpdateFilter(f.Sepia) : removeFilter(f.Sepia); break;
            case 'vintage': value ? addOrUpdateFilter(f.Vintage) : removeFilter(f.Vintage); break;
            case 'technicolor': value ? addOrUpdateFilter(f.Technicolor) : removeFilter(f.Technicolor); break;
            case 'polaroid': value ? addOrUpdateFilter(f.Polaroid) : removeFilter(f.Polaroid); break;
            case 'kodachrome': value ? addOrUpdateFilter(f.Kodachrome) : removeFilter(f.Kodachrome); break;
            case 'brownie': value ? addOrUpdateFilter(f.Brownie) : removeFilter(f.Brownie); break;
            case 'blackwhite': value ? addOrUpdateFilter(f.BlackWhite) : removeFilter(f.BlackWhite); break;
            
            case 'brightness':
                 removeFilter(f.Brightness);
                 if (value !== 0) addOrUpdateFilter(f.Brightness, { brightness: parseFloat(value) });
                 break;
            case 'contrast':
                 removeFilter(f.Contrast);
                 if (value !== 0) addOrUpdateFilter(f.Contrast, { contrast: parseFloat(value) });
                 break;
            case 'saturation':
                 removeFilter(f.Saturation);
                 if (value !== 0) addOrUpdateFilter(f.Saturation, { saturation: parseFloat(value) });
                 break;
             case 'vibrance':
                 removeFilter(f.Vibrance);
                 if (value !== 0) addOrUpdateFilter(f.Vibrance, { vibrance: parseFloat(value) });
                 break;
             case 'hue':
                 removeFilter(f.HueRotation);
                 if (value !== 0) addOrUpdateFilter(f.HueRotation, { rotation: parseFloat(value) });
                 break;
             case 'noise':
                 removeFilter(f.Noise);
                 if (value !== 0) addOrUpdateFilter(f.Noise, { noise: parseInt(value, 10) });
                 break;
             case 'pixelate':
                 removeFilter(f.Pixelate);
                 if (value > 1) addOrUpdateFilter(f.Pixelate, { blocksize: parseInt(value, 10) });
                 break;
             case 'blur':
                 removeFilter(f.Blur);
                 if (value > 0) addOrUpdateFilter(f.Blur, { blur: parseFloat(value) });
                 break;
             case 'sharpen':
                 addConvolute([0, -1, 0, -1, 5, -1, 0, -1, 0]);
                 break;
             case 'emboss':
                 addConvolute([1, 1, 1, 1, 0.7, -1, -1, -1, -1]);
                 break;
             case 'gamma':
                 removeFilter(f.Gamma);
                 addOrUpdateFilter(f.Gamma, { gamma: [value.r, value.g, value.b] });
                 break;
        }

        selectedObject.applyFilters();
        canvas.renderAll();
        canvas.fire('object:modified', { target: selectedObject });
    };

    const handleFilterChange = (name, val) => {
        setFilters(prev => ({ ...prev, [name]: val }));
        applyFilter(name, val);
    };

    const handleGammaChange = (channel, val) => {
        const newGamma = { ...filters.gamma, [channel]: val };
        setFilters(prev => ({ ...prev, gamma: newGamma }));
        applyFilter('gamma', newGamma);
    }

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
                <Typography sx={{ color: "rgba(255,255,255,0.55)", marginTop: 12, textAlign: "center" }}>
                    Выберите изображение на холсте, чтобы применить фильтры.
                </Typography>
            ) : (
                <Stack spacing={2} sx={{ "& .MuiSlider-root": { color: FABRIC_MENU.primary } }}>
                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>Пресеты</Typography>
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.grayscale} onChange={(e) => handleFilterChange('grayscale', e.target.checked)} />} label="Оттенки серого" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.invert} onChange={(e) => handleFilterChange('invert', e.target.checked)} />} label="Инверсия" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.sepia} onChange={(e) => handleFilterChange('sepia', e.target.checked)} />} label="Сепия" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.vintage} onChange={(e) => handleFilterChange('vintage', e.target.checked)} />} label="Винтаж" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.technicolor} onChange={(e) => handleFilterChange('technicolor', e.target.checked)} />} label="Техниколор" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.polaroid} onChange={(e) => handleFilterChange('polaroid', e.target.checked)} />} label="Полароид" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.kodachrome} onChange={(e) => handleFilterChange('kodachrome', e.target.checked)} />} label="Кодахром" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.brownie} onChange={(e) => handleFilterChange('brownie', e.target.checked)} />} label="Брауни" />
                    <FormControlLabel sx={labelSx} control={<Checkbox sx={{ color: "rgba(255,255,255,0.7)" }} checked={filters.blackwhite} onChange={(e) => handleFilterChange('blackwhite', e.target.checked)} />} label="Чёрно-белый" />

                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>Свёртка</Typography>
                    <Stack direction="row" spacing={1}>
                            <Button variant={filters.sharpen ? "contained" : "outlined"} sx={filterToggleSx(filters.sharpen)} onClick={() => handleFilterChange('sharpen', !filters.sharpen)} size="small">Резкость</Button>
                            <Button variant={filters.emboss ? "contained" : "outlined"} sx={filterToggleSx(filters.emboss)} onClick={() => handleFilterChange('emboss', !filters.emboss)} size="small">Тиснение</Button>
                    </Stack>

                    <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 600 }}>Коррекция</Typography>
                    
                    <Box>
                        <Typography variant="caption" sx={capSx}>Яркость</Typography>
                        <Slider value={filters.brightness} min={-1} max={1} step={0.01} onChange={(_, v) => handleFilterChange('brightness', v)} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Контраст</Typography>
                        <Slider value={filters.contrast} min={-1} max={1} step={0.01} onChange={(_, v) => handleFilterChange('contrast', v)} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Насыщенность</Typography>
                        <Slider value={filters.saturation} min={-1} max={1} step={0.01} onChange={(_, v) => handleFilterChange('saturation', v)} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Сочность</Typography>
                        <Slider value={filters.vibrance} min={-1} max={1} step={0.01} onChange={(_, v) => handleFilterChange('vibrance', v)} size="small" />
                    </Box>
                        <Box>
                        <Typography variant="caption" sx={capSx}>Оттенок</Typography>
                        <Slider value={filters.hue} min={-1} max={1} step={0.01} onChange={(_, v) => handleFilterChange('hue', v)} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Шум</Typography>
                        <Slider value={filters.noise} min={0} max={100} step={1} onChange={(_, v) => handleFilterChange('noise', v)} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Пикселизация</Typography>
                        <Slider value={filters.pixelate} min={1} max={20} step={1} onChange={(_, v) => handleFilterChange('pixelate', v)} size="small" />
                    </Box>
                    <Box>
                        <Typography variant="caption" sx={capSx}>Размытие</Typography>
                        <Slider value={filters.blur} min={0} max={1} step={0.01} onChange={(_, v) => handleFilterChange('blur', v)} size="small" />
                    </Box>
                    
                    <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>Гамма</Typography>
                    <Box>
                            <Typography variant="caption" sx={capSx}>Красный</Typography>
                            <Slider value={filters.gamma.r} min={0.2} max={2.2} step={0.01} onChange={(_, v) => handleGammaChange('r', v)} size="small" />
                    </Box>
                    <Box>
                            <Typography variant="caption" sx={capSx}>Зелёный</Typography>
                            <Slider value={filters.gamma.g} min={0.2} max={2.2} step={0.01} onChange={(_, v) => handleGammaChange('g', v)} size="small" />
                    </Box>
                    <Box>
                            <Typography variant="caption" sx={capSx}>Синий</Typography>
                            <Slider value={filters.gamma.b} min={0.2} max={2.2} step={0.01} onChange={(_, v) => handleGammaChange('b', v)} size="small" />
                    </Box>
                </Stack>
            )}
        </div>
    );
};

export default PhotoFilterTool;