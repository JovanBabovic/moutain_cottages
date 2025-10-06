export interface RegistrationRequest {
  id?: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  gender: 'M' | 'F';
  address: string;
  phone: string;
  email: string;
  profilePicture?: string;
  creditCard: string;
  userType: 'tourist' | 'owner';
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: Date;
  reviewedAt?: Date;
}
