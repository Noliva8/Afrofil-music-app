import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { alpha, useTheme } from '@mui/material/styles';
import Fade from '@mui/material/Fade';
import Button from '@mui/material/Button';
import FeaturingArtist from "./inputsForSong/FeaturingArtist";
import Producer from "../songContentPart/Producer";
import Composer from "./inputsForSong/Composer";
import AlbumSong from "./inputsForSong/AlbumInSong";
import SongCategorySpeed from "./inputsForSong/SongCategorySpeed";
import TruckNumber from "./inputsForSong/TruckNumber";
import SongLabel from "./inputsForSong/SongLabel";
import Genre from './inputsForSong/Genre';
import Mood from "./Mood";
import ReleaseDate from './inputsForSong/ReleaseDate';
import {
  MusicNote as MusicNoteIcon,
} from "@mui/icons-material";
import TextField from "@mui/material/TextField";

import InputAdornment from "@mui/material/InputAdornment";
import Divider from "@mui/material/Divider";

const metadataFormSx = {
  display: "grid",
  gridTemplateColumns: "1fr",
  rowGap: 2.25,
  "& > *": {
    minWidth: 0,
  },
};

const metadataSectionGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
  columnGap: 2,
  rowGap: 0.75,
  "& > *": {
    minWidth: 0,
  },
};

function SectionIntro({ theme }) {
  return (
    <>
      <Typography
        variant="h5"
        component="h1"
        gutterBottom
        sx={{
          fontWeight: 900,
          color: theme.palette.text.primary,
          textAlign: "left",
          mb: 0.5,
        }}
      >
        Song Details
      </Typography>
      <Typography
        sx={{
          color: theme.palette.text.secondary,
          mb: 3,
          lineHeight: 1.55,
        }}
      >
        Add the information listeners will see when your track goes live.
      </Typography>
    </>
  );
}

function TitleField({ errors, register, theme, normalizeTitle }) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        alignItems: "start",
        gridColumn: { xs: "1", md: "1 / -1" },
      }}
    >
      <Typography
        variant="body1"
        sx={{
          color: theme.palette.text.primary,
          fontWeight: 500,
          mb: 0.5,
        }}
      >
        Title
      </Typography>

      <TextField
        fullWidth
        placeholder="Enter song title"
        {...register("title", {
          required: "Title is required",
          setValueAs: normalizeTitle,
        })}
        error={!!errors.title}
        helperText={errors.title?.message || ""}
        margin="normal"
        variant="outlined"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <MusicNoteIcon sx={{ color: theme.palette.primary.main }} />
            </InputAdornment>
          ),
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            color: theme.palette.text.primary,
            borderRadius: "8px",
            "& fieldset": {
              borderColor: alpha(theme.palette.primary.main, 0.2),
            },
            "&:hover fieldset": {
              borderColor: alpha(theme.palette.primary.main, 0.45),
            },
            "&.Mui-focused fieldset": {
              borderColor: theme.palette.primary.main,
            },
          },
          "& .MuiInputLabel-root": {
            color: "rgba(255, 255, 255, 0.7)",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: theme.palette.primary.main,
          },
        }}
      />
    </Box>
  );
}

function MetadataSection({ children, description, theme, title }) {
  return (
    <Box
      sx={{
        gridColumn: "1 / -1",
        borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
        borderRadius: "8px",
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2.25, sm: 2.75 },
        backgroundColor: alpha(theme.palette.background.paper, 0.36),
        boxShadow: `0 18px 28px -26px ${alpha(theme.palette.common.black, 0.8)}`,
      }}
    >
      <Box sx={{ mb: 2.25 }}>
        <Typography
          variant="subtitle1"
          sx={{
            color: theme.palette.text.primary,
            fontWeight: 800,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              mt: 0.5,
            }}
          >
            {description}
          </Typography>
        )}
      </Box>

      <Box sx={metadataSectionGridSx}>{children}</Box>
    </Box>
  );
}

