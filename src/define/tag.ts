export const deftags = {

  // "en_us+zh_tw": ["國小", "國中", "高中", "GEPT", "TOEFL", "TOEIC", "IELTS", "Movie", "Song"],
  
  // "en_us+zh_tw2":["國中", "高中"]

};

export class TagList{
  ver: number = 1;
  list: object = {};
}

export class Tag{
  ver: number = 1;
  name: string = "";
  cnt: number = 0;
}


