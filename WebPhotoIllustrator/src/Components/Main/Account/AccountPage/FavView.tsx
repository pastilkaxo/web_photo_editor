import React, { useEffect, useState, useContext } from "react";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SendIcon from "@mui/icons-material/Send";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
    Box, Grid, Card, CardMedia, CardContent, Typography, CardActionArea,
    Dialog, DialogContent, CircularProgress, Alert, Rating, Stack,
    IconButton, TextField, List, ListItem, ListItemText, Divider, Chip
} from "@mui/material";
import { observer } from "mobx-react-lite";

import { Context } from "../../../..";
import { IComment } from "../../../../models/IComment";
import { IProject } from "../../../../models/IProject";
import { AuthorNameLink } from "../../../AuthorNameLink";
import ProjectService from "../../../../Services/ProjectService";
import { useAppDialog } from "../../../../context/AppDialogContext";

const FavView: React.FC = () => {
    const { store } = useContext(Context);
    const { alert: dialogAlert, prompt: dialogPrompt } = useAppDialog();
    const [projects, setProjects] = useState<IProject[]>([]);
    const [comments, setComments] = useState<IComment[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [openPreview, setOpenPreview] = useState(false);
    const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

    useEffect(() => {
        fetchFavoriteProjects();
    }, [store.user.favorites]);

    const fetchFavoriteProjects = async () => {
        try {
            setLoading(true);
            const response = await ProjectService.getPublicProjects();
            const publicProjects = response.data.items || [];
            const favProjects = publicProjects.filter((p: IProject) => store.user.favorites.includes(p._id));
            setProjects(favProjects);
            setError("");
        } catch (e: any) {
            setError(e.response?.data?.message || "Ошибка при загрузке избранного");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPreview = async (project: IProject) => {
        setSelectedProject(project);
        setOpenPreview(true);
        try {
            const response = await ProjectService.getComments(project._id);
            setComments(response.data);
        } catch (e) {
            console.error("Не удалось загрузить комментарии");
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        try {
            const response = await ProjectService.toggleFavorite(projectId);
            store.user.favorites = response.data;
            setProjects(projects.filter(p => p._id !== projectId));
        } catch (e) {
            void dialogAlert("Не удалось обновить избранное");
        }
    }

    const handleSendComment = async () => {
        if (!selectedProject || newComment.trim() === "") return;
        try {
            const response = await ProjectService.addComment(selectedProject._id, newComment);
            setComments([response.data, ...comments]);
            setNewComment("");
        } catch (e) {
            void dialogAlert("Не удалось отправить комментарий");
        }
    }

    const handleDeleteMyComment = async (commentId: string) => {
        try {
            await ProjectService.deleteMyComment(commentId);
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (e) {
            void dialogAlert("Не удалось удалить комментарий");
        }
    };

    const handleUpdateMyComment = async (commentId: string) => {
        const current = comments.find((c) => c._id === commentId)?.text ?? "";
        const updatedText = await dialogPrompt("Введите новый текст комментария:", {
            title: "Редактирование",
            defaultValue: current,
            multiline: true,
        });
        if (updatedText === null || updatedText.trim() === "") return;
        try {
            await ProjectService.updateMyComments(commentId, updatedText.trim());
            setComments(comments.map(comment =>
                comment._id === commentId ? { ...comment, text: updatedText.trim() } : comment
            ));
        } catch (e) {
            void dialogAlert("Не удалось обновить комментарий");
        }
    };

    const handleDeleteAnyComment = async (commentId: string) => {
        try {
            await ProjectService.deleteAnyComment(commentId);
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (e) {
            void dialogAlert("Не удалось удалить комментарий");
        }
    };

    const handleClosePreview = () => {
        setOpenPreview(false);
        setSelectedProject(null);
    };

    const handleRateProject = async (projectId: string, newValue: number | null) => {
        if (newValue === null) return;
        try {
            await ProjectService.rateProject(projectId, newValue);
        } catch (e: any) {
            void dialogAlert(`${e.response?.data?.message || "Не удалось поставить оценку"}`);
        }
    };

    if (loading && projects.length === 0) {
        return <Box display="flex" justifyContent="center" py={8}><CircularProgress sx={{ color: "#a78bfa" }} /></Box>;
    }

    if (error) {
        return <Box mt={2}><Alert severity="error" variant="filled">{error}</Alert></Box>;
    }

    return (
        <Box sx={{ flexGrow: 1, p: { xs: 1, md: 1 } }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", md: "center" }, gap: 2, mb: 4, flexDirection: { xs: "column", md: "row" } }}>
                <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ color: "white", letterSpacing: "-0.01em" }}>
                        Избранное
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                        Ваши любимые проекты других авторов и вдохновение.
                    </Typography>
                </Box>
                <Chip label={`Сохранено: ${projects.length}`} sx={{ fontWeight: 700, bgcolor: "rgba(244, 63, 94, 0.15)", color: "#fda4af", border: "1px solid rgba(244, 63, 94, 0.3)" }} />
            </Box>

            {projects.length === 0 ? (
                <Typography sx={{ py: 8, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
                    У вас пока нет избранных проектов.
                </Typography>
            ) : (
                <Grid container spacing={3}>
                    {projects.map((project) => (
                        <Grid key={project._id} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Card sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                borderRadius: 3,
                                overflow: "hidden",
                                background: "rgba(255, 255, 255, 0.04)",
                                backdropFilter: "blur(10px)",
                                color: "#fff",
                                border: "1px solid rgba(255, 255, 255, 0.08)",
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                "&:hover": {
                                    boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
                                    transform: "translateY(-4px)",
                                    borderColor: "rgba(244, 63, 94, 0.4)"
                                }
                            }}>
                                <CardActionArea onClick={() => handleOpenPreview(project)}>
                                    <CardMedia
                                        component="img"
                                        height="160"
                                        image={project.previewImage || "https://via.placeholder.com/600x400?text=No+Preview"}
                                        alt={project.name}
                                        sx={{ objectFit: "contain", background: "rgba(0,0,0,0.15)" }}
                                    />
                                    <IconButton
                                        onClick={(e) => handleToggleFavorite(e, project._id)}
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            zIndex: 10,
                                            bgcolor: "rgba(244, 63, 94, 0.2)",
                                            backdropFilter: "blur(4px)",
                                            color: "#fda4af",
                                            "&:hover": { bgcolor: "rgba(244, 63, 94, 0.4)" }
                                        }}
                                    >
                                        <FavoriteIcon sx={{ fontSize: 20 }} />
                                    </IconButton>
                                </CardActionArea>
                                <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                                    <Typography gutterBottom variant="subtitle1" fontWeight={800} sx={{ color: "#fff" }} noWrap>
                                        {project.name || "Без названия"}
                                    </Typography>
                                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                                        <Box>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)", display: "block", mb: 0.5 }}>Ваша оценка:</Typography>
                                            <Rating
                                                name={`rating-${project._id}`}
                                                defaultValue={project.stars || 0}
                                                size="small"
                                                onChange={(event, newValue) => {
                                                    handleRateProject(project._id, newValue);
                                                }}
                                                sx={{
                                                    "& .MuiRating-iconFilled": { color: "#fcd34d" },
                                                    "& .MuiRating-iconEmpty": { color: "rgba(255,255,255,0.2)" }
                                                }}
                                            />
                                        </Box>
                                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                                            Ср. оценка: <span style={{ color: "#fff", fontWeight: 700 }}>{project.stars / (project.ratedBy?.length || 1) || 0}</span>
                                        </Typography>
                                    </Stack>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}

            <Dialog open={openPreview} onClose={handleClosePreview} maxWidth="md" fullWidth
                PaperProps={{
                    sx: {
                        bgcolor: "#0f172a",
                        backgroundImage: "none",
                        borderRadius: 3,
                        border: "1px solid rgba(255,255,255,0.08)"
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
    );
};

export default observer(FavView);