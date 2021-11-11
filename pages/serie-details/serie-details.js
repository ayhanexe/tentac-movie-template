"use strict";
import { handleClickEvents, handleSeriePage } from "../../scripts/helper.js";

$(document).ready(async () => {
  handleClickEvents();
  await handleSeriePage();
});
