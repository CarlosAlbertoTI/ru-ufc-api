import puppeteer from "puppeteer";
import {
  IScrapping,
  responseScrappingMealOfTheDay,
  responseScrappingServiceMealTicket,
} from "../../interface/IScrapping";

class PuppeteerService implements IScrapping {
  delay(time: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }

  async getMealTicket(
    studentId: string,
    studentRuId: string
  ): Promise<responseScrappingServiceMealTicket> {
    const browser = await puppeteer.launch({ headless: false });
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);
      await page.goto("https://si3.ufc.br/public/iniciarConsultaSaldo.do", {
        waitUntil: "networkidle2", // <-- good practice to wait for page to fully load
      });

      // Set screen size
      await page.setViewport({ width: 1080, height: 1024 });

      await page.waitForSelector("input[name='codigoCartao']");
      await page.type("input[name='codigoCartao']", studentRuId);

      await page.waitForSelector("input[name='matriculaAtreladaCartao']");
      await page.type("input[name='matriculaAtreladaCartao']", studentId);

      const button = await page.waitForSelector(
        "input[value='Consultar'][type='submit']"
      );
      await button?.click();

      let tableName;
      let tableCredits;
      try {
        tableName = await page.waitForSelector(
          "table[class='listagem'] > tbody > tr[class='linhaPar'] > td:nth-child(2)"
        );
        tableCredits = await page.waitForSelector(
          "table[class='listagem'] > tbody > tr[class='linhaImpar'] > td:nth-child(2)"
        );
      } catch (e) {
        await browser.close();
        return { error: "", name: "user not found", credits: 0 };
      }

      await this.delay(2000);

      if (tableName != null || tableCredits != null) {
        let creditsString = (await page.evaluate(
          (el) => el?.textContent,
          tableCredits
        )) as string;
        let name = (await page.evaluate(
          (el) => el?.textContent,
          tableName
        )) as string;

        let credits = parseInt(creditsString.trim());
        name = name.trim();
        console.info({ credits, name });

        await browser.close();
        return { credits, name };
      }
    } catch (e) {
      return { error: e, name: "", credits: 0 };
    } finally {
      await browser.close();
    }
    return { error: "", name: "", credits: 0 };
  }
  // @ts-ignore
  async getMealOfTheDay(): Promise<responseScrappingMealOfTheDay> {
    const browser = await puppeteer.launch({ headless: false });
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);
      await page.goto("https://www.ufc.br/restaurante/cardapio/1-restaurante-universitario-de-fortaleza", {
        waitUntil: "networkidle2", // <-- good practice to wait for page to fully load
      });

      // Set screen size
      await page.setViewport({ width: 1080, height: 1024 });
      // await this.delay(2000);

      
      await browser.close();
    } catch (e) {
      await browser.close();
      // return { error: e, name: "", credits: 0 };
    }
  }
}

export default PuppeteerService;
