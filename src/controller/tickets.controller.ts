import { Request, Response, NextFunction } from "express";

import { IScrapping } from "../interface/IScrapping";
import { Campus } from "../interface/ICampus";
import { ILocalStorage } from "../interface/ILocalStorage";

import { LocalStorage } from "../service/LocalStorage/localStorage";
import PuppeteerService from "../service/Scrapping/puppeteer.service";

const puppeteerService: IScrapping = new PuppeteerService();

export async function getMyMealTicket(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { studentId, studentRuId } = req.body;

  if (studentId?.length !== 6) {
    return next({ status: 300, error: "studentID invalid" });
  }
  if (studentRuId?.length !== 10) {
    return next({ status: 300, error: "studentRU ID invalid" });
  }

  const result = await puppeteerService.getMealTicket({
    studentId: String(studentId),
    studentRuId: String(studentRuId),
  });

  if (result.error) {
    return next({ status: 500, error: result.error });
  }
  if (result.name == "user not found") {
    return next({ status: 404, error: result.name });
  }

  req.data = result;
  return next();
}

export async function buyTickets(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { studentId, studentRuId, numberOfTickets } = req.body;

  if (studentId?.length !== 6) {
    return next({ status: 300, error: "studentID invalid" });
  }
  if (studentRuId?.length !== 10) {
    return next({ status: 300, error: "studentRU ID invalid" });
  }

  if (parseInt(String(numberOfTickets)) < 1) {
    return next({
      status: 300,
      error: "numberOfTickets should be bigger than 0",
    });
  }

  if (!numberOfTickets || isNaN(Number(numberOfTickets))) {
    return next({ status: 300, error: "numberOfTickets invalid" });
  }
  try {
    const result = await puppeteerService.buyTickets({
      studentId: String(studentId),
      studentRuId: String(studentRuId),
      numberOfTickets: parseInt(String(numberOfTickets)),
    });

    if (result.error) {
      return next({ status: 500, error: result.error });
    }

    req.data = { data: result.pixCode };
    return next();
  } catch (error) {
    return next({ status: 500, error: error });
  }
}
