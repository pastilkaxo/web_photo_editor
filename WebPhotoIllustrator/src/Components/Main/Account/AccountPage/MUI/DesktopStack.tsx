import React, {useContext, useEffect, useState} from "react"

import Stack from "@mui/joy/Stack";
import { Box, Chip, Paper, Typography } from "@mui/material";
import Avatar from "@mui/material/Avatar";
import ButtonBase from "@mui/material/ButtonBase";
import Divider from "@mui/material/Divider";
import localforage from "localforage";
import { observer } from "mobx-react-lite";

import AccountStats from "./AccountStats";
import {Context} from "../../../../../index";

function DesktopStack(_: any) {
  const [avatar, setAvatar] = useState<string | undefined>(undefined);
  const {store} = useContext(Context);
  const currentUserId = store.user.id;

  const handleChangeAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const result = reader.result as string;
      setAvatar(result);
      await localforage.setItem(`avatar_${currentUserId}`, result);
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const loadAvatar = async () => {
      const stored = await localforage.getItem<string>(`avatar_${currentUserId}`);
      if (stored) setAvatar(stored);
    };
    loadAvatar();
  }, [currentUserId]);

  return(
    <Stack
      direction="row"
      spacing={3}
      sx={{ display: { xs: "none", md: "flex" }, my: 1, alignItems: "stretch" }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          minWidth: 260,
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
          color: "#fff"
        }}
      >
        <Stack direction="column" spacing={2} alignItems="center">
          <ButtonBase
            component="label"
            sx={{
              borderRadius: "50%",
              p: 0.5,
              border: "2px dashed rgba(255, 255, 255, 0.2)",
              transition: "border-color 0.3s ease",
              "&:hover": { borderColor: "#a78bfa" }
            }}
          >
            <Avatar alt="Avatar" src={avatar} sx={{ width: 140, height: 140, border: "4px solid rgba(255,255,255,0.05)" }}/>
            <input type="file" accept="image/*" hidden onChange={handleChangeAvatar} />
          </ButtonBase>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="h6" fontWeight={800} sx={{ color: "#fff" }}>
              {store.user.firstName} { store.user.lastName}
            </Typography>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", mt: -0.5, display: "block" }}>
              ID: {currentUserId.slice(-8).toUpperCase()}
            </Typography>
          </Box>
          <Stack spacing={1} sx={{ width: "100%" }}>
            <Chip
              label={store.user.roles.includes("ADMIN") ? "Администратор" : "Пользователь"}
              sx={{ 
                fontWeight: 700, 
                bgcolor: store.user.roles.includes("ADMIN") ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 92, 246, 0.1)",
                color: store.user.roles.includes("ADMIN") ? "#fca5a5" : "#c4b5fd",
                borderRadius: "8px"
              }}
            />
            <Chip
              label={store.isActivated ? "Верифицирован" : "Не верифицирован"}
              sx={{ 
                fontWeight: 600, 
                bgcolor: store.isActivated ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
                color: store.isActivated ? "#6ee7b7" : "#fcd34d",
                fontSize: "0.75rem",
                borderRadius: "8px"
              }}
            />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 4,
          flexGrow: 1,
          background: "rgba(255, 255, 255, 0.04)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 12px 32px rgba(0, 0, 0, 0.2)",
          color: "#fff"
        }}
      >
        <Stack spacing={2.5} sx={{ height: "100%" }}>
          <Box>
            <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>Основной Email</Typography>
            <Typography variant="h6" sx={{ color: "#fff", fontWeight: 600 }}>{store.user.email}</Typography>
          </Box>
          <Divider sx={{ borderColor: "rgba(255,255,255,0.08)" }} />
          <Box sx={{ flexGrow: 1 }}>
             <Typography variant="overline" sx={{ color: "rgba(255,255,255,0.5)", fontWeight: 700, mb: 1, display: "block" }}>Статистика аккаунта</Typography>
             <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <AccountStats StatName="Проекты" StatValue={store.user.projects.length || 0} />
                <AccountStats StatName="Избранное" StatValue={store.user.favorites.length || 0} />
                <AccountStats StatName="Звезды" StatValue={store.user.totalStars || 0} />
             </Stack>
          </Box>
        </Stack>
      </Paper>
    </Stack>
  )
}

export default observer(DesktopStack);