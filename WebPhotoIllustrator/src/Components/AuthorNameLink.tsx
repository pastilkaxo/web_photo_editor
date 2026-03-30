import { Link as RouterLink } from "react-router-dom";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import { SxProps, Theme } from "@mui/material/styles";

interface AuthorNameLinkProps {
  ownerId?: string | null;
  ownerName?: string | null;
  prefix?: string;
  variant?: "body1" | "body2";
  mutedSx?: SxProps<Theme>;
  nameSx?: SxProps<Theme>;
}

export function AuthorNameLink({
  ownerId,
  ownerName,
  prefix = "Автор: ",
  variant = "body2",
  mutedSx = { color: "rgba(255,255,255,0.5)" },
  nameSx = { color: "#a78bfa", fontWeight: 700 },
}: AuthorNameLinkProps) {
  const label = (ownerName && ownerName.trim()) || "Автор";

  return (
    <Typography variant={variant} component="span" sx={mutedSx}>
      {prefix}
      {!ownerId ? (
        <Box component="span" sx={nameSx}>
          {label}
        </Box>
      ) : (
        <Link
          component={RouterLink}
          to={`/profile/${ownerId}`}
          onClick={(e) => e.stopPropagation()}
          sx={{
            textDecoration: "none",
            "&:hover": { textDecoration: "underline" },
            ...nameSx,
          }}
        >
          {label}
        </Link>
      )}
    </Typography>
  );
}
