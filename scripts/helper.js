"use strict";
import "https://cdnjs.cloudflare.com/ajax/libs/lodash.js/4.17.21/lodash.min.js";

let activeItem = 1;
let cooldown = false;

export const renderMovies = (movieLimit = 10, page = 1) =>
  new Promise(async (resolve, reject) => {
    try {
      const orginalData = await database();
      const data = orginalData.movies;

      if (data) {
        $(".movies").empty();
        await createPagination(2, activeItem, movieLimit);
        for (let i = movieLimit * (page - 1); i < movieLimit * page; i++) {
          if (data[i]) {
            const movieItem = await createMovieItem(data[i]);
            $(".movies").append(movieItem);
          }
        }
      }

      resolve();
    } catch (e) {
      reject(e.message);
    }
  });

export const renderSeries = () =>
  new Promise(async (resolve, reject) => {
    try {
      const db = await database();
      const data = db.series;

      if (data) {
        for (let i = 0; i < 30; i++) {
          const serieElement = createSerieItem(data[i]);
          $(".series-container").append(serieElement);
        }
      }

      resolve();
    } catch (e) {
      reject(e.message);
    }
  });

export const handleWatchListPage = async () => {
  const db = await database();
  const favorites = localStorage.getItem("favorites");

  if (favorites) {
    const favoritesParsed = JSON.parse(favorites);

    if (favoritesParsed.movies && favoritesParsed.movies.length > 0) {
      favoritesParsed.movies.forEach((movieData) => {
        const dat = _.find(db.movies, { id: +movieData.id });
        if (dat) {
          const watchlistItem = createWatchlistItem(dat);
          $(".watchlist").append(watchlistItem);
        }
      });
    }
  }
};

async function createPagination(
  paginationOffset,
  currentPage,
  movieLimit = 10
) {
  return new Promise(async (resolve, reject) => {
    try {
      const db = await database();
      const movies = db?.movies;
      if (movies) {
        $(".pagination-container").empty();
        const limit = Math.ceil(movies.length / movieLimit);
        const offset =
          movieLimit < movies.length - currentPage * movieLimit
            ? currentPage + paginationOffset
            : currentPage;

        const makePaginationItem = (
          _class = null,
          content = undefined,
          isDisabled = false,
          callback = () => {}
        ) => {
          const paginationItem = $(
            `<div ${
              isFinite(content) && typeof content === "number"
                ? `data-page="${content}"`
                : ""
            } class="pagination-item ${
              isDisabled ? "disabled" : ""
            }"><span class="${_class ? _class : null}">${
              content ?? ""
            }</span></div>`
          ).on("click", function () {
            callback.call(this);
          });
          $(".pagination-container").append(paginationItem);
        };

        makePaginationItem(
          `bi bi-chevron-double-left`,
          null,
          currentPage === 1 ? true : null,
          function () {
            activeItem = 1;
            renderMovies(movieLimit, activeItem);
          }
        );
        makePaginationItem(
          `bi bi-chevron-left`,
          null,
          currentPage === 1 ? true : null,
          function () {
            renderMovies(movieLimit, --activeItem);
          }
        );

        for (let i = currentPage - paginationOffset - 1; i <= offset; i++) {
          if (movieLimit * i < movies.length) {
            if (i >= 0 && limit > 0) {
              makePaginationItem(null, i + 1, false, function () {
                activeItem = $(this).data("page");
                renderMovies(movieLimit, i + 1);
              });
            }
          }

          if (activeItem == i) {
            $(`.pagination-item[data-page=${activeItem}]`).addClass("active");
          }
        }

        makePaginationItem(
          `bi bi-chevron-right`,
          null,
          currentPage === limit ? true : null,
          function () {
            renderMovies(movieLimit, ++activeItem);
          }
        );
        makePaginationItem(
          `bi bi-chevron-double-right`,
          null,
          currentPage === limit ? true : null,
          function () {
            activeItem = limit;
            renderMovies(movieLimit, activeItem);
          }
        );

        resolve();
      }
    } catch (e) {
      reject(e.message);
    }
  });
}

