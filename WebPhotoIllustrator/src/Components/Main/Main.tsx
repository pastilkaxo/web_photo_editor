import React, { useContext, useEffect, useMemo, useState } from "react";

import { observer } from "mobx-react-lite";

import { Context } from "../..";
import Auth from "./AuthForm/Auth";
import { Link } from "react-router-dom";
import {
  Button,
  Paper,
  Stack,
  SxProps,
  Theme,
  Typography,
  Box,
  IconButton,
  CircularProgress,
  Alert,
  Tooltip,
} from "@mui/material";
import {
  ArrowBackIosNew,
  ArrowForwardIos,
  StarRounded,
  HowToVoteRounded,
  LayersRounded,
  BrushRounded,
  TuneRounded,
  CloudUploadRounded,
  RocketLaunchRounded,
  AccountCircleRounded,
  FolderOpenRounded,
  LogoutRounded,
} from "@mui/icons-material";
import { IProject } from "../../models/IProject";
import ProjectService from "../../Services/ProjectService";

/* ─── MUI sx helpers ─── */
const glassCard: SxProps<Theme> = {
  backgroundColor: "rgba(255, 255, 255, 0.03)",
  color: "white",
  borderRadius: 4,
  p: { xs: 2.5, md: 4 },
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 24px 64px rgba(0, 0, 0, 0.4)",
};

const mutedText: SxProps<Theme> = { color: "rgba(255, 255, 255, 0.7)" };

const gradientBtn = (from: string, to: string): SxProps<Theme> => ({
  background: `linear-gradient(135deg, ${from}, ${to})`,
  color: "#fff",
  fontWeight: 700,
  borderRadius: "14px",
  px: 3.5,
  py: 1.4,
  boxShadow: "none",
  textTransform: "none",
  fontSize: 15,
  letterSpacing: "0.01em",
  "&:hover": {
    background: `linear-gradient(135deg, ${from}, ${to})`,
    filter: "brightness(1.15)",
    transform: "translateY(-3px)",
    boxShadow: `0 12px 28px rgba(0, 0, 0, 0.3)`,
  },
  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
});

/* ─── Feature list ─── */
const MAIN_FEATURES = [
  {
    icon: <LayersRounded sx={{ fontSize: 32, color: "#a78bfa" }} />,
    title: "Работа со слоями",
    subtitle: "Гибкое управление объектами",
    description: "Перемещайте, блокируйте и скрывайте элементы через удобный список слоев.",
    tagClass: "hero-tag hero-tag--violet",
  },
  {
    icon: <BrushRounded sx={{ fontSize: 32, color: "#60a5fa" }} />,
    title: "Инструменты рисования",
    subtitle: "Фигуры, текст и кисть",
    description: "Создавайте иллюстрации с помощью базовых фигур, текста и свободного рисования.",
    tagClass: "hero-tag hero-tag--blue",
  },
  {
    icon: <TuneRounded sx={{ fontSize: 32, color: "#34d399" }} />,
    title: "Фильтры изображений",
    subtitle: "Быстрая обработка в редакторе",
    description: "Применяйте эффекты к изображениям прямо на холсте и комбинируйте их.",
    tagClass: "hero-tag hero-tag--teal",
  },
  {
    icon: <CloudUploadRounded sx={{ fontSize: 32, color: "#fbbf24" }} />,
    title: "Публикация и обмен",
    subtitle: "Легко делиться проектами",
    description: "Сохраняйте проекты в облаке, переключайте видимость и отправляйте ссылку.",
    tagClass: "hero-tag hero-tag--amber",
  },
];

