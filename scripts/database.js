"use strict";

export const database = async () => {
  return await $.get("/scripts/data/database.json");
};
