import React, { useState, useEffect, useRef } from "react";

import CloseIcon from "@mui/icons-material/Close";
import {
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
} from "@mui/material";
import { DownloadIcon } from "sebikostudio-icons";
import { FABRIC_MENU } from "./styles";

function CroppingSettings({ canvas, refreshKey, onClose }) {
  const [frames, setFrames] = useState([]);
  const [selectedFrame, setSelectedFrame] = useState(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [panelDismissed, setPanelDismissed] = useState(false);
  const prevFrameCountRef = useRef(0);

  const updateFrames = () => {
    if (canvas) {
      const framesFromCanvas = canvas.getObjects("rect").filter((obj) => {
        return obj.name && (obj.name.startsWith("Рамка") || obj.name.startsWith("Frame"));
      });

      setFrames(framesFromCanvas);

      if (framesFromCanvas.length > 0 && !selectedFrame) {
        setSelectedFrame(framesFromCanvas[0]);
        setSelectedValue(framesFromCanvas[0].name);
      }
    }
  };

  useEffect(() => {
    updateFrames();
  }, [canvas, refreshKey]);

  useEffect(() => {
    const n = frames.length;
    const prev = prevFrameCountRef.current;
    if (n > 0 && prev === 0) {
      setPanelDismissed(false);
    }
    prevFrameCountRef.current = n;
  }, [frames.length]);

  const handleFrameSelect = (event) => {
    const value = event.target.value;
    setSelectedValue(value);
    
    const selected = frames.find((frame) => frame.name === value);
    setSelectedFrame(selected);
    
    if (selected) {
      canvas.setActiveObject(selected);
      canvas.renderAll();
    }
  };

  const exportFrameAsPNG = () => {
    if (!selectedFrame) return;
    
    frames.forEach((frame) => {
      frame.set("visible", false);
    });
    
    selectedFrame.set({
      strokeWidth: 0,
      visible: true,
    });
    
    const dataURL = canvas.toDataURL({
      left: selectedFrame.left,
      top: selectedFrame.top,
      width: selectedFrame.width * selectedFrame.scaleX,
      height: selectedFrame.height * selectedFrame.scaleY,
      format: "png"
    });

    selectedFrame.set({
      strokeWidth: 1
    });
    
    frames.forEach((frame) => {
      frame.set("visible", true);
    });
    
    canvas.renderAll();

    const link = document.createElement("a");
    link.href = dataURL;
    link.download = `${selectedFrame.name}.png`;
    link.click();
  };

  if (frames.length === 0 || panelDismissed) {
    return null;
  }

  const handleClose = () => {
    setPanelDismissed(true);
    onClose?.();
  };

  return (
    <div className="CroppingSettings settings-panel-dark">
      <Box className="settings-panel-dark__header" sx={{ mb: 0.5 }}>
        <h3 className="settings-panel-dark__title">Рамки экспорта</h3>
        <IconButton size="small" aria-label="Скрыть панель рамок" onClick={handleClose} sx={{ color: "rgba(255,255,255,0.75)" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <FormControl fullWidth size="small">
          <InputLabel id="frame-select-label" sx={{ color: "rgba(255,255,255,0.8)" }}>Выбор рамки</InputLabel>
          <Select
            labelId="frame-select-label"
            value={selectedValue}
            label="Выбор рамки"
            onChange={handleFrameSelect}
            MenuProps={{
              PaperProps: {
                sx: {
                  bgcolor: FABRIC_MENU.surface,
                  border: `1px solid ${FABRIC_MENU.border}`,
                  "& .MuiMenuItem-root": { color: FABRIC_MENU.text },
                  "& .MuiMenuItem-root:hover": { bgcolor: FABRIC_MENU.rowHover },
                  "& .MuiMenuItem-root.Mui-selected": { bgcolor: "rgba(45, 212, 191, 0.12)" },
                  "& .MuiMenuItem-root.Mui-selected:hover": { bgcolor: "rgba(45, 212, 191, 0.18)" },
                },
              },
            }}
            sx={{
              "& .MuiSelect-select": { color: "#fff" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.35)" },
              "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.5)" },
            }}
          >
            {frames.map((frame, index) => (
              <MenuItem key={index} value={frame.name} sx={{ color: FABRIC_MENU.text }}>
                {frame.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          onClick={exportFrameAsPNG}
          startIcon={<DownloadIcon />}
          fullWidth
          sx={{
            textTransform: "none",
            backgroundColor: FABRIC_MENU.primary,
            color: FABRIC_MENU.primaryText,
            "&:hover": {
              backgroundColor: FABRIC_MENU.primaryHover,
            }
          }}
        >
          Сохранить как PNG
        </Button>
      </Box>
    </div>
  );
}

export default CroppingSettings;