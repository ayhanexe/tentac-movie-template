"use strict";
import { handleClickEvents, handleSearchPage } from "../../scripts/helper.js";

$(document).ready(async () => {
  await handleSearchPage();
  handleClickEvents();
});
