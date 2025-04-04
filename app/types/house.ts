export interface House {
  name: string;
  points: number;
  color: string;
}

export interface LastInput {
  timestamp: string;
  house: string;
  points: number;
}

export interface TopContributor {
  email: string;
  points: number;
}

export interface HouseData {
  houses: House[];
  lastInputs: LastInput[];
  topContributors: TopContributor[];
  message: string;
} 