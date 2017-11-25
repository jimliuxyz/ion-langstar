import { VerData } from "./define";

export class UserInfo extends VerData{
  uid: string = "";
  displayName: string = "";
  email: string = "";
  photoURL: string = "";
  localPhotoURL: string = "";
  socialtype: string = "";
  provider: string = "";

  bookcnt: number = 0;
  booklist: string = ""; //book uid list
}

// export class UserInfoModel{
//   dstore:{
//     userinfo: UserInfo;
//   }

//   static getAuthedUser() {
//     let user = new UserInfoModel();
//     user.init();
//     return user;
//   }

//   private init() {
    
//   }

// }
