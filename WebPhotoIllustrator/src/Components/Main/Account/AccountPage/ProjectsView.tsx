import React, { useContext, useEffect, useState, useRef } from "react";

import DeleteIcon from "@mui/icons-material/Delete";
import ShareIcon from "@mui/icons-material/Share";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ForumIcon from "@mui/icons-material/Forum";
import SendIcon from "@mui/icons-material/Send";
import EditIcon from "@mui/icons-material/Edit";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Container from "@mui/material/Container";
import Pagination from "@mui/material/Pagination";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { observer } from "mobx-react-lite";
import { useNavigate } from "react-router-dom";
import { GearIcon } from "sebikostudio-icons"


import { Context } from "../../../../index";
import { IProject } from "../../../../models/IProject";
import { IComment } from "../../../../models/IComment";
import { AuthorNameLink } from "../../../AuthorNameLink";
import ProjectService from "../../../../Services/ProjectService";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS, ProjectCategory } from "../../../../constants/projectCategories";
import { buildFabricProjectPayloadFromImageFile } from "../../../../utils/buildFabricProjectFromImage";

const MAX_PROJECT_PHOTO_BYTES = 25 * 1024 * 1024;

interface ProjectsViewProps {
  standalone?: boolean;
}

function ProjectsView({ standalone = false }: ProjectsViewProps) {
  const { store } = useContext(Context);
  const [projects, setProjects] = useState<IProject[]>([]);
  const navigate = useNavigate();
  const projectPhotoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination
  const [page, setPage] = useState(1);
  const projectsPerPage = 6;

  // Edit Meta State
  const [editingProject, setEditingProject] = useState<IProject | null>(null);
  const [editName, setEditName] = useState("");
  const [editVisibility, setEditVisibility] = useState<"PRIVATE" | "PUBLIC">("PRIVATE");
  const [editCategory, setEditCategory] = useState<ProjectCategory>("OTHER");
  const [savingMeta, setSavingMeta] = useState(false);

  // Preview / Comments State
  const [openPreview, setOpenPreview] = useState(false);
  const [selectedProject, setSelectedProject] = useState<IProject | null>(null);
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    if (store.isAuth) {
      fetchProjects();
    }
  }, [store.isAuth]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await ProjectService.fetchMyProjects();
      setProjects(response.data);
    } catch (err: any) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Вы уверены, что хотите удалить этот проект?")) {
      try {
        await ProjectService.deleteProject(id);
        setProjects(projects.filter(p => p._id !== id));
      } catch (e) {
        alert("Ошибка при удалении");
      }
    }
  }

  const handleOpenProject = (id: string) => {
    navigate(`/editor/${id}`);
  }

  const copyProjectLink = async (project: IProject) => {
    const shareUrl = `${window.location.origin}/editor/${project._id}`;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        alert("Ссылка на проект скопирована!");
      } else {
        window.prompt("Скопируйте ссылку:", shareUrl);
      }
    } catch (err) {
      window.prompt("Скопируйте ссылку:", shareUrl);
    }
  };

  const handleShareProject = async (project: IProject, e: React.MouseEvent) => {
    e.stopPropagation();
    await copyProjectLink(project);
  };

  const handleOpenEditMeta = (project: IProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProject(project);
    setEditName(project.name || "");
    setEditVisibility(project.visibility);
    setEditCategory((project.category || "OTHER") as ProjectCategory);
  };

  const handleOpenComments = async (project: IProject, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedProject(project);
    setOpenPreview(true);
    try {
      const response = await ProjectService.getComments(project._id);
      setComments(response.data);
    } catch (e) {
      console.error("Не удалось загрузить комментарии");
    }
  };

  const handleSaveMeta = async () => {
    if (!editingProject) return;
    const normalizedName = editName.trim();
    if (!normalizedName) {
      alert("Название проекта не может быть пустым");
      return;
    }
    try {
      setSavingMeta(true);
      const response = await ProjectService.updateProjectMeta(editingProject._id, {
        name: normalizedName,
        visibility: editVisibility,
        category: editCategory
      });
      setProjects((prev) => prev.map((project) => project._id === editingProject._id ? response.data : project));
      setEditingProject(null);
    } catch (e: any) {
      alert(e.response?.data?.message || "Не удалось обновить проект");
    } finally {
      setSavingMeta(false);
    }
  };

  const handleDeleteAnyComment = async (commentId: string) => {
    if (!window.confirm("Удалить комментарий (Админ)?")) return;
    try {
      await ProjectService.deleteAnyComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (e) {
      alert("Ошибка при удалении");
    }
  };

  // Comments Logic
  const handleSendComment = async () => {
    if (!selectedProject || newComment.trim() === "") return;
    try {
      const response = await ProjectService.addComment(selectedProject._id, newComment);
      setComments([response.data, ...comments]);
      setNewComment("");
    } catch (e) {
      alert("Не удалось отправить комментарий");
    }
  };

  const handleDeleteMyComment = async (commentId: string) => {
    if (!window.confirm("Удалить комментарий?")) return;
    try {
      await ProjectService.deleteMyComment(commentId);
      setComments(comments.filter(c => c._id !== commentId));
    } catch (e) {
      alert("Ошибка при удалении");
    }
  };

  const handleUpdateMyComment = async (commentId: string) => {
    const text = prompt("Изменить комментарий:", comments.find(c => c._id === commentId)?.text);
    if (!text || text.trim() === "") return;
    try {
      await ProjectService.updateMyComments(commentId, text);
      setComments(comments.map(c => c._id === commentId ? { ...c, text } : c));
    } catch (e) {
      alert("Ошибка при обновлении");
    }
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleProjectPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!store.isAuth) {
      alert("Войдите в аккаунт, чтобы загрузить фото.");
      return;
    }
    if (file.size > MAX_PROJECT_PHOTO_BYTES) {
      alert("Файл слишком большой. Максимум 25 МБ.");
      return;
    }
    setUploadingPhoto(true);
    try {
      const { json, previewImage, suggestedName } = await buildFabricProjectPayloadFromImageFile(file);
      const response = await ProjectService.createProject(
        suggestedName,
        json,
        "PRIVATE",
        previewImage,
        "OTHER"
      );
      await fetchProjects();
      navigate(`/editor/${response.data._id}`);
    } catch (e: any) {
      const msg =
        e?.message ||
        e?.response?.data?.message ||
        "Не удалось загрузить фото. Попробуйте другой файл.";
      alert(msg);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const paginatedProjects = projects.slice((page - 1) * projectsPerPage, page * projectsPerPage);
  const totalPages = Math.ceil(projects.length / projectsPerPage);

  return (
    <Box sx={{
      flex: 1,
      width: "100%",
      p: standalone ? { xs: 2.5, md: 5 } : 0,
      minHeight: standalone ? "100vh" : "auto"
    }}>
      <Container maxWidth="xl" sx={{ p: 0 }}>
        <Box sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
          mb: 4,
          flexDirection: { xs: "column", md: "row" }
        }}>
          <Box>
            <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 900, color: "white", letterSpacing: "-0.01em" }}>
              Мои проекты
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mb: 0 }}>
              Управляйте своими работами, контролируйте приватность и делитесь результатом.
            </Typography>
          </Box>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }}>
            <Chip label={`Всего: ${projects.length}`} sx={{ fontWeight: 700, bgcolor: "rgba(167, 139, 250, 0.15)", color: "#c4b5fd", border: "1px solid rgba(167, 139, 250, 0.3)", alignSelf: { xs: "flex-start", sm: "center" } }} />
            {store.isAuth ? (
              <>
                <input
                  ref={projectPhotoInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleProjectPhotoSelected}
                />
                <Button
                  variant="contained"
                  startIcon={<PhotoCameraOutlinedIcon />}
                  disabled={uploadingPhoto}
                  onClick={() => projectPhotoInputRef.current?.click()}
                  sx={{
                    borderRadius: 3,
                    textTransform: "none",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                    boxShadow: "0 8px 24px rgba(79, 70, 229, 0.35)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #6d28d9 0%, #4338ca 100%)",
                    },
                  }}
                >
                  {uploadingPhoto ? "Загрузка…" : "Загрузить фото"}
                </Button>
              </>
            ) : null}
          </Stack>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={32} sx={{ color: "#a78bfa" }} />
          </Box>
        ) : projects.length === 0 ? (
          <Typography sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
            У вас пока нет проектов. Создайте новый в редакторе или нажмите «Загрузить фото» выше.
          </Typography>
        ) : (
          <>
            <Grid container spacing={3}>
              {paginatedProjects.map((project) => (
                <Grid key={project._id} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      borderRadius: 3,
                      overflow: "hidden",
                      background: "rgba(255, 255, 255, 0.04)",
                      backdropFilter: "blur(10px)",
                      color: "#fff",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      border: "1px solid rgba(255, 255, 255, 0.08)",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
                        transform: "translateY(-4px)",
                        borderColor: "rgba(167, 139, 250, 0.4)",
                        background: "rgba(255, 255, 255, 0.06)"
                      }
                    }}
                    onClick={() => handleOpenProject(project._id)}
                  >
                    <CardMedia
                      component="img"
                      height="160"
                      image={project.previewImage || "https://via.placeholder.com/900x600?text=No+Preview"}
                      alt={project.name}
                      sx={{ objectFit: "contain", background: "rgba(0,0,0,0.15)" }}
                    />
                    <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "start", mb: 1.5 }}>
                        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#fff", lineHeight: 1.2 }}>
                          {project.name || "Без названия"}
                        </Typography>
                        <Chip
                          label={project.visibility}
                          variant="outlined"
                          size="small"
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            height: 20,
                            borderColor: project.visibility === "PUBLIC" ? "rgba(16, 185, 129, 0.4)" : "rgba(255,255,255,0.2)",
                            color: project.visibility === "PUBLIC" ? "#6ee7b7" : "rgba(255,255,255,0.6)"
                          }}
                        />
                      </Box>
                      <Stack spacing={0.5}>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", display: "block" }}>
                          Обновлено: {new Date(project.updatedAt).toLocaleDateString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", display: "block" }}>
                          Категория: {PROJECT_CATEGORY_LABELS[(project.category || "OTHER") as ProjectCategory]}
                        </Typography>
                      </Stack>
                    </CardContent>
                    <CardActions sx={{ px: 2, pb: 2, pt: 0, justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={0.5}>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenEditMeta(project, e)}
                          title="Настройки"
                          sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}
                        >
                          <GearIcon style={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenComments(project, e)}
                          title="Комментарии"
                          sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#a78bfa", bgcolor: "rgba(167, 139, 250, 0.1)" } }}
                        >
                          <ForumIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={(e) => handleShareProject(project, e)}
                          title="Поделиться"
                          sx={{ color: "rgba(255,255,255,0.6)", "&:hover": { color: "#fff", bgcolor: "rgba(255,255,255,0.1)" } }}
                        >
                          <ShareIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Stack>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => handleDelete(project._id, e)}
                        title="Удалить"
                        sx={{ opacity: 0.6, "&:hover": { opacity: 1, bgcolor: "rgba(239, 68, 68, 0.1)" } }}
                      >
                        <DeleteIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {totalPages > 1 && (
              <Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  sx={{
                    "& .MuiPaginationItem-root": { color: "rgba(255,255,255,0.6)" },
                    "& .Mui-selected": { bgcolor: "rgba(167, 139, 250, 0.3) !important", color: "#fff" },
                    "& .MuiPaginationItem-ellipsis": { color: "rgba(255,255,255,0.3)" }
                  }}
                />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Edit Meta Dialog */}
      <Dialog
        open={!!editingProject}
        onClose={() => setEditingProject(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            bgcolor: "#1e293b",
            backgroundImage: "none",
            color: "#fff",
            borderRadius: 3
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Редактирование проекта</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 3, pt: 2 }}>
          <TextField
            label="Название проекта"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            fullWidth
            variant="outlined"
            sx={{
              mt: 1,
              "& .MuiOutlinedInput-root": { color: "#fff", bgcolor: "rgba(255,255,255,0.05)" },
              "& .MuiInputLabel-root": { color: "rgba(255,255,255,0.6)" }
            }}
          />
          <FormControl fullWidth>
            <InputLabel id="visibility-edit-label" sx={{ color: "rgba(255,255,255,0.6)" }}>Видимость</InputLabel>
            <Select
              labelId="visibility-edit-label"
              value={editVisibility}
              label="Видимость"
              onChange={(e) => setEditVisibility(e.target.value as "PRIVATE" | "PUBLIC")}
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.05)",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }
              }}
            >
              <MenuItem value="PRIVATE">Приватный</MenuItem>
              <MenuItem value="PUBLIC">Публичный</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel id="category-edit-label" sx={{ color: "rgba(255,255,255,0.6)" }}>Категория</InputLabel>
            <Select
              labelId="category-edit-label"
              value={editCategory}
              label="Категория"
              onChange={(e) => setEditCategory(e.target.value as ProjectCategory)}
              sx={{
                color: "#fff",
                bgcolor: "rgba(255,255,255,0.05)",
                "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.1)" }
              }}
            >
              {PROJECT_CATEGORIES.map((category) => (
                <MenuItem key={category} value={category}>
                  {PROJECT_CATEGORY_LABELS[category]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {editingProject && (
            <Box sx={{ p: 2, bgcolor: "rgba(0,0,0,0.2)", borderRadius: 2, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis" }}>
                {`${window.location.origin}/editor/${editingProject._id}`}
              </Typography>
              <Button
                size="small"
                startIcon={<ContentCopyIcon />}
                onClick={() => copyProjectLink(editingProject)}
                sx={{ color: "#a78bfa", textTransform: "none" }}
              >
                Копировать
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditingProject(null)} sx={{ color: "rgba(255,255,255,0.6)", textTransform: "none" }}>Отмена</Button>
          <Button
            onClick={handleSaveMeta}
            disabled={savingMeta}
            variant="contained"
            sx={{
              bgcolor: "#a78bfa",
              fontWeight: 700,
              textTransform: "none",
              "&:hover": { bgcolor: "#8b5cf6" }
            }}
          >
            {savingMeta ? "Сохранение..." : "Сохранить изменения"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Global Side-Panel Preview / Comments Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="md" fullWidth
        PaperProps={{
          sx: {
            bgcolor: "#0f172a",
            backgroundImage: "none",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.08)",
            overflow: "hidden"
          }
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          {selectedProject && (
            <Grid container>
              <Grid size={{ xs: 12, md: 7 }} sx={{ bgcolor: "#000", display: "flex", alignItems: "center", justifyContent: "center", minHeight: { xs: 300, md: "auto" } }}>
                <img
                  src={selectedProject.previewImage || "https://via.placeholder.com/800x600?text=No+Preview"}
                  alt={selectedProject.name}
                  style={{ width: "100%", maxHeight: "80vh", objectFit: "contain" }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 5 }} sx={{ display: "flex", flexDirection: "column", height: { md: "80vh" } }}>
                <Box sx={{ p: 3, flexGrow: 1, display: "flex", flexDirection: "column", maxHeight: "100%" }}>
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ color: "#fff", fontWeight: 800, mb: 0.5 }}>{selectedProject.name || "Без названия"}</Typography>
                    <AuthorNameLink
                      ownerId={selectedProject.owner}
                      ownerName={selectedProject.ownerName || "Аноним"}
                    />
                  </Box>

                  <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                  <Typography variant="subtitle2" sx={{ color: "#fff", fontWeight: 700, mb: 2 }}>Комментарии пользователей</Typography>

                  <List sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    mb: 2,
                    "&::-webkit-scrollbar": { width: 6 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(255,255,255,0.1)", borderRadius: 10 }
                  }}>
                    {comments.length === 0 ? (
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.4)", textAlign: "center", py: 4 }}>Пока нет комментариев</Typography>
                    ) : comments.map((c) => (
                      <ListItem key={c._id} sx={{ px: 0, py: 1.5, alignItems: "flex-start" }}>
                        <ListItemText
                          primary={
                            <Typography variant="caption" sx={{ color: "#a78bfa", fontWeight: 700 }}>
                              {c.author?.email || "Пользователь"}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" sx={{ color: "#fff", mt: 0.5 }}>{c.text}</Typography>
                              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.3)", fontSize: "0.7rem" }}>
                                {new Date(c.createdAt).toLocaleString()}
                              </Typography>
                            </Box>
                          }
                        />
                        <Box sx={{ display: "flex", gap: 0.5 }}>
                          {c.author?._id === store.user.id && (
                            <IconButton size="small" onClick={() => handleUpdateMyComment(c._id)} sx={{ color: "rgba(255,255,255,0.4)", "&:hover": { color: "#fbbf24" } }}>
                              <EditIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                          {(c.author?._id === store.user.id || store.user.roles.includes("ADMIN")) && (
                            <IconButton size="small" onClick={() => c.author?._id === store.user.id ? handleDeleteMyComment(c._id) : handleDeleteAnyComment(c._id)} color="error" sx={{ opacity: 0.4, "&:hover": { opacity: 1 } }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          )}
                        </Box>
                      </ListItem>
                    ))}
                  </List>

                  <Divider sx={{ mb: 2, borderColor: "rgba(255,255,255,0.08)" }} />

                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      fullWidth size="small"
                      placeholder="Ответить..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      sx={{
                        "& .MuiOutlinedInput-root": { bgcolor: "rgba(255,255,255,0.05)", color: "#fff", borderRadius: 2 },
                        "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" }
                      }}
                    />
                    <IconButton onClick={handleSendComment} sx={{ bgcolor: "#a78bfa", color: "#fff", "&:hover": { bgcolor: "#8b5cf6" } }}>
                      <SendIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  )
}

export default observer(ProjectsView);
