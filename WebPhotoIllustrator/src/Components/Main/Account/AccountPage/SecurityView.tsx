import React from "react"
import { Box, Typography, Stack, TextField, Button, Switch, FormControlLabel, Divider } from "@mui/material"
import { observer } from "mobx-react-lite"

import { useAppDialog } from "../../../../context/AppDialogContext";

function SecurityView() {
  const { alert: dialogAlert } = useAppDialog();
  const [currentPassword, setCurrentPassword] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [twoFactor, setTwoFactor] = React.useState(false);

  const handleUpdatePassword = () => {
    void dialogAlert("Эта функция будет доступна в следующем обновлении!");
  };

  return (
    <Box sx={{ p: { xs: 1, md: 1 } }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h4" fontWeight={900} sx={{ color: "white", letterSpacing: "-0.01em" }}>
            Безопасность
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
            Управляйте паролем, двухфакторной аутентификацией и приватностью вашего аккаунта.
          </Typography>
        </Box>

        <Stack spacing={3}>
            {/* Password Change Section */}
            <Box sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: "rgba(255, 255, 255, 0.04)", 
              border: "1px solid rgba(255, 255, 255, 0.08)" 
            }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: "white", mb: 2 }}>Изменение пароля</Typography>
              <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }}>
                <TextField
                  placeholder="Текущий пароль"
                  type="password"
                  fullWidth
                  size="small"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  sx={{ 
                    "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.03)", color: "white", borderRadius: 2 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" }
                  }}
                />
                <TextField
                  placeholder="Новый пароль"
                  type="password"
                  fullWidth
                  size="small"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  sx={{ 
                    "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.03)", color: "white", borderRadius: 2 },
                    "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" }
                  }}
                />
              </Stack>
              <Button 
                variant="contained" 
                onClick={handleUpdatePassword}
                sx={{ 
                  bgcolor: "#a78bfa", 
                  color: "#fff", 
                  fontWeight: 700, 
                  textTransform: "none",
                  borderRadius: 2,
                  px: 3,
                  "&:hover": { bgcolor: "#8b5cf6" }
                }}
              >
                Обновить пароль
              </Button>
            </Box>

            {/* Privacy & Settings Section */}
            <Box sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: "rgba(255, 255, 255, 0.04)", 
              border: "1px solid rgba(255, 255, 255, 0.08)" 
            }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: "white", mb: 2 }}>Приватность и вход</Typography>
              <Stack spacing={2}>
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <FormControlLabel
                  control={
                    <Switch 
                      checked={twoFactor} 
                      onChange={(e) => setTwoFactor(e.target.checked)} 
                      sx={{ 
                        "& .MuiSwitch-switchBase.Mui-checked": { color: "#a78bfa" },
                        "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#a78bfa" }
                      }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ color: "white", fontWeight: 600 }}>Двухфакторная аутентификация</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>Защитите свой аккаунт дополнительным кодом при входе.</Typography>
                    </Box>
                  }
                />
                <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
                <FormControlLabel
                  control={<Switch sx={{ "& .MuiSwitch-switchBase.Mui-checked": { color: "#a78bfa" }, "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#a78bfa" } }} />}
                  label={
                    <Box>
                      <Typography variant="body1" sx={{ color: "white", fontWeight: 600 }}>Скрывать профиль в поиске</Typography>
                      <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>Ваш профиль не будет отображаться в глобальном поиске авторов.</Typography>
                    </Box>
                  }
                />
              </Stack>
            </Box>

            {/* Account Danger Zone Section */}
            <Box sx={{ 
              p: 3, 
              borderRadius: 3, 
              background: "rgba(239, 68, 68, 0.03)", 
              border: "1px dashed rgba(239, 68, 68, 0.3)" 
            }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fca5a5", mb: 1 }}>Опасная зона</Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", display: "block", mb: 2 }}>Удаление аккаунта приведет к безвозвратной потере всех ваших проектов и данных.</Typography>
              <Button 
                variant="outlined" 
                color="error" 
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                onClick={() => void dialogAlert("Система защиты подтверждения: это действие заблокировано!")}
              >
                Удалить аккаунт
              </Button>
            </Box>
        </Stack>
      </Stack>
    </Box>
  )
}

export default observer(SecurityView)