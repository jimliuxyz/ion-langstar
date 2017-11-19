import { DataAccess } from '../data-server';
import { Storage } from '@ionic/storage';

export abstract class DataService{
  private static db: DataAccess;

  static init(storage: Storage) {
    if (!DataService.db) {
      DataService.db = new DataAccess(storage);
    }
  }


  protected db: DataAccess;
  constructor() {
    this.db = DataService.db;
    
    if (!DataService.db) {
      throw new Error("DataService not initialized");
    }
  }

}
