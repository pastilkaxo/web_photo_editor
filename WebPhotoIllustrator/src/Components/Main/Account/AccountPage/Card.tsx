import {useContext, useState} from "react";

import Box from "@mui/joy/Box";
import Card from "@mui/joy/Card";
import Divider from "@mui/joy/Divider";
import AppBar from "@mui/material/AppBar";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import {observer} from  "mobx-react-lite";

import AdminView from "./AdminView";
import FavView from "./FavView";
import ProfileView from "./ProfileView";
import ProjectsView from "./ProjectsView";
import SettingsView from "./SecurityView";
import AdminProjectsView from "./AdminProjectsView";
import {Context} from "../../../../index";

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: number;
  value: number;
}


function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`full-width-tabpanel-${index}`}
      aria-labelledby={`full-width-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
            {children}
        </Box>
      )}
    </div>
  );
}



function a11yProps(index: number) {
  return {
    id: `full-width-tab-${index}`,
    "aria-controls": `full-width-tabpanel-${index}`,
  };
}



function ProfileCard(){
  const {store} = useContext(Context);
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };



  return(
    <Card sx={{ 
      borderRadius: 4, 
      overflow: "hidden", 
      border: "1px solid rgba(255,255,255,0.08)", 
      boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      background: "rgba(15, 23, 42, 0.4)", // Dark slate/navy semi-transparent
      backdropFilter: "blur(20px)",
    }}>
      <AppBar
        position="static"
        sx={{
          background: "linear-gradient(90deg, #1e293b 0%, #0f172a 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "none"
        }}
      >
        <Tabs
          value={value}
          onChange={handleChange}
          indicatorColor="primary"
          textColor="inherit"
          variant="scrollable"
          aria-label="profile tabs"
          sx={{
            "& .MuiTabs-indicator": {
              backgroundColor: "#a78bfa", // Violet highlight
              height: 3,
              borderRadius: "3px 3px 0 0"
            },
          }}
        >
          <Tab label="Профиль" {...a11yProps(0)} sx={{ fontWeight: 700, px: 3, textTransform: "none", fontSize: "0.95rem" }} />
          <Tab label="Проекты" {...a11yProps(1)} sx={{ fontWeight: 700, px: 3, textTransform: "none", fontSize: "0.95rem" }} />
          <Tab label="Избранное" {...a11yProps(2)} sx={{ fontWeight: 700, px: 3, textTransform: "none", fontSize: "0.95rem" }} />
          <Tab label="Безопасность" {...a11yProps(3)} sx={{ fontWeight: 700, px: 3, textTransform: "none", fontSize: "0.95rem" }} />
          {store.user.roles.includes("ADMIN") && <Tab label="Админ панель" {...a11yProps(4)} sx={{ fontWeight: 700, px: 3, textTransform: "none", fontSize: "0.95rem", color: "#fca5a5" }} />}
          {store.user.roles.includes("ADMIN") && <Tab label="Проекты (Админ)" {...a11yProps(5)} sx={{ fontWeight: 700, px: 3, textTransform: "none", fontSize: "0.95rem", color: "#fca5a5" }} />}
        </Tabs>
      </AppBar>
      <Divider />
      <TabPanel value={value} index={0}>
        <ProfileView/>
      </TabPanel>
      <TabPanel value={value} index={1}>
        <ProjectsView/>
      </TabPanel>
      <TabPanel value={value} index={2}>
        <FavView/>
      </TabPanel>
      <TabPanel value={value} index={3}>
        <SettingsView/>
      </TabPanel>
      <TabPanel value={value} index={4}>
        {store.user.roles.includes("ADMIN") && <AdminView />}
      </TabPanel>
      <TabPanel value={value} index={5}>
        {store.user.roles.includes("ADMIN") && <AdminProjectsView />}
      </TabPanel>
    </Card>
  )
}


export default observer(ProfileCard);