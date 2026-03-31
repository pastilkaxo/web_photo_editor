import React, { useEffect, useState } from "react";

import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import {
    Alert,
    Box,
    Card,
    CardMedia,
    Container,
    Grid,
    IconButton,
    Stack,
    Typography,
} from "@mui/material";
import { Link } from "react-router-dom";

import ContestService, { IHallWeek } from "../../../Services/ContestService";

const HallOfFame: React.FC = () => {
    const [weeks, setWeeks] = useState<IHallWeek[]>([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            try {
                const res = await ContestService.getHallOfFame();
                setWeeks(res.data || []);
            } catch (e: any) {
                setError(e?.response?.data?.message || "Не удалось загрузить зал славы");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                background: "linear-gradient(165deg, #0f172a 0%, #1e1b4b 45%, #0f172a 100%)",
                py: 4,
                px: 2,
            }}
        >
            <Container maxWidth="lg">
                <Stack spacing={3}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <IconButton component={Link} to="/storage" sx={{ color: "rgba(255,255,255,0.85)" }} aria-label="Назад">
                            <ArrowBackRounded />
                        </IconButton>
                        <Typography variant="h4" sx={{ color: "#fff", fontWeight: 900 }}>
                            Зал славы
                        </Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.55)" }}>
                        Победители прошлых недель: выбор сообщества (топ‑3) и самый обсуждаемый кадр.
                    </Typography>
                    {error && <Alert severity="error">{error}</Alert>}
                    {loading && (
                        <Typography sx={{ color: "rgba(255,255,255,0.5)" }}>Загрузка…</Typography>
                    )}
                    {!loading &&
                        weeks.map((w) => (
                            <Box
                                key={w.weekIndex}
                                sx={{
                                    p: 3,
                                    borderRadius: 3,
                                    border: "1px solid rgba(255,255,255,0.08)",
                                    background: "rgba(255,255,255,0.03)",
                                }}
                            >
                                <Typography variant="h6" sx={{ color: "#e9d5ff", fontWeight: 800, mb: 0.5 }}>
                                    Неделя #{w.weekIndex}: {w.theme}
                                </Typography>
                                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)", display: "block", mb: 2 }}>
                                    {w.closedAt ? new Date(w.closedAt).toLocaleDateString() : ""}
                                </Typography>
                                <Typography variant="subtitle2" sx={{ color: "#fcd34d", mb: 1 }}>
                                    Выбор сообщества
                                </Typography>
                                <Grid container spacing={2} sx={{ mb: 2 }}>
                                    {w.community?.map((p, i) => (
                                        <Grid size={{ xs: 12, sm: 4 }} key={p._id || i}>
                                            <Card sx={{ bgcolor: "rgba(0,0,0,0.25)", borderRadius: 2 }}>
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={p.previewImage || ""}
                                                    sx={{ objectFit: "contain", bgcolor: "#000" }}
                                                />
                                                <Box sx={{ p: 1.5 }}>
                                                    <Typography variant="caption" sx={{ color: "#fcd34d" }}>
                                                        {i + 1} место
                                                    </Typography>
                                                    <Typography variant="body2" sx={{ color: "#fff" }} noWrap>
                                                        {p.name}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                                                        {p.ownerName}
                                                    </Typography>
                                                </Box>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                                {w.mostDiscussed && (
                                    <>
                                        <Typography variant="subtitle2" sx={{ color: "#67e8f9", mb: 1 }}>
                                            Самый обсуждаемый кадр
                                        </Typography>
                                        <Grid container spacing={2}>
                                            <Grid size={{ xs: 12, sm: 4 }}>
                                                <Card sx={{ bgcolor: "rgba(0,0,0,0.25)", borderRadius: 2 }}>
                                                    <CardMedia
                                                        component="img"
                                                        height="140"
                                                        image={w.mostDiscussed.previewImage || ""}
                                                        sx={{ objectFit: "contain", bgcolor: "#000" }}
                                                    />
                                                    <Box sx={{ p: 1.5 }}>
                                                        <Typography variant="body2" sx={{ color: "#fff" }} noWrap>
                                                            {w.mostDiscussed.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.45)" }}>
                                                            {w.mostDiscussed.ownerName}
                                                        </Typography>
                                                    </Box>
                                                </Card>
                                            </Grid>
                                        </Grid>
                                    </>
                                )}
                            </Box>
                        ))}
                </Stack>
            </Container>
        </Box>
    );
};

export default HallOfFame;
