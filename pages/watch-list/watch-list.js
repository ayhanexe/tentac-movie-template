"use strict";
import {
  handleWatchListPage,
  handleClickEvents,
} from "../../scripts/helper.js";

$(document).ready(async () => {
  await handleWatchListPage();
  handleClickEvents();
});
