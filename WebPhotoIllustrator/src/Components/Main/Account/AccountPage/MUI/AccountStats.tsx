import React from "react"

import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { observer } from "mobx-react-lite";

function AccountStats({StatName, StatValue}: any) {
  return (
      <Card
        sx={{
          minWidth: { xs: "100%", md: 180 },
          borderRadius: 3,
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          boxShadow: "none"
        }}
      >
    <CardContent sx={{ py: 2 }}>
      <Typography gutterBottom sx={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
        {StatName}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 60 }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 900, color: "#fff" }}>
          {StatValue}
        </Typography>
      </Box>
    </CardContent>
    </Card>
  )
}

export default observer(AccountStats);