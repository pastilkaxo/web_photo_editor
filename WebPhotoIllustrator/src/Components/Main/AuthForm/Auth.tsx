import React, { useState, useContext, useEffect } from "react";

import { Box, TextField, Button, Typography, Stack, Slide } from "@mui/material";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import { observer } from "mobx-react-lite";
import { Link, useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";

import ConfirmForm from "./ConfirmForm";
import Register from "./Register";
import ResetPasswordForm from "./RequestResetPasswordForm";
import { Context } from "../../../index";

function Auth() {
  const [showRegister, setShowRegister] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [serverMessage, setServerMessage] = useState<string | null>(null);
  const { store } = useContext(Context);
  const navigator = useNavigate();

  useEffect(() => {
    return () => {
      store.setError("");
    };
  }, []);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = "Введите email";
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Некорректный email";
    if (!password) newErrors.password = "Введите пароль";

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
      setServerMessage(error.response?.data?.message || "Ошибка авторизации через Google");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerMessage(null);

    if (validate()) {
      try {

        await store.login(email, password);
        if (store.isAuth && store.user.isActivated) {
          navigator("/profile");
        }
        else if (store.isAuth && store.user && !store.user.isActivated) {
          setPendingEmail(email);
          setShowConfirm(true);
        }
        else if (store.error) {
          setServerMessage(store.error);
        }
      } catch (error: any) {
        setServerMessage(error.response?.data?.message || "Ошибка сервера");
      }
    }
  }

  return (
    <>
      {!showRegister && !showReset && !showConfirm && (
        <Slide direction="right" in={!showRegister} mountOnEnter unmountOnExit>
          <Box
            component="form"
            onSubmit={handleLogin}
            sx={{
              p: { xs: 2.5, md: 3.5 }, // Consistent padding
              borderRadius: 3,
              boxShadow: 3,
              bgcolor: "white",
              display: "flex",
              flexDirection: "column",
              height: "100%", // Fill parent height
              boxSizing: "border-box",
            }}
          >
            <Stack spacing={2} sx={{ width: "100%", mt: { md: 1 } }}>
              <TextField
                label="Электронный адрес"
                variant="outlined"
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
              />
              <TextField
                label="Пароль"
                type="password"
                fullWidth
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
              />

              <Typography
                variant="body2"
                onClick={() => setShowReset(true)}
                sx={{ textAlign: "right", cursor: "pointer", color: "primary.main" }}
              >
                Забыли пароль?
              </Typography>

              <Button
                type="submit"
                variant="contained"
                fullWidth
                sx={{
                  borderRadius: "8px",
                  py: 1.2,
                  fontWeight: "bold",
                  bgcolor: "red",
                  "&:hover": { bgcolor: "darkred", transform: "scale(1.02)" },
                  transition: "0.3s",
                }}
              >
                Войти
              </Button>
              <Typography
                variant="body2"
                sx={{ textAlign: "center", cursor: "pointer", color: "black" }}
                onClick={() => setShowRegister(true)}
              >
                Ещё не зарегистрированы?{" "}
                <Box component="span" sx={{ fontWeight: "extrabold", color: "primary.main", textDecoration: "underline" }}>
                  Зарегистрироваться
                </Box>
              </Typography>
              <Typography textAlign="center" sx={{ fontSize: 13, color: "black" }}>
                ИЛИ
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => setServerMessage("Ошибка авторизации через Google")}
                  text="signin_with"
                  shape="rectangular"
                  locale="ru"
                />
              </Box>
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
      )}
      {showRegister && <Register setPendingEmail={setPendingEmail} onBack={() => setShowRegister(false)} onSuccess={() => { setShowConfirm(true); setShowRegister(false) }} />}
      {showReset && <ResetPasswordForm onBack={() => setShowReset(false)} />}
      {showConfirm && <ConfirmForm email={pendingEmail} onBack={() => setShowConfirm(false)} />}
    </>
  );
}

export default observer(Auth);