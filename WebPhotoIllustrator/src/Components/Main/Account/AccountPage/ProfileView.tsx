import { useContext, useState, useEffect } from "react";

import CardActions from "@mui/joy/CardActions";
import CardOverflow from "@mui/joy/CardOverflow";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Paper,
  Stack,
  Chip
} from "@mui/material";
import localforage from "localforage";
import { observer } from "mobx-react-lite";


import DesktopStack from "./MUI/DesktopStack";
import MobileStack from "./MUI/MobileStack";
import { Context } from "../../../../index";
import { IUser } from "../../../../models/IUser";
import UserService from "../../../../Services/UserService";

function ProfileView() {
  const { store } = useContext(Context);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const currentUserId = store.user.id;



  useEffect(() => {
    const loadFullName = async () => {
      const storedFirstName = await localforage.getItem<string>(`firstName_${currentUserId}`);
      const storedLastName = await localforage.getItem<string>(`lastName_${currentUserId}`);

      if (storedFirstName) setFirstName(storedFirstName);
      if (storedLastName) setLastName(storedLastName);
    };
    loadFullName();
  }, [currentUserId]);

  const handleSaveUser = async () => {
    if (!store.user) return;
    const currentUserId = store.user.id;
    try {
      const response = await UserService.updateMySelf(currentUserId, { firstName, lastName });
      const updatedUser = {
        ...response.data,
        id: response.data.id || response.data._id || currentUserId,
      };
      store.setUser(updatedUser);
      setFirstName(updatedUser.firstName || "");
      setLastName(updatedUser.lastName || "");
      await localforage.setItem(`firstName_${currentUserId}`, updatedUser.firstName || "");
      await localforage.setItem(`lastName_${currentUserId}`, updatedUser.lastName || "");
      handleCloseEdit();
    } catch (err: any) {
      alert(err.response?.data?.message || "Не удалось обновить пользователя");
    }
  };

  const handleOpenEdit = (user: IUser) => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setFirstName("");
    setLastName("");
  };

  return (
    <>
      <Box sx={{ p: { xs: 1, md: 1 } }}>
        <Stack spacing={3}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, flexDirection: { xs: "column", md: "row" }, gap: 2 }}>
            <Box>
              <Typography variant="h4" fontWeight={900} sx={{ color: "#fff", letterSpacing: "-0.02em" }}>Профиль</Typography>
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem" }}>
                Управляйте личными данными и отслеживайте активность в проектах.
              </Typography>
            </Box>
            <Chip
              label={store.user.roles.includes("ADMIN") ? "Администратор" : "Пользователь"}
              sx={{
                fontWeight: 700,
                bgcolor: store.user.roles.includes("ADMIN") ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                color: store.user.roles.includes("ADMIN") ? "#fca5a5" : "#93c5fd",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            />
          </Box>

          <DesktopStack
            firstName={firstName}
            lastName={lastName}
            setFirstName={setFirstName}
            setLastName={setLastName}
          />
          <MobileStack />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, pt: 2, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <Button
              variant="contained"
              onClick={() => handleOpenEdit(store.user)}
              sx={{
                bgcolor: "rgba(139, 92, 246, 0.2)",
                color: "#c4b5fd",
                fontWeight: 700,
                textTransform: "none",
                borderRadius: "10px",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                "&:hover": { bgcolor: "rgba(139, 92, 246, 0.3)" }
              }}
            >
              Редактировать профиль
            </Button>
            <Button
              variant="outlined"
              color="error"
              onClick={() => store.logout()}
              sx={{ textTransform: "none", borderRadius: "10px", fontWeight: 700 }}
            >
              Выйти
            </Button>
          </Box>
        </Stack>
      </Box>
      <Dialog
        open={openEditModal}
        onClose={handleCloseEdit}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: { bgcolor: "#1e293b", color: "#fff", backgroundImage: "none" }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Редактирование</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1, display: "flex", flexDirection: "column", gap: 3 }}>
            <TextField
              label="Имя"
              fullWidth
              variant="outlined"
              size="small"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" }, "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" } }}
            />
            <TextField
              label="Фамилия"
              fullWidth
              variant="outlined"
              size="small"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" }, "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" } }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={handleCloseEdit} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}>
            Отмена
          </Button>
          <Button onClick={handleSaveUser} variant="contained" sx={{ bgcolor: "#a78bfa", "&:hover": { bgcolor: "#8b5cf6" }, textTransform: "none", fontWeight: 700, px: 3 }}>
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default observer(ProfileView);