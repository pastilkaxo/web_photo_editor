import React from "react";

import {
  Box,
  Typography,
  Stack,
  Slide,
  Button
} from "@mui/material";
import { observer } from "mobx-react-lite";

interface ConfirmFormProps {
  email: string;
  onBack: () => void;
}

function ConfirmForm({ email, onBack }: ConfirmFormProps) {

  return (
    <Slide direction="left" in mountOnEnter unmountOnExit>
      <Box
        sx={{
          p: { xs: 2.5, md: 3.5 },
          borderRadius: 3,
          boxShadow: 3,
          bgcolor: "white",
          display: "flex",
          flexDirection: "column",
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        <Stack spacing={3} sx={{ width: "100%", mt: { md: 1 } }}>
          <Typography variant="h6" textAlign="center" gutterBottom style={{ color: "black" }}>
            Подтверждение почты
          </Typography>

          <Typography variant="body2" textAlign="center" color="text.secondary">
            На почту <strong>{email}</strong> была отправлена ссылка для активации аккаунта.
          </Typography>

          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" fontWeight="bold" gutterBottom>
              Инструкция:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              1. Проверьте вашу почту {email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              2. Найдите письмо от нашей системы
            </Typography>
            <Typography variant="body2" color="text.secondary">
              3. Перейдите по ссылке в письме
            </Typography>
            <Typography variant="body2" color="text.secondary">
              4. После активации войдите в систему
            </Typography>
          </Box>

          <Typography variant="body2" textAlign="center" sx={{ fontStyle: "italic", color: "text.secondary" }}>
            Без подтверждения почты вход в систему невозможен
          </Typography>

          <Button
            variant="contained"
            fullWidth
            onClick={onBack}
            sx={{
              borderRadius: "8px",
              py: 1.2,
              fontWeight: "bold",
              bgcolor: "primary.main",
              "&:hover": { bgcolor: "primary.dark", transform: "scale(1.02)" },
              transition: "0.3s",
            }}
          >
            Понятно
          </Button>
        </Stack>
      </Box>
    </Slide>
  );
}

export default observer(ConfirmForm);