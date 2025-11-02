class User {
  public handle: string;
  public id: string;
  public profilePicture?: string;

  constructor(handle: string, id: string, profilePicture?: string) {
    this.handle = handle;
    this.id = id;
    this.profilePicture = profilePicture;
  }
}

export default User;
