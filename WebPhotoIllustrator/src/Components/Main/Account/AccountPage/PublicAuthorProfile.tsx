import React, { useContext, useEffect, useState } from "react";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  CardMedia,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Typography,
  Chip,
} from "@mui/material";
import { observer } from "mobx-react-lite";
import { Link, useNavigate, useParams } from "react-router-dom";

import { Context } from "../../../../index";
import { IProject } from "../../../../models/IProject";
import { IPublicUserProfile } from "../../../../models/IPublicUserProfile";
import ProjectService from "../../../../Services/ProjectService";
import UserService from "../../../../Services/UserService";
import ContestService from "../../../../Services/ContestService";
import { PROJECT_CATEGORY_LABELS, ProjectCategory } from "../../../../constants/projectCategories";
import { contestBadgeLabel } from "../../../../utils/contestLabels";
import { useAppDialog } from "../../../../context/AppDialogContext";

const PublicAuthorProfile: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { store } = useContext(Context);
  const { alert: dialogAlert } = useAppDialog();

  const [profile, setProfile] = useState<IPublicUserProfile | null>(null);
  const [projects, setProjects] = useState<IProject[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [error, setError] = useState("");
  const [following, setFollowing] = useState(false);

  const selfId = store.user?.id ?? store.user?._id;

  useEffect(() => {
    if (userId && store.isAuth && selfId != null && userId === String(selfId)) {
      navigate("/profile", { replace: true });
    }
  }, [userId, store.isAuth, selfId, navigate]);

  useEffect(() => {
    if (!userId) return;
    const loadProfile = async () => {
      try {
        setLoading(true);
        const res = await UserService.getPublicProfile(userId);
        setProfile(res.data);
        setError("");
      } catch (e: any) {
        setError(e?.response?.data?.message || "Не удалось загрузить профиль");
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  useEffect(() => {
    if (!userId || !store.isAuth || selfId == null || userId === String(selfId)) return;
    ContestService.followStatus(userId)
      .then((r) => setFollowing(!!r.data.following))
      .catch(() => setFollowing(false));
  }, [userId, store.isAuth, selfId]);

  const handleToggleFollow = async () => {
    if (!userId) return;
    try {
      const r = await ContestService.toggleFollow(userId);
      setFollowing(!!r.data.following);
    } catch (e: any) {
      void dialogAlert(e?.response?.data?.message || "Не удалось изменить подписку");
    }
  };

  useEffect(() => {
    if (!userId) return;
    const loadProjects = async () => {
      try {
        setProjectsLoading(true);
        const res = await ProjectService.getPublicProjects({
          page,
          limit: 12,
          owner: userId,
          sortBy: "updatedAt",
          sortOrder: "desc",
        });
        setProjects(res.data.items || []);
        setTotalPages(res.data.totalPages || 1);
      } catch {
        setProjects([]);
      } finally {
        setProjectsLoading(false);
      }
    };
    loadProjects();
  }, [userId, page]);

  if (!userId) {
    return null;
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(165deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)",
        py: { xs: 2, md: 4 },
        px: { xs: 2, md: 3 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={3}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <IconButton
              component={Link}
              to={store.isAuth ? "/storage" : "/"}
              sx={{ color: "rgba(255,255,255,0.8)" }}
              aria-label="Назад"
            >
              <ArrowBackRounded />
            </IconButton>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.5)" }}>
              {store.isAuth ? "К хранилищу" : "На главную"}
            </Typography>
          </Box>

          {loading && (
            <Box display="flex" justifyContent="center" py={6}>
              <CircularProgress sx={{ color: "#a78bfa" }} />
            </Box>
          )}

          {error && !loading && (
            <Alert severity="error" sx={{ bgcolor: "rgba(239,68,68,0.12)", color: "#fecaca" }}>
              {error}
            </Alert>
          )}

          {profile && !loading && (
            <Paper
              elevation={0}
              sx={{
                p: { xs: 2.5, md: 3.5 },
                borderRadius: 4,
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                backdropFilter: "blur(20px)",
              }}
            >
              <Stack spacing={1}>
                <Typography variant="h4" fontWeight={900} sx={{ color: "#fff" }}>
                  {profile.displayName}
                </Typography>
                <Stack direction="row" alignItems="center" gap={1} sx={{ color: "rgba(255,255,255,0.65)" }}>
                  <StarRounded sx={{ fontSize: 22, color: "#fbbf24" }} />
                  <Typography variant="body1">
                    Суммарный рейтинг работ: <strong style={{ color: "#fff" }}>{profile.totalStars}</strong>
                  </Typography>
                </Stack>
                {store.isAuth && selfId != null && userId !== String(selfId) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleToggleFollow}
                    sx={{ mt: 1, alignSelf: "flex-start", textTransform: "none", borderColor: "rgba(167,139,250,0.5)", color: "#e9d5ff" }}
                  >
                    {following ? "Отписаться от автора" : "Подписаться на автора"}
                  </Button>
                )}
                {profile.socialLink ? (
                  <Button
                    href={profile.socialLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="small"
                    sx={{ mt: 1, alignSelf: "flex-start", textTransform: "none", color: "#67e8f9" }}
                  >
                    Соцсети автора
                  </Button>
                ) : null}
                {profile.contestBadges && profile.contestBadges.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ pt: 1 }}>
                    {profile.contestBadges.map((b, i) => (
                      <Chip
                        key={`${b.kind}-${b.weekIndex}-${i}`}
                        label={contestBadgeLabel(b.kind, b.weekIndex)}
                        size="small"
                        sx={{ bgcolor: "rgba(251,191,36,0.15)", color: "#fcd34d", border: "1px solid rgba(251,191,36,0.35)" }}
                      />
                    ))}
                  </Stack>
                )}
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.45)", pt: 0.5 }}>
                  Публичные работы автора
                </Typography>
              </Stack>
            </Paper>
          )}

          {profile && !loading && (
            <>
              {projectsLoading && (
                <Box display="flex" justifyContent="center" py={3}>
                  <CircularProgress size={28} sx={{ color: "#a78bfa" }} />
                </Box>
              )}

              {!projectsLoading && projects.length === 0 && (
                <Typography sx={{ color: "rgba(255,255,255,0.45)", textAlign: "center", py: 4 }}>
                  Пока нет опубликованных работ
                </Typography>
              )}

              <Grid container spacing={3}>
                {!projectsLoading &&
                  projects.map((project) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={project._id}>
                      <Card
                        sx={{
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          borderRadius: 4,
                          backgroundColor: "rgba(255, 255, 255, 0.04)",
                          border: "1px solid rgba(255, 255, 255, 0.08)",
                          color: "white",
                        }}
                      >
                        <CardActionArea
                          onClick={() => {
                            if (store.isAuth) navigate(`/editor/${project._id}`);
                          }}
                          sx={{
                            flexGrow: 1,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "stretch",
                            cursor: store.isAuth ? "pointer" : "default",
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="180"
                            image={project.previewImage}
                            alt={project.name}
                            sx={{ objectFit: "contain", background: "rgba(0,0,0,0.25)" }}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Typography variant="subtitle1" fontWeight={800} noWrap>
                              {project.name || "Без названия"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)", display: "block", mt: 0.5 }}>
                              {PROJECT_CATEGORY_LABELS[(project.category || "OTHER") as ProjectCategory]}
                            </Typography>
                          </CardContent>
                        </CardActionArea>
                        {!store.isAuth && (
                          <CardContent sx={{ pt: 0 }}>
                            <Button
                              fullWidth
                              size="small"
                              component={Link}
                              to="/"
                              variant="outlined"
                              sx={{ borderColor: "rgba(167,139,250,0.5)", color: "#c4b5fd" }}
                            >
                              Войти, чтобы открыть
                            </Button>
                          </CardContent>
                        )}
                      </Card>
                    </Grid>
                  ))}
              </Grid>

              {totalPages > 1 && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, p) => setPage(p)}
                    color="primary"
                    shape="rounded"
                    sx={{
                      "& .MuiPaginationItem-root": { color: "#fff" },
                      "& .Mui-selected": { bgcolor: "rgba(167, 139, 250, 0.3) !important" },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default observer(PublicAuthorProfile);