function PrimaryMetadataFields({
  Controller,
  albumToSelect,
  albums,
  control,
  errors,
  handleAlbumChange,
  refetchAlbums,
  register,
  setValue,
  watch,
}) {
  return (
    <>
      <FeaturingArtist register={register} watch={watch} setValue={setValue} errors={errors} />
      <Producer register={register} watch={watch} setValue={setValue} errors={errors} />
      <Composer register={register} watch={watch} setValue={setValue} errors={errors} />

      <AlbumSong
        key="album"
        register={register}
        Controller={Controller}
        control={control}
        errors={errors}
        albumToSelect={albumToSelect}
        refetchAlbums={refetchAlbums}
        albums={albums}
        handleAlbumChange={handleAlbumChange}
      />

      <SongCategorySpeed Controller={Controller} control={control} errors={errors} />
      <TruckNumber key="track" register={register} errors={errors} />
      <Genre register={register} Controller={Controller} control={control} errors={errors} />
    </>
  );
}

function ReleaseMetadataFields({ control, errors, register, watch }) {
  return (
    <>
      <Mood control={control} watch={watch} />
      <SongLabel register={register} errors={errors} />
      <ReleaseDate register={register} errors={errors} />
    </>
  );
}

function MetadataDivider({ theme }) {
  return (
    <Divider
      sx={{
        gridColumn: "1 / -1",
        my: 0.5,
        borderColor: alpha(theme.palette.primary.main, 0.18),
        boxShadow: `0 10px 18px ${alpha(theme.palette.common.black, 0.18)}`,
      }}
    />
  );
}

function SubmitActions({ theme }) {
  return (
    <Box sx={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", mt: 2 }}>
      <Button
        variant="contained"
        sx={{
          background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
          color: theme.palette.primary.contrastText,
          fontFamily: theme.typography.fontFamily,
          borderRadius: "8px",
          px: 3,
          py: 1.1,
          textTransform: "none",
          fontWeight: 800,
        }}
        type="submit"
      >
        Next
      </Button>
    </Box>
  );
}



export default function Metadata({
  Controller,
  setValue,
  onSubmit,
  handleSubmit,
  watch,
  control,
  register,
  refetchAlbums,
  errors,
  albumToSelect,
  albums,
  handleAlbumChange,
}) {
  const theme = useTheme();

  const normalizeTitle = (value) => {
    const trimmed = (value || "").trim();
    if (!trimmed) return "";
    const lower = trimmed.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  };



  return (
    <Fade in timeout={500}>
      <Paper
        elevation={3}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.88),
          padding: theme.spacing(1),
          width: "100%",

          p: 4,
          height: "auto",
          borderRadius: "8px",
          backdropFilter: "blur(10px)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: theme.shadows[2],
        }}
      >
        <SectionIntro theme={theme} />
        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={metadataFormSx}
        >
          <MetadataSection
            title="Basic information"
            description="Name the track clearly before adding the rest of the metadata."
            theme={theme}
          >
            <TitleField
              errors={errors}
              register={register}
              theme={theme}
              normalizeTitle={normalizeTitle}
            />
          </MetadataSection>

          <MetadataDivider theme={theme} />

          <MetadataSection
            title="Credits and catalog"
            description="Add the people, album, track number, category, speed, and genre."
            theme={theme}
          >
            <PrimaryMetadataFields
              Controller={Controller}
              albumToSelect={albumToSelect}
              albums={albums}
              control={control}
              errors={errors}
              handleAlbumChange={handleAlbumChange}
              refetchAlbums={refetchAlbums}
              register={register}
              setValue={setValue}
              watch={watch}
            />
          </MetadataSection>

          <MetadataDivider theme={theme} />

          <MetadataSection
            title="Mood and release"
            description="Choose the feeling of the song and confirm label and release details."
            theme={theme}
          >
            <ReleaseMetadataFields
              control={control}
              errors={errors}
              register={register}
              watch={watch}
            />
          </MetadataSection>

          <SubmitActions theme={theme} />
        </Box>
      </Paper>
    </Fade>
  );
}
