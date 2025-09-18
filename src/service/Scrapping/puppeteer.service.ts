import puppeteer, { Page, Browser } from "puppeteer";
import {
  IScrapping,
  requestScrappingBuyTickets,
  responseBuyTickets,
  responseScrappingMealOfTheDay,
  responseScrappingServiceMealTicket,
} from "../../interface/IScrapping";

class PuppeteerService implements IScrapping {
  _delay(time: number) {
    return new Promise(function (resolve) {
      setTimeout(resolve, time);
    });
  }

  async getMealTicket(body: {
    studentId: string;
    studentRuId: string;
  }): Promise<responseScrappingServiceMealTicket> {
    const { studentId, studentRuId } = body;

    const browser = await puppeteer.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
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
        waitUntil: "networkidle0", // <-- good practice to wait for page to fully load
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

      if (button) {
        await button.click();
      } else {
        await browser.close();
        return { error: "Button not found", name: "", credits: 0 };
      }

      await this._delay(2000);

      const checkIfThereIsAnUser = await page
        .$x("//b[contains(text(), 'Não existem dados a serem exibidos.')]")
        .then((elements) => elements.length > 0);

      if (checkIfThereIsAnUser) {
        return {
          error:
            "Usuario não encontrado, por favor verifique os dados informados",
          name: "",
          credits: 0,
        };
      }
      await this._delay(2000);

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
        return { error: e, name: "user not found", credits: 0 };
      }

      await this._delay(2000);

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

  async getMealOfTheDay(city: number): Promise<responseScrappingMealOfTheDay> {
    let browser: any;

    try {
      browser = await puppeteer.launch({
        executablePath:
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--no-sandbox",
        ],
      });
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);
      await page.goto(
        `https://www.ufc.br/restaurante/cardapio/${city}-restaurante-universitario-de-fortaleza`,
        {
          waitUntil: "networkidle2", // <-- good practice to wait for page to fully load
        }
      );

      // Set screen size
      await page.setViewport({ width: 1080, height: 1024 });
      await this._delay(2000);

      // Busca a tabela pelo summary e procura o texto dentro dela
      const tableHandle = await page.$(
        'table[summary^="Cardápio - Restaurante Universitário"]'
      );
      let checkIfThereIsMenu = false;

      if (tableHandle) {
        const tbodyHandle = await tableHandle.$("tbody");

        if (tbodyHandle) {
          const tbodyText = await page.evaluate(
            (el: HTMLElement) => el.textContent,
            tbodyHandle
          );
          if (tbodyText.includes("Não há cardápio cadastrado para este dia")) {
            checkIfThereIsMenu = true;
          }
        }
      }

      await this._delay(2000);

