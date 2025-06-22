import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Paper from "@mui/material/Paper";
import TextField from "@mui/material/TextField";
import { useTheme } from "@mui/material/styles";

export default function Title({ register, errors}) {
  const theme = useTheme();

  return (
    <Paper 
      elevation={3}
      sx={{
        width: '100%',
        display: "flex",
        backgroundColor: 'var(--secondary-background-color)',
        margin: '0 auto',
        marginTop: theme.spacing(2),
        padding: theme.spacing(3),
        borderRadius: '12px',
        alignItems: {
          xs: "flex-start",
          md: "center",
        },
        gap: theme.spacing(2),
        flexDirection: {
          xs: "column",
          md: "row",
        },
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: theme.shadows[6]
        }
      }}
    >
      <Typography
        component="label"
        htmlFor="title"
        variant="subtitle1"
        sx={{
          minWidth: '150px',
          fontWeight: 500,
          color: 'var(--primary-font-color)',
          fontFamily: 'Roboto, sans-serif',
          letterSpacing: '0.5px',
          alignSelf: { xs: 'flex-start', md: 'center' }
        }}
      >
        Title of the song:
      </Typography>

      <Box sx={{ 
        flex: 1, 
        width: '100%', 
        display: "flex", 
        flexDirection: "column",
        gap: theme.spacing(1)
      }}>
        <TextField
          {...register("title", { 
            required: "Title is required",
            maxLength: {
              value: 100,
              message: "Title must be less than 100 characters"
            }
          })}
          id="title"
          fullWidth
          variant="outlined"
          error={Boolean(errors.title)}
          sx={{
            '& .MuiInputBase-root': { 
              color: 'white',
              borderRadius: '8px'
            },
            '& .MuiOutlinedInput-notchedOutline': { 
              borderColor: 'theme.palette.divider' 
            },
            '&:hover .MuiOutlinedInput-notchedOutline': { 
              borderColor: theme.palette.primary.main 
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px'
            },
            backgroundColor: 'var(--secondary-background-color)',
          }}
          
        />

        {errors.title && (
          <Typography
            variant="caption"
            color="error"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: theme.spacing(0.5),
              ml: theme.spacing(1.5)
            }}
          >
            {errors.title.message}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}