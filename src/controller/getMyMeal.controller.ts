import { Request, Response } from "express";
import { IScrapping } from "../interface/IScrapping";
import PuppeteerService from "../service/Scrapping/puppeteer.service";

const puppeteerService: IScrapping = new PuppeteerService();

export async function getMyMealTicket(req: Request, res: Response) {
  const { studentId, studentRuId } = req.query;
  
  if (studentId?.length !== 6) {
    return res.status(300).json({ error: "studentID invalid" });
  }
  if (studentRuId?.length !== 10 ) {
    return res.status(300).json({ error: "studentRU ID invalid" });
  }

  const result = await puppeteerService.getMealTicket(String(studentId),String(studentRuId));

  if(result.error){
    return res.status(500).json(result.error)  
  }
  if(result.name == "user not found"){
    return res.status(404).json(result.name)
  }

  return res.status(200).json(result);
}

export async function getMenuOfTheDay(req: Request, res:Response){
  const result = await puppeteerService.getMealOfTheDay()
  if(result.error){
    if(result.error == "Menu isn't available today! :("){
      return res.status(200).json({data:result.error})
    }else{    
      return res.status(500).json({error:"Sorry!We had a error, please try later!"})
    }
  }
  return res.status(200).json(result)
}
