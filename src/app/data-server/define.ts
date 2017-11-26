
export class DBQuery{
  orderBy: string;
  equalTo?: (number | boolean | string);
  equalToKey?: string;
  startAt?: (number | boolean | string);
  startAtKey?: string;
  endAt?: (number | boolean | string);
  endAtKey?: string;
  limitToFirst?: number;
  limitToLast?: number;
}
