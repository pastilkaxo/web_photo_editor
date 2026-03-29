import React, { useState, useEffect } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import {
    Box,
    Typography,
    IconButton,
    Chip,
    Stack,
    Tooltip,
    Avatar
} from "@mui/material";
import {
    DataGrid,
    GridColDef,
    GridRenderCellParams,
    GridToolbar
} from "@mui/x-data-grid";

import { IProject } from "../../../../models/IProject";
import ProjectService from "../../../../Services/ProjectService";

const AdminProjectsView: React.FC = () => {
  const [projects, setProjects] = useState<IProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const response = await ProjectService.fetchAllProjects();
      setProjects(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Ошибка при загрузке проектов");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if(window.confirm("Вы уверены, что хотите удалить этот проект?")) {
      try {
        await ProjectService.deleteAnyProject(projectId);
        setProjects(prevProjects => prevProjects.filter(p => p._id !== projectId));
      } catch (err: any) {
        setError(err.response?.data?.message || "Ошибка при удалении проекта");
      }
    }
  }

  const columns: GridColDef[] = [
        { field: "_id", headerName: "ID", width: 220 },
        {
            field: "previewImage",
            headerName: "Превью",
            width: 80,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => (
                <Avatar
                    src={params.value}
                    variant="rounded"
                    sx={{ width: 40, height: 40 }}
                    alt="Project"
                >
                    P
                </Avatar>
            )
        },
        { field: "name", headerName: "Название", width: 200, flex: 1 },
        { field: "owner", headerName: "Owner ID", width: 220 },
        {
            field: "visibility",
            headerName: "Доступ",
            width: 120,
            renderCell: (params: GridRenderCellParams) => (
                <Chip
                    label={params.value === "PUBLIC" ? "PUBLIC" : "PRIVATE"}
                    color={params.value === "PUBLIC" ? "success" : "default"}
                    size="small"
                    variant="outlined"
                    sx={{ 
                        fontWeight: 800, 
                        fontSize: "0.75rem", 
                        letterSpacing: "0.03em"
                    }}  
                />
            )
        },
        { field: "stars", headerName: "Рейтинг", width: 100, type: 'number' },
        {
            field: "createdAt",
            headerName: "Создан",
            width: 150,
            renderCell: (params: GridRenderCellParams) => {
                if (!params.value) return "";
                return new Date(params.value).toLocaleDateString();
            }
        },
        {
            field: "actions",
            headerName: "Действия",
            width: 100,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => {
                const project = params.row as IProject;
                return (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title="Удалить">
                            <IconButton color="error" onClick={() => handleDeleteProject(project._id)}>
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip>
                    </Stack>
                );
            },
        },
    ];

    if (error) {
        return <div style={{ color: "red", padding: 20 }}>{error}</div>;
    }


  return (
        <Box sx={{ height: "auto", width: "100%", p: { xs: 1, md: 1 } }}>
            <Typography variant="h4" fontWeight={900} sx={{ color: "white", mb: 3, letterSpacing: "-0.01em" }}>
               Глобальное управление проектами
            </Typography>

            <Box sx={{ height: 600, width: "100%", bgcolor: "rgba(255,255,255,0.02)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <DataGrid
                    rows={projects}
                    columns={columns}
                    loading={isLoading}
                    getRowId={(row) => row._id}
                    density="compact"
                    initialState={{
                        pagination: { paginationModel: { page: 0, pageSize: 15 } },
                        sorting: {
                            sortModel: [{ field: 'createdAt', sort: 'desc' }],
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
                bgcolor: "#fff", // Фон самой таблицы
                color: "#000", // Основной цвет текста
                "& .MuiDataGrid-cell": {
                    color: "#000",
                    fontSize: "0.85rem",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    display: 'flex',
                    alignItems: 'center'
                },
                "& .MuiDataGrid-columnHeader": {
                    backgroundColor: "#f1f5f9", // Светлая подложка для шапки
                    color: "#000",
                },
                "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 800,
                    fontSize: "0.9rem",
                    color: "#000"
                },
                "& .MuiDataGrid-iconSeparator": {
                    display: "none"
                },
                "& .MuiDataGrid-columnHeaders": {
                    borderBottom: "2px solid rgba(0,0,0,0.1)",
                },
                "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid rgba(0,0,0,0.1)",
                    bgcolor: "#fff",
                    color: "#000"
                },
                "& .MuiTablePagination-root": {
                    color: "#000"
                },
                "& .MuiDataGrid-toolbarContainer": {
                    padding: 1.5,
                    bgcolor: "#fff",
                    borderBottom: "1px solid rgba(0,0,0,0.08)",
                    "& .MuiButton-root": { color: "#6d28d9", fontWeight: 700 }, // Более темный фиолетовый для контраста
                    "& .MuiInputBase-root": { 
                        color: "#000",
                        bgcolor: "#f8fafc", 
                        borderRadius: 2,
                        border: "1px solid rgba(0,0,0,0.1)",
                        px: 1,
                        "& .MuiSvgIcon-root": { color: "rgba(0,0,0,0.5)" }
                    }
                },
                "& .MuiDataGrid-sortIcon": {
                    color: "#000"
                },
                "& .MuiDataGrid-menuIcon": {
                    color: "#000"
                },
                "& .MuiCheckbox-root": {
                    color: "rgba(0,0,0,0.4)"
                }
                }}
                />
            </Box>
        </Box>
  )
}

export default AdminProjectsView