function Main() {
  const { store } = useContext(Context);
  const [topProjects, setTopProjects] = useState<IProject[]>([]);
  const [topProjectsLoading, setTopProjectsLoading] = useState(false);
  const [topProjectsError, setTopProjectsError] = useState("");
  const [topProjectIndex, setTopProjectIndex] = useState(0);

  const activeTopProject = useMemo(
    () => topProjects[topProjectIndex],
    [topProjects, topProjectIndex]
  );

  const handleNextTopProject = () => {
    if (!topProjects.length) return;
    setTopProjectIndex((prev) => (prev + 1) % topProjects.length);
  };

  const handlePrevTopProject = () => {
    if (!topProjects.length) return;
    setTopProjectIndex((prev) => (prev - 1 + topProjects.length) % topProjects.length);
  };

  useEffect(() => {
    const fetchTopProjects = async () => {
      try {
        setTopProjectsLoading(true);
        const response = await ProjectService.getPublicProjects({
          page: 1,
          limit: 12,
          sortBy: "stars",
          sortOrder: "desc",
        });
        const candidates = (response.data.items || []).filter(
          (project) => (project.stars || 0) > 0
        );
        setTopProjects(candidates);
        setTopProjectsError("");
      } catch (error: any) {
        setTopProjectsError(
          error?.response?.data?.message || "Не удалось загрузить топ проектов"
        );
      } finally {
        setTopProjectsLoading(false);
      }
    };

    fetchTopProjects();
  }, []);

  return (
    <div className="main-container">
      <section id="section1" className="section roboto-font">
        {/* ── Suble decorations ── */}
        <div className="hero-orb hero-orb--violet" />
        <div className="hero-orb hero-orb--blue" />

        {!store.isAuth ? (
          /* ══════════════════════ NOT AUTH ══════════════════════ */
          <Box
            sx={{
              width: "100%",
              maxWidth: 1200,
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "1.15fr 0.85fr" },
              gap: 3,
              alignItems: "stretch",
              mb: 3
            }}
          >
            {/* ── Hero card ── */}
            <Paper elevation={0} sx={{ ...glassCard }} className="animate-fade-up">
              <Stack spacing={3.5}>
                {/* Badge */}
                <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                  <span className="hero-tag hero-tag--violet">Профессиональный редактор</span>
                  <span className="hero-tag hero-tag--blue">v1.0</span>
                </Box>

                <Typography
                  variant="h2"
                  fontWeight={900}
                  sx={{
                    fontSize: { xs: "2.5rem", sm: "3.2rem", md: "4rem" },
                    lineHeight: 1.1,
                    letterSpacing: "-0.02em",
                    background: "linear-gradient(135deg, #fff 30%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  Творите без границ
                </Typography>

                <Typography
                  variant="h6"
                  sx={{ ...mutedText, fontWeight: 400, lineHeight: 1.7, fontSize: { xs: "1rem", md: "1.2rem" }, maxWidth: 500 }}
                >
                  Мощный онлайн‑инструмент для создания иллюстраций, обработки фото и мгновенной публикации ваших шедевров.
                </Typography>

                {/* Tag row */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2 }}>
                  <span className="hero-tag hero-tag--violet">⬡ Слои</span>
                  <span className="hero-tag hero-tag--blue">⬡ Фильтры и AI</span>
                  <span className="hero-tag hero-tag--teal">⬡ Облачное хранилище</span>
                  <span className="hero-tag hero-tag--amber">⬡ Галерея</span>
                </Box>

                {/* CTA buttons */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2} pt={1}>
                  <Link to="/editor" style={{ textDecoration: "none" }}>
                    <Button
                      variant="contained"
                      startIcon={<RocketLaunchRounded />}
                      sx={gradientBtn("#7c3aed", "#4f46e5")}
                    >
                      Опробовать редактор
                    </Button>
                  </Link>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: "rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.9)",
                      borderRadius: "14px",
                      px: 3.5,
                      py: 1.4,
                      textTransform: "none",
                      fontWeight: 600,
                      fontSize: 15,
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.4)",
                        background: "rgba(255,255,255,0.05)",
                      },
                    }}
                    onClick={() => {
                      const el = document.getElementById("top-projects-section");
                      el?.scrollIntoView({ behavior: "smooth" });
                    }}
                  >
                    Нужно знать ↓
                  </Button>
                </Stack>
              </Stack>
            </Paper>

            {/* ── Auth form ── */}
            <Box className="animate-fade-up-delay-1" sx={{ mt: 1.5 }}>
              <Auth />
            </Box>

            {/* ── Features grid ── */}
            <Paper
              elevation={0}
              sx={{ ...glassCard, gridColumn: { xs: "1", lg: "1 / span 2" } }}
              className="animate-fade-up-delay-2"
            >
              <Stack spacing={3}>
                <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: "-0.01em" }}>
                  ✦ Ваши возможности
                </Typography>
                <div className="features-grid">
                  {MAIN_FEATURES.map((f) => (
                    <div className="feature-card" key={f.title}>
                      <div className="feature-icon">{f.icon}</div>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mt: 1 }}>
                        {f.title}
                      </Typography>
                      <Typography variant="caption" sx={{ ...mutedText, mb: 1, display: 'block' }}>
                        {f.subtitle}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>
                        {f.description}
                      </Typography>
                    </div>
                  ))}
                </div>
              </Stack>
            </Paper>
          </Box>
        ) : (
          /* ══════════════════════ AUTHENTICATED ══════════════════════ */
          <Box sx={{ width: "100%", maxWidth: 1000 }}>
            {/* Welcome card */}
            <Paper elevation={0} sx={{ ...glassCard, mb: 4 }} className="animate-fade-up">
              <Stack spacing={1} mb={4}>
                <Typography variant="overline" sx={{ color: "#a78bfa", letterSpacing: "0.2em", fontWeight: 800 }}>
                  ДОБРО ПОЖАЛОВАТЬ
                </Typography>
                <Typography
                  variant="h3"
                  fontWeight={900}
                  sx={{
                    background: "linear-gradient(135deg, #fff 40%, #a78bfa 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    letterSpacing: "-0.02em"
                  }}
                >
                  Рады видеть Вас,<br />{store.user.firstName}!
                </Typography>
                <Typography variant="body1" sx={{ ...mutedText, mt: 1 }}>
                  Ваше творческое пространство готово. Реализуйте свои идеи прямо сейчас.
                </Typography>
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
                <Link to="/profile" style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    startIcon={<AccountCircleRounded />}
                    sx={gradientBtn("#7c3aed", "#4f46e5")}
                  >
                    Профиль
                  </Button>
                </Link>
                <Link to="/projects" style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    startIcon={<FolderOpenRounded />}
                    sx={gradientBtn("#0ea5e9", "#6366f1")}
                  >
                    Мои работы
                  </Button>
                </Link>
                <Link to="/editor" style={{ textDecoration: "none" }}>
                  <Button
                    variant="contained"
                    startIcon={<RocketLaunchRounded />}
                    sx={gradientBtn("#10b981", "#059669")}
                  >
                    Запустить редактор
                  </Button>
                </Link>
                <Button
                  variant="outlined"
                  startIcon={<LogoutRounded />}
                  onClick={() => store.logout()}
                  sx={{
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    color: "#fca5a5",
                    borderRadius: "14px",
                    px: 3,
                    py: 1.4,
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": {
                      borderColor: "#ef4444",
                      background: "rgba(239, 68, 68, 0.08)",
                    },
                  }}
                >
                  Выйти
                </Button>
              </Stack>
            </Paper>

            <div className="features-grid animate-fade-up-delay-1">
              {MAIN_FEATURES.map((f) => (
                <div className="feature-card" key={f.title}>
                  <div className="feature-icon">{f.icon}</div>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: "#fff", mt: 1 }}>
                    {f.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.6)", mt: 0.5 }}>
                    {f.description}
                  </Typography>
                </div>
              ))}
            </div>
          </Box>
        )}

        {/* ══════════════════════ TOP PROJECTS ══════════════════════ */}
        <Paper
          id="top-projects-section"
          elevation={0}
          sx={{ ...glassCard, width: "100%", maxWidth: 1200, mt: 4 }}
          className="animate-fade-up-delay-3"
        >
          <Stack spacing={4}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StarRounded sx={{ color: "#fbbf24", fontSize: 32 }} />
              <Typography variant="h5" fontWeight={800}>
                Топ лучших работ месяца
              </Typography>
              {topProjects.length > 0 && (
                <Box
                  sx={{
                    ml: "auto",
                    px: 2,
                    py: 0.6,
                    borderRadius: 999,
                    background: "rgba(251, 191, 36, 0.1)",
                    border: "1px solid rgba(251, 191, 36, 0.25)",
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#fcd34d", fontWeight: 800 }}>
                    {topProjects.length} ЛУЧШИХ
                  </Typography>
                </Box>
              )}
            </Box>

            {topProjectsLoading && (
              <Box display="flex" justifyContent="center" py={8}>
                <CircularProgress size={48} sx={{ color: "#a78bfa" }} />
              </Box>
            )}

            {!topProjectsLoading && topProjectsError && (
              <Alert
                severity="warning"
                sx={{ background: "rgba(251, 191, 36, 0.05)", color: "#fcd34d", border: "1px solid rgba(251, 191, 36, 0.2)", borderRadius: 3 }}
              >
                {topProjectsError}
              </Alert>
            )}

            {!topProjectsLoading && !topProjectsError && !activeTopProject && (
              <Typography variant="body1" sx={{ ...mutedText, textAlign: 'center', py: 4 }}>
                Пока нет публичных проектов. Станьте первым автором!
              </Typography>
            )}

            {!topProjectsLoading && activeTopProject && (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "1.3fr 0.7fr" },
                  gap: 4,
                  alignItems: "center",
                }}
              >
                {/* Preview image */}
                <Box
                  component="img"
                  src={
                    activeTopProject.previewImage ||
                    "https://via.placeholder.com/1200x720?text=No+Preview"
                  }
                  alt={activeTopProject.name}
                  className="project-preview-img"
                  sx={{
                    width: "100%",
                    aspectRatio: "16 / 10",
                    minHeight: { xs: 200, md: 350 },
                  }}
                />

                {/* Info */}
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h4" fontWeight={900} sx={{ lineHeight: 1.2, mb: 1 }}>
                      {activeTopProject.name || "Без названия"}
                    </Typography>
                    <Typography variant="body1" sx={mutedText}>
                      Автор: <strong style={{ color: "#fff" }}>{activeTopProject.ownerName || "Неизвестный"}</strong>
                    </Typography>
                  </Box>

                  {/* Stats */}
                  <Stack direction="row" gap={1.5} flexWrap="wrap">
                    <Tooltip title="Рейтинг сообщества">
                      <span className="stat-badge">
                        <StarRounded style={{ fontSize: 18, color: "#fbbf24" }} />
                        {((activeTopProject.stars || 0) / (activeTopProject.ratedBy?.length || 1)).toFixed(2)}
                      </span>
                    </Tooltip>
                    <Tooltip title="Голоса">
                      <span className="stat-badge">
                        <HowToVoteRounded style={{ fontSize: 18, color: "#a78bfa" }} />
                        {activeTopProject.ratedBy?.length || 0}
                      </span>
                    </Tooltip>
                  </Stack>

                  {/* Navigation + Open */}
                  <Stack direction="row" alignItems="center" spacing={2} pt={1}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton
                        onClick={handlePrevTopProject}
                        sx={{
                          color: "#fff",
                          background: "rgba(255, 255, 255, 0.05)",
                          "&:hover": { background: "rgba(255, 255, 255, 0.12)" },
                        }}
                      >
                        <ArrowBackIosNew fontSize="small" />
                      </IconButton>
                      <Typography variant="body2" sx={{ ...mutedText, fontWeight: 700 }}>
                        {topProjectIndex + 1} / {topProjects.length}
                      </Typography>
                      <IconButton
                        onClick={handleNextTopProject}
                        sx={{
                          color: "#fff",
                          background: "rgba(255, 255, 255, 0.05)",
                          "&:hover": { background: "rgba(255, 255, 255, 0.12)" },
                        }}
                      >
                        <ArrowForwardIos fontSize="small" />
                      </IconButton>
                    </Box>


                    {store.isAuth ? (
                      <Link to={`/editor/${activeTopProject._id}`} style={{ textDecoration: "none" }}>
                        <Button variant="contained" sx={gradientBtn("#7c3aed", "#4f46e5")}>
                          Открыть
                        </Button>
                      </Link>
                    ) : (
                      <Tooltip title="Требуется авторизация">
                        <span>
                          <Button variant="contained" disabled sx={{ borderRadius: "14px", px: 3 }}>
                            Открыть
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Stack>

                  {!store.isAuth && (
                    <Alert
                      severity="info"
                      variant="outlined"
                      sx={{
                        borderColor: "rgba(139, 92, 246, 0.25)",
                        color: "rgba(255, 255, 255, 0.7)",
                        borderRadius: 3,
                        "& .MuiAlert-icon": { color: "#a78bfa" },
                      }}
                    >
                      Авторизуйтесь, чтобы сохранить этот проект.
                    </Alert>
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Paper>
      </section>
    </div>
  );
}

export default observer(Main);