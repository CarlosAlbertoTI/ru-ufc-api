import { LocalStorageMealDTO } from "../DTO/Meal"

export interface ILocalStorage {
    getData:() => Promise<LocalStorageMealDTO | undefined>
    setData:(newData:any) => void
}