import React, {useContext} from "react"

import Stack from "@mui/joy/Stack";
import { Avatar, Box, Chip, Paper, Typography } from "@mui/material";
import {observer} from  "mobx-react-lite";

import {Context} from "../../../../../index";

function MobileStack(){
  const {store} = useContext(Context);


  return(
    <Stack
      direction="column"
      spacing={2}
      sx={{ display: { xs: "flex", md: "none" }, my: 1 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 3,
          background: "linear-gradient(170deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
          border: "1px solid rgba(255,255,255,0.12)"
        }}
      >
        <Stack spacing={1.5} alignItems="center">
          <Avatar sx={{ width: 96, height: 96 }}>
            {store.user.firstName?.[0] || store.user.email?.[0] || "U"}
          </Avatar>
          <Typography variant="h6" textAlign="center">
            {store.user.firstName} {store.user.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">{store.user.email}</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
            <Chip size="small" label={`Проекты: ${store.user.projects.length || 0}`} />
            <Chip size="small" label={`Избранное: ${store.user.favorites.length || 0}`} />
            <Chip size="small" label={`Звезды: ${store.user.totalStars || 0}`} />
          </Box>
        </Stack>
      </Paper>
      <Stack direction="row" spacing={1} justifyContent="center">
        <Chip color={store.isActivated ? "success" : "warning"} label={store.isActivated ? "Почта подтверждена" : "Почта не подтверждена"} />
      </Stack>
    </Stack>
  )
}

export default observer(MobileStack);