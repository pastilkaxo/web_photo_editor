import React, { useEffect, useState, useContext, useRef } from "react";

import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import SendIcon from "@mui/icons-material/Send";
import PhotoCameraOutlinedIcon from "@mui/icons-material/PhotoCameraOutlined";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import EmojiEventsOutlinedIcon from "@mui/icons-material/EmojiEventsOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
    Box, Grid, Card, CardMedia, CardContent, Typography, CardActionArea,
    Dialog, DialogContent, CircularProgress, Alert, Rating, Stack
    , IconButton, TextField, List, ListItem, ListItemText, Divider, Pagination,
    FormControl, InputLabel, Select, MenuItem, SelectChangeEvent, Button, Tooltip,
    Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Switch, Chip
} from "@mui/material";
import { observer } from "mobx-react-lite";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import { Link, useNavigate } from "react-router-dom";
import { Context } from "../../..";
import { IComment } from "../../../models/IComment";
import { IProject } from "../../../models/IProject";
import { AuthorNameLink } from "../../AuthorNameLink";
import ProjectService from "../../../Services/ProjectService";
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS, ProjectCategory } from "../../../constants/projectCategories";
import { buildFabricProjectPayloadFromImageFile } from "../../../utils/buildFabricProjectFromImage";
import ContestService, { IContestState } from "../../../Services/ContestService";
import { contestPhaseDescription } from "../../../utils/contestLabels";
import { useAppDialog } from "../../../context/AppDialogContext";

const MAX_GALLERY_PHOTO_BYTES = 25 * 1024 * 1024;

function projectRatingStats(project: IProject, viewerId?: string | null) {
    const votes = project.starVotes || [];
    const count = votes.length;
    const rated = project.ratedBy || [];
    const legacyCount = rated.length;
    const sumLegacy = project.stars || 0;
    let avg = 0;
    if (count > 0) {
        avg = votes.reduce((a, v) => a + v.stars, 0) / count;
    } else if (legacyCount > 0) {
        avg = sumLegacy / legacyCount;
    }
    const voted =
        viewerId != null &&
        (rated.some((id) => String(id) === String(viewerId)) ||
            votes.some((v) => String(v.user) === String(viewerId)));
    return { avg, count, legacyCount, voted };
}