      if (checkIfThereIsMenu) {
        await browser?.close();
        return {
          error: "Não há cardápio cadastrado para este dia",
          breakfast: undefined,
          lunch: undefined,
          dinner: undefined,
        };
      }

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
            (el: { textContent: any }) => el?.textContent,
            breakfast
          )) as string;

          let lunchString = (await page.evaluate(
            (el: { textContent: any }) => el?.textContent,
            lunch
          )) as string;

          let dinnerString = (await page.evaluate(
            (el: { textContent: any }) => el?.textContent,
            dinner
          )) as string;

          await browser.close();
          return {
            breakfast: breakfastString,
            lunch: lunchString,
            dinner: dinnerString,
          };
        } else {
          await browser?.close();
          throw new Error("Menu not available!");
        }
      } catch (error) {
        await browser?.close();
        return {
          error: "Menu isn't available today! :(",
          lunch: undefined,
          breakfast: undefined,
          dinner: undefined,
        };
      }
    } catch (e) {
      await browser?.close();
      return { error: e, lunch: {}, breakfast: {}, dinner: {} };
    }
  }

  async buyTickets(
    body: requestScrappingBuyTickets
  ): Promise<responseBuyTickets> {
    const { studentId, studentRuId, numberOfTickets } = body;

    let browser: any;

    try {
      browser = await puppeteer.launch({
        headless: false,
        executablePath:
          "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        args: [
          "--disable-gpu",
          "--disable-dev-shm-usage",
          "--disable-setuid-sandbox",
          "--no-sandbox",
        ],
      });
      const page = await browser.newPage();
      await page.setDefaultNavigationTimeout(0);
      await page.goto(
        `https://si3.ufc.br/public//jsp/restaurante_universitario/consulta_comensal_ru.jsf`,
        {
          waitUntil: "networkidle2", // <-- good practice to wait for page to fully load
        }
      );

      // Set screen size
      await page.setViewport({ width: 1080, height: 1024 });
      await this._delay(2000);

      await page.waitForSelector("input[name='form:j_id_jsp_1091681061_2']");
      await page.type("input[name='form:j_id_jsp_1091681061_2']", studentRuId);

      await page.waitForSelector("input[name='form:j_id_jsp_1091681061_3']");
      await page.type("input[name='form:j_id_jsp_1091681061_3']", studentId);

      const button = await page.waitForSelector(
        "input[value='Consultar'][type='submit']"
      );

      if (button) {
        await button.click();
      } else {
        await browser.close();
        return { error: "Button not found", pixCode: "" };
      }

      await this._delay(2000);

      const checkForErrorDiv = async (page: Page, browser: Browser) => {
        const errorDiv = await page.$("div#mensagem-erro");
        if (errorDiv) {
          await browser.close();
          return {
            error:
              "Comportamento Inesperado! O sistema comportou-se de forma inesperada e por isso não foi possível realizar com sucesso a operação selecionada.",
            pixCode: "",
          };
        }
        return null;
      };

      const errorResult = await checkForErrorDiv(page, browser);
      if (errorResult) return errorResult;

      await page.waitForSelector("input[name='form:qtdCreditos']");

      await page.evaluate(() => {
        const input = document.querySelector(
          "input[name='form:qtdCreditos']"
        ) as HTMLInputElement;
        if (input) input.value = "";
      });
      await page.type(
        "input[name='form:qtdCreditos']",
        numberOfTickets.toString()
      );

      await this._delay(2000);

      // Find the radio input by its id and click on it
      const radioInput = await page.waitForSelector(
        'input[type="radio"][id="form:j_id_jsp_540432864_5:0"]'
      );
      if (radioInput) {
        await radioInput.click();
      } else {
        await browser?.close();
        return { error: "Button not found", pixCode: "" };
      }

      const errorResult2 = await checkForErrorDiv(page, browser);
      if (errorResult2) return errorResult2;

      await this._delay(5000);

      const payButton = await page.waitForSelector(
        'input[type="submit"][id="form:btPagTesouro"]'
      );
      if (payButton) {
        await payButton.click();
      } else {
        await browser?.close();
        return { error: "Pay Button not found", pixCode: "" };
      }
      await this._delay(10000);

      const confirmButton = await page.waitForSelector(
        'input[type="submit"][id="modalForm2:btConfirmarPagtesouro"]'
      );

      if (confirmButton) {
        await confirmButton.click();
        await this._delay(2000);
      } else {
        await browser?.close();
        return { error: "Confirmation button not found", pixCode: "" };
      }
      await this._delay(5000);

      const errorResult3 = await checkForErrorDiv(page, browser);
      if (errorResult3) return errorResult3;

      const iframeElement = await page.waitForSelector("iframe.iframe-epag");
      if (iframeElement) {
        const iframeSrc = await page.evaluate(
          (el: HTMLIFrameElement) => el.getAttribute("src"),
          iframeElement
        );

        // Get the iframe's content frame
        const iframeContentFrame = await iframeElement.contentFrame();

        // Extract the HTML from the iframe
        const iframeHtml = await iframeContentFrame.evaluate(() => {
          return document.body.innerHTML;
        });

        const pixAnchor = await iframeContentFrame.$(
          'a.meio-pagamento-a.ml-2.ml-sm-0.mr-0.mr-sm-2.mt-2.mt-sm-0[role="button"]'
        );

        if (pixAnchor) {
          await pixAnchor.click();
        } else {
          await browser?.close();
          return { error: "Pix anchor not found", pixCode: "" };
        }

        await this._delay(2000);

        const pagarButton = await iframeContentFrame.waitForSelector(
          "a#btnPgto.btn.btn-primary.novo-btn-primary"
        );
        if (pagarButton) {
          await pagarButton.click();
          await this._delay(2000);
        } else {
          await browser?.close();
          return { error: "Pagar button not found", pixCode: "" };
        }

        await this._delay(4000);

        const pixPElement = await iframeContentFrame.waitForSelector(
          "p.noselect"
        );
        if (pixPElement) {
          const pixPContent = await iframeContentFrame.evaluate(
            (el: HTMLParagraphElement) => el.textContent,
            pixPElement
          );
          await browser?.close();
          return { pixCode: pixPContent?.trim() || "" };
        }
      }
      await browser.close();
      return { error: "Iframe not found", pixCode: "" };
    } catch (e) {
      await browser?.close();
      return { error: e.message || "Unknown error", pixCode: "" };
    }
  }
}

export default PuppeteerService;
