import React from "react"

import BrushRounded from "@mui/icons-material/BrushRounded";
import EmojiEventsRounded from "@mui/icons-material/EmojiEventsRounded";
import FolderRounded from "@mui/icons-material/FolderRounded";
import HomeRounded from "@mui/icons-material/HomeRounded";
import MenuRounded from "@mui/icons-material/MenuRounded";
import PersonRounded from "@mui/icons-material/PersonRounded";
import ViewModuleRounded from "@mui/icons-material/ViewModuleRounded";
import { SxProps, Theme } from "@mui/material";
import { observer } from "mobx-react-lite";
import { Link, useLocation } from "react-router-dom"

import NavBar from "./NavBar"

const navIconSx: SxProps<Theme> = {
  fontSize: 40,
  color: "rgba(255, 255, 255, 0.9)",
  transition: "transform 0.25s ease, color 0.2s ease, opacity 0.2s ease",
  display: "block",
  ".nav-link:hover &": {
    transform: "scale(1.08)",
    color: "#fff",
  },
};

function Header() {
  const location = useLocation();
  const isEditorPage = location.pathname.startsWith("/editor");

  if (isEditorPage) {
    return null;
  }

  return (
    <aside className="app-sidebar">
      <nav className="nav navbar flex-column">
        <Link className="nav-link aLink" to="/" title="Главная" aria-label="Главная">
          <HomeRounded sx={navIconSx} />
        </Link>
        <Link className="nav-link aLink aLink-mobile" to="/storage" title="Каталог" aria-label="Каталог">
          <ViewModuleRounded sx={navIconSx} />
        </Link>
        <Link className="nav-link aLink aLink-mobile" to="/projects" title="Мои проекты" aria-label="Мои проекты">
          <FolderRounded sx={navIconSx} />
        </Link>
        <Link className="nav-link aLink aLink-mobile" to="/editor" title="Редактор" aria-label="Редактор">
          <BrushRounded sx={navIconSx} />
        </Link>
        <Link className="nav-link aLink aLink-mobile ms-md-0 ms-auto" to="/profile" title="Профиль" aria-label="Профиль">
          <PersonRounded sx={navIconSx} />
        </Link>
        <Link className="nav-link aLink aLink-mobile" to="/hall-of-fame" title="Зал славы" aria-label="Зал славы">
          <EmojiEventsRounded sx={navIconSx} />
        </Link>
        <span
          className="burgerIcon ms-md-0 ms-auto navbar-toggler"
          role="button"
          tabIndex={0}
          data-bs-toggle="offcanvas"
          data-bs-target="#offcanvasNavbar"
          aria-controls="offcanvasNavbar"
          aria-label="Открыть меню"
        >
          <MenuRounded sx={{ ...navIconSx, fontSize: 44, cursor: "pointer" }} />
        </span>
      </nav>
      <NavBar/>
    </aside>
  )
}

export default observer(Header)