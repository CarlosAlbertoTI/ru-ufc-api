import { Request, Response, NextFunction } from "express";


import {
  IScrapping,
  responseScrappingMealOfTheDay,
} from "../interface/IScrapping";
import { ILocalStorage } from "../interface/ILocalStorage";

import PuppeteerService from "../service/Scrapping/puppeteer.service";
import { LocalStorage } from "../service/LocalStorage/localStorage";

import { LocalStorageMealDTO } from "../DTO/Meal";

import { Campus } from "../interface/ICampus";

import { CAMPUSES } from "../utils/enums";

const puppeteerService: IScrapping = new PuppeteerService();
const storage: ILocalStorage = new LocalStorage();

export async function getMenuOfTheDay(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { city = "fortaleza" } = req.body;

  const currentTime = new Date();
  let currentCity;
  // request the data on db
  const data = await storage.getData();

  if (data !== undefined) {
    const {
      fortaleza,
      russas,
      quixada,
      sobral,
      crateus,
      itapaje,
      cariri,
    }: LocalStorageMealDTO = data;

    const campus: Campus | undefined = CAMPUSES.find(
      (campus: Campus) =>
        campus.name.toLowerCase() === String(city).toLowerCase()
    );

    if (!campus) {
      return next({ status: 400, error: "Invalid campus/city name" });
    }

    currentCity = {
      url: campus.url,
      data: data[campus.name.toLowerCase() as keyof LocalStorageMealDTO],
    };

    if (
      currentTime.getDate() - new Date(currentCity.data.time).getDate() >= 1 ||
      currentCity.data.time.length == 0
    ) {
      console.info("Fetching new data from the web...");
      const {
        breakfast: breakfastScrapping,
        lunch: lunchScrapping,
        dinner: dinnerScrapping,
        error,
      } = (await puppeteerService.getMealOfTheDay(
        currentCity.url
      )) as responseScrappingMealOfTheDay;

      if (error) {
        if (error == "Não há cardápio cadastrado para este dia") {
          return next({ status: 200, error });
        } else {
          return next({
            status: 500,
            error: "Sorry!We had a error, please try later!",
          });
        }
      }

      storage.setData({
        ...data,
        [`${city}`]: {
          breakfast: breakfastScrapping,
          lunch: lunchScrapping,
          dinner: dinnerScrapping,
          time: currentTime,
        },
      });

      req.data = {
        breakfast:
          typeof breakfastScrapping === "string" ? breakfastScrapping : "",
        lunch: typeof lunchScrapping === "string" ? lunchScrapping : "",
        dinner: typeof dinnerScrapping === "string" ? dinnerScrapping : "",
      };
      return next();
    } else {
      console.info("Using cached data from the database...");
      if (
        currentCity.data.lunch == "" ||
        currentCity.data.breakfast == "" ||
        currentCity.data.dinner == ""
      ) {
        return next({ status: 200, error: "Menu isn't available today! :(" });
      } else {
        req.data = {
          breakfast:
            data[campus.name.toLowerCase() as keyof LocalStorageMealDTO]
              .breakfast,
          lunch:
            data[campus.name.toLowerCase() as keyof LocalStorageMealDTO].lunch,
          dinner:
            data[campus.name.toLowerCase() as keyof LocalStorageMealDTO].dinner,
        };
        return next();
      }
    }
  } else {
    return next({
      status: 500,
      error: "Sorry!We had a error, please try later!",
    });
  }
}
