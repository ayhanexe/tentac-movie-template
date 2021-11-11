"use strict";
import { handleClickEvents, handleMoviePage } from "../../scripts/helper.js";

$(document).ready(async function () {
  await handleMoviePage();
  handleClickEvents();
});
