export interface User {
  id?: string;
  username: string;
  password?: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  address: string;
  phone: string;
  email: string;
  profilePicture?: string;
  creditCard?: string;
  userType: 'tourist' | 'owner' | 'admin';
  isActive?: boolean;
  createdAt?: Date;
}
