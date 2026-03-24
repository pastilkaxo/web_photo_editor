import React, { useState, useEffect } from "react";

import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";

interface AlertSettings { 
  message: string;
}

export default function ErrorAlert({ message }: AlertSettings) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (message) {
      setOpen(true);
    }
  }, [message]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === "clickaway") {
      return;
    }
    setOpen(false);
  };

  return (
    <Snackbar
      open={open} 
      autoHideDuration={3000} 
      onClose={handleClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert   key={Date.now()} variant="filled" severity="error" onClose={handleClose}>
        {message}
      </Alert>
    </Snackbar>
  );
}