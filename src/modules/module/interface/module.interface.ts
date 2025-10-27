export interface ModuleWithPathologyCount {
  _id: string;
  moduleName: string;
  totalPathologiesCount: number;
  randomPathologyNames: string[];
}

export interface ModuleWithSessionCount extends ModuleWithPathologyCount {
  totalSessionsCount: number;
}

// src/modules/module/interface/module.interface.ts
export interface ModuleResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

