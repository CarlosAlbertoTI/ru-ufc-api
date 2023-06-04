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
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: "/usr/bin/google-chrome",
      args: [
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "--disable-setuid-sandbox",
        "--no-sandbox",
      ],
    });
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

  async getMealOfTheDay(): Promise<responseScrappingMealOfTheDay> {
    const browser = await puppeteer.launch({
      headless: false,
      // executablePath: "/usr/bin/google-chrome",
      // args: [
      //   "--disable-gpu",
      //   "--disable-dev-shm-usage",
      //   "--disable-setuid-sandbox",
      //   "--no-sandbox",
      // ],
    });
    try {
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);
      await page.goto(
        "https://www.ufc.br/restaurante/cardapio/1-restaurante-universitario-de-fortaleza",
        {
          waitUntil: "networkidle2", // <-- good practice to wait for page to fully load
        }
      );

      // Set screen size
      await page.setViewport({ width: 1080, height: 1024 });
      // await this.delay(2000);

      let breakfast;
      let lunch;
      let dinner;
      try {
        breakfast = await page.waitForSelector(
          "table[class='refeicao desjejum'] > tbody"
        );
        lunch = await page.waitForSelector(
          "table[class='refeicao almoco'] > tbody"
        );
        dinner = await page.waitForSelector(
          "table[class='refeicao jantar'] > tbody"
        );

        if (breakfast != null) {
         
          let breakfastString = (await page.evaluate(
            (el) => el?.textContent,
            breakfast
          )) as string;

          let lunchString = (await page.evaluate(
            (el) => el?.textContent,
            lunch
          )) as string;

          let dinnerString = (await page.evaluate(
            (el) => el?.textContent,
            dinner
          )) as string;

      

          await browser.close();
          return {
            breakfast:breakfastString,
            lunch:lunchString,
            dinner:dinnerString,
            // lunch:{}
          };
          // return {
          //   lunch: lunchString,
          //   breakfast: breakfastString,
          //   dinner: dinnerString,
          // };
        } else {
          await browser.close();
          throw new Error("Menu not available!");
        }
      } catch (error) {
        await browser.close();
        return {
            error: "Menu isn't available today! :(",
            lunch: undefined,
            breakfast: undefined,
            dinner: undefined
        };
      }
    } catch (e) {
      await browser.close();
      return { error: e, lunch: {}, breakfast: {}, dinner: {} };
    }
  }
}

export default PuppeteerService;
