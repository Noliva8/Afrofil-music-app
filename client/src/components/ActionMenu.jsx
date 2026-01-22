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

const renderMenuItems = (items, onItemClick, isMobile) =>
  items.map((item, index) => {
    if (item.type === "divider") {
      return (
        <Divider
          key={item.key || `divider-${index}`}
          sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }}
        />
      );
    }
    return (
      <React.Fragment key={item.key || index}>
        {item.dividerBefore && <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />}
        <MenuItem
          onClick={() => onItemClick(item)}
          disabled={item.disabled}
          sx={{
            py: isMobile ? 2 : 1.5,
            px: 2,
            fontSize: isMobile ? "1rem" : "0.95rem",
            fontWeight: item.fontWeight ?? 500,
            color: item.color || "#fff",
            "&:hover": { backgroundColor: item.hoverBg || "rgba(255,255,255,0.05)" },
            ...item.sx,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, width: "100%" }}>
            <Box
              sx={{
                color: item.iconColor || item.color || "rgba(255,255,255,0.7)",
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
        {item.dividerAfter && <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />}
      </React.Fragment>
    );
  });

const renderDrawerItems = (items, onItemClick) =>
  items.map((item, index) => {
    if (item.type === "divider") {
      return (
        <Divider
          key={item.key || `divider-${index}`}
          sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }}
        />
      );
    }
    return (
      <React.Fragment key={item.key || index}>
        {item.dividerBefore && <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />}
        <ListItem
          button
          onClick={() => onItemClick(item)}
          disabled={item.disabled}
          sx={{
            borderRadius: 2,
            mb: 0.5,
            "&:hover": { backgroundColor: item.hoverBg || "rgba(255,255,255,0.08)" },
            ...item.drawerSx,
          }}
        >
          <ListItemIcon
            sx={{
              color: item.iconColor || item.color || "rgba(255,255,255,0.75)",
              minWidth: 40,
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText
            primary={item.label}
            primaryTypographyProps={{
              sx: { color: item.color || "#fff", fontWeight: item.fontWeight ?? 600 },
            }}
          />
        </ListItem>
        {item.dividerAfter && <Divider sx={{ borderColor: "rgba(255,255,255,0.1)", my: 0.5 }} />}
      </React.Fragment>
    );
  });

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
            backgroundColor: "#181818",
            color: "#fff",
            minWidth: 220,
            borderRadius: 2,
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.1)",
            ...menuPaperSx,
          },
        }}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
      >
        {renderMenuItems(items, handleItemClick, isMobile)}
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
              backgroundColor: "#181818",
              color: "#fff",
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
              {renderDrawerItems(items, handleDrawerItemClick)}
            </List>

            {showCancel && (
              <Button
                fullWidth
                variant="outlined"
                onClick={onCloseDrawer}
                sx={{
                  mt: 1.5,
                  color: "rgba(255,255,255,0.85)",
                  borderColor: "rgba(255,255,255,0.3)",
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.5)",
                    backgroundColor: "rgba(255,255,255,0.06)",
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
