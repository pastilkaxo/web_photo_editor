import React, { useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Box, Button, IconButton, Modal, Typography, Stack } from '@mui/material';

const boxSx = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: { xs: '92vw', sm: 440 },
  bgcolor: '#1e1e2a',
  color: '#f0f0f5',
  border: '1px solid rgba(255,255,255,0.12)',
  boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
  p: 3,
  borderRadius: '12px',
  outline: 'none',
  fontFamily: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
};

export default function CanvasSizeModal({ open, onCreateFree, onCreateFromImage, onClose }) {
    const fileInputRef = useRef(null);
    const [isReadingImage, setIsReadingImage] = useState(false);

    const handleSelectPhotoClick = () => {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    };

    const handleImageFileChange = async (event) => {
      const file = event.target.files?.[0];
      if (!file || !file.type.startsWith("image/")) {
        event.target.value = null;
        return;
      }

      setIsReadingImage(true);
      try {
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const dimensions = await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
          img.onerror = reject;
          img.src = dataUrl;
        });

        onCreateFromImage?.({
          src: dataUrl,
          width: dimensions.width,
          height: dimensions.height,
          name: file.name
        });
      } catch (error) {
        console.error("Failed to read selected photo:", error);
        alert("Не удалось прочитать изображение. Попробуйте другой файл.");
      } finally {
        setIsReadingImage(false);
        event.target.value = null;
      }
    };

    const btnSx = {
      textTransform: 'none',
      fontWeight: 500,
      py: 1.2,
      borderColor: 'rgba(255,255,255,0.35)',
      color: '#fff',
      '&:hover': {
        borderColor: 'rgba(255,255,255,0.55)',
        bgcolor: 'rgba(255,255,255,0.06)',
      },
    };

    return (
      <Modal open={open} onClose={() => {}} disableEscapeKeyDown>
        <Box sx={boxSx}>
          {onClose && (
            <IconButton
              aria-label="Закрыть и вернуться"
              onClick={onClose}
              size="small"
              sx={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.75)' }}
            >
              <CloseIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="h2" mb={1} textAlign="center" sx={{ fontWeight: 600, pr: onClose ? 4 : 0 }}>
            Создать новый проект
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)', mb: 3 }} textAlign="center">
            Выберите режим: свободный холст или редактирование конкретной фотографии.
          </Typography>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            style={{ display: "none" }}
          />

          <Stack spacing={2}>
            <Button
              fullWidth
              variant="outlined"
              size="large"
              sx={btnSx}
              onClick={onCreateFree}
            >
              Свободный режим (800 × 600)
            </Button>

            <Button
              fullWidth
              variant="outlined"
              size="large"
              sx={{
                ...btnSx,
                '&:hover': { borderColor: 'rgba(45,212,191,0.55)', bgcolor: 'rgba(45, 212, 191, 0.1)' },
              }}
              onClick={handleSelectPhotoClick}
              disabled={isReadingImage}
            >
              {isReadingImage ? "Подготовка фото..." : "Открыть фото для редактирования"}
            </Button>
          </Stack>
        </Box>
      </Modal>
    )
}
