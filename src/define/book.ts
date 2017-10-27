export enum BookType{
  MCQ = <any>"MCQ",
  CONV = <any>"CONV"
}


class Voice{
  q: string = "";
  a: string = "";
  exp: string = "";
  tip: string = "";   
}


export class BookReaderCfg{
  display: {
    q: true;
    a: true;
    exp: true;
    tip: true;
  }
  voice: {
    q: true;
    a: true;
    exp: true;
    tip: false;    
  }
  repeat: {
    q: 1;
    a: 1;
    exp: 1;
    tip: number;    
  }
}

export class TagBookInfo{
  title: string;
  author: string;
  author_uid: string;
  author_photoURL: string;
  views: number = 0;
  likes: number = 0;
}

export class BookInfo{
  ver: number = 1;
  title: string = "";  
  type: BookType /*BookType*/;
  qnum: number = 1;
  author: string;
  author_uid: string;
  publish: boolean = false;
  views: number = 0;
  likes: number = 0;

  uid: string = "";
  nalang: string = "";
  talang: string = "en_US";
  tag1: string = "";
  tag2: string = "";
}

export class BookData{
  ver:number = 1;  
  data: any[];
}

//Multiple Choice Questions
export class BookData_MCQ{
  q: string;
  a: string;
  cho: string[];
  exp: string;
  tip: string;
}

//Conversation/Lyric/subtitle
export class BookData_CONV{
  role: string; //role name
  q: string;
}

export class BookSet{
  info: BookInfo;
  readercfg: BookReaderCfg;
  data: BookData;
}
