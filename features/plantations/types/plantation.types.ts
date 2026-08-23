export type PlantationRole = "OWNER" | "MEMBER";

export type Plantation = {
  id: string;
  name: string;
  location: string | null;
  createdAt: string;
  role: PlantationRole;
};

export type CreatePlantationInput = {
  name: string;
  location?: string;
};

export type PlantationsStatus = "idle" | "loading" | "ready" | "error";
