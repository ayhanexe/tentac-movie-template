"use strict";
import { handleClickEvents, renderMovies, renderSeries } from "./helper.js";

$(document).ready(async () => {
  await renderMovies();
  await renderSeries();
  handleClickEvents();
});