export const handleSearchPage = async () => {
  const db = await database();
  const searchString = sessionStorage.getItem("search");

  $(".search-text").text(searchString);

  [...db.movies, ...db.series].forEach((item) => {
    if (
      `${item.name}`.toLowerCase().includes(`${searchString}`.toLowerCase())
    ) {
      const resultItem = createSearchResultItem(item);
      $("#search-results").append(resultItem);
    }
  });

  handleClickEvents();
};

export const handleSeriePage = async () => {
  const db = await database();
  const serieID = sessionStorage.getItem("serie");
  const serie = _.find(db.series, { id: +serieID });

  if (isFinite(serieID) && serie) {
    $(".wallpaper").attr("src", `${serie.wallpaper ?? serie.posterURL}`);
    $(".poster-img").attr("src", `${serie.posterURL}`);
    $(".title").text(serie.name);

    if (serie.actors && serie.actors.length > 0) {
      serie.actors.forEach((actorData) => createActorItem(actorData));
    }

    if (serie.seasons && serie.seasons.length > 0) {
      let hasActiveSeason = false;
      serie.seasons.forEach((seasonData) => {
        if ($(".season-item.active").length > 0) {
          hasActiveSeason = true;
        }
        if (!hasActiveSeason && seasonData.season == serie.seasons.length) {
          createEpisodeItem(seasonData, serie.posterURL);
        } else {
          const data = _.find(serie.seasons, {
            season: $(".season-item.active").data("season"),
          });

          if (data) {
            createEpisodeItem(data, serie.posterURL);
          }
        }
      });

      if (isFinite(serie.season)) {
        let hasActiveSeason = false;
        const active = $(".season-item.active");
        for (let i = 1; i <= serie.season; i++) {
          if (!hasActiveSeason && active.length == 0) {
            createSeasonItem(i, i == 1);
          } else {
            createSeasonItem(i, i == $(active).data("season"));
          }
        }
      }
    }
  }

  $(".actors-slider").owlCarousel({
    stagePadding: 10,
    margin: 20,
    nav: false,
    navText: [],
    responsive: {
      0: {
        items: 1,
      },
      450: {
        items: 2,
      },
      550: {
        items: 3,
      },
      780: {
        items: 4,
      },
    },
  });
};

export const handleMoviePage = async () => {
  const db = await database();
  const id = sessionStorage.getItem("movie");
  const favorites = localStorage.getItem("favorites");

  if (db && isFinite(id)) {
    const movieData = _.find(db.movies, { id: +id });

    if (isFinite(id) && movieData) {
      if (favorites) {
        const favoritesParsed = JSON.parse(favorites);
        if (_.find(favoritesParsed.movies, { id })) {
          $(".favorite-icon").addClass("active");
        }
      }
      $(".movie-poster").attr("src", movieData.posterURL);
      $(".movie-name").text(movieData.name);
      $(".title").text(`${movieData.name} Trailer`);
      $(".trailer-frame").attr("src", movieData.trailerEmbedURL);
    }
  }
};

