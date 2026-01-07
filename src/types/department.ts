
export type IDeparmentFilters = {
//   tourGuides: ITourGuide[];
//   destination: string[];
//   services: string[];
  startDate: Date | null;
  endDate: Date | null;
};


export type IDeparmentItem = {
  id: number;
  farm_id: number;
  code: string;
  name: string;
  manager_user_id: number;
  isDelete: boolean;
  created_at: Date;
  updated_at: Date;
  employeeCount: number;
  manager: {
    id: number;
    username: string;
    full_name: string;
  };
};
