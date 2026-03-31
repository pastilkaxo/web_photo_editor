import React, { useCallback, useEffect, useState } from "react";
import BlockIcon from "@mui/icons-material/Block";
import DeleteIcon from "@mui/icons-material/Delete";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import {
    Alert,
    Box,
    Button,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography,
} from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridToolbar,
} from "@mui/x-data-grid";
import { Link as RouterLink } from "react-router-dom";

import ContestService, {
    IContestReportAdminRow,
} from "../../../../Services/ContestService";
import ProjectService from "../../../../Services/ProjectService";
import UserService from "../../../../Services/UserService";
import { useAppDialog } from "../../../../context/AppDialogContext";

function displayUser(u: { firstName?: string; lastName?: string; email?: string } | null) {
    if (!u) return "—";
    const name = `${u.firstName || ""} ${u.lastName || ""}`.trim();
    return name || u.email || "—";
}

const AdminReportsView: React.FC = () => {
    const { confirm: dialogConfirm } = useAppDialog();
    const [rows, setRows] = useState<IContestReportAdminRow[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchReports = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await ContestService.getAdminReports();
            setRows(response.data);
            setError("");
        } catch (err: unknown) {
            const msg =
                err &&
                typeof err === "object" &&
                "response" in err &&
                err.response &&
                typeof err.response === "object" &&
                "data" in err.response &&
                err.response.data &&
                typeof err.response.data === "object" &&
                "message" in err.response.data
                    ? String((err.response.data as { message?: string }).message)
                    : "Ошибка при загрузке жалоб";
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReports();
    }, [fetchReports]);

    const handleDeleteProject = async (projectId: string) => {
        const ok = await dialogConfirm("Удалить этот проект?");
        if (!ok) return;
        try {
            await ProjectService.deleteAnyProject(projectId);
            await fetchReports();
        } catch (err: unknown) {
            const msg =
                err &&
                typeof err === "object" &&
                "response" in err &&
                err.response &&
                typeof err.response === "object" &&
                "data" in err.response &&
                err.response.data &&
                typeof err.response.data === "object" &&
                "message" in err.response.data
                    ? String((err.response.data as { message?: string }).message)
                    : "Ошибка при удалении проекта";
            setError(msg);
        }
    };

    const handleBlockAuthor = async (ownerId: string) => {
        const ok = await dialogConfirm(
            "Заблокировать автора? Все его проекты будут удалены автоматически."
        );
        if (!ok) return;
        try {
            await UserService.blockUser(ownerId);
            await fetchReports();
        } catch (err: unknown) {
            const msg =
                err &&
                typeof err === "object" &&
                "response" in err &&
                err.response &&
                typeof err.response === "object" &&
                "data" in err.response &&
                err.response.data &&
                typeof err.response.data === "object" &&
                "message" in err.response.data
                    ? String((err.response.data as { message?: string }).message)
                    : "Ошибка при блокировке";
            setError(msg);
        }
    };

    const columns: GridColDef<IContestReportAdminRow>[] = [
        {
            field: "createdAt",
            headerName: "Дата",
            width: 110,
            renderCell: (params: GridRenderCellParams<IContestReportAdminRow>) =>
                params.value ? new Date(params.value as string).toLocaleString() : "",
        },
        {
            field: "reason",
            headerName: "Текст жалобы",
            flex: 1,
            minWidth: 180,
        },
        {
            field: "project",
            headerName: "Проект",
            width: 220,
            sortable: false,
            renderCell: (params: GridRenderCellParams<IContestReportAdminRow>) => {
                const p = params.row.project;
                if (!p?._id) {
                    return (
                        <Typography variant="body2" color="text.secondary">
                            Проект удалён
                        </Typography>
                    );
                }
                return (
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Link
                            component={RouterLink}
                            to={`/editor/${p._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            sx={{ fontWeight: 700 }}
                        >
                            {p.name || "Без названия"}
                        </Link>
                        <OpenInNewIcon sx={{ fontSize: 14, opacity: 0.6 }} />
                    </Stack>
                );
            },
        },
        {
            field: "author",
            headerName: "Автор проекта",
            width: 200,
            sortable: false,
            valueGetter: (_value, row) => displayUser(row.project?.owner ?? null),
            renderCell: (params: GridRenderCellParams<IContestReportAdminRow>) => {
                const owner = params.row.project?.owner;
                if (!owner?._id) {
                    return "—";
                }
                return (
                    <Link
                        component={RouterLink}
                        to={`/profile/${owner._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                    >
                        {displayUser(owner)}
                    </Link>
                );
            },
        },
        {
            field: "reporter",
            headerName: "Жалобу отправил",
            width: 180,
            sortable: false,
            valueGetter: (_value, row) => displayUser(row.reporter),
            renderCell: (params: GridRenderCellParams<IContestReportAdminRow>) =>
                displayUser(params.row.reporter),
        },
        {
            field: "actions",
            headerName: "Действия",
            width: 120,
            sortable: false,
            renderCell: (params: GridRenderCellParams<IContestReportAdminRow>) => {
                const projectId = params.row.project?._id;
                const ownerId = params.row.project?.owner?._id;
                const ownerBlocked = params.row.project?.owner?.isBlocked;
                return (
                    <Stack direction="row" spacing={0.5}>
                        <Tooltip title="Удалить проект">
                            <span>
                                <IconButton
                                    color="error"
                                    size="small"
                                    disabled={!projectId}
                                    onClick={() => projectId && handleDeleteProject(projectId)}
                                >
                                    <DeleteIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Заблокировать автора и удалить все его проекты">
                            <span>
                                <IconButton
                                    color="warning"
                                    size="small"
                                    disabled={!ownerId || ownerBlocked}
                                    onClick={() => ownerId && handleBlockAuthor(ownerId)}
                                >
                                    <BlockIcon fontSize="small" />
                                </IconButton>
                            </span>
                        </Tooltip>
                    </Stack>
                );
            },
        },
    ];

    return (
        <Box sx={{ height: "auto", width: "100%", p: { xs: 1, md: 1 } }}>
            <Typography
                variant="h4"
                fontWeight={900}
                sx={{ color: "white", mb: 3, letterSpacing: "-0.01em" }}
            >
                Жалобы на работы конкурса
            </Typography>

            {error && (
                <Alert
                    severity="error"
                    sx={{ mb: 2 }}
                    action={
                        <Button color="inherit" size="small" onClick={() => fetchReports()}>
                            Повторить
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}

            <Box
                sx={{
                    height: 600,
                    width: "100%",
                    bgcolor: "rgba(255,255,255,0.02)",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid rgba(255,255,255,0.08)",
                }}
            >
                <DataGrid
                    rows={rows}
                    columns={columns}
                    loading={isLoading}
                    getRowId={(row) => row._id}
                    density="compact"
                    initialState={{
                        pagination: { paginationModel: { page: 0, pageSize: 15 } },
                        sorting: {
                            sortModel: [{ field: "createdAt", sort: "desc" }],
                        },
                    }}
                    pageSizeOptions={[15, 30, 50]}
                    disableRowSelectionOnClick
                    slots={{ toolbar: GridToolbar }}
                    slotProps={{
                        toolbar: {
                            showQuickFilter: true,
                            quickFilterProps: { debounceMs: 500 },
                        },
                    }}
                    sx={{
                        border: "none",
                        bgcolor: "#fff",
                        color: "#000",
                        "& .MuiDataGrid-cell": {
                            color: "#000",
                            fontSize: "0.85rem",
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                            display: "flex",
                            alignItems: "center",
                        },
                        "& .MuiDataGrid-columnHeader": {
                            backgroundColor: "#f1f5f9",
                            color: "#000",
                        },
                        "& .MuiDataGrid-columnHeaderTitle": {
                            fontWeight: 800,
                            fontSize: "0.9rem",
                            color: "#000",
                        },
                        "& .MuiDataGrid-iconSeparator": {
                            display: "none",
                        },
                        "& .MuiDataGrid-columnHeaders": {
                            borderBottom: "2px solid rgba(0,0,0,0.1)",
                        },
                        "& .MuiDataGrid-footerContainer": {
                            borderTop: "1px solid rgba(0,0,0,0.1)",
                            bgcolor: "#fff",
                            color: "#000",
                        },
                        "& .MuiTablePagination-root": {
                            color: "#000",
                        },
                        "& .MuiDataGrid-toolbarContainer": {
                            padding: 1.5,
                            bgcolor: "#fff",
                            borderBottom: "1px solid rgba(0,0,0,0.08)",
                            "& .MuiButton-root": { color: "#6d28d9", fontWeight: 700 },
                            "& .MuiInputBase-root": {
                                color: "#000",
                                bgcolor: "#f8fafc",
                                borderRadius: 2,
                                border: "1px solid rgba(0,0,0,0.1)",
                                px: 1,
                                "& .MuiSvgIcon-root": { color: "rgba(0,0,0,0.5)" },
                            },
                        },
                        "& .MuiDataGrid-sortIcon": {
                            color: "#000",
                        },
                        "& .MuiDataGrid-menuIcon": {
                            color: "#000",
                        },
                    }}
                />
            </Box>
        </Box>
    );
};

export default AdminReportsView;