export const handleClickEvents = async () => {
  const db = await database();

  $(".profile").click(function (e) {
    if (!cooldown) {
      const dropdown = $(this).parent().find(".profile-dropdown");

      if ($(dropdown).hasClass("active")) {
        $(dropdown).removeClass("active");
      } else {
        $(dropdown).addClass("active");
      }
      cooldown = true;
      setTimeout(() => {
        cooldown = false;
      });
    }
  });

  $("a.serie-item").click(function (e) {
    e.preventDefault();

    if (
      db.series &&
      _.find(db.series, {
        id: $(this).data("serie-id"),
      })
    ) {
      sessionStorage.setItem("serie", $(this).data("serie-id"));
      window.location = "pages/serie-details/serie-details.html";
    }
  });

  $(".result-item").click(function () {
    const type = $(this).data("type");
    const id = $(this).data(`${type}-id`);
    const data = _.find(db[`${type}s`], { id });

    if (isFinite(id) && data) {
      sessionStorage.setItem(type, id);
      if (type == "movie") {
        window.location = "/pages/movie-details/movie-details.html";
      } else {
        window.location = "/pages/serie-details/serie-details.html";
      }
    }
  });

  $(".search-icon").click(function () {
    const value = $(this).parent().find("input").val().trim();

    if (value) {
      sessionStorage.setItem("search", value);
      window.location = "/pages/search-page/search-page.html";
    }
  });

  $(".favorite-icon").click(function () {
    const id = sessionStorage.getItem("movie");

    if (id) {
      const classState = this.classList.toggle("active");
      const favorites = localStorage.getItem("favorites");
      if (classState) {
        if (favorites) {
          const data = _.assign({}, JSON.parse(favorites), {
            movies: [...JSON.parse(favorites).movies],
          });

          if (!_.find(JSON.parse(favorites).movies, { id })) {
            data.movies.push({ id, type: "movie" });
          }

          localStorage.setItem("favorites", JSON.stringify(data));
        } else {
          localStorage.setItem(
            "favorites",
            JSON.stringify({ movies: [{ id, type: "movie" }] })
          );
        }
      } else {
        if (favorites) {
          const data = _.assign({}, JSON.parse(favorites), {
            movies: [...JSON.parse(favorites).movies.filter((e) => e.id != id)],
          });
          localStorage.setItem("favorites", JSON.stringify(data));
        }
      }
    }
  });
};

export const renderSlider = (data) => {
  data.forEach((sliderData) => {
    const sliderElement = makeSliderItem(sliderData);
    $(".owl-carousel").append(sliderElement);
  });
  $(".owl-carousel").owlCarousel({
    singleItem: true,
    autoplay: true,
    autoplayTimeout: 5000,
    loop: true,
    responsive: {
      0: {
        items: 1,
      },
    },
  });
};

const createWatchlistItem = (data) => {
  const watchlistItem = $(
    `<div data-movie-id="${data.id}" class='watchlist-item movie-item flex gap-5'></div>`
  ).click(function () {
    const id = $(this).data("movie-id");
    sessionStorage.setItem("movie", id);
    window.location = "/pages/movie-details/movie-details.html";
  });
  const img = $(`<img src="${data.posterURL}" class="poster"/>`);
  const flexDiv = $("<div class='flex flex-col'></div>");
  const h1 = $(
    `<h1 class='watchlist-item-name text-3xl font-semibold'>${data.name}</h1>`
  );
  const p = $(`<p class='watchlist-item-text'>${data.text ?? "lorem"}</p>`);

  $(flexDiv).append(h1).append(p);
  $(watchlistItem).append(img).append(flexDiv);
  return watchlistItem;
};

const createSearchResultItem = (data) => {
  const resultItem = $(
    `<div data-${data.type}-id="${data.id}" data-type="${data.type}" class='result-item flex md:flex-unwrap flex-wrap'></div>`
  );
  const imageContainer = $("<div class='image'></div>");
  const img = $(
    `<img class="object-cover object-center" src="${data.posterURL}"/>`
  );
  const textsContainer = $("<div class='texts flex flex-col pl-5'></div>");
  const h1 = $(
    `<h1 class='result-title text-2xl text-white font-semibold mb-5'>${data.name}</h1>`
  );
  const text = $(`<p class='result-text'>${data.text ?? "lorem"}</p>`);

  $(imageContainer).append(img);
  $(textsContainer).append(h1).append(text);
  $(resultItem).append(imageContainer).append(textsContainer);

  return resultItem;
};

