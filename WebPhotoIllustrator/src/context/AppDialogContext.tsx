import React, {
    createContext,
    useCallback,
    useContext,
    useRef,
    useState,
} from "react";

import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Typography,
} from "@mui/material";

export type AppDialogContextValue = {
    alert: (message: string) => Promise<void>;
    confirm: (message: string, options?: { title?: string }) => Promise<boolean>;
    prompt: (
        message: string,
        options?: { title?: string; defaultValue?: string; multiline?: boolean }
    ) => Promise<string | null>;
};

const AppDialogContext = createContext<AppDialogContextValue | null>(null);

export function useAppDialog(): AppDialogContextValue {
    const ctx = useContext(AppDialogContext);
    if (!ctx) {
        throw new Error("useAppDialog must be used within AppDialogProvider");
    }
    return ctx;
}

type Mode = "idle" | "alert" | "confirm" | "prompt";

/** Выше оверлея «Сохранить проект» в редакторе (9999) и MUI Modal редактора (1e8). */
const APP_DIALOG_Z_INDEX = 100_000_001;

export function AppDialogProvider({ children }: { children: React.ReactNode }) {
    const [mode, setMode] = useState<Mode>("idle");
    const [message, setMessage] = useState("");
    const [title, setTitle] = useState("");
    const [promptValue, setPromptValue] = useState("");
    const [promptMultiline, setPromptMultiline] = useState(false);
    const resolveRef = useRef<((v: unknown) => void) | null>(null);

    const finish = useCallback(() => {
        setMode("idle");
        setMessage("");
        setTitle("");
        setPromptValue("");
        setPromptMultiline(false);
        resolveRef.current = null;
    }, []);

    const alertFn = useCallback((msg: string) => {
        return new Promise<void>((resolve) => {
            resolveRef.current = () => resolve();
            setMessage(msg);
            setTitle("");
            setMode("alert");
        });
    }, []);

    const confirmFn = useCallback(
        (msg: string, options?: { title?: string }) => {
            return new Promise<boolean>((resolve) => {
                resolveRef.current = (v: unknown) => resolve(v as boolean);
                setMessage(msg);
                setTitle(options?.title || "Подтверждение");
                setMode("confirm");
            });
        },
        []
    );

    const promptFn = useCallback(
        (
            msg: string,
            options?: { title?: string; defaultValue?: string; multiline?: boolean }
        ) => {
            return new Promise<string | null>((resolve) => {
                resolveRef.current = (v: unknown) => resolve(v as string | null);
                setMessage(msg);
                setTitle(options?.title || "");
                setPromptValue(options?.defaultValue ?? "");
                setPromptMultiline(!!options?.multiline);
                setMode("prompt");
            });
        },
        []
    );

    const paperSx = {
        bgcolor: "#1e293b",
        color: "#fff",
        backgroundImage: "none",
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.1)",
    };

    const handleAlertClose = () => {
        resolveRef.current?.();
        finish();
    };

    const handleConfirm = (ok: boolean) => {
        resolveRef.current?.(ok);
        finish();
    };

    const handlePromptOk = () => {
        resolveRef.current?.(promptValue);
        finish();
    };

    const handlePromptCancel = () => {
        resolveRef.current?.(null);
        finish();
    };

    return (
        <AppDialogContext.Provider value={{ alert: alertFn, confirm: confirmFn, prompt: promptFn }}>
            {children}
            <Dialog
                open={mode === "alert"}
                onClose={handleAlertClose}
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: APP_DIALOG_Z_INDEX }}
                PaperProps={{ sx: paperSx }}
            >
                <DialogContent sx={{ pt: 3 }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2 }}>
                    <Button
                        onClick={handleAlertClose}
                        variant="contained"
                        sx={{ textTransform: "none", bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" } }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={mode === "confirm"}
                onClose={() => handleConfirm(false)}
                maxWidth="xs"
                fullWidth
                sx={{ zIndex: APP_DIALOG_Z_INDEX }}
                PaperProps={{ sx: paperSx }}
            >
                {title ? (
                    <DialogTitle sx={{ fontWeight: 800, pb: 0 }}>{title}</DialogTitle>
                ) : null}
                <DialogContent sx={title ? { pt: 1 } : { pt: 3 }}>
                    <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                        {message}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={() => handleConfirm(false)} sx={{ textTransform: "none", color: "rgba(255,255,255,0.7)" }}>
                        Отмена
                    </Button>
                    <Button
                        onClick={() => handleConfirm(true)}
                        variant="contained"
                        sx={{ textTransform: "none", bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" } }}
                    >
                        Да
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={mode === "prompt"}
                onClose={handlePromptCancel}
                maxWidth="sm"
                fullWidth
                sx={{ zIndex: APP_DIALOG_Z_INDEX }}
                PaperProps={{ sx: paperSx }}
            >
                {title ? <DialogTitle sx={{ fontWeight: 800 }}>{title}</DialogTitle> : null}
                <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: title ? 1 : 3 }}>
                    <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", whiteSpace: "pre-wrap" }}>
                        {message}
                    </Typography>
                    <TextField
                        autoFocus
                        fullWidth
                        multiline={promptMultiline}
                        minRows={promptMultiline ? 3 : 1}
                        value={promptValue}
                        onChange={(e) => setPromptValue(e.target.value)}
                        sx={{
                            "& .MuiOutlinedInput-root": {
                                color: "#fff",
                                bgcolor: "rgba(255,255,255,0.05)",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                                borderColor: "rgba(255,255,255,0.2)",
                            },
                        }}
                    />
                </DialogContent>
                <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                    <Button onClick={handlePromptCancel} sx={{ textTransform: "none", color: "rgba(255,255,255,0.7)" }}>
                        Отмена
                    </Button>
                    <Button
                        onClick={handlePromptOk}
                        variant="contained"
                        sx={{ textTransform: "none", bgcolor: "#8b5cf6", "&:hover": { bgcolor: "#7c3aed" } }}
                    >
                        OK
                    </Button>
                </DialogActions>
            </Dialog>
        </AppDialogContext.Provider>
    );
}
