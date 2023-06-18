import { Request, Response } from "express";
import { differenceInDays, parseISO } from "date-fns";

import {
  IScrapping,
  responseScrappingMealOfTheDay,
} from "../interface/IScrapping";
import { ILocalStorage } from "..//interface/ILocalStorage";

import PuppeteerService from "../service/Scrapping/puppeteer.service";
import { LocalStorage } from "../service/LocalStorage/localStorage";

import { LocalStorageMealDTO } from "../DTO/Meal";

const puppeteerService: IScrapping = new PuppeteerService();
const storage: ILocalStorage = new LocalStorage();

export async function getMyMealTicket(req: Request, res: Response) {
  const { studentId, studentRuId } = req.query;

  // if (studentId?.length !== 6) {
  //   return res.status(300).json({ error: "studentID invalid" });
  // }
  // if (studentRuId?.length !== 10) {
  //   return res.status(300).json({ error: "studentRU ID invalid" });
  // }

  const result = await puppeteerService.getMealTicket(
    String(studentId),
    String(studentRuId)
  );

  if (result.error) {
    return res.status(500).json(result.error);
  }
  if (result.name == "user not found") {
    return res.status(404).json(result.name);
  }

  return res.status(200).json(result);
}

export async function getMenuOfTheDay(req: Request, res: Response) {
  const currentTime = new Date();
  // request the data on db
  const data = await storage.getData();

  if (data !== undefined) {
    const { lunch, breakfast, dinner, time }: LocalStorageMealDTO = data;

    if (currentTime.getDate() - new Date(time).getDate()) {
      console.info("SCRAPPING");

      const {
        breakfast: breakfastScrapping,
        lunch: lunchScrapping,
        dinner: dinnerScrapping,
        error,
      } = (await puppeteerService.getMealOfTheDay()) as responseScrappingMealOfTheDay;

      if (error) {
        storage.setData({ lunch, breakfast, dinner, time: currentTime });
        if (error == "Menu isn't available today! :(") {
          return res.status(200).json({ error: error });
        } else {
          return res
            .status(500)
            .json({ error: "Sorry!We had a error, please try later!" });
        }
      }

      storage.setData({
        breakfastScrapping,
        lunchScrapping,
        dinnerScrapping,
        time: currentTime,
      });

      return res.status(200).json({ breakfastScrapping, lunchScrapping, dinnerScrapping });
    } else {
      console.info("DB");
      if (lunch == "" || breakfast == "" || dinner == "") {
        if (time == "") {
          storage.setData({ lunch, breakfast, dinner, time: new Date() });
        }
        return res
          .status(200)
          .json({ error: "Menu isn't available today! :(" });
      } else {
        return res.status(200).json({
          lunch,
          breakfast,
          dinner,
        });
      }
    }
  }else{
    return res
            .status(500)
            .json({ error: "Sorry!We had a error, please try later!" });
  }
}