const createSeasonItem = (data, isActive) => {
  const seasonItem = $(
    `<div class='season-item text-sm ${
      isActive ? "active" : null
    }'>Season ${data}</div>`
  );

  $(".seasons-wrapper").append(seasonItem);
};

const createEpisodeItem = (data, poster = "") => {
  data.episodes.forEach((episodeData) => {
    const episodeItem = $("<div class='episode-item flex gap-3'></div>");
    const imageArea = $("<div class='image-area'></div>");
    const img = $(`<img src="${poster}" alt="episode ${data.episode}"/>`);
    const textArea = $("<div class='text-area flex flex-col'></div>");
    const episodeNumber = $(`<h3>Episode ${episodeData.episode}</h3>`);
    const episodeText = $(
      `<p class="episode-item-text text-xs">${episodeData.text}</p>`
    );

    $(imageArea).append(img);
    $(textArea).append(episodeNumber).append(episodeText);
    $(episodeItem).append(imageArea).append(textArea);

    $(".episode-wrapper").append(episodeItem);
  });
};

const createActorItem = (data) => {
  const actorItem = $("<div class='actor-item flex flex-col'></div>");
  const actorImage = $("<div class='actor-image'></div>");
  const img = $(
    `<img alt='${data.name}' src='${data.imageURL}' class='actor-image object-cover object-center'></img>`
  );
  const name = $(
    `<span class='actor-name text-xs text-center mt-1'>${
      data.name ?? data.character ?? "unknown"
    }</span>`
  );

  $(actorImage).append(img);
  actorItem.append(actorImage).append(name);

  $(".actors-slider").append(actorItem);
};

const createSerieItem = (data) => {
  const a = $(`<a data-serie-id='${data.id}' href='#' class='serie-item'></a>`);
  const textsContainer = $("<div class='serie-texts flex flex-col'></div>");
  const name = $("<span class='serie-name text-sm'></span>").html(data.name);
  const season = $("<span class='serie-season text-xs'></span>").html(
    `season ${data.season} episode ${data.episode}`
  );
  const image = $(
    `<img src="${data.posterURL}" class="serie-image object-cover object-center"/>`
  );

  $(textsContainer).append(name).append(season);
  $(a).append(textsContainer).append(image);

  return a;
};

const makeSliderItem = (data) => {
  return $("<div></div>").append(
    $(`<img src="${data.imageURL}" class="object-cover object-center"/>`)
  );
};

const createMovieItem = async (data) => {
  const db = await database();
  const movieItem = $(
    `<div data-movie-id="${data.id}" class='movie-item flex flex-col'></div>`
  ).click(function () {
    const data = _.find(db.movies, { id: $(this).data("movie-id") });
    if (data) {
      sessionStorage.setItem("movie", data.id);
      window.location = "/pages/movie-details/movie-details.html";
    }
  });
  const languages = $("<div class='languages flex gap-1'></div>");
  const posterContainer = $("<div class='poster-container'></div>");
  const poster = $(
    `<img class="movie-item-poster object-cover object-center" src="${data.posterURL}"/>`
  );
  const name = $(
    "<span class='movie-name text-center py-1 font-semibold text-sm'></span>"
  ).html(data.name);

  if (data.languages.length > 0) {
    data.languages.forEach((language) => {
      switch (`${language}`.toLowerCase()) {
        case "aze":
          $(languages).append(
            $(
              `<img src="/assets/images/azerbaijan.svg" class="movie-item-language object-cover object-center"/>`
            )
          );
          break;
        case "eng":
          $(languages).append(
            $(
              `<img src="/assets/images/england.svg" class="movie-item-language object-cover object-center"/>`
            )
          );
          break;
      }
    });
  }

  $(posterContainer).append(poster).append(languages);
  $(movieItem).append(languages).append(posterContainer).append(name);

  return movieItem;
};

async function database() {
  return await $.get("/scripts/database/database.json");
}
