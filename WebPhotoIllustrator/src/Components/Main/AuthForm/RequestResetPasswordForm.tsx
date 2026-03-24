import React, { useContext, useState } from "react";

import { Box, TextField, Button, Typography, Stack, Slide } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";

import { Context } from "../../../index";


interface ResetProps {
  onBack: () => void;
}

function RequestResetPasswordForm({ onBack }: ResetProps) {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const [serverSuccessMessage, setServerSuccessMessage] = useState<string | null>(null);
  const { store } = useContext(Context);
  const navigator = useNavigate();

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Введите email";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Некорректный email";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (validate()) {
        const { data, error } = await store.requestPasswordReset(email);
        if (error) {
          setServerMessage(error);
        }
        else if (data) {
          setServerSuccessMessage(data.message);
        }
      }
    }
    catch (error: any) {
      const data = error.response.data.message || "Ошибка сервера";
      console.log(error.response)
      setServerMessage(data);
    }
  }

  const handleOnClose = async () => {
    setServerSuccessMessage(null);
    onBack();
  }

  return (
    <Slide direction="left" in mountOnEnter unmountOnExit>
      <Box
        component="form"
        onSubmit={handleRequestReset}
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
          <TextField label="Электронный адрес" fullWidth value={email} onChange={(e) => setEmail(e.target.value)} error={!!errors.email} helperText={errors.email} />

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
            Сбросить пароль
          </Button>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", cursor: "pointer", color: "primary.main" }}
            onClick={onBack}
          >
            Назад к авторизации
          </Typography>
        </Stack>
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={!!serverMessage} autoHideDuration={3000} onClose={() => setServerMessage(null)}>
          <Alert severity="error">{serverMessage}</Alert>
        </Snackbar>
        <Snackbar
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          open={!!serverSuccessMessage} autoHideDuration={3000} onClose={handleOnClose}>
          <Alert severity="success">{serverSuccessMessage}</Alert>
        </Snackbar>
      </Box>
    </Slide>
  )
}

export default observer(RequestResetPasswordForm);