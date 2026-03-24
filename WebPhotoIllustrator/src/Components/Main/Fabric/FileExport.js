import React, { useState, useContext, useEffect, useRef } from "react";

import { Button } from "blocksin-system"; 
import { observer } from "mobx-react-lite";
import { useParams } from "react-router-dom";
import { 
    FloppyDiskIcon, 
    DownloadIcon, 
    UploadIcon,
    ChevronDownIcon 
} from "sebikostudio-icons";

import { SERIALIZATION_PROPS } from "./CanvasApp";
import { styles } from "./styles";
import { Context } from "../../../index";
import ProjectService from "../../../Services/ProjectService";
import { Box, IconButton, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import Modal from '@mui/material/Modal';
import { modalStyle } from "./styles";
import { Link } from "react-router-dom";
import {Button as MuiButton} from "@mui/material"
import { PROJECT_CATEGORIES, PROJECT_CATEGORY_LABELS } from "../../../constants/projectCategories";

function FileExport({ canvas,isReadOnly, isUnsavedRef }) {
    const { store } = useContext(Context);
    const { id: projectId } = useParams(); 

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [projectName, setProjectName] = useState("Новый проект");
    const [visibility, setVisibility] = useState("PRIVATE");
    const [category, setCategory] = useState("OTHER");
    const [isSaving, setIsSaving] = useState(false);

    const menuRef = useRef(null);

    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);


    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExportJson = () => {
        if (!canvas) return;
        setIsMenuOpen(false);
        const json = canvas.toJSON(SERIALIZATION_PROPS);
        json.width = canvas.width;
        json.height = canvas.height;
        const blob = new Blob([JSON.stringify(json)], { type: "application/json" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${projectName.replace(/\s+/g, "_")}.json`;
        link.click();
    };

    const handleImportJsonClick = () => {
        const input = document.getElementById("json-upload-input");
        if (input) input.click();
        setIsMenuOpen(false);
    };

    const handleFileChange = (e) => { 
        if (!canvas) return;
        const file = e.target.files[0];
        if (file && file.type === "application/json") {
            const reader = new FileReader();
            reader.onload = async () => { 
                try { 
                    const json = JSON.parse(reader.result);
                    canvas.clear();
                    await canvas.loadFromJSON(json);
                    if (json.width && json.height) {
                        canvas.setDimensions({
                            width: json.width,
                            height: json.height
                        });
                    }
                    canvas.requestRenderAll();
                    console.log("Canvas loaded successfully");
                } catch (err) {
                    console.error("Can't load canvas from json.", err);
                    alert("Ошибка при загрузке файла");
                }
            }
            reader.readAsText(file);
        }
        e.target.value = null;
    }

    const handleOpenSaveDialog = async () => {
        if (!store.isAuth) {
            alert("Войдите в аккаунт, чтобы сохранять проекты в облаке.");
            setIsMenuOpen(false);
            return;
        }
        if (projectId) {
            try {
                const response = await ProjectService.getProjectById(projectId);
                const projectInfo = response.data?.info;
                setProjectName(projectInfo?.name || "Новый проект");
                setVisibility(projectInfo?.visibility || "PRIVATE");
                setCategory(projectInfo?.category || "OTHER");
            } catch (e) {
                // Keep current values if metadata fetch fails.
                setProjectName((prev) => prev || "Новый проект");
            }
        } else {
            setProjectName("Новый проект");
            setVisibility("PRIVATE");
            setCategory("OTHER");
        }
        setIsModalOpen(true);
        setIsMenuOpen(false);
    };

    const handleConvertToPNG = () => {
        if (!canvas) return;
        const dataURL = canvas.toDataURL({
            format: "png",
            quality: 1.0
        });
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${projectName.replace(/\s+/g, "_")}.png`;
        link.click();
    }

    const handleConvertToJPEG = () => {
        if (!canvas) return;
        const dataURL = canvas.toDataURL({
            format: "jpeg",
            quality: 0.8
        });
        const link = document.createElement("a");
        link.href = dataURL;
        link.download = `${projectName.replace(/\s+/g, "_")}.jpeg`;
        link.click();
    }

    const handleSaveToCloud = async () => {
        if (!canvas) return;
        setIsSaving(true);
        try {
            const json = canvas.toJSON(SERIALIZATION_PROPS);
            json.width = canvas.width;
            json.height = canvas.height;
            
            const previewImage = canvas.toDataURL({
                format: "png", 
                quality: 0.5,   
                width: canvas.width ,
                height: canvas.height,
            });

            if (projectId) {
                await ProjectService.updateProject(projectId, json, visibility, previewImage, projectName, category);
                if (isUnsavedRef) isUnsavedRef.current = false;
                alert("Проект успешно обновлён!");
                setIsModalOpen(false);
            } else {
                await ProjectService.createProject(projectName, json, visibility, previewImage, category);
                if (isUnsavedRef) isUnsavedRef.current = false;
                alert("Проект успешно сохранён!");
                setIsModalOpen(false);
            }
        } catch (err) {
            console.error("Error saving project:", err);
            let msg = err.response?.data?.message || err.message || "Не удалось сохранить проект.";
            if (msg.includes("too large") || (err.response && err.response.status === 413)) {
                msg = "Проект слишком большой для сохранения. Уменьшите размер изображений или попросите администратора увеличить лимит на сервере.";
            }
            alert(msg);
        } finally {
            setIsSaving(false);
        }
    };


    if (isReadOnly) {
        return (
            <div className='FileExport'>
                <Button 
                    variant="ghost" 
                    size="small" 
                    onClick={handleExportJson} 
                    style={styles.mainButton}
                >
                    <DownloadIcon style={{marginRight: 5}}/> Скачать JSON
                </Button>
            </div>
        );
    }

    if (!store.isAuth) {
        return (
            <div className='FileExport'>
            <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            style={{zIndex:100000000}}
            >
            <Box sx={{ ...modalStyle, position: "relative" }}>
                <IconButton
                  aria-label="Закрыть"
                  onClick={handleClose}
                  size="small"
                  sx={{ position: "absolute", top: 8, right: 8, color: "rgba(255,255,255,0.75)" }}
                >
                  <CloseIcon />
                </IconButton>
                <Typography id="demo-modal-title" variant="h6" component="h2" sx={{ color: "#fff" }}>
                🎨 Демо-режим
                </Typography>
                <Typography sx={{ mt: 2, color: "rgba(255,255,255,0.78)" }}>
                Вы используете редактор в демо-режиме и не можете сохранить проект!
                </Typography>
                <Typography sx={{ mt: 2, mb: 2, cursor: "pointer" }}>
                <Link to="/" style={{ color: "#7dd3fc" }}>Авторизируйтесь</Link>
                </Typography>
                <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: 20}}>
                <MuiButton onClick={handleClose} variant="contained" sx={{ textTransform: "none", bgcolor: "#2dd4bf", color: "#0f172a", "&:hover": { bgcolor: "#5eead4" } }}>
                    Продолжить в демо
                </MuiButton>
                </div>
            </Box>
            </Modal>
            <Button 
                variant="ghost" 
                size="small" 
                onClick={handleOpen}
                style={styles.mainButton}
            >
                Файл / Сохранение
            </Button>
            </div>
        )
    }

    return (
        <div className='FileExport' style={{ position: "relative" , marginLeft:"10px"}} ref={menuRef}>
            
            <Button 
                variant="ghost" 
                size="small" 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                style={styles.mainButton}
            >
                Файл / Сохранение
            </Button>

            {isMenuOpen && (
                <div style={styles.dropdownMenu}>
                    <div className="fabric-dropdown__item" style={styles.menuItem} onClick={handleOpenSaveDialog}>
                        <FloppyDiskIcon style={styles.icon} /> Сохранить в облако
                    </div>
                    <div className="fabric-dropdown__item" style={styles.menuItem} onClick={handleExportJson}>
                        <DownloadIcon style={styles.icon} /> Экспорт JSON
                    </div>
                    <div className="fabric-dropdown__item" style={styles.menuItem} onClick={handleConvertToPNG}>
                        <DownloadIcon style={styles.icon} /> Экспорт PNG
                    </div>
                    <div className="fabric-dropdown__item" style={styles.menuItem} onClick={handleConvertToJPEG}>
                        <DownloadIcon style={styles.icon} /> Экспорт JPEG
                    </div>
                    <div className="fabric-dropdown__item" style={styles.menuItem} onClick={handleImportJsonClick}>
                        <UploadIcon style={styles.icon} /> Импорт JSON
                    </div>
                </div>
            )}

            <input 
                id="json-upload-input"
                type='file' 
                accept='.json' 
                onChange={handleFileChange}
                style={{ display: "none" }}
            />

            {isModalOpen && (
                <div style={styles.modalOverlay}>
                    <div style={{ ...styles.modalContent, position: "relative" }}>
                        <IconButton
                          aria-label="Закрыть"
                          onClick={() => setIsModalOpen(false)}
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 12,
                            right: 12,
                            color: "rgba(255,255,255,0.7)",
                            "&:hover": { color: "#fff" },
                          }}
                        >
                          <CloseIcon />
                        </IconButton>
                        <h3 style={{ ...styles.modalTitle, paddingRight: 40 }}>
                            {projectId ? "Обновить проект" : "Сохранить проект"}
                        </h3>
                        
                        <div style={styles.formGroup}>
                            <label style={styles.label}>Название проекта</label>
                            <input 
                                type="text" 
                                value={projectName}
                                onChange={(e) => setProjectName(e.target.value)}
                                style={styles.input}
                                placeholder="Введите название"
                            />
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Видимость</label>
                            <select 
                                value={visibility}
                                onChange={(e) => setVisibility(e.target.value)}
                                style={styles.select}
                            >
                                <option value="PRIVATE">Только я</option>
                                <option value="PUBLIC">Публичный</option>
                            </select>
                        </div>

                        <div style={styles.formGroup}>
                            <label style={styles.label}>Категория</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                style={styles.select}
                            >
                                {PROJECT_CATEGORIES.map((item) => (
                                    <option key={item} value={item}>
                                        {PROJECT_CATEGORY_LABELS[item]}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={styles.modalActions}>
                            <Button 
                                variant="secondary" 
                                onClick={() => setIsModalOpen(false)}
                                style={{ marginRight: "10px" }}
                            >
                                Отмена
                            </Button>
                            <Button 
                                variant="primary" 
                                onClick={handleSaveToCloud}
                                disabled={isSaving}
                            >
                                {isSaving ? "Сохранение…" : "Сохранить"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}


export default observer(FileExport);