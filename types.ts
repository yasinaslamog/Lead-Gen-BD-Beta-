export interface Lead {
  id: string;
  name: string;
  address: string;
  phone: string;
  website: string;
  rating: number;
  reviews: number;
  status: 'High Intent' | 'Verified' | 'Low Priority';
  audit: 'Website Prospect' | 'Pixel Missing' | 'Clean';
}

export interface LocationData {
  [division: string]: {
    [district: string]: string[]; // Array of Upazilas/Thanas
  };
}