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
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import localforage from "localforage";
import { observer } from "mobx-react-lite";


import DesktopStack from "./MUI/DesktopStack";
import MobileStack from "./MUI/MobileStack";
import { Context } from "../../../../index";
import { IUser } from "../../../../models/IUser";
import UserService from "../../../../Services/UserService";
import { contestBadgeLabel } from "../../../../utils/contestLabels";
import { useAppDialog } from "../../../../context/AppDialogContext";

function ProfileView() {
  const { store } = useContext(Context);
  const { alert: dialogAlert } = useAppDialog();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [socialLink, setSocialLink] = useState("");
  const [emailContestAnnouncements, setEmailContestAnnouncements] = useState(true);
  const [emailFollowingAuthorPosts, setEmailFollowingAuthorPosts] = useState(true);
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
      const response = await UserService.updateMySelf(currentUserId, {
        firstName,
        lastName,
        socialLink: socialLink.trim(),
        emailContestAnnouncements,
        emailFollowingAuthorPosts,
      });
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
      void dialogAlert(err.response?.data?.message || "Не удалось обновить пользователя");
    }
  };

  const handleOpenEdit = (user: IUser) => {
    setFirstName(user.firstName || "");
    setLastName(user.lastName || "");
    setSocialLink(user.socialLink || "");
    setEmailContestAnnouncements(user.emailContestAnnouncements !== false);
    setEmailFollowingAuthorPosts(user.emailFollowingAuthorPosts !== false);
    setOpenEditModal(true);
  };

  const handleCloseEdit = () => {
    setOpenEditModal(false);
    setFirstName("");
    setLastName("");
    setSocialLink("");
    setEmailContestAnnouncements(true);
    setEmailFollowingAuthorPosts(true);
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

          {store.user.contestBadges && store.user.contestBadges.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {store.user.contestBadges.map((b, i) => (
                <Chip
                  key={`${b.kind}-${b.weekIndex}-${i}`}
                  label={contestBadgeLabel(b.kind, b.weekIndex)}
                  size="small"
                  sx={{ bgcolor: "rgba(251,191,36,0.12)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.3)" }}
                />
              ))}
            </Stack>
          )}

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
            <TextField
              label="Ссылка на соцсети (для страницы победителя)"
              fullWidth
              variant="outlined"
              size="small"
              value={socialLink}
              onChange={(e) => setSocialLink(e.target.value)}
              placeholder="https://..."
              sx={{ "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" }, "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={emailContestAnnouncements}
                  onChange={(_, v) => setEmailContestAnnouncements(v)}
                  color="secondary"
                />
              }
              label={<Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>Письма о старте недельного конкурса</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={emailFollowingAuthorPosts}
                  onChange={(_, v) => setEmailFollowingAuthorPosts(v)}
                  color="secondary"
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)" }}>
                  Письма о новых публичных работах авторов, на которых вы подписаны
                </Typography>
              }
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