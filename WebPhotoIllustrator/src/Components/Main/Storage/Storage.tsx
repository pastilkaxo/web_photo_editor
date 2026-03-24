import React, { useEffect, useState, useContext } from "react";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SendIcon from "@mui/icons-material/Send";
import {
    Box, Grid, Card, CardMedia, CardContent, Typography, CardActionArea,
    Dialog, DialogContent, CircularProgress, Alert, Rating, Stack
    , IconButton, TextField, List, ListItem, ListItemText, Divider, Pagination,
    FormControl, InputLabel, Select, MenuItem, SelectChangeEvent
} from "@mui/material";
import { observer } from "mobx-react-lite";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Context } from "../../..";
import { IComment } from "../../../models/IComment";
import { IProject } from "../../../models/IProject";
import ProjectService from "../../../Services/ProjectService";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS, ProjectCategory } from "../../../constants/projectCategories";

const Storage: React.FC = () => {
    const { store } = useContext(Context);
    const [projects, setProjects] = useState<IProject[]>([]);
    const [comments, setComments] = useState<IComment[]>([]);
    const [newComment, setNewComment] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState<"ALL" | ProjectCategory>("ALL");
    const [sortBy, setSortBy] = useState<"createdAt" | "updatedAt" | "stars" | "name">("createdAt");
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [openPreview, setOpenPreview] = useState(false);
    const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

    useEffect(() => {
        fetchPublicProjects();
    }, [page, search, category, sortBy, sortOrder]);

    const fetchPublicProjects = async () => {
        try {
            setLoading(true);
            const response = await ProjectService.getPublicProjects({
                page,
                limit: 12,
                search: search.trim(),
                category,
                sortBy,
                sortOrder
            });
            setProjects(response.data.items);
            setTotalPages(response.data.totalPages || 1);
        } catch (e: any) {
            setError(e.response?.data?.message || "Ошибка при загрузке проектов");
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
            alert("Не удалось загрузить комментарии");
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        try {
            const response = await ProjectService.toggleFavorite(projectId);
            store.user.favorites = response.data;
            setProjects([...projects]);
        } catch (e) {
            alert("Не удалось обновить избранное");
        }
    }

    const handleSendComment = async () => {
        if (!selectedProject || newComment.trim() === "") return;
        try {
            const response = await ProjectService.addComment(selectedProject._id, newComment);
            setComments([response.data, ...comments]);
            setNewComment("");
        } catch (e) {
            alert("Не удалось отправить комментарий");
        }
    }

    const handleDeleteMyComment = async (commentId: string) => {
        try {
            await ProjectService.deleteMyComment(commentId);
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (e) {
            alert("Не удалось удалить комментарий");
        }
    };

    const handleUpdateMyComment = async (commentId: string) => {
        const updatedText = prompt("Введите новый текст комментария:");
        if (updatedText === null || updatedText.trim() === "") return;
        try {
            await ProjectService.updateMyComments(commentId, updatedText);
            setComments(comments.map(comment =>
                comment._id === commentId ? { ...comment, text: updatedText } : comment
            ));
        } catch (e) {
            alert("Не удалось обновить комментарий");
        }
    };

    const handleDeleteAnyComment = async (commentId: string) => {
        try {
            await ProjectService.deleteAnyComment(commentId);
            setComments(comments.filter(comment => comment._id !== commentId));
        } catch (e) {
            alert("Не удалось удалить комментарий");
        }
    };

    const handleClosePreview = () => {
        setOpenPreview(false);
        setSelectedProject(null);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(event.target.value);
        setPage(1);
    };

    const handleCategoryChange = (event: SelectChangeEvent<string>) => {
        setCategory(event.target.value as "ALL" | ProjectCategory);
        setPage(1);
    };

    const handleSortByChange = (event: SelectChangeEvent<string>) => {
        setSortBy(event.target.value as "createdAt" | "updatedAt" | "stars" | "name");
        setPage(1);
    };

    const handleSortOrderChange = (event: SelectChangeEvent<string>) => {
        setSortOrder(event.target.value as "asc" | "desc");
        setPage(1);
    };

    const handleRateProject = async (projectId: string, newValue: number | null) => {
        if (newValue === null) return;
        try {
            await ProjectService.rateProject(projectId, newValue);
            alert(`Вы поставили ${newValue} звезд!`);
            fetchPublicProjects();
        } catch (e: any) {
            alert(`${e.response?.data?.message || "Не удалось поставить оценку"}`);
        }
    };


    if (error) {
        return <Box mt={2}><Alert severity="error">{error}</Alert></Box>;
    }

    return (
        <div style={{ padding: "20px" }}>
            <Box sx={{
                flexGrow: 1,
                p: { xs: 2.5, md: 4 },
                background: "rgba(255, 255, 255, 0.03)",
                borderRadius: 4,
                boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255, 255, 255, 0.08)"
            }}>
                <Typography variant="h4" gutterBottom component="div" sx={{ mb: 4, textAlign: "center", fontWeight: 900, color: "white", letterSpacing: "-0.01em" }}>
                    Публичная галерея
                </Typography>
                <Stack spacing={2} sx={{ mb: 4 }}>
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Поиск вдохновляющих проектов..."
                        value={search}
                        onChange={handleSearchChange}
                        sx={{
                            backgroundColor: "rgba(255, 255, 255, 0.05)",
                            borderRadius: 2,
                            "& .MuiOutlinedInput-root": {
                                color: "white",
                                "& fieldset": { borderColor: "rgba(255,255,255,0.15)" },
                                "&:hover fieldset": { borderColor: "rgba(255,255,255,0.3)" },
                            }
                        }}
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small" sx={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 2 }}>
                                <InputLabel id="category-filter-label" sx={{ color: "rgba(255,255,255,0.6)" }}>Категория</InputLabel>
                                <Select
                                    labelId="category-filter-label"
                                    value={category}
                                    label="Категория"
                                    onChange={handleCategoryChange}
                                    sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
                                >
                                    <MenuItem value="ALL">Все категории</MenuItem>
                                    {PROJECT_CATEGORIES.map((item) => (
                                        <MenuItem key={item} value={item}>{PROJECT_CATEGORY_LABELS[item]}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small" sx={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 2 }}>
                                <InputLabel id="sort-by-label" sx={{ color: "rgba(255,255,255,0.6)" }}>Сортировка</InputLabel>
                                <Select
                                    labelId="sort-by-label"
                                    value={sortBy}
                                    label="Сортировка"
                                    onChange={handleSortByChange}
                                    sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
                                >
                                    <MenuItem value="createdAt">По дате создания</MenuItem>
                                    <MenuItem value="updatedAt">По дате обновления</MenuItem>
                                    <MenuItem value="stars">По рейтингу</MenuItem>
                                    <MenuItem value="name">По имени</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 4 }}>
                            <FormControl fullWidth size="small" sx={{ backgroundColor: "rgba(255, 255, 255, 0.05)", borderRadius: 2 }}>
                                <InputLabel id="sort-order-label" sx={{ color: "rgba(255,255,255,0.6)" }}>Порядок</InputLabel>
                                <Select
                                    labelId="sort-order-label"
                                    value={sortOrder}
                                    label="Порядок"
                                    onChange={handleSortOrderChange}
                                    sx={{ color: "white", ".MuiOutlinedInput-notchedOutline": { borderColor: "rgba(255,255,255,0.15)" } }}
                                >
                                    <MenuItem value="desc">По убыванию</MenuItem>
                                    <MenuItem value="asc">По возрастанию</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                </Stack>
                {loading && (
                    <Box display="flex" justifyContent="center" my={2}>
                        <CircularProgress size={24} sx={{ color: "#a78bfa" }} />
                    </Box>
                )}

                <Grid container spacing={3}>
                    {projects.map((project) => {
                        const viewerId = store.user?.id ?? store.user?._id;
                        const isOwnProject =
                            viewerId != null && String(project.owner) === String(viewerId);
                        return (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project._id}>
                                <Card sx={{
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    borderRadius: 4,
                                    backgroundColor: "rgba(255, 255, 255, 0.04)",
                                    backdropFilter: "blur(10px)",
                                    border: "1px solid rgba(255, 255, 255, 0.08)",
                                    color: "white",
                                    transition: "all 0.3s ease",
                                    "&:hover": {
                                        transform: "translateY(-5px)",
                                        borderColor: "rgba(139,92,246,0.4)",
                                        boxShadow: "0 12px 32px rgba(0,0,0,0.3)"
                                    }
                                }}>
                                    <CardActionArea onClick={() => handleOpenPreview(project)}>
                                        <CardMedia
                                            component="img"
                                            height="200"
                                            image={project.previewImage}
                                            alt={project.name}
                                            sx={{ objectFit: "contain", background: "rgba(0,0,0,0.2)" }}
                                        />
                                        <IconButton
                                            onClick={(e) => handleToggleFavorite(e, project._id)}
                                            color="error"
                                            sx={{ position: "absolute", top: 8, right: 8, zIndex: 10, bgcolor: "rgba(0,0,0,0.4)", "&:hover": { bgcolor: "rgba(0,0,0,0.6)" } }}
                                        >
                                            {store.user.favorites.includes(project._id) ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                                        </IconButton>
                                    </CardActionArea>
                                    <CardContent sx={{ flexGrow: 1 }}>
                                        <Typography gutterBottom variant="h6" component="div" sx={{ fontWeight: 700 }} noWrap>
                                            {project.name || "Без названия"}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                                            Создано: {new Date(project.createdAt).toLocaleDateString()}
                                        </Typography>
                                        <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)" }}>
                                            Категория: {PROJECT_CATEGORY_LABELS[(project.category || "OTHER") as ProjectCategory]}
                                        </Typography>
                                        <Stack spacing={1} mt={1}>
                                            {!isOwnProject ? <>
                                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Оцените работу:</Typography>
                                                <Rating
                                                    name={`rating-${project._id}`}
                                                    defaultValue={(project.stars || 0)}
                                                    onChange={(event, newValue) => {
                                                        handleRateProject(project._id, newValue);
                                                    }}
                                                    sx={{ "& .MuiRating-iconEmpty": { color: "rgba(255,255,255,0.2)" } }}
                                                />
                                            </> : null}
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Рейтинг:</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#fcd34d" }}>{(project.stars / (project.ratedBy?.length || 1)).toFixed(1)} ★</Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        );
                    })}
                </Grid>

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
                                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
                                                Автор: <span style={{ color: "#a78bfa" }}>{selectedProject.ownerName || "Аноним"}</span>
                                            </Typography>
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
                <Box display="flex" justifyContent="center" mt={4}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, nextPage) => setPage(nextPage)}
                        color="primary"
                        shape="rounded"
                        sx={{
                            "& .MuiPaginationItem-root": { color: "#fff" },
                            "& .Mui-selected": { bgcolor: "rgba(167, 139, 250, 0.3) !important" },
                            "& .MuiPaginationItem-icon": { color: "#fff" }
                        }}
                    />
                </Box>
            </Box>
        </div>
    );
};

export default observer(Storage);