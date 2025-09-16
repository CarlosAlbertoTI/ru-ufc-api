export interface responseScrappingServiceMealTicket {
  name: string;
  credits: number;
  error?: any;
}
export interface responseScrappingMealOfTheDay {
  lunch: {};
  breakfast: {};
  dinner: {};
  error?: any;
}

export interface getTicketsRequest {
  studentId: string;
  studentRuId: string;
}

export interface requestScrappingBuyTickets {
  studentId: string;
  studentRuId: string;
  numberOfTickets: number;
}

export interface responseBuyTickets {
  pixCode: string;
  error?: any;
}

export interface IScrapping {
  getMealTicket: (
    body: getTicketsRequest
  ) => Promise<responseScrappingServiceMealTicket>;

  getMealOfTheDay: (city: number) => Promise<responseScrappingMealOfTheDay>;

  buyTickets: (body: requestScrappingBuyTickets) => Promise<responseBuyTickets>;
}
