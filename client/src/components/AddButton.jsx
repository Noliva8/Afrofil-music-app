import React from "react";
import { Box, IconButton } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

export const AddButton = ({ handleAddToPlaylist, track }) => {
    return(
                 <Box sx={{ 
                            display: { xs: 'none', md: 'flex' }, 
                            justifyContent: 'center',
                          }}>
                            <IconButton
                              size="medium"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToPlaylist(track);
                              }}
                              sx={{
                                color: 'text.secondary',
                                backgroundColor: 'action.hover',
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                  color: 'primary.main',
                                  backgroundColor: 'rgba(228,196,33,0.15)',
                                  transform: 'scale(1.1) rotate(90deg)',
                                },
                              }}
                            >
                              <AddIcon sx={{ fontSize: '1.4rem' }} />
                            </IconButton>
                          </Box>
    )
}
