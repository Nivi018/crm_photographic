export interface CategoryArticleCounts {
  active: number;
  inactive: number;
}

export interface CategoryCreateProperties {
  id: string;
  name: string;
}

export interface CategoryProperties extends CategoryCreateProperties {
  isActive: boolean;
}
