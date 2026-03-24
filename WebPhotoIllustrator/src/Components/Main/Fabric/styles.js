/** Единая тёмная поверхность для панелей, выпадающих меню и модалок редактора Fabric */
export const FABRIC_MENU = {
    surface: "#1e1e2a",
    surfaceElevated: "#262633",
    surfaceInput: "#2a2a38",
    border: "rgba(255, 255, 255, 0.12)",
    borderStrong: "rgba(255, 255, 255, 0.2)",
    text: "#f0f0f5",
    textMuted: "#e8e8ef",
    caption: "rgba(255, 255, 255, 0.55)",
    rowHover: "rgba(255, 255, 255, 0.08)",
    primary: "#2dd4bf",
    primaryHover: "#5eead4",
    primaryText: "#0f172a",
    fieldBg: "rgba(255, 255, 255, 0.06)",
};

export const styles = {
    mainButton: {
        marginLeft:"10px",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "white",
    },
    dropdownMenu: {
        position: "absolute",
        top: "110%",
        left: 0,
        backgroundColor: FABRIC_MENU.surface,
        borderRadius: "8px",
        border: `1px solid ${FABRIC_MENU.border}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
        zIndex: 100,
        minWidth: "248px",
        padding: "5px 0"
    },
    menuItem: {
        padding: "10px 15px",
        color: FABRIC_MENU.textMuted,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        fontSize: "14px",
        transition: "background 0.2s",
    },
    icon: {
        marginRight: "10px",
        width: "16px",
        height: "16px"
    },
    // Modal Styles
    modalOverlay: {
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        backdropFilter: "blur(2px)"
    },
    modalContent: {
        backgroundColor: FABRIC_MENU.surface,
        padding: "25px",
        borderRadius: "12px",
        width: "min(440px, 92vw)",
        border: `1px solid ${FABRIC_MENU.border}`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.55)",
        color: FABRIC_MENU.text
    },
    modalTitle: {
        marginTop: 0,
        marginBottom: "20px",
        fontSize: "18px",
        borderBottom: `1px solid ${FABRIC_MENU.border}`,
        paddingBottom: "10px"
    },
    formGroup: {
        marginBottom: "15px"
    },
    label: {
        display: "block",
        marginBottom: "5px",
        fontSize: "12px",
        color: FABRIC_MENU.caption
    },
    input: {
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: `1px solid ${FABRIC_MENU.border}`,
        backgroundColor: FABRIC_MENU.surfaceInput,
        color: FABRIC_MENU.text,
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box" // Важно для padding
    },
    select: {
        width: "100%",
        padding: "10px",
        borderRadius: "4px",
        border: `1px solid ${FABRIC_MENU.border}`,
        backgroundColor: FABRIC_MENU.surfaceInput,
        color: FABRIC_MENU.text,
        fontSize: "14px",
        outline: "none",
        boxSizing: "border-box"
    },
    modalActions: {
        display: "flex",
        justifyContent: "flex-end",
        marginTop: "20px",
        paddingTop: "15px",
        borderTop: `1px solid ${FABRIC_MENU.border}`
    }
};



export const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  maxWidth: '92vw',
  bgcolor: FABRIC_MENU.surface,
  color: FABRIC_MENU.text,
  border: `1px solid ${FABRIC_MENU.border}`,
  borderRadius: '12px',
  boxShadow: '0 12px 40px rgba(0,0,0,0.55)',
  p: 4,
  fontFamily: '"IBM Plex Sans", "Segoe UI", system-ui, sans-serif',
};
