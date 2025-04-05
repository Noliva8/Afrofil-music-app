
import { useState } from "react";
import Paper from "@mui/material/Paper";

export default function Genre({ register, errors }) {
  const [genres] = useState(["Pop", "Rock", "Jazz", "Hip Hop", "Classical"]);

  return (
    <Paper
      sx={{
        width: "98%",
        display: "flex",
        backgroundColor: "var(--secondary-background-color)",
        margin: "0 auto",
        marginTop: "10px",
        padding: "1rem",
        alignItems: { xs: "start", md: "center" },
        gap: "10px",
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      <label
        htmlFor="genre"
        style={{
          color: "white",
          minWidth: "150px",
          whiteSpace: "nowrap",
          fontFamily: "Roboto",
          fontWeight: "500",
          textShadow: "revert-layer",
          fontSize: "18px",
          letterSpacing: "1px",
        }}
      >
        Genre
      </label>

      <select
        {...register("genre", { required: "Please select a genre" })}
        name="genre"
        id="genre"
        defaultValue=""
        style={{
          minWidth: "220px",
          width: "100%",
          padding: "10px",
          backgroundColor: "var(--secondary-background-color)",
          color: "white",
          border: "1px solid white",
          borderRadius: "6px",
          fontSize: "16px",
          outline: "none",
          cursor: "pointer",
        }}
      >
        <option value="" disabled hidden>
          Select a genre
        </option>
        {genres.map((genre, index) => (
          <option
            key={index}
            value={genre}
            style={{
              backgroundColor: "var(--secondary-background-color)",
              color: "white",
              fontSize: "14px",
              padding: "8px",
            }}
          >
            {genre}
          </option>
        ))}
      </select>

      {/* Display validation errors */}
      {errors.genre && (
        <span style={{ color: "red", fontSize: "14px" }}>
          {errors.genre.message}
        </span>
      )}
    </Paper>
  );
}