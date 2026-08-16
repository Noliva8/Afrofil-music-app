import { useState } from "react";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Toolbar from "@mui/material/Toolbar";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import AccountCircleRoundedIcon from "@mui/icons-material/AccountCircleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MusicNoteRoundedIcon from "@mui/icons-material/MusicNoteRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { SitemarkIcon } from "../../components/themeCustomization/customIcon";
import UserAuth from "../../utils/auth";

const BusinessAppBar = ({ businessName = "" }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const profile = UserAuth.getProfile();
  const accountName = businessName || profile?.data?.businessProfile?.businessName || "Business";
  const [accountMenuAnchor, setAccountMenuAnchor] = useState(null);
  const accountMenuOpen = Boolean(accountMenuAnchor);

  const getInitials = (name) => {
    if (!name) return "B";
    const names = name.trim().split(/\s+/);
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const businessInitials = getInitials(accountName);

  const handleAccountMenuOpen = (event) => {
    setAccountMenuAnchor(event.currentTarget);
  };

  const handleAccountMenuClose = () => {
    setAccountMenuAnchor(null);
  };

  const handleAccountSwitch = (path) => {
    handleAccountMenuClose();
    navigate(path);
  };

  const handleLogout = () => {
    handleAccountMenuClose();
    UserAuth.logout("/welcome");
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: alpha(theme.palette.background.default, 0.92),
        backgroundImage: "none",
        backdropFilter: "blur(16px)",
        borderBottom: "none",
      }}
    >
      <Toolbar
        component="nav"
        aria-label="Business"
        sx={{
          justifyContent: "space-between",
          py: 1.25,
          gap: 2,
          px: { xs: 2, md: 3 },
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              "&:hover .logo-text": {
                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              },
            }}
          >
            <Button
              aria-label="FloLup business home"
              onClick={() => navigate("/business/licensing/overview")}
              sx={{
                p: 0,
                minWidth: "auto",
                color: "inherit",
                "&:hover": { bgcolor: "transparent", transform: "translateY(-1px)" },
                transition: "transform 0.15s ease",
              }}
            >
              <SitemarkIcon sx={{ width: 40, height: 40 }} />
              <Typography
                variant="h6"
                className="logo-text"
                sx={{
                  fontWeight: 800,
                  color: theme.palette.text.primary,
                  transition: "all 0.3s ease",
                  fontFamily: theme.typography.fontFamily,
                  fontSize: "1.2rem",
                  lineHeight: 1.2,
                  ml: 0.5,
                  display: { xs: "none", sm: "block" },
                }}
              >
                FloLup Business
              </Typography>
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Tooltip title="Business account">
            <Button
              onClick={handleAccountMenuOpen}
              aria-controls={accountMenuOpen ? "business-account-menu" : undefined}
              aria-haspopup="true"
              aria-expanded={accountMenuOpen ? "true" : undefined}
              endIcon={<KeyboardArrowDownRoundedIcon fontSize="small" />}
              sx={{
                ml: 0.5,
                minWidth: "auto",
                px: { xs: 1, sm: 1.25 },
                py: 0.75,
                gap: 0.75,
                borderRadius: 999,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.text.primary,
                textTransform: "none",
                fontFamily: theme.typography.fontFamily,
                fontWeight: 800,
                "& .MuiButton-endIcon": {
                  ml: { xs: 0, sm: 0.25 },
                  color: theme.palette.text.secondary,
                },
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.18),
                  borderColor: alpha(theme.palette.primary.main, 0.65),
                },
              }}
            >
              <AccountCircleRoundedIcon
                sx={{
                  width: 28,
                  height: 28,
                  color: theme.palette.primary.main,
                }}
              />
              <Typography
                component="span"
                sx={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  lineHeight: 1,
                  color: theme.palette.text.primary,
                  display: { xs: "none", sm: "inline" },
                  fontFamily: theme.typography.fontFamily,
                }}
              >
                {businessInitials}
              </Typography>
            </Button>
          </Tooltip>
        </Box>
      </Toolbar>

      <Menu
        id="business-account-menu"
        anchorEl={accountMenuAnchor}
        open={accountMenuOpen}
        onClose={handleAccountMenuClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 190,
            background: alpha(theme.palette.background.paper, 0.98),
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography sx={{ fontWeight: 800, color: theme.palette.text.primary, fontFamily: theme.typography.fontFamily }}>
            {accountName}
          </Typography>
          <Typography variant="caption" sx={{ color: theme.palette.text.secondary, fontFamily: theme.typography.fontFamily }}>
            Switch account
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => handleAccountSwitch("/")}>
          <ListItemIcon>
            <PersonRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Personal</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAccountSwitch("/welcome?login=1")}>
          <ListItemIcon>
            <MusicNoteRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Artist</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => handleAccountSwitch("/welcome")}>
          <ListItemIcon>
            <CampaignRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Advertiser</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>
    </AppBar>
  );
};

export default BusinessAppBar;
