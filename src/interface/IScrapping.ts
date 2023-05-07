export interface responseScrappingServiceMealTicket {name: string,credits: number, error?:any}
export interface responseScrappingMealOfTheDay {lunch:{},breakfast:{},dinner:{}}
export interface IScrapping {
    getMealTicket: (studentId: string, studentRuId:string) => Promise< responseScrappingServiceMealTicket >;
    getMealOfTheDay:() => Promise<responseScrappingMealOfTheDay>;
}