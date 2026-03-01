import React from "react";
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Typography from '@mui/material/Typography';
import { useTheme, alpha } from '@mui/material/styles';

const renderMenuItems = (items, onItemClick, isMobile, theme) => {
  const resolvedTheme = theme.vars || theme;
  const textPrimary = resolvedTheme.palette.text.primary;
  const dividerColor = alpha(textPrimary, theme.palette.mode === "dark" ? 0.25 : 0.35);
  const hoverDefault = alpha(textPrimary, theme.palette.mode === "dark" ? 0.08 : 0.05);

  return items.map((item, index) => {
    if (item.type === "divider") {
      return (
        <Divider
          key={item.key || `divider-${index}`}
          sx={{ borderColor: dividerColor, my: 0.5 }}
        />
      );
    }
    return (
      <React.Fragment key={item.key || index}>
        {item.dividerBefore && <Divider sx={{ borderColor: dividerColor, my: 0.5 }} />}
        <MenuItem
          onClick={() => onItemClick(item)}
          disabled={item.disabled}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: item.fontWeight ?? 500,
            color: item.color || textPrimary,
            "&:hover": {
              backgroundColor: item.hoverBg || hoverDefault,
            },
            ...item.sx,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <Box
              sx={{
                color: item.iconColor || item.color || alpha(textPrimary, 0.7),
                display: "flex",
                alignItems: "center",
                minWidth: 30,
              }}
            >
              {item.icon}
            </Box>
            {item.label}
          </Box>
        </MenuItem>
        {item.dividerAfter && <Divider sx={{ borderColor: dividerColor, my: 0.5 }} />}
      </React.Fragment>
    );
  });
};

const renderDrawerItems = (items, onItemClick, theme) => {
  const resolvedTheme = theme.vars || theme;
  const textPrimary = resolvedTheme.palette.text.primary;
  const dividerColor = alpha(textPrimary, theme.palette.mode === "dark" ? 0.25 : 0.35);
  const hoverDefault = alpha(textPrimary, theme.palette.mode === "dark" ? 0.12 : 0.08);

  return items.map((item, index) => {
    if (item.type === "divider") {
      return (
        <Divider
          key={item.key || `divider-${index}`}
          sx={{ borderColor: dividerColor, my: 0.5 }}
        />
      );
    }
    return (
      <React.Fragment key={item.key || index}>
        {item.dividerBefore && <Divider sx={{ borderColor: dividerColor, my: 0.5 }} />}
        <ListItem
          component="button"
          onClick={() => onItemClick(item)}
          disabled={item.disabled}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            "&:hover": {
              backgroundColor: item.hoverBg || hoverDefault,
            },
            ...item.drawerSx,
          }}
        >
          <ListItemIcon
            sx={{
              color: item.iconColor || item.color || alpha(textPrimary, 0.75),
              minWidth: 40,
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              sx: { color: item.color || textPrimary, fontWeight: item.fontWeight ?? 600 },
            }}
          />
        </ListItem>
        {item.dividerAfter && <Divider sx={{ borderColor: dividerColor, my: 0.5 }} />}
      </React.Fragment>
    );
  });
};

export const ActionMenu = ({
  isMobile,
  anchorEl,
  open,
  onClose,
  drawerOpen,
  onCloseDrawer,
  items,
  menuPaperSx,
  drawerTitle,
  drawerSubtitle,
  showCancel = true,
  cancelLabel = "Cancel",
}) => {
  const theme = useTheme();
  const resolvedTheme = theme.vars || theme;
  const menuBackground = resolvedTheme.palette.background.paper;
  const textPrimary = resolvedTheme.palette.text.primary;
  const borderColor = alpha(textPrimary, 0.2);
  const cancelBorderColor = alpha(textPrimary, 0.4);
  const cancelHoverBackground = alpha(textPrimary, 0.08);

  const handleItemClick = (item) => {
    item.onClick?.();
    onClose?.();
  };

  const handleDrawerItemClick = (item) => {
    item.onClick?.();
    onCloseDrawer?.();
  };

  return (
    <>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            backgroundColor: menuBackground,
            color: textPrimary,
            minWidth: 220,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            border: `1px solid ${borderColor}`,
            ...menuPaperSx,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {renderMenuItems(items, handleItemClick, isMobile, theme)}
      </Menu>

      {isMobile && (
        <Drawer
          anchor="bottom"
          open={drawerOpen}
          onClose={onCloseDrawer}
          PaperProps={{
            sx: {
              maxHeight: "70vh",
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              backgroundColor: menuBackground,
              color: textPrimary,
            },
          }}
        >
          <Box sx={{ p: 2, pt: 3 }}>
            <Box
              sx={{
                width: 60,
                height: 6,
                backgroundColor: "rgba(255,255,255,0.25)",
                borderRadius: 3,
                mx: "auto",
                mb: 3,
              }}
            />

            {(drawerTitle || drawerSubtitle) && (
              <Box sx={{ mb: 2, px: 1 }}>
                {drawerTitle && (
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {drawerTitle}
                  </Typography>
                )}
                {drawerSubtitle && (
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {drawerSubtitle}
                  </Typography>
                )}
              </Box>
            )}

            <List sx={{ py: 0 }}>
              {renderDrawerItems(items, handleDrawerItemClick, theme)}
            </List>

            {showCancel && (
              <Button
                fullWidth
                variant="outlined"
                onClick={onCloseDrawer}
                sx={{
                  mt: 1.5,
                  color: resolvedTheme.palette.text.secondary,
                  borderColor: cancelBorderColor,
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: alpha(textPrimary, 0.6),
                    backgroundColor: cancelHoverBackground,
                  },
                }}
              >
                {cancelLabel}
              </Button>
            )}
          </Box>
        </Drawer>
      )}
    </>
  );
};
