import React, { useState, useEffect,useContext } from "react";


import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { 
    Box, 
    Button, 
    Typography, 
    IconButton, 
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Stack,
    Tooltip
} from "@mui/material";
import { 
    DataGrid, 
    GridColDef, 
    GridRenderCellParams, 
    GridToolbar 
} from "@mui/x-data-grid";

import { Context } from "../../../..";
import { IUser } from "../../../../models/IUser";
import UserService from "../../../../Services/UserService";

const AdminView: React.FC = () => {
    const [users, setUsers] = useState<IUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const {store} = useContext(Context);
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState<IUser | null>(null);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            const response = await UserService.fetchUsers();
            const filteredUsers = response.data.filter((u: IUser) => {
                const viewerId = store.user.id ?? store.user._id;
                const isMe = viewerId != null && String(u._id) === String(viewerId);
                const isAdmin = u.roles.includes("ADMIN");
                return !isMe && !isAdmin;
            })
            setUsers(filteredUsers);
        } catch (err: any) {
            setError(err.response?.data?.message || "Ошибка при загрузке пользователей");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);


    const handleToggleBlock = async (user: IUser) => {
        try {
            if (user.isBlocked) {
                await UserService.unblockUser(user._id);
            } else {
                await UserService.blockUser(user._id);
            }
            fetchUsers(); 
        } catch (err: any) {
            alert(err.response?.data?.message || "Произошла ошибка");
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (window.confirm("Вы уверены, что хотите удалить этого пользователя?")) {
            try {
                await UserService.deleteUser(userId);
                fetchUsers();
            } catch (err: any) {
                alert(err.response?.data?.message || "Произошла ошибка");
            }
        }
    };


    const handleOpenEdit = (user: IUser) => {
        setEditingUser(user);
        setFirstName(user.firstName || "");
        setLastName(user.lastName || "");
        setOpenEditModal(true);
    };

    const handleCloseEdit = () => {
        setOpenEditModal(false);
        setEditingUser(null);
        setFirstName("");
        setLastName("");
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;
        try {
            await UserService.updateUser(editingUser._id, { firstName, lastName });
            handleCloseEdit();
            fetchUsers();
        } catch (err: any) {
            alert(err.response?.data?.message || "Не удалось обновить пользователя");
        }
    };


    const columns: GridColDef[] = [
        { field: "_id", headerName: "ID", width: 220 },
        { field: "email", headerName: "Email", width: 200, flex: 1 },
        { field: "firstName", headerName: "Имя", width: 120 }, 
        { field: "lastName", headerName: "Фамилия", width: 120 },
        { 
            field: "isActivated", 
            headerName: "Активация", 
            width: 140,
            renderCell: (params: GridRenderCellParams) => (
                <Chip 
                    label={params.value ? "Активирован" : "Нет"} 
                    color={params.value ? "success" : "warning"} 
                    variant="outlined"
                    size="small"
                />
            )
        },
        { 
            field: "isBlocked", 
            headerName: "Статус", 
            width: 110,
            renderCell: (params: GridRenderCellParams) => (
                <Chip 
                    label={params.value ? "Заблокирован" : "Активен"} 
                    color={params.value ? "error" : "success"} 
                    size="small"
                />
            )
        },
        {
            field: "actions",
            headerName: "Действия",
            width: 150,
            sortable: false,
            renderCell: (params: GridRenderCellParams) => {
                const user = params.row as IUser;
                return (
                    <Stack direction="row" spacing={1}>
                        <Tooltip title={user.isBlocked ? "Разблокировать" : "Блокировать"}>
                            <IconButton 
                                color={user.isBlocked ? "success" : "warning"} 
                                onClick={() => handleToggleBlock(user)}
                            >
                                {user.isBlocked ? <CheckCircleIcon /> : <BlockIcon />}
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Изменить">
                            <IconButton color="primary" onClick={() => handleOpenEdit(user)}>
                                <EditIcon />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="Удалить">
                            <IconButton color="error" onClick={() => handleDeleteUser(user._id)}>
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
                Управление пользователями
            </Typography>

            <Box sx={{ height: 600, width: "100%", bgcolor: "rgba(255,255,255,0.02)", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)" }}>
                <DataGrid
                    rows={users}
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
                        "& .MuiDataGrid-footerContainer": {
                            borderTop: "1px solid rgba(255,255,255,0.1)",
                            color: "#fff"
                        },
                        "& .MuiTablePagination-root": {
                            color: "#fff"
                        },
                        "& .MuiDataGrid-toolbarContainer": {
                            padding: 1,
                            bgcolor: "rgba(255,255,255,0.02)",
                            "& .MuiButton-root": { color: "#a78bfa" },
                            "& .MuiTextField-root": { bgcolor: "rgba(255,255,255,0.05)", borderRadius: 1 }
                        }
                    }}
                />
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
                         <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.4)" }}>
                             ID: {editingUser?._id}
                         </Typography>
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
        </Box>
    );
};

export default AdminView;