const Storage: React.FC = () => {
    const { store } = useContext(Context);
    const navigate = useNavigate();
    const { alert: dialogAlert, prompt: dialogPrompt } = useAppDialog();
    const [contestBusy, setContestBusy] = useState(false);
    const galleryPhotoInputRef = useRef<HTMLInputElement>(null);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
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
    const [contestState, setContestState] = useState<IContestState | null>(null);
    const [contestOnly, setContestOnly] = useState(false);

    const [openPreview, setOpenPreview] = useState(false);
    const [selectedProject, setSelectedProject] = useState<IProject | null>(null);

    useEffect(() => {
        ContestService.getState()
            .then((r) => setContestState(r.data))
            .catch(() => setContestState(null));
    }, []);

    useEffect(() => {
        fetchPublicProjects();
    }, [page, search, category, sortBy, sortOrder, contestOnly, contestState?.weekId]);

    const fetchPublicProjects = async () => {
        try {
            setLoading(true);
            const dow = new Date().getDay();
            const weekend = dow === 0 || dow === 6;
            const response = await ProjectService.getPublicProjects({
                page,
                limit: 12,
                search: search.trim(),
                category,
                sortBy,
                sortOrder,
                contestWeekId:
                    contestOnly && contestState?.weekId ? contestState.weekId : undefined,
                prioritizeContest: weekend ? "true" : undefined,
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
            void dialogAlert("Не удалось загрузить комментарии");
        }
    };

    const handleToggleFavorite = async (e: React.MouseEvent, projectId: string) => {
        e.stopPropagation();
        try {
            const response = await ProjectService.toggleFavorite(projectId);
            store.user.favorites = response.data;
            setProjects([...projects]);
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
            void dialogAlert(`Вы поставили ${newValue} звёзд!`);
            await fetchPublicProjects();
            if (selectedProject?._id === projectId) {
                setSelectedProject((prev) =>
                    prev && prev._id === projectId
                        ? {
                              ...prev,
                              ratedBy: [...(prev.ratedBy || []), String(store.user.id ?? store.user._id)],
                              starVotes: [
                                  ...(prev.starVotes || []),
                                  {
                                      user: String(store.user.id ?? store.user._id),
                                      stars: newValue,
                                  },
                              ],
                              stars: (prev.stars || 0) + newValue,
                          }
                        : prev
                );
            }
        } catch (e: any) {
            void dialogAlert(`${e.response?.data?.message || "Не удалось поставить оценку"}`);
        }
    };

    const handleSubmitContest = async () => {
        if (!selectedProject || contestBusy) return;
        setContestBusy(true);
        try {
            await ContestService.submitToContest(selectedProject._id);
            await dialogAlert("Работа отправлена на конкурс!");
            await fetchPublicProjects();
            handleClosePreview();
        } catch (e: any) {
            void dialogAlert(e.response?.data?.message || "Не удалось отправить на конкурс");
        } finally {
            setContestBusy(false);
        }
    };

    const handleWithdrawContest = async () => {
        if (!selectedProject || contestBusy) return;
        setContestBusy(true);
        try {
            await ContestService.withdrawFromContest(selectedProject._id);
            await dialogAlert("Заявка на конкурс отозвана.");
            setSelectedProject((prev) =>
                prev
                    ? {
                          ...prev,
                          contestSubmission: { weekId: null, submittedAt: null },
                      }
                    : null
            );
            await fetchPublicProjects();
        } catch (e: any) {
            void dialogAlert(e.response?.data?.message || "Не удалось отозвать заявку");
        } finally {
            setContestBusy(false);
        }
    };

    const handleReportProject = async () => {
        if (!selectedProject) return;
        const reason =
            (await dialogPrompt("Кратко опишите нарушение (необязательно):", {
                title: "Жалоба на работу",
                multiline: true,
            })) ?? "";
        try {
            await ContestService.reportProject(selectedProject._id, reason);
            void dialogAlert("Жалоба отправлена.");
        } catch (e: any) {
            void dialogAlert(e.response?.data?.message || "Не удалось отправить жалобу");
        }
    };

    const handleGalleryPhotoSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;
        if (!store.isAuth) {
            void dialogAlert("Войдите в аккаунт, чтобы загрузить фото.");
            return;
        }
        if (file.size > MAX_GALLERY_PHOTO_BYTES) {
            void dialogAlert("Файл слишком большой. Максимум 25 МБ.");
            return;
        }
        setUploadingPhoto(true);
        try {
            const { json, previewImage, suggestedName } = await buildFabricProjectPayloadFromImageFile(file);
            const response = await ProjectService.createProject(
                suggestedName,
                json,
                "PUBLIC",
                previewImage,
                "OTHER"
            );
            await fetchPublicProjects();
            navigate(`/editor/${response.data._id}`);
        } catch (e: any) {
            const msg =
                e?.message ||
                e?.response?.data?.message ||
                "Не удалось загрузить фото. Попробуйте другой файл.";
            void dialogAlert(msg);
        } finally {
            setUploadingPhoto(false);
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
                <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={2}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ mb: 4 }}
                >
                    <Typography variant="h4" component="div" sx={{ textAlign: "center", fontWeight: 900, color: "white", letterSpacing: "-0.01em" }}>
                        Публичная галерея
                    </Typography>
                    {store.isAuth ? (
                        <>
                            <input
                                ref={galleryPhotoInputRef}
                                type="file"
                                accept="image/*"
                                hidden
                                onChange={handleGalleryPhotoSelected}
                            />
                            <Button
                                variant="contained"
                                startIcon={<PhotoCameraOutlinedIcon />}
                                disabled={uploadingPhoto}
                                onClick={() => galleryPhotoInputRef.current?.click()}
                                sx={{
                                    borderRadius: 3,
                                    textTransform: "none",
                                    fontWeight: 700,
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
                    ) : (
                        <Tooltip title="Войдите, чтобы добавить работу в галерею">
                            <span>
                                <Button variant="outlined" disabled sx={{ borderRadius: 3, textTransform: "none", borderColor: "rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.4)" }}>
                                    Загрузить фото
                                </Button>
                            </span>
                        </Tooltip>
                    )}
                </Stack>

                <Stack spacing={2} sx={{ mb: 3 }}>
                    {contestState && (
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid rgba(167,139,250,0.35)",
                                background: "rgba(124,58,237,0.12)",
                            }}
                        >
                            <Stack
                                direction={{ xs: "column", sm: "row" }}
                                spacing={2}
                                alignItems={{ sm: "center" }}
                                justifyContent="space-between"
                            >
                                <Box>
                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap" useFlexGap>
                                        <EmojiEventsOutlinedIcon sx={{ color: "#fcd34d" }} />
                                        <Typography variant="subtitle1" sx={{ color: "#fff", fontWeight: 800 }}>
                                            Конкурс недели #{contestState.weekIndex}
                                        </Typography>
                                        <Chip
                                            label={contestState.theme}
                                            size="small"
                                            sx={{ bgcolor: "rgba(255,255,255,0.1)", color: "#e9d5ff" }}
                                        />
                                    </Stack>
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.65)", mt: 0.5 }}>
                                        {contestPhaseDescription(contestState.phase)}
                                    </Typography>
                                </Box>
                                <Button
                                    component={Link}
                                    to="/hall-of-fame"
                                    variant="outlined"
                                    sx={{
                                        borderColor: "rgba(255,255,255,0.25)",
                                        color: "#fff",
                                        textTransform: "none",
                                        flexShrink: 0,
                                    }}
                                >
                                    Зал славы
                                </Button>
                            </Stack>
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={contestOnly}
                                        onChange={(_, v) => {
                                            setContestOnly(v);
                                            setPage(1);
                                        }}
                                        color="secondary"
                                    />
                                }
                                label={
                                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)" }}>
                                        Только работы текущего конкурса
                                    </Typography>
                                }
                                sx={{ mt: 1 }}
                            />
                        </Box>
                    )}
                    <Accordion
                        elevation={0}
                        sx={{
                            bgcolor: "rgba(255,255,255,0.04)",
                            color: "#fff",
                            borderRadius: 2,
                            border: "1px solid rgba(255,255,255,0.08)",
                            "&:before": { display: "none" },
                        }}
                    >
                        <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: "#fff" }} />}>
                            <Typography fontWeight={700}>Как работает конкурс</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
                                Тематическая неделя (7 дней): понедельник — новая тема; пн–пт — приём работ из редактора; сб–вс — голосование;
                                утро понедельника — подсчёт и старт новой темы.
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)", mb: 1 }}>
                                Индекс признания: 60% средняя оценка 1–5 (в топе сообщества — минимум 15 оценок), 30% уникальные комментаторы и
                                избранное, 10% активность автора на неделе (комментарии и оценки чужих работ). Отдельно — «самый обсуждаемый кадр».
                            </Typography>
                            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.7)" }}>
                                Голосование и комментарии — после подтверждения email или входа через Google, аккаунт от 24 часов; с одного IP и устройства —
                                один голос за работу. Кнопка «Пожаловаться» для модерации. О старте недели можно получать письмо (поле в профиле на сервере:
                                emailContestAnnouncements).
                            </Typography>
                        </AccordionDetails>
                    </Accordion>
                </Stack>

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
                        const { avg, count, voted } = projectRatingStats(project, viewerId);
                        const inContest =
                            contestState &&
                            project.contestSubmission?.weekId &&
                            String(project.contestSubmission.weekId) === String(contestState.weekId);
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
                                        {inContest && (
                                            <Chip size="small" label="В конкурсе" sx={{ mt: 1, alignSelf: "flex-start", bgcolor: "rgba(251,191,36,0.2)", color: "#fcd34d" }} />
                                        )}
                                        <Stack spacing={1} mt={1}>
                                            {!isOwnProject ? <>
                                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>Оцените работу (1–5):</Typography>
                                                {voted ? (
                                                    <Typography variant="body2" sx={{ color: "#a7f3d0" }}>
                                                        Вы уже оценили. Среднее: {avg.toFixed(1)} ★ ({count} оценок)
                                                    </Typography>
                                                ) : (
                                                    <Rating
                                                        name={`rating-${project._id}`}
                                                        onChange={(_event, newValue) => {
                                                            handleRateProject(project._id, newValue);
                                                        }}
                                                        sx={{ "& .MuiRating-iconEmpty": { color: "rgba(255,255,255,0.2)" } }}
                                                    />
                                                )}
                                            </> : null}
                                        </Stack>
                                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>Средний балл:</Typography>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "#fcd34d" }}>{avg.toFixed(1)} ★</Typography>
                                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>({count} оценок)</Typography>
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
                        {selectedProject && (() => {
                            const pv = store.user?.id ?? store.user?._id;
                            const previewOwn = pv != null && String(selectedProject.owner) === String(pv);
                            const submittedThisWeek =
                                !!contestState &&
                                !!selectedProject.contestSubmission?.weekId &&
                                String(selectedProject.contestSubmission.weekId) === String(contestState.weekId);
                            return (
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
                                            <Stack
                                                direction="row"
                                                alignItems="center"
                                                flexWrap="wrap"
                                                useFlexGap
                                                spacing={1}
                                                sx={{ mb: 0.5 }}
                                            >
                                                <AuthorNameLink
                                                    ownerId={selectedProject.owner}
                                                    ownerName={selectedProject.ownerName || "Аноним"}
                                                />
                                                {contestState &&
                                                    selectedProject.contestSubmission?.weekId &&
                                                    String(selectedProject.contestSubmission.weekId) === String(contestState.weekId) && (
                                                        <Chip
                                                            size="small"
                                                            label="Участник конкурса"
                                                            sx={{ bgcolor: "rgba(251,191,36,0.2)", color: "#fcd34d", height: 26 }}
                                                        />
                                                    )}
                                            </Stack>
                                            {store.isAuth ? (
                                                <Button
                                                    fullWidth
                                                    variant="contained"
                                                    component={Link}
                                                    to={`/editor/${selectedProject._id}`}
                                                    onClick={handleClosePreview}
                                                    sx={{
                                                        mt: 2,
                                                        borderRadius: 2,
                                                        textTransform: "none",
                                                        fontWeight: 700,
                                                        background: "linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)",
                                                    }}
                                                >
                                                    Открыть в редакторе
                                                </Button>
                                            ) : (
                                                <Typography variant="caption" sx={{ display: "block", mt: 2, color: "rgba(255,255,255,0.45)" }}>
                                                    Войдите, чтобы открыть проект в редакторе.
                                                </Typography>
                                            )}
                                            {store.isAuth &&
                                                contestState?.phase === "SUBMISSION" &&
                                                previewOwn &&
                                                selectedProject.visibility === "PUBLIC" &&
                                                submittedThisWeek && (
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        onClick={handleWithdrawContest}
                                                        disabled={contestBusy}
                                                        sx={{
                                                            mt: 1.5,
                                                            textTransform: "none",
                                                            borderColor: "rgba(248,113,113,0.6)",
                                                            color: "#fca5a5",
                                                        }}
                                                    >
                                                        {contestBusy ? "…" : "Отозвать заявку с конкурса"}
                                                    </Button>
                                                )}
                                            {store.isAuth &&
                                                contestState?.phase === "SUBMISSION" &&
                                                previewOwn &&
                                                selectedProject.visibility === "PUBLIC" &&
                                                !submittedThisWeek && (
                                                    <Button
                                                        fullWidth
                                                        variant="outlined"
                                                        onClick={handleSubmitContest}
                                                        disabled={contestBusy}
                                                        sx={{
                                                            mt: 1.5,
                                                            textTransform: "none",
                                                            borderColor: "rgba(251,191,36,0.7)",
                                                            color: "#fcd34d",
                                                        }}
                                                    >
                                                        {contestBusy ? "Отправка…" : "Отправить на конкурс"}
                                                    </Button>
                                                )}
                                            {store.isAuth && !previewOwn && (
                                                <Button
                                                    fullWidth
                                                    size="small"
                                                    startIcon={<FlagOutlinedIcon />}
                                                    onClick={handleReportProject}
                                                    sx={{ mt: 1.5, textTransform: "none", color: "rgba(248,113,113,0.95)" }}
                                                >
                                                    Пожаловаться на работу
                                                </Button>
                                            )}
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
                                            ) : comments.map((c) => {
                                                const authorGolden =
                                                    !!c.author?.goldenAvatarUntil &&
                                                    new Date(c.author.goldenAvatarUntil) > new Date();
                                                const authorLabel =
                                                    [c.author?.firstName, c.author?.lastName].filter(Boolean).join(" ").trim() ||
                                                    c.author?.email ||
                                                    "Пользователь";
                                                return (
                                                <ListItem key={c._id} sx={{ px: 0, py: 1.5, alignItems: "flex-start" }}>
                                                    <ListItemText
                                                        primary={
                                                            <Typography
                                                                variant="caption"
                                                                sx={{
                                                                    color: "#a78bfa",
                                                                    fontWeight: 700,
                                                                    ...(authorGolden
                                                                        ? {
                                                                              display: "inline-block",
                                                                              px: 0.75,
                                                                              py: 0.25,
                                                                              borderRadius: 1,
                                                                              border: "1px solid rgba(251, 191, 36, 0.85)",
                                                                              boxShadow: "0 0 10px rgba(251, 191, 36, 0.3)",
                                                                          }
                                                                        : {}),
                                                                }}
                                                            >
                                                                {authorLabel}
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
                                            );
                                            })}
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
                            );
                        })()}
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