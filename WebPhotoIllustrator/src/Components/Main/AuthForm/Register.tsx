import React, { useContext, useState } from "react";

import { Box, TextField, Button, Typography, Stack, Slide } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import ConfirmForm from "./ConfirmForm";
import { Context } from "../../../index";

interface RegisterProps {
  onBack: () => void;
  onSuccess: () => void;
  setPendingEmail: React.Dispatch<React.SetStateAction<string>>
}

function Register({ onBack, onSuccess, setPendingEmail }: RegisterProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirm?: string }>({});
  const { store } = useContext(Context);
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const navigator = useNavigate();

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = "Введите email";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Некорректный email";
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


  const handleGoogleSuccess = async (credentialResponse: any) => {
    setServerMessage(null);
    try {
      await store.loginWithGoogle(credentialResponse.credential);
      if (store.isAuth && store.user.isActivated) {
        navigator("/profile");
      } else if (store.error) {
        setServerMessage(store.error);
      }
    } catch (error: any) {
      setServerMessage(error.response?.data?.message || "Ошибка регистрации через Google");
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage(null);
    try {
      if (validate()) {
        const success = await store.register(email, password);
        if (success) {
          //navigator("/profile");
          onSuccess();
          setPendingEmail(email);
        }
        else if (store.error) {
          setServerMessage(store.error);
        }
      }
    }
    catch (error: any) {
      setServerMessage(error.response?.data?.message || "Ошибка сервера");
    }
  }

  return (
    <Slide direction="left" in mountOnEnter unmountOnExit>
      <Box
        component="form"
        onSubmit={handleRegister}
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
          <TextField label="Пароль" type="password" fullWidth value={password} onChange={(e) => setPassword(e.target.value)} error={!!errors.password} helperText={errors.password} />
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
            Зарегистрироваться
          </Button>

          <Typography textAlign="center" sx={{ fontSize: 14, color: "black" }}>
            ИЛИ
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setServerMessage("Ошибка регистрации через Google")}
              text="signup_with"
              shape="rectangular"
              locale="ru"
            />
          </Box>

          <Typography
            variant="body2"
            sx={{ textAlign: "center", cursor: "pointer", color: "primary.main" }}
            onClick={onBack}
          >
            Назад к авторизации
          </Typography>
        </Stack>
        {
          <Snackbar
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            open={!!serverMessage}
            autoHideDuration={3000}
            onClose={() => setServerMessage(null)}
          >
            <Alert severity="error">{serverMessage}</Alert>
          </Snackbar>
        }
      </Box>
    </Slide>
  );
}

export default observer(Register);