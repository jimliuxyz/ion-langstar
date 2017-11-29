import { DataAccess } from '../../data-server';
import { Storage } from '@ionic/storage';
import { Network } from '@ionic-native/network';

export abstract class DataService{
  private static db: DataAccess;

  static init(storage: Storage, network: Network) {
    if (!DataService.db) {
      DataService.db = new DataAccess(storage, network);
    }
  }

  protected db: DataAccess;
  constructor() {
    this.db = DataService.db;
    
    if (!DataService.db) {
      throw new Error("DataService not initialized");
    }
  }

  assert(condition: any, message?: string) {
    if (!condition) {
        throw message || "Assertion failed";
    }
  }

}
