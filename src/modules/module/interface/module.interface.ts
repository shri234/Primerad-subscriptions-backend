export interface ModuleWithPathologyCount {
  _id: string;
  moduleName: string;
  totalPathologiesCount: number;
  randomPathologyNames: string[];
}

export interface ModuleWithSessionCount extends ModuleWithPathologyCount {
  totalSessionsCount: number;
}

export interface ModuleResponse<T> {
  message: string;
  data: T;
}
