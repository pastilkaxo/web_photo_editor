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
  /** Подсветка для победителей конкурса (золотая рамка вокруг имени) */
  highlightGolden?: boolean;
}

export function AuthorNameLink({
  ownerId,
  ownerName,
  prefix = "Автор: ",
  variant = "body2",
  mutedSx = { color: "rgba(255,255,255,0.5)" },
  nameSx = { color: "#a78bfa", fontWeight: 700 },
  highlightGolden = false,
}: AuthorNameLinkProps) {
  const label = (ownerName && ownerName.trim()) || "Автор";
  const goldenWrap: SxProps<Theme> = highlightGolden
    ? {
        display: "inline-block",
        px: 0.75,
        py: 0.25,
        borderRadius: 1,
        border: "1px solid rgba(251, 191, 36, 0.85)",
        boxShadow: "0 0 12px rgba(251, 191, 36, 0.35)",
        backgroundColor: "rgba(251, 191, 36, 0.08)",
      }
    : {};

  return (
    <Typography variant={variant} component="span" sx={mutedSx}>
      {prefix}
      {!ownerId ? (
        <Box component="span" sx={{ ...nameSx, ...goldenWrap }}>
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
            ...goldenWrap,
          }}
        >
          {label}
        </Link>
      )}
    </Typography>
  );
}
