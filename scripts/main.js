"use strict";
import { database } from "./database.js";
import { renderMovies, renderSlider, renderSeries, handleClickEvents } from "./helper.js";

(async function () {
  const db = await database();

  if (db.movies) {
    renderMovies(db.movies, 12);
  }
  if (db.slider) {
    renderSlider(db.slider);
  }
  if (db.series) {
    renderSeries(db.series);
  }

  handleClickEvents();
})();
