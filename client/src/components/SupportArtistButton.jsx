import React from "react";
import Button from "@mui/material/Button";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import { useNavigate } from "react-router-dom";

export const SupportArtistButton = ({
  artistId,
  artistName,
  songId,
  label = "Support this artist",
  onClick,
  variant = "contained",
  color = "primary",
  disabled = false,
  size = "medium",
  sx,
}) => {
  const navigate = useNavigate();

  const handleClick = (event) => {
    event.stopPropagation();
    if (disabled) return;
    if (typeof onClick === "function") {
      onClick({ artistId, artistName, songId });
      return;
    }
    if (artistId) {
      navigate(`/support?artist=${artistId}&song=${songId || ""}`);
      return;
    }
    navigate("/support");
  };

  return (
    <Button
      startIcon={<SupportAgentRoundedIcon />}
      variant={variant}
      color={color}
      size={size}
      disabled={disabled}
      onClick={handleClick}
      sx={{
        textTransform: "none",
        fontWeight: 600,
        ...sx,
      }}
    >
      {label}
    </Button>
  );
};

export default SupportArtistButton;
