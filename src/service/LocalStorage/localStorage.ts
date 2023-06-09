import lowdb from "lowdb";
import FileSync from "lowdb/adapters/FileSync";

import { ILocalStorage } from "../../interface/ILocalStorage";

import { LocalStorageMealDTO } from "../../DTO/Meal";

const defaultData: LocalStorageMealDTO = {
  time: "",
  lunch: "",
  dinner: "",
  breakfast: "",
};
const adapter = new FileSync<LocalStorageMealDTO>("menu_ru.json");

export class LocalStorage implements ILocalStorage {
  _service: any;

  constructor() {
    this._service = lowdb(adapter)
    this._service.defaults({data:defaultData}).write();
  }
  
  getData() {
    const data = this._service.get("data").value();
    if (data) {
      return data;
    } else {
      return undefined;
    }
  }
  setData(newData: LocalStorageMealDTO) {
    const data = this._service.get("data").assign(newData).write()
  }
}
