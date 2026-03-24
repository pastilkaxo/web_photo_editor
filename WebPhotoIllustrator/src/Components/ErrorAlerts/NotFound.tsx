import React from "react"

import { Typography, Container, Button } from "@mui/material";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="main-container">
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          textAlign: "center",
        }}
      >
        <div style={{backgroundColor:"white", padding:"45px", borderRadius:"25px"}}>
          <Typography variant="h1" component="h1" gutterBottom fontFamily="sans-serif">
        404
          </Typography>
          <Typography variant="h5" component="h2" gutterBottom fontFamily="sans-serif">
        Страница не найдена
          </Typography>
          <Typography variant="body1" fontFamily="sans-serif">
        Страница, которую вы ищете, возможно, была удалена, её имя изменено или она временно недоступна.
          </Typography>
          <Button variant="contained" component={Link} to="/" >
        На главную
          </Button>
        </div>
      </Container>
    </div>
  )
}
