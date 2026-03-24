import React, { useContext, useState } from "react";

import {
  Box,
  TextField,
  Button,
  Typography,
  Stack,
  Slide,
  Snackbar,
  Alert
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

import { Context } from "../../../index";


function ResetForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});

  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  const navigator = useNavigate();
  const { store } = useContext(Context);

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!password) newErrors.password = "Введите пароль";
    if (!confirm) newErrors.confirm = "Подтвердите пароль";
    else if (password !== confirm) newErrors.confirm = "Пароли не совпадают";
    if ((password.length && confirm.length) < 6) {
      newErrors.password = "Длина пароля должна быть больше 6"
      newErrors.confirm = "Длина пароля должна быть больше 6"
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCloseSnackbar = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpenSnackbar(false);
  };

  const handleSubmitReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (validate()) {
        const token = localStorage.getItem("passwordToken");
        if (token) {
          const response = await store.resetPassword(token, password);
          setSnackbarSeverity("success");
          setSnackbarMessage(response.message ?? "Пароль успешно изменен! Перенаправление...");
          setOpenSnackbar(true);
          alert("Пароль изменен!")
          navigator("/");
          localStorage.removeItem("passwordToken");
          store.setWantToResetPass(false);
        }
        else {
          setSnackbarSeverity("error");
          setSnackbarMessage("Токен сброса отсутствует. Запросите ссылку заново.");
          setOpenSnackbar(true);
        }
      }
    }
    catch (error: any) {
      console.log(error);
      setSnackbarSeverity("error");
      setSnackbarMessage(error.response?.data?.message || "Произошла ошибка при сбросе пароля");
      setOpenSnackbar(true);
    }
  }

  return (
    <div className="reset-container" style={{ minHeight: "100vh", display: "flex", justifyContent: "center", alignItems: "center" }}>
      <Slide in mountOnEnter unmountOnExit>
        <Box
          component="form"
          onSubmit={handleSubmitReset}
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
          <Stack spacing={2} sx={{ width: "100%", mt: { md: 1 } }}>
            <TextField label="Новый пароль" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} helperText={errors.password} />
            <TextField label="Подтверждение пароля" type="password" fullWidth value={confirm} onChange={(e) => setConfirm(e.target.value)} error={!!errors.confirm} helperText={errors.confirm} />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              sx={{
                borderRadius: "8px",
                py: 1.2,
                fontWeight: "bold",
                bgcolor: "green",
                "&:hover": { bgcolor: "darkgreen", transform: "scale(1.02)" },
                transition: "0.3s",
              }}
            >
              Подтвердить
            </Button>

            <Typography
              variant="body2"
              sx={{ textAlign: "center", cursor: "pointer", color: "primary.main" }}
              onClick={() => navigator("/")}
            >
              Назад к авторизации
            </Typography>
          </Stack>

        </Box>
      </Slide>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
          variant="filled"
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default observer(ResetForm);